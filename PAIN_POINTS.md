# Audit initial — MERISE Diagrams

Date : 3 septembre 2026. Référence auditée : `5ff32a7e0f6ce916744f6f895b7b1b75c41d1d88` (`main`).

## 1. Périmètre et statut

Ce document couvre uniquement l'audit initial demandé avant refactoring. Aucun fichier applicatif, test, dépendance, configuration ou contrat public n'a été modifié. Aucune architecture cible ni migration de dossiers n'est proposée à ce stade. Le seul livrable ajouté est ce rapport, nommé `PAIN_POINTS.md` conformément à la demande explicite.

Les corrections de bugs et les évolutions d'UX devront être distinguées des refactorings à comportement constant. Les constats ci-dessous ne valent pas autorisation de les implémenter.

Méthode : lecture du code et des imports, inventaire des fichiers, exécution des tests et du lint, vérification TypeScript, build Vite sans écriture du résultat, scénarios du store exécutés avec un faux `localStorage` en mémoire. Aucun projet du navigateur n'a été ouvert ou modifié.

Limites : pas de parcours navigateur, de profil React, de mesure sur appareil mobile, de benchmark gros diagramme, ni d'exécution du SQL dans PostgreSQL. Les défauts internes reproduits sont identifiés comme tels ; une hypothèse de lenteur n'est pas présentée comme une mesure. Le relevé des cycles par lecture des imports n'est pas un inventaire automatisé exhaustif.

## 2. Cartographie actuelle

Application mono-écran, sans routeur ni backend applicatif identifié. Stack déclarée : React 19, TypeScript strict, Vite 8, Zustand 5, React Flow 12, Tailwind 3, composants Radix/shadcn et Vitest 4. Le dépôt contient 144 fichiers sous `src/`, dont 25 fichiers de tests.

| Zone actuelle | Fichiers | Responsabilité et points d'entrée |
| --- | ---: | --- |
| `src/main.tsx`, `src/app/` | 2 | Initialisation du thème, montage React, choix du panneau actif et écran de création initiale |
| `src/components/` | 56 | Canvas, nœuds, modales, panneaux, composants partagés et primitives UI |
| `src/domain/` | 18 | `Project`, entités, propriétés, identifiants, associations, héritage, contraintes, CIF et règles métier |
| `src/editor/` | 11 | Commandes de modification, connexions et projections vers les nœuds/arêtes React Flow |
| `src/store/` | 2 | Store global Zustand, historique, bibliothèque, validation et état transitoire de l'éditeur |
| `src/merise/` | 22 | Validation structurelle, sémantique et de la projection SQL |
| `src/mld/` | 7 | Construction du modèle relationnel et formatage |
| `src/sql/` | 8 | Types physiques, nommage et génération PostgreSQL |
| `src/persistence/` | 5 | Parsing/migration JSON, export et stockage local |
| `src/templates/` | 3 | Catalogue, données générées et test de validité métier |
| `src/hooks/`, `src/lib/` | 7 | Thème, renommage, détection mobile, palettes et utilitaires |
| Styles et déclaration Vite | 3 | `src/index.css`, `src/styles/palettes.css`, `src/vite-env.d.ts` |

Compléments : `fixtures/` fournit huit modèles de test ; `scripts/` génère templates et palettes ; `docs/` contient une note sur les types/tooltips ; `.github/workflows/deploy.yml` construit puis déploie sur GitHub Pages.

### Flux réellement observé

1. `src/main.tsx` initialise le thème et monte `App`.
2. Le chargement du module du store lit la bibliothèque locale et peut migrer un ancien projet.
3. L'UI invoque les commandes d'édition, puis `apply(nextProject)`.
4. `apply` normalise, sauvegarde la bibliothèque, revalide et ajoute l'ancien projet à l'historique.
5. Le canvas reconstruit ses nœuds/arêtes via l'adaptateur ; le panneau SQL calcule MLD puis DDL.

Le modèle métier est bien distinct de React Flow. En revanche, le graphe réel n'est pas une simple chaîne indépendante `domain → validation → MLD → SQL` : certaines règles appellent le MLD, le MLD utilise le convertisseur SQL, et une fonction de présentation exportée par `domain` dépend de SQL.

### Acquis à préserver

