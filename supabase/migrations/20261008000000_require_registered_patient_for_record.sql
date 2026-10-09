-- Record creation must use an existing patient registry row.
-- The initial migration was edited after deployment, so this migration
-- replaces the deployed two-argument RPC and removes the obsolete overload.

DROP FUNCTION IF EXISTS public.register_patient_with_record(jsonb, jsonb, boolean);

CREATE OR REPLACE FUNCTION public.register_patient_with_record(
  p_patient jsonb,
  p_record jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_patient_id TEXT := NULLIF(BTRIM(p_patient->>'patient_id'), '');
  v_patient_uuid UUID;
  v_patient_name TEXT;
  v_address TEXT;
  v_record jsonb;
BEGIN
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient ID is required.' USING ERRCODE = '23502';
  END IF;

  SELECT id, patient_name, address
    INTO v_patient_uuid, v_patient_name, v_address
    FROM public.patients
    WHERE patient_id = v_patient_id;

  IF v_patient_uuid IS NULL THEN
    RAISE EXCEPTION 'Patient ID is not registered. Register the patient before adding a record.'
      USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.patient_records (
    cycle_id, patient_id, entry_date, patient_name, address,
    category, diagnosis, total_cost, month_label,
    lab_name, lab_send_date, delivery_date,
    paid, remaining, case_type, teeth, is_carried_forward
  )
  VALUES (
    (p_record->>'cycle_id')::uuid,
    v_patient_id,
    (p_record->>'entry_date')::date,
    v_patient_name,
    NULLIF(BTRIM(v_address), ''),
    (p_record->>'category')::public.record_category,
    p_record->>'diagnosis',
    (p_record->>'total_cost')::integer,
    p_record->>'month_label',
    NULLIF(BTRIM(p_record->>'lab_name'), ''),
    (p_record->>'lab_send_date')::date,
    (p_record->>'delivery_date')::date,
    COALESCE((p_record->>'paid')::integer, 0),
    (p_record->>'remaining')::integer,
    NULLIF(BTRIM(p_record->>'case_type'), ''),
    NULLIF(BTRIM(p_record->>'teeth'), ''),
    COALESCE((p_record->>'is_carried_forward')::boolean, false)
  )
  RETURNING to_jsonb(patient_records.*) INTO v_record;

  RETURN jsonb_build_object('patient_id', v_patient_uuid, 'record', v_record);
END;
$$;

COMMENT ON FUNCTION public.register_patient_with_record(jsonb, jsonb) IS
  'Atomically inserts a visit record for an already registered patient. Unknown patient IDs raise 23503; patient creation is handled by the patient registry flow.';

GRANT EXECUTE ON FUNCTION public.register_patient_with_record(jsonb, jsonb) TO authenticated;

NOTIFY pgrst, 'reload schema';
