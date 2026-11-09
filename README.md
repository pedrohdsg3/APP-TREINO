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

## Funcionalidades

- Perfis ("Quem vai treinar?") com personagens ilustrados do Pedro e da Yana; cada perfil tem plano e banco próprios
- Planos de 12 semanas em `src/data/planos.ts` (Pedro e "Inferiores em foco"), musculação guiada, corrida guiada, cardio leve
- Evolução (gráficos), metas, conquistas, duelo de presença entre perfis
- Treino perdido com recomendação automática, configurações, backup/importação em JSON

Página de conferência dos personagens: abra o app com `?galeria`.

## Estrutura

- `src/data/` — catálogo de exercícios, planos e tabelas de corrida (edite aqui)
- `src/engine/` — regras puras e testadas (plano, progressão, PR, treino perdido, duelo…)
- `src/lib/` — datas, perfis, backup, alertas, tema
- `src/db.ts` — banco local (Dexie/IndexedDB)
- `src/ui/` — design system: componentes, ícones e ilustrações SVG
- `src/screens/` — telas (Hoje, Programa, Evolução, Perfil)
- `public/icon.svg` — ícone; `npm run icones` gera os PNGs (requer Playwright)
