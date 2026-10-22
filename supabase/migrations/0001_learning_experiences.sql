-- Additive migration: legacy lesson_sessions remain untouched and readable.
CREATE TABLE public.learning_contexts (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('learner','class')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 30),
  age text NOT NULL CHECK (age IN ('3-4','4-5','5-6')),
  learner_id uuid REFERENCES public.learner_profiles(id),
  UNIQUE (owner_id,id)
);
CREATE TABLE public.approved_experiences (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,id)
);
INSERT INTO public.learning_contexts(id,owner_id,kind,name,age,learner_id)
 SELECT id,owner_id,'learner',pseudonym,age_band,id FROM public.learner_profiles;
CREATE TABLE public.learning_progress (
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  context_key text NOT NULL DEFAULT 'shared',
  context_id uuid,
  adventure_id text NOT NULL CHECK(adventure_id IN ('garden','colors','train')),
  experience_key text NOT NULL DEFAULT 'standard',
  experience_id uuid,
  payload jsonb NOT NULL,
  PRIMARY KEY(owner_id,context_key,adventure_id,experience_key),
  FOREIGN KEY(owner_id,context_id) REFERENCES public.learning_contexts(owner_id,id),
  FOREIGN KEY(owner_id,experience_id) REFERENCES public.approved_experiences(owner_id,id),
  CHECK(context_key = coalesce(context_id::text,'shared')),
  CHECK(experience_key = coalesce(experience_id::text,'standard'))
);
CREATE TABLE public.learning_events (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  context_key text NOT NULL,
  context_id uuid,
  payload jsonb NOT NULL,
  FOREIGN KEY(owner_id,context_id) REFERENCES public.learning_contexts(owner_id,id),
  CHECK(context_key = coalesce(context_id::text,'shared'))
);
ALTER TABLE public.learning_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY contexts_owner ON public.learning_contexts FOR ALL TO authenticated
 USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid() AND (learner_id IS NULL OR EXISTS(SELECT 1 FROM public.learner_profiles l WHERE l.id=learner_id AND l.owner_id=auth.uid())));
CREATE POLICY experiences_owner ON public.approved_experiences FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE POLICY progress_owner ON public.learning_progress FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
CREATE POLICY events_owner ON public.learning_events FOR ALL TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
GRANT SELECT,INSERT,UPDATE ON public.learning_contexts,public.learning_progress,public.learning_events TO authenticated;
GRANT SELECT ON public.approved_experiences TO authenticated;

-- The quota cannot be bypassed by simultaneous requests or direct ai_requests inserts.
CREATE OR REPLACE FUNCTION public.reserve_ai_request() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF (SELECT count(*) FROM public.ai_requests WHERE owner_id=auth.uid() AND created_at > now()-interval '1 hour') >= 20 THEN RETURN false; END IF;
 INSERT INTO public.ai_requests(owner_id) VALUES(auth.uid());
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_ai_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_ai_request() TO authenticated;
REVOKE INSERT ON public.ai_requests FROM authenticated;

CREATE OR REPLACE FUNCTION public.learning_snapshot() RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
 SELECT jsonb_build_object(
  'contexts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'kind',kind,'name',name,'age',age,'learnerId',learner_id)) FROM learning_contexts),'[]'::jsonb),
  'experiences',coalesce((SELECT jsonb_agg(payload) FROM approved_experiences),'[]'::jsonb),
  'progress',coalesce((SELECT jsonb_object_agg(context_key||'/'||adventure_id||'/'||experience_key,payload) FROM learning_progress),'{}'::jsonb),
  'events',coalesce((SELECT jsonb_agg(payload) FROM learning_events),'[]'::jsonb)
 );
$$;

