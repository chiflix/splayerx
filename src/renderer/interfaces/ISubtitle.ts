export type cue = {
  category?: string,
  start: number,
  end: number,
  text: string,
  hide?: boolean,
  format: string,
  tags: tagsPartial,
}
type Partial<T> = { [P in keyof T]?: T[P] };
export type tagsPartial = Partial<tags>;
type tags = {
  alignment: number,
  pos: { x: number, y: number },
  vertical: string,
  line: string,
  position: string,
  b: number,
  i: number,
  u: number,
  s: number,
}
