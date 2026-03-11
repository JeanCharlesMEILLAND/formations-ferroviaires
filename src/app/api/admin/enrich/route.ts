import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, unauthorizedResponse } from "@/lib/admin-auth";

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

// Geographic points to cover all metropolitan France with radius 200km
const GEO_POINTS = [
  { lat: 48.8566, lng: 2.3522, label: "Paris" },
  { lat: 43.6047, lng: 1.4442, label: "Toulouse" },
  { lat: 45.764, lng: 4.8357, label: "Lyon" },
  { lat: 47.2184, lng: -1.5536, label: "Nantes" },
  { lat: 48.573, lng: 7.752, label: "Strasbourg" },
  { lat: 43.2965, lng: 5.3698, label: "Marseille" },
  { lat: 44.8378, lng: -0.5792, label: "Bordeaux" },
  { lat: 50.6292, lng: 3.0573, label: "Lille" },
  { lat: 48.3904, lng: -4.4861, label: "Brest" },
  { lat: 47.3220, lng: 5.0415, label: "Dijon" },
];

const API_BASE = "https://labonnealternance.apprentissage.beta.gouv.fr/api/v1/formations";

// Map API diploma level to our type slugs
function guessEstablishmentType(companyName: string): string {
  const name = companyName.toLowerCase();
  if (name.includes("cfa") || name.includes("apprenti") || name.includes("afpa") || name.includes("greta") || name.includes("cfai")) return "cfa";
  if (name.includes("iut")) return "iut";
  if (name.includes("université") || name.includes("universite") || name.includes("univ")) return "universite";
  if (name.includes("ingénieur") || name.includes("ingenieur") || name.includes("insa") || name.includes("estaca") || name.includes("imt ")) return "ecole-ingenieur";
  if (name.includes("grande école") || name.includes("grande ecole") || name.includes("centrale") || name.includes("arts et") || name.includes("ponts")) return "grande-ecole";
  if (name.includes("lycée") || name.includes("lycee") || name.includes("lp ") || name.includes("lpo ")) return "lycee";
  return "autre";
}

// Map city to region code
function guessRegionFromDepartment(deptNum: string): string {
  const mapping: Record<string, string> = {
    "75": "IDF", "77": "IDF", "78": "IDF", "91": "IDF", "92": "IDF", "93": "IDF", "94": "IDF", "95": "IDF",
    "59": "HDF", "62": "HDF", "02": "HDF", "60": "HDF", "80": "HDF",
    "67": "GES", "68": "GES", "10": "GES", "51": "GES", "52": "GES", "54": "GES", "55": "GES", "57": "GES", "88": "GES", "08": "GES",
    "44": "PDL", "49": "PDL", "53": "PDL", "72": "PDL", "85": "PDL",
    "14": "NOR", "50": "NOR", "61": "NOR", "27": "NOR", "76": "NOR",
    "22": "BRE", "29": "BRE", "35": "BRE", "56": "BRE",
    "16": "NAQ", "17": "NAQ", "19": "NAQ", "23": "NAQ", "24": "NAQ", "33": "NAQ", "40": "NAQ", "47": "NAQ", "64": "NAQ", "79": "NAQ", "86": "NAQ", "87": "NAQ",
    "01": "ARA", "03": "ARA", "07": "ARA", "15": "ARA", "26": "ARA", "38": "ARA", "42": "ARA", "43": "ARA", "63": "ARA", "69": "ARA", "73": "ARA", "74": "ARA",
    "09": "OCC", "11": "OCC", "12": "OCC", "30": "OCC", "31": "OCC", "32": "OCC", "34": "OCC", "46": "OCC", "48": "OCC", "65": "OCC", "66": "OCC", "81": "OCC", "82": "OCC",
    "04": "PAC", "05": "PAC", "06": "PAC", "13": "PAC", "83": "PAC", "84": "PAC",
    "18": "CVL", "28": "CVL", "36": "CVL", "37": "CVL", "41": "CVL", "45": "CVL",
    "21": "BFC", "25": "BFC", "39": "BFC", "58": "BFC", "70": "BFC", "71": "BFC", "89": "BFC", "90": "BFC",
    "2A": "COR", "2B": "COR", "20": "COR",
    "97": "MTQ",
  };
  return mapping[deptNum] || "IDF";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

interface ApiResult {
  title?: string;
  longTitle?: string;
  rncpCode?: string;
  onisepUrl?: string;
  place?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    address?: string;
    zipCode?: string;
    departementNumber?: string;
    region?: string;
  };
  company?: {
    name?: string;
    uai?: string;
    siret?: string;
  };
}

