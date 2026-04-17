import { OpenRouter } from "@openrouter/sdk";
import { GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

interface ChatStreamDelta {
  content?: string | null;
  reasoning?: string | null;
}

interface ChatStreamChoice {
  delta: ChatStreamDelta;
}

interface ChatStreamChunk {
  choices: ChatStreamChoice[];
}

export async function POST(req: Request) {
  const { messages, model, files } = (await req.json()) as {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    model?: string;
    files?: { path: string; content: string }[];
  };

  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY || "",
  });

  const codebaseView = files && files.length > 0
    ? `INDUSTRIAL CODEBASE STATE:\n${files.map((f) => `### FILE: ${f.path}\n${f.content}`).join("\n\n")}`
    : "STATE: NEW_PROJECT_EMPTY";

  const systemMessage = `${GENERATOR_SYSTEM_PROMPT}\n\n${codebaseView}`;

  const response = await openrouter.chat.send({
    chatRequest: {
        model: model || "google/gemini-2.0-flash-001:free",
        messages: [
            { role: "system", content: systemMessage },
            ...messages
        ],
        stream: true,
    }
  });

  return new Response(
    new ReadableStream({
      async start(controller: ReadableStreamDefaultController) {
        const encoder = new TextEncoder();
        try {
          const stream = response as unknown as AsyncIterable<ChatStreamChunk>;
          if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta;
              const text = delta?.content || "";
              const reasoning = delta?.reasoning || "";

              if (reasoning) {
                controller.enqueue(encoder.encode(`<thinking>${reasoning}</thinking>`));
              }
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          } else {
            const staticResponse = response as unknown as { choices: { message: { content: string } }[] };
            const text = staticResponse.choices?.[0]?.message?.content || "";
            controller.enqueue(encoder.encode(text));
          }
        } catch (e: unknown) {
          const error = e as Error;
          if (error.name === 'AbortError') {
              console.log("Stream aborted by user");
          } else {
              console.error("Stream break:", error);
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
