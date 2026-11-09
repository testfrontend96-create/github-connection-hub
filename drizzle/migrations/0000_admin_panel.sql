CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Email overrides: enabled=true grants, enabled=false blocks (beats company domain)
CREATE TABLE public.admin_emails (
  email text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  added_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_emails TO authenticated;
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read admin emails" ON public.admin_emails FOR SELECT TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.sync_admin_role(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record; allowed boolean;
BEGIN
  SELECT id, lower(email) AS email, email_confirmed_at INTO u FROM auth.users WHERE id = _uid;
  IF u.id IS NULL THEN RETURN; END IF;
  SELECT enabled INTO allowed FROM public.admin_emails WHERE email = u.email;
  IF u.email = 'mykyta.b@biohackers.world' AND u.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (u.id, 'admin') ON CONFLICT DO NOTHING;
  ELSIF allowed = false OR u.email_confirmed_at IS NULL THEN
    DELETE FROM public.user_roles WHERE user_id = u.id AND role = 'admin';
  ELSIF allowed = true OR split_part(u.email, '@', 2) = 'biohackers.world' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (u.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.on_auth_user_admin_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.sync_admin_role(NEW.id);
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_admin_sync();
CREATE TRIGGER on_auth_user_confirmed_admin AFTER UPDATE OF email_confirmed_at, email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_admin_sync();

-- Access requests
CREATE TABLE public.admin_requests (
  user_id uuid PRIMARY KEY,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_requests TO authenticated;
GRANT ALL ON public.admin_requests TO service_role;
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin read requests" ON public.admin_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE OR REPLACE FUNCTION public.request_admin_access()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u record;
BEGIN
  SELECT id, email, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name') AS name INTO u FROM auth.users WHERE id = auth.uid();
  IF u.id IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO public.admin_requests(user_id, email, name) VALUES (u.id, lower(u.email), u.name)
  ON CONFLICT (user_id) DO UPDATE SET status = 'pending', created_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.set_admin_email_access(target_email text, allow_access boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e text := lower(trim(target_email)); me text; uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrators only'; END IF;
  IF e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(e) > 255 THEN RAISE EXCEPTION 'Invalid email'; END IF;
  SELECT lower(email) INTO me FROM auth.users WHERE id = auth.uid();
  IF NOT allow_access AND (e = me OR e = 'mykyta.b@biohackers.world') THEN RAISE EXCEPTION 'This administrator cannot be removed'; END IF;
  INSERT INTO public.admin_emails(email, enabled, added_by, updated_at) VALUES (e, allow_access, auth.uid(), now())
  ON CONFLICT (email) DO UPDATE SET enabled = EXCLUDED.enabled, added_by = EXCLUDED.added_by, updated_at = now();
  SELECT id INTO uid FROM auth.users WHERE lower(email) = e;
  IF uid IS NOT NULL THEN
    PERFORM public.sync_admin_role(uid);
    UPDATE public.admin_requests SET status = CASE WHEN allow_access THEN 'approved' ELSE 'declined' END WHERE user_id = uid;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.decline_admin_request(target_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrators only'; END IF;
  UPDATE public.admin_requests SET status = 'declined' WHERE user_id = target_user;
END $$;

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE(email text, name text, avatar text, last_sign_in_at timestamptz, has_access boolean, source text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrators only'; END IF;
  RETURN QUERY
  SELECT e.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')::text,
    coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')::text,
    u.last_sign_in_at,
    coalesce(EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin'), false),
    (CASE WHEN e.email = 'mykyta.b@biohackers.world' THEN 'Owner'
          WHEN a.enabled = false THEN 'Revoked'
          WHEN split_part(e.email, '@', 2) = 'biohackers.world' THEN 'Company email'
          ELSE 'Added email' END)::text
  FROM (
    SELECT lower(au.email) AS email FROM auth.users au WHERE au.id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin')
    UNION SELECT ae.email FROM public.admin_emails ae
  ) e
  LEFT JOIN auth.users u ON lower(u.email) = e.email
  LEFT JOIN public.admin_emails a ON a.email = e.email
  ORDER BY 6, 1;
END $$;

-- Content overrides: one row per edited/added/deleted item of any kind
CREATE TABLE public.content_items (
  kind text NOT NULL,
  slug text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  visible boolean NOT NULL DEFAULT true,
  deleted boolean NOT NULL DEFAULT false,
  sort integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  PRIMARY KEY (kind, slug)
);
GRANT SELECT ON public.content_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads content" ON public.content_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert content" ON public.content_items FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update content" ON public.content_items FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete content" ON public.content_items FOR DELETE TO authenticated USING (public.is_admin());

-- Homepage hero slots
CREATE TABLE public.home_features (
  slot text PRIMARY KEY,
  mode text NOT NULL DEFAULT 'latest',
  item_kind text,
  item_slug text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_features_mode CHECK (mode IN ('latest','popular','pinned'))
);
GRANT SELECT ON public.home_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_features TO authenticated;
GRANT ALL ON public.home_features TO service_role;
ALTER TABLE public.home_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads features" ON public.home_features FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write features" ON public.home_features FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.home_features(slot, mode) VALUES ('lead','latest'),('blog','latest'),('podcast','latest');

-- Site settings (homepage texts, ordering)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Page views for "most popular"
CREATE TABLE public.page_views (
  id bigserial PRIMARY KEY,
  kind text NOT NULL,
  slug text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_views_kind CHECK (kind IN ('article','episode','kb','biohacker','faq')),
  CONSTRAINT page_views_slug CHECK (length(slug) BETWEEN 1 AND 200)
);
CREATE INDEX page_views_recent ON public.page_views (kind, viewed_at);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.page_views_id_seq TO anon, authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone records a view" ON public.page_views FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.popular_items(_kind text, _limit int DEFAULT 10)
RETURNS TABLE(slug text, views bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT slug, count(*) FROM public.page_views
  WHERE kind = _kind AND viewed_at > now() - interval '30 days'
  GROUP BY slug ORDER BY 2 DESC LIMIT least(_limit, 50)
$$;
GRANT EXECUTE ON FUNCTION public.popular_items(text, int) TO anon, authenticated;

-- Public form submissions (Update list, newsletter)
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  data jsonb NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_kind CHECK (kind IN ('biohacker','newsletter')),
  CONSTRAINT submissions_size CHECK (length(data::text) <= 6000)
);
GRANT INSERT ON public.submissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits" ON public.submissions FOR INSERT TO anon, authenticated WITH CHECK (done = false);
CREATE POLICY "Admins read submissions" ON public.submissions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update submissions" ON public.submissions FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete submissions" ON public.submissions FOR DELETE TO authenticated USING (public.is_admin());

-- Change history
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid,
  actor_email text,
  action text NOT NULL,
  kind text,
  slug text,
  before jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read log" ON public.activity_log FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins write log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND actor = auth.uid());

-- Storage policies for hub-media bucket
CREATE POLICY "Public reads hub media" ON storage.objects FOR SELECT USING (bucket_id = 'hub-media');
CREATE POLICY "Admins upload hub media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'hub-media' AND public.is_admin());
CREATE POLICY "Admins update hub media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'hub-media' AND public.is_admin());
CREATE POLICY "Admins delete hub media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'hub-media' AND public.is_admin());
