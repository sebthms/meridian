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

Le moteur métier est indépendant de React. Les nœuds/arêtes React Flow sont dérivés du modèle via un adaptateur (`src/editor/nodes/adapter.ts`).

## Structure du dépôt
```
src/
├── app/            UI principale (layout)
├── components/     canvas, issues, sql, ui
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
- `Attribute` : id, name, conceptualType (`TEXT|INTEGER|DECIMAL|DATE|BOOLEAN`), nullable, unique, description.
- `Identifier` : id, attributeIds (simple ou composé), `isPrimary` optionnel ; les anciens projets utilisent le premier identifiant comme clé principale.
- `Association` : id, name, participants, attributes (propriétés portées).
- `AssociationParticipant` : entityId, role, cardinality.
- `Cardinality` : min (`0|1`) × max (`1|"N"`) → 4 formes : `0,1 · 1,1 · 0,N · 1,N`.

Le MCD n'expose **jamais** de types SQL physiques (`VARCHAR(255)`, `SERIAL`, `DECIMAL(10,2)`…).

## Règles de validation
**Erreurs bloquantes**
- E001 entité sans nom · E002 entité sans identifiant · E003 attribut sans nom · E004 attribut dupliqué · E005 identifiant invalide · E006 association sans nom · E007 association mal connectée · E008 cardinalité invalide · E009 cardinalité incomplète · E010 référence orpheline · E011 type conceptuel invalide.

**Warnings de conception**
- W001 nom suspect · W002 attribut potentiellement non atomique · W003 structure répétitive · W004 dépendance fonctionnelle suspecte · W005 association ternaire/non prise en charge.

**Ignorance** : chaque issue a un id stable ; l'utilisateur peut ignorer une occurrence ou une règle entière (état persisté dans le projet).

## Transformations MCD → MLD (déterministes)
- **Entité** → table (identifiant = clé primaire).
- **1:N** : FK migre vers l'extrémité `max = 1`, référence l'extrémité `max = N`.
- **N:N** : table associative (PK composite = toutes les colonnes FK, y compris pour des identifiants composés) + propriétés de l'association.
- **0,1 ↔ 1,1** : FK dans le côté `1,1`.
- **1,1 ↔ 1,1** : deux tables conservées, avec une FK `UNIQUE` déterministe dans la seconde (pas de fusion).
- **Identifiants alternatifs** : un identifiant simple devient une colonne `UNIQUE`, un identifiant composé devient une contrainte `UNIQUE` de table.
- **Réflexive** : FK autoréférentielle avec rôles.
- Les FK héritent du type des colonnes référencées ; `UNIQUE`, `NOT NULL` et les clés composées sont conservés dans le SQL PostgreSQL.
- Le SQL crée toutes les tables avant d'ajouter les contraintes FK par `ALTER TABLE`, afin de supporter l'ordre arbitraire et les cycles.
- Les noms physiques sont normalisés (snake_case, accents et caractères spéciaux neutralisés, mots réservés protégés, limite de 63 octets) ; E012 bloque les collisions.

## Comportement UI (courant)
- **Dock principal** intégré au canvas : modes MCD/UML/MLD, arborescence, ajout d’entité/association et Undo/Redo.
- **Dock d’état** en haut à droite : validation, panneau SQL latéral avec export intégré, thème clair/sombre.
- **Gestion des projets** : icône dossier, bibliothèque CRUD, projet actif et auto-save local.
- **Paramètres** : icône dédiée avec gestion des données locales et confirmation avant vidage du store.
- **Sélection** : entités et associations sélectionnables, surlignage visuel ; la sélection survit à l'édition.
- **Ajout/édition de propriété** : nom, cinq types conceptuels, identifiant, caractère obligatoire, unicité et description.
- **Associations** : création par le dock ou connexion entre entités ; cardinalités éditables sur les arêtes, y compris pour les associations réflexives.
- **Types conceptuels** toujours affichés à droite de chaque propriété dans le diagramme.
- **Undo/Redo** : raccourcis Ctrl/Cmd+Z · Shift+Z · Y ; historique non inondé pendant le drag.
- **Validation en temps réel** : panneau de problèmes ; le SQL est bloqué tant que le MCD contient une erreur. Les imports et le localStorage passent par une validation structurelle profonde et une migration versionnée.
- **Première arrivée** : si aucun projet n’est présent, la modal de création est obligatoire avant l’affichage du canvas.

## Conventions
- Noms de fichiers/commits en anglais, commentaires de code et UI en français.
- Commandes d'édition : fonctions pures `(Project) → Project` (undo/redo trivial).
- Tests obligatoires : lint (`pnpm lint`), typecheck (`pnpm typecheck`), tests (`pnpm test`), build (`pnpm build`).

## Commandes
```bash
pnpm dev           # http://localhost:5173
pnpm lint          # ESLint React/TypeScript
pnpm test          # 136 tests (Vitest)
pnpm typecheck     # tsc --noEmit
pnpm build         # dist/
pnpm preview       # prévisualiser le build
```

## Périmètre & hors MVP
Le MVP couvre le **noyau MERISE binaire** : entités, propriétés, identifiants simples/composés, associations porteuses de propriétés, cardinalités, réflexivité, validation, passage MLD et PostgreSQL.

Extensions repoussées en V2 : associations n-aires, CIF/CIM avancées, héritage, partition/exclusion, temporalité, MCT/MOT, normalisation 3FN formelle, autres dialectes SQL et import SQL/reverse engineering.