CREATE OR REPLACE FUNCTION public.save_learning_context(item jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE lid uuid;
BEGIN
 IF item->>'kind'='learner' THEN
  lid := (item->>'id')::uuid;
  INSERT INTO learner_profiles(id,pseudonym,age_band) VALUES(lid,item->>'name',item->>'age')
   ON CONFLICT(id) DO UPDATE SET pseudonym=excluded.pseudonym,age_band=excluded.age_band;
 END IF;
 INSERT INTO learning_contexts(id,kind,name,age,learner_id) VALUES((item->>'id')::uuid,item->>'kind',item->>'name',item->>'age',lid)
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,age=excluded.age;
END $$;

CREATE OR REPLACE FUNCTION public.save_learning_progress(context_key text, adventure text, experience text, item jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT(item ?& ARRAY['stage','completed','wordsSeen','updatedAt']) THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 IF jsonb_typeof(item->'stage') IS DISTINCT FROM 'number' OR (item->>'stage')::int NOT BETWEEN 0 AND 5 OR jsonb_typeof(item->'completed') IS DISTINCT FROM 'boolean' OR jsonb_typeof(item->'wordsSeen') IS DISTINCT FROM 'array' OR jsonb_typeof(item->'updatedAt') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid progress'; END IF;
 INSERT INTO learning_progress(owner_id,context_key,context_id,adventure_id,experience_key,experience_id,payload)
 VALUES(auth.uid(),context_key,nullif(context_key,'shared')::uuid,adventure,experience,nullif(experience,'standard')::uuid,item)
 ON CONFLICT ON CONSTRAINT learning_progress_pkey DO UPDATE SET payload=
 jsonb_set(jsonb_set(
  CASE WHEN (excluded.payload->>'updatedAt')::numeric >= (learning_progress.payload->>'updatedAt')::numeric THEN excluded.payload ELSE learning_progress.payload END,
  '{completed}',to_jsonb(coalesce((excluded.payload->>'completed')::boolean,false) OR coalesce((learning_progress.payload->>'completed')::boolean,false))),
  '{wordsSeen}',(SELECT coalesce(jsonb_agg(DISTINCT v),'[]') FROM jsonb_array_elements(coalesce(excluded.payload->'wordsSeen','[]')||coalesce(learning_progress.payload->'wordsSeen','[]')) v));
END $$;

CREATE OR REPLACE FUNCTION public.save_learning_event(item jsonb) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path=public AS $$
 INSERT INTO learning_events(id,context_key,context_id,payload) VALUES((item->>'id')::uuid,item->>'contextId',nullif(item->>'contextId','shared')::uuid,item) ON CONFLICT(id) DO NOTHING;
$$;
REVOKE ALL ON FUNCTION public.learning_snapshot(),public.save_learning_context(jsonb),public.save_learning_progress(text,text,text,jsonb),public.save_learning_event(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.learning_snapshot(),public.save_learning_context(jsonb),public.save_learning_progress(text,text,text,jsonb),public.save_learning_event(jsonb) TO authenticated;

-- Immutable approvals: written only through the authenticated server approval handler.
-- SECURITY DEFINER RPC validates the structural boundary as well, not just the UI.
CREATE OR REPLACE FUNCTION public.approve_learning_experience(item jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE chapter jsonb; allowed text[]; moves text[]; n integer; i integer:=0; stages text[]:=ARRAY['intro','listen','scene','move','recall','celebrate'];
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
 IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR NOT(item ?& ARRAY['id','version','request','proposal','source','approvedAt']) OR jsonb_typeof(item->'proposal') IS DISTINCT FROM 'object' OR NOT((item->'proposal') ?& ARRAY['kind','title','wordIds','movementId','teacherTipVi','chapters']) THEN RAISE EXCEPTION 'Missing proposal fields'; END IF;
 IF jsonb_typeof(item#>'{proposal,chapters}') IS DISTINCT FROM 'array' OR jsonb_typeof(item#>'{proposal,wordIds}') IS DISTINCT FROM 'array' OR item->>'source' NOT IN ('ai','fallback') OR char_length(item#>>'{proposal,title}') NOT BETWEEN 1 AND 240 OR item#>>'{proposal,title}' ~ '[<>]' THEN RAISE EXCEPTION 'Invalid proposal shape'; END IF;
 CASE item#>>'{request,adventureId}'
 WHEN 'garden' THEN allowed:=ARRAY['sun','rain','rabbit','apple']; moves:=ARRAY['stretch-sun','hop-rabbit','rain-fingers'];
 WHEN 'colors' THEN allowed:=ARRAY['red','blue','yellow','green']; moves:=ARRAY['touch-red','spin-rainbow','clap-colors'];
 WHEN 'train' THEN allowed:=ARRAY['cat','dog','bird','elephant']; moves:=ARRAY['fly-bird','elephant-walk','train-chug'];
 ELSE RAISE EXCEPTION 'Invalid adventure'; END CASE;
 n:=CASE item#>>'{request,age}' WHEN '3-4' THEN 2 WHEN '4-5' THEN 3 WHEN '5-6' THEN 4 ELSE 0 END;
 IF item#>>'{request,duration}' IS NULL OR item#>>'{request,duration}' NOT IN ('short','standard') OR jsonb_typeof(item#>'{request,movement}') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid request'; END IF;
 IF jsonb_array_length(item#>'{proposal,wordIds}') <> (CASE WHEN item#>>'{request,duration}'='short' THEN 3 ELSE 4 END) OR (SELECT count(DISTINCT w) FROM jsonb_array_elements_text(item#>'{proposal,wordIds}') w) <> jsonb_array_length(item#>'{proposal,wordIds}') THEN RAISE EXCEPTION 'Invalid words'; END IF;
 IF n=0 OR item->>'version'<>'1' OR item#>>'{proposal,kind}' NOT IN ('story','review') OR NOT (item#>>'{proposal,movementId}'=ANY(moves)) THEN RAISE EXCEPTION 'Invalid proposal'; END IF;
 IF jsonb_array_length(item#>'{proposal,chapters}')<>6 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(item#>'{proposal,wordIds}') w WHERE NOT(w=ANY(allowed))) THEN RAISE EXCEPTION 'Invalid content'; END IF;
 FOR chapter IN SELECT * FROM jsonb_array_elements(item#>'{proposal,chapters}') LOOP
  i:=i+1;
  IF NOT(chapter ?& ARRAY['stage','text','choices']) OR jsonb_typeof(chapter->'choices') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Missing chapter fields'; END IF;
  IF (SELECT count(DISTINCT c->>'wordId') FROM jsonb_array_elements(chapter->'choices') c) <> jsonb_array_length(chapter->'choices') OR EXISTS(SELECT 1 FROM jsonb_array_elements(chapter->'choices') c WHERE NOT(c ?& ARRAY['wordId','response'])) THEN RAISE EXCEPTION 'Invalid branch'; END IF;
  IF chapter->>'stage'<>stages[i] OR char_length(chapter->>'text') NOT BETWEEN 1 AND 240 OR chapter->>'text' ~ '[<>]' THEN RAISE EXCEPTION 'Invalid chapter'; END IF;
  IF jsonb_array_length(chapter->'choices') <> (CASE WHEN i=3 THEN n ELSE 0 END) OR EXISTS(SELECT 1 FROM jsonb_array_elements(chapter->'choices') c WHERE NOT(c->>'wordId'=ANY(allowed)) OR char_length(c->>'response') NOT BETWEEN 1 AND 240 OR c->>'response' ~ '[<>]') THEN RAISE EXCEPTION 'Invalid choices'; END IF;
 END LOOP;
 INSERT INTO approved_experiences(id,owner_id,payload) VALUES((item->>'id')::uuid,auth.uid(),item);
 RETURN item;
END $$;
REVOKE ALL ON FUNCTION public.approve_learning_experience(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_learning_experience(jsonb) TO authenticated;
