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
| Framework     | React 18                                     |
| Langage       | TypeScript (strict)                          |
| Build         | Vite 6                                       |
| UI            | Tailwind CSS + shadcn/ui (structure)         |
| Diagramme     | `@xyflow/react` (React Flow)                 |
| State         | Zustand                                      |
| Tests         | Vitest                                       |
| Backend       | Aucun                                        |
| Persistance   | localStorage + fichier `.merise.json`        |
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

Le moteur métier est indépendant de React. Les nœuds/arêtes React Flow sont dérivés du modèle via un adaptateur (`src/editor/nodes/adapter.ts`).

## Structure du dépôt
```
src/
├── app/            UI principale (layout)
├── components/     canvas, inspector, issues, mld, sql, ui
├── domain/         modèle conceptuel (entity, attribute, identifier, association, cardinality, model)
├── merise/         validator + règles (structural, semantic) + types
├── mld/            générateur MCD → MLD + format
├── sql/            générateur PostgreSQL
├── editor/         commandes d'édition + adapter de nœuds
├── store/          store Zustand + historique
└── persistence/    localStorage + import/export .merise.json
fixtures/           fixtures de référence (transformations attendues)
```

## Modèle conceptuel (source de vérité)
- `Entity` : id, name, attributes, identifiers, position.
- `Attribute` : id, name, conceptualType (`TEXT|INTEGER|DECIMAL|DATE|BOOLEAN`), nullable.
- `Identifier` : id, attributeIds (simple ou composé).
- `Association` : id, name, participants, attributes (propriétés portées).
- `AssociationParticipant` : entityId, role, cardinality.
- `Cardinality` : min (`0|1`) × max (`1|"N"`) → 4 formes : `0,1 · 1,1 · 0,N · 1,N`.

Le MCD n'expose **jamais** de types SQL physiques (`VARCHAR(255)`, `SERIAL`, `DECIMAL(10,2)`…).

## Règles de validation
**Erreurs bloquantes**
- E001 entité sans nom · E002 entité sans identifiant · E003 attribut sans nom · E004 attribut dupliqué · E005 identifiant invalide · E006 association sans nom · E007 association mal connectée · E008 cardinalité invalide · E009 cardinalité incomplète · E010 référence orpheline.

**Warnings de conception**
- W001 nom suspect · W002 attribut potentiellement non atomique · W003 structure répétitive · W004 dépendance fonctionnelle suspecte.

**Ignorance** : chaque issue a un id stable ; l'utilisateur peut ignorer une occurrence ou une règle entière (état persisté dans le projet).

## Transformations MCD → MLD (déterministes)
- **Entité** → table (identifiant = clé primaire).
- **1:N** : FK migre vers l'extrémité `max = 1`, référence l'extrémité `max = N`.
- **N:N** : table associative (PK composite = FK des deux entités) + propriétés de l'association.
- **0,1 ↔ 1,1** : FK dans le côté `1,1`.
- **1,1 ↔ 1,1** : deux tables conservées (pas de fusion, décision documentée).
- **Réflexive** : FK autoréférentielle avec rôles.

## Comportement UI (courant)
- **Dock intégré** au canvas (remplace la topbar) : + Entité, Supprimer, Undo/Redo, Export .json / .sql.
- **Sélection** : entités et associations sélectionnables, surlignage visuel ; la sélection survit à l'édition.
- **Ajout de propriété** : formulaire (nom + type + « Ajouter ») qui se réinitialise.
- **Associations par drag & drop** : chaque **identifiant 🔑** a un point de connexion ; on tire vers une autre table, puis on choisit le type (`1:N`, `N:N`, `1:1`, `Réflexive`).
- **Types conceptuels** affichés à droite de chaque propriété dans le diagramme.
- **Undo/Redo** : raccourcis Ctrl/Cmd+Z · Shift+Z · Y ; historique non inondé pendant le drag.
- **Validation en temps réel** : panneau bas « Problèmes / MLD / SQL ».

## Conventions
- Noms de fichiers/commits en anglais, commentaires de code et UI en français.
- Commandes d'édition : fonctions pures `(Project) → Project` (undo/redo trivial).
- Tests obligatoires : typecheck (`pnpm typecheck`), tests (`pnpm test`), build (`pnpm build`).

## Commandes
```bash
pnpm dev           # http://localhost:5173
pnpm test          # 114 tests (Vitest)
pnpm typecheck     # tsc --noEmit
pnpm build         # dist/
pnpm preview       # prévisualiser le build
```

## Périmètre & hors MVP
Le MVP couvre le **noyau MERISE** (MCD binaire, règles de passage MLD). Extensions repoussées en V2 : associations n-aires, CIF, héritage, partition/exclusion, temporalité, autres dialectes SQL, import SQL/reverse engineering.
