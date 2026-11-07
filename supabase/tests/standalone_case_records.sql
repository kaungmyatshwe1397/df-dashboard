-- Run only on disposable staging after all migrations; fixtures, test trigger, and writes roll back.
BEGIN;
INSERT INTO auth.users(id, email, raw_user_meta_data)
VALUES('d1800000-0000-4000-8000-000000000001', 'standalone-case@example.invalid', '{"username":"standalone_case_test"}');
UPDATE public.profiles SET role = 'ASSISTANT' WHERE id = 'd1800000-0000-4000-8000-000000000001';
SELECT set_config('request.jwt.claim.sub', 'd1800000-0000-4000-8000-000000000001', true);

CREATE FUNCTION public.case_test_receipt_failure() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.patient_records WHERE id = NEW.record_id AND diagnosis = 'case-rollback') THEN
    RAISE EXCEPTION 'Injected Case receipt failure';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER case_test_receipt_failure BEFORE INSERT ON public.case_payments
  FOR EACH ROW EXECUTE FUNCTION public.case_test_receipt_failure();

DO $$
DECLARE
  v_details jsonb := '{"patient_name":"Standalone Case fixture","age":30,"gender":"FEMALE","telephone":"09 123456"}';
  v_treatment jsonb := '{"category":"CASE","entry_date":"1807-03-01","diagnosis":"Crown","case_type":"Crown","total_cost":100000}';
  v_submission uuid := gen_random_uuid();
  v_failed_submission uuid := gen_random_uuid();
  v_result jsonb;
  v_visit uuid;
  v_patient_count bigint := (SELECT count(*) FROM public.patients);
  v_failed boolean := false;
BEGIN
  BEGIN
    PERFORM public.save_case_record(v_failed_submission, v_details, v_treatment || '{"diagnosis":"case-rollback"}', 25000);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Injected Case receipt failure' THEN RAISE; END IF;
    v_failed := true;
  END;
  IF NOT v_failed OR EXISTS(SELECT 1 FROM public.record_save_submissions WHERE id = v_failed_submission)
    OR EXISTS(SELECT 1 FROM public.monthly_cycles WHERE month_year = '1807-03') THEN
    RAISE EXCEPTION 'Failed Case receipt left a partial save';
  END IF;

  v_result := public.save_case_record(v_submission, v_details, v_treatment, 25000);
  v_visit := (v_result->'record'->>'id')::uuid;
  IF v_result <> public.save_case_record(v_submission, v_details, v_treatment, 25000)
    OR (SELECT count(*) FROM public.case_payments WHERE record_id = v_visit) <> 1
    OR (SELECT count(*) FROM public.patients) <> v_patient_count
    OR v_result->'record'->>'patient_uuid' IS NOT NULL
    OR v_result->'record'->>'lab_name' IS NOT NULL
    OR (v_result->'record'->>'remaining')::integer <> 75000
    OR (v_result->'payment'->>'paid_amount')::integer <> 25000
    OR v_result->'record' ? 'lab_fee' OR v_result ? 'financials' THEN
    RAISE EXCEPTION 'Standalone Case save duplicated or returned invalid data';
  END IF;
  BEGIN
    PERFORM public.save_case_record(v_submission, v_details, v_treatment, 30000);
    RAISE EXCEPTION 'Changed Case retry was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.save_case_record(gen_random_uuid(), v_details, v_treatment, 100001);
    RAISE EXCEPTION 'Overpayment was accepted';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    UPDATE public.patient_records SET total_cost = 24000 WHERE id = v_visit;
    RAISE EXCEPTION 'Cost below receipts was accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  UPDATE public.patient_records SET lab_name = 'Assigned later', lab_send_date = '1807-03-02' WHERE id = v_visit;
  UPDATE public.patient_records SET lab_name = NULL, lab_send_date = NULL WHERE id = v_visit;
  IF (SELECT lab_name FROM public.patient_records WHERE id = v_visit) IS NOT NULL THEN
    RAISE EXCEPTION 'Optional lab could not be cleared';
  END IF;
  v_result := public.save_case_record(gen_random_uuid(), v_details, v_treatment, 0);
  IF v_result->'payment' <> 'null'::jsonb OR (v_result->'record'->>'remaining')::integer <> 100000 THEN
    RAISE EXCEPTION 'Zero payment created an invalid receipt or balance';
  END IF;
  IF has_function_privilege('anon', 'public.save_case_record(uuid,jsonb,jsonb,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous Case execution is permitted';
  END IF;
END;
$$;
UPDATE public.profiles SET role = 'SUPERVISOR' WHERE id = 'd1800000-0000-4000-8000-000000000001';
DO $$
BEGIN
  BEGIN
    PERFORM public.save_case_record(gen_random_uuid(), '{}', '{}', 0);
    RAISE EXCEPTION 'Supervisor saved a Case';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
ROLLBACK;
