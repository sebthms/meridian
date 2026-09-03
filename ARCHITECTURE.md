# Architecture cible — proposition à valider

Statut : **proposition, non implémentée**. Audit validé par l'utilisateur le 3 septembre 2026. Base : `5ff32a7`, complétée par `PAIN_POINTS.md`.

La validation de l'audit autorise cette proposition, pas encore la réorganisation globale. Le séquencement, les déplacements et les critères de contrôle sont décrits dans [MIGRATION.md](MIGRATION.md). Aucun code applicatif n'a changé pendant cette étape.

## 1. Décision générale : architecture hybride

Conserver le découpage par couches du moteur métier, qui bénéficie déjà de tests substantiels, et organiser l'interface par fonctionnalité. L'application ne possède qu'un espace de travail et aucun routeur : ajouter artificiellement `pages/`, un système de routes, des services HTTP ou une infrastructure de plugins ne résoudrait aucun problème observé.

Le découpage proposé répond aux responsabilités existantes :

- `app` compose l'espace de travail et choisit les panneaux ; il ne porte pas les règles Merise.
- `features` regroupe les composants, hooks et fonctions de présentation d'une même fonctionnalité.
- `shared` contient uniquement des briques réutilisables sans connaissance des projets Merise.
- `domain`, `editor`, `merise`, `mld`, `sql`, `persistence` et `store` restent des couches explicites, plutôt que d'être toutes déplacées dans une énorme feature `diagram`.

Cela limite les déplacements du code métier, rend les frontières UI lisibles et évite la prolifération d'abstractions pour une application de cette taille.

## 2. Arborescence cible

Les dossiers ci-dessous sont la cible ; ils ne seront créés qu'avec leur premier fichier utile. Les extractions indiquées ne sont pas toutes nécessaires dès le premier lot.

```text
src/
  main.tsx
  index.css
  vite-env.d.ts
  app/
    app.tsx
    workspace/
      canvas.tsx
      diagram-sidebar.tsx
      panel-content.tsx
      panel-view.ts
  features/
    diagram/
      components/        # nœuds, arêtes, contrôles, formulaires et arbre
        nodes/           # en-têtes, handles et confirmations des nœuds
        flow/            # primitives graphiques propres au diagramme
        icons/
      flow/              # adaptation Project -> React Flow et types associés
        project-adapter.ts
      hooks/             # renommage et orchestration du diagramme/formulaires
      model/             # logique pure des formulaires, sans JSX
      presentation/      # libellés et détails pour l'arborescence
    project-library/
      components/
        project-manager-panel.tsx
      templates/         # catalogue et projets générés, avec leur test
    validation/
      components/
        issues-panel.tsx
    sql-export/
      components/
        sql-panel.tsx
    settings/
      components/
        settings-panel.tsx
        palette-select.tsx
        clear-projects-button.tsx
  shared/
    ui/                  # primitives Radix/shadcn
    components/          # modal, confirmation, enveloppe de panneau
    layout/              # classes de layout communes aux panneaux
    hooks/               # détection mobile, sans dépendance métier
    theme/               # thème, palettes, hook et tests
    utils/               # cn et autres utilitaires réellement génériques
  domain/                # modèle conceptuel et invariants élémentaires
  editor/                # commandes de modification et connexions pures
  merise/                # moteur de validation
  mld/                   # projection relationnelle
  sql/                   # types physiques, noms et DDL PostgreSQL
  persistence/           # parsing/export et adaptateurs de stockage
  store/                 # orchestration Zustand et transitions applicatives
  styles/                # palettes CSS générées, chemin conservé
  test-support/          # données/fabriques de test, jamais importées en production
```

### Pourquoi le canvas principal est dans `app/workspace`

Le composant actuel `Canvas` compose React Flow, la sidebar et les panneaux de plusieurs fonctionnalités. Le placer tel quel dans `features/diagram` obligerait cette feature à importer les fonctionnalités voisines ou `app`.

La cible conserve ce composant comme hôte de composition, avec le même symbole `Canvas` et les mêmes props publiques. Les nœuds, arêtes, contrôles et modales sont dans `features/diagram`. La logique graphique pourra ensuite être extraite dans des hooks ciblés sans changer les interactions ni le rôle de l'hôte.

