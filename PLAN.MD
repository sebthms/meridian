Oui. J’ai repris le cadrage précédent, vérifié les points techniques actuels et surtout corrigé un point important : **le MVP ne doit pas prétendre implémenter “toutes les règles MERISE” au sens complet**, car MERISE couvre aussi des extensions et contraintes avancées (partition/exclusion, CIF, héritage, identification relative, temporalité, associations n-aires, etc.). Les cardinalités binaires, les identifiants, associations et règles MCD→MLD constituent en revanche un noyau solide et adapté au MVP. ([Scribd](https://es.scribd.com/document/681565498/Merise-Mcd-1?utm_source=chatgpt.com "Modélisation MERISE : MCD et outils gratuits | PDF | Génie logiciel | Développement de logiciel"))

Voici donc la **spécification de référence pour le développement**.

# Spécification MVP — Modélisateur de bases de données MERISE

## 1. Vision produit

L’application est un **éditeur web de modèles de données basé sur MERISE**, entièrement exécuté côté navigateur.

Objectif principal :

> permettre de construire un MCD MERISE propre, détecter les erreurs de conception, expliquer ces erreurs, puis transformer automatiquement le modèle en MLD et en SQL.

Chaîne fonctionnelle :

```text
MCD
 ↓
Validation MERISE
 ↓
MLD relationnel
 ↓
SQL
```

L'application doit être :

- simple à prendre en main ;
    
- pédagogique ;
    
- suffisamment rigoureuse pour un usage professionnel ;
    
- entièrement client-side ;
    
- sans compte ;
    
- sans backend ;
    
- déployable sur GitHub Pages.
    

Vite documente explicitement le déploiement statique sur GitHub Pages avec un build `dist` et une configuration `base` adaptée au nom du repository. ([vitejs](https://vite.dev/guide/static-deploy.html?utm_source=chatgpt.com "Deploying a Static Site | Vite"))

---

# 2. Périmètre exact du MVP

## Inclus

### Modélisation MCD

- entités ;
    
- propriétés ;
    
- identifiants simples ;
    
- identifiants composés ;
    
- associations ;
    
- associations réflexives ;
    
- associations binaires ;
    
- cardinalités :
    
    - `0,1`
        
    - `1,1`
        
    - `0,N`
        
    - `1,N`
        
- propriétés portées par une association ;
    
- plusieurs associations entre les mêmes entités ;
    
- déplacement et positionnement graphique.
    

### Validation

- erreurs structurelles ;
    
- incohérences de cardinalités ;
    
- problèmes de clés ;
    
- problèmes détectables de transformation ;
    
- warnings de qualité de modèle ;
    
- explication de chaque problème ;
    
- navigation automatique vers l'élément concerné ;
    
- possibilité d'ignorer une occurrence ;
    
- possibilité d'ignorer une règle.
    

### Transformation

- MCD → MLD ;
    
- MLD → SQL ;
    
- aperçu MLD ;
    
- aperçu SQL ;
    
- téléchargement SQL.
    

### Projet

- nouveau projet ;
    
- sauvegarde locale ;
    
- ouverture d'un projet ;
    
- import/export JSON ;
    
- undo/redo ;
    
- export SVG/PNG.
    

### UI

- canvas interactif ;
    
- panneau d'inspection ;
    
- panneau des erreurs ;
    
- aperçu MLD ;
    
- aperçu SQL ;
    
- mode clair/sombre.
    

---

# 3. Explicitement hors MVP

Ces fonctionnalités ne doivent **pas** être implémentées par défaut :

- authentification ;
    
- backend ;
    
- base de données distante ;
    
- collaboration temps réel ;
    
- partage par URL ;
    
- synchronisation cloud ;
    
- commentaires ;
    
- historique de versions serveur ;
    
- requêtes SQL ;
    
- exécution SQL ;
    
- import SQL ;
    
- reverse engineering d'une base existante ;
    
- ORM ;
    
- migrations ;
    
- MCT ;
    
- MOT ;
    
- diagrammes de flux ;
    
- gestion exhaustive des contraintes MERISE avancées ;
    
- générateurs SQL multiples ;
    
- PostgreSQL + MySQL + SQLite simultanément ;
    
- optimisation physique du modèle ;
    
- normalisation automatique complète.
    

Le projet doit rester un **modélisateur MCD → MLD → SQL**, pas devenir un outil général de gestion de bases de données.

---

# 4. Précision importante sur MERISE

Le moteur doit distinguer trois niveaux :

```text
MCD
Conceptuel

MLD
Logique/relationnel

SQL
Physique / implémentation
```

Les conventions MERISE vérifiées confirment notamment :

- une entité devient une table ;
    
- son identifiant devient la clé primaire ;
    
- ses propriétés deviennent des colonnes ;
    
- les relations sont traduites par des clés étrangères ou des tables associatives selon les cardinalités. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))
    

Le MCD **ne doit donc pas contenir directement des types SQL** comme `VARCHAR(255)` ou `INTEGER`.

Exemple MCD :

```text
CLIENT
----------------
# id_client
  nom
  email
```

Puis MLD :

```text
CLIENT(
    id_client PK,
    nom,
    email
)
```

Puis SQL :

```sql
CREATE TABLE client (
    id_client INTEGER PRIMARY KEY,
    nom VARCHAR(255),
    email VARCHAR(255)
);
```

---

# 5. Modèle conceptuel de données

Le modèle interne doit être indépendant de React Flow.

## Entité

```ts
type Entity = {
  id: string
  name: string
  attributes: Attribute[]
  identifiers: Identifier[]
  position: {
    x: number
    y: number
  }
}
```

## Attribut

```ts
type Attribute = {
  id: string
  name: string
  conceptualType: ConceptualType
  nullable?: boolean
  description?: string
}
```

Le `nullable` ne doit cependant pas devenir une notion SQL visible dans le MCD : il peut être un champ interne si nécessaire au futur moteur, mais l'interface conceptuelle doit rester MERISE.

## Identifiant

```ts
type Identifier = {
  id: string
  attributeIds: string[]
  name?: string
}
```

Cela permet :

```text
# id_client
```

mais aussi un identifiant composé :

```text
# id_client
# id_commande
```

---

# 6. Association

```ts
type Association = {
  id: string
  name: string
  participants: AssociationParticipant[]
  attributes: Attribute[]
}
```

Le MVP impose :

```text
participants.length === 2
```

sauf association réflexive.

Une association réflexive peut donc connecter deux fois la même entité, avec deux rôles distincts :

```text
EMPLOYE
   │
   └── manager
```

Cela est bien un cas classique de MERISE. ([Scribd](https://fr.scribd.com/presentation/789394109/coursmerise-240110123628-f46391cf?utm_source=chatgpt.com "Méthode Merise : Conception SI et Modèles | PDF | Ingénierie des systèmes"))

---

# 7. Rôles des associations

Les associations réflexives nécessitent des rôles.

Exemple :

```text
EMPLOYE
       ┌──────────────┐
       │    GERER     │
       └──────────────┘
        ↑            ↑
     manager      subordonné
```

Le modèle doit donc prévoir :

```ts
type AssociationParticipant = {
  entityId: string
  role?: string
  cardinality: Cardinality
}
```

---

# 8. Cardinalités

Le modèle interne :

```ts
type Cardinality = {
  min: 0 | 1
  max: 1 | "N"
}
```

Les quatre cardinalités MVP sont donc exactement :

```text
0,1
1,1
0,N
1,N
```

Une cardinalité représente une participation minimale et maximale. Les quatre formes sont les cardinalités binaires les plus couramment utilisées dans le MCD MERISE. ([Mcours](https://www.mcours.net/cours/pdf/leilclic1/leilclic24.pdf?utm_source=chatgpt.com "Département Sciences Economie & Gestion"))

## Règle

Il est interdit de laisser :

```text
min > max
```

Le moteur interdit également :

```text
2,N
3,5
```

dans le MVP.

Les cardinalités métier bornées comme `1,5` existent conceptuellement dans certaines extensions, mais elles sortent du périmètre du modèle binaire standard retenu ici. ([Slides](https://slides.com/cedricbrasseur/merise?utm_source=chatgpt.com "Méthodologie MERISE"))

---

# 9. Associations porteuses de propriétés

Exemple :

```text
ETUDIANT
  │
  │
INSCRIPTION
  │
  └── date
  └── note
  │
COURS
```

Le moteur doit comprendre que :

```text
date
note
```

appartiennent à l'association et non à l'une des entités.

Lors du passage au MLD, l'association devient une relation et ses propriétés deviennent ses attributs. C'est une règle classique de transformation MCD→MLD. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))

---

# 10. Règles de validation MVP

Le moteur de validation est une vraie brique métier.

Il ne doit pas être directement codé dans les composants React.

Architecture :

```text
domain model
     ↓
validator
     ↓
ValidationIssue[]
```

---

## ERREURS BLOQUANTES

### MERISE-E001 — Entité sans nom

```text
Erreur
Une entité doit posséder un nom.
```

### MERISE-E002 — Entité sans identifiant

```text
Erreur
L'entité CLIENT ne possède aucun identifiant.
```

Une entité doit être identifiable dans le modèle.

### MERISE-E003 — Attribut sans nom

### MERISE-E004 — Attribut dupliqué

Deux attributs ne peuvent pas avoir le même nom dans une même entité.

### MERISE-E005 — Identifiant invalide

Un identifiant doit référencer au moins un attribut existant.

### MERISE-E006 — Association sans nom

### MERISE-E007 — Association mal connectée

Dans le MVP, une association doit avoir deux participations valides.

### MERISE-E008 — Cardinalité invalide

Exemples :

```text
2,1
0,2
2,N
```

### MERISE-E009 — Association sans cardinalités complètes

Chaque extrémité doit avoir une cardinalité.

### MERISE-E010 — Référence vers entité supprimée

Aucun objet ne doit conserver un identifiant orphelin.

---

# 11. Warnings de conception

Une distinction très importante doit exister entre :

```text
ERROR
```

et :

```text
WARNING
```

Un warning ne signifie pas que le modèle est formellement invalide.

---

## MERISE-W001 — Nom suspect

Exemple :

```text
entite1
table_temp
objet
```

Suggestion pédagogique :

> Choisissez un nom métier explicite.

---

## MERISE-W002 — Attribut potentiellement non atomique

Exemple :

```text
adresse = "12 rue X, Paris, France"
```

Le système affiche :

> Cet attribut semble contenir plusieurs informations. Vérifiez qu'il représente bien une propriété atomique au niveau conceptuel.

Il s'agit d'une **heuristique**, pas d'une erreur certaine.

---

## MERISE-W003 — Structure répétitive suspecte

Exemple :

```text
telephone_1
telephone_2
telephone_3
```

Message :

> Plusieurs attributs semblent représenter des occurrences répétées. Une entité/association supplémentaire pourrait être nécessaire.

---

## MERISE-W004 — Dépendance fonctionnelle suspecte

Exemple :

```text
COMMANDE
# id_commande
id_client
nom_client
```

Le système peut signaler :

> `nom_client` semble dépendre de `id_client` plutôt que de `id_commande`. Vérifiez qu'il n'existe pas une dépendance transitive.

Ce type de problème relève bien des dépendances fonctionnelles et de la normalisation. ([Ousrah](https://ousrah.portal-edu.com/merise/?utm_source=chatgpt.com "Manipuler les bases de données - Merise"))

Important :

**le moteur ne prétend pas démontrer automatiquement les dépendances fonctionnelles métier.**

Il formule une suspicion.

---

# 12. Système d'ignorance

Chaque issue doit posséder un identifiant stable.

```ts
type ValidationIssue = {
  id: string
  ruleId: string
  severity: "error" | "warning" | "info"
  title: string
  explanation: string
  targetIds: string[]
}
```

Le projet contient :

```ts
ignoredIssues: string[]
```

Deux actions :

```text
Ignorer cette occurrence
```

et :

```text
Ignorer cette règle
```

Le système ne doit jamais cacher définitivement une erreur sans que l'utilisateur ait demandé explicitement à l'ignorer.

---

# 13. Navigation depuis une erreur

Lorsqu'un utilisateur clique :

```text
MERISE-E002
Entité sans identifiant
CLIENT
```

le canvas doit :

1. sélectionner `CLIENT` ;
    
2. zoomer dessus ;
    
3. centrer la vue ;
    
4. ouvrir l'inspecteur si nécessaire.
    

---

# 14. Transformation MCD → MLD

C'est une brique purement algorithmique.

```text
MCD
 ↓
normalize
 ↓
validate
 ↓
MLD
```

Le moteur MLD ne doit pas dépendre de React.

---

# 15. Règle 1 — Entité

```text
CLIENT
```

devient :

```text
CLIENT(
    id_client PK,
    nom,
    email
)
```

C'est la règle standard de transformation entité → relation/table. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))

---

# 16. Règle 2 — Relation 1:N

Exemple :

```text
CLIENT 0,N
    │
    │ PASSER
    │
COMMANDE 1,1
```

Résultat :

```text
CLIENT(
    id_client PK
)

COMMANDE(
    id_commande PK,
    id_client FK
)
```

La clé du côté parent migre vers le côté portant la cardinalité maximale `1`, où elle devient clé étrangère. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))

---

# 17. Règle 3 — Relation N:N

Exemple :

```text
ETUDIANT 0,N
        │
    INSCRIPTION
        │
COURS 0,N
```

Résultat :

```text
ETUDIANT(
    id_etudiant PK
)

COURS(
    id_cours PK
)

INSCRIPTION(
    id_etudiant PK/FK,
    id_cours PK/FK
)
```

Les identifiants des entités composent la clé de la table associative ; les propriétés éventuelles de l'association sont ajoutées à cette relation. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))

---

# 18. Relation N:N avec attributs

```text
INSCRIPTION
------------
id_etudiant
id_cours
date
note
```

devient :

```text
INSCRIPTION(
    id_etudiant PK/FK,
    id_cours PK/FK,
    date,
    note
)
```

---

# 19. Relation 1:1

C'est un point où il faut être rigoureux.

Il n'existe pas une unique stratégie universelle pour `1,1 ↔ 1,1`.

Selon les conventions, on peut conserver deux tables ou fusionner les entités ; pour `0,1 ↔ 1,1`, la clé du côté `0,1` peut migrer vers le côté `1,1`. Les sources MERISE consultées présentent explicitement ces cas particuliers. ([Scribd](https://fr.scribd.com/document/692562017/Merise-2?utm_source=chatgpt.com "Méthodologie d'Analyse Merise | PDF | Système d'information | Application"))

### Décision MVP

Le générateur fait un choix **déterministe et documenté** :

#### `0,1 ↔ 1,1`

```text
A 0,1
B 1,1
```

→ FK dans `B`.

#### `1,1 ↔ 1,1`

→ conserver deux tables dans le MVP.

Le moteur ne fusionne pas automatiquement les entités.

Pourquoi ?

Parce qu'une fusion est une décision de conception, pas quelque chose que l'outil doit décider silencieusement.

---

# 20. Relation réflexive

Exemple :

```text
EMPLOYE 0,N
    │
  MANAGER
    │
EMPLOYE 0,1
```

Le générateur doit produire une FK autoréférentielle.

Exemple :

```sql
manager_id INTEGER REFERENCES employe(id_employe)
```

avec gestion des rôles pour éviter toute ambiguïté.

---

# 21. Différence cardinalité conceptuelle / contrainte SQL

Le moteur doit garder en tête qu'une information conceptuelle comme :

```text
1,N
```

ne se traduit pas toujours directement en une contrainte SQL équivalente.

Certaines contraintes minimales nécessitent d'autres mécanismes.

Donc :

```text
MCD validation
```

et :

```text
SQL constraints
```

sont deux choses distinctes.

Le MVP ne doit pas prétendre transformer toutes les cardinalités minimales en contraintes SQL exécutables.

---

# 22. Générateur SQL

Le MVP cible :

```text
SQL relationnel générique
```

avec syntaxe compatible PostgreSQL comme première cible.

Pas de multiplicité de dialectes au départ.

Configuration future :

```ts
type SqlDialect =
  | "postgresql"
  | "mysql"
  | "sqlite"
```

mais :

```text
MVP = PostgreSQL
```

---

# 23. Types conceptuels

MCD :

```text
TEXT
INTEGER
DECIMAL
DATE
BOOLEAN
```

MLD/SQL :

```text
TEXT
INTEGER
NUMERIC
DATE
BOOLEAN
```

Le MCD ne doit pas exposer :

```text
VARCHAR(255)
DECIMAL(10,2)
SERIAL
BIGSERIAL
UUID DEFAULT gen_random_uuid()
```

Ces détails sont physiques et sortent du noyau conceptuel.

---

# 24. Aperçu MLD

La sortie MLD doit être lisible :

```text
CLIENT
────────────────────
id_client PK
nom
email


COMMANDE
────────────────────
id_commande PK
date_commande
id_client FK → CLIENT.id_client
```

L'utilisateur doit comprendre le passage :

```text
MCD
↓
MLD
```

sans avoir besoin de regarder immédiatement le SQL.

---

# 25. Aperçu SQL

Exemple :

```sql
CREATE TABLE client (
    id_client INTEGER PRIMARY KEY,
    nom TEXT,
    email TEXT
);

CREATE TABLE commande (
    id_commande INTEGER PRIMARY KEY,
    date_commande DATE,
    id_client INTEGER NOT NULL,
    CONSTRAINT fk_commande_client
        FOREIGN KEY (id_client)
        REFERENCES client(id_client)
);
```

Actions :

```text
Copier
Télécharger .sql
```

---

# 26. Architecture technique

Stack retenue :

```text
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Zustand
@xyflow/react
```

`@xyflow/react` est bien adapté à un éditeur node-based, est personnalisable et distribué sous licence MIT. Le projet officiel documente son installation sous `@xyflow/react`, et le dépôt indique MIT. ([GitHub](https://github.com/xyflow/xyflow?utm_source=chatgpt.com "GitHub - xyflow/xyflow: React Flow | Svelte Flow - Powerful open source libraries for building node-based UIs with React (https://reactflow.dev) or Svelte (https://svelteflow.dev). Ready out-of-the-box and infinitely customizable. · GitHub"))

shadcn/ui supporte officiellement Vite + React + TypeScript et fournit un workflow d'installation directement prévu pour Vite. ([Shadcn](https://ui.shadcn.com/docs/installation/vite?utm_source=chatgpt.com "Vite - shadcn/ui"))

---

# 27. Règle d'architecture fondamentale

**React Flow n'est pas le modèle métier.**

Erreur à éviter :

```text
ReactFlow nodes
      ↓
SQL generator
```

Architecture correcte :

```text
Domain Model
     ↓
Validator
     ↓
MLD Generator
     ↓
SQL Generator
```

React Flow n'est qu'une représentation graphique du modèle.

---

# 28. Structure du projet

```text
src/
├── app/
│
├── components/
│   ├── ui/
│   ├── canvas/
│   ├── inspector/
│   ├── issues/
│   ├── mld/
│   └── sql/
│
├── domain/
│   ├── model.ts
│   ├── entity.ts
│   ├── attribute.ts
│   ├── identifier.ts
│   ├── association.ts
│   └── cardinality.ts
│
├── merise/
│   ├── rules/
│   │   ├── structural/
│   │   ├── semantic/
│   │   └── transformation/
│   ├── validator.ts
│   └── normalization.ts
│
├── mld/
│   ├── model.ts
│   └── generator.ts
│
├── sql/
│   ├── model.ts
│   └── postgres.ts
│
├── editor/
│   ├── nodes/
│   ├── edges/
│   └── commands/
│
├── store/
│   └── project-store.ts
│
└── persistence/
    ├── local-storage.ts
    └── project-file.ts
```

---

# 29. Zustand

State global :

```ts
type ProjectState = {
  project: Project
  selectedElementId?: string
  issues: ValidationIssue[]
  ignoredIssues: string[]
  history: HistoryState
}
```

Le store doit gérer :

- création ;
    
- suppression ;
    
- modification ;
    
- sélection ;
    
- undo ;
    
- redo ;
    
- validation.
    

---

# 30. Command pattern pour l'édition

Au lieu de modifier directement partout :

```ts
updateEntity(...)
```

privilégier des commandes :

```ts
createEntity()
renameEntity()
deleteEntity()
addAttribute()
removeAttribute()
createAssociation()
updateCardinality()
```

Cela simplifie fortement :

```text
Undo
Redo
History
Testing
```

---

# 31. Interface principale

Structure cible :

```text
┌──────────────────────────────────────────────────────────────┐
│ Logo │ Projet │ Fichier │ Édition │ Affichage                │
├──────────────────────────────────────────────────────────────┤
│ + Entité │ + Association │ Vérifier │ Undo │ Redo │ Export   │
├──────────────┬───────────────────────────────────┬───────────┤
│              │                                   │           │
│   Projet     │                                   │ Inspector │
│              │                                   │           │
│ Entités      │              CANVAS               │           │
│ Associations │                                   │           │
│              │                                   │           │
│ Problèmes    │                                   │           │
│              │                                   │           │
├──────────────┴───────────────────────────────────┴───────────┤
│ 3 problèmes │ MLD │ SQL                                    │
└──────────────────────────────────────────────────────────────┘
```

---

# 32. Canvas

Le canvas doit supporter :

- pan ;
    
- zoom ;
    
- sélection ;
    
- multi-sélection ;
    
- drag ;
    
- connexion ;
    
- suppression ;
    
- duplication ;
    
- auto-focus ;
    
- raccourcis clavier.
    

React Flow fournit déjà les primitives adaptées à ce type d'éditeur. ([GitHub](https://github.com/xyflow/xyflow?utm_source=chatgpt.com "GitHub - xyflow/xyflow: React Flow | Svelte Flow - Powerful open source libraries for building node-based UIs with React (https://reactflow.dev) or Svelte (https://svelteflow.dev). Ready out-of-the-box and infinitely customizable. · GitHub"))

---

# 33. Custom node Entité

Exemple visuel :

```text
┌─────────────────────────┐
│ CLIENT                  │
├─────────────────────────┤
│ 🔑 id_client            │
│    nom                  │
│    prenom               │
│    email                │
└─────────────────────────┘
```

Le nom est bien visible.

L'identifiant doit être visuellement distinct.

---

# 34. Association graphique

Exemple :

```text
CLIENT                       COMMANDE
┌────────┐                  ┌────────┐
│        │                  │        │
└────────┘                  └────────┘
      \                      /
       \  0,N       1,1    /
        ───── COMMANDER ───
```

Le nom de l'association doit rester visible.

---

# 35. Inspector

Quand l'utilisateur sélectionne une entité :

```text
ENTITÉ

Nom
[ CLIENT ]

Identifiants
☑ id_client

Propriétés

id_client
nom
prenom
email

[+ Ajouter une propriété]
```

Quand il sélectionne une association :

```text
ASSOCIATION

Nom
[ COMMANDER ]

Participant 1
CLIENT
0,N

Participant 2
COMMANDE
1,1

Propriétés
[+ Ajouter]
```

---

# 36. Création rapide

Créer une entité :

```text
+ Entité
```

crée immédiatement :

```text
ENTITY_1
# id
```

Le développeur ne doit pas faire un wizard complexe.

L'utilisateur peut renommer ensuite.

Créer une association :

```text
+ Association
→ entité A
→ entité B
```

puis édition inline du nom/cardinalités.

---

# 37. Validation en temps réel

Chaque modification :

```text
Model changed
    ↓
validate()
    ↓
issues[]
```

Le panneau inférieur indique :

```text
✓ Modèle valide
```

ou :

```text
🔴 2 erreurs   🟠 1 avertissement
```

Pas besoin d'un bouton "compiler" obligatoire.

Le bouton `Vérifier` existe néanmoins pour une validation explicite.

---

# 38. UX pédagogique

Chaque règle possède :

```text
Identifiant
Titre
Explication
Exemple
Correction éventuelle
```

Exemple :

```text
MERISE-E002

Entité sans identifiant

Pourquoi ?
Chaque occurrence d'une entité doit pouvoir être distinguée
des autres.

Correction :
Ajoutez une propriété identifiante à CLIENT.
```

Le système doit expliquer **la règle**, pas seulement dire :

```text
Invalid.
```

---

# 39. Auto-correction

Uniquement pour les corrections sûres.

Exemple :

```text
Attribut sans nom
[Ajouter un nom]
```

Mais ne jamais faire automatiquement :

```text
"Je pense que cette entité devrait être supprimée."
```

Les transformations métier doivent rester sous contrôle de l'utilisateur.

---

# 40. Persistance

Le projet doit être exportable dans un fichier :

```text
my-project.merise.json
```

Exemple :

```json
{
  "version": 1,
  "name": "Bibliotheque",
  "entities": [],
  "associations": [],
  "ignoredRules": [],
  "view": {}
}
```

`view` contient uniquement les informations d'affichage :

```json
{
  "position": {
    "x": 500,
    "y": 300
  }
}
```

La séparation est importante :

```text
domain model
≠
canvas state
```

---

# 41. Local storage

Auto-save :

```text
localStorage
```

avec un debounce.

Exemple :

```text
project:last-opened
```

Le produit doit fonctionner sans aucune connexion réseau après chargement.

---

# 42. Import/export

### Export

```text
.merise.json
.sql
.svg
.png
```

### Import

```text
.merise.json
```

Pas d'import SQL pour le MVP.

---

# 43. Gestion de l'état GitHub Pages

Il n'y a aucun backend.

```text
Browser
│
├── React
├── Validator
├── MLD Generator
├── SQL Generator
└── LocalStorage
```

Tout tourne localement.

GitHub Pages ne sert qu'à distribuer le frontend construit.

Vite documente actuellement le déploiement via GitHub Actions, avec `dist` comme artefact et `base: '/<REPO>/'` lorsque l'application est publiée sous `https://username.github.io/repository/`. ([vitejs](https://vite.dev/guide/static-deploy.html?utm_source=chatgpt.com "Deploying a Static Site | Vite"))

---

# 44. Tests obligatoires

Le moteur MERISE doit être test-first.

## Tests unitaires

Minimum :

```text
Entity
Attribute
Identifier
Association
Cardinality
```

---

## Tests de règles

Chaque règle :

```text
valid model
invalid model
warning model
ignored issue
```

---

## Tests MLD

Créer des fixtures :

```text
1:N
0,1 ↔ 1,1
N:N
N:N + properties
1:1
reflexive
composite identifier
```

---

# 45. Fixtures de référence

Le dépôt doit contenir au minimum :

```text
fixtures/
├── simple-entity.json
├── one-to-many.json
├── many-to-many.json
├── one-to-one.json
├── reflexive.json
├── association-properties.json
├── composite-key.json
└── invalid-model.json
```

Chaque fixture doit être transformée en résultat attendu.

---

# 46. Critères d'acceptation MVP

Le MVP est considéré comme terminé lorsqu'un utilisateur peut réaliser sans intervention extérieure :

### Cas 1

Créer :

```text
CLIENT
COMMANDE
```

avec :

```text
CLIENT 0,N
COMMANDE 1,1
```

et obtenir une FK correcte.

### Cas 2

Créer :

```text
ETUDIANT
COURS
INSCRIPTION
```

avec une relation N:N et obtenir une table associative correcte.

### Cas 3

Ajouter des propriétés à une association et les retrouver dans la relation MLD.

### Cas 4

Créer une entité sans identifiant et recevoir immédiatement :

```text
MERISE-E002
```

avec explication.

### Cas 5

Ignorer une warning et conserver cet état dans le fichier projet.

### Cas 6

Exporter le modèle en `.merise.json`.

### Cas 7

Exporter le modèle en `.sql`.

### Cas 8

Recharger le `.merise.json` dans le navigateur et retrouver :

- le modèle ;
    
- les positions ;
    
- les associations ;
    
- les propriétés ;
    
- les règles ignorées.
    

---

# 47. Definition of Done

Une feature n'est terminée que si :

```text
✓ TypeScript compile
✓ test unitaire
✓ validation métier
✓ UI fonctionnelle
✓ undo/redo
✓ sauvegarde
✓ import/export
✓ pas de dépendance serveur
```

Pour les règles MERISE :

```text
✓ identifiant
✓ cardinalité
✓ association
✓ transformation
✓ message pédagogique
```

---

# 48. Roadmap V1.1 / V2

Après le MVP seulement :

### MERISE avancé

- associations n-aires ;
    
- contraintes d'exclusion ;
    
- partition ;
    
- totalisation ;
    
- CIF ;
    
- héritage ;
    
- identifiants relatifs ;
    
- contraintes temporelles ;
    
- contraintes métier plus riches.
    

Les contraintes de partition/exclusion apparaissent notamment dans les ressources MERISE consultées, ce qui confirme qu'elles appartiennent à un périmètre plus large que le noyau binaire du MVP. ([Scribd](https://es.scribd.com/document/681565498/Merise-Mcd-1?utm_source=chatgpt.com "Modélisation MERISE : MCD et outils gratuits | PDF | Génie logiciel | Développement de logiciel"))

### SQL

- MySQL ;
    
- SQLite ;
    
- autres dialectes ;
    
- types physiques avancés ;
    
- `UNIQUE` ;
    
- indexes ;
    
- `CHECK` ;
    
- stratégies de génération configurables.
    

### Productivité

- auto-layout ;
    
- mini-map améliorée ;
    
- recherche ;
    
- palette de commandes ;
    
- duplication intelligente ;
    
- templates de modèles.
    

### Import

- SQL → MLD ;
    
- MLD → MCD ;
    
- reverse engineering.
    

---

# 49. Priorité de développement

Je recommande cet ordre **exact**.

```text
P0-01  Domain model
P0-02  Cardinalities
P0-03  Entities / attributes / identifiers
P0-04  Associations
P0-05  Validator
P0-06  MLD generator
P0-07  SQL generator
P0-08  Tests du moteur
P0-09  React Flow canvas
P0-10  Inspector
P0-11  Issues panel
P0-12  Undo/redo
P0-13  Local persistence
P0-14  Import/export
P0-15  MLD/SQL panels
P0-16  GitHub Pages deployment
```

**Ne pas commencer par le canvas.**

Le moteur métier est le cœur du produit.

---

# 50. Décisions techniques finales

|Sujet|Décision|
|---|---|
|Framework|React|
|Langage|TypeScript|
|Build|Vite|
|UI|shadcn/ui + Tailwind|
|Diagramme|`@xyflow/react`|
|State management|Zustand|
|Backend|Aucun|
|Persistence|localStorage + fichier JSON|
|Hosting|GitHub Pages|
|Format projet|`.merise.json`|
|MCD|Oui|
|MLD|Oui|
|SQL|Oui|
|SQL dialecte MVP|PostgreSQL|
|Undo/redo|Oui|
|Validation temps réel|Oui|
|Ignore rules|Oui|
|Collaboration|Non|
|Auth|Non|
|Import SQL|Non|
|Héritage MERISE avancé|V2|
|CIF|V2|
|N-aires|V2|

---

# 51. Règle d'or du projet

Le développeur doit garder cette séparation partout :

```text
             ┌──────────────────┐
             │   DOMAIN MODEL   │
             │      MERISE      │
             └────────┬─────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
 ┌─────────────────┐     ┌─────────────────┐
 │  VALIDATOR      │     │  MLD GENERATOR  │
 └─────────────────┘     └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ SQL GENERATOR   │
                         └─────────────────┘


              DOMAIN MODEL
                   │
                   ▼
            ┌──────────────┐
            │  REACT FLOW  │
            │    VIEW      │
            └──────────────┘
```

**React Flow représente le modèle. Il ne le définit pas.**

C'est la décision d'architecture la plus importante de toute la spécification.

---

## Vérification finale

Le cadrage vérifié corrige également deux points de la réponse précédente :

**1. "Chaque règle MERISE"**  
Pour être techniquement honnête, le MVP couvre le **noyau MERISE MCD + règles fondamentales de passage MLD**, pas l'intégralité des extensions MERISE. Les contraintes avancées existent bien et sont repoussées explicitement en V2. ([Scribd](https://es.scribd.com/document/681565498/Merise-Mcd-1?utm_source=chatgpt.com "Modélisation MERISE : MCD et outils gratuits | PDF | Génie logiciel | Développement de logiciel"))

**2. `@xyflow/react` + Vite + shadcn/ui**  
Le choix reste pertinent et actuel : React Flow est maintenu, MIT, et conçu pour les interfaces node-based ; shadcn/ui supporte officiellement Vite ; Vite documente le déploiement statique GitHub Pages. ([GitHub](https://github.com/xyflow/xyflow?utm_source=chatgpt.com "GitHub - xyflow/xyflow: React Flow | Svelte Flow - Powerful open source libraries for building node-based UIs with React (https://reactflow.dev) or Svelte (https://svelteflow.dev). Ready out-of-the-box and infinitely customizable. · GitHub"))

Ce document peut donc servir de **specification fonctionnelle et technique de référence pour commencer le développement du MVP sans élargir le scope en cours de route**.
