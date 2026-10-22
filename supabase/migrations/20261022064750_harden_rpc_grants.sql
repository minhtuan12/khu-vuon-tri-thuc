-- Supabase projects may grant EXECUTE directly to anon/authenticated by default.
-- Revoking only PUBLIC in earlier migrations does not remove those grants.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_request() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.learning_snapshot() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_learning_context(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_learning_progress(text,text,text,jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_learning_event(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_learning_experience(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_curated_path(text,text) FROM PUBLIC, anon;
