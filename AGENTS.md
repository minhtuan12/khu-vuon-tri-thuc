<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Lesson vocabulary/movements live only in `src/lib/content.ts`; AI proposals must pass `validateProposal` in `src/lib/plan.ts` (keeps AI inside curated content).
- Progress is local-first (`src/lib/progress.ts`) and synced to `lesson_sessions` when signed in (guest play must never need a network).
- All speech goes through `src/lib/speech.ts` (single queue, cancel on navigation/mute, no fake voices).
- Teacher AI runs in `src/lib/ai.functions.ts` behind `requireSupabaseAuth` with a per-user hourly limit from `ai_requests`.