- Typage strict, commandes séparées des composants et nombreuses fonctions testables sans DOM.
- Tests des cas binaires, réflexifs, clés composées, identifiants alternatifs, types avancés et concepts Merise.
- Parsing des fichiers à partir de `unknown`, avec vérification des structures, références et versions.
- Identifiants stables des problèmes de validation et persistance des règles ignorées.
- Projection documentaire explicite des concepts avancés : pas de DDL inventé pour l'héritage ou les CIF.
- Composants de nœuds déjà partiellement composés : handles, renommage, outils et confirmations partagés.
- Pas de preuve d'un prop drilling excessif nécessitant un nouveau contexte global. Les quelques props de panneau/thème restent explicites et bornées.

## 3. État de référence vérifié

| Contrôle | Résultat |
| --- | --- |
| `pnpm test` | 25 fichiers, 250 tests réussis |
| `pnpm lint` | 0 erreur, 11 avertissements `react-refresh/only-export-components` |
| `pnpm exec tsc --noEmit --incremental false` | Réussi, sans mise à jour du fichier incrémental suivi par Git |
| API Vite `build({ build: { write: false } })` | Build réussi en mémoire ; avertissement `INEFFECTIVE_DYNAMIC_IMPORT` |
| JavaScript produit | Un seul fichier : 699 438 octets, 206 501 octets gzip |
| CSS produit | 64 312 octets, 11 402 octets gzip |
| Scénarios du store isolés | Divergence après undo, cible de modale persistante et échec de sauvegarde masqué reproduits |

Les tailles gzip sont calculées sur les sorties du build avec `node:zlib`, pas mesurées sur le réseau. Elles ne donnent ni le temps de démarrage réel ni le gain possible d'une optimisation. Le build n'a pas réécrit `dist/` ; la commande composite `pnpm build` n'a pas été exécutée afin de préserver `tsconfig.tsbuildinfo`, actuellement versionné.

## 4. Priorités

« Bloquant » désigne ici un risque de perte de travail à traiter explicitement avant une migration du state/persistence, et non une impossibilité de démarrer l'application actuelle.

| ID | Priorité | Sujet | Niveau de preuve |
| --- | --- | --- | --- |
| PP-01 | Bloquant | Historique désynchronisé de la bibliothèque persistée | Reproduit en mémoire |
| PP-02 | Bloquant | Échec d'écriture masqué et statut de sauvegarde incorrect | Reproduit en mémoire |
| PP-03 | Important | Store multi-responsabilités et initialisation à l'import | Lecture du code |
| PP-04 | Important | État des modales non remis à zéro au changement de projet | État interne reproduit |
| PP-05 | Important | Cycle `domain`/SQL et frontière métier/présentation perméable | Imports vérifiés |
| PP-06 | Important | Responsabilités concentrées et logique de formulaire dans l'UI | Lecture du code |
| PP-07 | Important | Contournements du typage React Flow | Cinq `as any` relevés |
| PP-08 | Important | Recalculs et abonnements trop larges | Mécanisme vérifié, coût non mesuré |
| PP-09 | Important | Lazy loading neutralisé et bundle initial monolithique | Build mesuré |
| PP-10 | Important | Sérialisation synchrone et absence de budget gros volumes | Mécanisme vérifié, seuil inconnu |
| PP-11 | Important | Tests incomplets autour des frontières les plus risquées | Suite/configuration inspectées |
| PP-12 | Important | Garde-fous ESLint/CI incomplets | Configuration inspectée |
| PP-13 | Cosmétique | Nommage des fichiers et conventions hétérogènes | Inventaire |
| PP-14 | Cosmétique | Petites duplications et génération d'identifiants implicite | Lecture du code |
| PP-15 | Important | Contrats UX/accessibilité à clarifier avant extraction | Lecture du code, navigateur non testé |
| PP-16 | Cosmétique | Artefact de compilation suivi et dépendances à inventorier | Git/imports inspectés |

## 5. Rapport détaillé

### PP-01 — Undo/redo ne met pas à jour la bibliothèque

**Où :** `src/store/project-store.ts:127` et `:144`, `src/persistence/local-storage.ts:5`.

