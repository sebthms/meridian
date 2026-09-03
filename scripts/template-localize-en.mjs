/**
 * Traduit les libellés français des modèles MCD vers l'anglais.
 * Les paires sont triées du plus long au plus court pour éviter les remplacements partiels.
 */

/** @type {[string, string][]} */
const REPLACEMENTS = [
  // Descriptions CIF (apostrophe typographique)
  ['Chaque cours n\u2019a qu\u2019un enseignant responsable (max cible = 1).', 'Each course has only one responsible teacher (max target = 1).'],
  ['Chaque opportunit\u00e9 n\u2019a qu\u2019une entreprise (max cible = 1).', 'Each opportunity has only one company (max target = 1).'],
  ['Chaque emprunt n\u2019a qu\u2019un exemplaire (max cible = 1).', 'Each loan has only one copy (max target = 1).'],
  ['Chaque commande n\u2019a qu\u2019un client (max cible = 1).', 'Each order has only one customer (max target = 1).'],
  ['Chaque article n\u2019a qu\u2019un auteur (max cible = 1).', 'Each article has only one author (max target = 1).'],
  // Descriptions CIF (apostrophe droite)
  ["Chaque cours n'a qu'un enseignant responsable (max cible = 1).", 'Each course has only one responsible teacher (max target = 1).'],
  ["Chaque opportunité n'a qu'une entreprise (max cible = 1).", 'Each opportunity has only one company (max target = 1).'],
  ["Chaque emprunt n'a qu'un exemplaire (max cible = 1).", 'Each loan has only one copy (max target = 1).'],
  ["Chaque commande n'a qu'un client (max cible = 1).", 'Each order has only one customer (max target = 1).'],
  ["Chaque article n'a qu'un auteur (max cible = 1).", 'Each article has only one author (max target = 1).'],
  // Descriptions règles métier
  ['La quantité commandée ne peut pas dépasser le stock du produit.', 'The ordered quantity cannot exceed the product stock.'],
  ['La date de retour prévue est postérieure à la date d\u2019emprunt.', 'The expected return date is after the loan date.'],
  ["La date de retour prévue est postérieure à la date d'emprunt.", 'The expected return date is after the loan date.'],
  ['Un article publié doit avoir une date de publication.', 'A published article must have a publication date.'],
  ['Toute personne est soit salariée, soit stagiaire, jamais les deux.', 'Every person is either an employee or an intern, never both.'],
  ['Une note, si présente, est comprise entre 0 et 20.', 'A grade, if present, is between 0 and 20.'],
  // Noms de projet
  ['Bibliotheque', 'Library'],
  ['Scolarite', 'Education'],
  ['Boutique', 'Shop'],
  // Entités et associations (noms composés)
  ['SPECIALISATION', 'SPECIALIZATION'],
  ['COMMENTAIRE', 'COMMENT'],
  ['OPPORTUNITE', 'OPPORTUNITY'],
  ['MATERIALISE', 'MANIFESTS'],
  ['EXEMPLAIRE', 'COPY'],
  ['ENSEIGNANT', 'TEACHER'],
  ['COMMERCIAL', 'SALES_REP'],
  ['ENTREPRISE', 'COMPANY'],
  ['ETUDIANT', 'STUDENT'],
  ['STAGIAIRE', 'INTERN'],
  ['ADHERENT', 'MEMBER'],
  ['ACTIVITE', 'ACTIVITY'],
  ['COMMANDE', 'ORDER'],
  ['RUBRIQUE', 'SECTION'],
  ['PERSONNE', 'PERSON'],
  ['SALARIE', 'EMPLOYEE'],
  ['PRODUIT', 'PRODUCT'],
  ['VENDEUR', 'SELLER'],
  ['EMPRUNT', 'LOAN'],
  ['COMMENTE', 'COMMENTS_ON'],
  ['ETIQUETE', 'TAGS'],
  ['REGROUPE', 'GROUPS'],
  ['PORTE_SUR', 'RELATES_TO'],
  ['EFFECTUE', 'MAKES'],
  ['ACCUEILLE', 'HOSTS'],
  ['AFFECTE', 'ASSIGNED_TO'],
  ['CONTIENT', 'CONTAINS'],
  ['MOT_CLE', 'KEYWORD'],
  ['SERVICE', 'DEPARTMENT'],
  ['SESSION', 'SESSION'],
  ['CLIENT', 'CUSTOMER'],
  ['AUTEUR', 'AUTHOR'],
  ['ARTICLE', 'ARTICLE'],
  ['COURS', 'COURSE'],
  ['OEUVRE', 'WORK'],
  ['PUBLIE', 'PUBLISHES'],
  ['REDIGE', 'WRITES'],
  ['CLASSE', 'CLASSIFIES'],
  ['SIGNE', 'SIGNS'],
  ['PASSE', 'PLACES'],
  ['PILOTE', 'MANAGES'],
  ['RELIE', 'LINKS'],
  ['ECRIT', 'WRITES'],
  ['OUVRE', 'OPENS'],
  ['INSCRIT', 'ENROLLS'],
  ['ENSEIGNE', 'TEACHES'],
  ['SUIT', 'FOLLOWS'],
  ['CONTACT', 'CONTACT'],
  // Attributs (du plus long au plus court)
  ['annee_publication', 'publication_year'],
  ['type_activite', 'activity_type'],
  ['prix_unitaire', 'unit_price'],
  ['raison_sociale', 'company_name'],
  ['id_opportunite', 'opportunity_id'],
  ['id_commentaire', 'comment_id'],
  ['id_exemplaire', 'copy_id'],
  ['id_enseignant', 'teacher_id'],
  ['id_entreprise', 'company_id'],
  ['id_commercial', 'sales_rep_id'],
  ['id_activite', 'activity_id'],
  ['id_commande', 'order_id'],
  ['id_adherent', 'member_id'],
  ['id_etudiant', 'student_id'],
  ['id_stagiaire', 'intern_id'],
  ['id_personne', 'person_id'],
  ['id_salarie', 'employee_id'],
  ['id_service', 'department_id'],
  ['id_produit', 'product_id'],
  ['id_vendeur', 'seller_id'],
  ['id_client', 'customer_id'],
  ['id_rubrique', 'section_id'],
  ['id_article', 'article_id'],
  ['id_mot_cle', 'keyword_id'],
  ['id_oeuvre', 'work_id'],
  ['id_emprunt', 'loan_id'],
  ['id_auteur', 'author_id'],
  ['id_cours', 'course_id'],
  ['id_session', 'session_id'],
  ['id_contact', 'contact_id'],
  ['adhesion_fin', 'membership_end'],
  ['planifiee_le', 'scheduled_at'],
  ['biographie', 'biography'],
  ['inscrit_le', 'registered_at'],
  ['embauche_le', 'hired_at'],
  ['retour_prevu', 'due_return'],
  ['emprunte_le', 'borrowed_at'],
  ['publie_le', 'published_at'],
  ['passee_le', 'placed_at'],
  ['stage_fin', 'internship_end'],
  ['poste_le', 'posted_at'],
  ['rendu_le', 'returned_at'],
  ['matricule', 'employee_number'],
  ['promotion', 'cohort'],
  ['reference', 'reference'],
  ['semestre', 'semester'],
  ['fonction', 'job_title'],
  ['quantite', 'quantity'],
  ['terminee', 'completed'],
  ['echeance', 'due_date'],
  ['intitule', 'title'],
  ['libelle', 'label'],
  ['contenu', 'content'],
  ['montant', 'amount'],
  ['secteur', 'sector'],
  ['publie', 'published'],
  ['resume', 'summary'],
  ['statut', 'status'],
  ['visible', 'visible'],
  ['credits', 'credits'],
  ['prenom', 'first_name'],
  ['actif', 'active'],
  ['objet', 'subject'],
  ['stock', 'stock'],
  ['etape', 'stage'],
  ['titre', 'title'],
  ['ecole', 'school'],
  ['valide', 'passed'],
  ['email', 'email'],
  ['siret', 'siret'],
  ['annee', 'year'],
  ['etat', 'condition'],
  ['prix', 'price'],
  ['slug', 'slug'],
  ['note', 'grade'],
  ['code', 'code'],
  ['isbn', 'isbn'],
  ['cote', 'call_number'],
  ['nom', 'last_name'],
]

export const REPLACEMENTS_COUNT = REPLACEMENTS.length

function translate(value) {
  if (typeof value !== 'string') return value
  let result = value
  for (const [from, to] of REPLACEMENTS) {
    if (result.includes(from)) result = result.replaceAll(from, to)
  }
  return result
}

function localizeAttributes(attributes) {
  for (const attribute of attributes ?? []) {
    attribute.name = translate(attribute.name)
  }
}

function localizeProject(project) {
  project.name = translate(project.name)

  for (const entity of project.entities ?? []) {
    entity.name = translate(entity.name)
    localizeAttributes(entity.attributes)
  }

  for (const association of project.associations ?? []) {
    association.name = translate(association.name)
    localizeAttributes(association.attributes)
  }

  for (const cif of project.cifs ?? []) {
    cif.description = translate(cif.description)
  }

  for (const rule of project.businessRules ?? []) {
    rule.description = translate(rule.description)
  }

  for (const inheritance of project.inheritances ?? []) {
    inheritance.name = translate(inheritance.name)
  }

  return project
}

/** @param {Record<string, object>} projects */
export function localizeProjects(projects) {
  const clone = structuredClone(projects)
  for (const project of Object.values(clone)) {
    localizeProject(project)
  }
  return clone
}
