-- A person's identity survives registration changes and never depends on their clinic book.
BEGIN;

ALTER TABLE public.patients
  ALTER COLUMN patient_id DROP NOT NULL,
  ADD COLUMN is_registered boolean NOT NULL DEFAULT true,
  ADD COLUMN registered_at timestamptz;
UPDATE public.patients SET registered_at = created_at;
ALTER TABLE public.patients ADD CONSTRAINT patients_registration_requires_id
  CHECK (NOT is_registered OR (patient_id IS NOT NULL AND btrim(patient_id) <> ''));

ALTER TABLE public.patient_records
  ALTER COLUMN patient_id DROP NOT NULL,
  ADD COLUMN patient_uuid uuid REFERENCES public.patients(id);
UPDATE public.patient_records r SET patient_uuid = p.id
  FROM public.patients p WHERE r.patient_id = p.patient_id;
-- NOT NULL deliberately aborts the migration if an existing visit has no matching person.
ALTER TABLE public.patient_records ALTER COLUMN patient_uuid SET NOT NULL;
CREATE INDEX idx_patient_records_patient_uuid ON public.patient_records(patient_uuid);
CREATE INDEX idx_patients_registration ON public.patients(is_registered, patient_name, id);

CREATE FUNCTION public.protect_patient_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.patient_id IS NOT NULL THEN
      RAISE EXCEPTION 'Assigned clinic IDs are permanently reserved. Unregister the patient instead.' USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
  END IF;
  NEW.patient_name := btrim(NEW.patient_name);
  NEW.patient_id := nullif(btrim(NEW.patient_id), '');
  IF NEW.patient_name IS NULL OR NEW.patient_name = '' THEN
    RAISE EXCEPTION 'Patient name is required.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR (OLD.patient_id IS NOT NULL AND NEW.patient_id IS DISTINCT FROM OLD.patient_id) THEN
      RAISE EXCEPTION 'An assigned patient identity cannot be changed.' USING ERRCODE = '23514';
    END IF;
    NEW.registered_at := OLD.registered_at;
  ELSE
    NEW.registered_at := NULL;
  END IF;
  IF (TG_OP = 'INSERT' OR OLD.patient_id IS NULL) AND NEW.patient_id IS NOT NULL THEN
    IF left(NEW.patient_id, 4) = '0000' OR NEW.patient_id !~ ('^[0-9]{4}/' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YY') || '$') THEN
      RAISE EXCEPTION 'Use a clinic ID in NNNN/YY format for the current year.' USING ERRCODE = '23514';
    END IF;
    IF NOT NEW.is_registered THEN
      RAISE EXCEPTION 'Assign a clinic ID by registering the patient.' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF NEW.is_registered AND NEW.registered_at IS NULL THEN NEW.registered_at := now(); END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_patient_identity BEFORE INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.protect_patient_identity();

CREATE FUNCTION public.link_visit_patient()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_patient public.patients%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.patient_uuid IS DISTINCT FROM OLD.patient_uuid THEN
    RAISE EXCEPTION 'A visit cannot be reassigned to another patient.' USING ERRCODE = '23514';
  END IF;
  -- Legacy callers still supply a clinic ID; new callers always supply a UUID.
  IF TG_OP = 'UPDATE' THEN
    -- UPDATE already holds the visit lock. Taking a profile lock here would invert
    -- the profile-sync lock order; its later sync wins if an edit is concurrent.
    SELECT * INTO v_patient FROM public.patients WHERE id = NEW.patient_uuid;
  ELSIF NEW.patient_uuid IS NULL THEN
    SELECT * INTO v_patient FROM public.patients WHERE patient_id = NEW.patient_id FOR SHARE;
  ELSE
    SELECT * INTO v_patient FROM public.patients WHERE id = NEW.patient_uuid FOR SHARE;
  END IF;
  IF v_patient.id IS NULL THEN RAISE EXCEPTION 'Patient was not found.' USING ERRCODE = '23503'; END IF;
  NEW.patient_uuid := v_patient.id;
  NEW.patient_id := v_patient.patient_id;
  NEW.patient_name := v_patient.patient_name;
  NEW.address := v_patient.address;
  IF TG_OP = 'UPDATE' AND NEW.category = 'CASE' AND NEW.total_cost IS DISTINCT FROM OLD.total_cost THEN
    SELECT coalesce(sum(paid_amount), 0) INTO NEW.paid FROM public.case_payments WHERE record_id = NEW.id;
    IF NEW.total_cost < NEW.paid THEN
      RAISE EXCEPTION 'Total cost cannot be less than the amount already paid.' USING ERRCODE = '23514';
    END IF;
    NEW.remaining := NEW.total_cost - NEW.paid;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER link_visit_patient BEFORE INSERT OR UPDATE ON public.patient_records
  FOR EACH ROW EXECUTE FUNCTION public.link_visit_patient();

-- A profile update and its display copies must commit together, including older months.
CREATE FUNCTION public.sync_patient_visit_identity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.patient_records SET patient_name = NEW.patient_name, address = NEW.address, patient_id = NEW.patient_id
    WHERE patient_uuid = NEW.id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_patient_visit_identity AFTER UPDATE OF patient_name, address, patient_id ON public.patients
  FOR EACH ROW WHEN (OLD.patient_name IS DISTINCT FROM NEW.patient_name OR OLD.address IS DISTINCT FROM NEW.address
    OR OLD.patient_id IS DISTINCT FROM NEW.patient_id)
  EXECUTE FUNCTION public.sync_patient_visit_identity();

CREATE FUNCTION public.search_patients(
  p_query text DEFAULT '', p_address text DEFAULT '', p_age integer DEFAULT NULL,
  p_gender text DEFAULT NULL, p_registered boolean DEFAULT NULL,
  p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_exact_name text DEFAULT NULL,
  p_sort_desc boolean DEFAULT false
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH matches AS (
    SELECT p.* FROM public.patients p
    WHERE (coalesce(btrim(p_query), '') = '' OR strpos(lower(p.patient_name), lower(btrim(p_query))) > 0
      OR strpos(lower(coalesce(p.patient_id, '')), lower(btrim(p_query))) > 0)
      AND (coalesce(btrim(p_address), '') = '' OR strpos(lower(coalesce(p.address, '')), lower(btrim(p_address))) > 0)
      AND (p_age IS NULL OR p.age = p_age)
      AND (p_gender IS NULL OR p.gender::text = p_gender)
      AND (p_registered IS NULL OR p.is_registered = p_registered)
      AND (p_exact_name IS NULL OR lower(regexp_replace(btrim(p.patient_name), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(p_exact_name), '\s+', ' ', 'g')))
  ), page_rows AS (
    SELECT * FROM matches ORDER BY
      CASE WHEN p_sort_desc THEN patient_id END DESC NULLS LAST,
      CASE WHEN NOT p_sort_desc THEN patient_id END ASC NULLS LAST, lower(patient_name), id
      LIMIT least(greatest(coalesce(p_page_size, 10), 1), 100)
      OFFSET (greatest(coalesce(p_page, 1), 1) - 1)::bigint * least(greatest(coalesce(p_page_size, 10), 1), 100)
  )
  SELECT jsonb_build_object('patients', coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM page_rows r), '[]'::jsonb),
    'total', (SELECT count(*) FROM matches));
