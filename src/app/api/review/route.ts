import { OpenAI } from "openai";
import { REVIEWER_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, files } = await req.json();

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  const codebaseStr = files.map((f: any) => `[${f.path}]\n${f.content}`).join("\n\n");

  const response = await openrouter.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free", // Using Llama 3.3 70B as the senior reviewer
    messages: [
      { role: "system", content: REVIEWER_SYSTEM_PROMPT },
      { role: "user", content: `USER PROMPT: ${prompt}\n\nGENERATED CODEBASE:\n${codebaseStr}` }
    ],
  });

  return Response.json({
    review: response.choices[0]?.message?.content || "Review system currently offline."
  });
}
