/**
 * @description ThumbnailDisplay UI组件抽象的接口
 * @author tanghaixiang@xindong.com
 * @date 2019-05-20
 * @export
 * @interface ThumbnailRequest
 */
export interface ThumbnailRequest {
  getImage(mediaHash: string): Promise<string | null>
  generateImage(mediaHash: string, videoSrc: string, cols: number): Promise<string>
}