`apply` met à jour `project`, l'entrée correspondante dans `projects`, puis la clé `merise:projects`. `undo` et `redo` restaurent seulement `project` et écrivent via `saveProjectToStorage`, dans l'ancienne clé `merise:project:last-opened`. La bibliothèque reste à la version précédente.

Reproduction isolée : créer A et B ; ouvrir A ; ajouter une entité ; annuler ; ouvrir B puis A.

| Moment | Projet actif | Entrée A de la bibliothèque | Entrée A en stockage |
| --- | ---: | ---: | ---: |
| Après annulation | 0 entité | 1 entité | 1 entité |
| Après réouverture de A | 1 entité | 1 entité | 1 entité |

**Impact :** perte de l'annulation au changement de projet ; au rechargement, le bootstrap privilégie également la bibliothèque périmée. La coexistence des deux clés fragilise aussi la migration depuis l'ancien stockage.

**Protection attendue avant correction :** scénarios undo et redo, changement de projet, rechargement avec stockage simulé, suppression du dernier projet et migration de l'ancienne clé. La correction devra être approuvée comme changement fonctionnel distinct du déplacement de fichiers.

### PP-02 — Les erreurs de persistance sont invisibles

**Où :** `src/persistence/local-storage.ts:25`, `:36`, `:54`, `:62` ; `src/store/project-store.ts:98` et `:188`.

Les opérations de stockage interceptent les exceptions sans retourner d'état d'échec. Le store passe ensuite à `saveStatus: 'saved'`. Le chargement peut aussi éliminer silencieusement les entrées non parsables.

Reproduction : faire lever une exception à `localStorage.setItem`, puis créer un projet. Le projet actif change, les données persistées restent inchangées et le statut interne est `saved`. Il ne s'agit pas d'un constat sur un badge UI : aucun consommateur de `saveStatus` n'a été identifié dans les composants.

**Impact :** travail non sauvegardé sans retour exploitable ; risque de disparition après fermeture. Impossible de distinguer une bibliothèque vide d'un problème de lecture ou d'une entrée corrompue.

**Protection attendue :** tests quota/refus d'accès/JSON corrompu/échec de suppression ; décision explicite sur le retour d'erreur, la récupération et l'information utilisateur. Le fallback silencieux d'un thème n'a pas la même gravité que celui des projets : éviter un traitement uniforme de tous les `catch`.

### PP-03 — Le store cumule les politiques et dépend de l'environnement à l'import

**Où :** `src/store/project-store.ts`, notamment `:64` à `:84`.

Ce module de 284 lignes gère bibliothèque, sauvegarde, migration, historique, validation, règles ignorées, sélection, mode de vue et cibles de modales. Les transitions reconstruisent plusieurs fois les mêmes groupes de champs, sans point unique garantissant leur cohérence.

La lecture du stockage et une éventuelle écriture de migration ont lieu dès l'import. Le temps et les identifiants sont fournis par `Date`/`Math.random`, et le store est un singleton.

**Impact :** tests dépendants de l'ordre et de l'environnement ; extraction ou chargement différé susceptibles de déplacer les effets de bord ; une évolution d'une transition peut oublier un champ, comme dans PP-01 et PP-04.

**Protection attendue :** contrats des transitions et de l'initialisation, tests avec stockage/horloge contrôlés. Ne pas remplacer Zustand ni changer le format persistant pour satisfaire un principe abstrait.

### PP-04 — Les cibles de modales survivent au changement de projet

**Où :** `src/store/project-store.ts:166`, `:188`, `:212`, `:232`, `:248` ; modales du canvas.

Plusieurs transitions effacent la sélection et l'historique sans effacer `addPropertyTarget` ni `editConceptualTarget`.

Reproduction interne : ouvrir la modale d'une entité de A, puis `openProject(B)` où B est vide. `addPropertyTarget` référence toujours l'entité de A alors que le projet actif ne la contient pas.

**Impact :** état transitoire incohérent, potentiel formulaire périmé ou commande adressée à une cible absente. Le déclenchement de ce scénario par l'interface, et son rendu exact, restent à vérifier au navigateur.

**Protection attendue :** tests de changement/création/chargement/suppression de projet avec modale ouverte, puis validation du comportement souhaité. Ne pas introduire automatiquement une fermeture qui changerait l'UX sans accord.

### PP-05 — Une dépendance circulaire traverse le domaine

