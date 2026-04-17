import { Sandbox } from "@vercel/sandbox";

export async function POST(req: Request) {
  const { code, sandboxId } = await req.json();

  try {
    let sandbox;

    if (sandboxId) {
      sandbox = await Sandbox.get(sandboxId);
    } else {
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
      return Response.json({ error: "Failed to initialize sandbox" }, { status: 500 });
    }

    // Update the main page code
    await sandbox.writeFiles([{
      path: "src/app/page.tsx",
      content: code,
    }]);

    // Start dev server in detached mode if it's a new sandbox or ensure it's running
    // In a real agent app, we might check if 'npm run dev' is already active
    await sandbox.runCommand({
      cmd: "npm",
      args: ["run", "dev"],
      detached: true,
    });

    // Wait a brief moment for the dev server to start
    // In a production app, we would poll the domain until it responds 200

    return Response.json({
      sandboxId: (sandbox as any).id || (sandbox as any).sandboxId,
      url: sandbox.domain(3000),
    });
  } catch (error: any) {
    console.error("Sandbox error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
