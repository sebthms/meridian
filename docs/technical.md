# Documentation technique

React Flow n’est pas le modèle. Le MCD vit dans `domain` ; le canvas est une projection.

```
Project  →  merise (issues)  →  mld  →  sql
   └──→  features/diagram/flow (nœuds / arêtes)
```

## Stack

React 19, TypeScript strict, Vite 8, Zustand, `@xyflow/react`, Tailwind + shadcn/Radix, Vitest, pnpm. Hébergement GitHub Pages. Pas de routeur ni de backend.

## Découpage

Architecture hybride : couches métier stables, UI par fonctionnalité.

| Zone | Rôle |
| --- | --- |
| `app` | Composition : `App`, canvas, sidebar, choix des panneaux |
| `features/diagram` | Nœuds, arêtes, modales, projections, formulaires purs |
| `features/project-library` | Bibliothèque et templates |
| `features/validation` | Panneau des issues (chunk lazy) |
| `features/sql-export` | Panneau SQL |
| `features/settings` | Thème, palettes, vidage local |
| `shared` | UI générique, thème — aucun import vers domain / store / features |
| `domain` | Modèle et invariants |
| `editor` | Commandes `(Project, …) → Project` et connexions canvas |
| `merise` | Validator |
| `mld` / `sql` | Projection relationnelle et DDL PostgreSQL |
| `persistence` | localStorage et `.merise.json` |
| `store` | Orchestration Zustand |
| `test-support` | Fixtures — jamais importé en production |

Le canvas reste dans `app/workspace` pour ne pas faire importer les panneaux voisins par `features/diagram`.

### Dépendances (valeurs de production)

| Zone | Peut utiliser | Interdit |
| --- | --- | --- |
| `domain` | Autre domain | React, store, SQL, features, app |
| `editor` | domain | React Flow à l’exécution, store, UI |
| `sql` | domain ; types MLD | UI, store, générateur MLD à l’exécution |
| `mld` | domain, `sql/model` | React, store, UI |
| `merise` | domain, mld, nommage SQL | React, store, UI |
| `store` | domain, merise, persistence, Zustand | app, features |
| `shared` | UI générique | domain, store, features |
| `features/*` | couches métier, store, shared, local | `app` et features sœurs |
| `app` | features, shared, store | règles métier dans le JSX |

Nommage des fichiers applicatifs : kebab-case. Symboles : PascalCase / camelCase. Clés métier (`businessRule`, `MCD`, localStorage) inchangées. Racine : `README.md`. `docs/` : kebab-case. Config/outillage : noms imposés par les outils.

## Store

Façade publique : `useProjectStore` (`src/store/project-store.ts`). Création injectable : `createProjectStore` (persistance, horloge, IDs) pour les tests. Le singleton conserve le chargement au import, les clés et le format version 1.

`apply` normalise le projet, revalide, persiste la bibliothèque, pousse l’historique (100). Undo/redo écrivent encore la clé historique, pas la bibliothèque (comportement actuel).

## Formulaires

Logique pure dans `features/diagram/model` (`property-form.ts`, `conceptual-form.ts`, `property-type-defaults.ts`). Les modales gardent l’état React et les textes. `parseAttributeTypeConfig` est partagé import / formulaire / SQL.

## Projections

Entrée : `features/diagram/flow/project-adapter.ts`. MLD généré seulement en vue MLD, une fois pour nœuds et arêtes. Hors MLD, `generateMld` n’est pas appelé par les projections. Le panneau SQL ne génère le script que s’il n’y a pas d’erreur.

Les nœuds lisent le projet au geste via `useProjectStore.getState()`, pas un abonnement au `Project` entier.

## Persistance

- `merise:projects` : `{ id, project, updatedAt }[]`
- `merise:project:last-opened` : ancien projet unique, migré si bibliothèque vide
- Export `.merise.json` : `parseProject` / `exportProject`

`normalizeProject` complète les tableaux conceptuels absents des fichiers anciens.

## UI partagée

`TooltipProvider` unique dans `main.tsx` (délai 300 ms). `AppTooltip` pour les nœuds conceptuels et les boutons désactivés. Pas de `title` natif en parallèle.

## Qualité

```bash
pnpm dev
pnpm test
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm generate:templates
pnpm generate:palettes
```

Tests colocalisés (`.test.ts` / `.test.ts`). CI PR (`.github/workflows/ci.yml`) : tests, lint, typecheck, build — sans déploiement. Déploiement Pages : push `main` uniquement.

ESLint : `react-hooks/rules-of-hooks` en erreur, `exhaustive-deps` en avertissement. Suite compilateur React non activée. 11 avertissements Fast Refresh sur les primitives shadcn (exports `buttonVariants`, etc.) : acceptés.

Empreintes de projection (`projection-baseline.json`) : ne pas régénérer pour faire passer un test.

## Décisions d’architecture

- Hybride couches + features, pas de `pages/` ni de bus d’événements.
- Zustand unique, pas de store par feature.
- PostgreSQL seulement ; MLD couplé à ces types.
- Pas de debounce de sauvegarde, worker ou virtualisation sans mesure.