**Où :** `src/domain/index.ts:15`, `src/domain/tree-property.ts:3`, `src/sql/model.ts:1` ; `src/mld/generator.ts:16`.

Cycle de dépendances de valeurs vérifié : `domain/index.ts` réexporte `tree-property.ts`, qui importe `sql/model.ts`, qui importe à son tour `parseAttributeTypeConfig` depuis `domain/index.ts`. Ce ne sont pas uniquement des imports de types.

`treePropertyDetails` compose des libellés de présentation SQL/PK/AK dans le dossier métier. Le MLD dépend également du convertisseur PostgreSQL et contient déjà un champ `sqlType`.

**Impact :** frontière moins nette qu'annoncée, imports indirects difficiles à suivre, extraction/test isolé plus délicats et sensibilité aux changements d'initialisation. Aucun plantage imputable au cycle n'a été reproduit. Le couplage à PostgreSQL est cohérent avec le périmètre actuel, mais doit être assumé plutôt que décrit comme un modèle totalement neutre.

**Protection attendue :** vérifier les dépendances de valeurs après chaque déplacement ; préserver les résultats de `treePropertyDetails`, les conversions de types et les exports publics. Un second dialecte SQL n'est pas demandé.

### PP-06 — Quelques modules cumulent plusieurs raisons de changer

**Où :** `src/editor/commands.ts` (606 lignes), `src/editor/nodes/adapter.ts` (574), `src/editor/conceptual-commands.ts` (371), `src/components/canvas/ConceptualEditModal.tsx` (304), `Canvas.tsx` (253).

L'adaptateur regroupe types des données graphiques, projections MCD/UML/MLD, concepts avancés, marqueurs et callbacks d'arêtes. Le canvas orchestre synchronisation, sélection, suppression, connexions, dock, sidebar et modales. La modale conceptuelle gère quatre formulaires différents.

`AddPropertyModal.tsx` est court en nombre de lignes mais dense : 24 appels à `useState`, initialisation depuis le domaine, assemblage du type, validation, création/modification et gestion des identifiants sont mêlés au JSX. `ConceptualEditModal` compte 13 appels à `useState`.

**Impact :** changements difficiles à relire et logique de formulaire critique difficile à tester seule. Le cas « changer un libellé sans modifier le type physique historique » doit notamment rester protégé.

**Protection attendue :** caractériser conversions et soumission avant extraction. La taille de `components/ui/sidebar.tsx` (770 lignes, primitives composées) n'est pas à elle seule une preuve de composant monolithique : ne pas découper uniquement au nombre de lignes.

### PP-07 — Le typage graphique est partiellement contourné

**Où :** `src/editor/nodes/adapter.ts:359`, `:382`, `:411`, `:446`, `:505` ; `EntityNode.tsx:24`, `AssociationNode.tsx:24`.

Cinq marqueurs utilisent `type: 'arrowclosed' as any`. Les composants reçoivent des `NodeProps` génériques et castent leurs données vers une structure attendue. Le projet n'est pas globalement non typé : ces contournements sont localisés.

**Impact :** incohérences de payload ou de marqueur moins bien détectées lors d'une évolution de l'adaptateur ; faux sentiment de sécurité malgré `strict`.

**Protection attendue :** typage précis des nœuds/arêtes et cas de compilation/projection couvrant les six types de nœuds, sans modifier leurs données ni leur rendu. Distinguer ces assertions des `as never` volontairement utilisés pour fabriquer des entrées invalides dans les tests.

### PP-08 — Les projections et les abonnements invalident trop largement

**Où :** `src/components/canvas/Canvas.tsx:151`, `src/editor/nodes/adapter.ts:128` et `:326`, `src/components/panel/sql.tsx:17`, `src/merise/rules/advanced/model-rules.ts:65` ; abonnements de `EntityNode` et `AssociationNode`.

`projectToNodes` calcule le MLD même en MCD/UML. `projectToEdges` le recalcule en MLD. L'effet du canvas reconstruit nodes/edges aussi lors d'une sélection ou d'un changement de popover. Le validateur calcule également une projection si la structure n'a pas d'erreur, et le panneau SQL en calcule une autre.

