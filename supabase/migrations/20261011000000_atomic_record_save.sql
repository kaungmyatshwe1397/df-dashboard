-- A retry must recover the original transaction even when its commit response was lost.
CREATE TABLE public.record_save_submissions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request jsonb NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only the checked RPC accesses the ledger; clients cannot forge committed results.
ALTER TABLE public.record_save_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.record_save_submissions FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.save_registered_record(
  p_submission_id uuid,
  p_patient_id text,
  p_record jsonb,
  p_initial_payment integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_submission public.record_save_submissions%ROWTYPE;
  v_date date;
  v_month text;
  v_cycle public.monthly_cycles%ROWTYPE;
  v_record jsonb;
  v_payment jsonb := NULL;
  v_result jsonb;
BEGIN
  -- Definer access is limited to the same roles permitted to create records and payments.
  IF v_user_id IS NULL OR COALESCE(public.get_user_role(), '') NOT IN ('ADMIN', 'ASSISTANT') THEN
    RAISE EXCEPTION 'You do not have permission to create records.' USING ERRCODE = '42501';
  END IF;
  IF p_submission_id IS NULL OR p_patient_id IS NULL OR p_record IS NULL
     OR jsonb_typeof(p_record) <> 'object' OR p_initial_payment IS NULL THEN
    RAISE EXCEPTION 'A submission ID, patient, record, and payment amount are required.' USING ERRCODE = '22023';
  END IF;
  v_request := jsonb_build_object('patient_id', btrim(p_patient_id), 'record', p_record, 'initial_payment', p_initial_payment);

  INSERT INTO public.record_save_submissions (id, user_id, request)
    VALUES (p_submission_id, v_user_id, v_request)
    ON CONFLICT (id) DO NOTHING;
  -- The conflicting insert waits for commit; this lock also serializes simultaneous retries.
  SELECT * INTO STRICT v_submission FROM public.record_save_submissions
    WHERE id = p_submission_id FOR UPDATE;
  IF v_submission.user_id <> v_user_id THEN
    RAISE EXCEPTION 'This submission belongs to another user.' USING ERRCODE = '42501';
  END IF;
  IF v_submission.request <> v_request THEN
    RAISE EXCEPTION 'This save already used different values. Retry the original values, then edit the saved record.' USING ERRCODE = '22023';
  END IF;
  IF v_submission.result IS NOT NULL THEN
    RETURN v_submission.result;
  END IF;

  IF COALESCE(p_record->>'entry_date', '') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Enter a valid record date.' USING ERRCODE = '22023';
  END IF;
  v_date := (p_record->>'entry_date')::date;
  IF v_date > (now() AT TIME ZONE 'Asia/Bangkok')::date THEN
    RAISE EXCEPTION 'Record date cannot be in the future.' USING ERRCODE = '22023';
  END IF;
  IF p_record->>'category' IS NULL OR p_record->>'category' NOT IN ('GP', 'CASE')
     OR (p_record->>'total_cost') IS NULL OR (p_record->>'total_cost')::integer < 0
     OR p_initial_payment < 0 OR p_initial_payment > (p_record->>'total_cost')::integer
     OR (p_record->>'category' = 'GP' AND p_initial_payment <> 0) THEN
    RAISE EXCEPTION 'Invalid record category, cost, or initial payment.' USING ERRCODE = '22023';
  END IF;

  v_month := to_char(v_date, 'YYYY-MM');
  INSERT INTO public.monthly_cycles (month_year) VALUES (v_month)
    ON CONFLICT (month_year) DO NOTHING;
  SELECT * INTO STRICT v_cycle FROM public.monthly_cycles WHERE month_year = v_month;

  -- Server-derived fields prevent a caller from assigning the visit to a different month.
  v_record := p_record || jsonb_build_object(
    'cycle_id', v_cycle.id, 'month_label', to_char(v_date, 'Mon YYYY'),
    'paid', p_initial_payment, 'remaining', (p_record->>'total_cost')::integer - p_initial_payment,
    'is_carried_forward', false
  );
  -- The existing registry function whitelists treatment fields and reloads patient identity.
  v_result := public.register_patient_with_record(jsonb_build_object('patient_id', btrim(p_patient_id)), v_record);
  v_record := v_result->'record';

  IF p_record->>'category' = 'CASE' AND p_initial_payment > 0 THEN
    INSERT INTO public.case_payments (record_id, payment_date, paid_amount, payment_note, payment_status)
      VALUES ((v_record->>'id')::uuid, v_date, p_initial_payment, 'Initial payment', 'COMPLETED')
      RETURNING to_jsonb(case_payments.*) INTO v_payment;
  END IF;
  v_result := jsonb_build_object('record', v_record, 'payment', v_payment, 'cycle', to_jsonb(v_cycle));
  UPDATE public.record_save_submissions SET result = v_result WHERE id = p_submission_id;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_registered_record(uuid, text, jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_registered_record(uuid, text, jsonb, integer) TO authenticated;
COMMENT ON FUNCTION public.save_registered_record(uuid, text, jsonb, integer) IS
  'Atomically saves a registered visit, its cycle, and initial receipt; identical per-user submissions replay the committed result.';

NOTIFY pgrst, 'reload schema';
