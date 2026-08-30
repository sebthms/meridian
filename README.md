# MERISE Diagrams

Modélisateur de bases de donnée basé sur MERISE, entièrement client-side (aucun backend, aucun compte).

## Chaîne fonctionnelle

```
MCD
 ↓
Validation MERISE (erreurs + warnings pédagogiques)
 ↓
MLD relationnel
 ↓
SQL (PostgreSQL)
```

## Démarrage

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm test          # tests du moteur
pnpm build         # build de production dans dist/
pnpm preview       # prévisualiser le build
```

## Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Zustand · @xyflow/react

## Architecture

Le moteur métier est **indépendant de React Flow** :

```
domain model (MERISE)
     ↓
validator → ValidationIssue[]
     ↓
MLD generator → SQL generator
```

React Flow n'est qu'une représentation graphique du modèle.

## Structure

```
src/
├── app/            UI principale
├── components/     canvas, inspector, issues, mld, sql, ui
├── domain/         modèle conceptuel (entité, attribut, association, cardinalité…)
├── merise/         validator + règles (E001…E010, W001…W004)
├── mld/            générateur MCD → MLD
├── sql/            générateur PostgreSQL
├── editor/         commandes d'édition (undo/redo)
├── store/          store Zustand
└── persistence/    localStorage + import/export .merise.json
fixtures/           fixtures de référence
```

## Déploiement GitHub Pages

Workflow dans `.github/workflows/deploy.yml` (build `dist/`, base `/merise-diagrams/`).
Tout tourne côté navigateur ; GitHub Pages ne sert que le frontend construit.

## Règles MERISE couvertes (MVP)

- Entité sans nom (`E001`), sans identifiant (`E002`)
- Attribut sans nom (`E003`), dupliqué (`E004`)
- Identifiant invalide (`E005`)
- Association sans nom (`E006`), mal connectée (`E007`)
- Cardinalité invalide (`E008`), incomplète (`E009`)
- Référence orpheline (`E010`)
- Warnings de conception (`W001`…`W004`)
- Transformations 1:N, N:N, 1:1, réflexive, identifiant composé, propriétés d'association

Les extensions MERISE avancées (n-aires, CIF, héritage…) sont repoussées en V2.
