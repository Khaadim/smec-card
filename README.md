# SMEC – Carte de membre numérique

## Lancer en local
1. Installer Node.js (LTS) : https://nodejs.org
2. Copier `.env.local.example` en `.env.local` et remplir les valeurs
3. `npm install` puis `npm run dev` → http://localhost:3000

## Variables d'environnement (aussi à saisir dans Vercel)
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SITE_URL, PAYMENT_MODE

## Administration : http://localhost:3000/admin
Tableau de bord, Membres (créer, voir, modifier, supprimer, révoquer/réactiver, export),
Paiements, Cartes, Paramètres. Téléchargement des cartes en PNG et PDF.
La session dure 1 heure.
