export interface IMediaStorable {
  generate(mediaHash: string, tag: string): Promise<string | null>
  getCover(hash: string): Promise<string | null>
  getImage(mediaHash: string, tag: string): Promise<string | null>
}