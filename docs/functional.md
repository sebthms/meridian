# Documentation fonctionnelle

Éditeur navigateur : MCD → validation MERISE → MLD relationnel → SQL PostgreSQL. Sans compte, sans backend. Méthode générale : [merise.md](merise.md).

## Premier lancement

Un diagramme doit être créé (vide ou modèle). Les modèles : blog, boutique, CRM, bibliothèque, scolarité, RH. Ils ne contiennent pas de colonnes FK dans le MCD.

## Espace de travail

Dock bas : vues MCD, UML, MLD ; ajout d’entité, association, héritage, contrainte, CIF, règle métier ; annuler / rétablir.

Sidebar : validation, bibliothèque de diagrammes, arborescence, script SQL, paramètres (thème, palettes, vidage local).

Premier clic sur un nœud le sélectionne. Double-clic (ou crayon) sur un concept ouvre sa modale. Renommage inline des entités et associations.

## Modèle éditable

Le MCD est la source de vérité. Types SQL physiques absents du canvas conceptuel.

- Entité : nom, propriétés, identifiants, position.
- Propriété : nom, libellé métier, type conceptuel (`TEXT`, `INTEGER`, `DECIMAL`, `DATE`, `BOOLEAN`), nullable, unique, description, configuration de type optionnelle.
- Identifiant : liste ordonnée de propriétés ; un identifiant principal, les autres deviennent UNIQUE en SQL.
- Association binaire ou réflexive : participants, cardinalités `0,1` · `1,1` · `0,N` · `1,N`, propriétés d’association, position.
- Héritage : parent, enfants, couverture (totale / partielle), exclusivité (exclusive / chevauchement).
- Contrainte graphique : exclusion, totalité, partition, inclusion, simultanéité, personnalisée.
- CIF : source, cible, association porteuse optionnelle (la cible doit déjà être en `0,1` ou `1,1` dans le MCD).
- Règle métier : description obligatoire, niveau info / avertissement / erreur, objets concernés.

Hors périmètre de l’éditeur : associations n-aires éditables, CIM, temporalité, MCT/MOT, 3FN formelle, autres dialectes SQL, reverse engineering.

## Propriétés et types

Le formulaire (ajout / modification) impose un nom valide. Identifiant d’entité : NOT NULL, pas UNIQUE, ordre dans la clé. Sur une association, pas d’identifiant.

Familles de type : texte, numérique, date/heure, autre (booléen, XML, géométrique, géographique, type PostgreSQL libre).

Un fragment libre invalide est refusé (pas de remplacement silencieux par TEXT). Compteur → `BIGSERIAL` à la source, `BIGINT` sur les FK. Géométrie / géographie → PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis`).

Renommer ou commenter une propriété **sans changer le type** conserve la configuration historique. Changer le type applique la configuration du formulaire.

Décoche Identifiant : la propriété quitte ses clés ; les autres identifiants restent. Si plusieurs clés, le formulaire permet de choisir laquelle ordonner. L’ordre vient de `Identifier.attributeIds`, pas de l’ordre visuel des lignes.

## Vues

- MCD : pastilles d’association, cardinalités MERISE.
- UML : mêmes objets, cardinalités `min..max`.
- MLD : tables et FK dérivées ; pastille seulement s’il existe une table associative.

Cardinalités : clic sur l’arête, quatre formes. Connexion canvas : glisser entre nœuds, commandes pures `editor/connect.ts`.

## Validation et SQL

Validation à chaque modification. Erreurs (E001–E012, E016–E017, E020–E028, BR001 si règle `error`) bloquent l’export SQL. Avertissements et infos n’empêchent pas l’export.

On peut ignorer une occurrence ou une règle entière (persisté dans le projet). Réafficher via le panneau validation.

Le SQL est PostgreSQL : tables puis `ALTER TABLE` pour les FK. Héritage, contraintes, CIF et règles métier apparaissent en commentaires MLD/SQL, sans tables inventées. Une règle métier `error` bloque comme une erreur de validation.

## Persistance

Bibliothèque multi-diagrammes dans `localStorage` (`merise:projects`). Ancienne clé `merise:project:last-opened` migrée seulement si la bibliothèque est vide. Fichier `.merise.json` version 1. Historique undo/redo borné à 100, local au projet ouvert.

Comportements connus, non corrigés :

- Undo/redo met à jour le projet affiché et la clé historique, pas la bibliothèque comme une édition normale. Une réouverture peut restaurer un autre état.
- Une erreur de quota peut laisser le statut « enregistré » alors que rien n’a été écrit.
- Les cibles des modales peuvent survivre à un changement de projet.
- Raccourcis annoncés, accessibilité des modales et règles ignorables restent imparfaits.
