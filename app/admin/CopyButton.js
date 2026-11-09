'use client';
import { useState } from 'react';

export default function CopyButton({ text, label = 'Copier' }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 2000);
    } catch {
      window.prompt('Copiez le lien :', text);
    }
  }
  return <button type="button" onClick={copy}>{ok ? 'Copié ✓' : label}</button>;
}
