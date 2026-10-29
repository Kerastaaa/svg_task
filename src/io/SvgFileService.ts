import { readFileSync, writeFileSync } from "node:fs";
import type { DocumentModel } from "../domain/Document.js";
import { SvgParser, type SvgParseResult } from "./SvgParser.js";
import { SvgSerializer } from "./SvgSerializer.js";

export class SvgFileService {
  private readonly parser = new SvgParser();
  private readonly serializer = new SvgSerializer();

  read(path: string): SvgParseResult {
    let source: string;
    try {
      source = readFileSync(path, "utf8");
    } catch {
      throw new Error(`cannot read file: ${path}`);
    }
    return this.parser.parse(source);
  }

  save(path: string, document: DocumentModel): number {
    try {
      writeFileSync(path, this.serializer.serialize(document), "utf8");
    } catch {
      throw new Error(`cannot write file: ${path}`);
    }
    return this.serializer.countElements(document);
  }
}
