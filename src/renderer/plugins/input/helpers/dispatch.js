export async function dispatch(type, payload) {
  await import('@/store').then(store => store.dispatch(type, payload));
}
