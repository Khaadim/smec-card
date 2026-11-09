// Outils pour les numéros de téléphone
export const digits = (p) => String(p || '').replace(/\D/g, '');

// Deux numéros sont identiques si leurs 9 derniers chiffres sont les mêmes (ignore +221, espaces, etc.)
export const sameNumber = (a, b) => {
  const x = digits(a), y = digits(b);
  return x.length >= 8 && y.length >= 8 && x.slice(-9) === y.slice(-9);
};

// Numéro au format attendu par wa.me (international, sans + ni espaces)
export const waNumber = (p) => {
  let d = digits(p);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9) d = '221' + d;
  return d;
};
