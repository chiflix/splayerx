import { CacheFile } from "@/libs/file";

export interface IFileStorable {
  readFile(path: string): Promise<Buffer | null>
  readDir(path: string): Promise<string[] | null>
  writeFile(path: string, content: Buffer): Promise<boolean>
  createDir(path: string): Promise<boolean>
  removeDir(path: string): Promise<boolean>
  removeFile(path: string): Promise<boolean>
}

export class Storage {
  protected file: CacheFile
  constructor(ICacheFile: CacheFile) {
    this.file = ICacheFile
  }
}