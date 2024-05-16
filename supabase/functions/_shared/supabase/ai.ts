import { model_ai } from "../constants.ts";
import { openai } from "../openai/client.ts";
import GPT3Tokenizer from "https://esm.sh/gpt3-tokenizer@1.1.5";
import { getAiFeedbackT, getAiSupabaseFeedbackT } from "../types/index.ts";
import { supabase } from "./index.ts";

export const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

export const model = new Supabase.ai.Session("gte-small");

export const getCompletion = async (prompt: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: model_ai,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    return {
      id: response.id,
      content: response.choices[0].message.content,
      error: null,
    };
  } catch (error) {
    console.error("Error getting completion:", error);
    throw error;
  }
};

export async function getAiFeedback(
  { query, endpoint, token }: getAiFeedbackT,
) {
  const response = await fetch(
    endpoint,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ question: query }),
    },
  );
  console.log(response, "response");
  const result = await response.json();
  return result.text;
}

interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function getAiFeedbackFromSupabase(
  { query, table_name }: getAiSupabaseFeedbackT,
): Promise<{ content: string; items: any; data: any }> {
  try {
    const { data: dataItems } = await supabase.functions.invoke("ask-data", {
      body: JSON.stringify({ query, table_name }),
    });

    console.log(dataItems, "dataItems");
    return {
      content: dataItems.dataItems,
      items: dataItems.items,
      data: dataItems.data,
    };
  } catch (error) {
    throw new Error(`Error receiving AI response: ${error}`);
  }
}
