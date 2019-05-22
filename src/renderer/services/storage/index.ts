export interface ICacheFileStorable {
  getPathBy(mediaHash: string): string
  readDirBy(mediaHash: string): Promise<string[] | null>
  createDirBy(mediaHash: string): Promise<boolean>
  removeDirBy(mediaHash: string): Promise<boolean>
  writeFile(path: string, content: Buffer): Promise<boolean>
  readFile(path: string): Promise<Buffer | null>
  removeFile(path: string): Promise<boolean>
}
