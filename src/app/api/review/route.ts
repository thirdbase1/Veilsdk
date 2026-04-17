import { OpenAI } from "openai";
import { REVIEWER_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, code } = await req.json();

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      { role: "system", content: REVIEWER_SYSTEM_PROMPT },
      { role: "user", content: `Original Prompt: ${prompt}\n\nGenerated Code:\n${code}` }
    ],
  });

  return Response.json({
    review: response.choices[0]?.message?.content || "No review available."
  });
}
