import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

const readline = createInterface({ input, output, prompt: "svg> " });

console.log("svg-editor 0.1 - type 'help' for commands");
readline.prompt();

for await (const line of readline) {
  const command = line.trim();

  if (command.length === 0 || command.startsWith("#")) {
    readline.prompt();
    continue;
  }

  if (command === "exit" || command === "quit") break;

  if (command === "help") {
    console.log(
      [
        "Document: init, read, save, canvas",
        "Edit: create, delete, move, scale, set, group, ungroup, addto, front, back",
        "View: tree, show, help",
        "History: undo, redo",
        "Session: exit, quit",
        "",
        "Day 1 status: the REPL and domain model are ready; editing commands start on Day 2.",
      ].join("\n"),
    );
  } else {
    console.log(`error: command not implemented yet: ${command.split(/\s+/)[0]}`);
  }

  readline.prompt();
}

readline.close();
