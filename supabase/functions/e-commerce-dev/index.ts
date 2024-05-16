// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import {
  Context,
  GrammyError,
  HttpError,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import {
  bugCatcherRequest,
  eCommerceDevBot,
  handleUpdateECommerceDev,
} from "../_shared/utils/telegram/bots.ts";
import { getAiFeedbackFromSupabase } from "../_shared/supabase/ai.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from E-commerce Dev!");

await eCommerceDevBot.api.setMyCommands([
  {
    command: "/start",
    description: "Start chatting with E-commerce Dev",
  },
  // {
  //   command: "/room",
  //   description: "Create a room",
  // },
]);

eCommerceDevBot.command("start", async (ctx: Context) => {
  console.log("start"); // Вывод в консоль сообщения "start"
  await ctx.replyWithChatAction("typing"); // Отправка действия набора сообщения в чате

  await ctx.reply("Hello! I am E-commerce Dev bot. Ask me anything!");
});

eCommerceDevBot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  const query = ctx?.message?.text;

  const language_code = ctx.from.language_code || "en";

  if (query) {
    const { content } = await getAiFeedbackFromSupabase({
      query,
      rpc_function_name: "match_amazon_documents",
      language_code,
    });
    await ctx.reply(content, { parse_mode: "Markdown" });
    return;
  }
});

eCommerceDevBot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
    throw e;
  } else {
    console.error("Unknown error:", e);
    throw e;
  }
});

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdateECommerceDev(req);
  } catch (err) {
    console.error(err);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/e-commerce-dev' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

// supabase functions deploy e-commerce-dev --no-verify-jwt
