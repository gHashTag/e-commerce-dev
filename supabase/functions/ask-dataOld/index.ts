import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";

import { oneLine, stripIndent } from "https://esm.sh/common-tags@1.8.2";
import { supabase } from "../_shared/supabase/index.ts";

import { getCompletion, model, tokenizer } from "../_shared/supabase/ai.ts";
import { corsHeaders } from "../_shared/handleCORS.ts";
import { openai } from "../_shared/openai/client.ts";

serve(async (req: Request) => {
  // ask-custom-data logic
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Search query is passed in request payload
  const { query, table_name } = await req.json();
  console.log(query, "query");
  // OpenAI recommends replacing newlines with spaces for best results
  const input = query.replace(/\n/g, " ");
  console.log(input, "input");
  console.log(table_name, "table_name");

  const {
    data: [{ embedding }],
  } = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: input,
    dimensions: 1536,
  });

  // Query embeddings.
  const { data: items, error: itemsError } = await supabase
    .rpc("match_amazon_documents", {
      embedding_vector: JSON.stringify(embedding),
      match_threshold: 0.4,
      match_count: 4,
    })
    .select("id,title,content")
    .limit(4);
  console.log(items, "items");

  // get the relevant documents to our question by using the match_documents
  // rpc: call PostgreSQL functions in supabase

  if (itemsError) {
    console.error(itemsError, "itemsError");
    throw new Response(`Error: ${itemsError}`, {
      status: 400,
      statusText: itemsError.message,
    });
  }
  // documents is going to be all the relevant data to our specific question.

  let tokenCount = 0;
  console.log(tokenCount, "tokenCount");
  let contextText = "";
  console.log(contextText, "contextText");
  // Concat matched documents
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(item, "item");
    const content =
      `${item.title}\n${item.content}\n${item.brand}\n${item.description}`;
    console.log(content, "content");
    const encoded = tokenizer.encode(content);
    console.log(encoded.text.length, "encoded.text.length");
    tokenCount += encoded.text.length;

    // Limit context to max 1500 tokens (configurable)
    if (tokenCount > 1500) {
      throw new Response("Context too long", { status: 400 });
    }

    contextText += `${content.trim()}\n`;
  }

  const prompt = stripIndent`${oneLine`
  You are a neural marketplace assistant! Always answer honestly and be as helpful as possible! Your name is E-commerce Dev and your main task is to help users sell more of their products and help them find hit products on different marketplaces."`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
    """
    Answer as simple text:
  `;
  console.log(prompt, "prompt");
  // get response from gpt-4o model
  const { id, content } = await getCompletion(prompt);

  // return the response from the model to our use through a Response
  return new Response(JSON.stringify({ id, content, items }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// create index if not exists amazon_documents_embedding_idx on public.amazon_documents using hnsw (embedding vector_ip_ops) tablespace pg_default;

// create or replace function match_amazon_documents (
//   query_embedding vector(1536),
//   match_threshold float,
//   match_count int
// )
// returns table (
//   id bigint,
//   title text,
//   content text,
//   description text,
//   brand text,
//   price text,
//   stars text,
//   url text,
//   similarity float
// )
// language plpgsql
// as $$
// begin
//   return query
//   select
//     amazon_documents.id,
//     amazon_documents.title,
//     amazon_documents.content,
//     amazon_documents.description,
//     amazon_documents.brand,
//     amazon_documents.price,
//     amazon_documents.stars,
//     amazon_documents.url,
//     1 - (amazon_documents.embedding <=> query_embedding) as similarity
//   from amazon_documents
//   where 1 - (amazon_documents.embedding <=> query_embedding) > match_threshold
//   order by similarity desc
//   limit match_count;
// end;
// $$;

// supabase functions deploy ask-data --no-verify-jwt
