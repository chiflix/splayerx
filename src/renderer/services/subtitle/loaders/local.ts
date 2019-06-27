import { pathToFormat, loadLocalFile } from '../utils';
import { inferLanguageFromPath } from '../utils';
import { Origin, Type, EntityGenerator, Format } from '@/interfaces/ISubtitle';
import helpers from '@/helpers';

interface LocalOrigin extends Origin {
  type: Type.Local,
  source: string;
}
export class LocalGenerator implements EntityGenerator {
  private origin: LocalOrigin;
  private format: Format;
  constructor(subtitlePath: string) {
    this.origin = { type: Type.Local, source: subtitlePath };
    const format = pathToFormat(subtitlePath);
    if (!format) throw new Error(`Unrecongnized subtitle format ${subtitlePath}.`);
    this.format = format;
  }

  async getSource() { return this.origin; }
  async getType() { return Type.Local; }
  async getFormat() {
    if (this.format) return this.format;
    const format = pathToFormat(this.origin.source);
    if (!format) throw new Error(`Unrecongnized subtitle format ${this.origin.source}.`);
    return this.format = format;
  }
  async getLanguage() {
    return inferLanguageFromPath(this.origin.source);
  }
  async getPayload() {
    return loadLocalFile(this.origin.source);
  }
  async getHash() {
    return helpers.methods.mediaQuickHash(this.origin.source);
  }
}
