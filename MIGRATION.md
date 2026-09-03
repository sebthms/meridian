# Plan de migration — proposition à valider

Statut : **plan validé ; implémentation en cours sur `codex/architecture-refactor`**. Audit et architecture validés le 3 septembre 2026.

## Journal d'exécution

| Lot | Statut | Vérifications |
| --- | --- | --- |
| L0 | Terminé | Documentation approuvée et sauvegardée dans un commit distinct |
| L1 | Terminé | 270 tests verts, typecheck et build en mémoire réussis ; lint : 0 erreur, 11 warnings préexistants. Tests isolés bibliothèque/stockage ajoutés ; bugs D1-D3 explicitement caractérisés, non corrigés. |
| L2 | Terminé | 16 renommages, imports actualisés ; 270 tests, typecheck, build réussis, lint inchangé. Premier lancement vérifié dans le navigateur local. |
| L3 | Terminé | 23 déplacements génériques, alias shadcn actualisés ; 270 tests, typecheck/build réussis, lint inchangé. Diagramme rechargé au navigateur. Import externe du test palette corrigé avant validation. |
| L4 | Terminé | 45 déplacements ; 270 tests, typecheck, lint/build réussis. Templates régénérés sans différence. Le panneau validation est désormais un chunk distinct (3 116 octets ; 1 323 gzip), JS initial 696 411 octets. |
| L5-L8 | À exécuter | Plan détaillé ci-dessous |

Ce fichier est la liste de migration prévue, pas le compte rendu d'une migration déjà exécutée. À chaque lot livré, son statut, ses fichiers réellement modifiés et ses résultats de vérification seront renseignés ici. Tout écart significatif au plan sera signalé avant exécution.

## 1. Périmètre de validation

L'approbation de ce plan autoriserait les refactorings à comportement constant L1 à L8, avec leurs sous-lots compilables. Elle inclurait les exceptions documentaires/outillage au kebab-case décrites dans l'architecture.

Elle n'autoriserait pas implicitement :

- Une correction du comportement undo/redo, de sauvegarde ou des modales.
- Un nouveau message utilisateur, retry, stockage différé ou changement du format/clé des données.
- Un routeur, un backend, un nouveau gestionnaire d'état ou un dialecte SQL supplémentaire.
- La suppression des projets du navigateur ou la réinitialisation d'une bibliothèque.
- Un commit massif mélangeant renommages, logique métier, style et optimisations.

Les décisions fonctionnelles D1 à D4 ci-dessous sont séparées du plan de réorganisation. Aucun commit n'a été créé pour cette proposition.

## 2. Déroulement commun à chaque sous-lot

1. Annoncer la responsabilité déplacée/extraite, sa justification et les fichiers concernés.
2. Vérifier l'état Git et préserver les changements de l'utilisateur.
3. Ajouter les tests de caractérisation nécessaires, puis effectuer le changement minimal.
4. Mettre à jour tous les imports et références du lot dans la même étape ; ne pas livrer un renommage avec des consommateurs cassés.
5. Exécuter les contrôles pertinents et examiner le diff : absence de changements de données, signatures, classes CSS, textes UI ou règles métier non prévus.
6. Renseigner ici les résultats et le niveau de confiance : invariants testés, smoke test réalisé ou limite restante.
7. Former un lot réversible, avec un commit dédié si une sauvegarde Git est effectuée. Ne commencer le suivant qu'avec les contrôles verts.

Un retour arrière porte sur le lot concerné et conserve le travail antérieur. Pour un lot commité, privilégier un revert ciblé ; jamais de reset destructif du dépôt ni de restauration générale écrasant les modifications de l'utilisateur. Aucune donnée navigateur ne doit être migrée par un lot structurel.

### Vérifications communes G

- Tests complets : `pnpm test`.
- Typage : `pnpm exec tsc --noEmit --incremental false`, puis build normal quand la gestion de l'artefact incrémental a été traitée.
- Lint : `pnpm lint`, sans nouvelle erreur ; les 11 avertissements Fast Refresh de l'audit sont le point de comparaison initial, pas une cible permanente.
- Build de production : API Vite avec `write: false` ou build dans un répertoire de sortie contrôlé ; ne pas modifier un artefact suivi par inadvertance.
- Vérification des imports cassés, références à l'ancien chemin, casse Linux et cycles de valeurs.
- Smoke test des éléments d'interface touchés. Si aucun contrôle navigateur n'est possible, le signaler et ne pas prétendre que l'UX a été intégralement vérifiée.

