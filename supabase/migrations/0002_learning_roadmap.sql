-- Add curated path lessons without changing existing standard/approved progress.
-- These IDs mirror the curated vocabulary in src/lib/content.ts.
CREATE FUNCTION public.is_curated_path(adventure text, experience text) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT coalesce(experience = ANY(CASE adventure
  WHEN 'garden' THEN ARRAY['path-v1-sun','path-v1-rain','path-v1-rabbit','path-v1-apple']
  WHEN 'colors' THEN ARRAY['path-v1-red','path-v1-blue','path-v1-yellow','path-v1-green']
  WHEN 'train' THEN ARRAY['path-v1-cat','path-v1-dog','path-v1-bird','path-v1-elephant']
  ELSE ARRAY[]::text[] END),false);
$$;

DO $$ DECLARE old_check record; BEGIN
 FOR old_check IN SELECT conname FROM pg_constraint
 WHERE conrelid='public.learning_progress'::regclass AND contype='c'
 AND pg_get_constraintdef(oid) LIKE '%experience_key%'
 LOOP EXECUTE format('ALTER TABLE public.learning_progress DROP CONSTRAINT %I', old_check.conname); END LOOP;
END $$;
ALTER TABLE public.learning_progress ADD CONSTRAINT learning_progress_experience_key_check
 CHECK (experience_key = coalesce(experience_id::text,'standard') OR
 (experience_id IS NULL AND public.is_curated_path(adventure_id,experience_key)));

CREATE OR REPLACE FUNCTION public.save_learning_progress(context_key text, adventure text, experience text, item jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT(item ?& ARRAY['stage','completed','wordsSeen','updatedAt']) THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 IF jsonb_typeof(item->'stage') IS DISTINCT FROM 'number' OR (item->>'stage')::int NOT BETWEEN 0 AND 5 OR jsonb_typeof(item->'completed') IS DISTINCT FROM 'boolean' OR jsonb_typeof(item->'wordsSeen') IS DISTINCT FROM 'array' OR jsonb_typeof(item->'updatedAt') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 INSERT INTO learning_progress(owner_id,context_key,context_id,adventure_id,experience_key,experience_id,payload)
 VALUES(auth.uid(),context_key,nullif(context_key,'shared')::uuid,adventure,experience,
 CASE WHEN experience='standard' OR public.is_curated_path(adventure,experience) THEN NULL ELSE experience::uuid END,item)
 ON CONFLICT ON CONSTRAINT learning_progress_pkey DO UPDATE SET payload=
 jsonb_set(jsonb_set(
  CASE WHEN (excluded.payload->>'updatedAt')::numeric >= (learning_progress.payload->>'updatedAt')::numeric THEN excluded.payload ELSE learning_progress.payload END,
  '{completed}',to_jsonb(coalesce((excluded.payload->>'completed')::boolean,false) OR coalesce((learning_progress.payload->>'completed')::boolean,false))),
  '{wordsSeen}',(SELECT coalesce(jsonb_agg(DISTINCT v),'[]') FROM jsonb_array_elements(coalesce(excluded.payload->'wordsSeen','[]')||coalesce(learning_progress.payload->'wordsSeen','[]')) v));
END $$;
REVOKE ALL ON FUNCTION public.is_curated_path(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_curated_path(text,text) TO authenticated;
