export interface IThumbnailRequest {
  getImage(mediaHash: string): Promise<string | null>
  generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string>
}
