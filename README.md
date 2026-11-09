# Treino · 12 semanas

App pessoal de treino (musculação + corrida), instalável no celular (PWA), 100% offline.
Os dados ficam só no aparelho (IndexedDB) — faça backup em JSON pela aba Perfil.

## Rodar no computador

```bash
npm install
npm run dev          # abre em http://localhost:5173
npm run dev:celular  # acessível pelo celular na mesma rede Wi-Fi
npm test
```

## Publicação

Cada push na branch `main` publica no GitHub Pages (`.github/workflows/deploy.yml`).
No repositório: Settings → Pages → Source = **GitHub Actions**.

## Estrutura

- `src/lib/` — datas, programa (semanas/fases), tema
- `src/db.ts` — banco local (Dexie/IndexedDB)
- `src/ui/` — design system: componentes, ícones e ilustrações SVG
- `src/screens/` — telas (Hoje, Programa, Evolução, Perfil)
- `public/icon.svg` — ícone; `npm run icones` gera os PNGs (requer Playwright)
