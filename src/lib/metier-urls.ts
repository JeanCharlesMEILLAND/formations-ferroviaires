// Mapping from our metier slugs to the exact URLs on external sites
// Futur en Train: https://www.futurentrain.fr/metiers/[slug]/
// Avec l'Industrie Ferroviaire: https://www.aveclindustrieferroviaire.fr/metier/[slug]

const FUTUR_BASE = "https://www.futurentrain.fr/metiers";
const AVEC_BASE = "https://www.aveclindustrieferroviaire.fr/metier";

interface MetierUrls {
  futurEnTrain: string;
  avecIndustrie: string;
}

const mapping: Record<string, { futur?: string; avec?: string }> = {
  // === Source: aveclindustrieferroviaire ===
  "chef-chantier-voie": {
    futur: "chef-equipe-maintenance-voie-ferree",
  },
  "chef-projet-ferro": {
    avec: "chef-fe-de-projet-affaires",
  },
  "designer-transport-metier": {
    avec: "ingenieur-e-designer",
  },
  "ingenieur-commercial-ferro": {
    avec: "technico-commercial-e",
  },
  "ingenieur-conception-materiel": {
    avec: "ingenieur-e-mecanique",
  },
  "ingenieur-signalisation": {
    futur: "technicien-de-maintenance-signalisation",
    avec: "ingenieur-e-controle-commande",
  },
  "ingenieur-systemes-ferro": {
    avec: "ingenieur-e-systemes",
  },
  "ingenieur-travaux-ferro": {
    avec: "ingenieur-e-en-infrastructures-electriques-ferroviaires",
  },
  "responsable-production": {
    avec: "ingenieur-e-de-production",
  },
  "technicien-bureau-etudes": {
    avec: "technicien-ne-conception-bureau-d-etudes",
  },
  "technicien-essais": {
    avec: "technicien-ne-d-essais",
  },

  // === Source: futurentrain ===
  "agent-escale": {
    futur: "agent-en-gare",
  },
  "agent-circulation": {
    futur: "agent-de-circulation",
  },
  "agent-maintenance-installations": {
    futur: "agent-maintenance-voie-ferree",
    avec: "operateur-rice-d-installation-ou-maintenance-industrielle",
  },
  "agent-manoeuvre": {
    futur: "agent-trains-travaux",
    avec: "conducteur-trice-de-manoeuvre",
  },
  "aiguilleur": {
    futur: "aiguilleur-du-rail",
  },
  "chaudronnier-ferro": {
    avec: "chaudronnier-ere",
  },
  "conducteur-rer": {
    futur: "conducteur-de-train",
  },
  "conducteur-metro": {},
  "conducteur-train": {
    futur: "conducteur-de-train",
  },
  "conducteur-train-fret": {
    futur: "conducteur-de-train",
  },
  "conducteur-tramway": {
    futur: "superviseur-tram-train",
  },
  "mecanicien-maintenance-ferro": {
    futur: "technicien-de-maintenance-des-trains",
    avec: "technicien-ne-maintenance",
  },
  "operateur-maintenance-voies": {
    futur: "agent-maintenance-voie-ferree",
    avec: "operateur-rice-d-installation-ou-maintenance-industrielle",
  },
  "peintre-industriel-ferro": {
    avec: "peintre-industriel-le",
  },
  "regulateur-transports": {
    futur: "planificateur-operationnelle",
  },
  "soudeur-ferro": {
    avec: "soudeur-se",
  },
  "technicien-catenaire": {
    futur: "technicien-de-la-catenaire",
    avec: "electrotechnicien-ne",
  },
  "technicien-systemes-embarques": {
    avec: "ingenieur-e-informatique-et-electronique-embarquees",
  },
  "technicien-maintenance-ferro": {
    futur: "technicien-de-maintenance-signalisation",
    avec: "technicien-ne-maintenance",
  },
  "technicien-signalisation": {
    futur: "technicien-de-maintenance-signalisation",
    avec: "technicien-ne-de-signalisation-electrique",
  },
  "electricien-industriel-ferro": {
    futur: "electricien-haute-moyenne-tension",
    avec: "electrotechnicien-ne",
  },
};

export function getMetierUrls(slug: string): MetierUrls {
  const m = mapping[slug];
  return {
    futurEnTrain: m?.futur ? `${FUTUR_BASE}/${m.futur}/` : `${FUTUR_BASE}/`,
    avecIndustrie: m?.avec ? `${AVEC_BASE}/${m.avec}` : `${AVEC_BASE}/../metiers`,
  };
}
