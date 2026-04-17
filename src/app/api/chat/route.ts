import { OpenAI } from "openai";
import { GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages, model, files } = await req.json();

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const codebaseView = files && files.length > 0
    ? `INDUSTRIAL CODEBASE STATE:\n${files.map((f: any) => `### FILE: ${f.path}\n${f.content}`).join("\n\n")}`
    : "STATE: NEW_PROJECT_EMPTY";

  const systemMessage = `${GENERATOR_SYSTEM_PROMPT}\n\n${codebaseView}`;

  const response = await openrouter.chat.completions.create({
    model: model || "google/gemini-2.0-flash-001:free",
    messages: [
      { role: "system", content: systemMessage },
      ...messages
    ],
    stream: true,
    temperature: 0.1, // Industrial precision
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content || "";
            controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          console.error("Stream break:", e);
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
}