Les commandes seront réexécutées lors de l'implémentation. Les résultats de l'audit ne valent pas résultat de tests après migration.

## 3. Lots incrémentaux

### L0 — Audit et proposition documentaire

**Statut :** audit validé ; cible/plan en attente.

- Livrables : `PAIN_POINTS.md`, `ARCHITECTURE.md`, `MIGRATION.md`.
- Risque : ambiguïté sur les corrections fonctionnelles et les exceptions de nommage ; elles sont explicitement séparées.
- Identité fonctionnelle à cette étape : aucun code, import, style ou donnée modifié.
- Passage à L1 : validation de la cible et du plan.

### L1 — Établir les protections de non-régression

**Prévu :** compléter les tests du store et du stockage avec un faux environnement isolé, contrôler les helpers partagés et faire accepter `*.test.tsx` à Vitest.

**Fichiers :** `src/store/project-store.test.ts`, nouveaux tests de `src/persistence/local-storage.ts`, `vite.config.ts`, helper déplacé vers `src/test-support/project-fixtures.ts`, imports des suites concernées.

**Sous-lots :** configuration/helper ; tests du stockage ; tests du store.

**Risques :** état global entre tests, imports initialisant le singleton, confusion entre comportement actuel et comportement souhaité. Contrôler localStorage et le cache de modules ; caractériser explicitement les bugs connus sans les présenter comme spécification cible. Ne pas ajouter une suite durablement rouge.

**Équivalence à vérifier :** aucun changement des modules de production ; G et nombre/assertions des scénarios existants conservés. Ajouter des projets de référence déterministes pour comparer les projections avant/après les lots suivants.

### L2 — Renommer les 16 fichiers PascalCase sur place

**Prévu :** seulement les noms des fichiers et leurs imports. Les destinations finales de la section 4 seront atteintes lors de L4.

**Fichiers :** `src/app/App.tsx` et les 15 fichiers PascalCase de `src/components/canvas/`.

**Sous-lots :** racine App ; nœuds/arêtes ; contrôles ; modales/canvas. Chaque sous-lot met à jour ses consommateurs et tests.

**Risques :** renommage de casse seule sous Windows, imports JSX oubliés, références dans les documents. Pour `App.tsx -> app.tsx` et `Canvas.tsx -> canvas.tsx`, utiliser si nécessaire un nom intermédiaire contrôlé ; vérifier ensuite l'index Git et la casse réelle des chemins. Ne pas changer les symboles `App` ou `Canvas`.

**Équivalence à vérifier :** contenu des composants inchangé hors imports ; G et smoke test de lancement. Pas de formatage global.

### L3 — Isoler les briques génériques

**Prévu :** déplacer primitives UI, modal/confirmation/enveloppe de panneau, styles de layout partagés, utilitaires et thème vers `shared`.

**Fichiers :** lignes L3 de la section 4 ; imports de leurs consommateurs ; `components.json` ; import de thème dans `src/main.tsx`.

**Sous-lots :** utilitaires/mobile ; primitives UI ; wrappers/layout ; thème/palettes. Les fichiers déjà déplacés sont consommables depuis l'ancienne UI pendant la transition.

**Risques :** import CSS ou thème rompu, changement de démarrage du thème, nouvelles primitives générées à l'ancien emplacement. Garder `src/index.css`, `src/styles/palettes.css`, les clés de thème et les générateurs de palette à leur emplacement/comportement actuel.

**Alias shadcn proposés :** `components -> @/shared/components`, `ui -> @/shared/ui`, `utils -> @/shared/utils/cn`, `hooks -> @/shared/hooks`, `lib -> @/shared`. L'alias TypeScript/Vite `@/* -> src/*` ne change pas.

**Équivalence à vérifier :** G, tests palettes/tooltips et smoke test thème, popovers, modales, panneau mobile. Aucun remplacement de la modale custom par Radix dans ce lot.

### L4 — Organiser les fonctionnalités et la composition

**Prévu :** déplacer l'UI métier vers cinq features ; placer l'hôte du canvas, la sidebar et le choix des panneaux dans `app/workspace`. Déplacer l'adaptateur graphique vers la feature diagramme sans changer ses transformations.

