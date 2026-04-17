import { OpenRouter } from "@openrouter/sdk";
import { GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { messages, model, files } = await req.json();

  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const codebaseView = files && files.length > 0
    ? `INDUSTRIAL CODEBASE STATE:\n${files.map((f: any) => `### FILE: ${f.path}\n${f.content}`).join("\n\n")}`
    : "STATE: NEW_PROJECT_EMPTY";

  const systemMessage = `${GENERATOR_SYSTEM_PROMPT}\n\n${codebaseView}`;

  const stream = await openrouter.chat.send({
    chatRequest: {
        model: model || "google/gemini-2.0-flash-001:free",
        messages: [
            { role: "system", content: systemMessage },
            ...messages
        ],
        stream: true,
        // Using the documented reasoning parameter from the SDK source
        reasoning: {
            summary: "high" as any // "high" | "low" | "none" based on SDK enums
        }
    }
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            // SDK might handle reasoning in delta
            const reasoning = (chunk.choices[0]?.delta as any)?.reasoning || "";

            if (reasoning) {
              controller.enqueue(encoder.encode(`<thinking>${reasoning}</thinking>`));
            }
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (e: any) {
          if (e.name === 'AbortError') {
              console.log("Stream aborted by user");
          } else {
              console.error("Stream break:", e);
          }
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