export async function POST(request: NextRequest) {
  if (!verifyAuth()) return unauthorizedResponse();

  try {
    const body = await request.json();
    const formationId = body.formationId as string | undefined;

    // Get formations with ROME codes
    const formations = await prisma.formation.findMany({
      where: {
        romeCode: { not: null },
        ...(formationId ? { id: formationId } : {}),
      },
      include: { level: true, domain: true },
    });

    if (formations.length === 0) {
      return NextResponse.json({ message: "Aucune formation avec code ROME trouvée" }, { status: 400 });
    }

    // Load existing data for deduplication
    const existingEstablishments = await prisma.establishment.findMany({
      select: { id: true, slug: true, uaiCode: true, name: true, lat: true, lng: true },
    });
    const existingLinks = await prisma.establishmentFormation.findMany({
      select: { establishmentId: true, formationId: true },
    });

    const regionMap = await prisma.region.findMany().then(r =>
      Object.fromEntries(r.map(region => [region.code, region.id]))
    );
    const typeMap = await prisma.establishmentType.findMany().then(t =>
      Object.fromEntries(t.map(type => [type.slug, type.id]))
    );

    // Build lookup indexes
    const uaiIndex = new Map(existingEstablishments.filter(e => e.uaiCode).map(e => [e.uaiCode, e]));
    const slugIndex = new Map(existingEstablishments.map(e => [e.slug, e]));
    const linkIndex = new Set(existingLinks.map(l => `${l.establishmentId}:${l.formationId}`));

    let totalNewEstablishments = 0;
    let totalNewLinks = 0;
    let totalApiResults = 0;
    const logs: string[] = [];

    for (const formation of formations) {
      const romeCode = formation.romeCode!;
      const rncpCode = formation.rncpCode;
      logs.push(`\n🔍 ${formation.nameFr} (ROME: ${romeCode}, RNCP: ${rncpCode || "N/A"})`);

      // Collect all unique results across geographic points
      const allResults = new Map<string, ApiResult>();

      for (const point of GEO_POINTS) {
        try {
          const params = new URLSearchParams({
            romes: romeCode,
            caller: "formations-ferroviaires-fif",
            latitude: point.lat.toString(),
            longitude: point.lng.toString(),
            radius: "200",
          });

          const resp = await fetch(`${API_BASE}?${params}`);
          if (!resp.ok) {
            logs.push(`  ⚠️ API error for ${point.label}: ${resp.status}`);
            continue;
          }

          const data = await resp.json();
          const results: ApiResult[] = data.results || [];

          for (const r of results) {
            // Filter: only keep results matching our RNCP code if we have one
            if (rncpCode && r.rncpCode && r.rncpCode !== `RNCP${rncpCode}`) {
              continue;
            }

            // Deduplicate by UAI or by name+city
            const uai = r.company?.uai;
            const key = uai || `${r.company?.name}|${r.place?.city}`;
            if (!allResults.has(key)) {
              allResults.set(key, r);
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          logs.push(`  ⚠️ Fetch error for ${point.label}: ${(err as Error).message}`);
        }
      }

      totalApiResults += allResults.size;
      logs.push(`  📊 ${allResults.size} établissements uniques trouvés via l'API`);

      // Process each result
      let newEstForFormation = 0;
      let newLinksForFormation = 0;

      for (const result of Array.from(allResults.values())) {
        const companyName = result.company?.name;
        const city = result.place?.city;
        const lat = result.place?.latitude;
        const lng = result.place?.longitude;
        const uai = result.company?.uai;

        if (!companyName || !city || !lat || !lng) continue;

        // Try to find existing establishment
        let establishment = uai ? uaiIndex.get(uai) : undefined;
        if (!establishment) {
          // Try by slug
          const candidateSlug = slugify(companyName + "-" + city);
          establishment = slugIndex.get(candidateSlug);
        }
        if (!establishment) {
          // Try proximity match: same name prefix + within 1km
          for (const existing of existingEstablishments) {
            const dist = Math.sqrt(
              Math.pow((existing.lat - lat) * 111, 2) +
              Math.pow((existing.lng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
            );
            if (dist < 1 && existing.name.toLowerCase().includes(companyName.toLowerCase().substring(0, 10))) {
              establishment = existing;
              break;
            }
          }
        }

        // Create new establishment if not found
        if (!establishment) {
          const deptNum = result.place?.departementNumber || result.place?.zipCode?.substring(0, 2) || "75";
          const regionCode = guessRegionFromDepartment(deptNum);
          const typeSlug = guessEstablishmentType(companyName);
          const regionId = regionMap[regionCode];
          const typeId = typeMap[typeSlug];

          if (!regionId || !typeId) continue;

          let slug = slugify(companyName + "-" + city);
          // Ensure unique slug
          let counter = 1;
          while (slugIndex.has(slug)) {
            slug = slugify(companyName + "-" + city + "-" + counter);
            counter++;
          }

          try {
            const created = await prisma.establishment.create({
              data: {
                slug,
                name: companyName,
                city,
                address: result.place?.address || null,
                lat,
                lng,
                regionId,
                typeId,
                uaiCode: uai || null,
                onisepUrl: result.onisepUrl || null,
              },
            });
            establishment = { id: created.id, slug, uaiCode: uai || null, name: companyName, lat, lng };
            existingEstablishments.push(establishment);
            slugIndex.set(slug, establishment);
            if (uai) uaiIndex.set(uai, establishment);
            newEstForFormation++;
            totalNewEstablishments++;
          } catch {
            // Slug collision or other error - skip
            continue;
          }
        }

        // Create link if not exists
        const linkKey = `${establishment.id}:${formation.id}`;
        if (!linkIndex.has(linkKey)) {
          try {
            await prisma.establishmentFormation.create({
              data: {
                establishmentId: establishment.id,
                formationId: formation.id,
              },
            });
            linkIndex.add(linkKey);
            newLinksForFormation++;
            totalNewLinks++;
          } catch {
            // Unique constraint violation - already exists, skip
          }
        }
      }

      logs.push(`  ✅ +${newEstForFormation} établissements, +${newLinksForFormation} liens`);
    }

    return NextResponse.json({
      success: true,
      summary: {
        formationsProcessed: formations.length,
        apiResultsTotal: totalApiResults,
        newEstablishments: totalNewEstablishments,
        newLinks: totalNewLinks,
      },
      logs,
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { error: "Enrichment failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET: return enrichment status / info
export async function GET() {
  if (!verifyAuth()) return unauthorizedResponse();

  const formations = await prisma.formation.findMany({
    where: { romeCode: { not: null } },
    select: { id: true, nameFr: true, romeCode: true, rncpCode: true, _count: { select: { establishments: true } } },
    orderBy: { nameFr: "asc" },
  });

  const totalEstablishments = await prisma.establishment.count();
  const totalLinks = await prisma.establishmentFormation.count();

  return NextResponse.json({
    formations: formations.map(f => ({
      id: f.id,
      nameFr: f.nameFr,
      romeCode: f.romeCode,
      rncpCode: f.rncpCode,
      establishmentCount: f._count.establishments,
    })),
    totalEstablishments,
    totalLinks,
  });
}