Les nœuds mémorisés avec `memo` s'abonnent néanmoins au projet entier : une nouvelle référence de projet invalide ces abonnements, y compris pour une modification ailleurs. Les objets de données reconstruits réduisent aussi l'intérêt de la comparaison superficielle des props.

**Impact :** travail répété et risque de latence sur de gros diagrammes. Le coût réel et le nombre de rendus par interaction n'ont pas été profilés.

**Protection attendue :** mesures sur sélection/déplacement/édition en MCD et MLD, puis optimisation ciblée des sélecteurs et des calculs dérivés. Une mémoïsation systématique ou un index global mutable n'est pas justifié sans mesure.

### PP-09 — Le chargement différé existant ne découpe pas le bundle

**Où :** `src/components/panel/content.tsx:12`, `src/components/panel/index.ts:6`, `src/components/panel/project-manager.tsx:10`.

`IssuesPanel` est chargé avec `lazy(() => import('./issues'))`, mais le barrel `panel/index.ts` le réexporte statiquement. Le build signale explicitement `INEFFECTIVE_DYNAMIC_IMPORT` et place le panneau dans l'unique chunk JavaScript initial. Le catalogue complet des projets est aussi dans ce chunk.

**Impact mesuré :** JavaScript initial de 699 438 octets / 206 501 octets gzip ; aucun chunk fonctionnel distinct pour le panneau. Cela ne prouve pas un temps de chargement excessif ni un gain chiffré après découpage.

React DOM et React Flow font partie des plus gros modules émis ; leur présence est attendue. Le module des templates représente 41 390 caractères selon la métrique `renderedLength` du bundler, avant attribution de la taille minifiée/gzip ; cette métrique ne doit pas être additionnée directement aux tailles finales.

**Protection attendue :** comparer les sorties du build et tester l'ouverture initiale/réouverture des panneaux. Préserver le premier lancement qui exige le gestionnaire de projets ; aucun lazy loading de « routes » n'est nécessaire puisqu'il n'y a pas de routeur.

### PP-10 — Les coûts du stockage et des grandes listes ne sont pas bornés

**Où :** `src/store/project-store.ts:98`, `src/persistence/local-storage.ts:36`, `src/components/panel/project-manager.tsx`, `src/components/panel/project-tree.tsx`.

Chaque `apply` sérialise synchroniquement toute la bibliothèque, y compris les projets inactifs. Un déplacement final de nœud emprunte ce même chemin. L'historique conserve jusqu'à 100 versions de projet ; il s'agit de références vers des versions immuables pouvant partager des sous-objets, pas de 100 clones profonds systématiques.

Les listes de projets et l'arborescence utilisent des `map` sans virtualisation explicite ; les propriétés repliées ne sont pas toutes rendues. Les tailles cibles des diagrammes/bibliothèques ne sont pas documentées.

**Impact :** potentiel blocage du thread principal, croissance mémoire et quota localStorage ; aucun seuil de dégradation n'a été mesuré.

**Protection attendue :** définir des jeux de données représentatifs et mesurer sauvegarde/validation/rendu avant de décider d'un debounce, d'une virtualisation ou d'un changement de stockage. Une sauvegarde différée modifierait les garanties à la fermeture et nécessite une décision explicite.

### PP-11 — Les tests protègent surtout le moteur, pas les frontières

**Où :** `vite.config.ts:24`, `src/store/project-store.test.ts`, `src/components/ui/tooltip.test.ts`, `src/persistence/*test.ts`.

Le store possède cinq tests, mais ses tests laissent `localStorage` absent et les fonctions de stockage ignorer les erreurs. La remise à zéro ne reconstruit pas entièrement un store indépendant ; `reset()` recharge un projet dans la bibliothèque existante. Les transitions multi-projets et la durabilité de l'historique ne sont donc pas garanties par ces tests.

Les tests de persistance couvrent le parsing/export de fichiers et les concepts, pas les défaillances de la bibliothèque locale. Les trois tests UI rendent du HTML statique de tooltips/propriétés, sans interactions navigateur. Le glob Vitest accepte uniquement `src/**/*.test.ts` : un futur fichier `*.test.tsx` serait ignoré avec cette configuration.

**Impact :** 250 tests verts ne suffisent pas à garantir une migration sans changement d'UX ; les zones les moins couvertes correspondent aux défauts reproduits.

