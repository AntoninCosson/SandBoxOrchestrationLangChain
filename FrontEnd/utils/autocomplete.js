// utils/autocomplete.js
let t;
const mem = new Map();
export function suggestAddresses(q, { limit = 5 } = {}) {
  return new Promise((resolve) => {
    const key = `${q}|${limit}`;
    if (mem.has(key)) return resolve(mem.get(key));

    clearTimeout(t);
    t = setTimeout(async () => {
      if (!q || q.trim().length < 3) return resolve([]);
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=${limit}`;
        const r = await fetch(url);
        const data = await r.json();
        const items = (data.features || []).map(f => ({
          label: f.properties.label,
          city: f.properties.city || '',
          postcode: f.properties.postcode || '',
          context: f.properties.context || '',
          lon: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
        }));
        mem.set(key, items);
        resolve(items);
      } catch {
        resolve([]);
      }
    }, 350);
  });
}