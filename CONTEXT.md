# Contexte projet

## Vision
**MERISE Diagrams** est un éditeur web de modèles de données basé sur **MERISE**, entièrement côté navigateur : construire un **MCD**, le **valider**, puis le transformer en **MLD** relationnel et en **SQL** (PostgreSQL).

```
MCD → Validation MERISE → MLD relationnel → SQL
```

Contraintes produit :
- 100 % client-side, sans compte, sans backend.
- Pédagogique : explique les règles, pas seulement « invalide ».
- Déployable sur GitHub Pages.

## Stack technique
| Domaine       | Choix                                        |
|---------------|----------------------------------------------|
| Framework     | React 19                                     |
| Langage       | TypeScript (strict)                          |
| Build         | Vite 8                                       |
| UI            | Tailwind CSS + shadcn/ui (structure)         |
| Diagramme     | `@xyflow/react` (React Flow)                 |
| State         | Zustand                                      |
| Tests         | Vitest                                       |
| Backend       | Aucun                                        |
| Persistance   | bibliothèque multi-projets localStorage + fichier `.merise.json` |
| Hosting       | GitHub Pages                                 |

## Règle d'or (architecture)
**React Flow n'est pas le modèle métier.** Il n'en est que la représentation graphique.

```
domain model (MERISE)
     ↓
validator → ValidationIssue[]
     ↓
MLD generator → SQL generator

domain model ──→ React Flow (vue)
```

Le moteur métier est indépendant de React. Les nœuds/arêtes React Flow sont dérivés du modèle via `src/editor/nodes/adapter.ts`. Les connexions canvas passent par `src/editor/connect.ts` (fonctions pures).

## Structure du dépôt
```
src/
├── app/            Layout racine
├── components/
│   ├── canvas/     React Flow, nœuds, docks, modales d’édition
│   ├── panel/      Validation, arbre, SQL, projets, paramètres
│   ├── shared/     Confirmations, boutons transverses
│   └── ui/         Primitives shadcn
├── domain/         Entités, associations, héritage, contrainte, CIF, règle métier, Project
├── merise/         Validator + règles structural / semantic / advanced
├── mld/            Générateur MCD → MLD
├── sql/            Générateur PostgreSQL
├── editor/         Commandes pures + connect canvas + adapter nœuds
├── store/          Zustand + historique + bibliothèque de projets
├── persistence/    localStorage + import/export .merise.json
├── templates/      catalog.json + projects.json (généré)
└── lib/            palettes, utils
scripts/            palettes CSS, templates MCD
docs/               notes techniques (types, tooltips)
```

## Modèle conceptuel (source de vérité)
`Project` (`src/domain/model.ts`, version fichier `1`) :

- `Entity` : id, name, attributes, identifiers, position.
- `Attribute` : id, name, conceptualType (`TEXT|INTEGER|DECIMAL|DATE|BOOLEAN`), nullable, unique, description, typeConfig optionnel.
- `Identifier` : id, attributeIds, `isPrimary` optionnel.
- `Association` : id, name, participants, attributes, position.
- `Cardinality` : `0,1 · 1,1 · 0,N · 1,N`.
- `Inheritance` : parent, enfants, coverage (`total|partial`), exclusivity (`exclusive|overlapping`), position.
- `ModelConstraint` : kind (exclusion, totality, partition, inclusion, simultaneity, custom), targetIds.
- `FunctionalDependencyConstraint` (CIF) : source, cible, association porteuse optionnelle (max cible = 1 déjà dans le MCD).
- `BusinessRule` : description, level `info|warning|error`, targetIds.

Le MCD n'expose **jamais** de types SQL physiques. Les CIF, héritages et contraintes **ne créent pas de DDL inventé** : le SQL les documente en commentaires. Une règle `level: 'error'` apparaît dans les erreurs de validation (BR001) et bloque l’export SQL.

`normalizeProject()` complète les tableaux conceptuels absents des anciens fichiers.

## Règles de validation
**Erreurs bloquantes (extrait)**  
E001–E012 (noyau + collision de noms SQL) · E016–E017 (typeConfig) · E020–E028 (héritage, contrainte, CIF, règle) · BR001 (règle métier `error`).

**Warnings / infos**  
W001–W005, W008–W011, W015–W017, W019–W020, W022, W025, I001–I004.

**Ignorance** : id stable ; occurrence ou règle entière, persisté dans le projet.

## Transformations MCD → MLD
Inchangées pour le noyau binaire (entité → table, 1:N, N:N, 1:1, réflexive, identifiants alternatifs UNIQUE). Les concepts avancés sont notés sur le MLD (`conceptualNotes`) sans tables fantômes.

## Templates
`src/templates/catalog.json` + `src/templates/projects.json`.  
Génération : `pnpm generate:templates` (`scripts/build-templates.mjs`).  
Chaque entrée doit passer `validateProject` sans erreur. Pas de colonnes FK dans le MCD.

## UI
- Dock canvas : MCD / UML / MLD, ajout entité, association, héritage, contrainte, CIF, règle métier, undo/redo.
- Sidebar : validation, diagrammes, arborescence (y compris concepts avancés), SQL, paramètres, palettes.
- Édition inline des entités/associations ; double-clic / crayon sur les nœuds conceptuels.
- Premier lancement : création de diagramme obligatoire (vide ou template).

## Conventions
- Fichiers et commits en anglais ; UI et commentaires en français.
- Commandes d'édition : `(Project) → Project`.
- Qualité : `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Commandes
```bash
pnpm dev
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm generate:palettes
pnpm generate:templates
```

## Périmètre
Noyau MERISE binaire **et** héritage, contraintes d’intégrité graphiques, CIF (si association fonctionnelle déjà présente), règles métier.

Hors scope : associations n-aires éditables, CIM, temporalité, MCT/MOT, normalisation 3FN formelle, autres dialectes SQL, reverse engineering.