$$;

CREATE FUNCTION public.set_patient_registration(p_patient_uuid uuid, p_registered boolean, p_patient_id text DEFAULT NULL,
  p_updates jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_patient public.patients%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR coalesce(public.get_user_role(), '') NOT IN ('ADMIN', 'ASSISTANT') THEN
    RAISE EXCEPTION 'You do not have permission to change registration.' USING ERRCODE = '42501';
  END IF;
  IF p_registered IS NULL OR p_updates IS NULL OR jsonb_typeof(p_updates) <> 'object' THEN
    RAISE EXCEPTION 'Registration status and patient details are required.' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_patient FROM public.patients WHERE id = p_patient_uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Patient was not found.' USING ERRCODE = '23503'; END IF;
  IF v_patient.patient_id IS NOT NULL AND nullif(btrim(p_patient_id), '') IS NOT NULL
     AND v_patient.patient_id <> btrim(p_patient_id) THEN
    RAISE EXCEPTION 'Reuse the previously assigned clinic ID.' USING ERRCODE = '23514';
  END IF;
  UPDATE public.patients SET
    patient_id = coalesce(v_patient.patient_id, CASE WHEN p_registered THEN nullif(btrim(p_patient_id), '') END),
    is_registered = p_registered,
    patient_name = CASE WHEN p_updates ? 'patient_name' THEN p_updates->>'patient_name' ELSE patient_name END,
    age = CASE WHEN p_updates ? 'age' THEN (p_updates->>'age')::smallint ELSE age END,
    gender = CASE WHEN p_updates ? 'gender' THEN (p_updates->>'gender')::public.gender ELSE gender END,
    address = CASE WHEN p_updates ? 'address' THEN nullif(btrim(p_updates->>'address'), '') ELSE address END,
    drug_allergy = CASE WHEN p_updates ? 'drug_allergy' THEN nullif(btrim(p_updates->>'drug_allergy'), '') ELSE drug_allergy END,
    past_dental_history = CASE WHEN p_updates ? 'past_dental_history' THEN nullif(btrim(p_updates->>'past_dental_history'), '') ELSE past_dental_history END,
    current_medications = CASE WHEN p_updates ? 'current_medications' THEN ARRAY(SELECT jsonb_array_elements_text(p_updates->'current_medications')) ELSE current_medications END,
    past_medical_history = CASE WHEN p_updates ? 'past_medical_history' THEN ARRAY(SELECT jsonb_array_elements_text(p_updates->'past_medical_history')) ELSE past_medical_history END
    WHERE id = p_patient_uuid RETURNING * INTO v_patient;
  RETURN to_jsonb(v_patient);
END;
$$;

CREATE FUNCTION public.save_patient_record(p_submission_id uuid, p_patient jsonb, p_record jsonb,
  p_initial_payment integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_submission public.record_save_submissions%ROWTYPE;
  v_patient public.patients%ROWTYPE;
  v_cycle public.monthly_cycles%ROWTYPE;
  v_record public.patient_records%ROWTYPE;
  v_payment jsonb := NULL;
  v_date date;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL OR coalesce(public.get_user_role(), '') NOT IN ('ADMIN', 'ASSISTANT') THEN
    RAISE EXCEPTION 'You do not have permission to create records.' USING ERRCODE = '42501';
  END IF;
  IF p_submission_id IS NULL OR p_patient IS NULL OR jsonb_typeof(p_patient) <> 'object'
    OR p_record IS NULL OR jsonb_typeof(p_record) <> 'object' OR p_initial_payment IS NULL THEN
    RAISE EXCEPTION 'A submission, patient, treatment, and payment are required.' USING ERRCODE = '22023';
  END IF;
  v_request := jsonb_build_object('version', 2, 'patient', p_patient, 'record', p_record, 'initial_payment', p_initial_payment);
  INSERT INTO public.record_save_submissions(id, user_id, request) VALUES(p_submission_id, v_user_id, v_request)
    ON CONFLICT(id) DO NOTHING;
  SELECT * INTO STRICT v_submission FROM public.record_save_submissions WHERE id = p_submission_id FOR UPDATE;
  IF v_submission.user_id <> v_user_id THEN
    RAISE EXCEPTION 'This submission belongs to another user.' USING ERRCODE = '42501';
  END IF;
  IF v_submission.request <> v_request THEN
    RAISE EXCEPTION 'This save already used different values. Retry the original values, then edit the saved record.' USING ERRCODE = '22023';
  END IF;
  IF v_submission.result IS NOT NULL THEN RETURN v_submission.result; END IF;

  IF coalesce(p_record->>'entry_date', '') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Enter a valid record date.' USING ERRCODE = '22023';
  END IF;
  v_date := (p_record->>'entry_date')::date;
  IF v_date > (now() AT TIME ZONE 'Asia/Bangkok')::date THEN
    RAISE EXCEPTION 'Record date cannot be in the future.' USING ERRCODE = '22023';
  END IF;
  IF coalesce(p_record->>'category', '') NOT IN ('GP', 'CASE') OR (p_record->>'total_cost') IS NULL
    OR (p_record->>'total_cost')::integer <= 0 OR nullif(btrim(p_record->>'diagnosis'), '') IS NULL
    OR p_initial_payment < 0 OR p_initial_payment > (p_record->>'total_cost')::integer
    OR (p_record->>'category' = 'GP' AND p_initial_payment <> 0)
    OR (p_record->>'category' = 'CASE' AND (nullif(btrim(p_record->>'case_type'), '') IS NULL
      OR nullif(btrim(p_record->>'lab_name'), '') IS NULL)) THEN
    RAISE EXCEPTION 'Check the treatment, cost, and payment details.' USING ERRCODE = '22023';
  END IF;
  IF p_patient ? 'existing_patient_uuid' AND NOT p_patient ? 'new_patient' THEN
    SELECT * INTO v_patient FROM public.patients WHERE id = (p_patient->>'existing_patient_uuid')::uuid FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Patient was not found. Search again.' USING ERRCODE = '23503'; END IF;
  ELSIF p_patient ? 'new_patient' AND NOT p_patient ? 'existing_patient_uuid'
    AND jsonb_typeof(p_patient->'new_patient') = 'object' THEN
    INSERT INTO public.patients(patient_id, is_registered, patient_name, age, gender, address,
      drug_allergy, past_dental_history, current_medications, past_medical_history)
    VALUES(NULL, false, p_patient->'new_patient'->>'patient_name', (p_patient->'new_patient'->>'age')::smallint,
      (p_patient->'new_patient'->>'gender')::public.gender, nullif(btrim(p_patient->'new_patient'->>'address'), ''),
      nullif(btrim(p_patient->'new_patient'->>'drug_allergy'), ''), nullif(btrim(p_patient->'new_patient'->>'past_dental_history'), ''),
      ARRAY(SELECT jsonb_array_elements_text(p_patient->'new_patient'->'current_medications')),
      ARRAY(SELECT jsonb_array_elements_text(p_patient->'new_patient'->'past_medical_history')))
    RETURNING * INTO v_patient;
  ELSE
    RAISE EXCEPTION 'Select one existing patient or enter one new patient.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.monthly_cycles(month_year) VALUES(to_char(v_date, 'YYYY-MM')) ON CONFLICT(month_year) DO NOTHING;
  SELECT * INTO STRICT v_cycle FROM public.monthly_cycles WHERE month_year = to_char(v_date, 'YYYY-MM');
  INSERT INTO public.patient_records(cycle_id, patient_uuid, entry_date, category, diagnosis, total_cost, month_label,
    lab_name, lab_send_date, delivery_date, case_type, teeth, paid, remaining, is_carried_forward)
  VALUES(v_cycle.id, v_patient.id, v_date, (p_record->>'category')::public.record_category, btrim(p_record->>'diagnosis'),
    (p_record->>'total_cost')::integer, to_char(v_date, 'Mon YYYY'), nullif(btrim(p_record->>'lab_name'), ''),
    nullif(p_record->>'lab_send_date', '')::date, nullif(p_record->>'delivery_date', '')::date,
    nullif(btrim(p_record->>'case_type'), ''), nullif(btrim(p_record->>'teeth'), ''),
    CASE WHEN p_record->>'category' = 'CASE' THEN p_initial_payment ELSE 0 END,
    CASE WHEN p_record->>'category' = 'CASE' THEN (p_record->>'total_cost')::integer - p_initial_payment ELSE 0 END, false)
  RETURNING * INTO v_record;
  IF v_record.category = 'CASE' AND p_initial_payment > 0 THEN
    INSERT INTO public.case_payments(record_id, payment_date, paid_amount, payment_note, payment_status)
    VALUES(v_record.id, v_date, p_initial_payment, 'Initial payment', 'COMPLETED')
    RETURNING to_jsonb(case_payments.*) INTO v_payment;
  END IF;
  v_result := jsonb_build_object('patient', to_jsonb(v_patient),
    'record', to_jsonb(v_record) - 'lab_fee' - 'lab_payment_status', 'cycle', to_jsonb(v_cycle), 'payment', v_payment);
  UPDATE public.record_save_submissions SET result = v_result WHERE id = p_submission_id;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_patient_identity(), public.link_visit_patient(), public.sync_patient_visit_identity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_patients(text,text,integer,text,boolean,integer,integer,text,boolean),
  public.set_patient_registration(uuid,boolean,text,jsonb), public.save_patient_record(uuid,jsonb,jsonb,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_patients(text,text,integer,text,boolean,integer,integer,text,boolean),
  public.set_patient_registration(uuid,boolean,text,jsonb), public.save_patient_record(uuid,jsonb,jsonb,integer) TO authenticated;

COMMENT ON COLUMN public.patients.patient_id IS 'Optional clinic-book ID; unique and permanently reserved once assigned.';
COMMENT ON COLUMN public.patient_records.patient_uuid IS 'Permanent person identity, independent of clinic registration.';
NOTIFY pgrst, 'reload schema';
COMMIT;