**Fichiers :** lignes L4 de la section 4, imports de `src/app/app.tsx`, `scripts/build-templates.mjs`, consommateurs et tests des templates ; retrait du barrel `src/components/panel/index.ts` quand il n'a plus de consommateur.

**Sous-lots :** panneaux indépendants/projets/templates ; composants/adaptateur du diagramme ; composition workspace et retrait du barrel. Les imports provisoires vers les anciens chemins sont tolérés entre sous-lots tant qu'ils résolvent ; aucune façade artificielle ne doit créer de cycle.

**Risques :** dépendance d'une feature vers `app`, chargement dynamique redevenant statique, données générées au mauvais endroit. Le retrait du barrel peut rendre le lazy loading existant réellement effectif : vérifier sa première ouverture et conserver le fallback existant. Le catalogue doit rester accessible au premier lancement.

**Équivalence à vérifier :** G, données JSON des templates identiques et test de génération/validation ; vues MCD/UML/MLD, ouverture/fermeture de chaque panneau et création depuis template identiques. Aucun nouveau routage ni prop publique modifiée.

### L5 — Clarifier les responsabilités métier/présentation

**Prévu :** sortir les deux helpers de présentation/formulaire du domaine ; extraire progressivement la logique des formulaires et les deux projections graphiques ; typer les marqueurs sans `any`.

**Fichiers :** lignes L5 de la section 4 ; `src/domain/index.ts` ; adaptateur et modales déplacés ; tests SQL/tooltip dont quelques assertions changent de dossier ; nouveaux fichiers listés en section 5.

**Sous-lots :** helpers et tests colocalisés ; types/projections graphiques ; assemblage de formulaire ; hooks d'orchestration si utiles. Préserver le point d'entrée `project-adapter.ts` et les fonctions de commande existantes.

**Risques :** réintroduction du cycle par un barrel de compatibilité, altération de la conversion de type lors d'une édition de libellé, état React réinitialisé différemment, objets/IDs graphiques modifiés.

**Équivalence à vérifier :** G, mêmes nœuds/arêtes à callbacks normalisés, MLD/SQL inchangés sur fixtures, tests de patch de propriété et détails d'arbre ; smoke test de saisie/annulation/enregistrement et cardinalités. Le cycle connu doit disparaître. Les erreurs de validation et noms physiques ne sont pas retouchés.

### L6 — Rendre l'orchestration du store testable

**Prévu :** conserver la façade et le singleton `useProjectStore`, extraire une fabrique avec dépendances contrôlables et les transitions effectivement partagées. Découper les commandes métier par responsabilité uniquement si leurs tests le permettent.

**Fichiers :** `src/store/project-store.ts`, ses tests et modules internes nouveaux ; `src/persistence/local-storage.ts` si un adaptateur est nécessaire ; `src/editor/commands.ts` et extractions associées.

**Sous-lots :** fabrique testable sans changement de valeurs par défaut ; transitions une à une ; commandes groupées avec façade conservée.

**Risques :** modification du moment du chargement/migration, de la forme du store, de l'historique ou du comportement des anciennes clés. Les décisions D1/D2 ne sont pas implicitement prises par la création d'une fabrique. Si une extraction ne peut préserver le contrat actuel sans choix produit, arrêter ce sous-lot et demander ce choix.

**Équivalence à vérifier :** G et matrice de transition de L1, mêmes lectures/écritures observées pour le refactoring pur, même sélection/vue/historique et mêmes règles ignorées ; aucun état React dupliqué par feature. Les corrections approuvées séparément disposent de leurs propres tests et diffs.

### L7 — Optimiser sur mesures comparables

**Prévu :** mesurer les chunks après L4 ; limiter les calculs MLD répétés et les abonnements globaux des nœuds lorsque le profil montre leur coût.

**Fichiers :** `app/workspace/panel-content.tsx`, adaptateur/hooks du diagramme, nœuds, sélecteurs du store, panneaux de validation/SQL. Chargement des templates seulement si son gain justifie la contrepartie UX.

**Sous-lots :** chargement de panneau ; cache de projection limité ; abonnements ciblés. Une optimisation par sous-lot.

