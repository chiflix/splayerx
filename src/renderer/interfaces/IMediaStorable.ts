export interface IMediaStorable {
  generatePathBy(mediaHash: string, tag: string): Promise<string | null>
  getImageBy(mediaHash: string, tag: string): Promise<string | null>
}
