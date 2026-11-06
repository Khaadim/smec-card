// Informations affichées dans l'application.
// ➜ Remplissez les champs vides : un champ vide n'est simplement pas affiché.
export const site = {
  name: 'SMEC',
  fullName: 'School of Medicine English Club',
  tagline: "Une communauté qui apprend, s'exprime et grandit ensemble.",
  slogan: 'Learn · Connect · Grow',
  motto: 'Together Everybody Archives More - TEAM!',
  price: 1000,              // prix de la carte en FCFA
  email: '',                // ex : 'contact@smec.sn'
  whatsapp: '',             // chiffres seulement, avec indicatif, ex : '221771234567'
  instagram: '',            // ex : 'https://instagram.com/votre_compte'
  facebook: '',
  linkedin: '',
  waveNumber: '',           // numéro Wave qui reçoit les paiements, ex : '77 123 45 67'
  orangeNumber: '',         // numéro Orange Money qui reçoit les paiements
  cashPlace: '',            // où remettre les espèces, ex : 'lors de la prochaine séance du club'
  version: '0.4.0',
};

export const METHOD_LABELS = {
  cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money',
  mobile_money: 'Mobile Money', other: 'Autre', simulation: 'Simulation',
};

// Mode de paiement : "manual" (défaut), "simulation" (tests) ou un agrégateur plus tard
export const paymentMode = () => process.env.PAYMENT_MODE || 'manual';
