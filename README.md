# MERISE Diagrams

Éditeur web de modèles de données MERISE. Conception d'un MCD, validation selon les règles MERISE, transformation automatique en MLD relationnel puis en SQL PostgreSQL. 

**[Démo en ligne](https://sebeboo.github.io/merise-diagrams/)**

---

## Fonctionnement

```
MCD (canvas)
  ↓  validation en temps réel
Règles MERISE
  ↓
MLD relationnel
  ↓
SQL PostgreSQL (prévisualisable et exportable)
```

- Les **erreurs** bloquent la génération et l’export SQL.
- Les **warnings** signalent des choix de conception discutables.
- Le MLD et le SQL se mettent à jour au fil des modifications.

## Fonctionnalités principales

- Vues MCD, UML et MLD sur un canvas interactif.
- Entités et associations binaires ou réflexives, cardinalités `0,1`, `1,1`, `0,N`, `1,N`.
- Héritage (couverture / exclusivité), contraintes, CIF (si le MCD a déjà une association à max cible 1), règles métier.
- Propriétés avec types conceptuels, identifiants, nullabilité, unicité et configuration de type.
- Modèles de départ (blog, boutique, CRM, bibliothèque, scolarité, RH).
- Arborescence, validation, SQL PostgreSQL, undo/redo, bibliothèque locale multi-diagrammes.


## Commandes

```bash
pnpm install
pnpm dev           # http://localhost:5173
pnpm lint          # ESLint React/TypeScript
pnpm test
pnpm typecheck     # vérification de types
pnpm build         # build de production → dist/
pnpm preview       # prévisualiser le build
```

## Stack technique

| Domaine       | Technologie |
|---------------|-------------|
| Framework     | React 19 + TypeScript |
| Build         | Vite 8 |
| UI            | Tailwind CSS + shadcn/ui |
| Canvas        | @xyflow/react (React Flow) |
| State         | Zustand |
| Tests         | Vitest |
| Hébergement   | GitHub Pages |

## Documentation

Index : [docs/README.md](docs/README.md). Fonctionnel : [docs/functional.md](docs/functional.md). Technique : [docs/technical.md](docs/technical.md). Historique : [docs/changelog.md](docs/changelog.md).

## Licence

Projet privé — tous droits réservés.