**Risques :** résultat dérivé périmé, callback utilisant un ancien projet, sélection ou état d'édition perdu, nouveau délai visible. Ne pas ajouter de debounce, worker, virtualisation ou stockage secondaire du MLD sans besoin mesuré.

**Équivalence à vérifier :** G ; comparaison JS initial/total/gzip et première ouverture des panneaux ; comparaison des rendus/calculs sur les mêmes fixtures et interactions. Aucune accélération n'est déclarée sans mesure ; aucun changement de SQL ou de sauvegarde accepté dans ce lot.

### L8 — Renforcer les garde-fous et clôturer

**Prévu :** activer progressivement les règles de hooks utiles, ajouter le contrôle lint/PR en CI, vérifier les dépendances candidates au nettoyage et harmoniser le style des fichiers concernés. Actualiser la documentation selon la structure réellement livrée.

**Fichiers :** `eslint.config.js`, `.github/workflows/deploy.yml`, éventuellement `package.json`/`pnpm-lock.yaml` après preuve d'inutilité, `.gitignore`, `tsconfig.tsbuildinfo`, `README.md`, `CONTEXT.md`, `ARCHITECTURE.md`, `MIGRATION.md`.

**Sous-lots :** règles/hooks ; CI ; nettoyage de dépôt/dépendances ; documentation. Les problèmes de hooks sont analysés et testés, pas corrigés automatiquement en ajoutant/supprimant des dépendances d'effet.

**Risques :** nouvelle règle révélant un comportement ambigu, package encore utilisé indirectement, diff de formatage masquant la logique. Le retrait du suivi de `tsconfig.tsbuildinfo` se traite comme un nettoyage de l'artefact généré, pas une suppression de données métier ; il reste régénérable.

**Équivalence à vérifier :** G puis `pnpm build` complet, smoke test de tous les parcours concernés, vérification de casse Linux, reproduction de la génération des templates/palettes et revue finale du diff. Chaque pain point restant reçoit un statut honnête : résolu, reporté, décision requise ou non mesuré.

## 4. Fichiers renommés/déplacés — liste prévisionnelle complète

72 déplacements unitaires sont proposés ci-dessous. Les chemins de gauche sont ceux du dépôt audité ; les chemins de droite sont les destinations finales. Pour les lignes L2 + L4, L2 applique d'abord le basename kebab-case dans le dossier existant, puis L4 déplace le fichier déjà renommé.

