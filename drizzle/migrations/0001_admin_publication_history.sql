ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS after jsonb;
CREATE OR REPLACE FUNCTION public.record_site_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_row jsonb; new_row jsonb; editor text; item_kind text; item_slug text;
BEGIN
  IF TG_OP <> 'INSERT' THEN old_row := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_row := to_jsonb(NEW); END IF;
  SELECT email INTO editor FROM auth.users WHERE id = auth.uid();
  IF TG_TABLE_NAME = 'content_items' THEN
    item_kind := coalesce(new_row->>'kind', old_row->>'kind');
    item_slug := coalesce(new_row->>'slug', old_row->>'slug');
  ELSE
    item_kind := 'home';
    item_slug := CASE WHEN TG_TABLE_NAME = 'home_features' THEN coalesce(new_row->>'slot', old_row->>'slot') ELSE coalesce(new_row->>'key', old_row->>'key') END;
  END IF;
  INSERT INTO public.activity_log(actor, actor_email, action, kind, slug, before, after)
  VALUES(auth.uid(), editor, CASE WHEN TG_TABLE_NAME = 'home_features' THEN 'feature' WHEN TG_TABLE_NAME = 'site_settings' THEN 'setting' WHEN TG_OP = 'INSERT' THEN 'create' WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'edit' END, item_kind, item_slug, old_row, new_row);
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER audit_content_changes AFTER INSERT OR UPDATE OR DELETE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.record_site_change();
CREATE TRIGGER audit_feature_changes AFTER INSERT OR UPDATE OR DELETE ON public.home_features FOR EACH ROW EXECUTE FUNCTION public.record_site_change();
CREATE TRIGGER audit_setting_changes AFTER INSERT OR UPDATE OR DELETE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.record_site_change();
CREATE OR REPLACE FUNCTION public.publish_admin_changes(changes jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c jsonb; r jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrators only'; END IF;
  IF jsonb_typeof(changes) <> 'array' OR jsonb_array_length(changes) > 500 THEN RAISE EXCEPTION 'Invalid changes'; END IF;
  FOR c IN SELECT value FROM jsonb_array_elements(changes) LOOP
    r := c->'value';
    IF c->>'table' = 'content_items' THEN
      IF c->>'operation' = 'delete' THEN
        DELETE FROM public.content_items WHERE kind = c->>'kind' AND slug = c->>'key';
      ELSE
        INSERT INTO public.content_items(kind,slug,data,visible,deleted,sort,updated_by,updated_at)
        VALUES(c->>'kind',c->>'key',coalesce(r->'data','{}'::jsonb),coalesce((r->>'visible')::boolean,true),coalesce((r->>'deleted')::boolean,false),(r->>'sort')::integer,auth.uid(),now())
        ON CONFLICT(kind,slug) DO UPDATE SET data=EXCLUDED.data,visible=EXCLUDED.visible,deleted=EXCLUDED.deleted,sort=EXCLUDED.sort,updated_by=auth.uid(),updated_at=now();
      END IF;
    ELSIF c->>'table' = 'home_features' THEN
      IF c->>'key' NOT IN ('lead','blog','podcast') THEN RAISE EXCEPTION 'Invalid hero slot'; END IF;
      IF c->>'operation' = 'delete' THEN DELETE FROM public.home_features WHERE slot=c->>'key';
      ELSE
        IF r->>'mode' = 'pinned' AND (coalesce(r->>'item_kind','') NOT IN ('article','episode') OR coalesce(r->>'item_slug','') = '') THEN RAISE EXCEPTION 'Choose an article or episode'; END IF;
        INSERT INTO public.home_features(slot,mode,item_kind,item_slug,updated_at) VALUES(c->>'key',r->>'mode',r->>'item_kind',r->>'item_slug',now())
        ON CONFLICT(slot) DO UPDATE SET mode=EXCLUDED.mode,item_kind=EXCLUDED.item_kind,item_slug=EXCLUDED.item_slug,updated_at=now();
      END IF;
    ELSIF c->>'table' = 'site_settings' THEN
      IF c->>'operation' = 'delete' THEN DELETE FROM public.site_settings WHERE key=c->>'key';
      ELSE INSERT INTO public.site_settings(key,value,updated_at) VALUES(c->>'key',r,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now(); END IF;
    ELSE RAISE EXCEPTION 'Unsupported change'; END IF;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.publish_admin_changes(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_admin_changes(jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.record_site_change() FROM PUBLIC, anon, authenticated;