import { ImageResponse } from "next/og";
import { getHomeData } from "@/lib/home";

export const runtime = "nodejs";
export const alt = "Formations ferroviaires, le guide des métiers du rail";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Carte de partage (LinkedIn, WhatsApp, X) : marque, promesse, chiffres réels et nœuds régionaux. */
export default async function OgImage() {
  const data = await getHomeData().catch(() => null);
  const verified = data?.verified ?? 331, formations = data?.formations ?? 49, metiers = data?.metiers ?? 32;
  const regions = (data?.regions ?? []).filter((r) => r.lat > 42 && r.lat < 52 && r.lng > -6 && r.lng < 9);
  const project = (lat: number, lng: number) => [((lng + 5.3) / 13.8) * 300, ((51.3 - lat) / 8.9) * 320] as const;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(180deg,#0C1F2C,#12303F)", color: "#F4F7F8", fontFamily: "Manrope, Inter, system-ui, sans-serif", padding: "52px 64px", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, display: "flex", gap: 16 }}>
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} style={{ width: 40, height: 10, background: "#FFD84D", display: "flex" }} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "#FFD84D", color: "#0C1F2C", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>FF</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>Formations ferroviaires</div>
              <div style={{ fontSize: 15, color: "#9DB3BF", letterSpacing: 2 }}>LE GUIDE DES MÉTIERS DU RAIL</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.04, letterSpacing: -1.5, display: "flex", flexWrap: "wrap" }}>
              <span>Trouvez où se former aux métiers du rail,&nbsp;</span>
              <span style={{ color: "#FFD84D" }}>près de chez vous.</span>
            </div>
            <div style={{ fontSize: 24, color: "#9DB3BF" }}>Du CAP à l&apos;ingénieur, avec la source officielle et les établissements qui préparent chaque formation.</div>
          </div>
          <div style={{ display: "flex", gap: 34, fontSize: 22, color: "#C9D8DF" }}>
            <span style={{ display: "flex" }}><b style={{ color: "#fff", marginRight: 8 }}>{verified}</b>établissements vérifiés</span>
            <span style={{ display: "flex" }}><b style={{ color: "#fff", marginRight: 8 }}>{formations}</b>formations</span>
            <span style={{ display: "flex" }}><b style={{ color: "#fff", marginRight: 8 }}>{metiers}</b>métiers</span>
          </div>
        </div>
        <div style={{ position: "absolute", right: 70, top: 120, width: 300, height: 330, display: "flex" }}>
          {regions.map((r) => {
            const [x, y] = project(r.lat, r.lng);
            const d = 22 + Math.sqrt(r.count) * 4;
            return (
              <div key={r.code} style={{ position: "absolute", left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: 999, background: "#12303F", border: "3px solid #FFD84D", boxShadow: "0 0 0 6px rgba(255,216,77,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
                {String(r.count)}
              </div>
            );
          })}
        </div>
      </div>
    ),
    { ...size }
  );
}
