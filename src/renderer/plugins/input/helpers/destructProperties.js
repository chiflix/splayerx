export function destructProperties(object, ...properties) {
  const result = {};
  properties.forEach((property) => {
    result[property] = object[property] || {};
  });
  return result;
}
