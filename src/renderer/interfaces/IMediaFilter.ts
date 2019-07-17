export default interface IMediaFilter {
  checkImage(src: string): Promise<boolean>;
}
