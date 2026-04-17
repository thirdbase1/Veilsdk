import { OpenRouter } from "@openrouter/sdk";
import { REVIEWER_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

const REVIEW_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "x-ai/grok-code-fast-1",
  "google/gemini-2.0-flash-001:free" // Final fallback
];

export async function POST(req: Request) {
  const { prompt, files } = (await req.json()) as {
    prompt: string;
    files: { path: string; content: string }[];
  };

  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const codebaseStr = files.map((f) => `[${f.path}]\n${f.content}`).join("\n\n");

  for (const model of REVIEW_MODELS) {
    try {
      const response = await openrouter.chat.send({
        chatRequest: {
            model,
            messages: [
                { role: "system", content: REVIEWER_SYSTEM_PROMPT },
                { role: "user", content: `USER PROMPT: ${prompt}\n\nGENERATED CODEBASE:\n${codebaseStr}` }
            ],
            stream: false,
        }
      }) as { choices: { message: { content: string } }[] };

      const content = response.choices[0]?.message?.content;
      if (content) {
        return Response.json({ review: content, modelUsed: model });
      }
    } catch (e) {
      console.error(`Review failed for model ${model}:`, e);
      continue; // Try next model
    }
  }

  return Response.json({
    review: "Review system currently offline."
  });
}
