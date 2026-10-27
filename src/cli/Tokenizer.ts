export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoted = false;
  let escaping = false;

  for (const character of input.trim()) {
    if (escaping) {
      current += character;
      escaping = false;
    } else if (quoted && character === "\\") {
      escaping = true;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (/\s/.test(character) && !quoted) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += character;
    }
  }

  if (escaping || quoted) throw new Error("unterminated quoted argument");
  if (current.length > 0) tokens.push(current);
  return tokens;
}
