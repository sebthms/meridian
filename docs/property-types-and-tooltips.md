# Types de propriétés et tooltips

## Types

`domain/attribute-type.ts` valide les paramètres à l'import et à l'enregistrement.
La génération SQL utilise la même validation. Un fragment libre invalide est
refusé avec un message ; il n'est jamais remplacé silencieusement par TEXT.
Les types libres peuvent être qualifiés par un schéma, cités, paramétrés avec
des nombres ou suivis de `[]` (ex. `DOUBLE PRECISION`, `public.mon_type`, `TEXT[]`).
Les contraintes et instructions SQL ne sont pas autorisées dans ce champ.

Les anciens attributs sans `typeConfig` gardent leur type SQL historique quand
on modifie uniquement leur nom ou leur commentaire. Tous les contrôles du
formulaire sont réinitialisés à l'ouverture, y compris les familles masquées.

Un compteur génère BIGSERIAL sur sa colonne source et BIGINT sur ses références.
Les types géométrique et géographique génèrent GEOMETRY et GEOGRAPHY : le script
déclare `CREATE EXTENSION IF NOT EXISTS postgis`. PostGIS doit être installé sur
le serveur et l'utilisateur SQL doit avoir le droit d'activer l'extension.

L'ordre d'une clé provient de `Identifier.attributeIds`, pas de l'ordre visuel
des attributs ni du cache historique `identifierOrder`. Pour une propriété dans
plusieurs clés, le formulaire permet de choisir la clé à ordonner. Décocher
Identifiant retire cette propriété de ses clés, sans modifier les autres
identifiants ; la clé restante est promue si la clé principale disparaît.

## Tooltips

Tous les tooltips utilisent `components/ui/tooltip.tsx` (primitives Radix/shadcn).
Un seul `TooltipProvider`, dans `main.tsx`, contrôle le délai (300 ms par défaut).
Son paramètre `contentProps` permet de définir globalement `side`, `align`,
`sideOffset` et `className`. Les mêmes options sont ajustables par tooltip.

Composition conseillée :

```tsx
<AppTooltip content="Modifier" side="top">
  <button aria-label="Modifier" onClick={edit}>…</button>
</AppTooltip>
```

`AppTooltip` prend en charge les boutons désactivés avec un wrapper focalisable.
Pour une composition manuelle, utiliser `TooltipTrigger asChild` pour éviter
les boutons imbriqués. Ne pas ajouter de `title` natif en parallèle. Le contenu
est rendu dans un portail au-dessus des panneaux et suit les couleurs neutres
du thème. Les zooms et le verrouillage React Flow utilisent cette même couche.
