export function formatEyebrowDate(d = new Date()) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
  return `${mm} · ${dd} · ${yyyy} — ${weekday}`;
}

export function formatReleasedAt(d = new Date(), tz = 'IST') {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `Released · ${mm}.${dd}.${yyyy} · ${hh}:${min} ${tz}`;
}