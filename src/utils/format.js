export function formatProductCount(count) {
  return `${count} ${count === 1 ? 'pick' : 'picks'}`;
}
