import { todoItems } from "../database/todoItems";
import { initTRPC } from "@trpc/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.PUBLIC_ENV__SUPABASE_URL,
  import.meta.env.PUBLIC_ENV__SUPABASE_KEY
);

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  demo: publicProcedure.query(async () => {
    return { demo: true };
  }),
  onNewTodo: publicProcedure
    .input((value): string => {
      if (typeof value === "string") {
        return value;
      }
      throw new Error("Input is not a string");
    })
    .mutation(async (opts) => {
      todoItems.push({ text: opts.input });
      supabase.auth.admin.getUserById("");
      return { todoItems };
    }),
});

export type AppRouter = typeof appRouter;
