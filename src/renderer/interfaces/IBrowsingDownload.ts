export interface IBrowsingDownload {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDownloadVideo(Cookie: string): Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  startDownload(id: string, name: string, path: string, headers: any): void
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