**Protection attendue :** priorité aux transitions du store et à la logique pure extraite des formulaires ; compléter ensuite par quelques parcours ciblés, pas une couverture de 100 % ou une réécriture générale des tests.

### PP-12 — Le lint et la CI n'imposent pas tous les garde-fous attendus

**Où :** `eslint.config.js`, `.github/workflows/deploy.yml`.

Le plugin `react-hooks` est enregistré mais ni `rules-of-hooks` ni `exhaustive-deps` ne sont activés dans la configuration ; la seule règle de ce plugin explicitement configurée, `set-state-in-effect`, est désactivée. La configuration n'active pas non plus de règles TypeScript tenant compte des types. Le typecheck complète utilement Babel, mais ne remplace pas le contrôle des dépendances des hooks.

La CI teste et construit sur push `main` ou déclenchement manuel, sans déclencheur `pull_request` ni étape lint. Le build inclut déjà `tsc -b` : le typage n'est donc pas absent de la CI. Les 11 avertissements actuels concernent Fast Refresh dans les primitives UI.

**Impact :** erreurs de hooks non signalées et régression de lint pouvant atteindre `main` avant revue automatisée.

**Protection attendue :** établir la liste des avertissements existants et activer les garde-fous par étapes. Ne pas supprimer des avertissements en modifiant aveuglément les effets ou les exports publics.

### PP-13 — Nommage des fichiers incohérent

**Où :** 16 fichiers source en PascalCase :

```text
src/app/App.tsx
src/components/canvas/AddPropertyModal.tsx
src/components/canvas/AssociationEdge.tsx
src/components/canvas/AssociationNode.tsx
src/components/canvas/BusinessRuleNode.tsx
src/components/canvas/Canvas.tsx
src/components/canvas/CanvasControls.tsx
src/components/canvas/CardinalityPopover.tsx
src/components/canvas/CifNode.tsx
src/components/canvas/ConceptualEdge.tsx
src/components/canvas/ConceptualEditModal.tsx
src/components/canvas/ConstraintNode.tsx
src/components/canvas/DiagramSidebar.tsx
src/components/canvas/EntityNode.tsx
src/components/canvas/InheritanceNode.tsx
src/components/canvas/PropertyRow.tsx
```

Le reste du code suit largement le kebab-case. Les conventions de quotes, de points-virgules, d'indentation et de JSX compact varient, particulièrement entre les primitives UI et le code applicatif. Aucun formateur n'est configuré dans les scripts du projet.

**Impact :** navigation/recherche moins prévisibles et diffs difficiles à relire. Un renommage de casse seule peut fonctionner sous Windows mais échouer après checkout Linux si les imports ne sont pas tous corrigés.

**Point à valider :** la demande « tous les fichiers en kebab-case » coexiste avec les noms explicitement demandés `PAIN_POINTS.md`, `ARCHITECTURE.md`, `MIGRATION.md`, ainsi qu'avec `README.md` et les noms imposés par les outils. Les exceptions documentaires/outillage devront être fixées avant migration ; aucun de ces fichiers n'est renommé ici.

**Protection attendue :** inventaire ancien/nouveau chemin après accord, imports sensibles à la casse, build et tests à chaque lot. Le PascalCase des symboles de composants devra rester inchangé.

### PP-14 — Duplications modestes et sources de non-déterminisme

**Où :** `src/editor/commands.ts:14`, `src/editor/conceptual-commands.ts:21`, les deux modales d'édition et `src/store/project-store.ts:66`.

Deux fonctions `uid` identiques s'appuient sur `Math.random`; une troisième stratégie identifie les projets. Les générateurs de noms disponibles suivent des variantes proches. `Choice` et sa classe radio sont dupliqués à l'identique dans deux modales.

**Impact :** conventions faciles à faire diverger et tests exacts nécessitant de contrôler l'aléatoire. Les commandes n'altèrent pas nécessairement leur entrée, mais les fonctions de création ne sont pas strictement déterministes malgré la documentation les qualifiant de « pures ». Aucun défaut de collision n'a été reproduit.

**Protection attendue :** distinguer réutilisation réellement stable et simples ressemblances ; préserver formats d'IDs/noms. Éviter un système de formulaires générique pour supprimer une duplication de quelques lignes.

