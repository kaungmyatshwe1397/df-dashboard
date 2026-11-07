-- Run manually only on a disposable staging database after the standalone GP migration; all fixtures roll back.
BEGIN;
INSERT INTO auth.users(id, email, raw_user_meta_data)
VALUES('d1700000-0000-4000-8000-000000000001', 'standalone-gp@example.invalid', '{"username":"standalone_gp_test"}');
UPDATE public.profiles SET role = 'ASSISTANT' WHERE id = 'd1700000-0000-4000-8000-000000000001';
SELECT set_config('request.jwt.claim.sub', 'd1700000-0000-4000-8000-000000000001', true);

DO $$
DECLARE
  v_details jsonb := '{"patient_name":"Standalone GP fixture","age":40,"gender":"FEMALE","address":"North Village","telephone":"+95 9 123456"}';
  v_treatment jsonb := '{"category":"GP","entry_date":"1803-02-01","diagnosis":"Scaling","total_cost":5000}';
  v_submission uuid := gen_random_uuid();
  v_result jsonb;
  v_visit uuid;
  v_patient_count bigint := (SELECT count(*) FROM public.patients);
  v_payment_count bigint := (SELECT count(*) FROM public.case_payments);
BEGIN
  v_result := public.save_gp_record(v_submission, v_details, v_treatment);
  v_visit := (v_result->'record'->>'id')::uuid;
  IF v_result <> public.save_gp_record(v_submission, v_details, v_treatment)
    OR (SELECT count(*) FROM public.patient_records WHERE id = v_visit) <> 1
    OR (SELECT patient_uuid FROM public.patient_records WHERE id = v_visit) IS NOT NULL
    OR v_result->'record'->>'telephone' IS DISTINCT FROM '+95 9 123456'
    OR (SELECT count(*) FROM public.patients) <> v_patient_count
    OR (SELECT count(*) FROM public.case_payments) <> v_payment_count
    OR v_result->'record' ? 'lab_fee' OR v_result ? 'patient' OR v_result ? 'financials' THEN
    RAISE EXCEPTION 'Standalone GP save created registry data, duplicate visits, receipts, or financial output';
  END IF;
  BEGIN
    PERFORM public.save_gp_record(v_submission, v_details, v_treatment || '{"total_cost":6000}');
    RAISE EXCEPTION 'Changed retry was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  UPDATE public.patient_records SET patient_name = 'Corrected visit name', age = 41 WHERE id = v_visit;
  IF (SELECT patient_name FROM public.patient_records WHERE id = v_visit) <> 'Corrected visit name' THEN
    RAISE EXCEPTION 'Standalone visit edit failed';
  END IF;
  BEGIN
    PERFORM public.save_gp_record(gen_random_uuid(), v_details || '{"age":121}', v_treatment);
    RAISE EXCEPTION 'Invalid age was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_gp_record(gen_random_uuid(), v_details, v_treatment || '{"category":"CASE"}');
    RAISE EXCEPTION 'Standalone Case was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_gp_record(gen_random_uuid(), v_details, v_treatment || '{"total_cost":0}');
    RAISE EXCEPTION 'Zero cost was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    UPDATE public.patient_records SET category = 'CASE' WHERE id = v_visit;
    RAISE EXCEPTION 'Standalone GP changed to unlinked Case';
  EXCEPTION WHEN foreign_key_violation OR check_violation THEN NULL;
  END;
END;
$$;

UPDATE public.profiles SET role = 'SUPERVISOR' WHERE id = 'd1700000-0000-4000-8000-000000000001';
DO $$
BEGIN
  BEGIN
    PERFORM public.save_gp_record(gen_random_uuid(), '{}', '{}');
    RAISE EXCEPTION 'Supervisor saved GP';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
ROLLBACK;
