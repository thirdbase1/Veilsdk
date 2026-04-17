import { Sandbox } from "@vercel/sandbox";

export async function POST(req: Request) {
  const { code, sandboxId } = await req.json();

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

  await sandbox.writeFiles([{
    path: "src/app/page.tsx",
    content: code,
  }]);

  const buildResult = await sandbox.runCommand({
    cmd: "npm",
    args: ["run", "build"],
  });

  return Response.json({
    url: sandbox.domain(3000),
    logs: buildResult.stdout,
    error: buildResult.exitCode !== 0 ? buildResult.stderr : null,
    needsFix: buildResult.exitCode !== 0,
  });
}
