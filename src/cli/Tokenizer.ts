export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoted = false;
  let escaping = false;

  const source = input.trim();
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (escaping) {
      current += character;
      escaping = false;
    } else if (quoted && character === "\\") {
      const next = source[index + 1];
      if (next === '"' || next === "\\") {
        escaping = true;
      } else {
        current += character;
      }
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