| Ancien chemin | Nouveau chemin proposé | Lot |
| --- | --- | --- |
| `src/app/App.tsx` | `src/app/app.tsx` | L2 |
| `src/components/canvas/Canvas.tsx` | `src/app/workspace/canvas.tsx` | L2 + L4 |
| `src/components/canvas/DiagramSidebar.tsx` | `src/app/workspace/diagram-sidebar.tsx` | L2 + L4 |
| `src/components/panel/content.tsx` | `src/app/workspace/panel-content.tsx` | L4 |
| `src/components/panel/view.ts` | `src/app/workspace/panel-view.ts` | L4 |
| `src/components/canvas/AddPropertyModal.tsx` | `src/features/diagram/components/add-property-modal.tsx` | L2 + L4 |
| `src/components/canvas/AssociationEdge.tsx` | `src/features/diagram/components/association-edge.tsx` | L2 + L4 |
| `src/components/canvas/AssociationNode.tsx` | `src/features/diagram/components/association-node.tsx` | L2 + L4 |
| `src/components/canvas/BusinessRuleNode.tsx` | `src/features/diagram/components/business-rule-node.tsx` | L2 + L4 |
| `src/components/canvas/CanvasControls.tsx` | `src/features/diagram/components/canvas-controls.tsx` | L2 + L4 |
| `src/components/canvas/CardinalityPopover.tsx` | `src/features/diagram/components/cardinality-popover.tsx` | L2 + L4 |
| `src/components/canvas/CifNode.tsx` | `src/features/diagram/components/cif-node.tsx` | L2 + L4 |
| `src/components/canvas/ConceptualEdge.tsx` | `src/features/diagram/components/conceptual-edge.tsx` | L2 + L4 |
| `src/components/canvas/ConceptualEditModal.tsx` | `src/features/diagram/components/conceptual-edit-modal.tsx` | L2 + L4 |
| `src/components/canvas/ConstraintNode.tsx` | `src/features/diagram/components/constraint-node.tsx` | L2 + L4 |
| `src/components/canvas/EntityNode.tsx` | `src/features/diagram/components/entity-node.tsx` | L2 + L4 |
| `src/components/canvas/InheritanceNode.tsx` | `src/features/diagram/components/inheritance-node.tsx` | L2 + L4 |
| `src/components/canvas/PropertyRow.tsx` | `src/features/diagram/components/property-row.tsx` | L2 + L4 |
| `src/components/canvas/conceptual-node-shell.tsx` | `src/features/diagram/components/conceptual-node-shell.tsx` | L4 |
| `src/components/canvas/conceptual-node-toolbar.tsx` | `src/features/diagram/components/conceptual-node-toolbar.tsx` | L4 |
| `src/components/canvas/property-constraint-icons.tsx` | `src/features/diagram/components/property-constraint-icons.tsx` | L4 |
| `src/components/canvas/flow/base-node.tsx` | `src/features/diagram/components/flow/base-node.tsx` | L4 |
| `src/components/canvas/flow/database-schema-node.tsx` | `src/features/diagram/components/flow/database-schema-node.tsx` | L4 |
| `src/components/canvas/icons/type-icon.tsx` | `src/features/diagram/components/icons/type-icon.tsx` | L4 |
| `src/components/canvas/nodes/association-handles.tsx` | `src/features/diagram/components/nodes/association-handles.tsx` | L4 |
| `src/components/canvas/nodes/conceptual-handles.tsx` | `src/features/diagram/components/nodes/conceptual-handles.tsx` | L4 |
| `src/components/canvas/nodes/entity-handles.tsx` | `src/features/diagram/components/nodes/entity-handles.tsx` | L4 |
| `src/components/canvas/nodes/node-delete-confirm.tsx` | `src/features/diagram/components/nodes/node-delete-confirm.tsx` | L4 |
| `src/components/canvas/nodes/node-handles.ts` | `src/features/diagram/components/nodes/node-handles.ts` | L4 |
| `src/components/canvas/nodes/node-header-toolbar.tsx` | `src/features/diagram/components/nodes/node-header-toolbar.tsx` | L4 |
| `src/components/canvas/nodes/node-rename-field.tsx` | `src/features/diagram/components/nodes/node-rename-field.tsx` | L4 |
| `src/components/panel/project-tree.tsx` | `src/features/diagram/components/project-tree-panel.tsx` | L4 |
| `src/components/panel/tree-property.tsx` | `src/features/diagram/components/tree-property.tsx` | L4 |
| `src/editor/nodes/adapter.ts` | `src/features/diagram/flow/project-adapter.ts` | L4 |
| `src/editor/nodes/adapter.test.ts` | `src/features/diagram/flow/project-adapter.test.ts` | L4 |
| `src/editor/nodes/conceptual-adapter.test.ts` | `src/features/diagram/flow/conceptual-adapter.test.ts` | L4 |
| `src/hooks/use-rename.ts` | `src/features/diagram/hooks/use-rename.ts` | L4 |
| `src/domain/property-type-defaults.ts` | `src/features/diagram/model/property-type-defaults.ts` | L5 |
| `src/domain/tree-property.ts` | `src/features/diagram/presentation/tree-property-details.ts` | L5 |
| `src/components/panel/project-manager.tsx` | `src/features/project-library/components/project-manager-panel.tsx` | L4 |
| `src/templates/catalog.json` | `src/features/project-library/templates/catalog.json` | L4 |
| `src/templates/projects.json` | `src/features/project-library/templates/projects.json` | L4 |
| `src/templates/templates.test.ts` | `src/features/project-library/templates/templates.test.ts` | L4 |
| `src/components/panel/issues.tsx` | `src/features/validation/components/issues-panel.tsx` | L4 |
| `src/components/panel/sql.tsx` | `src/features/sql-export/components/sql-panel.tsx` | L4 |
| `src/components/panel/settings.tsx` | `src/features/settings/components/settings-panel.tsx` | L4 |
| `src/components/panel/palette-select.tsx` | `src/features/settings/components/palette-select.tsx` | L4 |
| `src/components/shared/clear-projects-button.tsx` | `src/features/settings/components/clear-projects-button.tsx` | L4 |
| `src/components/shared/modal.tsx` | `src/shared/components/modal.tsx` | L3 |
| `src/components/shared/confirm-popover.tsx` | `src/shared/components/confirm-popover.tsx` | L3 |
| `src/components/panel/shell.tsx` | `src/shared/components/panel-shell.tsx` | L3 |
| `src/components/panel/layout.ts` | `src/shared/layout/panel-layout.ts` | L3 |
| `src/components/ui/button.tsx` | `src/shared/ui/button.tsx` | L3 |
| `src/components/ui/checkbox.tsx` | `src/shared/ui/checkbox.tsx` | L3 |
| `src/components/ui/input.tsx` | `src/shared/ui/input.tsx` | L3 |
| `src/components/ui/label.tsx` | `src/shared/ui/label.tsx` | L3 |
| `src/components/ui/popover.tsx` | `src/shared/ui/popover.tsx` | L3 |
| `src/components/ui/separator.tsx` | `src/shared/ui/separator.tsx` | L3 |
| `src/components/ui/sheet.tsx` | `src/shared/ui/sheet.tsx` | L3 |
| `src/components/ui/sidebar.tsx` | `src/shared/ui/sidebar.tsx` | L3 |
| `src/components/ui/skeleton.tsx` | `src/shared/ui/skeleton.tsx` | L3 |
| `src/components/ui/table.tsx` | `src/shared/ui/table.tsx` | L3 |
| `src/components/ui/textarea.tsx` | `src/shared/ui/textarea.tsx` | L3 |
| `src/components/ui/tooltip.tsx` | `src/shared/ui/tooltip.tsx` | L3 |
| `src/components/ui/tooltip.test.ts` | `src/shared/ui/tooltip.test.ts` | L3 |
| `src/hooks/use-mobile.tsx` | `src/shared/hooks/use-mobile.tsx` | L3 |
| `src/hooks/use-theme.ts` | `src/shared/theme/use-theme.ts` | L3 |
| `src/lib/theme.ts` | `src/shared/theme/theme.ts` | L3 |
| `src/lib/palettes.ts` | `src/shared/theme/palettes.ts` | L3 |
| `src/lib/palettes.test.ts` | `src/shared/theme/palettes.test.ts` | L3 |
| `src/lib/utils.ts` | `src/shared/utils/cn.ts` | L3 |
| `src/merise/rules/__tests__/helpers.ts` | `src/test-support/project-fixtures.ts` | L1 |

