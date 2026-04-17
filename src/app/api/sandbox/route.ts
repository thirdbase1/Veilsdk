import { Sandbox } from "@vercel/sandbox";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { code, sandboxId } = await req.json();

  try {
    let sandbox;

    if (sandboxId) {
      sandbox = await Sandbox.get(sandboxId);
    } else {
      // Initialize a new sandbox with a specialized template for Next.js
      sandbox = await Sandbox.create({
        source: {
          type: "git",
          url: "https://github.com/vercel/sandbox-example-next.git",
        },
        resources: { vcpus: 2 },
        ports: [3000],
      });
    }

    if (!sandbox) {
      return Response.json({ error: "Failed to initialize or retrieve sandbox." }, { status: 500 });
    }

    // Write the generated code to the primary entry point
    await sandbox.writeFiles([{
      path: "src/app/page.tsx",
      content: code,
    }]);

    // Track the process and logs
    const result = await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "dev"],
      detached: true,
    });

    // Provide the live URL and sandbox identifier
    return Response.json({
      sandboxId: (sandbox as any).id || (sandbox as any).sandboxId || sandboxId,
      url: sandbox.domain(3000),
      status: "running",
      processId: (result as any).id
    });
  } catch (error: any) {
    console.error("Vercel Sandbox execution error:", error);
    return Response.json({
        error: error.message,
        details: "Check your VERCEL_OIDC_TOKEN or network connectivity."
    }, { status: 500 });
  }
}
