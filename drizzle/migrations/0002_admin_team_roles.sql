ALTER TABLE public.admin_emails ADD COLUMN role text NOT NULL DEFAULT 'editor';
ALTER TABLE public.admin_emails ADD CONSTRAINT admin_emails_role CHECK (role IN ('editor','viewer'));

-- keep everyone who can edit today as an editor
INSERT INTO public.admin_emails(email, enabled, role, updated_at)
SELECT lower(u.email), true, 'editor', now() FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_owner_email(_email text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(_email) IN ('dias.k@biohackers.world','mykyta.b@biohackers.world')
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL AND public.is_owner_email(email))
$$;

-- signed-in team member who may at least look at the admin panel
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM auth.users u LEFT JOIN public.admin_emails a ON a.email = lower(u.email)
    WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL
      AND coalesce(a.enabled, split_part(lower(u.email), '@', 2) = 'biohackers.world')
  )
$$;

CREATE OR REPLACE FUNCTION public.my_admin_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.is_owner() THEN 'owner' WHEN public.is_admin() THEN 'editor' WHEN public.is_staff() THEN 'viewer' ELSE 'none' END
$$;

CREATE OR REPLACE FUNCTION public.sync_admin_role(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record; a record;
BEGIN
  SELECT id, lower(email) AS email, email_confirmed_at INTO u FROM auth.users WHERE id = _uid;
  IF u.id IS NULL THEN RETURN; END IF;
  SELECT enabled, role INTO a FROM public.admin_emails WHERE email = u.email;
  IF u.email_confirmed_at IS NOT NULL AND (public.is_owner_email(u.email) OR (a.enabled IS TRUE AND a.role = 'editor')) THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (u.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = u.id AND role = 'admin';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_team_role(target_email text, new_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(trim(target_email)); uid uuid;
BEGIN
  IF NOT public.is_owner() THEN RAISE EXCEPTION 'Only the owner can change roles'; END IF;
  IF e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(e) > 255 THEN RAISE EXCEPTION 'Invalid email'; END IF;
  IF new_role NOT IN ('editor','viewer','revoked') THEN RAISE EXCEPTION 'Invalid role'; END IF;
  IF public.is_owner_email(e) THEN RAISE EXCEPTION 'The owner cannot be changed'; END IF;
  INSERT INTO public.admin_emails(email, enabled, role, added_by, updated_at)
  VALUES (e, new_role <> 'revoked', CASE WHEN new_role = 'revoked' THEN 'viewer' ELSE new_role END, auth.uid(), now())
  ON CONFLICT (email) DO UPDATE SET enabled = EXCLUDED.enabled,
    role = CASE WHEN new_role = 'revoked' THEN public.admin_emails.role ELSE EXCLUDED.role END,
    added_by = EXCLUDED.added_by, updated_at = now();
  SELECT id INTO uid FROM auth.users WHERE lower(email) = e;
  IF uid IS NOT NULL THEN
    PERFORM public.sync_admin_role(uid);
    UPDATE public.admin_requests SET status = CASE WHEN new_role = 'revoked' THEN 'declined' ELSE 'approved' END WHERE user_id = uid;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_admin_email_access(target_email text, allow_access boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.set_team_role(target_email, CASE WHEN allow_access THEN 'editor' ELSE 'revoked' END);
END $$;

CREATE OR REPLACE FUNCTION public.decline_admin_request(target_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_owner() THEN RAISE EXCEPTION 'Only the owner can manage access'; END IF;
  UPDATE public.admin_requests SET status = 'declined' WHERE user_id = target_user;
END $$;

CREATE OR REPLACE FUNCTION public.list_team()
RETURNS TABLE(email text, name text, avatar text, last_sign_in_at timestamptz, role text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Team members only'; END IF;
  RETURN QUERY
  SELECT e.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')::text,
    coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text,
    u.last_sign_in_at,
    (CASE WHEN public.is_owner_email(e.email) THEN 'owner'
          WHEN a.enabled = false THEN 'revoked'
          WHEN a.role IS NOT NULL THEN a.role
          ELSE 'viewer' END)::text
  FROM (
    SELECT lower(au.email) AS email FROM auth.users au
      WHERE au.email_confirmed_at IS NOT NULL AND (split_part(lower(au.email), '@', 2) = 'biohackers.world' OR au.id IN (SELECT user_id FROM public.user_roles))
    UNION SELECT ae.email FROM public.admin_emails ae
  ) e
  LEFT JOIN auth.users u ON lower(u.email) = e.email
  LEFT JOIN public.admin_emails a ON a.email = e.email
  ORDER BY CASE WHEN public.is_owner_email(e.email) THEN 0 WHEN a.enabled = false THEN 3 WHEN a.role = 'editor' THEN 1 ELSE 2 END, 1;
END $$;

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(email text, name text, avatar text, last_sign_in_at timestamptz, has_access boolean, source text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_staff() THEN RAISE EXCEPTION 'Team members only'; END IF;
  RETURN QUERY SELECT t.email, t.name, t.avatar, t.last_sign_in_at, t.role IN ('owner','editor'), initcap(t.role) FROM public.list_team() t;
END $$;

-- viewers can look around
DROP POLICY IF EXISTS "Admins read log" ON public.activity_log;
CREATE POLICY "Team reads log" ON public.activity_log FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Admins read submissions" ON public.submissions;
CREATE POLICY "Team reads submissions" ON public.submissions FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Own or admin read requests" ON public.admin_requests;
CREATE POLICY "Own or owner read requests" ON public.admin_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_owner());

-- re-sync current users under the new rules
DO $$ DECLARE r record; BEGIN FOR r IN SELECT id FROM auth.users LOOP PERFORM public.sync_admin_role(r.id); END LOOP; END $$;