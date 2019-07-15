import { cloneDeep } from 'lodash';
import { pathToFormat, loadLocalFile, inferLanguageFromPath } from '../utils';

import {
  Origin, Type, EntityGenerator, Format,
} from '@/interfaces/ISubtitle';
import { mediaQuickHash } from '@/libs/utils';

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

  async getSource() { return cloneDeep(this.origin); }

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

  private payload: string;

  async getPayload() {
    if (!this.payload) this.payload = await loadLocalFile(this.origin.source);
    return this.payload;
  }

  async getHash() {
    return mediaQuickHash(this.origin.source);
  }
}
