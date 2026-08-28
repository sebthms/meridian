# Changelog

Toutes les modifications du projet **MERISE Diagrams** (modélisateur MCD → MLD → SQL).

## v0.1.0 — MVP (en cours)

### Édition inline dans le canevas (remplace l'inspector)
- **Rename associations** : unifié sur le hook `useRename` partagé ; la pastille entière est double-cliquable et `zoomOnDoubleClick` est désactivé sur le canevas (le double-clic sert à éditer, pas à zoomer).
- **shadcn/ui** : ajout des composants manquants `label`, `textarea`, `checkbox` (`@radix-ui/react-checkbox`), `radio-group` (`@radix-ui/react-radio-group`) ; le `AddPropertyModal` utilise désormais `Input`/`Label`/`Textarea`/`Checkbox`/`RadioGroup`/`Button`.
- **Suppression d'association** : icône corbeille en bout de ligne (space-between), masquée pendant le renommage, comme pour les entités.
- **Propriétés sur les associations** : bouton « + » ouvrant le même `AddPropertyModal` (cible `addPropertyTarget` générique entité/association). Nouvelles commandes `addAssociationAttribute` / `updateAssociationAttribute` ; les propriétés portées par une association (non table) sont listées dans la pastille.
- **Suppression de l'inspector** (`src/components/inspector/Inspector.tsx`) : l'édition se fait désormais directement dans les nœuds.
- **Entité** : double-clic sur le nom → renommage inline (✓/✕, icônes). Quand l'entité est sélectionnée, la ligne d'en-tête passe en `space-between` avec une icône « + » (ajout de propriété) et une icône corbeille (suppression) ; pendant le renommage, ces icônes disparaissent.
- **Association** : double-clic sur la pastille → renommage inline (✓/✕) ; le popover de cardinalité est rendu dans l'arête et suit le déplacement/zoom.
- **Ajout de propriété** : bouton « + » → `AddPropertyModal` (nom, nom logique dérivé en live, catégories de type exclusives Texte/Numérique/Date/Heure/Autre + sous-types, sous-options Texte conditionnelles, contraintes Identifiant/NOT NULL/UNIQUE/Complément, commentaire, OK désactivé si nom vide).
- Hook partagé `useRename` (`src/components/canvas/useRename.ts`) pour l'édition inline du nom.
- Store : état transitoire `addPropertyEntityId` + `openAddProperty` / `closeAddProperty`.
- `Attribute.unique` ajouté (optionnel) ; `NOT NULL` → `nullable:false`, `Complément` → `description`, `Identifiant` → `toggleIdentifierAttribute`.

### Initialisation du dépôt
- Scaffolding Vite + React + TypeScript + Tailwind CSS.
- Ajout de `@xyflow/react`, `Zustand`, `shadcn/ui` (structure), `vitest`.
- Configuration TypeScript (`@/*` → `src/`), Tailwind (thème shadcn clair/sombre).
- Déploiement GitHub Pages : workflow `.github/workflows/deploy.yml`, `base` configurable via `GITHUB_PAGES`.
- Fichiers racine : `.gitignore`, `.gitattributes`, `components.json`, `README.md`.