De même, `DiagramSidebar`, `PanelContent` et `PanelView` appartiennent à la composition applicative. `ProjectTreePanel` et les détails des propriétés appartiennent à la feature diagramme.

`ClearProjectsButton` n'est pas générique : il est utilisé par les paramètres et pilote le store. Il rejoint donc `features/settings`, pas `shared`.

## 3. Règles de dépendances

Cette table concerne les imports de valeurs du code de production. Les imports de types doivent également rester aussi locaux que possible, mais ne sont pas confondus avec les cycles d'exécution.

| Zone | Peut utiliser | Ne doit pas utiliser |
| --- | --- | --- |
| `domain` | Autres modules du domaine | React, Zustand, stockage, SQL, features, app |
| `editor` | `domain` et ses propres commandes | React/React Flow à l'exécution, store, UI, stockage |
| `sql` | `domain`, ses propres helpers ; types MLD | UI, store, moteur MLD à l'exécution |
| `mld` | `domain`, conversion de types `sql/model` | React, store, UI |
| `merise` | `domain`, `mld`, nommage SQL | React, store, UI |
| `persistence` | `domain`, primitives navigateur dans les adaptateurs | UI, store |
| `store` | `domain`, `merise`, `persistence`, Zustand | `app`, composants ou features |
| `shared` | Autres briques génériques et bibliothèques UI | Modèle Merise, store, features, app |
| `features/*` | Couches métier nécessaires, store, shared, code local | `app` et autres features à l'exécution |
| `app` | Features, shared et store | Règles métier intégrées au JSX |
| `test-support` | Domaine et outils de test | Composants/app ; aucun consommateur de production |

Les dépendances autorisées ne sont pas des obligations d'import. Pas de framework d'injection, de bus d'événements ou de couche `services` systématique.

Le MLD reste volontairement couplé aux types PostgreSQL. En faire un modèle multi-dialecte demanderait un autre projet. En revanche, `domain/tree-property.ts` sort du domaine et son réexport est retiré du barrel métier : cela rompt le cycle constaté sans modifier le modèle ni les conversions SQL.

### Exports et frontières

- Imports directs pour les composants chargés à la demande ; pas de barrel UI réexportant tous les panneaux.
- `export type` et `import type` pour les types uniquement.
- Les barrels du moteur peuvent rester lorsqu'ils constituent une API claire et n'introduisent pas de cycle.
- Pas de fichier `shared/index.ts` exportant tout le projet.
- Les noms de composants, props et fonctions utilisées sont conservés. Les chemins internes déplacés sont mis à jour dans tous leurs consommateurs et documentés dans la migration.
- Ne pas garder un faux alias de compatibilité `domain -> feature` pour préserver un ancien import interne : il réintroduirait précisément la dépendance à supprimer.

## 4. Conventions de nommage

Tous les fichiers applicatifs créés ou déplacés suivent le kebab-case. Les noms de composants et de types restent en PascalCase à l'intérieur des fichiers ; fonctions et variables restent en camelCase.

| Nature | Convention |
| --- | --- |
| Composant | `entity-node.tsx`, symbole `EntityNode` |
| Hook | `use-rename.ts`, fonction `useRename` |
| Fonction métier | `entity-commands.ts` |
| Présentation | `tree-property-details.ts` |
| Test pur | `tree-property-details.test.ts`, dans le même dossier |
| Test avec JSX | `property-row.test.tsx`, dans le même dossier |
| Famille de tests existante | Conserver les variantes `*-extra.test.ts` lorsque leur rôle reste clair |
| Données générées | `projects.json`, `palettes.css`, noms déjà conformes |

Exceptions proposées, explicites et limitées :

