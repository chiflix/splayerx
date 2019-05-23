export interface IThumbnailRequest {
  getThumbnailImage(mediaHash: string): Promise<string | null>
  generateThumbnailImage(mediaHash: string, videoSrc: string, cols: number): Promise<string>
  calculateThumbnailPosition(currentTime: number, duration: number, count: number): string
}
