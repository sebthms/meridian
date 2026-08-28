# La méthode MERISE — Règles et bonnes pratiques de conception

## Sommaire

1. [Présentation générale](#1-présentation-générale)
2. [Les trois niveaux de modélisation](#2-les-trois-niveaux-de-modélisation)
3. [Les règles de gestion](#3-les-règles-de-gestion)
4. [Le Modèle Conceptuel des Données (MCD)](#4-le-modèle-conceptuel-des-données-mcd)
5. [Règles de construction et bonnes pratiques du MCD](#5-règles-de-construction-et-bonnes-pratiques-du-mcd)
6. [Le passage du MCD au MLD](#6-le-passage-du-mcd-au-mld)
7. [Le Modèle Physique des Données (MPD)](#7-le-modèle-physique-des-données-mpd)
8. [Le volet traitements : MCT / MOT](#8-le-volet-traitements--mct--mot)
9. [Normalisation (1FN, 2FN, 3FN, BCNF)](#9-normalisation-1fn-2fn-3fn-bcnf)
10. [Erreurs fréquentes à éviter](#10-erreurs-fréquentes-à-éviter)
11. [Checklist de validation d'un modèle](#11-checklist-de-validation-dun-modèle)
12. [Outils courants](#12-outils-courants)
13. [Merise aujourd'hui : limites et complémentarité avec UML](#13-merise-aujourdhui--limites-et-complémentarité-avec-uml)

---

## 1. Présentation générale

MERISE est une méthode française d'analyse et de conception des systèmes d'information (SI), apparue à la fin des années 1970 à la demande du Ministère de l'Industrie et développée par le Centre Technique d'Informatique (CTI). Elle reste très utilisée dans les pays francophones, notamment dans l'enseignement, le secteur public et les projets nécessitant une forte traçabilité documentaire.

**Principe fondateur : la séparation des données et des traitements.**

- La vue **données** décrit *ce que le système mémorise* (entités, propriétés, relations).
- La vue **traitements** décrit *ce que le système fait* (processus, événements, opérations).

Ces deux vues sont modélisées séparément puis mises en correspondance, ce qui permet de gérer des projets complexes de façon structurée et descendante (du plus abstrait vers le plus concret).

---

## 2. Les trois niveaux de modélisation

Merise organise la conception en trois niveaux d'abstraction, souvent appelés le **cycle d'abstraction** :

| Niveau | Question posée | Modèle Données | Modèle Traitements |
|---|---|---|---|
| **Conceptuel** | QUOI ? (quelles données, quelle logique métier) | MCD (Modèle Conceptuel des Données) | MCT (Modèle Conceptuel des Traitements) |
| **Organisationnel / Logique** | QUI ? OÙ ? QUAND ? (organisation, acteurs, contraintes) | MLD (Modèle Logique des Données) | MOT (Modèle Organisationnel des Traitements) |
| **Physique** | COMMENT ? AVEC QUOI ? (technologie, SGBD, matériel) | MPD (Modèle Physique des Données) | MOpT / programmes (Modèle Opérationnel des Traitements) |

Le niveau **conceptuel** est totalement indépendant de toute contrainte technique ou organisationnelle : c'est le contrat métier. Le niveau **logique** introduit les choix relatifs au type de SGBD (relationnel, dans la grande majorité des cas). Le niveau **physique** est propre à un SGBD précis (MySQL, PostgreSQL, Oracle, SQL Server…).

---

## 3. Les règles de gestion

Avant toute modélisation, il faut recueillir les **règles de gestion (RG)** : ce sont les contraintes métier exprimées par les utilisateurs et les experts du domaine.

**Bonnes pratiques :**

- Les règles de gestion sont rarement formulées clairement par les utilisateurs : c'est à l'analyste de les **expliciter, reformuler et faire valider**.
- Numéroter chaque règle (RG1, RG2, RG3…) pour pouvoir la tracer jusqu'au modèle.
- Formuler chaque règle de façon **atomique** (une seule contrainte par règle) et **vérifiable**.
- Distinguer les règles qui concernent :
  - la **structure des données** (ex. : « un client possède une seule adresse de facturation ») → impacte le MCD ;
  - les **traitements** (ex. : « une commande ne peut être validée que si le stock est suffisant ») → impacte le MCT.

*Exemple de règles de gestion (contexte location de matériel) :*
- RG1 : Toute location porte sur une durée d'au moins une semaine.
- RG2 : Une location concerne un ou plusieurs matériels.
- RG3 : Un client peut effectuer plusieurs locations.

---

## 4. Le Modèle Conceptuel des Données (MCD)

Le MCD est une représentation graphique et abstraite des données du SI, indépendante de toute solution technique. Il repose sur le formalisme **Entité-Association** (ou Entité-Relation).

### 4.1 Concepts de base

| Concept | Définition |
|---|---|
| **Entité** | Objet (concret ou abstrait) du monde réel qui présente un intérêt pour la gestion (ex. : CLIENT, PRODUIT, COMMANDE). |
| **Propriété (attribut)** | Information élémentaire décrivant une entité ou une association (ex. : nom, prénom, date de naissance). |
| **Identifiant (clé)** | Propriété ou groupe de propriétés qui permet de désigner de façon unique chaque occurrence d'une entité. |
| **Association (relation)** | Lien sémantique entre deux ou plusieurs entités (ex. : PASSER entre CLIENT et COMMANDE). |
| **Cardinalité** | Couple (min, max) qui précise combien de fois une occurrence d'entité participe à une association. |
| **Occurrence** | Une instance concrète d'une entité ou d'une association. |

### 4.2 Les cardinalités

La cardinalité s'exprime toujours du point de vue de l'entité vers l'association, sous la forme **(min, max)** :

- **Minimale** : 0 ou 1 → nombre minimum de fois qu'une occurrence de l'entité participe à l'association.
- **Maximale** : 1 ou n → nombre maximum de fois qu'une occurrence de l'entité participe à l'association.

Combinaisons usuelles : `(0,1)`, `(1,1)`, `(0,n)`, `(1,n)`.

*Exemple :* un CLIENT (0,n) PASSE (1,1) une COMMANDE
→ un client peut passer zéro à plusieurs commandes ; une commande est passée par un et un seul client.

### 4.3 Types d'associations

- **Binaire** : relie exactement deux entités (le cas le plus courant).
- **Ternaire (ou n-aire)** : relie trois entités ou plus. À manier avec précaution (voir bonnes pratiques ci-dessous).
- **Réflexive (cyclique)** : relie une entité à elle-même (ex. : EMPLOYÉ « encadre » EMPLOYÉ).
- **Porteuse de propriétés** : une association peut elle-même avoir des attributs (ex. : l'association COMMANDER entre CLIENT et PRODUIT porte la `quantité` et le `prix unitaire`).

### 4.4 Notions avancées

- **Héritage / spécialisation** : une entité générique (mère) peut se décliner en sous-entités (filles) qui héritent de ses propriétés et identifiant, tout en ajoutant leurs propres attributs (ex. : PERSONNE → CLIENT / FOURNISSEUR).
- **Contraintes d'intégrité fonctionnelle (CIF)** : une association dont une des entités a systématiquement une cardinalité maximale de 1 (ex. : une COMMANDE est passée par un et un seul CLIENT).
- **Historisation** : notée par un `(H)` sur la propriété concernée, elle indique que l'on souhaite conserver l'historique des valeurs prises par cet attribut.

---

## 5. Règles de construction et bonnes pratiques du MCD

### 5.1 Règles strictes (à respecter impérativement)

1. **Chaque entité doit avoir un identifiant** dont la valeur est unique pour chaque occurrence, jamais nulle, et stable (non modifiable dans le temps).
2. **Une propriété appartient à une seule entité** (sauf les clés étrangères qui n'existent pas au niveau conceptuel — elles n'apparaissent qu'au MLD).
3. **Aucune propriété calculée** ne doit figurer dans le MCD (ex. : ne pas stocker un « âge » calculable à partir de la date de naissance, ni un « montant total » calculable à partir des lignes de commande). Exception tolérée : lorsque la donnée calculée facilite fortement un usage récurrent (ex. : date de retour prévue) — à documenter explicitement.
4. **Pas de redondance d'information** : une même donnée ne doit être mémorisée qu'à un seul endroit.
5. **Toute propriété doit dépendre de l'identifiant complet de son entité** (voir dépendances fonctionnelles, section 9).
6. **Une association n'a pas d'identifiant propre** (sauf cas particulier justifiant sa transformation en entité).

### 5.2 Bonnes pratiques de conception

- **Nommer clairement** : entités au singulier et en majuscules (CLIENT, PRODUIT), associations sous forme de verbe à l'infinitif ou au participe (PASSER, COMPORTER, INSCRIRE).
- **Rester au niveau conceptuel** : ne jamais parler de « table », « clé primaire » ou « clé étrangère » dans le MCD — ces notions relèvent du MLD. Le MCD modélise le discours métier, pas une solution technique.
- **Valider systématiquement les cardinalités avec les experts métier** : la différence entre `(0,n)` et `(1,n)` a un impact direct et souvent sous-estimé sur les contraintes (NULL/NOT NULL, obligation de saisie) au niveau logique.
- **Éviter les associations ternaires quand c'est possible** : elles compliquent la lecture et la transformation en MLD. Vérifier si l'association ne peut pas être décomposée en associations binaires, ou si une des cardinalités n'est pas en réalité une CIF déguisée.
- **Limiter la profondeur des relations réflexives** et bien vérifier leur cardinalité (ex. hiérarchie manager/employé).
- **Garder le modèle lisible** : un bon MCD est un modèle simple, centré sur les besoins réels, pas un inventaire exhaustif de tout ce qui pourrait exister.
- **Itérer avec les utilisateurs** : présenter le MCD sous une forme compréhensible par des non-informaticiens, car c'est un outil de dialogue autant qu'un livrable technique.
- **Documenter chaque règle de gestion traduite** dans le modèle, pour assurer la traçabilité RG → MCD.
- **Ne pas anticiper l'implémentation** (index, types SQL précis, partitionnement) : cela relève du MPD.

---

## 6. Le passage du MCD au MLD

Le **Modèle Logique des Données (MLD)** — ou MLDR (relationnel) — traduit le MCD en un formalisme proche des tables relationnelles, tout en restant indépendant d'un SGBD précis.

### 6.1 Règles de transformation (à connaître par cœur)

**Règle 1 — Toute entité devient une table (relation).**
Chaque propriété de l'entité devient une colonne ; l'identifiant devient la clé primaire.

**Règle 2 — Association de type (0,n)/(1,n) ↔ (0,1)/(1,1) (relation « père-fils » ou CIF) :**
La clé primaire de l'entité côté « 1 » migre comme **clé étrangère** dans la table de l'entité côté « n ». Aucune table n'est créée pour l'association. Les propriétés éventuelles de l'association migrent dans la table côté « n ».

**Règle 3 — Association de type (0,n)/(1,n) ↔ (0,n)/(1,n) (plusieurs-à-plusieurs) :**
L'association devient **une table à part entière**, dont la clé primaire est la concaténation des clés primaires des entités reliées (clé composée). Les propriétés de l'association deviennent des colonnes de cette nouvelle table.

**Règle 4 — Association de type (0,1)/(1,1) ↔ (0,1)/(1,1) (un-à-un) :**
La clé primaire d'une des deux entités migre en clé étrangère dans l'autre (le choix se fait selon le sens métier, ex. l'entité optionnelle reçoit la clé de l'entité obligatoire), ou, plus rarement, les deux tables partagent la même clé primaire.

**Association ternaire (ou n-aire) :**
Devient systématiquement une table à part, avec pour clé primaire la concaténation des clés des entités participantes (comme la règle 3, généralisée à n entités).

### 6.2 Conventions de notation du MLD

- Clé primaire : soulignée ou indiquée en premier.
- Clé étrangère : préfixée par `#` (convention courante en formalisme Merise texte) — ex. `#NumClient`.
- Une table s'écrit sous la forme :
  `NOMTABLE (clé_primaire, attribut1, attribut2, #clé_étrangère)`

### 6.3 Bonnes pratiques du passage MCD → MLD

- Appliquer les règles de transformation **de façon systématique et méthodique**, sans improviser, avant d'écrire la moindre ligne de SQL.
- Vérifier qu'**aucune information n'est perdue** dans la transformation (toutes les propriétés et cardinalités du MCD doivent se retrouver dans le MLD).
- Contrôler la **cohérence des clés étrangères** : chaque FK doit référencer une PK existante.
- Profiter de cette étape pour **normaliser** (voir section 9) si des anomalies apparaissent.
- Documenter les choix faits pour les associations 1-1 (quelle entité reçoit la clé étrangère et pourquoi).

---

## 7. Le Modèle Physique des Données (MPD)

Le MPD est la dernière étape avant le code SQL : il adapte le MLD aux spécificités du SGBD cible.

**Éléments définis au niveau physique :**

- Types de données précis et propres au SGBD (`VARCHAR(255)`, `INT`, `DATE`, `DECIMAL(10,2)`…).
- Contraintes d'intégrité (`NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY ... ON DELETE/ON UPDATE`).
- Index, pour optimiser les performances de lecture.
- Vues, partitionnement, éventuellement dénormalisation contrôlée pour des raisons de performance.

**Bonnes pratiques :**

- Ne dénormaliser qu'en toute connaissance de cause, et documenter pourquoi (perf, reporting…).
- Nommer les contraintes et index explicitement (facilite la maintenance).
- Prévoir les index sur les clés étrangères et les colonnes fréquemment filtrées/jointes.
- Vérifier la cohérence des types entre colonnes liées par une clé étrangère.

---

## 8. Le volet traitements : MCT / MOT

Si le MCD/MLD décrivent les données statiques, le pendant traitements décrit **la dynamique** du système :

- **MCT (Modèle Conceptuel des Traitements)** : modélise les processus métier, les événements déclencheurs et les opérations (créer, consulter, modifier, supprimer), indépendamment de l'organisation.
- **MOT (Modèle Organisationnel des Traitements)** : ajoute le QUI (acteurs/postes), le OÙ (lieux) et le QUAND (chronologie, synchronisation) des traitements.

**Bonne pratique :** garder le MCT synchronisé avec le MCD — chaque opération du MCT doit s'appuyer sur des entités/associations effectivement présentes dans le MCD, et réciproquement chaque entité doit être créée, consultée ou modifiée par au moins un traitement.

---

## 9. Normalisation (1FN, 2FN, 3FN, BCNF)

La normalisation garantit un modèle sans redondance et sans anomalies de mise à jour. Elle s'applique en particulier lors du passage au MLD.

| Forme normale | Condition |
|---|---|
| **1FN** (Première Forme Normale) | Chaque attribut contient une valeur atomique (pas de liste, pas de valeurs répétées dans une même colonne) et il existe une clé primaire. |
| **2FN** (Deuxième Forme Normale) | Respecte la 1FN, et chaque attribut non-clé dépend de **la totalité** de la clé primaire (pas de dépendance partielle, pertinent surtout pour les clés composées). |
| **3FN** (Troisième Forme Normale) | Respecte la 2FN, et aucun attribut non-clé ne dépend d'un autre attribut non-clé (pas de dépendance transitive). |
| **BCNF** (Boyce-Codd) | Version renforcée de la 3FN : chaque déterminant (attribut dont dépend un autre attribut) doit être une clé candidate. |

**Bonne pratique :** viser au minimum la 3FN pour toute base transactionnelle (OLTP). Une dénormalisation volontaire peut être envisagée ensuite, au niveau physique uniquement, pour des besoins spécifiques de performance (reporting, data warehouse).

---

## 10. Erreurs fréquentes à éviter

- ⚠️ Introduire des notions de tables/clés étrangères dès le MCD (confusion des niveaux).
- ⚠️ Stocker des données calculées dans le MCD (âge, total, solde…) sans justification documentée.
- ⚠️ Cardinalités mal validées avec le métier (confusion `0,n` / `1,n`).
- ⚠️ Identifiants non stables (ex. utiliser un nom ou un numéro de téléphone comme identifiant).
- ⚠️ Associations ternaires utilisées par facilité alors qu'elles cachent en réalité deux associations binaires.
- ⚠️ Oublier de transcrire une règle de gestion dans le modèle (ou l'inverse : ajouter une contrainte non demandée).
- ⚠️ Dupliquer une information dans plusieurs entités « pour aller plus vite ».
- ⚠️ MCD trop complexe, avec des entités techniques n'ayant pas de sens métier.
- ⚠️ Oublier de vérifier que le MLD final respecte au moins la 3FN.

---

## 11. Checklist de validation d'un modèle

- [ ] Chaque règle de gestion est identifiée, numérotée et tracée jusqu'au modèle.
- [ ] Chaque entité possède un identifiant unique, stable, jamais nul.
- [ ] Aucune propriété calculée ne figure dans le MCD (sauf exception justifiée et documentée).
- [ ] Toutes les cardinalités ont été validées avec les utilisateurs/métier.
- [ ] Aucune redondance d'information entre entités.
- [ ] Les associations ternaires ont été questionnées / justifiées.
- [ ] Le passage au MLD applique strictement les 4 règles de transformation.
- [ ] Le MLD est au minimum en 3FN.
- [ ] Les clés étrangères du MLD référencent des clés primaires existantes.
- [ ] Le MPD précise types, contraintes et index adaptés au SGBD cible.
- [ ] Le modèle reste lisible et compréhensible par un non-informaticien.

---

## 12. Outils courants

| Outil | Type | Usage |
|---|---|---|
| **Looping** | Gratuit | Bon pour démarrer, MCD simple |
| **PowerAMC (SAP)** | Payant | Outil professionnel complet MCD/MLD/MPD |
| **Win'Design** | Payant | Outil français dédié à Merise |
| **draw.io / diagrams.net** | Gratuit | Diagrammes libres, flexible pour projets pro |
| **AnalyseSI / JMerise / OpenModelSphere** | Gratuit | Outils historiques dédiés à Merise |

---

## 13. Merise aujourd'hui : limites et complémentarité avec UML

Merise reste enseignée et utilisée, en particulier en France, notamment dans le secteur public, l'assurance et les projets où la documentation et la traçabilité sont exigées. Cependant :

- Merise est **orientée données relationnelles** et se prête moins bien à la modélisation orientée objet ou aux architectures modernes (microservices, NoSQL).
- **UML** (avec les diagrammes de classes, notamment) tend à remplacer Merise dans les projets orientés objet ou agiles, en particulier en dehors de la sphère francophone.
- Dans la pratique actuelle, il est courant d'utiliser **Merise pour la conception de la base de données** (MCD/MLD/MPD) tout en utilisant **UML pour la modélisation applicative** (cas d'usage, séquence, classes).

**Bonne pratique actuelle :** ne pas opposer les deux méthodes — s'appuyer sur Merise pour sa rigueur en conception de données relationnelles, et sur UML/agilité pour la dynamique applicative et les architectures modernes.

---

*Document de référence rédigé à partir de sources pédagogiques et techniques sur la méthode Merise (2012–2026).*
