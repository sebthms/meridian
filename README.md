# MERISE Diagrams

Éditeur web de modèles de données MERISE. Conception d'un MCD, validation selon les règles MERISE, transformation automatique en MLD relationnel puis en SQL PostgreSQL. 

**[Démo en ligne](https://sebeboo.github.io/merise-diagrams/)**

---

## Fonctionnement

```
MCD (canvas)
  ↓  validation en temps réel
Règles MERISE
  ↓
MLD relationnel
  ↓
SQL PostgreSQL (prévisualisable et exportable)
```

- Les **erreurs** bloquent la génération et l’export SQL.
- Les **warnings** signalent des choix de conception discutables.
- Le MLD et le SQL se mettent à jour au fil des modifications.

## Fonctionnalités principales

- Vues MCD, UML et MLD sur un canvas interactif.
- Entités et associations binaires ou réflexives, cardinalités `0,1`, `1,1`, `0,N`, `1,N`.
- Héritage (couverture / exclusivité), contraintes, CIF (si le MCD a déjà une association à max cible 1), règles métier.
- Propriétés avec types conceptuels, identifiants, nullabilité, unicité et configuration de type.
- Modèles de départ (blog, boutique, CRM, bibliothèque, scolarité, RH).
- Arborescence, validation, SQL PostgreSQL, undo/redo, bibliothèque locale multi-diagrammes.


## Commandes

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm lint          # ESLint React/TypeScript
pnpm test
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

Le moteur métier est **indépendant de React Flow**. Le modèle vit dans `src/domain/`. Validator, MLD et SQL ne dépendent d’aucun composant React. Les nœuds sont dérivés via `src/editor/nodes/adapter.ts` ; les liaisons canvas passent par `src/editor/connect.ts`. Les commandes d’édition sont des fonctions pures `(Project) → Project`.

Détail : `CONTEXT.md`.

## Structure du projet

```
src/
├── app/            Layout
├── components/     canvas, panel, shared, ui
├── domain/         modèle MCD (y compris héritage, CIF, contraintes, règles)
├── merise/         validator + règles
├── mld/            MCD → MLD
├── sql/            PostgreSQL
├── editor/         commandes, connect canvas, adapter
├── store/          Zustand
├── persistence/    localStorage + .merise.json
└── templates/      modèles de départ
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

Héritage, contraintes, CIF (association fonctionnelle déjà présente) et règles métier sont dans le MCD. Hors scope : n-aires éditables, CIM, temporalité, MCT/MOT, autres dialectes SQL, reverse engineering.

## Licence

Projet privé — tous droits réservés.
