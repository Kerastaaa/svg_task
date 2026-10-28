export function escapeSvg(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function optionalAttribute(name: string, value: string | number | undefined): string {
  return value === undefined ? "" : ` ${name}="${escapeSvg(String(value))}"`;
}

export function parseNumberAttribute(name: string, value: string | undefined): number {
  if (value === undefined) throw new Error(`attribute cannot be removed: ${name}`);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`invalid number for ${name}: ${value}`);
  return number;
}
