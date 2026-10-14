/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    // Autorise l'envoi de photos (jusqu'à 4 Mo) depuis les formulaires d'administration
    serverActions: { bodySizeLimit: '4mb' },
  },
};
