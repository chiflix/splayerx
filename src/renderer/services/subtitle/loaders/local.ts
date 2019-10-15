import { cloneDeep } from 'lodash';
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

  private getFormatByExt(subPath: string) {
    let format;
    import('../utils').then((utils) => {
      format = utils.pathToFormat(subPath);
    });
    return format;
  }

  public constructor(subtitlePath: string) {
    this.origin = { type: Type.Local, source: subtitlePath };
    const format = this.getFormatByExt(subtitlePath);
    if (!format) throw new Error(`Unrecongnized subtitle format ${subtitlePath}.`);
    this.format = format;
  }

  public async getDisplaySource() { return cloneDeep(this.origin); }

  public async getRealSource() { return cloneDeep(this.origin); }

  public async getFormat() {
    if (this.format) return this.format;
    const format = this.getFormatByExt(this.origin.source);
    if (!format) throw new Error(`Unrecongnized subtitle format ${this.origin.source}.`);
    this.format = format;
    return this.format;
  }

  public async getLanguage() {
    const utils = await import('../utils');
    return utils.inferLanguageFromPath(this.origin.source);
  }

  public async getHash() {
    const hash = await mediaQuickHash(this.origin.source);
    return (hash || '') as unknown as string;
  }

  public async getDelay() { return 0; }
}
