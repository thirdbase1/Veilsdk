import { OpenAI } from "openai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "dummy_key",
  });

  const { messages, model } = await req.json();

  const response = await openrouter.chat.completions.create({
    model: model || "google/gemini-2.0-flash-001:free",
    messages,
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
