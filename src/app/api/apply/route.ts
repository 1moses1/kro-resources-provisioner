import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  try {
    const { manifest } = await req.json();
    if (!manifest || typeof manifest !== "string") {
      return NextResponse.json({ error: "No manifest provided" }, { status: 400 });
    }

    // Spawn kubectl apply -f - and pipe the manifest into its stdin
    const child = spawn("kubectl", ["apply", "-f", "-"]);

    let output = "";
    let errorOutput = "";

    // Capture stdout and stderr
    child.stdout.on("data", (data) => {
      output += data.toString();
    });
    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Send the manifest to stdin and close it
    child.stdin.write(manifest);
    child.stdin.end();

    // Wait for the process to complete
    const exitCode: number = await new Promise((resolve) => {
      child.on("close", resolve);
    });

    if (exitCode !== 0) {
      // kubectl returned an error
      const message = errorOutput || output || `kubectl exited with code ${exitCode}`;
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }

    return NextResponse.json({ success: true, output });
  } catch (err) {
    console.error("Error applying manifest:", err);
    return NextResponse.json({ success: false, error: "Failed to apply manifest" }, { status: 500 });
  }
}
// This code handles POST requests to apply Kubernetes manifests using kubectl.
// It reads the manifest from the request body, spawns a child process to run `kubectl apply -f -`,
// and pipes the manifest into its stdin. It captures stdout and stderr, and returns the result as JSON.
// If the command fails, it returns an error message with the output from kubectl.