### Fichiers retirés ou partiellement redistribués

| Fichier actuel | Action prévue | Protection |
| --- | --- | --- |
| `src/components/panel/index.ts` | Retrait après remplacement de tous ses imports par des imports directs | Préserver noms/props des composants ; vérifier le lazy loading |
| `src/components/ui/tooltip.test.ts` | Déplacement L3 puis extraction du cas `PropertyRow` dans son propre test de feature en L5 | Conserver toutes les assertions |
| `src/sql/advanced-types.test.ts` | Reste en place ; seul le scénario de valeurs initiales de formulaire rejoint le test colocalisé en L5 | Conserver les régressions SQL et de formulaire |
| `src/domain/index.ts` | Reste en place ; retirer les exports des helpers déplacés en L5 | Tous les consommateurs internes mis à jour, pas de dépendance domain -> feature |
| `tsconfig.tsbuildinfo` | Sortie du suivi Git proposée en L8 ; ajouter le motif à `.gitignore` | Artefact régénérable ; aucune donnée utilisateur concernée |

Les autres fichiers de `domain/`, `editor/` hors adaptateur, `merise/` hors helper, `mld/`, `sql/`, `persistence/` et `store/` restent à leur emplacement, même si certains imports ou contenus seront ajustés dans des lots explicitement décrits.

Restent également à leur emplacement : `src/main.tsx`, `src/index.css`, `src/styles/palettes.css`, `src/vite-env.d.ts`, les huit fixtures, les scripts de palette, les configurations racines et les documents existants. Ils ne constituent pas une nouvelle liste de renommages.

## 5. Extractions nouvelles envisagées

Ce tableau ne décrit pas des fichiers déjà créés. Ces extractions n'ont lieu que si les tests montrent une responsabilité suffisamment stable ; pas de fichier vide pour remplir l'arborescence.

