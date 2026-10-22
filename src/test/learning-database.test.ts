// @vitest-environment node
// PostgreSQL-compatible in-memory tests: never connect to the user's database.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { fallbackExperience } from "@/lib/experiences";

describe("learning database boundaries", () => {
  it("migrates, isolates two owners, enforces context references and caps quota", async () => {
    const db = new PGlite();
    try {
      await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb DEFAULT '{}');
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
      await db.exec(readFileSync("supabase/migrations/20261022064628_init_garden.sql", "utf8"));
      await db.exec(readFileSync("supabase/migrations/20261022064636_learning_experiences.sql", "utf8"));
      await db.exec(readFileSync("supabase/migrations/20261022064642_learning_roadmap.sql", "utf8"));
      await db.exec(readFileSync("supabase/migrations/20261022064750_harden_rpc_grants.sql", "utf8"));
      const permissions = await db.query<{
        anon: boolean;
        authenticated: boolean;
      }>(`SELECT has_function_privilege('anon','public.save_learning_progress(text,text,text,jsonb)','EXECUTE') AS anon,
        has_function_privilege('authenticated','public.save_learning_progress(text,text,text,jsonb)','EXECUTE') AS authenticated`);
      expect(permissions.rows[0]).toEqual({ anon: false, authenticated: true });
      const a = "11111111-1111-4111-8111-111111111111",
        b = "22222222-2222-4222-8222-222222222222",
        c = "33333333-3333-4333-8333-333333333333";
      await db.exec(
        `INSERT INTO auth.users(id) VALUES('${a}'),('${b}'); SET ROLE authenticated; SET request.jwt.claim.sub='${a}';`,
      );
      await db.query("SELECT public.save_learning_context($1::jsonb)", [
        JSON.stringify({ id: c, kind: "learner", name: "Nắng", age: "4-5" }),
      ]);
      await db.query("SELECT public.save_learning_progress($1,$2,$3,$4::jsonb)", [
        c,
        "garden",
        "standard",
        JSON.stringify({ stage: 2, completed: false, wordsSeen: ["sun"], updatedAt: 2 }),
      ]);
      await db.query("SELECT public.save_learning_progress($1,$2,$3,$4::jsonb)", [
        c,
        "garden",
        "standard",
        JSON.stringify({ stage: 1, completed: true, wordsSeen: ["rain"], updatedAt: 1 }),
      ]);
      const eventId = crypto.randomUUID();
      await db.query("SELECT public.save_learning_event($1::jsonb)", [
        JSON.stringify({
          id: eventId,
          contextId: c,
          adventureId: "garden",
          experienceId: "standard",
          wordId: "sun",
          kind: "attempt",
          correct: true,
          at: 3,
        }),
      ]);
      const snapshot = await db.query<{
        snapshot: {
          contexts: { id: string }[];
          progress: Record<string, { stage: number; completed: boolean }>;
          events: { id: string }[];
        };
      }>("SELECT public.learning_snapshot() AS snapshot");
      expect(snapshot.rows[0]!.snapshot.contexts[0]!.id).toBe(c);
      expect(snapshot.rows[0]!.snapshot.progress[`${c}/garden/standard`]).toMatchObject({
        stage: 2,
        completed: true,
      });
      expect(snapshot.rows[0]!.snapshot.events[0]!.id).toBe(eventId);
      const rows = await db.query<{
        payload: { stage: number; completed: boolean; wordsSeen: string[] };
      }>("SELECT payload FROM learning_progress");
      expect(rows.rows[0]!.payload.stage).toBe(2);
      expect(rows.rows[0]!.payload.completed).toBe(true);
      expect(rows.rows[0]!.payload.wordsSeen).toHaveLength(2);
      await db.query("SELECT save_learning_progress($1,$2,$3,$4::jsonb)", [
        c,
        "garden",
        "path-v1-sun",
        JSON.stringify({ stage: 3, completed: false, wordsSeen: ["sun"], updatedAt: 3 }),
      ]);
      expect((await db.query("SELECT * FROM learning_progress")).rows).toHaveLength(2);
      await expect(
        db.query("SELECT save_learning_progress($1,$2,$3,$4::jsonb)", [
          c,
          "train",
          "path-v1-sun",
          JSON.stringify({ stage: 3, completed: false, wordsSeen: ["sun"], updatedAt: 3 }),
        ]),
      ).rejects.toThrow();
      const req = {
        adventureId: "garden" as const,
        age: "4-5" as const,
        duration: "standard" as const,
        movement: true,
      };
      const experience = {
        id: crypto.randomUUID(),
        version: 1,
        request: req,
        proposal: fallbackExperience(req, "story"),
        source: "fallback",
        approvedAt: new Date().toISOString(),
      };
      await db.query("SELECT approve_learning_experience($1::jsonb)", [JSON.stringify(experience)]);
      for (let i = 0; i < 20; i++)
        expect(
          (await db.query<{ ok: boolean }>("SELECT reserve_ai_request() AS ok")).rows[0]!.ok,
        ).toBe(true);
      expect(
        (await db.query<{ ok: boolean }>("SELECT reserve_ai_request() AS ok")).rows[0]!.ok,
      ).toBe(false);
      await db.exec(`SET request.jwt.claim.sub='${b}';`);
      expect((await db.query("SELECT * FROM learning_progress")).rows).toHaveLength(0);
      expect((await db.query("SELECT * FROM approved_experiences")).rows).toHaveLength(0);
      const otherSnapshot = await db.query<{ snapshot: { contexts: unknown[]; events: unknown[]; progress: object } }>(
        "SELECT public.learning_snapshot() AS snapshot",
      );
      expect(otherSnapshot.rows[0]!.snapshot).toEqual({
        contexts: [],
        experiences: [],
        progress: {},
        events: [],
      });
      await expect(
        db.query("SELECT save_learning_progress($1,$2,$3,$4::jsonb)", [
          c,
          "garden",
          "standard",
          JSON.stringify({ stage: 1, completed: false, wordsSeen: [], updatedAt: 3 }),
        ]),
      ).rejects.toThrow();
      expect(
        (await db.query<{ ok: boolean }>("SELECT reserve_ai_request() AS ok")).rows[0]!.ok,
      ).toBe(true);
    } finally {
      await db.close();
    }
  }, 30000);
});
