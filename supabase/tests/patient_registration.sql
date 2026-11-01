-- Run manually on a disposable local/staging database after all migrations; fixtures roll back.
BEGIN;
INSERT INTO auth.users(id, email, raw_user_meta_data)
VALUES('d1100000-0000-4000-8000-000000000001', 'patient-registration@example.invalid', '{"username":"patient_registration_test"}');
UPDATE public.profiles SET role = 'ASSISTANT' WHERE id = 'd1100000-0000-4000-8000-000000000001';
SELECT set_config('request.jwt.claim.sub', 'd1100000-0000-4000-8000-000000000001', true);

CREATE FUNCTION public.registration_test_payment_failure() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.patient_records WHERE id = NEW.record_id AND diagnosis = 'registration-rollback') THEN
    RAISE EXCEPTION 'Injected receipt failure';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER registration_test_payment_failure BEFORE INSERT ON public.case_payments
  FOR EACH ROW EXECUTE FUNCTION public.registration_test_payment_failure();

DO $$
DECLARE
  v_source jsonb := '{"new_patient":{"patient_name":"Registration fixture","age":40,"gender":"FEMALE","address":"North Village","current_medications":[],"past_medical_history":[]}}';
  v_treatment jsonb := '{"category":"CASE","entry_date":"1801-02-01","diagnosis":"Crown","case_type":"Crown","lab_name":"Test Lab","total_cost":75000}';
  v_submission uuid := gen_random_uuid();
  v_result jsonb;
  v_patient uuid;
  v_visit uuid;
  v_id text := '9743/' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YY');
  v_count bigint;
  v_failed boolean := false;
BEGIN
  BEGIN
    PERFORM public.save_patient_record(v_submission, v_source, v_treatment || '{"diagnosis":"registration-rollback"}', 20000);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Injected receipt failure' THEN RAISE; END IF;
    v_failed := true;
  END;
  IF NOT v_failed OR EXISTS(SELECT 1 FROM public.patients WHERE patient_name = 'Registration fixture')
    OR EXISTS(SELECT 1 FROM public.record_save_submissions WHERE id = v_submission)
    OR EXISTS(SELECT 1 FROM public.monthly_cycles WHERE month_year = '1801-02') THEN
    RAISE EXCEPTION 'Failed save left partial patient/cycle/submission data';
  END IF;
  v_result := public.save_patient_record(v_submission, v_source, v_treatment, 20000);
  v_patient := (v_result->'patient'->>'id')::uuid;
  v_visit := (v_result->'record'->>'id')::uuid;
  IF v_result <> public.save_patient_record(v_submission, v_source, v_treatment, 20000)
    OR (SELECT count(*) FROM public.patients WHERE id = v_patient) <> 1
    OR (SELECT count(*) FROM public.patient_records WHERE patient_uuid = v_patient) <> 1
    OR (SELECT count(*) FROM public.case_payments WHERE record_id = v_visit) <> 1 THEN
    RAISE EXCEPTION 'Identical retry duplicated patient/visit/receipt';
  END IF;
  IF (v_result->'patient'->>'is_registered')::boolean OR v_result->'patient'->>'patient_id' IS NOT NULL
    OR v_result->'record' ? 'lab_fee' OR v_result ? 'financials' THEN
    RAISE EXCEPTION 'Unexpected registration or financial response';
  END IF;
  BEGIN
    PERFORM public.save_patient_record(v_submission, v_source, v_treatment, 30000);
    RAISE EXCEPTION 'Changed submission was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  PERFORM public.set_patient_registration(v_patient, true, v_id);
  IF NOT (SELECT is_registered FROM public.patients WHERE id = v_patient)
    OR (SELECT patient_id FROM public.patient_records WHERE id = v_visit) <> v_id THEN
    RAISE EXCEPTION 'Registration did not preserve and update the visit';
  END IF;
  PERFORM public.set_patient_registration(v_patient, false);
  IF (SELECT patient_id FROM public.patients WHERE id = v_patient) <> v_id
    OR (SELECT is_registered FROM public.patients WHERE id = v_patient) THEN
    RAISE EXCEPTION 'Unregister did not reserve the clinic ID';
  END IF;
  BEGIN
    UPDATE public.patients SET patient_id = NULL WHERE id = v_patient;
    RAISE EXCEPTION 'Reserved clinic ID was cleared';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.patients(patient_name, patient_id, age, gender) VALUES('Different person', v_id, 30, 'MALE');
    RAISE EXCEPTION 'Reserved clinic ID was reused';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  PERFORM public.set_patient_registration(v_patient, true);
  UPDATE public.patients SET patient_name = 'Updated fixture', address = 'South Village' WHERE id = v_patient;
  IF (SELECT address FROM public.patient_records WHERE id = v_visit) <> 'South Village' THEN
    RAISE EXCEPTION 'Profile updates did not synchronize visit display data';
  END IF;
  SELECT (public.search_patients('UPDATED', 'south', 40, 'FEMALE', true)->>'total')::bigint INTO v_count;
  IF v_count <> 1 THEN RAISE EXCEPTION 'Combined patient search failed'; END IF;
  PERFORM public.save_patient_record(gen_random_uuid(), jsonb_build_object('existing_patient_uuid', v_patient),
    '{"category":"GP","entry_date":"1801-02-02","diagnosis":"Scaling","total_cost":5000}', 0);
  IF (SELECT count(*) FROM public.patient_records WHERE patient_uuid = v_patient) <> 2 THEN
    RAISE EXCEPTION 'Returning visit did not reuse the profile';
  END IF;
  BEGIN
    UPDATE public.patient_records SET total_cost = 10000 WHERE id = v_visit;
    RAISE EXCEPTION 'Case cost below receipts was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$$;

-- Exercise the actual browser role so RLS and invocation grants participate.
SET LOCAL ROLE authenticated;
SELECT public.save_patient_record(gen_random_uuid(),
  '{"new_patient":{"patient_name":"Browser role fixture","age":25,"gender":"OTHER"}}',
  '{"category":"GP","entry_date":"1801-02-03","diagnosis":"Checkup","total_cost":5000}', 0);
RESET ROLE;
UPDATE public.profiles SET role = 'SUPERVISOR' WHERE id = 'd1100000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.save_patient_record(gen_random_uuid(), '{"new_patient":{"patient_name":"Forbidden","age":20,"gender":"MALE"}}',
      '{"category":"GP","entry_date":"1801-02-01","diagnosis":"Checkup","total_cost":5000}', 0);
    RAISE EXCEPTION 'Supervisor write was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.set_patient_registration(gen_random_uuid(), true, '1234/26');
    RAISE EXCEPTION 'Supervisor registration was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
RESET ROLE;
ROLLBACK;