| Responsabilité extraite | Emplacement proposé | Lot |
| --- | --- | --- |
| Valeurs initiales de propriété : test colocalisé | `src/features/diagram/model/property-type-defaults.test.ts` | L5 |
| Assemblage/validation du changement de propriété | `src/features/diagram/model/property-form.ts` et `property-form.test.ts` | L5 |
| Assemblage des changements conceptuels | `src/features/diagram/model/conceptual-form.ts` et `conceptual-form.test.ts` | L5 |
| État/orchestration du formulaire de propriété, si utile | `src/features/diagram/hooks/use-property-form.ts` | L5 |
| Test des détails de propriété | `src/features/diagram/presentation/tree-property-details.test.ts` | L5 |
| Test du composant propriété | `src/features/diagram/components/property-row.test.tsx` | L5 |
| Types des nœuds/arêtes | `src/features/diagram/flow/node-types.ts`, `edge-types.ts` | L5 |
| Projections graphiques | `src/features/diagram/flow/project-to-nodes.ts`, `project-to-edges.ts` et tests voisins | L5 |
| Fabrique du store testable | `src/store/create-project-store.ts` et `create-project-store.test.ts` | L6 |
| Transitions de projet réutilisables | `src/store/project-transitions.ts` et `project-transitions.test.ts` | L6 |
| Commandes spécialisées, façade conservée | `src/editor/commands/entity-commands.ts`, `association-commands.ts`, `property-commands.ts`, `identifier-commands.ts` et tests voisins | L6 |
| Sélecteurs/calculs partagés mesurés | `src/store/project-selectors.ts` et `project-selectors.test.ts` | L7 |

Les nouvelles fonctions n'élargissent pas les fonctionnalités publiques. Les tests des façades restent utiles pendant l'extraction ; ne pas enlever une régression simplement parce qu'une fonction a changé de fichier.

## 6. Modifications de références hors déplacements

- `src/main.tsx` : chemin du composant App et du thème, ordre d'initialisation préservé.
- `components.json` : alias shadcn mis à jour avec L3 ; CSS Tailwind inchangée.
- `vite.config.ts` : inclusion des tests TSX avec L1 ; alias `@` et base relative de production préservés.
- `tsconfig.json` : alias actuel conservé ; aucune détente de `strict`.
- `scripts/build-templates.mjs` : destination et commentaire adaptés avec L4 ; IDs, positions et données générées inchangés.
- Tests : imports de helper, adaptateur, thème et composants mis à jour ; fixtures identiques.
- Documentation technique courante : chemins réels mis à jour à mesure des lots ; conserver `PAIN_POINTS.md` comme photographie datée de l'avant-refactoring.
- `package.json`/`pnpm-lock.yaml` : aucune nouvelle bibliothèque ou montée de version exigée par les déplacements. Toute dépendance de test additionnelle sera motivée avant installation.

## 7. Décisions fonctionnelles distinctes — non incluses implicitement

| Décision | Sujet | Proposition à discuter séparément |
| --- | --- | --- |
| D1 | PP-01, undo/redo et bibliothèque | Mettre à jour projet actif, bibliothèque et persistance de façon cohérente ; tester rechargement et changement de projet |
| D2 | PP-02, erreurs de stockage | Définir un état d'échec exploitable et le retour utilisateur attendu ; définir récupération/quota sans perte de données |
| D3 | PP-04, cibles de modales | Choisir explicitement fermeture ou autre politique lors d'un changement/création/chargement/suppression de projet |
| D4 | PP-15, UX et politique de validation | Décider des raccourcis annoncés, du focus/Échap des modales et de l'ignorance des erreurs bloquantes |

Chaque décision acceptée donnera lieu à un lot de correction dédié, avec test reproduisant le problème et spécification du comportement corrigé. L'ordre pourra être ajusté pour protéger la migration du store, sans intégrer ces corrections à un commit de déplacement.

## 8. État actuel et prochaine autorisation

- Audit : validé.
- `ARCHITECTURE.md` : proposition créée, non implémentée.
- `MIGRATION.md` : plan et correspondances proposés, aucun mouvement exécuté.
- Code, tests, styles, dépendances et configuration : inchangés pendant cette étape.
- Résultats de tests/build : ceux de l'audit ; pas de nouvelle exécution inutile pour ces seuls ajouts Markdown.

**Prochaine étape : validation de la cible hybride, des exceptions de nommage et des lots L1 à L8 avant modification de l'architecture.**
