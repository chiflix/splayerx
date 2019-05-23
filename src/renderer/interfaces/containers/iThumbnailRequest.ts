export interface IThumbnailRequest {
  getImage(mediaHash: string): Promise<string | null>
  generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string>
  calculateThumbnailPosition(currentTime: number, duration: number, count: number): string
}
