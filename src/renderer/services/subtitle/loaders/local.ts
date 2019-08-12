import { cloneDeep } from 'lodash';
import { pathToFormat, loadLocalFile, inferLanguageFromPath } from '../utils';

import {
  IOrigin, Type, IEntityGenerator, Format,
} from '@/interfaces/ISubtitle';
import { mediaQuickHash } from '@/libs/utils';

interface ILocalOrigin extends IOrigin {
  type: Type.Local,
  source: string;
}
export class LocalGenerator implements IEntityGenerator {
  private origin: ILocalOrigin;

  private format: Format;

  private type = Type.Local;

  public constructor(subtitlePath: string) {
    this.origin = { type: Type.Local, source: subtitlePath };
    const format = pathToFormat(subtitlePath);
    if (!format) throw new Error(`Unrecongnized subtitle format ${subtitlePath}.`);
    this.format = format;
  }

  public async getSource() { return cloneDeep(this.origin); }

  public async getType() { return this.type; }

  public async getFormat() {
    if (this.format) return this.format;
    const format = pathToFormat(this.origin.source);
    if (!format) throw new Error(`Unrecongnized subtitle format ${this.origin.source}.`);
    this.format = format;
    return this.format;
  }

  public async getLanguage() {
    return inferLanguageFromPath(this.origin.source);
  }

  private payload: string;

  public async getPayload() {
    if (!this.payload) this.payload = await loadLocalFile(this.origin.source);
    return this.payload;
  }

  public async getHash() {
    const hash = await mediaQuickHash(this.origin.source);
    return (hash || '') as unknown as string;
  }
}
