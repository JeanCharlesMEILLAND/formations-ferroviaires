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
  { slug: "cap-maintenance-vehicules", nameFr: "CAP Maintenance des véhicules", rncpCode: "38337", level: "cap-niv3", domain: "maintenance-technique", jobTarget: "Souvent utilisé comme base avant une spécialisation interne SNCF/RATP.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/cap-maintenance-des-vehicules-option-vehicules-legers" },
  { slug: "cap-ctm-installateur-electrique", nameFr: "CAP CTM installateur en équipements électriques", rncpCode: "35955", level: "cap-niv3", domain: "electrotechnique", jobTarget: null, onisepUrl: null },

  // === NIVEAU 4 (BAC PRO / TITRE PRO) ===
  { slug: "bac-pro-mspc", nameFr: "Bac Pro MSPC (ex-MEI)", rncpCode: "35698", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Option Ferroviaire disponible. Maintenance des trains ou des installations.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-maintenance-des-systemes-de-production-connectes" },
  { slug: "bac-pro-melec", nameFr: "Bac Pro MELEC", rncpCode: "38878", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Travaux sur les caténaires, la signalisation et les postes électriques.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-metiers-de-l-electricite-et-de-ses-environnements-connectes" },
  { slug: "bac-pro-otm", nameFr: "Bac Pro OTM", rncpCode: "34630", level: "bac-niv4", domain: "exploitation-circulation", jobTarget: "Organisation du Transport de Marchandises (Logistique/Fret).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-organisation-de-transport-de-marchandises" },
  { slug: "titre-pro-conducteur-train", nameFr: "Titre Pro Conducteur de train", rncpCode: "35438", level: "bac-niv4", domain: "exploitation-circulation", jobTarget: "Référence métier pour la conduite de train (RNCP).", onisepUrl: null },
  { slug: "bac-pro-travaux-publics", nameFr: "Bac Pro Travaux Publics", rncpCode: "37385", level: "bac-niv4", domain: "genie-civil-infra", jobTarget: "Maintenance et pose des voies ferrées (ballast, rails, traverses).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/lycees/bac-pro-travaux-publics" },
  { slug: "bac-pro-traction-electrique", nameFr: "Bac Pro Maintenance des Systèmes de Traction Électrique", rncpCode: "40025515", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },
  { slug: "btm-installateur-electrique", nameFr: "BTM installateur en équipement électrique", rncpCode: "38656", level: "bac-niv4", domain: "electrotechnique", jobTarget: "Responsable de chantier d'installation de réseaux électriques.", onisepUrl: null },
  { slug: "mc4-maintenance-installations-ferro", nameFr: "MC4 Maintenance des Installations Ferroviaires", rncpCode: "45025501", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },
  { slug: "mc4-maintenance-systemes-embarques", nameFr: "MC4 Maintenance des Systèmes Embarqués de Matériel Ferroviaire", rncpCode: "45025502", level: "bac-niv4", domain: "maintenance-technique", jobTarget: "Électrotechnique ferroviaire.", onisepUrl: null },

  // === NIVEAU 5 (BTS / BAC+1) ===
  { slug: "cs-accueil-transports", nameFr: "Certificat de Spécialisation Accueil dans les Transports", rncpCode: "38225", level: "bac1-cs", domain: "exploitation-circulation", jobTarget: "Accueil dans les transports (ex-Mention Complémentaire).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/cs-accueil-dans-les-transports" },
  { slug: "bts-maintenance-systemes", nameFr: "BTS Maintenance des Systèmes (MS)", rncpCode: "38575", level: "bts-niv5", domain: "maintenance-technique", jobTarget: "Option Systèmes de production. Expert technique en centre de maintenance.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-maintenance-des-systemes-option-a-systemes-de-production" },
  { slug: "bts-electrotechnique", nameFr: "BTS Électrotechnique", rncpCode: "41007", level: "bts-niv5", domain: "electrotechnique", jobTarget: "Maintenance des infrastructures électriques haute et basse tension.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-electrotechnique" },
  { slug: "bts-gtla", nameFr: "BTS GTLA", rncpCode: "34023", level: "bts-niv5", domain: "exploitation-circulation", jobTarget: "Gestion des Transports et Logistique Associée (Exploitation).", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-gestion-des-transports-et-logistique-associee" },
  { slug: "bts-travaux-publics", nameFr: "BTS Travaux Publics", rncpCode: "37199", level: "bts-niv5", domain: "genie-civil-infra", jobTarget: "Encadrement de chantier sur les infrastructures ferroviaires.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/bts-travaux-publics" },
  { slug: "bm-installateur-electrique", nameFr: "BM installateur en équipements électriques", rncpCode: "37488", level: "bts-niv5", domain: "electrotechnique", jobTarget: null, onisepUrl: null },

  // === NIVEAU 6 (LICENCE PRO / BUT / BAC+3) ===
  { slug: "lp-maintenance-transports-guides", nameFr: "Licence Pro Maintenance des transports guidés", rncpCode: "30121", level: "licence-niv6", domain: "maintenance-technique", jobTarget: "Spécialisation en ingénierie de maintenance.", onisepUrl: null },
  { slug: "lp-gmsf", nameFr: "Licence Pro GMSF", rncpCode: "30121", level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Gestion et Management des Services Ferroviaires.", onisepUrl: null },
  { slug: "but-mlt", nameFr: "BUT Management de la Logistique et des Transports (MLT)", rncpCode: "35478", level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Transport urbain et interurbain de voyageurs ; exploitation et planification.", onisepUrl: null },
  { slug: "but-mesures-physiques", nameFr: "BUT Mesures Physiques", rncpCode: "35481", level: "licence-niv6", domain: "industrie-production", jobTarget: "Matériaux, contrôles physico-chimiques, analyses environnementales.", onisepUrl: null },
  { slug: "but-gim", nameFr: "BUT Génie Industriel et Maintenance", rncpCode: "35474", level: "licence-niv6", domain: "maintenance-technique", jobTarget: "Ingénierie des systèmes pluritechniques, maintenance innovante.", onisepUrl: null },
  { slug: "but-geii", nameFr: "BUT Génie Électrique et Informatique Industrielle", rncpCode: "35472", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Électronique et systèmes embarqués, électricité et maîtrise de l'énergie.", onisepUrl: null },
  { slug: "but-rt", nameFr: "BUT Réseaux et Télécommunications", rncpCode: "35483", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Internet des objets et mobilité.", onisepUrl: null },
  { slug: "licence-eea", nameFr: "Licence Électronique, Énergie Électrique, Automatique (EEA)", rncpCode: "24505", level: "licence-niv6", domain: "electrotechnique", jobTarget: "Fondamentaux de l'électronique, traitement du signal, conversion d'énergie.", onisepUrl: null },
  { slug: "bachelor-design-transport", nameFr: "Bachelor en Design Transport et Mobilité", rncpCode: "34604", level: "licence-niv6", domain: "ingenierie-conception", jobTarget: null, onisepUrl: null },
  { slug: "lp-mstv", nameFr: "Licence Pro Management des Services de Transport de Voyageurs (MSTV)", rncpCode: "30121", level: "licence-niv6", domain: "transport-mobilite", jobTarget: "Organisation de la production de services de transport.", onisepUrl: null },
  { slug: "lp-grf", nameFr: "Licence Pro Gestion des Réseaux Ferrés (GRF)", rncpCode: "30048", level: "licence-niv6", domain: "transport-mobilite", jobTarget: "Métiers de gestion des réseaux ferrés, partenariat SNCF Réseau.", onisepUrl: null },
  { slug: "lp-exploitation-ferroviaire-cnam", nameFr: "Licence Pro Exploitation Ferroviaire (CNAM)", rncpCode: null, level: "licence-niv6", domain: "exploitation-circulation", jobTarget: "Conception et amélioration de processus industriels - Parcours Exploitation ferroviaire.", onisepUrl: null },

  // === NIVEAU 7 (MASTER / INGÉNIEUR) ===
  { slug: "master-transports-mobilites", nameFr: "Master Transports et Mobilités", rncpCode: "38965", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Conception des réseaux et urbanisme des transports guidés.", onisepUrl: null },
  { slug: "ingenieur-ferroviaire-estaca", nameFr: "Ingénieur Ferroviaire & Transports Guidés (ESTACA)", rncpCode: null, level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Seule école avec filière dédiée dès la 3e année. Liens forts Alstom/SNCF.", onisepUrl: null },
  { slug: "ingenieur-infra-ferro-imt", nameFr: "Ingénieur Génie des Infrastructures Ferroviaires (IMT)", rncpCode: null, level: "master-niv7", domain: "genie-civil-infra", jobTarget: "Formation d'ingénieur au cœur du pôle ferroviaire français.", onisepUrl: null },
  { slug: "ingenieur-transports-entpe", nameFr: "Ingénieur Voie d'approfondissement Transports (ENTPE)", rncpCode: null, level: "master-niv7", domain: "transport-mobilite", jobTarget: "Infrastructures publiques et aménagement du territoire.", onisepUrl: null },
  { slug: "ingenieur-transports-ensam", nameFr: "Ingénieur Expertise Transports Terrestres (Arts et Métiers)", rncpCode: null, level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Matériel roulant, vibrations et motorisation.", onisepUrl: null },
  { slug: "ingenieur-gc-ge-insa", nameFr: "Ingénieur Génie Civil / Génie Électrique (INSA Hauts-de-France)", rncpCode: null, level: "master-niv7", domain: "genie-civil-infra", jobTarget: "Modules spécifiques ferroviaire grâce à la proximité industrie.", onisepUrl: null },
  { slug: "master-3et", nameFr: "Master Économie de l'Environnement, de l'Énergie et des Transports (3ET)", rncpCode: "38959", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Construit avec l'ENTPE, adossé au Laboratoire LAET.", onisepUrl: null },
  { slug: "master-turp", nameFr: "Master Transports Urbains et Régionaux de Personnes (TURP)", rncpCode: "38965", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Compétence pluridisciplinaire dans les transports.", onisepUrl: null },
  { slug: "master-tlic", nameFr: "Master Transports et Logistique Industrielle et Commerciale (TLIC)", rncpCode: "38965", level: "master-niv7", domain: "exploitation-circulation", jobTarget: "Pilotage des chaînes logistiques et de transport.", onisepUrl: null },
  { slug: "master-ter", nameFr: "Master Transport, Espace, Réseau (TER)", rncpCode: "38965", level: "master-niv7", domain: "transport-mobilite", jobTarget: "Recherche et conseil en aménagement et transports.", onisepUrl: null },
  { slug: "designer-transport", nameFr: "Designer concepteur industriel option transport", rncpCode: "35411", level: "master-niv7", domain: "ingenierie-conception", jobTarget: "Design industriel spécialisé transport.", onisepUrl: null },

  // === NIVEAU 8 (MASTÈRE SPÉCIALISÉ) ===
  { slug: "mastere-stfu", nameFr: "Mastère Spécialisé Systèmes de Transports Ferroviaires et Urbains", rncpCode: null, level: "mastere-niv8", domain: "ingenierie-conception", jobTarget: "Formation d'excellence pour futurs cadres dirigeants du secteur.", onisepUrl: "https://www.onisep.fr/ressources/univers-formation/formations/post-bac/mastere-spe.-systemes-de-transports-ferroviaires-et-urbains-ecole-des-ponts-paristech-insa-hauts-de-france-utc" },
  { slug: "mastere-smart-mobility", nameFr: "Mastère Spécialisé Smart Mobility", rncpCode: null, level: "mastere-niv8", domain: "transport-mobilite", jobTarget: "Conception et gestion des systèmes de mobilité connectée.", onisepUrl: null },
  { slug: "mastere-ifrdd", nameFr: "Mastère Spécialisé Infrastructures Ferroviaires Résilientes, Durables et Digitalisées", rncpCode: null, level: "mastere-niv8", domain: "genie-civil-infra", jobTarget: "Défis de l'infrastructure pour la mobilité ferroviaire.", onisepUrl: null },
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
  { slug: "estaca-bordeaux", name: "ESTACA Bordeaux", city: "Bordeaux", region: "NAQ", type: "ecole-ingenieur", lat: 44.8275, lng: -0.5560, website: "https://www.estaca.fr/" },

  // === PAYS DE LA LOIRE ===
  { slug: "cfa-ferroviaire-le-mans", name: "CFA Ferroviaire - Le Mans", city: "Le Mans", region: "PDL", type: "cfa", lat: 47.9960, lng: 0.1930 },

  // === ARTS ET MÉTIERS (MULTI-SITES) ===
  { slug: "arts-metiers-paris", name: "Arts et Métiers (ENSAM)", city: "Paris", region: "IDF", type: "grande-ecole", lat: 48.8382, lng: 2.3620 },

  // === SNCF ===
  { slug: "universite-traction-sncf", name: "Université Traction - SNCF Voyageurs", city: "Paris", region: "IDF", type: "autre", lat: 48.8410, lng: 2.3599 },

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
  // Ingénieur conception matériel roulant
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-conception-materiel", formation: "ingenieur-transports-ensam" },
  { metier: "ingenieur-conception-materiel", formation: "master-transports-mobilites" },
  // Technicien d'essais
  { metier: "technicien-essais", formation: "bts-maintenance-systemes" },
  { metier: "technicien-essais", formation: "but-mesures-physiques" },
  // Ingénieur signalisation
  { metier: "ingenieur-signalisation", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-signalisation", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-signalisation", formation: "but-geii" },
  // Ingénieur travaux ferro
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-infra-ferro-imt" },
  { metier: "ingenieur-travaux-ferro", formation: "ingenieur-transports-entpe" },
  { metier: "ingenieur-travaux-ferro", formation: "bts-travaux-publics" },
  // Chef de projet ferro
  { metier: "chef-projet-ferro", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "chef-projet-ferro", formation: "mastere-stfu" },
  { metier: "chef-projet-ferro", formation: "master-transports-mobilites" },
  // Ingénieur commercial ferro
  { metier: "ingenieur-commercial-ferro", formation: "master-transports-mobilites" },
  { metier: "ingenieur-commercial-ferro", formation: "master-tlic" },
  // Designer transport
  { metier: "designer-transport-metier", formation: "bachelor-design-transport" },
  { metier: "designer-transport-metier", formation: "designer-transport" },
  // Ingénieur systèmes ferro
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-ferroviaire-estaca" },
  { metier: "ingenieur-systemes-ferro", formation: "ingenieur-gc-ge-insa" },
  { metier: "ingenieur-systemes-ferro", formation: "mastere-stfu" },
  // Responsable production
  { metier: "responsable-production", formation: "bts-maintenance-systemes" },
  { metier: "responsable-production", formation: "but-gim" },
  { metier: "responsable-production", formation: "ingenieur-transports-ensam" },
  // Technicien bureau d'études
  { metier: "technicien-bureau-etudes", formation: "bts-electrotechnique" },
  { metier: "technicien-bureau-etudes", formation: "but-geii" },
  { metier: "technicien-bureau-etudes", formation: "but-rt" },
  // Chef de chantier voie ferrée
  { metier: "chef-chantier-voie", formation: "bac-pro-travaux-publics" },
  { metier: "chef-chantier-voie", formation: "bts-travaux-publics" },
  { metier: "chef-chantier-voie", formation: "ingenieur-infra-ferro-imt" },
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
        onisepUrl: f.onisepUrl ?? null,
        levelId: levelMap[f.level],
        domainId: domainMap[f.domain],
        jobTarget: f.jobTarget ?? null,
      },
      create: {
        slug: f.slug,
        nameFr: f.nameFr,
        rncpCode: f.rncpCode ?? null,
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
