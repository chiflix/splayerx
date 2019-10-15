import { cloneDeep } from 'lodash';
import { pathToFormat, inferLanguageFromPath } from '../utils';

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

  public constructor(subtitlePath: string) {
    this.origin = { type: Type.Local, source: subtitlePath };
    const format = pathToFormat(subtitlePath);
    if (!format) throw new Error(`Unrecongnized subtitle format ${subtitlePath}.`);
    this.format = format;
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

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

  public async getHash() {
    const hash = await mediaQuickHash(this.origin.source);
    return (hash || '') as unknown as string;
  }

  public async getDelay() { return 0; }
}
