import { OpenAI } from "openai";
import { GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages, model, files } = await req.json();

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy",
  });

  // Inject current codebase context into the system message
  const codebaseCtx = files && files.length > 0
    ? `CURRENT CODEBASE:\n${files.map((f: any) => `[${f.path}]\n${f.content}`).join("\n\n")}`
    : "The codebase is currently empty.";

  const systemMessage = `${GENERATOR_SYSTEM_PROMPT}\n\n${codebaseCtx}`;

  const response = await openrouter.chat.completions.create({
    model: model || "google/gemini-2.0-flash-001:free",
    messages: [
      { role: "system", content: systemMessage },
      ...messages
    ],
    stream: true,
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
