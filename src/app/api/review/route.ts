import { OpenRouter } from "@openrouter/sdk";
import { REVIEWER_SYSTEM_PROMPT } from "@/lib/prompts";

export const dynamic = 'force-dynamic';

interface FileItem {
  path: string;
  content: string;
}

interface ReviewRequest {
  prompt: string;
  files: FileItem[];
}

export async function POST(req: Request) {
  const { prompt, files } = await req.json() as ReviewRequest;

  console.log("[v0] Review API called for prompt:", prompt.substring(0, 50));
  console.log("[v0] Files to review:", files?.length || 0);

  try {
    const openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const codebaseStr = files.map((f: FileItem) => `[${f.path}]\n${f.content}`).join("\n\n");

    console.log("[v0] Calling OpenRouter for review with model: nvidia/nemotron-3-super-120b-a12b:free");

    const response = await openrouter.chat.send({
      chatRequest: {
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        messages: [
          { role: "system", content: REVIEWER_SYSTEM_PROMPT },
          { role: "user", content: `USER PROMPT: ${prompt}\n\nGENERATED CODEBASE:\n${codebaseStr}` }
        ],
      }
    });

    console.log("[v0] Review response received");
    const review = response.choices[0]?.message?.content || "Review system currently offline.";
    console.log("[v0] Review content:", review.substring(0, 100));

    return Response.json({
      review
    });
  } catch (error) {
    const err = error as Error;
    console.error("[v0] Review API error:", err);
    return Response.json({
      review: "Senior review temporarily unavailable. Code generation proceeding."
    });
  }
}
