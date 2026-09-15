-- Trigger function to automatically create a profile for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'ASSISTANT'::public.user_role)
  );
  return new;
end;
$$;

-- Trigger that fires immediately after a new user record is inserted into auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();