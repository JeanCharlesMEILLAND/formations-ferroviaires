import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// SEED DATA
// ============================================================

const regions = [
  { name: "Île-de-France", code: "IDF", lat: 48.8566, lng: 2.3522 },
  { name: "Auvergne-Rhône-Alpes", code: "ARA", lat: 45.764, lng: 4.8357 },
  { name: "Hauts-de-France", code: "HDF", lat: 49.8941, lng: 2.2958 },
  { name: "Grand Est", code: "GES", lat: 48.573, lng: 7.752 },
  { name: "Occitanie", code: "OCC", lat: 43.6047, lng: 1.4442 },
  { name: "Bretagne", code: "BRE", lat: 48.1173, lng: -1.6778 },
  { name: "Nouvelle-Aquitaine", code: "NAQ", lat: 44.8378, lng: -0.5792 },
  { name: "Provence-Alpes-Côte d'Azur", code: "PAC", lat: 43.2965, lng: 5.3698 },
  { name: "Pays de la Loire", code: "PDL", lat: 47.2184, lng: -1.5536 },
  { name: "Centre-Val de Loire", code: "CVL", lat: 47.9029, lng: 1.909 },
  { name: "Normandie", code: "NOR", lat: 49.1829, lng: -0.3707 },
  { name: "Bourgogne-Franche-Comté", code: "BFC", lat: 47.2805, lng: 6.0343 },
  { name: "Martinique", code: "MTQ", lat: 14.6415, lng: -61.0242 },
];

const establishmentTypes = [
  { slug: "lycee", nameFr: "Lycée", nameEn: "High School", color: "#E91E63" },
  { slug: "universite", nameFr: "Université", nameEn: "University", color: "#3F51B5" },
  { slug: "ecole-ingenieur", nameFr: "École d'ingénieurs", nameEn: "Engineering School", color: "#FF5722" },
  { slug: "cfa", nameFr: "CFA / Centre de formation", nameEn: "Training Center", color: "#4CAF50" },
  { slug: "iut", nameFr: "IUT", nameEn: "IUT", color: "#9C27B0" },
  { slug: "grande-ecole", nameFr: "Grande École", nameEn: "Grande École", color: "#FF9800" },
  { slug: "autre", nameFr: "Autre", nameEn: "Other", color: "#607D8B" },
];

const formationLevels = [
  { slug: "cap-niv3", nameFr: "CAP (Niveau 3)", nameEn: "CAP (Level 3)", order: 1 },
  { slug: "bac-niv4", nameFr: "BAC / Bac Pro (Niveau 4)", nameEn: "BAC / Bac Pro (Level 4)", order: 2 },
  { slug: "bac1-cs", nameFr: "Bac +1 (CS)", nameEn: "Bac +1 (CS)", order: 3 },
  { slug: "bts-niv5", nameFr: "BTS / Bac +2 (Niveau 5)", nameEn: "BTS / Bac +2 (Level 5)", order: 4 },
  { slug: "licence-niv6", nameFr: "Licence / BUT / Bac +3 (Niveau 6)", nameEn: "Bachelor / Bac +3 (Level 6)", order: 5 },
  { slug: "master-niv7", nameFr: "Master / Ingénieur (Niveau 7)", nameEn: "Master / Engineer (Level 7)", order: 6 },
  { slug: "mastere-niv8", nameFr: "Mastère Spécialisé (Bac +6)", nameEn: "Specialized Master (Bac +6)", order: 7 },
];

const formationDomains = [
  { slug: "maintenance-technique", nameFr: "Maintenance & Technique", nameEn: "Maintenance & Technical", color: "#2196F3" },
  { slug: "exploitation-circulation", nameFr: "Exploitation & Circulation", nameEn: "Operations & Circulation", color: "#FF9800" },
  { slug: "genie-civil-infra", nameFr: "Génie Civil & Infrastructures", nameEn: "Civil Engineering & Infrastructure", color: "#795548" },
  { slug: "ingenierie-conception", nameFr: "Ingénierie & Conception", nameEn: "Engineering & Design", color: "#9C27B0" },
  { slug: "transport-mobilite", nameFr: "Transport & Mobilité", nameEn: "Transport & Mobility", color: "#4CAF50" },
  { slug: "electrotechnique", nameFr: "Électrotechnique & Électronique", nameEn: "Electrotechnics & Electronics", color: "#F44336" },
  { slug: "industrie-production", nameFr: "Industrie & Production", nameEn: "Industry & Production", color: "#607D8B" },
];

