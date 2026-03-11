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

// Classify establishment type from company name
function guessEstablishmentType(companyName: string): string {
  const name = companyName.toLowerCase();
  const upper = companyName.toUpperCase();

  // --- IUT (check first, very specific) ---
  if (name.includes("iut")) return "iut";

  // --- École d'ingénieur ---
  if (
    name.includes("ingénieur") || name.includes("ingenieur") ||
    name.includes("insa ") || upper.startsWith("INSA") ||
    name.includes("estaca") || name.includes("imt ") ||
    name.includes("polytech") || name.includes("cesi") ||
    name.includes("ensait") || name.includes("ensiate") ||
    name.includes("isen ") || upper.startsWith("ISEN") ||
    name.includes("esisar") || name.includes("esima") || name.includes("esiia") ||
    name.includes("bretagne inp") || upper === "INPT" ||
    name.includes("sigma clermont") ||
    name.includes("ismans") || name.includes("yncrea") ||
    name.includes("cpe lyon") || upper === "ECL" ||
    name.includes("estp") || name.includes("icam") ||
    name.includes("telecom") ||
    name.includes("ecole nationale superieure des mines") ||
    name.includes("ecole nat sup") ||
    name.includes("institut polytechnique") ||
    name.includes("institut national des sciences appliquees") ||
    name.includes("fondation e.p.f") || name.includes("epf ") ||
    name.includes("itech") || name.includes("ispa") ||
    name.includes("institut mines") || name.includes("ensp")
  ) return "ecole-ingenieur";

  // --- Grande école ---
  if (
    name.includes("grande école") || name.includes("grande ecole") ||
    name.includes("centrale") || name.includes("ponts") ||
    name.includes("audencia") || name.includes("kedge") ||
    name.includes("neoma") || name.includes("toulouse business school") ||
    name.includes("business school") || name.includes("ecole de management") ||
    name.includes("em normandie") || name.includes("esc ") || upper.startsWith("ESC ") ||
    name.includes("grenoble ecole de management") ||
    name.includes("ecole de commerce") ||
    name.includes("sciences po") || name.includes("creapole") ||
    name.includes("ecole de design") || name.includes("strate")
  ) return "grande-ecole";

  // --- Université ---
  if (
    name.includes("université") || name.includes("universite") ||
    name.includes("univ ") || upper.startsWith("UNIV") ||
    name.includes("ufr ") || upper.startsWith("UFR") ||
    name.includes("faculte") || name.includes("faculté") ||
    name.includes("cnam") ||
    name.includes("iae ") || upper.startsWith("IAE") ||
    upper === "UCA" || upper === "UBS" || upper === "UPHF" ||
    upper === "UPPA" || upper === "URCA" || upper === "UTT" ||
    name.includes("uco ") || upper.startsWith("UCO") ||
    name.includes("ucobn") ||
    name.includes("departement des ") ||
    name.includes("epscp") ||
    name.includes("antenne inspe") || name.includes("antenne ufr") ||
    name.includes("oniris") || name.includes("institut agro") ||
    name.includes("ecole de droit")
  ) return "universite";

  // --- CFA / Centre de formation ---
  if (
    name.includes("cfa") || name.includes("apprenti") ||
    name.includes("afpa") || name.includes("greta") || name.includes("cfai") ||
    name.includes("aftral") || name.includes("isteli") ||
    name.includes("promotrans") || name.includes("aft ") || name.includes("aft-fc") ||
    name.includes("almea") ||
    name.includes("cma ") || upper.startsWith("CMA") || name.includes("cmar ") ||
    name.includes("cci ") || upper.startsWith("CCI") || name.includes("ccit") || name.includes("ccinca") ||
    name.includes("afpi") || name.includes("afpia") || name.includes("afpma") ||
    name.includes("afobtp") || name.includes("aforpa") || name.includes("aforia") ||
    name.includes("afme ") || name.includes("aforp") ||
    name.includes("aocdtf") || name.includes("compagnon") ||
    name.includes("mfr ") || name.includes("maison familiale") ||
    name.includes("campus des metiers") || name.includes("campus des métiers") ||
    name.includes("purple campus") ||
    name.includes("formasup") || name.includes("cerfal") ||
    name.includes("ifria") || name.includes("efiip") ||
    name.includes("centre de formation") || name.includes("centre formation") ||
    name.includes("centre form") ||
    name.includes("cap formation") || name.includes("pole formation") ||
    name.includes("la cite des formations") ||
    name.includes("inhni") || name.includes("garac") ||
    name.includes("3ifa") || name.includes("interfora") ||
    name.includes("bassin formation") ||
    name.includes("batys") || name.includes("forma ") ||
    name.includes("cecof") || name.includes("cfppa") ||
    name.includes("afi24") || name.includes("afip") ||
    name.includes("alternance") && !name.includes("bachelor") ||
    name.includes("laho") ||
    name.includes("fodeno") || name.includes("fodipeg") ||
    name.includes("feder compagnonique") ||
    name.includes("trajectoire formation") ||
    name.includes("formation profess") ||
    name.includes("gip ") || upper.startsWith("GIP") ||
    name.includes("campus mecateam") || name.includes("campus orion") ||
    name.includes("campus dalkia") ||
    name.includes("eco-campus") ||
    name.includes("adrar formation") ||
    name.includes("prometa") ||
    name.includes("agesup") || name.includes("agefpi") || name.includes("agefis") ||
    name.includes("assifep") ||
    name.includes("competences et metiers") ||
    name.includes("ufa ") || upper.startsWith("UFA") ||
    name.includes("inst format") || name.includes("inst.develop")
  ) return "cfa";

  // --- Lycée ---
  if (
    name.includes("lycée") || name.includes("lycee") ||
    name.includes("lyc ") || upper.startsWith("LYC") ||
    /\blpo\b/.test(upper) || /\blp\b/.test(upper) || /\blpor\b/.test(upper) || /\blpap\b/.test(upper) ||
    /\blgt\b/.test(upper) || /\blp0\b/.test(upper) || /\blpp\b/.test(upper) ||
    /\blt\b/.test(upper) || /\blyp\b/.test(upper) ||
    /\blegta\b/.test(upper) || /\blegtpa\b/.test(upper) || /\blegp\b/.test(upper) || /\blep\b/.test(upper) ||
    name.includes("ogec") || name.includes("o.g.e.c") || name.includes("o g e c") ||
    name.includes("organ ges") || name.includes("organisme de gestion") ||
    name.includes("institution ") || name.includes("institution saint") ||
    name.includes("dom sortais") ||
    name.includes("ass andre coindre") || name.includes("ass de gestion") ||
    name.includes("ass ecole technique") || name.includes("ass gestion ecole") ||
    name.includes("ass familiale") || name.includes("ass ogec") ||
    name.includes("ass responsable") || name.includes("ass.ogec") ||
    name.includes("assoc enseign") || name.includes("assoc institut prof") ||
    name.includes("association educative") || name.includes("association la providence") ||
    name.includes("association saint joseph") || name.includes("association saliege") ||
    name.includes("association scolaire") || name.includes("association des etablissements scolaires") ||
    name.includes("fondation don bosco") || name.includes("fondation la mache") ||
    name.includes("groupe de la salle") || name.includes("institution de la salle") ||
    name.includes("groupe scolaire") ||
    name.includes("collegium") ||
    name.includes("aep ") || name.includes("beau frene") ||
    name.includes("gestion centre formation appretis enseignement catholique") ||
    name.includes("gestion ctre forma appr") ||
    name.includes("eplefpa") || name.includes("eplag") ||
    name.includes("institut cadenelle") || name.includes("institut de genech") ||
    name.includes("institut jean errecart") || name.includes("institut nicolas barre") ||
    name.includes("soc enseignement") || name.includes("service enseignement") ||
    name.includes("les formations du marais")
  ) return "lycee";

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

          // First pass: check if any results match our RNCP code
          const rncpTarget = rncpCode ? `RNCP${rncpCode}` : null;
          const hasRncpMatches = rncpTarget
            ? results.some(r => r.rncpCode === rncpTarget)
            : false;

          for (const r of results) {
            // If we found RNCP matches, only keep those; otherwise keep all ROME results
            if (hasRncpMatches && r.rncpCode !== rncpTarget) {
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
                source: "api",
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
