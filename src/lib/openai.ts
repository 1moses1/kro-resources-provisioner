import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat";

/**
 * Calls the OpenAI ChatCompletion API.
 * Uses the provided API key and model.
 */
export async function askOpenAI({
  apiKey,
  model,
  messages,
}: {
  apiKey: string;
  model: string;
  messages: ChatCompletionMessageParam[];
}): Promise<string> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  });

  const choice = response.choices[0];
  return choice?.message?.content ?? "";
}
