# MERISE Diagrams

Éditeur web de modèles de données MERISE. Conception d'un MCD, validation selon les règles MERISE, transformation automatique en MLD relationnel puis en SQL PostgreSQL. 

**[Démo en ligne](https://sebeboo.github.io/merise-diagrams/)**

---

## Fonctionnement

```
MCD (canvas)
  ↓  validation en temps réel
Règles MERISE (E001–E011, W001–W005)
  ↓
MLD relationnel
  ↓
SQL PostgreSQL (prévisualisable et exportable)
```

- Les **erreurs** (E001…E011) bloquent la génération et l’export SQL — le modèle n'est pas conforme.
- Les **warnings** (W001…W005) signalent des choix de conception discutables.
- Le MLD et le SQL se mettent à jour automatiquement au fil des modifications.

## Fonctionnalités principales

- Vues MCD, UML et MLD sur un canvas interactif.
- Entités et associations binaires ou réflexives, avec cardinalités `0,1`, `1,1`, `0,N` et `1,N`.
- Propriétés d'entité et d'association avec cinq types conceptuels, identifiants principaux ou alternatifs, nullabilité et unicité.
- Arborescence repliable synchronisée avec la sélection du diagramme.
- Validation MERISE en temps réel avec erreurs bloquantes et avertissements ignorables.
- Panneau SQL PostgreSQL latéral, mis à jour automatiquement, avec export intégré.
- Historique Undo/Redo et persistance locale dans le navigateur.
- Bibliothèque de diagrammes multiples avec création, ouverture, renommage, suppression et auto-save.
- Accès aux diagrammes et aux paramètres depuis le dock supérieur droit ; le premier lancement demande de créer un diagramme.


## Commandes

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm lint          # ESLint React/TypeScript
pnpm test          # 136 tests (Vitest)
pnpm typecheck     # vérification de types
pnpm build         # build de production → dist/
pnpm preview       # prévisualiser le build
```

## Stack technique

| Domaine       | Technologie |
|---------------|-------------|
| Framework     | React 19 + TypeScript |
| Build         | Vite 8 |
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
├── components/     canvas, issues, sql, ui
├── domain/         modèle conceptuel (entité, attribut, identifiant, association, cardinalité)
├── merise/         validator + règles (structural/semantic)
├── mld/            générateur MCD → MLD
├── sql/            générateur PostgreSQL
├── editor/         commandes d'édition + adapter de nœuds
├── store/          store Zustand + historique
└── persistence/    localStorage + sérialisation de projet
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
| E011 | Type conceptuel invalide | Erreur |
| E012 | Nom physique PostgreSQL dupliqué | Erreur |
| W001 | Nom suspect | Warning |
| W002 | Attribut potentiellement non atomique | Warning |
| W003 | Structure répétitive suspecte | Warning |
| W004 | Dépendance fonctionnelle suspecte | Warning |
| W005 | Association ternaire (non supportée en MVP) | Warning |

Le MVP couvre le noyau MERISE binaire. Les identifiants alternatifs sont traduits en contraintes `UNIQUE` dans le MLD/SQL. Les noms SQL sont normalisés de façon déterministe et les clés étrangères sont ajoutées après la création des tables, ce qui permet de gérer l'ordre des entités et les cycles.

Les extensions avancées — associations n-aires, CIF/CIM avancées, héritage, partition/exclusion, temporalité, MCT/MOT, normalisation formelle et autres dialectes SQL — sont prévues pour une version future.

## Licence

Projet privé — tous droits réservés.
