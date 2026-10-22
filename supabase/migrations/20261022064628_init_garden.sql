CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  pseudonym text NOT NULL CHECK (char_length(pseudonym) BETWEEN 1 AND 30),
  avatar text NOT NULL DEFAULT 'sun',
  age_band text NOT NULL CHECK (age_band IN ('3-4','4-5','5-6')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_profiles TO authenticated;
GRANT ALL ON public.learner_profiles TO service_role;
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own learners" ON public.learner_profiles FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.lesson_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  learner_id uuid REFERENCES public.learner_profiles(id) ON DELETE SET NULL,
  adventure_id text NOT NULL CHECK (adventure_id IN ('garden','colors','train')),
  stage_index int NOT NULL DEFAULT 0 CHECK (stage_index BETWEEN 0 AND 10),
  completed boolean NOT NULL DEFAULT false,
  words_seen text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, adventure_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_sessions TO authenticated;
GRANT ALL ON public.lesson_sessions TO service_role;
ALTER TABLE public.lesson_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.lesson_sessions FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE public.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  learner_id uuid NOT NULL REFERENCES public.learner_profiles(id) ON DELETE CASCADE,
  adventure_id text NOT NULL,
  word text NOT NULL,
  level text NOT NULL CHECK (level IN ('lam_quen','lam_theo','noi_duoc')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (learner_id, adventure_id, word)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observations TO authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own observations" ON public.observations FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.learner_profiles l WHERE l.id = learner_id AND l.owner_id = auth.uid()));

CREATE TABLE public.ai_requests (
  id bigserial PRIMARY KEY,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_requests TO authenticated;
GRANT USAGE ON SEQUENCE public.ai_requests_id_seq TO authenticated;
GRANT ALL ON public.ai_requests TO service_role;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai select" ON public.ai_requests FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "own ai insert" ON public.ai_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
