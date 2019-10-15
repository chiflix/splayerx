export interface IMediaFilter {
  checkImage(src: string): Promise<boolean>
}
