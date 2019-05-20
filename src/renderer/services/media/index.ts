export interface IMediaStorable {
  generate(mediaHash: string, tag: string): Promise<string|null>
  getCover(hash: string): Promise<string | null>
  getThumbnail(mediaHash: string): Promise<string | null>
}