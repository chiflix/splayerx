export type Cue = {
  category?: string,
  start: number,
  end: number,
  text: string,
  hide?: boolean,
  format: string,
  tags: TagsPartial,
}
type Partial<T> = { [P in keyof T]?: T[P] };
export type TagsPartial = Partial<Tags>;
type Tags = {
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