- Noms conventionnels de documentation : `README.md`, `CHANGELOG.md`, `CONTEXT.md`, `MERISE.md`, et les trois livrables demandés `PAIN_POINTS.md`, `ARCHITECTURE.md`, `MIGRATION.md`.
- Fichiers de configuration/outillage : `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, fichiers cachés Git, lockfile et suffixes reconnus par les outils.

Ces exceptions font partie du plan à valider : la demande littérale « tous les fichiers » est contradictoire avec les noms de livrables imposés. Aucun renommage opportuniste de documentation ou de configuration n'est prévu.

Les noms déjà utilisés dans les données, par exemple `businessRule`, `MCD`, les clés localStorage et les IDs des règles, ne sont pas des noms de fichiers et ne seront pas transformés.

## 5. État et persistance : clarifier sans remplacer

### Décision

Conserver Zustand, un store applicatif unique et l'API existante de `useProjectStore`. La bibliothèque et le projet actif sont des données transverses ; les dupliquer dans chaque feature créerait une nouvelle source d'incohérence.

Après tests de caractérisation, extraire une fabrique testable et les fonctions de transition pertinentes. La fabrique pourra recevoir des dépendances explicites pour le stockage, l'horloge et la création d'IDs. L'instance utilisée par l'application gardera ses valeurs par défaut, son identité stable et le comportement de démarrage existant. Aucun nouveau provider n'est requis par principe.

Les formulaires conservent leur état temporaire local. Le ciblage partagé des modales reste dans le store tant qu'un besoin documenté impose ce partage. Les callbacks de présentation ne sont pas stockés dans `Project`.

### Garanties à conserver

- Format `.merise.json` version 1 et parsing des anciens fichiers.
- Clés et données existantes du navigateur ; pas de reset, renommage ou migration de stockage implicite.
- Historique borné à 100 entrées, actions et règles de réinitialisation connues.
- Validation et règles ignorées, sans durcir la politique d'erreurs au passage.
- Pas de debounce de sauvegarde, de backend, de synchronisation distante ou d'IndexedDB dans ce refactoring.

Les défauts de PP-01/PP-02 ne sont pas des invariants à adopter comme cible produit. Ils sont cependant des comportements existants à identifier et corriger dans des lots dédiés **seulement après accord**, pas des changements à glisser dans l'extraction du store. Un test de caractérisation du comportement actuel ne doit pas être présenté comme la spécification définitive souhaitée.

La gestion explicite des erreurs est souhaitable ; le choix d'une notification, d'un retry ou d'un export de secours nécessite une décision UX séparée. Introduire une abstraction de résultat ne justifie pas à elle seule de changer silencieusement ces comportements.

## 6. Extraction de logique et principes de conception

- Formulaires : isoler valeurs initiales, construction de configuration/patch, validation et orchestration des commandes. Tester en priorité le cas « modifier un libellé sans rétrécir un type historique ».
- Adaptateur graphique : conserver une entrée claire `project-adapter.ts`, puis séparer types, projection de nœuds et projection d'arêtes si cela réduit réellement les responsabilités. Les callbacks restent dans la couche graphique.
- Commandes : garder les fonctions `(Project, ...) -> Project`, puis séparer entités, associations, propriétés et identifiants derrière les exports existants.
- Composition : conserver les éléments de nœuds déjà partagés ; pas de hiérarchie de classes.
- Duplication : unifier uniquement les helpers dont les règles sont réellement identiques. Ne pas remplacer les formulaires par un moteur générique pour réutiliser un bouton radio.
- Typage : utiliser les types de nœuds/arêtes et marqueurs de la version installée de React Flow ; retirer les cinq `as any` en conservant les mêmes données émises.

La responsabilité unique se juge par les raisons de modifier un module, pas par un seuil mécanique de lignes. Les primitives shadcn ne sont pas réécrites intégralement.

## 7. Stratégie de tests

Conserver les tests au voisinage du module concerné. Les fabriques de fixtures partagées rejoignent `test-support/project-fixtures.ts` pour éviter que les tests du domaine aillent chercher leurs données dans une catégorie de règles du validateur.

Priorités, dans l'ordre :

1. Store et stockage isolés : création, ouverture, renommage, suppression, chargement, historique, ancienne clé, erreurs simulées et transitions de modales.
2. Fonctions extraites des formulaires et présentation des propriétés.
3. Projections de nœuds/arêtes, types graphiques, MLD et SQL identiques sur fixtures déterministes.
4. Interactions ciblées : renommage, sélection, cardinalités, formulaire, panneaux et création initiale.

Le glob Vitest devra accepter `.test.ts` et `.test.tsx`. Le moteur reste testé en environnement Node ; un environnement DOM/browser n'est ajouté que pour les suites qui le nécessitent. Aucune nouvelle dépendance de test n'est encore choisie ou installée dans cette proposition.

Le test de `PropertyRow`, aujourd'hui dans le fichier de test du tooltip, rejoindra le composant métier. Le test des valeurs initiales de formulaire, aujourd'hui dans les tests SQL avancés, rejoindra la fonction extraite. Les assertions existantes sont conservées, pas remplacées par un nombre de tests cible.

Pas d'objectif arbitraire de couverture à 100 %. Des tests verts ne remplacent pas un smoke test navigateur pour les gestes React Flow et le focus.

## 8. Performances et chargement

### Optimisations prévues après stabilisation structurelle

- Supprimer la dépendance statique qui neutralise le chargement différé d'`IssuesPanel`.
- Mesurer séparément le poids du JavaScript initial, le poids total des chunks et le coût de la première ouverture d'un panneau ; déplacer des octets n'est pas nécessairement en supprimer.
- Éviter les projections MLD redondantes pour le même projet lorsque les données sont inchangées, sans stocker un second modèle métier modifiable.
- Réduire les abonnements des nœuds au strict nécessaire et préserver les identités de données lorsque cela apporte un gain mesuré.
- Ne pas charger un grand catalogue de templates plus tôt que nécessaire, mais préserver sa disponibilité immédiate lors du premier lancement. Ce point reste une optimisation conditionnelle au gain et à l'UX mesurés.

### Limites

Pas de remplacement de React Flow, de `memo` systématique, de virtualisation sans benchmark ni d'introduction d'un worker par défaut. Le premier lot de code-splitting doit conserver les états des panneaux, leur fermeture et la sélection. Tout nouveau chargement visible ou traitement d'échec doit être revu au titre de l'UX.

Référence de l'audit : un chunk JavaScript de 699 438 octets / 206 501 octets gzip, CSS de 64 312 octets / 11 402 octets gzip. Ces mesures ne constituent pas un budget garanti pour la cible.

## 9. Décisions techniques résumées

| ADR | Décision proposée | Motif / contrepartie |
| --- | --- | --- |
| ADR-01 | Architecture hybride, pas de réécriture intégrale en features | Préserver les frontières et tests du moteur ; plusieurs couches racines restent visibles |
| ADR-02 | Composition de l'espace de travail dans `app` | Pas d'import entre features ; l'hôte du canvas reste volontairement applicatif |
| ADR-03 | Domaine sans présentation SQL ni UI | Supprimer le cycle connu ; déplacer quelques exports internes et tests |
| ADR-04 | Zustand et format persistant conservés | Réduction des risques ; les bugs existants exigent des corrections distinctes |
| ADR-05 | Imports UI explicites, pas de barrel de tous les panneaux | Chargement différé effectif ; imports plus détaillés |
| ADR-06 | Tests colocalisés et dépendances d'environnement contrôlables | Meilleure isolation ; pas de nouveau framework d'injection |
| ADR-07 | Kebab-case avec exceptions documentaires/outillage | Cohérence sans casser les conventions imposées |
| ADR-08 | Pas de nouveau contexte global, routeur ou dialecte SQL | Aucun besoin observé justifiant cette expansion |

## 10. Critères d'acceptation de l'architecture

- Aucun import de production de `domain` vers SQL, stockage ou UI ; plus de cycle connu `domain/tree-property/sql`.
- Aucune feature n'importe `app` ou une feature voisine à l'exécution ; composition vérifiée dans `app/workspace`.
- Toutes les props et fonctions utilisées ont un emplacement documenté, sans changement de signature non approuvé.
- Fichiers applicatifs en kebab-case et tests au voisinage de leur sujet.
- Tests, typecheck, lint et build valides à la fin de chaque lot ; smoke tests des interactions concernées.
- Modèles/DDL de référence identiques pour les refactorings ; corrections fonctionnelles séparées et explicitement approuvées.
- Documentation et alias de génération shadcn cohérents avec les chemins réellement livrés.

Cette proposition et [MIGRATION.md](MIGRATION.md) restent à valider avant toute mise en œuvre.
