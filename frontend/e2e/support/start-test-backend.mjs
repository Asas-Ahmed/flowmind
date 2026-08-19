import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const frontendDir = process.cwd();
const backendDir = path.resolve(frontendDir, "..", "backend");
const windowsPython = path.join(backendDir, ".venv", "Scripts", "python.exe");
const unixPython = path.join(backendDir, ".venv", "bin", "python");

const python = process.platform === "win32" ? windowsPython : unixPython;

if (!existsSync(python)) {
  console.error(`FlowMind E2E backend could not find the virtualenv Python at: ${python}`);
  console.error("Create/activate backend/.venv and install backend requirements first.");
  process.exit(1);
}

const child = spawn(
  python,
  ["-m", "uvicorn", "tests.e2e_server:app", "--host", "localhost", "--port", "8010"],
  {
    cwd: backendDir,
    stdio: "inherit",
    env: { ...process.env },
  },
);

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));
child.on("exit", (code) => process.exit(code ?? 0));
