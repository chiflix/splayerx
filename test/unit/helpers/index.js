/* eslint-disable import/prefer-default-export */
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
