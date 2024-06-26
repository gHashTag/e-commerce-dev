import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

import { oneLine, stripIndent } from "https://esm.sh/common-tags@1.8.2";
import { supabase } from "../_shared/supabase/index.ts";

import { getCompletion, model, tokenizer } from "../_shared/supabase/ai.ts";
import { corsHeaders } from "../_shared/handleCORS.ts";

serve(async (req: Request) => {
  // ask-custom-data logic
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Search query is passed in request payload
  const { query, rpc_function_name, language_code } = await req.json();
  console.log(query, "query");
  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, " ");
  console.log(input, "input");
  console.log(rpc_function_name, "rpc_function_name");

  const embedding = await model.run(input, {
    mean_pool: true,
    normalize: true,
  });
  console.log(embedding, "embedding");

  // Query embeddings.
  const { data: items, error: itemsError } = await supabase
    .rpc(rpc_function_name, {
      embedding_vector: JSON.stringify(embedding),
      match_threshold: 0.8,
      match_count: 4,
    })
    .select("*")
    .limit(4);
  // console.log(items, "items");

  // get the relevant documents to our question by using the match_documents
  // rpc: call PostgreSQL functions in supabase

  if (itemsError) {
    throw new Response(
      `Error: ${itemsError.details}\n\n${itemsError.message}\n\n${itemsError.hint}`,
      {
        status: 400,
        statusText: itemsError.message,
      },
    );
  }
  // documents is going to be all the relevant data to our specific question.

  let tokenCount = 0;
  // console.log(tokenCount, "tokenCount");
  let contextText = "";
  // console.log(contextText, "contextText");
  // Concat matched documents
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // console.log(item, "item");
    const content = `${item.title}\n${item.url}`;
    // console.log(content, "content");
    const encoded = tokenizer.encode(content);
    // console.log(encoded.text.length, "encoded.text.length");
    tokenCount += encoded.text.length;

    // Limit context to max 1500 tokens (configurable)
    if (tokenCount > 100000) {
      throw new Response("Context too long", { status: 400 });
    }

    contextText += `${content.trim()}\n`;
  }
  // console.log(language_code, "language_code");
  const prompt = stripIndent`${oneLine`
  You are a neural marketplace assistant, seler and stylist! Always answer honestly and be as helpful as possible! Your name is E-commerce Dev and your main task is to help users sell more of their products and help them find hit products on different marketplaces. Respond in ${language_code} language."`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
    """
    Answer as simple text without any links:
  `;
  // console.log(prompt, "prompt");
  // get response from gpt-4o model
  const { id, content } = await getCompletion(prompt);
  console.log(content, "content");
  // return the response from the model to our use through a Response
  return new Response(JSON.stringify({ id, content, items }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// -- Adding a new column 'embedding' of type 'vector(384)' to the table 'amazon_documents'
// ALTER TABLE public.amazon_documents
// ADD COLUMN embedding vector (384);

// create index if not exists amazon_documents_embedding_idx on public.amazon_documents using hnsw (embedding vector_ip_ops) tablespace pg_default;

// -- Supabase AI is experimental and may produce incorrect answers
// -- Always verify the output before executing

// drop function if exists match_allegro_documents (vector (384), float, int);

// CREATE OR REPLACE FUNCTION match_allegro_documents (
//   embedding_vector vector (384),
//   match_threshold FLOAT,
//   match_count INT
// ) RETURNS SETOF allegro_documents LANGUAGE plpgsql AS $$
// begin
//   return query
//   select t.*
//   from allegro_documents t
//   where t.embedding <#> embedding_vector < -match_threshold
//   order by t.embedding <#> embedding_vector
//   limit match_count;
// end;
// $$;

// supabase functions deploy ask-data --no-verify-jwt
