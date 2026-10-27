import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { CliApplication } from "./CliApplication.js";

const readline = createInterface({ input, output, prompt: "svg> " });
const app = new CliApplication();

console.log("svg-editor 0.1 - type 'help' for commands");
readline.prompt();

for await (const line of readline) {
  const command = line.trim();
  if (command === "exit" || command === "quit") break;

  for (const outputLine of app.executeLine(line)) console.log(outputLine);
  readline.prompt();
}

readline.close();
