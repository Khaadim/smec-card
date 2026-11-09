// Informations affichées dans l'application.
// ➜ Remplissez les champs vides : un champ vide n'est simplement pas affiché.
export const site = {
  name: 'SMEC',
  fullName: 'School of Medicine English Club',
  tagline: "Une communauté qui apprend, s'exprime et grandit ensemble.",
  slogan: 'Learn · Connect · Grow',
  motto: 'Together Everybody Archive More - TEAM',
  price: 1000,              // prix de la carte en FCFA
  email: 'contact@smec.sn',                // ex : 'contact@smec.sn'
  whatsapp: '',             // chiffres seulement, avec indicatif, ex : '221771234567'
  instagram: '',            // ex : 'https://instagram.com/votre_compte'
  facebook: '',
  linkedin: '',
  waveNumber: '',           // numéro Wave qui reçoit les paiements, ex : '77 123 45 67'
  orangeNumber: '',         // numéro Orange Money qui reçoit les paiements
  cashPlace: '',
  validityMode: 'end_of_year',   // 'end_of_year' (31 décembre) ou 'months' (N mois après l'activation)
  validityMonths: 12,
  cardPrefix: 'SMEC',
  cardDigits: 4,
  cardIncludeYear: true,
  siteUrl: '',              // adresse du site ; sinon la variable SITE_URL est utilisée            // où remettre les espèces, ex : 'lors de la prochaine séance du club'
  version: '0.5.0',
};

export const METHOD_LABELS = {
  cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money',
  mobile_money: 'Mobile Money', other: 'Autre', simulation: 'Simulation',
};

// Mode de paiement : "manual" (défaut), "simulation" (tests) ou un agrégateur plus tard
export const paymentMode = () => process.env.PAYMENT_MODE || 'manual';
