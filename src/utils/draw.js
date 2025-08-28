function weightedDraw(items) {
  // items: [{ id, weight }]
  const total = items.reduce((s, it) => s + Math.max(0, it.weight), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const it of items) {
    r -= Math.max(0, it.weight);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}
module.exports = { weightedDraw };