### Moteur métier MERISE (indépendant de React Flow)
- `src/domain/` : types `Entity`, `Attribute`, `Identifier`, `Association`, `Cardinality`, `Project` + factories et guards.
- `src/merise/` : validator + règles **E001→E010** et warnings **W001→W004** + système d'ignorance (par occurrence et par règle) + normalisation.
- `src/mld/` : générateur MCD → MLD (règles 1:N, N:N, 1:1, réflexive, identifiant composé, propriétés d'association) + formatage d'aperçu.
- `src/sql/` : générateur PostgreSQL (types conceptuels → SQL, `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`).

### Persistance & état
- `src/store/` : store Zustand (`project`, `issues`, `selectedElementId`, historique undo/redo, `apply`, ignore).
- `src/editor/` : commandes pures d'édition (immuables) : entité, attribut, identifiant, association, cardinalité, déplacement.
- `src/persistence/` : sauvegarde `localStorage` + import/export `.merise.json` et `.sql`.

### Interface
- Layout : canvas central, sidebar (entités/associations), inspector (droite), panneau bas (Problèmes / MLD / SQL).
- `src/components/canvas/` : nœuds personnalisés Entité et Association, arêtes avec cardinalités.
- `src/components/inspector/` : édition nom, propriétés, identifiants, cardinalités.
- `src/components/issues/` : panneau des problèmes avec navigation + boutons « ignorer ».
- `src/components/mld/` et `src/components/sql/` : aperçus avec copie / téléchargement.

### Tests
- 96 tests (Vitest) : domaine, règles de validation, générateur MLD, générateur SQL, commandes, store, persistance, fixtures.
- 8 fixtures de référence dans `fixtures/`.

---

## Corrections & améliorations UI

### Sélection des entités
- Sélection portée par le store (`selectedElementId`) et répercutée dans les nœuds (champ `selected`).
- Canvas refactoré avec `useNodesState` / `useEdgesState` → la sélection survit à l'édition.
- Retour visuel renforcé : bordure primaire épaissie, en-tête surligné, anneau + ombre portée.

### Gestion des événements
- La modification d'une propriété ne désélectionne plus la table.
- Déplacement commité uniquement à la fin du drag (`onNodeDragStop`) → une seule entrée d'historique.

### Ajout de propriétés
- Nouvelle commande `addAttributeWithName` + formulaire dédié : **input nom + select type + bouton « Ajouter »**, qui ajoute et **réinitialise les champs**.

### Undo / Redo
- Correction de l'inondation d'historique pendant le drag.
- Ajout des raccourcis clavier **Ctrl/Cmd+Z**, **Ctrl/Cmd+Shift+Z**, **Ctrl/Cmd+Y**.

### Interface
- **Topbar supprimée** et remplacée par un **dock intégré** au diagramme (panel React Flow) : + Entité, Supprimer, ↩/↪, Export .json / .sql.

### Associations par drag & drop
- Suppression du bouton « + Association ».
- **Drag & drop depuis les identifiants** : chaque identifiant 🔑 porte un point de connexion ; on tire vers une autre table.
- Popover de choix du **type à la volée** : `1:N`, `N:N`, `1:1`, `Réflexive` (auto-connexion).
- `connectionMode="loose"` + `isValidConnection` limitent les connexions aux entités.

### Affichage des types
- Les **types conceptuels** (`TEXT`, `INTEGER`, `DECIMAL`, `DATE`, `BOOLEAN`) sont affichés à droite de chaque propriété dans le diagramme.

---

## v0.1.1 — Refonte UI & nouvelles associations

### Style « table de schéma » (DatabaseSchemaNode)
- Nœud Entité réécrit au style **DatabaseSchemaNode** : en-tête séparé, lignes de propriétés, PK 🔑 ambre, types à droite.
- Handles source (haut) et cible (gauche) ; plus de handle par propriété.
- Clés étrangères (FK) dérivées du MLD affichées dans la table (réflexives vertes avec icône refresh).

### Nouvelles associations (bouton + connexion manuelle)
- **Bouton « Ajouter une association »** dans le dock (icône `Link2`) : crée une **pastille vide**.
- **Connexion manuelle** : on relie une entité à la pastille par glisser-déposer (`addAssociationParticipant`), dans un sens ou l'autre.
- Association **binaire** : une 3ᵉ connexion est ignorée ; relier deux fois la même entité = **réflexive** avec rôle.
- La pastille se transforme en **table associative** pour les N:N.
- `deriveAssociationType` robuste pour les associations incomplètes (0/1 participant).

### Vérifications d'unicité des noms
- **Entités** : nom auto-unique à la création (`ENTITY`, `ENTITY_2`…) ; `renameEntity` refuse un nom vide ou dupliqué.
- **Propriétés** : nom unique par défaut (`attribut`, `attribut_2`…) ; `addAttributeWithName` et `updateAttribute` refusent un doublon dans l'entité.
- **Feedback utilisateur** dans l'inspector : message d'erreur quand un nom est refusé.

### Modales (Problèmes / MLD / SQL)
- Panneau bas supprimé ; le contenu est désormais ouvert dans des **modales** (issues, MLD, SQL) depuis le dock.

### Tests
- 99 tests (Vitest) : commandes d'association (pastille vide, binaire, réflexive, cardinalités), unicité des noms.

---

## v0.1.2 — Refonte panneau de propriétés & dock

### Inspector flottant
- L'inspector (anciennement `<aside>` collé au bord droit) devient un **panneau flottant** : détaché des bords (`fixed` avec marge), `rounded-2xl`, ombre portée (`shadow-2xl`).
- **Animation de fade** à l'ouverture : transition d'opacité + légère translation (keyframe `inspector-in`, 0.18 s ease-out).
- Le panneau n'apparaît que lorsqu'un élément est sélectionné (`selectedElementId`), et disparaît sinon.

### Dock repositionné
- Le dock passe de `Panel position="top-left"` à **`position="bottom-center"`** (en bas au centre du canvas).
- Modales Problèmes / MLD / SQL inchangées.

### Suppression dans l'inspector
- **Bouton « Supprimer » retiré du dock**.
- Un bouton **« Supprimer l'entité »** / **« Supprimer l'association »** est ajouté dans le panneau de propriétés, visible quand l'élément est sélectionné.
- **Popover de confirmation Oui / Non** avant toute suppression : « Oui » applique `deleteEntity` (qui retire aussi les associations devenues orphelines) ou `deleteAssociation`, « Non » annule.
- Logique métier intacte (`deleteEntity`, `deleteAssociation` inchangés).

### Select shadcn/ui & libellés
- Installation de `@radix-ui/react-select` + `@radix-ui/react-icons` et création de `src/components/ui/select.tsx`.
- **Tous les `<select>` natifs remplacés** par le `Select` shadcn : type de propriété, type du formulaire d'ajout, cardinalité.
- Libellé **« Participants » → « Entités »** dans l'inspector (section association).

### Handles des entités
- Le handle source (haut) sert au **drag & drop** vers une association ; le handle cible (gauche) reçoit les arêtes mais reste **masqué** (présent mais invisible).

### Positions stables (fin de l'auto-layout)
- **`fitView` désactivé** : le viewport ne se recale plus automatiquement au chargement.
- Les **associations** ont désormais une **position stockée** (`Association.position`) : créées au point milieu de leurs entités, elles **ne se repositionnent plus automatiquement** quand on déplace une entité.
- Rétrocompatibilité : les anciens projets sont normalisés (`ensureAssociationPositions`) pour recevoir une position stable au chargement / à la première édition.

### Nommage des clés étrangères
- Une FK migrée dans une table est nommée **`id_<entité>`** (et `<role>_id_<entité>` en réflexive), indépendamment du nom de la PK → plus de collision entre une propriété `id` et une FK `id`.
- **Unicité des colonnes** : collision → suffixe `_2`, `_3`… (`dedupeColumns`).

### Associations : pas de panneau, édition par l'arête
- **Plus de panneau de propriétés pour les pastilles** (associations) : l'inspector ne s'affiche que pour une entité sélectionnée.
- Les cardinalités se règlent en **cliquant sur l'arête** : un popover affiche les **4 formes** (`0,1` · `1,1` · `0,N` · `1,N`), le choix applique la cardinalité à cette extrémité ; le type de l'association (1:N, N:N…) est dérivé des deux extrémités.