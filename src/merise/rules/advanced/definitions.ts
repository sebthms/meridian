import type { RuleDefinition } from '../../types'

export const MERISE_SOURCE = { label: 'Cours MERISE · Université Paris-Saclay', url: 'https://www.imo.universite-paris-saclay.fr/~benjamin.auder/teachings/bdd/s1_cours.html' }
export const ASSOCIATION_SOURCE = { label: 'Associations · Université de Strasbourg', url: 'https://colibri.unistra.fr/fr/course/practice/concevoir-une-base-de-donnees/creer-un-modele-conceptuel/3646' }
export const SQL_SOURCE = { label: 'Contraintes · PostgreSQL', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html' }

export const ADVANCED_RULES = {
  E013: { id: 'MERISE-E013', severity: 'error', title: 'ID interne vide ou dupliqué', category: 'model', certainty: 'certain', explanation: 'Chaque objet doit avoir un identifiant technique unique.' },
  E014: { id: 'MERISE-E014', severity: 'error', title: 'Identifiant principal ambigu ou absent', category: 'model', certainty: 'certain', explanation: 'Un seul identifiant principal par entité.', source: SQL_SOURCE },
  E015: { id: 'MERISE-E015', severity: 'error', title: 'Propriété identifiante nullable', category: 'model', certainty: 'certain', explanation: 'Une composante d’identifiant ne peut pas être nullable.', source: MERISE_SOURCE },
  E016: { id: 'MERISE-E016', severity: 'error', title: 'Configuration de type invalide', category: 'export', certainty: 'certain', explanation: 'Corrigez la configuration détaillée du type dans le formulaire.' },
  E017: { id: 'MERISE-E017', severity: 'error', title: 'Famille de type incohérente', category: 'model', certainty: 'certain', explanation: 'Resélectionnez le type pour resynchroniser le résumé et la configuration.' },
  E018: { id: 'MERISE-E018', severity: 'error', title: 'Collision de colonnes SQL', category: 'export', certainty: 'certain', explanation: 'Renommez les propriétés qui produisent la même colonne en SQL.' },
  E019: { id: 'MERISE-E019', severity: 'error', title: 'Référence SQL invalide', category: 'export', certainty: 'certain', explanation: 'Vérifiez les identifiants et types des clés référencées.', source: SQL_SOURCE },
  W006: { id: 'MERISE-W006', severity: 'warning', title: 'Identifiant redondant ou non minimal', category: 'normalization', certainty: 'certain', explanation: 'Gardez des identifiants minimaux, sans répéter une clé déjà unique.', source: MERISE_SOURCE },
  W007: { id: 'MERISE-W007', severity: 'warning', title: 'Rôles réflexifs ambigus', category: 'model', certainty: 'heuristic', explanation: 'Nommez les rôles dans une association réflexive.', source: MERISE_SOURCE },
  W008: { id: 'MERISE-W008', severity: 'warning', title: 'Association potentiellement dupliquée', category: 'normalization', certainty: 'heuristic', explanation: 'Vérifiez si ce lien est vraiment distinct d’un autre identique.', source: MERISE_SOURCE },
  W009: { id: 'MERISE-W009', severity: 'warning', title: 'Clé étrangère possiblement saisie dans le MCD', category: 'normalization', certainty: 'heuristic', explanation: 'Modélisez le lien par une association ; la FK apparaît au MLD.', source: MERISE_SOURCE },
  W010: { id: 'MERISE-W010', severity: 'warning', title: 'Donnée calculée potentiellement redondante', category: 'normalization', certainty: 'heuristic', explanation: 'Une propriété calculable n’a pas sa place dans le MCD, sauf instantané historique.', source: MERISE_SOURCE },
  W011: { id: 'MERISE-W011', severity: 'warning', title: 'Dépendance des propriétés d’association à vérifier', category: 'normalization', certainty: 'heuristic', explanation: 'Vérifiez si ces propriétés décrivent l’entité ou le lien.', source: ASSOCIATION_SOURCE },
  W012: { id: 'MERISE-W012', severity: 'warning', title: 'Clé fondée sur un nombre approché', category: 'normalization', certainty: 'heuristic', explanation: 'Évitez les flottants dans une clé ou un identifiant.' },
  W013: { id: 'MERISE-W013', severity: 'warning', title: 'Domaine partiellement traduit en SQL', category: 'export', certainty: 'certain', explanation: 'Le SQL généré n’impose pas tout le domaine choisi.', source: SQL_SOURCE },
  W014: { id: 'MERISE-W014', severity: 'warning', title: 'Collection dans une propriété', category: 'normalization', certainty: 'heuristic', explanation: 'Un tableau peut cacher une entité liée à modéliser.', source: MERISE_SOURCE },
  W015: { id: 'MERISE-W015', severity: 'warning', title: 'Propriété obligatoire d’un lien facultatif', category: 'export', certainty: 'certain', explanation: 'NOT NULL sur le lien peut devenir obligatoire même sans occurrence.', source: SQL_SOURCE },
  I001: { id: 'MERISE-I001', severity: 'info', title: 'Dépendances de la clé composée à documenter', category: 'normalization', certainty: 'manual', explanation: 'Vérifiez manuellement la 2FN et la 3FN pour cette clé composée.', source: MERISE_SOURCE },
  I002: { id: 'MERISE-I002', severity: 'info', title: 'Participation minimale non garantie par le SQL', category: 'export', certainty: 'certain', explanation: 'Le SQL seul ne garantit pas l’existence d’un lien obligatoire côté métier.', source: SQL_SOURCE },
  I003: { id: 'MERISE-I003', severity: 'info', title: 'Type libre à vérifier sur le serveur', category: 'export', certainty: 'manual', explanation: 'Confirmez que ce type PostgreSQL existe sur le serveur cible.' },
  I004: { id: 'MERISE-I004', severity: 'info', title: 'Entité isolée', category: 'model', certainty: 'manual', explanation: 'Cette entité n’est reliée à aucune association du diagramme.' },
} satisfies Record<string, RuleDefinition>
