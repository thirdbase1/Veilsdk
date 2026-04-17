import { OpenRouter } from "@openrouter/sdk";
import { REVIEWER_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, files } = await req.json();

  const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const codebaseStr = files.map((f: any) => `[${f.path}]\n${f.content}`).join("\n\n");

  const response = await openrouter.chat.send({
    chatRequest: {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
            { role: "system", content: REVIEWER_SYSTEM_PROMPT },
            { role: "user", content: `USER PROMPT: ${prompt}\n\nGENERATED CODEBASE:\n${codebaseStr}` }
        ],
    }
  });

  return Response.json({
    review: response.choices[0]?.message?.content || "Review system currently offline."
  });
}
