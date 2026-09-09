/** Formes des données servies par /api/filters et /api/establishments, partagées par les composants de la carte. */
export interface EstablishmentType { id: string; slug: string; nameFr: string; nameEn: string; color: string }
export interface Region { id: string; name: string; code: string; lat: number; lng: number }
export interface FormationLevel { id: string; slug: string; nameFr: string; nameEn: string; order: number }
export interface FormationDomain { id: string; slug: string; nameFr: string; nameEn: string; color: string }
export interface Formation {
  id: string; slug: string; nameFr: string; nameEn: string | null; rncpCode: string | null;
  onisepUrl: string | null; jobTarget: string | null; level: FormationLevel; domain: FormationDomain;
}
export interface Establishment {
  id: string; slug: string; name: string; city: string; lat: number; lng: number;
  website: string | null; onisepUrl: string | null; source: string;
  type: EstablishmentType; region: Region; formations: Array<{ formation: Formation }>;
}
export interface Metier { id: string; slug: string; nameFr: string; nameEn: string | null; family: string; source: string; level: string | null }
export interface MetierFormationLink { metier: { slug: string; nameFr: string; family: string }; formation: { slug: string } }
export interface FilterData {
  regions: Region[]; types: EstablishmentType[]; levels: FormationLevel[]; domains: FormationDomain[];
  metiers: Metier[]; formations: Formation[]; metierFormationLinks: MetierFormationLink[];
}

/** Forme compacte servie par /api/establishments (types et formations par slug, à reconstituer avec /api/filters). */
export interface SlimEstablishment {
  id: string; slug: string; name: string; city: string; lat: number; lng: number;
  website: string | null; onisepUrl: string | null; source: string; type: string; region: string; formations: string[];
}

/** Établissement reconstitué, avec son texte de recherche normalisé. */
export interface IndexedEstablishment extends Establishment { n: string }

export const FRANCE_CENTER: [number, number] = [46.6, 2.5];
export const FRANCE_ZOOM = 6;

/** Distance à vol d'oiseau en kilomètres. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371, dLat = ((b[0] - a[0]) * Math.PI) / 180, dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
