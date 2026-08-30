# MERISE Diagrams

Éditeur web de modèles de données MERISE. Conception d'un MCD, validation selon les règles MERISE, transformation automatique en MLD relationnel puis en SQL PostgreSQL. 

**[Démo en ligne](https://sebeboo.github.io/merise-diagrams/)**

---

## Fonctionnement

```
MCD (canvas)
  ↓  validation en temps réel
Règles MERISE (E001–E010, W001–W005)
  ↓
MLD relationnel
  ↓
SQL PostgreSQL (copiable)
```

- Les **erreurs** (E001…E010) bloquent la génération — le modèle n'est pas conforme.
- Les **warnings** (W001…W005) signalent des choix de conception discutables.
- Le MLD et le SQL se mettent à jour automatiquement au fil des modifications.


## Commandes

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm test          # 101 tests (Vitest)
pnpm typecheck     # vérification de types
pnpm build         # build de production → dist/
pnpm preview       # prévisualiser le build
```

## Stack technique

| Domaine       | Technologie |
|---------------|-------------|
| Framework     | React 18 + TypeScript |
| Build         | Vite 6 |
| UI            | Tailwind CSS + shadcn/ui |
| Canvas        | @xyflow/react (React Flow) |
| State         | Zustand |
| Tests         | Vitest |
| Hébergement   | GitHub Pages |

## Architecture

Le moteur métier est **indépendant de React Flow**. Le modèle conceptuel (entités, attributs, associations, cardinalités) vit dans `src/domain/`. Le validator, le générateur MLD et le générateur SQL ne dépendent d'aucun composant React. React Flow n'est que la couche graphique — les nœuds et arêtes sont dérivés du modèle via un adaptateur.

```
domain model (MERISE)
     ↓
validator → ValidationIssue[]
     ↓
MLD generator → SQL generator

domain model ──→ React Flow (vue)
```

Les commandes d'édition (`src/editor/commands.ts`) sont des fonctions pures `(Project) → Project`, ce qui rend l'undo/redo trivial.

## Structure du projet

```
src/
├── app/            UI principale (layout)
├── components/     canvas, inspector, issues, mld, sql, ui
├── domain/         modèle conceptuel (entité, attribut, identifiant, association, cardinalité)
├── merise/         validator + règles (structural/semantic)
├── mld/            générateur MCD → MLD
├── sql/            générateur PostgreSQL
├── editor/         commandes d'édition + adapter de nœuds
├── store/          store Zustand + historique
└── persistence/    localStorage + import/export .merise.json
fixtures/           fixtures de référence
```



## Règles MERISE couvertes

| Code | Règle | Sévérité |
|------|-------|----------|
| E001 | Entité sans nom | Erreur |
| E002 | Entité sans identifiant | Erreur |
| E003 | Attribut sans nom | Erreur |
| E004 | Attribut dupliqué | Erreur |
| E005 | Identifiant invalide | Erreur |
| E006 | Association sans nom | Erreur |
| E007 | Association mal connectée | Erreur |
| E008 | Cardinalité invalide | Erreur |
| E009 | Cardinalité incomplète | Erreur |
| E010 | Référence orpheline | Erreur |
| W001 | Nom suspect | Warning |
| W002 | Attribut potentiellement non atomique | Warning |
| W003 | Structure répétitive suspecte | Warning |
| W004 | Dépendance fonctionnelle suspecte | Warning |
| W005 | Association ternaire (non supportée en MVP) | Warning |

Les extensions MERISE avancées (associations n-aires, CIF/CIM, héritage, partition/exclusion, temporalité) sont prévues pour une version future.

## Licence

Projet privé — tous droits réservés.
