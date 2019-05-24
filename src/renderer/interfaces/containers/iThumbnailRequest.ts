export interface IThumbnailRequest {
  getThumbnailImage(mediaHash: string): Promise<string | null>
  generateThumbnailImage(mediaHash: string, videoSrc: string, cols: number, width: number): Promise<string>
  calculateThumbnailPosition(currentTime: number, duration: number, count: number): number[]
}
