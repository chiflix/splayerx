
export interface IWindowRectRequest {
  calculateWindowRect(videoSize: number[], videoExisted: boolean, position: number[], maxSize: number[]): number[]
  calculateWindowScaleBy(fullScreen: boolean, windowAngle: number, videoRatio: number, windowRatio?: number): number
  uploadWindowBy(fullScreen: boolean, which?: string, windowAngle?: number, lastWindowAngle?: number, lastWindowSize?: number[], windowPosition?: number[]): number[]
}