### PP-15 — Contrats UX et accessibilité insuffisamment caractérisés

**Où :** `src/components/canvas/Canvas.tsx:238`, `src/components/shared/modal.tsx`, `src/components/panel/issues.tsx:44`, `src/components/panel/sql.tsx:17`, `src/hooks/use-rename.ts`.

- Le dock annonce `Ctrl+Z`/`Ctrl+Y`, mais aucun gestionnaire applicatif correspondant n'a été trouvé. Le canvas gère `Delete` ; le raccourci global de la sidebar est distinct. Ajouter les raccourcis serait une évolution fonctionnelle, pas un renommage neutre.
- La modale partagée rend un `role="dialog"` avec `aria-modal`, sans liaison explicite du titre, gestion de focus piégé/restauré ni gestion d'Échap dans ce composant. L'impact exact au clavier/lecteur d'écran doit être vérifié au navigateur. Remplacer cette modale par Radix pourrait changer fermeture, focus et interactions avec le canvas.
- L'interface permet d'ignorer une règle de sévérité `error`; le test du store le vérifie pour E002. Le panneau SQL se base sur les erreurs après filtrage. Interdire cette action changerait un comportement existant : clarifier la politique plutôt que la « corriger » implicitement.
- Le SQL est calculé avant le test `canExport`; un état invalide qui fait lever le générateur ne serait pas protégé par le simple affichage « génération bloquée ». Le parseur et les formulaires filtrent déjà beaucoup de cas : le scénario utilisateur atteignable reste à établir.
- Sélection simple du store, multisélection React Flow, renommage au clavier et annulation de formulaire n'ont pas de couverture d'interaction identifiée.

**Impact :** changement involontaire d'UX lors d'une extraction, même avec moteur métier et snapshots de données inchangés.

**Protection attendue :** consigner les comportements actuellement observés puis valider séparément les corrections souhaitées. Les garanties d'accessibilité ne peuvent pas être certifiées par les seuls tests de HTML statique.

### PP-16 — Bruit de dépôt et dépendances à qualifier

**Où :** `tsconfig.tsbuildinfo`, `.gitignore`, `package.json`.

`tsconfig.tsbuildinfo` est suivi par Git alors qu'il s'agit d'un artefact incrémental susceptible de varier lors des vérifications/builds. Les répertoires `dist/` et `node_modules/` sont, eux, ignorés.

Les dépendances directes `@radix-ui/react-icons`, `@radix-ui/react-radio-group` et `@radix-ui/react-select` ne présentent pas d'import direct identifié dans `src/`. Cela en fait des candidates à vérification, pas une preuve qu'elles alourdissent le bundle ou qu'elles peuvent être supprimées sans autre contrôle. La liste des plus gros modules du build ne prouve pas de duplication de React ; aucun audit exhaustif des versions embarquées n'a été effectué.

**Impact :** diffs de compilation parasites, maintenance potentiellement superflue du manifeste et difficulté à attribuer les coûts du bundle.

**Protection attendue :** contrôler les consommateurs et dépendances transitives, puis construire/tester avant tout nettoyage. Aucun package, lockfile ou artefact suivi n'a été supprimé pendant l'audit.

## 6. Conditions de la suite

L'audit s'arrête ici, conformément au prompt. Après validation de ce rapport, l'étape suivante sera uniquement la proposition argumentée d'architecture cible et du plan de migration incrémental, avec fichiers impactés, risques et contrôles de non-régression par lot. Cette proposition devra être validée avant les changements globaux de dossiers/state.

Les futurs jalons devront préserver les props/exportations utilisés, les vues MCD/UML/MLD, le format `.merise.json` version 1, les données déjà stockées, les règles ignorées et les résultats MLD/SQL. Les anomalies PP-01/PP-02 et les changements d'UX resteront identifiés séparément des opérations de refactoring.

`ARCHITECTURE.md` et `MIGRATION.md` ne sont pas créés à ce stade : aucune cible ni liste de déplacements n'a encore été validée.

**Bilan de l'étape :** un rapport ajouté ; aucun code ni comportement applicatif modifié. Les tests, le typecheck et le build en mémoire passent, avec les avertissements documentés ci-dessus. Cela confirme l'état de référence, pas une certification exhaustive de l'UX en production.
