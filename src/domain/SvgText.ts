export function escapeSvg(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function optionalAttribute(name: string, value: string | undefined): string {
  return value === undefined ? "" : ` ${name}="${escapeSvg(value)}"`;
}

export function parseNumberAttribute(name: string, value: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`invalid number for ${name}: ${value}`);
  return number;
}
