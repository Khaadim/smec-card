'use client';
import { useEffect } from 'react';

// Filet de sécurité : si Supabase renvoie le lien de réinitialisation vers une autre page
// (accueil, adresse par défaut…), on transfère le visiteur vers la page « Nouveau mot de passe ».
export default function RecoveryRedirect() {
  useEffect(() => {
    const h = window.location.hash;
    const isRecovery = h.includes('type=recovery') || h.includes('error_code=');
    if (isRecovery && !window.location.pathname.startsWith('/admin/nouveau-mot-de-passe')) {
      window.location.replace('/admin/nouveau-mot-de-passe' + h);
    }
  }, []);
  return null;
}
