/** Mini-carte statique (tuiles OpenStreetMap, sans JavaScript) centrée sur un point, avec sa pastille. */
const Z = 13, TILE = 256, W = 640, H = 240;

function world(lat: number, lng: number): [number, number] {
  const n = TILE * 2 ** Z;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return [x, y];
}

export default function MiniMap({ lat, lng, color, label }: { lat: number; lng: number; color: string; label: string }) {
  const [px, py] = world(lat, lng);
  const x0 = px - W / 2, y0 = py - H / 2;
  const tiles: Array<{ key: string; src: string; left: number; top: number }> = [];
  for (let tx = Math.floor(x0 / TILE); tx <= Math.floor((x0 + W) / TILE); tx++) {
    for (let ty = Math.floor(y0 / TILE); ty <= Math.floor((y0 + H) / TILE); ty++) {
      tiles.push({ key: `${tx}-${ty}`, src: `https://tile.openstreetmap.org/${Z}/${tx}/${ty}.png`, left: tx * TILE - x0, top: ty * TILE - y0 });
    }
  }
  return (
    <div className="relative overflow-hidden rounded-card border border-navy-200 bg-navy-100" style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label={label}>
      <div className="absolute inset-0" style={{ filter: "grayscale(.45) saturate(.75) contrast(.95) brightness(1.04)" }}>
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={t.key} src={t.src} alt="" width={TILE} height={TILE} loading="lazy" className="absolute max-w-none" style={{ left: `${(t.left / W) * 100}%`, top: `${(t.top / H) * 100}%`, width: `${(TILE / W) * 100}%`, height: `${(TILE / H) * 100}%` }} />
        ))}
      </div>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-[3px] border-white shadow-lg grid place-items-center text-white" style={{ background: color }} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z" /></svg>
      </span>
      <span className="absolute right-1 bottom-0.5 text-[9px] text-navy-500 bg-white/70 px-1 rounded">© OpenStreetMap</span>
    </div>
  );
}
