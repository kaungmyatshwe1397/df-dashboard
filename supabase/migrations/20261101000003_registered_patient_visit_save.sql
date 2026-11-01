-- A clinic ID entered during visit entry registers the person in the same retry-protected transaction.
BEGIN;

CREATE OR REPLACE FUNCTION public.save_patient_record(p_submission_id uuid, p_patient jsonb, p_record jsonb,
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
    IF nullif(btrim(p_patient->>'register_patient_id'), '') IS NOT NULL AND v_patient.patient_id IS NOT NULL
      AND v_patient.patient_id <> btrim(p_patient->>'register_patient_id') THEN
      RAISE EXCEPTION 'This patient already has another clinic ID.' USING ERRCODE = '22023';
    END IF;
    IF (coalesce((p_patient->>'register_existing')::boolean, false)
      OR nullif(btrim(p_patient->>'register_patient_id'), '') IS NOT NULL)
      AND (NOT v_patient.is_registered OR v_patient.patient_id IS NULL) THEN
      UPDATE public.patients SET patient_id = coalesce(patient_id, nullif(btrim(p_patient->>'register_patient_id'), '')),
        is_registered = true WHERE id = v_patient.id RETURNING * INTO v_patient;
    END IF;
  ELSIF p_patient ? 'new_patient' AND NOT p_patient ? 'existing_patient_uuid'
    AND jsonb_typeof(p_patient->'new_patient') = 'object' THEN
    INSERT INTO public.patients(patient_id, is_registered, patient_name, age, gender, address,
      drug_allergy, past_dental_history, current_medications, past_medical_history)
    VALUES(nullif(btrim(p_patient->'new_patient'->>'patient_id'), ''),
      nullif(btrim(p_patient->'new_patient'->>'patient_id'), '') IS NOT NULL, p_patient->'new_patient'->>'patient_name', (p_patient->'new_patient'->>'age')::smallint,
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

NOTIFY pgrst, 'reload schema';
COMMIT;
