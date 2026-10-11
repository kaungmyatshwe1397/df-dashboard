-- Run against a local/staging database after migrations; every fixture is rolled back.
BEGIN;

INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('c1a10000-0000-4000-8000-000000000001', 'atomic-save-test-1@example.invalid', '{"username":"atomic_save_test_1"}'),
  ('c1a10000-0000-4000-8000-000000000002', 'atomic-save-test-2@example.invalid', '{"username":"atomic_save_test_2"}');
INSERT INTO public.patients (patient_id, patient_name, age, gender)
  VALUES ('9876/00', 'Atomic save fixture', 30, 'FEMALE');
SELECT set_config('request.jwt.claim.sub', 'c1a10000-0000-4000-8000-000000000001', true);

-- Force failure at the final write to prove the preceding cycle, visit, and ledger roll back.
CREATE FUNCTION public.atomic_save_test_reject_payment() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.patient_records WHERE id = NEW.record_id AND diagnosis = 'atomic-rollback-fixture') THEN
    RAISE EXCEPTION 'Injected payment failure.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER atomic_save_test_reject_payment BEFORE INSERT ON public.case_payments
  FOR EACH ROW EXECUTE FUNCTION public.atomic_save_test_reject_payment();

DO $$
DECLARE
  v_id uuid := 'c1a20000-0000-4000-8000-000000000001';
  v_record jsonb := '{"category":"CASE","entry_date":"1800-02-07","diagnosis":"Crown","total_cost":75000}';
  v_first jsonb;
  v_retry jsonb;
  v_visit uuid;
  v_failed boolean := false;
BEGIN
  IF has_table_privilege('authenticated', 'public.record_save_submissions', 'INSERT')
     OR has_table_privilege('authenticated', 'public.record_save_submissions', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.record_save_submissions', 'SELECT')
     OR has_function_privilege('anon', 'public.save_registered_record(uuid,text,jsonb,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Submission ledger or RPC permissions are too broad.';
  END IF;

  BEGIN
    PERFORM public.save_registered_record(v_id, '9876/00', v_record || '{"diagnosis":"atomic-rollback-fixture"}', 20000);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Injected payment failure.' THEN RAISE; END IF;
    v_failed := true;
  END;
  IF NOT v_failed OR EXISTS (SELECT 1 FROM public.record_save_submissions WHERE id = v_id)
     OR EXISTS (SELECT 1 FROM public.patient_records WHERE patient_id = '9876/00')
     OR EXISTS (SELECT 1 FROM public.monthly_cycles WHERE month_year = '1800-02') THEN
    RAISE EXCEPTION 'Atomic rollback failed.';
  END IF;

  v_first := public.save_registered_record(v_id, '9876/00', v_record, 20000);
  v_retry := public.save_registered_record(v_id, '9876/00', v_record, 20000);
  v_visit := (v_first->'record'->>'id')::uuid;
  IF v_first <> v_retry OR (SELECT count(*) FROM public.patient_records WHERE patient_id = '9876/00') <> 1
     OR (SELECT count(*) FROM public.case_payments WHERE record_id = v_visit) <> 1
     OR (SELECT sum(paid_amount) FROM public.case_payments WHERE record_id = v_visit) <> 20000 THEN
    RAISE EXCEPTION 'Identical retry duplicated or changed the save.';
  END IF;

  BEGIN
    PERFORM public.save_registered_record(v_id, '9876/00', v_record, 30000);
    RAISE EXCEPTION 'Changed payload was accepted.';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  PERFORM set_config('request.jwt.claim.sub', 'c1a10000-0000-4000-8000-000000000002', true);
  BEGIN
    PERFORM public.save_registered_record(v_id, '9876/00', v_record, 20000);
    RAISE EXCEPTION 'Cross-user replay was accepted.';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.profiles SET role = 'SUPERVISOR' WHERE id = 'c1a10000-0000-4000-8000-000000000002';
  BEGIN
    PERFORM public.save_registered_record(gen_random_uuid(), '9876/00', v_record, 20000);
    RAISE EXCEPTION 'Supervisor save was accepted.';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  BEGIN
    PERFORM public.save_registered_record(gen_random_uuid(), '9876/00', v_record, 20000);
    RAISE EXCEPTION 'Unauthenticated save was accepted.';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;

-- Exercise the real browser database role, rather than only the privileged fixture runner.
SELECT set_config('request.jwt.claim.sub', 'c1a10000-0000-4000-8000-000000000001', true);
SET LOCAL ROLE authenticated;
SELECT public.save_registered_record(
  'c1a20000-0000-4000-8000-000000000002', '9876/00',
  '{"category":"GP","entry_date":"1800-02-07","diagnosis":"Checkup","total_cost":75000}', 0
);
RESET ROLE;

ROLLBACK;
