export interface IBrowsingDownload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDownloadVideo(): Promise<any>
  startDownload(id: string, name: string, path: string): void
  pause(): void
  resume(): void
  abort(): void
  continueDownload(id: string, name: string, path: string, lastIndex: number): void
  getId(): string
  getUrl(): string
  getSize(): number
  getProgress(): number
  getName(): string
  getPath(): string
}
