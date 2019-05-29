class ComponentStore {
  // use WeakMap to store dom elements
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap#Why_WeakMap
  uiComponents = new WeakMap();

  uiComponentsCount = new Map();

  addComponent(name, element, key) {
    let result = false;
    if (name && element instanceof Element) {
      if (!this.uiComponentsCount.has(name)) {
        this.uiComponentsCount.set(name, 1);
        this.uiComponents.set(element, { name, key: 1 });
        result = true;
      } else {
        const count = this.uiComponentsCount.get(name);
        if (!key || (typeof key === 'number' && count >= key)) this.uiComponents.set(element, { name, key: count + 1 });
        else this.uiComponents.set(element, { name, key });
        this.uiComponentsCount.set(name, count + 1);
        result = true;
      }
    }
    return result;
  }

  removeComponent(element) {
    let result = false;
    if (this.uiComponents.has(element)) {
      const { name } = this.uiComponents.get(element);
      const count = this.uiComponentsCount.get(name);

      this.uiComponents.delete(element);
      if (count === 1) this.uiComponentsCount.delete(name);
      else this.uiComponentsCount.set(name, count - 1);
      result = true;
    }
    return result;
  }

  getComponentNameFromElement(element) {
    if (this.uiComponents.has(element)) return this.uiComponents.get(element);
    if (element instanceof Element) return this.getComponentNameFromElement(element.parentElement);
    return false;
  }

  getComponentCount(name) {
    return this.uiComponentsCount.has(name) ? this.uiComponentsCount.get(name) : 0;
  }
}

const componentStore = new ComponentStore();

export function addComponent(name, element, key) {
  return componentStore.addComponent(name, element, key);
}
export function removeComponent(element) {
  return componentStore.removeComponent(element);
}
export function getComponentName(element) {
  return componentStore.getComponentNameFromElement(element);
}
export function getComponentCount(name) {
  return componentStore.getComponentCount(name);
}
