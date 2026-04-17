import { Sandbox } from "@vercel/sandbox";

export const dynamic = 'force-dynamic';

type FileItem = {
    path: string
    content: string
}

export async function POST(req: Request) {
  const { files, sandboxId } = await req.json();

  try {
    let sandbox;

    if (sandboxId) {
      sandbox = await Sandbox.get(sandboxId);
    } else {
      // In the stable @vercel/sandbox SDK, templates are used via 'snapshot'
      // or standard 'git' depending on the version.
      // We will cast to any to handle type inconsistencies in recent beta versions.
      sandbox = await Sandbox.create({
        source: {
          type: "git" as any,
          url: "https://github.com/vercel/sandbox-example-next.git",
        },
        resources: { vcpus: 2, memory: 2048 },
        ports: [3000],
      } as any);
    }

    if (!sandbox) {
      return Response.json({ error: "Open Brainy could not allocate compute resources." }, { status: 500 });
    }

    // Synchronize the entire codebase
    if (files && files.length > 0) {
        await sandbox.writeFiles(files.map((f: FileItem) => ({
            path: f.path,
            content: f.content
        })));
    }

    // Run the development server
    const result = await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "dev"],
      detached: true,
    });

    return Response.json({
      sandboxId: (sandbox as any).id || (sandbox as any).sandboxId || sandboxId,
      url: sandbox.domain(3000),
      status: "ready",
      processId: (result as any).id
    });
  } catch (error: any) {
    console.error("Multi-file Sandbox Sync Error:", error);
    return Response.json({
        error: error.message,
        details: "Ensure your VERCEL_OIDC_TOKEN is valid for high-performance compute."
    }, { status: 500 });
  }
}
