import { OpenRouter } from "@openrouter/sdk";
import { GENERATOR_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

interface FileItem {
  path: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChunkChoice {
  delta?: {
    content?: string;
    reasoning?: string;
  };
}

interface StreamChunk {
  choices?: ChunkChoice[];
}

export async function POST(req: Request) {
  const { messages, model, files } = await req.json() as { messages: ChatMessage[]; model: string; files: FileItem[] };

  console.log("[v0] Chat API called with model:", model);
  console.log("[v0] Messages count:", messages.length);
  console.log("[v0] Files count:", files?.length || 0);

  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const codebaseView = files && files.length > 0
    ? `INDUSTRIAL CODEBASE STATE:\n${files.map((f: FileItem) => `### FILE: ${f.path}\n${f.content}`).join("\n\n")}`
    : "STATE: NEW_PROJECT_EMPTY";

  const systemMessage = `${GENERATOR_SYSTEM_PROMPT}\n\n${codebaseView}`;

  try {
    console.log("[v0] Creating OpenRouter stream with model:", model);
    
    const stream = await openrouter.chat.send({
      chatRequest: {
        model: model || "x-ai/grok-code-fast-1",
        messages: [
          { role: "system", content: systemMessage },
          ...messages
        ],
        stream: true,
      }
    });

    console.log("[v0] Stream created successfully");

    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          let chunkCount = 0;
          try {
            for await (const chunk of stream as AsyncIterable<StreamChunk>) {
              chunkCount++;
              console.log(`[v0] Received chunk ${chunkCount}:`, JSON.stringify(chunk).substring(0, 200));
              
              const text = chunk.choices?.[0]?.delta?.content || "";
              const reasoning = chunk.choices?.[0]?.delta?.reasoning || "";

              if (reasoning) {
                console.log("[v0] Reasoning block:", reasoning.substring(0, 100));
                controller.enqueue(encoder.encode(`<thinking>${reasoning}</thinking>`));
              }
              if (text) {
                console.log("[v0] Content chunk:", text.substring(0, 100));
                controller.enqueue(encoder.encode(text));
              }
            }
            console.log("[v0] Stream completed. Total chunks:", chunkCount);
          } catch (e) {
            const error = e as Error & { name?: string; statusCode?: number };
            console.error("[v0] Stream error:", error);
            if (error.name === 'AbortError') {
              console.log("[v0] Stream aborted by user");
            } else {
              const errorMsg = error.statusCode === 429 
                ? "Rate limit reached on OpenRouter. Please add credits to your OpenRouter account to continue using the models."
                : `Error generating response: ${error.message}`;
              console.error("[v0] Sending error to client:", errorMsg);
              controller.enqueue(encoder.encode(`\n\n[ERROR]: ${errorMsg}`));
            }
          } finally {
            controller.close();
            console.log("[v0] Stream closed");
          }
        },
      }),
      {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  } catch (e) {
    const error = e as Error;
    console.error("[v0] API initialization error:", error);
    const errorMessage = error.message || "Failed to initialize chat stream";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