// Formations from the Assemblage sheet
const formations = [
  // === NIVEAU 3 (CAP) ===
  { slug: "cap-maintenance-vehicules", nameFr: "CAP Maintenance des véhicules", rncpCode: "38337", romeCode: "I1310", level: "cap-niv3", domain: "maintenance-technique", jobTarget: "Souvent utilisé comme base avant une spécialisation interne SNCF/RATP.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/cap-maintenance-des-vehicules-option-vehicules-legers" },
  { slug: "cap-ctm-installateur-electrique", nameFr: "CAP CTM installateur en équipements électriques", rncpCode: "35955", romeCode: "I1309", level: "cap-niv3", domain: "electrotechnique", jobTarget: null, onisepUrl: null },

  // === NIVEAU 4 (BAC PRO / TITRE PRO) ===
  { slug: "bac-pro-mspc", nameFr: "Bac Pro MSPC (ex-MEI)", rncpCode: "35698", romeCode: "I1304", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Option Ferroviaire disponible. Maintenance des trains ou des installations.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-maintenance-des-systemes-de-production-connectes" },
  { slug: "bac-pro-melec", nameFr: "Bac Pro MELEC", rncpCode: "38878", romeCode: "I1309", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Travaux sur les caténaires, la signalisation et les postes électriques.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-metiers-de-l-electricite-et-de-ses-environnements-connectes" },
  { slug: "bac-pro-otm", nameFr: "Bac Pro OTM", rncpCode: "34630", romeCode: "N1301", level: "bac-niv4", domain: "exploitation-circulation", jobTarget: "Organisation du Transport de Marchandises (Logistique/Fret).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-organisation-de-transport-de-marchandises" },
  { slug: "titre-pro-conducteur-train", nameFr: "Titre Pro Conducteur de train", rncpCode: "35438", romeCode: "N4301", level: "bac-niv4", domain: "exploitation-circulation", jobTarget: "Référence métier pour la conduite de train (RNCP).", onisepUrl: null },
  { slug: "bac-pro-travaux-publics", nameFr: "Bac Pro Travaux Publics", rncpCode: "37385", romeCode: "F1201", level: "bac-niv4", domain: "genie-civil-infra", jobTarget: "Maintenance et pose des voies ferrées (ballast, rails, traverses).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-travaux-publics" },
  { slug: "bac-pro-traction-electrique", nameFr: "Bac Pro Maintenance des Systèmes de Traction Électrique", rncpCode: "40025515", romeCode: "I1309", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },
  { slug: "btm-installateur-electrique", nameFr: "BTM installateur en équipement électrique", rncpCode: "38656", romeCode: "I1309", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Responsable de chantier d'installation de réseaux électriques.", onisepUrl: null },
  { slug: "mc4-maintenance-installations-ferro", nameFr: "MC4 Maintenance des Installations Ferroviaires", rncpCode: "45025501", romeCode: "I1304", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },
  { slug: "mc4-maintenance-systemes-embarques", nameFr: "MC4 Maintenance des Systèmes Embarqués de Matériel Ferroviaire", rncpCode: "45025502", romeCode: "I1304", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },

  // === NIVEAU 5 (BTS / BAC+1) ===
  { slug: "cs-accueil-transports", nameFr: "Certificat de Spécialisation Accueil dans les Transports", rncpCode: "38225", romeCode: "N4401", level: "bac1-cs", domain: "exploitation-circulation", jobTarget: "Accueil dans les transports (ex-Mention Complémentaire).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/cs-accueil-dans-les-transports" },
  { slug: "bts-maintenance-systemes", nameFr: "BTS Maintenance des Systèmes (MS)", rncpCode: "38575", romeCode: "I1304", level: "bts-niv5", domain: "maintenance-technique", jobTarget: "Option Systèmes de production. Expert technique en centre de maintenance.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-maintenance-des-systemes-option-a-systemes-de-production" },
  { slug: "bts-electrotechnique", nameFr: "BTS Électrotechnique", rncpCode: "41007", romeCode: "I1309", level: "bts-niv5", domain: "electrotechnique", jobTarget: "Maintenance des infrastructures électriques haute et basse tension.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-electrotechnique" },
  { slug: "bts-gtla", nameFr: "BTS GTLA", rncpCode: "34023", romeCode: "N1301", level: "bts-niv5", domain: "exploitation-circulation", jobTarget: "Gestion des Transports et Logistique Associée (Exploitation).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-gestion-des-transports-et-logistique-associee" },
  { slug: "bts-travaux-publics", nameFr: "BTS Travaux Publics", rncpCode: "37199", romeCode: "F1201", level: "bts-niv5", domain: "genie-civil-infra", jobTarget: "Encadrement de chantier sur les infrastructures ferroviaires.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-travaux-publics" },
  { slug: "bm-installateur-electrique", nameFr: "BM installateur en équipements électriques", rncpCode: "37488", romeCode: "I1309", level: "bts-niv5", domain: "electrotechnique", jobTarget: null, onisepUrl: null },

  // === NIVEAU 6 (LICENCE PRO / BUT / BAC+3) ===
  { slug: "lp-maintenance-transports-guides", nameFr: "Licence Pro Maintenance des transports guidés", rncpCode: "30121", romeCode: "H1102", level: "licence-niv6", domain: "maintenance-technique", jobTarget: "Spécialisation en ingénierie de maintenance.", onisepUrl: null },
  { slug: "lp-gmsf", nameFr: "Licence Pro GMSF", rncpCode: "30121", romeCode: "N4401", level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Gestion et Management des Services Ferroviaires.", onisepUrl: null },
  { slug: "but-mlt", nameFr: "BUT Management de la Logistique et des Transports (MLT)", rncpCode: "35478", romeCode: "N1301", level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Transport urbain et interurbain de voyageurs ; exploitation et planification.", onisepUrl: null },
  { slug: "but-mesures-physiques", nameFr: "BUT Mesures Physiques", rncpCode: "35481", romeCode: "H1210", level: "licence-niv6", domain: "industrie-production", jobTarget: "Matériaux, contrôles physico-chimiques, analyses environnementales.", onisepUrl: null },
  { slug: "but-gim", nameFr: "BUT Génie Industriel et Maintenance", rncpCode: "35474", romeCode: "H1102", level: "licence-niv6", domain: "maintenance-technique", jobTarget: "Ingénierie des systèmes pluritechniques, maintenance innovante.", onisepUrl: null },
  { slug: "but-geii", nameFr: "BUT Génie Électrique et Informatique Industrielle", rncpCode: "35472", romeCode: "H1208", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Électronique et systèmes embarqués, électricité et maîtrise de l'énergie.", onisepUrl: null },
  { slug: "but-rt", nameFr: "BUT Réseaux et Télécommunications", rncpCode: "35483", romeCode: "H1209", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Internet des objets et mobilité.", onisepUrl: null },
  { slug: "licence-eea", nameFr: "Licence Électronique, Énergie Électrique, Automatique (EEA)", rncpCode: "24505", romeCode: "H1209", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Fondamentaux de l'électronique, traitement du signal, conversion d'énergie.", onisepUrl: null },
  { slug: "bachelor-design-transport", nameFr: "Bachelor en Design Transport et Mobilité", rncpCode: "34604", romeCode: null, level: "licence-niv6", domain: "ingenierie-conception", jobTarget: null, onisepUrl: null },
  { slug: "lp-mstv", nameFr: "Licence Pro Management des Services de Transport de Voyageurs (MSTV)", rncpCode: "30121", romeCode: "N1301", level: "licence-niv6", domain: "transport-mobilite", jobTarget: "Organisation de la production de services de transport.", onisepUrl: null },
  { slug: "lp-grf", nameFr: "Licence Pro Gestion des Réseaux Ferrés (GRF)", rncpCode: "30048", romeCode: "N4401", level: "licence-niv6", domain: "transport-mobilite", jobTarget: "Métiers de gestion des réseaux ferrés, partenariat SNCF Réseau.", onisepUrl: null },
  { slug: "lp-exploitation-ferroviaire-cnam", nameFr: "Licence Pro Exploitation Ferroviaire (CNAM)", rncpCode: null, romeCode: "N4401", level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Conception et amélioration de processus industriels - Parcours Exploitation ferroviaire.", onisepUrl: null },

  // === NIVEAU 7 (MASTER / INGÉNIEUR) ===
  { slug: "master-transports-mobilites", nameFr: "Master Transports et Mobilités", rncpCode: "38965", romeCode: "N1301", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Conception des réseaux et urbanisme des transports guidés.", onisepUrl: null },
  { slug: "ingenieur-ferroviaire-estaca", nameFr: "Ingénieur Ferroviaire & Transports Guidés (ESTACA)", rncpCode: null, romeCode: "H1206", level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Seule école avec filière dédiée dès la 3e année. Liens forts Alstom/SNCF.", onisepUrl: null },
  { slug: "ingenieur-infra-ferro-imt", nameFr: "Ingénieur Génie des Infrastructures Ferroviaires (IMT)", rncpCode: null, romeCode: "F1201", level: "master-niv7", domain: "genie-civil-infra", jobTarget: "Formation d'ingénieur au cœur du pôle ferroviaire français.", onisepUrl: null },
  { slug: "ingenieur-transports-entpe", nameFr: "Ingénieur Voie d'approfondissement Transports (ENTPE)", rncpCode: null, romeCode: "F1201", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Infrastructures publiques et aménagement du territoire.", onisepUrl: null },
  { slug: "ingenieur-transports-ensam", nameFr: "Ingénieur Expertise Transports Terrestres (Arts et Métiers)", rncpCode: null, romeCode: "H1206", level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Matériel roulant, vibrations et motorisation.", onisepUrl: null },
  { slug: "ingenieur-gc-ge-insa", nameFr: "Ingénieur Génie Civil / Génie Électrique (INSA Hauts-de-France)", rncpCode: null, romeCode: "F1201", level: "master-niv7", domain: "genie-civil-infra", jobTarget: "Modules spécifiques ferroviaire grâce à la proximité industrie.", onisepUrl: null },
  { slug: "master-3et", nameFr: "Master Économie de l'Environnement, de l'Énergie et des Transports (3ET)", rncpCode: "38959", romeCode: "N1301", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Construit avec l'ENTPE, adossé au Laboratoire LAET.", onisepUrl: null },
  { slug: "master-turp", nameFr: "Master Transports Urbains et Régionaux de Personnes (TURP)", rncpCode: "38965", romeCode: "N1301", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Compétence pluridisciplinaire dans les transports.", onisepUrl: null },
  { slug: "master-tlic", nameFr: "Master Transports et Logistique Industrielle et Commerciale (TLIC)", rncpCode: "38965", romeCode: "N1302", level: "master-niv7", domain: "exploitation-circulation", jobTarget: "Pilotage des chaînes logistiques et de transport.", onisepUrl: null },
  { slug: "master-ter", nameFr: "Master Transport, Espace, Réseau (TER)", rncpCode: "38965", romeCode: "N1301", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Recherche et conseil en aménagement et transports.", onisepUrl: null },
  { slug: "designer-transport", nameFr: "Designer concepteur industriel option transport", rncpCode: "35411", romeCode: null, level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Design industriel spécialisé transport.", onisepUrl: null },

  // === NIVEAU 8 (MASTÈRE SPÉCIALISÉ) ===
  { slug: "mastere-stfu", nameFr: "Mastère Spécialisé Systèmes de Transports Ferroviaires et Urbains", rncpCode: null, romeCode: null, level: "mastere-niv8", domain: "ingenierie-conception", jobTarget: "Formation d'excellence pour futurs cadres dirigeants du secteur.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/mastere-spe.-systemes-de-transports-ferroviaires-et-urbains-ecole-des-ponts-paristech-insa-hauts-de-france-utc" },
  { slug: "mastere-smart-mobility", nameFr: "Mastère Spécialisé Smart Mobility", rncpCode: null, romeCode: null, level: "mastere-niv8", domain: "transport-mobilite", jobTarget: "Conception et gestion des systèmes de mobilité connectée.", onisepUrl: null },
  { slug: "mastere-ifrdd", nameFr: "Mastère Spécialisé Infrastructures Ferroviaires Résilientes, Durables et Digitalisées", rncpCode: null, romeCode: null, level: "mastere-niv8", domain: "genie-civil-infra", jobTarget: "Défis de l'infrastructure pour la mobilité ferroviaire.", onisepUrl: null },
];

// Establishments extracted from the Excel data with geocoded coordinates
const establishments: Array<{
  slug: string;
  name: string;
  city: string;
  region: string;
  type: string;
  lat: number;
  lng: number;
  website?: string;
}> = [
  // === ILE-DE-FRANCE ===
  { slug: "aforpa-idf", name: "AFORPA", city: "Issy-les-Moulineaux", region: "IDF", type: "cfa", lat: 48.8233, lng: 2.2614 },
  { slug: "ort-paris", name: "École de Travail ORT Paris", city: "Paris", region: "IDF", type: "lycee", lat: 48.8667, lng: 2.3625 },
  { slug: "ea-eco-activites-paris", name: "ÉA - Écoles des éco-activités", city: "Paris", region: "IDF", type: "cfa", lat: 48.8390, lng: 2.3008 },
  { slug: "cfa-ferroviaire-saint-denis", name: "AIJF CFA Ferroviaire", city: "Saint-Denis", region: "IDF", type: "cfa", lat: 48.9362, lng: 2.3574, website: "https://www.cfa-ferroviaire.fr/" },
  { slug: "afmae-bonneuil", name: "AFMAE - CFA des métiers de l'aérien", city: "Bonneuil-en-France", region: "IDF", type: "cfa", lat: 48.9741, lng: 2.4594 },
  { slug: "airsup-paris", name: "Airsup Paris", city: "Paris", region: "IDF", type: "autre", lat: 48.8763, lng: 2.3524 },
  { slug: "lp-beaugrenelle-paris", name: "LP Beaugrenelle", city: "Paris 15e", region: "IDF", type: "lycee", lat: 48.8450, lng: 2.2880 },
  { slug: "lp-painleve-courbevoie", name: "LP Paul-Painlevé", city: "Courbevoie", region: "IDF", type: "lycee", lat: 48.8967, lng: 2.2528 },
  { slug: "ecole-ponts-paristech", name: "École des Ponts ParisTech", city: "Champs-sur-Marne", region: "IDF", type: "grande-ecole", lat: 48.8410, lng: 2.5880, website: "https://ecoledesponts.fr/" },
  { slug: "estaca-paris", name: "ESTACA Paris-Saclay", city: "Saint-Quentin-en-Yvelines", region: "IDF", type: "ecole-ingenieur", lat: 48.7866, lng: 2.0490, website: "https://www.estaca.fr/" },
  { slug: "centralesupelec", name: "CentraleSupélec", city: "Gif-sur-Yvette", region: "IDF", type: "grande-ecole", lat: 48.7091, lng: 2.1660 },
  { slug: "lp-baudelaire-meaux", name: "LP Charles-Baudelaire", city: "Meaux", region: "IDF", type: "lycee", lat: 48.9606, lng: 2.8780 },
  { slug: "lp-auclert-chantilly", name: "LP Hubertine-Auclert", city: "Chantilly", region: "IDF", type: "lycee", lat: 49.1886, lng: 2.4718 },
  { slug: "telecom-paris", name: "Telecom Paris", city: "Palaiseau", region: "IDF", type: "grande-ecole", lat: 48.7148, lng: 2.2287, website: "https://www.telecom-paris.fr/" },
  { slug: "cfa-cnam-idf", name: "CFA CNAM Île-de-France", city: "La Plaine Saint-Denis", region: "IDF", type: "cfa", lat: 48.9170, lng: 2.3580, website: "https://cfa-idf.cnam.fr/" },
  { slug: "lycee-monod-enghien", name: "Lycée Polyvalent Gustave Monod", city: "Enghien-les-Bains", region: "IDF", type: "lycee", lat: 48.9720, lng: 2.3120, website: "https://www.lyc-polyvalent-monod-enghien.fr/" },

  // === HAUTS-DE-FRANCE ===
  { slug: "imt-nord-europe", name: "IMT Nord Europe", city: "Valenciennes", region: "HDF", type: "ecole-ingenieur", lat: 50.3340, lng: 3.5230, website: "https://imt-nord-europe.fr/" },
  { slug: "insa-hdf", name: "INSA Hauts-de-France", city: "Valenciennes", region: "HDF", type: "ecole-ingenieur", lat: 50.3300, lng: 3.5140, website: "https://www.insa-hautsdefrance.fr/" },
  { slug: "utc-compiegne", name: "UTC - Université de Technologie de Compiègne", city: "Compiègne", region: "HDF", type: "ecole-ingenieur", lat: 49.4149, lng: 2.8198, website: "https://www.utc.fr/" },
  { slug: "iut-lille", name: "IUT de Lille", city: "Lille", region: "HDF", type: "iut", lat: 50.6100, lng: 3.1380 },
  { slug: "iut-tourcoing", name: "IUT de Tourcoing (Univ. Lille)", city: "Tourcoing", region: "HDF", type: "iut", lat: 50.7233, lng: 3.1614 },
  { slug: "ciffco-cote-opale", name: "CIFFCO", city: "Boulogne-sur-Mer", region: "HDF", type: "cfa", lat: 50.7264, lng: 1.6147 },
  { slug: "lycee-tp-bertin-bruay", name: "Lycée des TP Jean Bertin", city: "Bruay-la-Buissière", region: "HDF", type: "lycee", lat: 50.4840, lng: 2.5498 },
  { slug: "iaag-morbecque", name: "IAAG Morbecque", city: "Morbecque", region: "HDF", type: "autre", lat: 50.6886, lng: 2.5151 },
  { slug: "cfa-ferroviaire-arras", name: "CFA Ferroviaire - Arras", city: "Arras", region: "HDF", type: "cfa", lat: 50.2910, lng: 2.7775 },
  { slug: "lycee-carnot-bruay", name: "Lycée polyvalent Carnot", city: "Bruay-la-Buissière", region: "HDF", type: "lycee", lat: 50.4897, lng: 2.5523, website: "http://www.lyceecarnot.fr/" },
  { slug: "lycee-colbert-tourcoing", name: "Lycée polyvalent Colbert", city: "Tourcoing", region: "HDF", type: "lycee", lat: 50.7200, lng: 3.1600 },

  // === OCCITANIE ===
  { slug: "lycee-st-joseph-toulouse", name: "Lycée St Joseph La Salle", city: "Toulouse", region: "OCC", type: "lycee", lat: 43.6045, lng: 1.4340 },
  { slug: "lycee-deodat-severac-toulouse", name: "Lycée Déodat de Séverac", city: "Toulouse", region: "OCC", type: "lycee", lat: 43.6284, lng: 1.3990 },
  { slug: "lycee-borde-basse-castres", name: "Lycée La Borde Basse", city: "Castres", region: "OCC", type: "lycee", lat: 43.6066, lng: 2.2398 },
  { slug: "lycee-de-la-salle-albi", name: "Lycée De La Salle", city: "Albi", region: "OCC", type: "lycee", lat: 43.9266, lng: 2.1478 },
  { slug: "lycee-monnerville-cahors", name: "Lycée Gaston Monnerville", city: "Cahors", region: "OCC", type: "lycee", lat: 44.4475, lng: 1.4393 },
  { slug: "lycee-dupuy-tarbes", name: "Lycée Jean Dupuy", city: "Tarbes", region: "OCC", type: "lycee", lat: 43.2327, lng: 0.0774 },
  { slug: "aftral-toulouse", name: "Centre de formation AFTRAL", city: "Toulouse", region: "OCC", type: "cfa", lat: 43.5960, lng: 1.4321, website: "https://www.aftral.com/" },

  // === AUVERGNE-RHÔNE-ALPES ===
  { slug: "universite-lyon-2", name: "Université Lumière Lyon 2", city: "Lyon", region: "ARA", type: "universite", lat: 45.7480, lng: 4.8360, website: "https://www.univ-lyon2.fr/" },
  { slug: "entpe-lyon", name: "ENTPE Lyon", city: "Vaulx-en-Velin", region: "ARA", type: "ecole-ingenieur", lat: 45.7810, lng: 4.9260, website: "https://www.entpe.fr/" },
  { slug: "esima-lyon", name: "ESIMA Lyon", city: "Lyon", region: "ARA", type: "autre", lat: 45.7640, lng: 4.8350 },
  { slug: "ecole-saint-louis-valence", name: "École Saint-Louis", city: "Valence", region: "ARA", type: "lycee", lat: 44.9334, lng: 4.8924 },
  { slug: "lycee-bonte-riom", name: "Lycée P.-J. Bonté", city: "Riom", region: "ARA", type: "lycee", lat: 45.8936, lng: 3.1142 },
  { slug: "estaca-laval", name: "ESTACA Laval", city: "Laval", region: "PDL", type: "ecole-ingenieur", lat: 48.0666, lng: -0.7721 },
  { slug: "cfa-ferroviaire-lyon", name: "CFA Ferroviaire - Lyon", city: "Saint-Priest", region: "ARA", type: "cfa", lat: 45.6945, lng: 4.9500 },

  // === BRETAGNE ===
  { slug: "lycee-ozanam-bretagne", name: "Lycée F. Ozanam", city: "Cesson-Sévigné", region: "BRE", type: "lycee", lat: 48.1211, lng: -1.6015 },
  { slug: "compagnons-devoir-rennes", name: "Compagnons du Devoir - Rennes", city: "Rennes", region: "BRE", type: "cfa", lat: 48.1113, lng: -1.6800 },

  // === CENTRE-VAL DE LOIRE ===
  { slug: "sainte-croix-saint-euverte-orleans", name: "Ensemble scolaire Sainte-Croix Saint-Euverte", city: "Orléans", region: "CVL", type: "lycee", lat: 47.9029, lng: 1.9090 },
  { slug: "compagnons-devoir-tours", name: "Compagnons du Devoir - Tours", city: "Tours", region: "CVL", type: "cfa", lat: 47.3941, lng: 0.6848 },

  // === PROVENCE-ALPES-CÔTE D'AZUR ===
  { slug: "lp-rene-caillie-marseille", name: "LP René Caillié", city: "Marseille", region: "PAC", type: "lycee", lat: 43.3045, lng: 5.3878 },

  // === GRAND EST ===
  { slug: "lp-decomble-chaumont", name: "LP Eugène Decomble", city: "Chaumont", region: "GES", type: "lycee", lat: 48.1113, lng: 5.1388 },
  { slug: "cfa-ferroviaire-strasbourg", name: "CFA Ferroviaire - Strasbourg", city: "Schiltigheim", region: "GES", type: "cfa", lat: 48.6083, lng: 7.7487 },

  // === MARTINIQUE ===
  { slug: "lp-bissol-lamentin", name: "LP Léopold Bissol", city: "Le Lamentin", region: "MTQ", type: "lycee", lat: 14.6100, lng: -60.9715 },

  // === NOUVELLE-AQUITAINE ===
  { slug: "cfa-ferroviaire-begles", name: "CFA Ferroviaire - Bègles", city: "Bègles", region: "NAQ", type: "cfa", lat: 44.8056, lng: -0.5486 },
  { slug: "ferrocampus-saintes", name: "Ferrocampus - Campus des métiers du ferroviaire", city: "Saintes", region: "NAQ", type: "cfa", lat: 45.7461, lng: -0.6320, website: "https://www.ferrocampus.fr" },
  { slug: "fma-formation-agen", name: "FMA Formation - Centre de Formation Ferroviaire", city: "Agen", region: "NAQ", type: "cfa", lat: 44.203, lng: 0.617, website: "https://formationferroviaire.fr/" },
  { slug: "ikn-formation-biard", name: "IKN Formation", city: "Biard", region: "NAQ", type: "cfa", lat: 46.5864, lng: 0.3132, website: "https://www.ikn-ferro.com/" },
  { slug: "estaca-bordeaux", name: "ESTACA Bordeaux", city: "Bordeaux", region: "NAQ", type: "ecole-ingenieur", lat: 44.8275, lng: -0.5560, website: "https://www.estaca.fr/" },

  // === PAYS DE LA LOIRE ===
  { slug: "cfa-ferroviaire-le-mans", name: "CFA Ferroviaire - Le Mans", city: "Le Mans", region: "PDL", type: "cfa", lat: 47.9960, lng: 0.1930 },
  { slug: "omnifer-saint-laurent", name: "OMNIFER - Formations Ferroviaires", city: "Saint-Laurent-sur-Sèvre", region: "PDL", type: "cfa", lat: 46.959, lng: -0.893, website: "https://www.omnifer.fr/" },

  // === HAUTS-DE-FRANCE ===
  { slug: "ciffco-coquelles", name: "CIFFCO - Centre International de Formation Ferroviaire", city: "Coquelles", region: "HDF", type: "cfa", lat: 50.928, lng: 1.806, website: "https://ciffco.com/" },
  { slug: "cmq-fiaem-valenciennes", name: "CMQ FIAEM - Campus des Métiers Ferroviaire et Écomobilité", city: "Valenciennes", region: "HDF", type: "cfa", lat: 50.358, lng: 3.523 },
  { slug: "railenium-valenciennes", name: "Railenium - Institut de Recherche Technologique Ferroviaire", city: "Valenciennes", region: "HDF", type: "ecole-ingenieur", lat: 50.313, lng: 3.514, website: "https://railenium.eu/" },
  { slug: "campusfer-hazebrouck", name: "CampusFER Hazebrouck", city: "Hazebrouck", region: "HDF", type: "cfa", lat: 50.725, lng: 2.539, website: "https://www.campusfer.com/" },

  // === ÎLE-DE-FRANCE ===
  { slug: "etf-academy-beauchamp", name: "ETF Academy (VINCI)", city: "Beauchamp", region: "IDF", type: "cfa", lat: 49.012, lng: 2.190, website: "https://www.etf.fr/" },
  { slug: "lea-itedec-aubergenville", name: "L'EA-ITEDEC - Plateforme ferroviaire", city: "Aubergenville", region: "IDF", type: "cfa", lat: 48.960, lng: 1.854, website: "https://www.ecole-lea.fr/" },
  { slug: "academie-transdev-issy", name: "Académie by Transdev", city: "Issy-les-Moulineaux", region: "IDF", type: "cfa", lat: 48.8235, lng: 2.2615 },
  { slug: "alstom-training-saint-ouen", name: "Alstom Training & Simulation", city: "Saint-Ouen-sur-Seine", region: "IDF", type: "cfa", lat: 48.9118, lng: 2.3340, website: "https://www.alstom.com/" },
  { slug: "ca2p-quincy-sous-senart", name: "CA2P", city: "Quincy-sous-Sénart", region: "IDF", type: "cfa", lat: 48.6712, lng: 2.5283 },
  { slug: "db-cargo-france-aubervilliers", name: "DB Cargo France", city: "Aubervilliers", region: "IDF", type: "cfa", lat: 48.9176, lng: 2.3833, website: "https://fr.dbcargo.com/" },
  { slug: "egr-buc", name: "École de Gestion des Risques (EGR)", city: "Buc", region: "IDF", type: "cfa", lat: 48.7730, lng: 2.1230, website: "https://www.ecoledegestiondesrisques.fr/" },
  { slug: "ferrotrainjob-paris", name: "FerroTrainJob", city: "Paris 8e", region: "IDF", type: "cfa", lat: 48.8740, lng: 2.3170, website: "https://www.ferrotrainjob.fr/" },
  { slug: "hexafret-campus-saint-ouen", name: "Hexafret - Campus Hexafret", city: "Saint-Ouen-sur-Seine", region: "IDF", type: "cfa", lat: 48.9083, lng: 2.3320, website: "https://www.hexafret.com/" },
  { slug: "ratp-formation-paris", name: "RATP - Formation Conduite", city: "Paris 20e", region: "IDF", type: "cfa", lat: 48.8530, lng: 2.4050, website: "https://www.ratp.fr/" },
  { slug: "sncf-voyageurs-unft-saint-denis", name: "SNCF Voyageurs UNFT - Campus Campra", city: "La Plaine Saint-Denis", region: "IDF", type: "cfa", lat: 48.9170, lng: 2.3580, website: "https://www.sncf.com/" },

  // === ARTS ET MÉTIERS (MULTI-SITES) ===
  { slug: "arts-metiers-paris", name: "Arts et Métiers (ENSAM)", city: "Paris", region: "IDF", type: "grande-ecole", lat: 48.8382, lng: 2.3620 },

  // === SNCF ===
  { slug: "universite-traction-sncf", name: "Université Traction - SNCF Voyageurs", city: "Paris", region: "IDF", type: "autre", lat: 48.8410, lng: 2.3599 },

  // === NORMANDIE ===
  { slug: "digirail-le-havre", name: "DigiRail - Formation et Expertise Ferroviaire", city: "Le Havre", region: "NOR", type: "cfa", lat: 49.4944, lng: 0.1079, website: "https://www.digirail.fr" },

  // === BOURGOGNE-FRANCHE-COMTÉ ===
  { slug: "sferis-formation-autun", name: "SFERIS Formation", city: "Autun", region: "BFC", type: "cfa", lat: 46.951, lng: 4.299, website: "https://www.sferis.fr/formation/" },
  { slug: "formafer-chevigny", name: "FORM@FER", city: "Chevigny-Saint-Sauveur", region: "BFC", type: "cfa", lat: 47.300, lng: 5.136 },

  // === GRAND EST ===
  { slug: "captrain-formation-creutzwald", name: "Captrain Formation", city: "Creutzwald", region: "GES", type: "cfa", lat: 49.069, lng: 6.694, website: "https://www.captrain.fr/" },

  // === CENTRE-VAL DE LOIRE ===
  { slug: "formarail-ballan-mire", name: "Forma'Rail", city: "Ballan-Miré", region: "CVL", type: "cfa", lat: 47.347, lng: 0.614, website: "https://forma-rail.com/" },
  { slug: "gtif-saint-pierre-des-corps", name: "GTIF - Gestion des Techniques d'Ingénierie et de Formation", city: "Saint-Pierre-des-Corps", region: "CVL", type: "cfa", lat: 47.3861, lng: 0.7236, website: "https://gtif.fr/" },

  // === OCCITANIE ===
  { slug: "efmo-perols", name: "EFMO - École du Ferroviaire et des Mobilités d'Occitanie", city: "Pérols", region: "OCC", type: "cfa", lat: 43.529, lng: 3.956 },
  { slug: "campusfer-nimes", name: "CampusFER Nîmes", city: "Nîmes", region: "OCC", type: "cfa", lat: 43.837, lng: 4.360, website: "https://www.campusfer.com/" },

  // === PROVENCE-ALPES-CÔTE D'AZUR ===
  { slug: "plate-forme-nge-tarascon", name: "PLATE FORME (Groupe NGE)", city: "Tarascon", region: "PAC", type: "cfa", lat: 43.798, lng: 4.653, website: "https://plateforme.nge.fr/" },

  // === NEW - CFA FERROVIAIRE PARTNER LYCEES ===
  { slug: "lp-chenneviere-malezieux-paris", name: "LP Chennevière Malézieux", city: "Paris 12e", region: "IDF", type: "lycee", lat: 48.849, lng: 2.372 },
  { slug: "lycee-louis-armand-eaubonne", name: "Lycée Louis Armand", city: "Eaubonne", region: "IDF", type: "lycee", lat: 48.9967, lng: 2.2895 },
  { slug: "lycee-bergson-jacquard-paris", name: "Lycée Henri Bergson-Jacquard", city: "Paris 19e", region: "IDF", type: "lycee", lat: 48.883, lng: 2.377 },
  { slug: "lycee-hector-guimard-lyon", name: "Lycée Hector Guimard", city: "Lyon 7e", region: "ARA", type: "lycee", lat: 45.743, lng: 4.838 },
  { slug: "lycee-foucauld-schiltigheim", name: "Lycée Charles de Foucauld", city: "Schiltigheim", region: "GES", type: "lycee", lat: 48.608, lng: 7.749, website: "https://www.lyceefoucauld.fr/" },
  { slug: "lycee-savary-ferry-arras", name: "Lycée Professionnel Savary Ferry", city: "Arras", region: "HDF", type: "lycee", lat: 50.287, lng: 2.78 },

  // === NEW - SNCF TRAINING ===
  { slug: "campus-sncf-nanterre", name: "Campus SNCF Réseau Paris-Nanterre", city: "Nanterre", region: "IDF", type: "cfa", lat: 48.8988, lng: 2.1969 },
  { slug: "campus-fer-grenay", name: "CampusFER", city: "Grenay", region: "ARA", type: "cfa", lat: 45.663, lng: 5.089, website: "https://www.campusfer.com/" },

  // === NEW - BAC PRO OTM LYCEES ===
  { slug: "lp-fontaine-anzin", name: "LP Pierre-Joseph Fontaine", city: "Anzin", region: "HDF", type: "lycee", lat: 50.372, lng: 3.503 },
  { slug: "lycee-catalins-montelimar", name: "Lycée Les Catalins", city: "Montélimar", region: "ARA", type: "lycee", lat: 44.558, lng: 4.75, website: "https://www.catalins.fr/" },
  { slug: "lycee-oehmichen-chalons", name: "Lycée Étienne Oehmichen", city: "Châlons-en-Champagne", region: "GES", type: "lycee", lat: 48.9566, lng: 4.3631 },
  { slug: "lycee-saint-exupery-creteil", name: "Lycée Antoine de Saint-Exupéry", city: "Créteil", region: "IDF", type: "lycee", lat: 48.775, lng: 2.453 },

  // === NEW - BAC PRO TP LYCEES ===
  { slug: "lycee-freyssinet-saint-brieuc", name: "Lycée Eugène Freyssinet", city: "Saint-Brieuc", region: "BRE", type: "lycee", lat: 48.511, lng: -2.764 },
  { slug: "lycee-caraminot-egletons", name: "Lycée Pierre Caraminot", city: "Égletons", region: "NAQ", type: "lycee", lat: 45.407, lng: 2.046 },
  { slug: "lycee-vinci-blanquefort", name: "Lycée Léonard de Vinci", city: "Blanquefort", region: "NAQ", type: "lycee", lat: 44.911, lng: -0.636 },

  // === NEW - BTS LYCEES ===
  { slug: "lycee-martiniere-diderot-lyon", name: "Lycée La Martinière-Diderot", city: "Lyon 1er", region: "ARA", type: "lycee", lat: 45.772, lng: 4.828, website: "https://www.lamartinierediderot.fr/" },
  { slug: "lp-leonard-vinci-bagneux", name: "Lycée Professionnel Léonard de Vinci", city: "Bagneux", region: "IDF", type: "lycee", lat: 48.799, lng: 2.3167 },
  { slug: "lycee-gaston-berger-lille", name: "Lycée Gaston Berger", city: "Lille", region: "HDF", type: "lycee", lat: 50.61, lng: 3.07, website: "https://www.gastonberger.fr/" },
  { slug: "lycee-gallieni-toulouse", name: "Lycée Joseph Gallieni", city: "Toulouse", region: "OCC", type: "lycee", lat: 43.589, lng: 1.475 },
  { slug: "lycee-eiffel-talange", name: "Lycée des Métiers Gustave Eiffel", city: "Talange", region: "GES", type: "lycee", lat: 49.226, lng: 6.168 },
  { slug: "lycee-livet-nantes", name: "Lycée Livet", city: "Nantes", region: "PDL", type: "lycee", lat: 47.206, lng: -1.553 },
  { slug: "lycee-laplace-caen", name: "Lycée Pierre-Simon de Laplace", city: "Caen", region: "NOR", type: "lycee", lat: 49.18, lng: -0.358 },

  // === NEW - CS ACCUEIL TRANSPORTS ===
  { slug: "lycee-sacre-coeur-nantes", name: "Lycée Sacré-Cœur La Salle", city: "Nantes", region: "PDL", type: "lycee", lat: 47.215, lng: -1.543 },
  { slug: "lycee-les-palmiers-nice", name: "Lycée Les Palmiers", city: "Nice", region: "PAC", type: "lycee", lat: 43.71, lng: 7.28 },

  // === NEW - IUTs ===
  { slug: "iut-tremblay-paris8", name: "IUT de Tremblay-en-France (Paris 8)", city: "Tremblay-en-France", region: "IDF", type: "iut", lat: 48.96, lng: 2.561, website: "https://www.iutt.univ-paris8.fr/" },
  { slug: "iut-lumiere-lyon2", name: "IUT Lumière Lyon 2", city: "Bron", region: "ARA", type: "iut", lat: 45.731, lng: 4.911 },
  { slug: "iut-saint-denis", name: "IUT de Saint-Denis", city: "Saint-Denis", region: "IDF", type: "iut", lat: 48.946, lng: 2.364 },
  { slug: "iut-valenciennes", name: "IUT de Valenciennes (UPHF)", city: "Valenciennes", region: "HDF", type: "iut", lat: 50.334, lng: 3.514 },
  { slug: "iut-lyon1-villeurbanne", name: "IUT Lyon 1", city: "Villeurbanne", region: "ARA", type: "iut", lat: 45.767, lng: 4.879 },
  { slug: "iut-ville-avray", name: "IUT de Ville d'Avray (Paris Nanterre)", city: "Ville-d'Avray", region: "IDF", type: "iut", lat: 48.8268, lng: 2.1899 },
  { slug: "iut-cachan", name: "IUT de Cachan (Paris-Saclay)", city: "Cachan", region: "IDF", type: "iut", lat: 48.788, lng: 2.336 },
  { slug: "iut-rennes", name: "IUT de Rennes", city: "Rennes", region: "BRE", type: "iut", lat: 48.121, lng: -1.639 },
  { slug: "iut-belfort", name: "IUT Nord Franche-Comté", city: "Belfort", region: "BFC", type: "iut", lat: 47.637, lng: 6.863 },
  { slug: "iut-bordeaux", name: "IUT de Bordeaux", city: "Bordeaux", region: "NAQ", type: "iut", lat: 44.838, lng: -0.57 },

  // === NEW - CNAM CENTERS ===
  { slug: "cnam-hauts-de-france", name: "CNAM Hauts-de-France", city: "Amiens", region: "HDF", type: "autre", lat: 49.89, lng: 2.3, website: "https://www.cnam-hauts-de-france.fr/" },
  { slug: "cnam-nouvelle-aquitaine", name: "CNAM Nouvelle-Aquitaine", city: "Bordeaux", region: "NAQ", type: "autre", lat: 44.8378, lng: -0.5792 },
  { slug: "cnam-pays-de-la-loire", name: "CNAM Pays de la Loire", city: "Nantes", region: "PDL", type: "autre", lat: 47.2184, lng: -1.5536 },

  // === NEW - MASTER/INGENIEUR ===
  { slug: "sorbonne-universite", name: "Sorbonne Université", city: "Paris", region: "IDF", type: "universite", lat: 48.8462, lng: 2.3564, website: "https://www.sorbonne-universite.fr/" },
  { slug: "universite-gustave-eiffel", name: "Université Gustave Eiffel", city: "Champs-sur-Marne", region: "IDF", type: "universite", lat: 48.841, lng: 2.588 },
  { slug: "arts-metiers-lille", name: "Arts et Métiers (ENSAM) - Lille", city: "Lille", region: "HDF", type: "grande-ecole", lat: 50.6310, lng: 3.0470 },
  { slug: "creapole-paris", name: "CREAPOLE", city: "Paris", region: "IDF", type: "autre", lat: 48.8606, lng: 2.3482, website: "https://www.creapole.fr/" },
  { slug: "strate-sevres", name: "Strate École de Design", city: "Sèvres", region: "IDF", type: "autre", lat: 48.8240, lng: 2.2100, website: "https://www.stfrancrate.design/" },
  { slug: "ecole-design-nantes", name: "École de Design Nantes Atlantique", city: "Nantes", region: "PDL", type: "autre", lat: 47.2078, lng: -1.5472, website: "https://www.lecolededesign.com/" },
  { slug: "rubika-valenciennes", name: "Rubika", city: "Valenciennes", region: "HDF", type: "autre", lat: 50.333, lng: 3.518, website: "https://rubika-edu.com/" },
  { slug: "cesi-nanterre", name: "CESI", city: "Nanterre", region: "IDF", type: "ecole-ingenieur", lat: 48.892, lng: 2.215, website: "https://www.cesi.fr/" },

  // === NEW - GRANDES ECOLES & TOP ENGINEERING SCHOOLS ===
  { slug: "ecole-polytechnique", name: "École Polytechnique", city: "Palaiseau", region: "IDF", type: "grande-ecole", lat: 48.7118, lng: 2.2052, website: "https://www.polytechnique.edu/" },
  { slug: "mines-paris-psl", name: "Mines Paris - PSL", city: "Paris", region: "IDF", type: "grande-ecole", lat: 48.8451, lng: 2.3392, website: "https://www.minesparis.psl.eu/" },
  { slug: "ensta-paris", name: "ENSTA Paris", city: "Palaiseau", region: "IDF", type: "grande-ecole", lat: 48.7110, lng: 2.2193, website: "https://www.ensta-paris.fr/" },
  { slug: "isae-supaero", name: "ISAE-SUPAERO", city: "Toulouse", region: "OCC", type: "grande-ecole", lat: 43.5667, lng: 1.4747, website: "https://www.isae-supaero.fr/" },
  { slug: "isae-ensma", name: "ISAE-ENSMA", city: "Chasseneuil-du-Poitou", region: "NAQ", type: "ecole-ingenieur", lat: 46.6614, lng: 0.3613, website: "https://www.ensma.fr/" },
  { slug: "isae-supmeca", name: "ISAE-Supméca", city: "Saint-Ouen-sur-Seine", region: "IDF", type: "ecole-ingenieur", lat: 48.9122, lng: 2.3340, website: "https://www.isae-supmeca.fr/" },
  { slug: "cnam-paris", name: "CNAM Paris", city: "Paris", region: "IDF", type: "grande-ecole", lat: 48.8665, lng: 2.3549, website: "https://www.cnam.fr/" },
  { slug: "enac-toulouse", name: "ENAC Toulouse", city: "Toulouse", region: "OCC", type: "grande-ecole", lat: 43.5652, lng: 1.4793, website: "https://www.enac.fr/" },

  // === NEW - ECOLES D'INGENIEURS TRANSPORT/FERROVIAIRE ===
  { slug: "eigsi-la-rochelle", name: "EIGSI La Rochelle", city: "La Rochelle", region: "NAQ", type: "ecole-ingenieur", lat: 46.1570, lng: -1.1519, website: "https://www.eigsi.fr/" },
  { slug: "enseeiht-toulouse", name: "ENSEEIHT Toulouse (INP)", city: "Toulouse", region: "OCC", type: "ecole-ingenieur", lat: 43.6020, lng: 1.4544, website: "https://www.enseeiht.fr/" },
  { slug: "enseirb-matmeca", name: "ENSEIRB-MATMECA (Bordeaux INP)", city: "Talence", region: "NAQ", type: "ecole-ingenieur", lat: 44.8066, lng: -0.6052, website: "https://enseirb-matmeca.bordeaux-inp.fr/" },
  { slug: "ece-paris", name: "ECE Paris", city: "Paris", region: "IDF", type: "ecole-ingenieur", lat: 48.8505, lng: 2.2888, website: "https://www.ece.fr/" },
  { slug: "epf-cachan", name: "EPF", city: "Cachan", region: "IDF", type: "ecole-ingenieur", lat: 48.7895, lng: 2.3270, website: "https://www.epf.fr/" },
  { slug: "esiee-paris", name: "ESIEE Paris", city: "Noisy-le-Grand", region: "IDF", type: "ecole-ingenieur", lat: 48.8403, lng: 2.5840, website: "https://www.esiee.fr/" },
  { slug: "esigelec-rouen", name: "ESIGELEC", city: "Saint-Étienne-du-Rouvray", region: "NOR", type: "ecole-ingenieur", lat: 49.3830, lng: 1.0750, website: "https://www.esigelec.fr/" },
  { slug: "junia-hei-lille", name: "Junia HEI", city: "Lille", region: "HDF", type: "ecole-ingenieur", lat: 50.6302, lng: 3.0417, website: "https://www.junia.com/" },
  { slug: "ecam-lasalle-lyon", name: "ECAM LaSalle", city: "Lyon", region: "ARA", type: "ecole-ingenieur", lat: 45.7625, lng: 4.8250, website: "https://www.ecam.fr/" },
  { slug: "icam-lille", name: "ICAM Lille", city: "Lille", region: "HDF", type: "ecole-ingenieur", lat: 50.6302, lng: 3.0417, website: "https://www.icam.fr/" },
  { slug: "icam-toulouse", name: "ICAM Toulouse", city: "Toulouse", region: "OCC", type: "ecole-ingenieur", lat: 43.6130, lng: 1.4180, website: "https://www.icam.fr/" },
  { slug: "icam-nantes", name: "ICAM Nantes", city: "Carquefou", region: "PDL", type: "ecole-ingenieur", lat: 47.2967, lng: -1.4919, website: "https://www.icam.fr/" },

  // === NEW - ENI NETWORK ===
  { slug: "enim-metz", name: "ENIM Metz", city: "Metz", region: "GES", type: "ecole-ingenieur", lat: 49.1033, lng: 6.2192, website: "https://enim.univ-lorraine.fr/" },
  { slug: "enit-tarbes", name: "ENIT Tarbes", city: "Tarbes", region: "OCC", type: "ecole-ingenieur", lat: 43.2327, lng: 0.0700, website: "https://www.enit.fr/" },
  { slug: "enib-brest", name: "ENIB Brest", city: "Plouzané", region: "BRE", type: "ecole-ingenieur", lat: 48.3604, lng: -4.5657, website: "https://www.enib.fr/" },
  { slug: "enise-saint-etienne", name: "Centrale Lyon ENISE", city: "Saint-Étienne", region: "ARA", type: "ecole-ingenieur", lat: 45.4389, lng: 4.3900, website: "https://enise.ec-lyon.fr/" },

  // === NEW - ARTS ET METIERS CAMPUSES ===
  { slug: "arts-metiers-bordeaux", name: "Arts et Métiers (ENSAM) - Bordeaux", city: "Talence", region: "NAQ", type: "grande-ecole", lat: 44.8069, lng: -0.5960, website: "https://artsetmetiers.fr/" },
  { slug: "arts-metiers-metz", name: "Arts et Métiers (ENSAM) - Metz", city: "Metz", region: "GES", type: "grande-ecole", lat: 49.1200, lng: 6.1600, website: "https://artsetmetiers.fr/" },
  { slug: "arts-metiers-aix", name: "Arts et Métiers (ENSAM) - Aix-en-Provence", city: "Aix-en-Provence", region: "PAC", type: "grande-ecole", lat: 43.5123, lng: 5.4536, website: "https://artsetmetiers.fr/" },
  { slug: "arts-metiers-angers", name: "Arts et Métiers (ENSAM) - Angers", city: "Angers", region: "PDL", type: "grande-ecole", lat: 47.4712, lng: -0.5554, website: "https://artsetmetiers.fr/" },
  { slug: "arts-metiers-chalons", name: "Arts et Métiers (ENSAM) - Châlons-en-Champagne", city: "Châlons-en-Champagne", region: "GES", type: "grande-ecole", lat: 48.9570, lng: 4.3630, website: "https://artsetmetiers.fr/" },

  // === NEW - POLYTECH NETWORK ===
  { slug: "polytech-lille", name: "Polytech Lille", city: "Villeneuve-d'Ascq", region: "HDF", type: "ecole-ingenieur", lat: 50.6082, lng: 3.1387, website: "https://www.polytech-lille.fr/" },
  { slug: "polytech-nantes", name: "Polytech Nantes", city: "Nantes", region: "PDL", type: "ecole-ingenieur", lat: 47.2833, lng: -1.5153, website: "https://polytech.univ-nantes.fr/" },
  { slug: "polytech-lyon", name: "Polytech Lyon", city: "Villeurbanne", region: "ARA", type: "ecole-ingenieur", lat: 45.7810, lng: 4.8680, website: "https://polytech.univ-lyon1.fr/" },
  { slug: "polytech-marseille", name: "Polytech Marseille", city: "Marseille", region: "PAC", type: "ecole-ingenieur", lat: 43.2330, lng: 5.4410, website: "https://polytech.univ-amu.fr/" },
  { slug: "polytech-clermont", name: "Polytech Clermont", city: "Aubière", region: "ARA", type: "ecole-ingenieur", lat: 45.7620, lng: 3.1110, website: "https://polytech-clermont.fr/" },
  { slug: "polytech-orleans", name: "Polytech Orléans", city: "Orléans", region: "CVL", type: "ecole-ingenieur", lat: 47.8460, lng: 1.9370, website: "https://www.univ-orleans.fr/fr/polytech" },
  { slug: "polytech-tours", name: "Polytech Tours", city: "Tours", region: "CVL", type: "ecole-ingenieur", lat: 47.3669, lng: 0.7560, website: "https://polytech.univ-tours.fr/" },

  // === NEW - UNIVERSITES ===
  { slug: "universite-lille", name: "Université de Lille", city: "Villeneuve-d'Ascq", region: "HDF", type: "universite", lat: 50.6083, lng: 3.1380, website: "https://www.univ-lille.fr/" },
  { slug: "universite-paris-saclay", name: "Université Paris-Saclay", city: "Gif-sur-Yvette", region: "IDF", type: "universite", lat: 48.7093, lng: 2.1683, website: "https://www.universite-paris-saclay.fr/" },

  // === NEW - IUTs SUPPLEMENTAIRES ===
  { slug: "iut-louis-pasteur-strasbourg", name: "IUT Louis Pasteur (Strasbourg)", city: "Schiltigheim", region: "GES", type: "iut", lat: 48.6100, lng: 7.7450, website: "https://iutlps.unistra.fr/" },
  { slug: "iut-gradignan-bordeaux", name: "IUT de Bordeaux (Gradignan)", city: "Gradignan", region: "NAQ", type: "iut", lat: 44.7730, lng: -0.6125, website: "https://www.iut.u-bordeaux.fr/" },
  { slug: "iut-blagnac", name: "IUT de Blagnac", city: "Blagnac", region: "OCC", type: "iut", lat: 43.6350, lng: 1.3890, website: "https://www.iut-blagnac.fr/" },
  { slug: "iut-senart-fontainebleau", name: "IUT Sénart-Fontainebleau", city: "Lieusaint", region: "IDF", type: "iut", lat: 48.6283, lng: 2.5578, website: "https://www.iutsf.u-pec.fr/" },
  { slug: "iut-mulhouse", name: "IUT de Mulhouse", city: "Mulhouse", region: "GES", type: "iut", lat: 47.7493, lng: 7.3417, website: "https://www.iut-mulhouse.uha.fr/" },
  { slug: "iut-lorient", name: "IUT de Lorient-Pontivy", city: "Lorient", region: "BRE", type: "iut", lat: 47.7486, lng: -3.3659, website: "https://www-iutlorient.univ-ubs.fr/" },
  { slug: "iut-mantes", name: "IUT de Mantes", city: "Mantes-la-Jolie", region: "IDF", type: "iut", lat: 48.9895, lng: 1.7110, website: "https://www.iut-mantes.uvsq.fr/" },
  { slug: "iut-bethune", name: "IUT de Béthune", city: "Béthune", region: "HDF", type: "iut", lat: 50.5316, lng: 2.6500, website: "https://iut-bethune.univ-artois.fr/" },
];

// Métiers from futurentrain.fr and aveclindustrieferroviaire.fr
const metiers = [
  // === CONDUITE (futurentrain) ===
  { slug: "conducteur-train", nameFr: "Conducteur / Conductrice de train", family: "Conduite", source: "futurentrain", level: "BAC" },
  { slug: "conducteur-train-fret", nameFr: "Conducteur / Conductrice de train de fret", family: "Conduite", source: "futurentrain", level: "BAC" },
  { slug: "conducteur-tramway", nameFr: "Conducteur / Conductrice de tramway", family: "Conduite", source: "futurentrain", level: "CAP" },
  { slug: "conducteur-metro", nameFr: "Conducteur / Conductrice de métro", family: "Conduite", source: "futurentrain", level: "CAP" },
  { slug: "conducteur-rer", nameFr: "Conducteur / Conductrice de RER", family: "Conduite", source: "futurentrain", level: "BAC" },

  // === GESTION DU TRAFIC (futurentrain) ===
  { slug: "aiguilleur", nameFr: "Aiguilleur / Aiguilleuse", family: "Gestion du trafic", source: "futurentrain", level: "BAC" },
  { slug: "agent-circulation", nameFr: "Agent de circulation ferroviaire", family: "Gestion du trafic", source: "futurentrain", level: "BAC" },
  { slug: "regulateur-transports", nameFr: "Régulateur / Régulatrice des transports", family: "Gestion du trafic", source: "futurentrain", level: "BAC+2" },
  { slug: "agent-escale", nameFr: "Agent d'escale ferroviaire", family: "Gestion du trafic", source: "futurentrain", level: "CAP" },

  // === MAINTENANCE (futurentrain) ===
  { slug: "technicien-maintenance-ferro", nameFr: "Technicien de maintenance des systèmes ferroviaires", family: "Maintenance", source: "futurentrain", level: "BAC" },
  { slug: "electricien-industriel-ferro", nameFr: "Électricien industriel ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "mecanicien-maintenance-ferro", nameFr: "Mécanicien de maintenance ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "chaudronnier-ferro", nameFr: "Chaudronnier ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "soudeur-ferro", nameFr: "Soudeur ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "agent-maintenance-installations", nameFr: "Agent de maintenance des installations ferroviaires", family: "Maintenance", source: "futurentrain", level: "BAC" },
  { slug: "technicien-signalisation", nameFr: "Technicien en signalisation ferroviaire", family: "Maintenance", source: "futurentrain", level: "BAC+2" },
  { slug: "technicien-catenaire", nameFr: "Technicien caténaire", family: "Maintenance", source: "futurentrain", level: "BAC" },
  { slug: "operateur-maintenance-voies", nameFr: "Opérateur de maintenance des voies", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "technicien-systemes-embarques", nameFr: "Technicien de maintenance des systèmes embarqués", family: "Maintenance", source: "futurentrain", level: "BAC" },
  { slug: "peintre-industriel-ferro", nameFr: "Peintre industriel ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },
  { slug: "agent-manoeuvre", nameFr: "Agent de manœuvre ferroviaire", family: "Maintenance", source: "futurentrain", level: "CAP" },

  // === INGÉNIERIE & CONCEPTION (aveclindustrieferroviaire) ===
  { slug: "ingenieur-conception-materiel", nameFr: "Ingénieur conception matériel roulant", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "technicien-essais", nameFr: "Technicien d'essais ferroviaire", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+2" },
  { slug: "ingenieur-signalisation", nameFr: "Ingénieur en signalisation ferroviaire", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "ingenieur-travaux-ferro", nameFr: "Ingénieur travaux ferroviaires", family: "Infrastructure", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "chef-projet-ferro", nameFr: "Chef de projet ferroviaire", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "ingenieur-commercial-ferro", nameFr: "Ingénieur commercial ferroviaire", family: "Commercial", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "designer-transport-metier", nameFr: "Designer transport", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+3" },
  { slug: "ingenieur-systemes-ferro", nameFr: "Ingénieur systèmes ferroviaires", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "responsable-production", nameFr: "Responsable production matériel roulant", family: "Production", source: "aveclindustrieferroviaire", level: "BAC+5" },
  { slug: "technicien-bureau-etudes", nameFr: "Technicien bureau d'études ferroviaire", family: "Ingénierie", source: "aveclindustrieferroviaire", level: "BAC+2" },
  { slug: "chef-chantier-voie", nameFr: "Chef de chantier voie ferrée", family: "Infrastructure", source: "aveclindustrieferroviaire", level: "BAC+2" },
];

// Métier-Formation links
const metierFormations: Array<{ metier: string; formation: string }> = [
  // Conducteur de train
  { metier: "conducteur-train", formation: "titre-pro-conducteur-train" },
  { metier: "conducteur-train", formation: "bac-pro-melec" },
  // Conducteur de train de fret
  { metier: "conducteur-train-fret", formation: "titre-pro-conducteur-train" },
  { metier: "conducteur-train-fret", formation: "bac-pro-otm" },
  // Conducteur de tramway
  { metier: "conducteur-tramway", formation: "titre-pro-conducteur-train" },
  // Conducteur de métro
  { metier: "conducteur-metro", formation: "titre-pro-conducteur-train" },
  // Conducteur de RER
  { metier: "conducteur-rer", formation: "titre-pro-conducteur-train" },
  { metier: "conducteur-rer", formation: "bts-electrotechnique" },
  // Aiguilleur
  { metier: "aiguilleur", formation: "bac-pro-melec" },
  { metier: "aiguilleur", formation: "cs-accueil-transports" },
  // Agent de circulation
  { metier: "agent-circulation", formation: "bac-pro-melec" },
  { metier: "agent-circulation", formation: "bts-gtla" },
  { metier: "agent-circulation", formation: "lp-gmsf" },
  // Régulateur des transports
  { metier: "regulateur-transports", formation: "bts-gtla" },
  { metier: "regulateur-transports", formation: "but-mlt" },
  { metier: "regulateur-transports", formation: "lp-gmsf" },
  // Agent d'escale
  { metier: "agent-escale", formation: "cs-accueil-transports" },
  { metier: "agent-escale", formation: "bac-pro-otm" },
  // Technicien maintenance systèmes ferro
  { metier: "technicien-maintenance-ferro", formation: "bac-pro-mspc" },
  { metier: "technicien-maintenance-ferro", formation: "bts-maintenance-systemes" },
  { metier: "technicien-maintenance-ferro", formation: "but-gim" },
  // Électricien industriel ferro
  { metier: "electricien-industriel-ferro", formation: "cap-ctm-installateur-electrique" },
  { metier: "electricien-industriel-ferro", formation: "bac-pro-melec" },
  { metier: "electricien-industriel-ferro", formation: "bts-electrotechnique" },
  // Mécanicien maintenance ferro
  { metier: "mecanicien-maintenance-ferro", formation: "cap-maintenance-vehicules" },
  { metier: "mecanicien-maintenance-ferro", formation: "bac-pro-mspc" },
  { metier: "mecanicien-maintenance-ferro", formation: "bts-maintenance-systemes" },
  // Chaudronnier ferro
  { metier: "chaudronnier-ferro", formation: "cap-maintenance-vehicules" },
  { metier: "chaudronnier-ferro", formation: "bac-pro-mspc" },
  // Soudeur ferro
  { metier: "soudeur-ferro", formation: "cap-maintenance-vehicules" },
  // Agent maintenance installations
  { metier: "agent-maintenance-installations", formation: "bac-pro-mspc" },
  { metier: "agent-maintenance-installations", formation: "mc4-maintenance-installations-ferro" },
  // Technicien signalisation
  { metier: "technicien-signalisation", formation: "bac-pro-melec" },
  { metier: "technicien-signalisation", formation: "bts-electrotechnique" },
  { metier: "technicien-signalisation", formation: "but-geii" },
  // Technicien caténaire
  { metier: "technicien-catenaire", formation: "bac-pro-melec" },
  { metier: "technicien-catenaire", formation: "bts-electrotechnique" },
  { metier: "technicien-catenaire", formation: "bac-pro-traction-electrique" },
  // Opérateur maintenance voies
  { metier: "operateur-maintenance-voies", formation: "bac-pro-travaux-publics" },
  { metier: "operateur-maintenance-voies", formation: "bts-travaux-publics" },
  // Technicien systèmes embarqués
  { metier: "technicien-systemes-embarques", formation: "mc4-maintenance-systemes-embarques" },
  { metier: "technicien-systemes-embarques", formation: "bts-maintenance-systemes" },
  { metier: "technicien-systemes-embarques", formation: "but-geii" },
  // Peintre industriel ferro
  { metier: "peintre-industriel-ferro", formation: "cap-maintenance-vehicules" },
  // Agent de manoeuvre
  { metier: "agent-manoeuvre", formation: "titre-pro-conducteur-train" },
  // Ingénieur conception matériel roulant (BAC+5 - mécanique, systèmes, transport)
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-conception-materiel", formation: "master-transports-mobilites" },
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-transports-entpe" },
  { metier: "ingenieur-conception-materiel", formation: "mastere-stfu" },
  { metier: "ingenieur-conception-materiel", formation: "mastere-smart-mobility" },
  // Technicien d'essais
  { metier: "technicien-essais", formation: "bts-maintenance-systemes" },
  { metier: "technicien-essais", formation: "but-mesures-physiques" },
  { metier: "technicien-essais", formation: "but-geii" },
  { metier: "technicien-essais", formation: "bts-electrotechnique" },
  // Ingénieur signalisation (BAC+5 - électronique, automatique, informatique)
  { metier: "ingenieur-signalisation", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-signalisation", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-signalisation", formation: "but-geii" },
  { metier: "ingenieur-signalisation", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-signalisation", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-signalisation", formation: "mastere-stfu" },
  // Ingénieur travaux ferro (BAC+5 - génie civil, infrastructure)
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-transports-entpe" },
  { metier: "ingenieur-travaux-ferro", formation: "bts-travaux-publics" },
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-travaux-ferro", formation: "mastere-ifrdd" },
  // Chef de projet ferro (BAC+5 - toute école d'ingénieur + management)
  { metier: "chef-projet-ferro", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "chef-projet-ferro", formation: "mastere-stfu" },
  { metier: "chef-projet-ferro", formation: "master-transports-mobilites" },
  { metier: "chef-projet-ferro", formation: "ingenieur-transports-ensam" },
  { metier: "chef-projet-ferro", formation: "ingenieur-gc-ge-insa" },
  { metier: "chef-projet-ferro", formation: "ingenieur-infra-ferro-imt" },
  { metier: "chef-projet-ferro", formation: "ingenieur-transports-entpe" },
  { metier: "chef-projet-ferro", formation: "mastere-smart-mobility" },
  // Ingénieur commercial ferro (BAC+5 - ingénieur généraliste + transport)
  { metier: "ingenieur-commercial-ferro", formation: "master-transports-mobilites" },
  { metier: "ingenieur-commercial-ferro", formation: "master-tlic" },
  { metier: "ingenieur-commercial-ferro", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-commercial-ferro", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-commercial-ferro", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-commercial-ferro", formation: "ingenieur-transports-entpe" },
  { metier: "ingenieur-commercial-ferro", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-commercial-ferro", formation: "mastere-stfu" },
  // Designer transport
  { metier: "designer-transport-metier", formation: "bachelor-design-transport" },
  { metier: "designer-transport-metier", formation: "designer-transport" },
  // Ingénieur systèmes ferro (BAC+5 - systèmes, électronique, automatique)
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-systemes-ferro", formation: "mastere-stfu" },
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-systemes-ferro", formation: "master-transports-mobilites" },
  { metier: "ingenieur-systemes-ferro", formation: "mastere-smart-mobility" },
  // Responsable production (BAC+5 - industrie, mécanique, management)
  { metier: "responsable-production", formation: "bts-maintenance-systemes" },
  { metier: "responsable-production", formation: "but-gim" },
  { metier: "responsable-production", formation: "ingenieur-transports-ensam" },
  { metier: "responsable-production", formation: "ingenieur-gc-ge-insa" },
  { metier: "responsable-production", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "responsable-production", formation: "lp-maintenance-transports-guides" },
  // Technicien bureau d'études
  { metier: "technicien-bureau-etudes", formation: "bts-electrotechnique" },
  { metier: "technicien-bureau-etudes", formation: "but-geii" },
  { metier: "technicien-bureau-etudes", formation: "but-rt" },
  { metier: "technicien-bureau-etudes", formation: "bts-maintenance-systemes" },
  // Chef de chantier voie ferrée
  { metier: "chef-chantier-voie", formation: "bac-pro-travaux-publics" },
  { metier: "chef-chantier-voie", formation: "bts-travaux-publics" },
  { metier: "chef-chantier-voie", formation: "ingenieur-infra-ferro-imt" },
  { metier: "chef-chantier-voie", formation: "ingenieur-transports-entpe" },
  { metier: "chef-chantier-voie", formation: "ingenieur-gc-ge-insa" },

  // === BTM/BM installateur électrique ===
  { metier: "electricien-industriel-ferro", formation: "btm-installateur-electrique" },
  { metier: "technicien-catenaire", formation: "btm-installateur-electrique" },
  { metier: "electricien-industriel-ferro", formation: "bm-installateur-electrique" },
  { metier: "technicien-catenaire", formation: "bm-installateur-electrique" },

  // === FIX - formations sans métier ===
  // LP Exploitation Ferroviaire CNAM
  { metier: "agent-circulation", formation: "lp-exploitation-ferroviaire-cnam" },
  { metier: "regulateur-transports", formation: "lp-exploitation-ferroviaire-cnam" },
  // LP GRF (Gestion des Réseaux Ferrés)
  { metier: "agent-circulation", formation: "lp-grf" },
  { metier: "chef-chantier-voie", formation: "lp-grf" },
  // LP MSTV (Management Services Transport Voyageurs)
  { metier: "regulateur-transports", formation: "lp-mstv" },
  { metier: "agent-escale", formation: "lp-mstv" },
  // Master TER (Transport, Espace, Réseau)
  { metier: "chef-projet-ferro", formation: "master-ter" },
  { metier: "ingenieur-commercial-ferro", formation: "master-ter" },
  // Master TURP (Transports Urbains et Régionaux)
  { metier: "regulateur-transports", formation: "master-turp" },
  { metier: "chef-projet-ferro", formation: "master-turp" },
  // Master 3ET (Économie, Énergie, Transports)
  { metier: "ingenieur-commercial-ferro", formation: "master-3et" },
  { metier: "chef-projet-ferro", formation: "master-3et" },
  // Licence EEA
  { metier: "technicien-signalisation", formation: "licence-eea" },
  { metier: "electricien-industriel-ferro", formation: "licence-eea" },
  // BUT RT
  { metier: "technicien-signalisation", formation: "but-rt" },
  // BUT Mesures Physiques
  { metier: "technicien-signalisation", formation: "but-mesures-physiques" },
];

// Mapping of formations to establishments
const establishmentFormations: Array<{ establishment: string; formation: string }> = [
  // CAP Maintenance des véhicules
  { establishment: "aforpa-idf", formation: "cap-maintenance-vehicules" },
  { establishment: "ort-paris", formation: "cap-maintenance-vehicules" },

  // CAP CTM installateur électrique
  { establishment: "compagnons-devoir-rennes", formation: "cap-ctm-installateur-electrique" },
  { establishment: "compagnons-devoir-tours", formation: "cap-ctm-installateur-electrique" },

  // Bac Pro MSPC
  { establishment: "sainte-croix-saint-euverte-orleans", formation: "bac-pro-mspc" },
  { establishment: "lycee-ozanam-bretagne", formation: "bac-pro-mspc" },
  { establishment: "compagnons-devoir-rennes", formation: "bac-pro-mspc" },
  { establishment: "compagnons-devoir-tours", formation: "bac-pro-mspc" },
  { establishment: "ecole-saint-louis-valence", formation: "bac-pro-mspc" },
  { establishment: "cfa-ferroviaire-saint-denis", formation: "bac-pro-mspc" },
  { establishment: "cfa-ferroviaire-arras", formation: "bac-pro-mspc" },
  { establishment: "cfa-ferroviaire-begles", formation: "bac-pro-mspc" },
  { establishment: "cfa-ferroviaire-le-mans", formation: "bac-pro-mspc" },

  // Bac Pro MELEC
  { establishment: "ea-eco-activites-paris", formation: "bac-pro-melec" },
  { establishment: "lycee-monod-enghien", formation: "bac-pro-melec" },

  // Titre Pro Conducteur de train
  { establishment: "universite-traction-sncf", formation: "titre-pro-conducteur-train" },
  { establishment: "ciffco-cote-opale", formation: "titre-pro-conducteur-train" },

  // Bac Pro Travaux Publics
  { establishment: "lp-rene-caillie-marseille", formation: "bac-pro-travaux-publics" },
  { establishment: "lp-decomble-chaumont", formation: "bac-pro-travaux-publics" },
  { establishment: "lp-bissol-lamentin", formation: "bac-pro-travaux-publics" },
  { establishment: "lycee-bonte-riom", formation: "bac-pro-travaux-publics" },
  { establishment: "lycee-tp-bertin-bruay", formation: "bac-pro-travaux-publics" },

  // CS Accueil dans les Transports
  { establishment: "cfa-ferroviaire-saint-denis", formation: "cs-accueil-transports" },
  { establishment: "afmae-bonneuil", formation: "cs-accueil-transports" },
  { establishment: "airsup-paris", formation: "cs-accueil-transports" },
  { establishment: "esima-lyon", formation: "cs-accueil-transports" },
  { establishment: "iaag-morbecque", formation: "cs-accueil-transports" },
  { establishment: "lp-beaugrenelle-paris", formation: "cs-accueil-transports" },
  { establishment: "lp-baudelaire-meaux", formation: "cs-accueil-transports" },
  { establishment: "lp-auclert-chantilly", formation: "cs-accueil-transports" },
  { establishment: "lp-painleve-courbevoie", formation: "cs-accueil-transports" },

  // BTS Maintenance des Systèmes
  { establishment: "lycee-st-joseph-toulouse", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-deodat-severac-toulouse", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-borde-basse-castres", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-de-la-salle-albi", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-monnerville-cahors", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-dupuy-tarbes", formation: "bts-maintenance-systemes" },
  { establishment: "cfa-ferroviaire-saint-denis", formation: "bts-maintenance-systemes" },
  { establishment: "cfa-ferroviaire-begles", formation: "bts-maintenance-systemes" },
  { establishment: "cfa-ferroviaire-strasbourg", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-carnot-bruay", formation: "bts-maintenance-systemes" },

  // BTS Électrotechnique
  { establishment: "cfa-ferroviaire-saint-denis", formation: "bts-electrotechnique" },
  { establishment: "cfa-ferroviaire-arras", formation: "bts-electrotechnique" },
  { establishment: "cfa-ferroviaire-lyon", formation: "bts-electrotechnique" },
  { establishment: "lycee-monod-enghien", formation: "bts-electrotechnique" },

  // Licence Pro Maintenance transports guidés
  { establishment: "iut-lille", formation: "lp-maintenance-transports-guides" },
  { establishment: "lycee-colbert-tourcoing", formation: "lp-maintenance-transports-guides" },

  // Licence Pro GMSF
  { establishment: "universite-lyon-2", formation: "lp-gmsf" },

  // Licence Pro Exploitation Ferroviaire (CNAM)
  { establishment: "cfa-cnam-idf", formation: "lp-exploitation-ferroviaire-cnam" },

  // BUT MLT
  { establishment: "iut-tourcoing", formation: "but-mlt" },

  // LP MSTV
  { establishment: "universite-lyon-2", formation: "lp-mstv" },

  // LP GRF
  { establishment: "universite-lyon-2", formation: "lp-grf" },

  // Master Transports et Mobilités
  { establishment: "estaca-paris", formation: "master-transports-mobilites" },
  { establishment: "estaca-laval", formation: "master-transports-mobilites" },

  // Ingénieur Ferroviaire ESTACA
  { establishment: "estaca-paris", formation: "ingenieur-ferroviaire-estaca" },
  { establishment: "estaca-laval", formation: "ingenieur-ferroviaire-estaca" },
  { establishment: "estaca-bordeaux", formation: "master-transports-mobilites" },
  { establishment: "estaca-bordeaux", formation: "ingenieur-ferroviaire-estaca" },

  // Ingénieur Infra Ferro IMT
  { establishment: "imt-nord-europe", formation: "ingenieur-infra-ferro-imt" },

  // Ingénieur Transports ENTPE
  { establishment: "entpe-lyon", formation: "ingenieur-transports-entpe" },

  // Ingénieur Transports Arts et Métiers
  { establishment: "arts-metiers-paris", formation: "ingenieur-transports-ensam" },

  // Ingénieur INSA HDF
  { establishment: "insa-hdf", formation: "ingenieur-gc-ge-insa" },

  // Master 3ET
  { establishment: "universite-lyon-2", formation: "master-3et" },

  // Master TURP
  { establishment: "universite-lyon-2", formation: "master-turp" },

  // Master TLIC
  { establishment: "universite-lyon-2", formation: "master-tlic" },

  // Master TER
  { establishment: "universite-lyon-2", formation: "master-ter" },

  // Mastère STFU
  { establishment: "ecole-ponts-paristech", formation: "mastere-stfu" },
  { establishment: "insa-hdf", formation: "mastere-stfu" },
  { establishment: "utc-compiegne", formation: "mastere-stfu" },

  // Mastère Smart Mobility
  { establishment: "ecole-ponts-paristech", formation: "mastere-smart-mobility" },
  { establishment: "telecom-paris", formation: "mastere-smart-mobility" },

  // Mastère IFRDD
  { establishment: "centralesupelec", formation: "mastere-ifrdd" },

  // === MC4 Maintenance Installations Ferroviaires - CFA Ferroviaire network ===
  { establishment: "cfa-ferroviaire-saint-denis", formation: "mc4-maintenance-installations-ferro" },
  { establishment: "cfa-ferroviaire-arras", formation: "mc4-maintenance-installations-ferro" },
  { establishment: "cfa-ferroviaire-lyon", formation: "mc4-maintenance-installations-ferro" },
  { establishment: "cfa-ferroviaire-strasbourg", formation: "mc4-maintenance-installations-ferro" },
  { establishment: "cfa-ferroviaire-begles", formation: "mc4-maintenance-installations-ferro" },
  { establishment: "cfa-ferroviaire-le-mans", formation: "mc4-maintenance-installations-ferro" },

  // === MC4 Maintenance Systèmes Embarqués - CFA Ferroviaire network ===
  { establishment: "cfa-ferroviaire-saint-denis", formation: "mc4-maintenance-systemes-embarques" },
  { establishment: "cfa-ferroviaire-arras", formation: "mc4-maintenance-systemes-embarques" },
  { establishment: "cfa-ferroviaire-lyon", formation: "mc4-maintenance-systemes-embarques" },
  { establishment: "cfa-ferroviaire-strasbourg", formation: "mc4-maintenance-systemes-embarques" },
  { establishment: "cfa-ferroviaire-begles", formation: "mc4-maintenance-systemes-embarques" },
  { establishment: "cfa-ferroviaire-le-mans", formation: "mc4-maintenance-systemes-embarques" },

  // === Bac Pro MSPC - CFA Ferroviaire partner lycées ===
  { establishment: "lp-chenneviere-malezieux-paris", formation: "bac-pro-mspc" },
  { establishment: "lycee-louis-armand-eaubonne", formation: "bac-pro-mspc" },
  { establishment: "lycee-hector-guimard-lyon", formation: "bac-pro-mspc" },
  { establishment: "lycee-foucauld-schiltigheim", formation: "bac-pro-mspc" },
  { establishment: "lycee-savary-ferry-arras", formation: "bac-pro-mspc" },

  // === Bac Pro MELEC ===
  { establishment: "lycee-foucauld-schiltigheim", formation: "bac-pro-melec" },

  // === Bac Pro OTM ===
  { establishment: "lp-fontaine-anzin", formation: "bac-pro-otm" },
  { establishment: "lycee-catalins-montelimar", formation: "bac-pro-otm" },
  { establishment: "lycee-oehmichen-chalons", formation: "bac-pro-otm" },
  { establishment: "lycee-saint-exupery-creteil", formation: "bac-pro-otm" },

  // === Bac Pro Travaux Publics ===
  { establishment: "lycee-freyssinet-saint-brieuc", formation: "bac-pro-travaux-publics" },
  { establishment: "lycee-caraminot-egletons", formation: "bac-pro-travaux-publics" },
  { establishment: "lycee-vinci-blanquefort", formation: "bac-pro-travaux-publics" },

  // === Titre Pro Conducteur de train ===
  { establishment: "campus-sncf-nanterre", formation: "titre-pro-conducteur-train" },
  { establishment: "cfa-ferroviaire-lyon", formation: "titre-pro-conducteur-train" },
  { establishment: "cfa-ferroviaire-begles", formation: "titre-pro-conducteur-train" },
  { establishment: "cfa-ferroviaire-le-mans", formation: "titre-pro-conducteur-train" },

  // === BTS Maintenance des Systèmes ===
  { establishment: "lycee-martiniere-diderot-lyon", formation: "bts-maintenance-systemes" },
  { establishment: "lp-leonard-vinci-bagneux", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-bergson-jacquard-paris", formation: "bts-maintenance-systemes" },
  { establishment: "lycee-foucauld-schiltigheim", formation: "bts-maintenance-systemes" },
  { establishment: "cfa-ferroviaire-le-mans", formation: "bts-maintenance-systemes" },

  // === BTS Électrotechnique ===
  { establishment: "lycee-foucauld-schiltigheim", formation: "bts-electrotechnique" },
  { establishment: "cfa-ferroviaire-strasbourg", formation: "bts-electrotechnique" },

  // === BTS GTLA ===
  { establishment: "lycee-gaston-berger-lille", formation: "bts-gtla" },
  { establishment: "lycee-gallieni-toulouse", formation: "bts-gtla" },
  { establishment: "aftral-toulouse", formation: "bts-gtla" },

  // === BTS Travaux Publics ===
  { establishment: "lycee-eiffel-talange", formation: "bts-travaux-publics" },
  { establishment: "lycee-tp-bertin-bruay", formation: "bts-travaux-publics" },
  { establishment: "lycee-livet-nantes", formation: "bts-travaux-publics" },
  { establishment: "lycee-laplace-caen", formation: "bts-travaux-publics" },
  { establishment: "lycee-caraminot-egletons", formation: "bts-travaux-publics" },

  // === CS Accueil Transports ===
  { establishment: "lycee-sacre-coeur-nantes", formation: "cs-accueil-transports" },
  { establishment: "lycee-les-palmiers-nice", formation: "cs-accueil-transports" },

  // === BUT MLT ===
  { establishment: "iut-tremblay-paris8", formation: "but-mlt" },
  { establishment: "iut-lumiere-lyon2", formation: "but-mlt" },
  { establishment: "iut-bordeaux", formation: "but-mlt" },

  // === BUT GIM ===
  { establishment: "iut-saint-denis", formation: "but-gim" },
  { establishment: "iut-tremblay-paris8", formation: "but-gim" },
  { establishment: "iut-valenciennes", formation: "but-gim" },
  { establishment: "iut-lyon1-villeurbanne", formation: "but-gim" },

  // === BUT GEII ===
  { establishment: "iut-ville-avray", formation: "but-geii" },
  { establishment: "iut-cachan", formation: "but-geii" },
  { establishment: "iut-lyon1-villeurbanne", formation: "but-geii" },
  { establishment: "iut-rennes", formation: "but-geii" },
  { establishment: "iut-belfort", formation: "but-geii" },

  // === BUT Mesures Physiques ===
  { establishment: "iut-lyon1-villeurbanne", formation: "but-mesures-physiques" },
  { establishment: "iut-saint-denis", formation: "but-mesures-physiques" },
  { establishment: "iut-bordeaux", formation: "but-mesures-physiques" },

  // === BUT RT (Réseaux et Télécommunications) ===
  { establishment: "iut-ville-avray", formation: "but-rt" },
  { establishment: "iut-valenciennes", formation: "but-rt" },
  { establishment: "iut-belfort", formation: "but-rt" },

  // === Licence EEA ===
  { establishment: "universite-lille", formation: "licence-eea" },
  { establishment: "universite-paris-saclay", formation: "licence-eea" },
  { establishment: "universite-lyon-2", formation: "licence-eea" },

  // === BTM installateur en équipement électrique ===
  { establishment: "compagnons-devoir-rennes", formation: "btm-installateur-electrique" },
  { establishment: "compagnons-devoir-tours", formation: "btm-installateur-electrique" },

  // === BM installateur en équipements électriques ===
  { establishment: "compagnons-devoir-rennes", formation: "bm-installateur-electrique" },
  { establishment: "compagnons-devoir-tours", formation: "bm-installateur-electrique" },

  // === Bac Pro Traction Électrique ===
  { establishment: "cfa-ferroviaire-saint-denis", formation: "bac-pro-traction-electrique" },
  { establishment: "cfa-ferroviaire-lyon", formation: "bac-pro-traction-electrique" },

  // === LP Exploitation Ferroviaire CNAM ===
  { establishment: "cnam-hauts-de-france", formation: "lp-exploitation-ferroviaire-cnam" },
  { establishment: "cnam-nouvelle-aquitaine", formation: "lp-exploitation-ferroviaire-cnam" },
  { establishment: "cnam-pays-de-la-loire", formation: "lp-exploitation-ferroviaire-cnam" },

  // === Master Transports et Mobilités ===
  { establishment: "sorbonne-universite", formation: "master-transports-mobilites" },
  { establishment: "universite-gustave-eiffel", formation: "master-transports-mobilites" },
  { establishment: "universite-lyon-2", formation: "master-transports-mobilites" },

  // === Ingénieur ENSAM - Lille campus ===
  { establishment: "arts-metiers-lille", formation: "ingenieur-transports-ensam" },

  // === Designer transport ===
  { establishment: "creapole-paris", formation: "designer-transport" },
  { establishment: "strate-sevres", formation: "designer-transport" },

  // === Bachelor Design Transport ===
  { establishment: "ecole-design-nantes", formation: "bachelor-design-transport" },
  { establishment: "rubika-valenciennes", formation: "bachelor-design-transport" },

  // === NEW - GRANDES ECOLES → Master/Ingénieur ===
  { establishment: "ecole-polytechnique", formation: "master-transports-mobilites" },
  { establishment: "ecole-polytechnique", formation: "mastere-smart-mobility" },
  { establishment: "mines-paris-psl", formation: "master-transports-mobilites" },
  { establishment: "ensta-paris", formation: "master-transports-mobilites" },
  { establishment: "ensta-paris", formation: "mastere-smart-mobility" },
  { establishment: "isae-supaero", formation: "master-transports-mobilites" },
  { establishment: "isae-supaero", formation: "ingenieur-transports-ensam" },
  { establishment: "isae-ensma", formation: "ingenieur-transports-ensam" },
  { establishment: "isae-supmeca", formation: "ingenieur-transports-ensam" },
  { establishment: "cnam-paris", formation: "lp-exploitation-ferroviaire-cnam" },
  { establishment: "enac-toulouse", formation: "master-transports-mobilites" },
  { establishment: "enac-toulouse", formation: "mastere-smart-mobility" },

  // === NEW - ECOLES D'INGENIEURS ===
  { establishment: "eigsi-la-rochelle", formation: "ingenieur-ferroviaire-estaca" },
  { establishment: "enseeiht-toulouse", formation: "ingenieur-gc-ge-insa" },
  { establishment: "enseeiht-toulouse", formation: "master-transports-mobilites" },
  { establishment: "enseirb-matmeca", formation: "ingenieur-transports-ensam" },
  { establishment: "ece-paris", formation: "master-transports-mobilites" },
  { establishment: "ece-paris", formation: "ingenieur-transports-ensam" },
  { establishment: "epf-cachan", formation: "ingenieur-transports-ensam" },
  { establishment: "esiee-paris", formation: "master-transports-mobilites" },
  { establishment: "esiee-paris", formation: "ingenieur-transports-ensam" },
  { establishment: "esigelec-rouen", formation: "ingenieur-gc-ge-insa" },
  { establishment: "esigelec-rouen", formation: "ingenieur-transports-ensam" },
  { establishment: "junia-hei-lille", formation: "ingenieur-gc-ge-insa" },
  { establishment: "junia-hei-lille", formation: "ingenieur-transports-ensam" },
  { establishment: "ecam-lasalle-lyon", formation: "ingenieur-transports-ensam" },
  { establishment: "ecam-lasalle-lyon", formation: "ingenieur-transports-entpe" },
  { establishment: "icam-lille", formation: "ingenieur-transports-ensam" },
  { establishment: "icam-toulouse", formation: "ingenieur-transports-ensam" },
  { establishment: "icam-nantes", formation: "ingenieur-transports-ensam" },

  // === NEW - ENI NETWORK ===
  { establishment: "enim-metz", formation: "ingenieur-transports-ensam" },
  { establishment: "enim-metz", formation: "ingenieur-gc-ge-insa" },
  { establishment: "enit-tarbes", formation: "ingenieur-transports-ensam" },
  { establishment: "enib-brest", formation: "ingenieur-gc-ge-insa" },
  { establishment: "enib-brest", formation: "ingenieur-transports-ensam" },
  { establishment: "enise-saint-etienne", formation: "ingenieur-gc-ge-insa" },
  { establishment: "enise-saint-etienne", formation: "ingenieur-transports-ensam" },

  // === NEW - ARTS ET METIERS CAMPUSES ===
  { establishment: "arts-metiers-bordeaux", formation: "ingenieur-transports-ensam" },
  { establishment: "arts-metiers-metz", formation: "ingenieur-transports-ensam" },
  { establishment: "arts-metiers-aix", formation: "ingenieur-transports-ensam" },
  { establishment: "arts-metiers-angers", formation: "ingenieur-transports-ensam" },
  { establishment: "arts-metiers-chalons", formation: "ingenieur-transports-ensam" },

  // === NEW - POLYTECH NETWORK ===
  { establishment: "polytech-lille", formation: "ingenieur-gc-ge-insa" },
  { establishment: "polytech-lille", formation: "ingenieur-transports-ensam" },
  { establishment: "polytech-nantes", formation: "ingenieur-gc-ge-insa" },
  { establishment: "polytech-nantes", formation: "ingenieur-transports-ensam" },
  { establishment: "polytech-lyon", formation: "ingenieur-transports-ensam" },
  { establishment: "polytech-lyon", formation: "ingenieur-transports-entpe" },
  { establishment: "polytech-marseille", formation: "ingenieur-gc-ge-insa" },
  { establishment: "polytech-marseille", formation: "ingenieur-transports-ensam" },
  { establishment: "polytech-clermont", formation: "ingenieur-gc-ge-insa" },
  { establishment: "polytech-orleans", formation: "ingenieur-transports-ensam" },
  { establishment: "polytech-tours", formation: "ingenieur-transports-ensam" },

  // === NEW - UNIVERSITES ===
  { establishment: "universite-lille", formation: "lp-maintenance-transports-guides" },
  { establishment: "universite-paris-saclay", formation: "master-transports-mobilites" },
  { establishment: "universite-paris-saclay", formation: "but-gim" },

  // === NEW - IUTs SUPPLEMENTAIRES ===
  { establishment: "iut-louis-pasteur-strasbourg", formation: "but-gim" },
  { establishment: "iut-louis-pasteur-strasbourg", formation: "but-geii" },
  { establishment: "iut-gradignan-bordeaux", formation: "but-gim" },
  { establishment: "iut-gradignan-bordeaux", formation: "but-geii" },
  { establishment: "iut-blagnac", formation: "but-gim" },
  { establishment: "iut-senart-fontainebleau", formation: "but-gim" },
  { establishment: "iut-senart-fontainebleau", formation: "but-geii" },
  { establishment: "iut-mulhouse", formation: "but-gim" },
  { establishment: "iut-mulhouse", formation: "but-geii" },
  { establishment: "iut-lorient", formation: "but-gim" },
  { establishment: "iut-mantes", formation: "but-gim" },
  { establishment: "iut-bethune", formation: "but-gim" },
  { establishment: "iut-bethune", formation: "but-geii" },
];

// ============================================================
// SEED FUNCTION
// ============================================================

async function main() {
  console.log("🌱 Seeding database...\n");

  // 0. Clean up old entries that have been replaced
  console.log("🧹 Cleaning up replaced entries...");
  try {
    // Remove old cfa-ferroviaire-plaine-saint-denis (replaced by cfa-ferroviaire-saint-denis)
    await prisma.establishmentFormation.deleteMany({
      where: {
        establishment: { slug: "cfa-ferroviaire-plaine-saint-denis" },
      },
    });
    await prisma.establishment.deleteMany({
      where: { slug: "cfa-ferroviaire-plaine-saint-denis" },
    });
    console.log("   ✅ Removed old cfa-ferroviaire-plaine-saint-denis entry\n");
  } catch {
    console.log("   ℹ️ No old entry to remove (first run)\n");
  }

  // 1. Regions
  console.log("📍 Seeding regions...");
  const regionMap: Record<string, string> = {};
  for (const r of regions) {
    const record = await prisma.region.upsert({
      where: { code: r.code },
      update: r,
      create: r,
    });
    regionMap[r.code] = record.id;
  }
  console.log(`   ✅ ${regions.length} regions\n`);

  // 2. Establishment Types
  console.log("🏫 Seeding establishment types...");
  const typeMap: Record<string, string> = {};
  for (const t of establishmentTypes) {
    const record = await prisma.establishmentType.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
    typeMap[t.slug] = record.id;
  }
  console.log(`   ✅ ${establishmentTypes.length} types\n`);

  // 3. Formation Levels
  console.log("📊 Seeding formation levels...");
  const levelMap: Record<string, string> = {};
  for (const l of formationLevels) {
    const record = await prisma.formationLevel.upsert({
      where: { slug: l.slug },
      update: l,
      create: l,
    });
    levelMap[l.slug] = record.id;
  }
  console.log(`   ✅ ${formationLevels.length} levels\n`);

  // 4. Formation Domains
  console.log("🎯 Seeding formation domains...");
  const domainMap: Record<string, string> = {};
  for (const d of formationDomains) {
    const record = await prisma.formationDomain.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
    domainMap[d.slug] = record.id;
  }
  console.log(`   ✅ ${formationDomains.length} domains\n`);

  // 5. Formations
  console.log("📚 Seeding formations...");
  const formationMap: Record<string, string> = {};
  for (const f of formations) {
    const record = await prisma.formation.upsert({
      where: { slug: f.slug },
      update: {
        nameFr: f.nameFr,
        rncpCode: f.rncpCode ?? null,
        romeCode: f.romeCode ?? null,
        onisepUrl: f.onisepUrl ?? null,
        levelId: levelMap[f.level],
        domainId: domainMap[f.domain],
        jobTarget: f.jobTarget ?? null,
      },
      create: {
        slug: f.slug,
        nameFr: f.nameFr,
        rncpCode: f.rncpCode ?? null,
        romeCode: f.romeCode ?? null,
        onisepUrl: f.onisepUrl ?? null,
        levelId: levelMap[f.level],
        domainId: domainMap[f.domain],
        jobTarget: f.jobTarget ?? null,
      },
    });
    formationMap[f.slug] = record.id;
  }
  console.log(`   ✅ ${formations.length} formations\n`);

  // 6. Establishments
  console.log("🏛️ Seeding establishments...");
  const establishmentMap: Record<string, string> = {};
  for (const e of establishments) {
    const record = await prisma.establishment.upsert({
      where: { slug: e.slug },
      update: {
        name: e.name,
        city: e.city,
        lat: e.lat,
        lng: e.lng,
        typeId: typeMap[e.type],
        regionId: regionMap[e.region],
        website: e.website ?? null,
      },
      create: {
        slug: e.slug,
        name: e.name,
        city: e.city,
        lat: e.lat,
        lng: e.lng,
        typeId: typeMap[e.type],
        regionId: regionMap[e.region],
        website: e.website ?? null,
      },
    });
    establishmentMap[e.slug] = record.id;
  }
  console.log(`   ✅ ${establishments.length} establishments\n`);

  // 7. Establishment-Formation links
  console.log("🔗 Seeding establishment-formation links...");
  let linkCount = 0;
  for (const link of establishmentFormations) {
    const estId = establishmentMap[link.establishment];
    const formId = formationMap[link.formation];
    if (!estId || !formId) {
      console.warn(`   ⚠️ Missing: ${link.establishment} -> ${link.formation}`);
      continue;
    }
    await prisma.establishmentFormation.upsert({
      where: {
        establishmentId_formationId: {
          establishmentId: estId,
          formationId: formId,
        },
      },
      update: {},
      create: {
        establishmentId: estId,
        formationId: formId,
      },
    });
    linkCount++;
  }
  console.log(`   ✅ ${linkCount} links\n`);

  // 8. Métiers
  console.log("🔧 Seeding métiers...");
  const metierMap: Record<string, string> = {};
  for (const m of metiers) {
    const record = await prisma.metier.upsert({
      where: { slug: m.slug },
      update: {
        nameFr: m.nameFr,
        family: m.family,
        source: m.source,
        level: m.level,
      },
      create: {
        slug: m.slug,
        nameFr: m.nameFr,
        family: m.family,
        source: m.source,
        level: m.level,
      },
    });
    metierMap[m.slug] = record.id;
  }
  console.log(`   ✅ ${metiers.length} métiers\n`);

  // 9. Métier-Formation links
  console.log("🔗 Seeding métier-formation links...");
  let mfLinkCount = 0;
  for (const link of metierFormations) {
    const metId = metierMap[link.metier];
    const formId = formationMap[link.formation];
    if (!metId || !formId) {
      console.warn(`   ⚠️ Missing: ${link.metier} -> ${link.formation}`);
      continue;
    }
    await prisma.metierFormation.upsert({
      where: {
        metierId_formationId: {
          metierId: metId,
          formationId: formId,
        },
      },
      update: {},
      create: {
        metierId: metId,
        formationId: formId,
      },
    });
    mfLinkCount++;
  }
  console.log(`   ✅ ${mfLinkCount} métier-formation links\n`);

  console.log("🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
