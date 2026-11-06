# SMEC – Carte de membre numérique

## Lancer en local
1. Installer Node.js (LTS) : https://nodejs.org
2. Copier `.env.local.example` en `.env.local` et remplir les valeurs
3. `npm install` puis `npm run dev` → http://localhost:3000

## Variables d'environnement (aussi à saisir dans Vercel)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SITE_URL, PAYMENT_MODE
PAYMENT_MODE=manual : paiement en espèces / Wave / Orange Money confirmé par un administrateur (mode par défaut)
PAYMENT_MODE=simulation : paiement validé automatiquement (tests uniquement)

## Administration : http://localhost:3000/admin
Tableau de bord, Membres (créer, voir, modifier, supprimer, révoquer/réactiver, export),
Paiements, Cartes, Paramètres. Téléchargement des cartes en PNG et PDF.
La session dure 1 heure.

## Pied de page
Les informations de contact (e-mail, WhatsApp, réseaux sociaux) se renseignent dans `lib/site.js`.
Un champ vide n'est pas affiché. Les pages `/aide` et `/confidentialite` sont des modèles à relire et adapter.
