/**
 * Mise en forme des noms d'établissements pour l'affichage.
 * Beaucoup de noms arrivent en capitales (fichiers, imports) : « CAMPUS MECATEAM », « LPO LYCEE DES METIERS ».
 * On les passe en casse de titre en préservant les sigles connus et les mots courts en capitales.
 */
const ACRONYMS = new Set([
  "CFA", "CFAI", "IUT", "CNAM", "CMQ", "FIAEM", "EFMO", "GRETA", "CMA", "AFPA", "AFTRAL", "LPO", "LP", "LGT", "LT", "LEGT",
  "BTS", "EPSF", "SNCF", "RATP", "ENSAM", "INSA", "IMT", "UTC", "ESTACA", "ITEDEC", "CESI", "CCI", "UIMM", "AFORP",
  "ENTPE", "ENSTA", "ISAE", "ENAC", "ENIM", "ENIT", "ENIB", "ENISE", "ICAM", "IFTIM", "CA2P", "AIJF", "ECAM", "EPF",
  "UTBM", "UPHF", "UPEC", "UGE", "USMB", "UBS", "UBO", "IRT", "TES", "RER", "TGV", "OFP", "UTPF", "FIF", "SNCF-RESEAU",
]);
const SMALL = new Set(["de", "des", "du", "la", "le", "les", "et", "en", "d", "l", "à", "au", "aux", "sur", "sous", "pour"]);

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function displayName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  const letters = trimmed.replace(/[^A-Za-zÀ-ÿ]/g, "");
  // Si le nom n'est pas majoritairement en capitales, on le laisse tel quel.
  if (letters.length < 6 || letters !== letters.toUpperCase()) return trimmed;

  return trimmed
    .split(/(\s+|-|\/|'|’|\()/)
    .map((part, i) => {
      if (!part || /^(\s+|-|\/|'|’|\()$/.test(part)) return part;
      const clean = part.replace(/[^A-Za-zÀ-ÿ0-9]/g, "");
      if (ACRONYMS.has(clean.toUpperCase())) return part.toUpperCase();
      if (/\d/.test(part)) return part.toUpperCase();
      if (clean.length <= 2 && i > 0) return SMALL.has(part.toLowerCase()) ? part.toLowerCase() : part.toUpperCase();
      if (i > 0 && SMALL.has(part.toLowerCase())) return part.toLowerCase();
      return capitalize(part);
    })
    .join("");
}
