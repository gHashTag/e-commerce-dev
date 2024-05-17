// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { openai } from "../_shared/openai/client.ts";
import { model } from "../_shared/supabase/ai.ts";
import { supabase } from "../_shared/supabase/index.ts";

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  try {
    const { table_name } = await req.json();
    const { data, error } = await supabase
      .from(table_name)
      .select("*");

    console.log(error, "error");
    if (data) {
      for (const item of data) {
        // console.log("item.title", item.title);
        // console.log(content, "content");
        // console.log(item, "item");
        // console.log(item.embedding, "item.embedding");
        // console.log(item.embedding === null, "item.embedding === null");

        if (
          item.embedding === null
        ) {
          // console.log(item.id, "item.id");
          // Generate embedding
          const newEmbedding = await model.run(item.content, {
            mean_pool: true,
            normalize: true,
          });
          // console.log(newEmbedding, "newEmbedding");
          // Store in DB
          const { data, error } = await supabase.from(table_name)
            .update({
              embedding: JSON.stringify(newEmbedding),
            }).eq(
              "id",
              item.id,
            ).select("*").single();
          // console.log(data.title, "data.title");
          console.log(data.id, "data.id");
          // console.log("Embedding is empty or contains only zeros");
        } else {
          console.log("Found with embedding");
        }
      }
    } else {
      return new Response("No data found", { status: 404 });
    }
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify(error),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response("Endpoint not found", {
    status: 404,
  });
});

// https://supabase.com/blog/openai-embeddings-postgres-vector

// -- Adding a new column 'embedding' of type 'vector(384)' to the table 'amazon_documents'
// ALTER TABLE public.amazon_documents
// ADD COLUMN embedding vector (384);
// alter table amazon_documents enable row level security;
// create index on amazon_documents using hnsw (embedding vector_ip_ops);

//---
// drop function if exists match_amazon_documents (vector (384), float, int);

// create or replace function match_amazon_documents (
//   embedding_vector vector(384),
//   match_threshold float,
//   match_count int
// )
// returns table (
//   id bigint,
//   title text,
//   description text,
//   content text,
//   url text,
//   brand text,
//   similarity float
// )
// language plpgsql
// as $$
// begin
//   return query
//   select
//     amazon_documents.id,
//     amazon_documents.title,
//     amazon_documents.description,
//     amazon_documents.content,
//     amazon_documents.url,
//     amazon_documents.brand,
//     1 - (amazon_documents.embedding <=> embedding_vector) as similarity
//   from amazon_documents
//   where 1 - (amazon_documents.embedding <=> embedding_vector) > match_threshold
//   order by similarity desc
//   limit match_count;
// end;
// $$;

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-new-embedding' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
// supabase functions deploy create-new-embedding --no-verify-jwt
