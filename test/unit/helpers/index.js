export class DOMStringListStub extends Array {
  contains(name) {
    return this.includes(name);
  }
  items(index) {
    return this[index];
  }
  constructor(items) {
    super(...(items || []));
  }
}

export function randStr() {
  return Math.random().toString(36).substring(7);
}
