export function namespacedNameHelper(namespaced, name, namespace) {
  return `${namespaced ? `${namespace}/` : ''}${name}`;
}
