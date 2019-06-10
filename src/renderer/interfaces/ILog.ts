export interface ILog {
  info(tag: string, content: Error): void
  error(tag: string, content: Error): void
}