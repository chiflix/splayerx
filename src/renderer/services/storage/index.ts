import { CacheFile, VideoInfo } from "@/libs/cacheFile";

export interface IFileStorable {
  generate(mediaHash: string, tag: string): Promise<string|null>
  read(mediaHash: string): Promise<VideoInfo|null>
  remove(mediaHash: string): Promise<boolean>
  clear(): Promise<boolean>
}

export class Storage {
  protected file: CacheFile
  constructor(ICacheFile: CacheFile) {
    this.file = ICacheFile
  }
}