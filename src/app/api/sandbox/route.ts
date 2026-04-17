import { Sandbox } from "@vercel/sandbox";

export const dynamic = 'force-dynamic';

type FileItem = {
    path: string
    content: string
}

export async function POST(req: Request) {
  const { files, sandboxName } = await req.json();

  try {
    const name = sandboxName || "open-brainy-default";
    const authConfig = {
      teamId: process.env.VERCEL_TEAM_ID!,
      projectId: process.env.VERCEL_PROJECT_ID!,
      token: process.env.VERCEL_TOKEN!,
    };

    let sandbox;
    try {
      sandbox = await Sandbox.get({ name, ...authConfig });
    } catch {
      sandbox = await Sandbox.create({
        name,
        ...authConfig,
        snapshotExpiration: 14 * 24 * 60 * 60 * 1000,
        resources: { vcpus: 2 } as any, // Cast to handle varying SDK versions
      });
    }

    if (!sandbox) {
      throw new Error("Failed to allocate Brainy compute cluster.");
    }

    if (files && files.length > 0) {
        await sandbox.writeFiles(files.map((f: FileItem) => ({
            path: f.path,
            content: f.content
        })));
    }

    const result = await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "dev"],
      detached: true,
    });

    const domain = sandbox.domain(3000);
    const protocolUrl = domain.startsWith('http') ? domain : `https://${domain}`;

    return Response.json({
      sandboxName: sandbox.name,
      url: protocolUrl,
      status: "industrial_active",
      processId: (result as unknown as { id: string }).id
    });
  } catch (e: unknown) {
    const error = e as Error;
    console.error("Open Brainy Backend Error:", error);
    return Response.json({
        error: "Brainy Backend Cluster Failure",
        message: error.message,
    }, { status: 500 });
  }
}
