import { Sandbox } from "@vercel/sandbox";

export const dynamic = 'force-dynamic';

type FileItem = {
    path: string
    content: string
}

interface AuthConfig {
  teamId: string;
  projectId: string;
  token: string;
}

interface SandboxRequest {
  files: FileItem[];
  sandboxName?: string;
}

interface CommandResult {
  id?: string;
}

export async function POST(req: Request) {
  const { files, sandboxName } = await req.json() as SandboxRequest;

  console.log("[v0] Sandbox API called");
  console.log("[v0] Files to sync:", files?.length || 0);
  console.log("[v0] Sandbox name:", sandboxName);

  try {
    const name = sandboxName || "open-brainy-default";
    const authConfig: AuthConfig = {
      teamId: process.env.VERCEL_TEAM_ID!,
      projectId: process.env.VERCEL_PROJECT_ID!,
      token: process.env.VERCEL_TOKEN!,
    };

    console.log("[v0] Auth config ready");

    let sandbox;
    try {
      console.log("[v0] Attempting to get existing sandbox:", name);
      sandbox = await Sandbox.get({ name, ...authConfig });
      console.log("[v0] Got existing sandbox");
    } catch {
      console.log("[v0] Creating new sandbox:", name);
      sandbox = await Sandbox.create({
        name,
        ...authConfig,
        snapshotExpiration: 14 * 24 * 60 * 60 * 1000,
        resources: { vcpus: 2 },
      });
      console.log("[v0] New sandbox created");
    }

    if (!sandbox) {
      throw new Error("Failed to allocate Brainy compute cluster.");
    }

    console.log("[v0] Sandbox active, syncing files...");

    if (files && files.length > 0) {
      await sandbox.writeFiles(files.map((f: FileItem) => ({
        path: f.path,
        content: f.content
      })));
      console.log("[v0] Files synced successfully");
    }

    console.log("[v0] Starting dev server...");
    const result = await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "dev"],
      detached: true,
    }) as CommandResult;
    console.log("[v0] Dev server started, process:", result.id);

    const domain = sandbox.domain(3000);
    const protocolUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    console.log("[v0] Sandbox domain:", protocolUrl);

    return Response.json({
      sandboxName: sandbox.name,
      url: protocolUrl,
      status: "industrial_active",
      processId: result.id
    });
  } catch (error) {
    const err = error as Error;
    console.error("[v0] Sandbox error:", err);
    console.error("[v0] Error message:", err.message);
    return Response.json({
      error: "Brainy Backend Cluster Failure",
      message: err.message,
    }, { status: 500 });
  }
}
