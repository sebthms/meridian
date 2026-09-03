/**
 * Génère src/features/project-library/templates/projects.json — modèles MCD pédagogiques, sans FK dans le MCD.
 * Exécuter : node scripts/build-templates.mjs
 */
import fs from 'node:fs'

const C01 = { min: 0, max: 1 }
const C11 = { min: 1, max: 1 }
const C0N = { min: 0, max: 'N' }
const C1N = { min: 1, max: 'N' }

function text(length = 80, large = false) {
  return { text: { charset: 'UNICODE', storage: large ? 'LARGE' : 'VARIABLE', ...(large ? {} : { length }) } }
}
function counter() {
  return { numeric: { kind: 'COUNTER' } }
}
function int32() {
  return { numeric: { kind: 'INTEGER', bits: 32 } }
}
function money() {
  return { numeric: { kind: 'MONEY', precision: 12, scale: 2 } }
}
function datetime() {
  return { dateTime: { kind: 'DATETIME', timezone: true } }
}
function dateOnly() {
  return { dateTime: { kind: 'DATE' } }
}
function bool() {
  return { other: { kind: 'BOOLEAN' } }
}

function a(id, name, conceptualType, extra = {}) {
  return { id, name, conceptualType, nullable: false, ...extra }
}

function entity(id, name, x, y, attributes, pkIds = [attributes[0].id]) {
  return {
    id,
    name,
    attributes,
    identifiers: [{ id: `${id}_pk`, attributeIds: pkIds, isPrimary: true }],
    position: { x, y },
  }
}

function assoc(id, name, leftId, leftCard, rightId, rightCard, attributes = [], position) {
  return {
    id,
    name,
    participants: [
      { entityId: leftId, cardinality: leftCard },
      { entityId: rightId, cardinality: rightCard },
    ],
    attributes,
    ...(position ? { position } : {}),
  }
}

function project(name, extras) {
  return {
    version: 1,
    name,
    ignoredRules: [],
    ignoredIssueIds: [],
    inheritances: [],
    constraints: [],
    cifs: [],
    businessRules: [],
    ...extras,
  }
}

const blog = project('Blog', {
  entities: [
    entity('blog_auteur', 'AUTEUR', 80, 80, [
      a('ba_id', 'id_auteur', 'INTEGER', { typeConfig: counter() }),
      a('ba_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('ba_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('ba_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('ba_bio', 'biographie', 'TEXT', { nullable: true, typeConfig: text(0, true) }),
    ]),
    entity('blog_rubrique', 'RUBRIQUE', 80, 380, [
      a('br_id', 'id_rubrique', 'INTEGER', { typeConfig: counter() }),
      a('br_nom', 'nom', 'TEXT', { unique: true, typeConfig: text(80) }),
      a('br_slug', 'slug', 'TEXT', { unique: true, typeConfig: text(80) }),
    ]),
    entity('blog_article', 'ARTICLE', 420, 80, [
      a('bt_id', 'id_article', 'INTEGER', { typeConfig: counter() }),
      a('bt_titre', 'titre', 'TEXT', { typeConfig: text(180) }),
      a('bt_slug', 'slug', 'TEXT', { unique: true, typeConfig: text(180) }),
      a('bt_resume', 'resume', 'TEXT', { nullable: true, typeConfig: text(500) }),
      a('bt_contenu', 'contenu', 'TEXT', { typeConfig: text(0, true) }),
      a('bt_publie', 'publie', 'BOOLEAN', { typeConfig: bool() }),
      a('bt_date', 'publie_le', 'DATE', { nullable: true, typeConfig: datetime() }),
    ]),
    entity('blog_commentaire', 'COMMENTAIRE', 420, 420, [
      a('bc_id', 'id_commentaire', 'INTEGER', { typeConfig: counter() }),
      a('bc_texte', 'contenu', 'TEXT', { typeConfig: text(0, true) }),
      a('bc_date', 'poste_le', 'DATE', { typeConfig: datetime() }),
      a('bc_visible', 'visible', 'BOOLEAN', { typeConfig: bool() }),
    ]),
    entity('blog_motcle', 'MOT_CLE', 760, 220, [
      a('bm_id', 'id_mot_cle', 'INTEGER', { typeConfig: counter() }),
      a('bm_libelle', 'libelle', 'TEXT', { unique: true, typeConfig: text(60) }),
    ]),
  ],
  associations: [
    assoc('blog_redige', 'REDIGE', 'blog_auteur', C0N, 'blog_article', C11, [], { x: 250, y: 80 }),
    assoc('blog_classe', 'CLASSE', 'blog_rubrique', C0N, 'blog_article', C11, [], { x: 250, y: 260 }),
    assoc('blog_commente', 'COMMENTE', 'blog_article', C0N, 'blog_commentaire', C11, [], { x: 420, y: 270 }),
    assoc('blog_signe', 'SIGNE', 'blog_auteur', C0N, 'blog_commentaire', C01, [], { x: 250, y: 420 }),
    assoc('blog_etiquete', 'ETIQUETE', 'blog_article', C0N, 'blog_motcle', C0N, [], { x: 590, y: 160 }),
  ],
  cifs: [
    { id: 'blog_cif_article', name: 'CIF_ARTICLE', sourceEntityId: 'blog_auteur', targetEntityId: 'blog_article', description: 'Chaque article n’a qu’un auteur (max cible = 1).', associationId: 'blog_redige', position: { x: 250, y: 20 } },
  ],
  businessRules: [
    { id: 'blog_br_publi', name: 'DATE_PUBLICATION', description: 'Un article publié doit avoir une date de publication.', level: 'warning', targetIds: ['blog_article'], position: { x: 760, y: 80 } },
  ],
})

const boutique = project('Boutique', {
  entities: [
    entity('shop_vendeur', 'VENDEUR', 80, 80, [
      a('sv_id', 'id_vendeur', 'INTEGER', { typeConfig: counter() }),
      a('sv_nom', 'raison_sociale', 'TEXT', { typeConfig: text(120) }),
      a('sv_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('shop_client', 'CLIENT', 80, 400, [
      a('sc_id', 'id_client', 'INTEGER', { typeConfig: counter() }),
      a('sc_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('sc_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('sc_inscrit', 'inscrit_le', 'DATE', { typeConfig: dateOnly() }),
    ]),
    entity('shop_produit', 'PRODUIT', 420, 80, [
      a('sp_id', 'id_produit', 'INTEGER', { typeConfig: counter() }),
      a('sp_nom', 'nom', 'TEXT', { typeConfig: text(160) }),
      a('sp_sku', 'sku', 'TEXT', { unique: true, typeConfig: text(40) }),
      a('sp_prix', 'prix', 'DECIMAL', { typeConfig: money() }),
      a('sp_stock', 'stock', 'INTEGER', { typeConfig: int32() }),
      a('sp_actif', 'actif', 'BOOLEAN', { typeConfig: bool() }),
    ]),
    entity('shop_commande', 'COMMANDE', 420, 400, [
      a('so_id', 'id_commande', 'INTEGER', { typeConfig: counter() }),
      a('so_ref', 'reference', 'TEXT', { unique: true, typeConfig: text(20) }),
      a('so_date', 'passee_le', 'DATE', { typeConfig: datetime() }),
      a('so_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
    ]),
  ],
  associations: [
    assoc('shop_publie', 'PUBLIE', 'shop_vendeur', C0N, 'shop_produit', C11, [], { x: 250, y: 80 }),
    assoc('shop_passe', 'PASSE', 'shop_client', C0N, 'shop_commande', C11, [], { x: 250, y: 400 }),
    assoc('shop_contient', 'CONTIENT', 'shop_commande', C0N, 'shop_produit', C0N, [
      a('sl_qty', 'quantite', 'INTEGER', { typeConfig: int32() }),
      a('sl_prix', 'prix_unitaire', 'DECIMAL', { typeConfig: money() }),
    ], { x: 420, y: 250 }),
  ],
  cifs: [
    { id: 'shop_cif_commande', name: 'CIF_COMMANDE', sourceEntityId: 'shop_client', targetEntityId: 'shop_commande', description: 'Chaque commande n’a qu’un client (max cible = 1).', associationId: 'shop_passe', position: { x: 250, y: 330 } },
  ],
  businessRules: [
    { id: 'shop_br_stock', name: 'STOCK_POSITIF', description: 'La quantité commandée ne peut pas dépasser le stock du produit.', level: 'warning', targetIds: ['shop_contient', 'shop_produit'], position: { x: 620, y: 250 } },
  ],
})

const crm = project('CRM', {
  entities: [
    entity('crm_entreprise', 'ENTREPRISE', 80, 80, [
      a('ce_id', 'id_entreprise', 'INTEGER', { typeConfig: counter() }),
      a('ce_nom', 'raison_sociale', 'TEXT', { typeConfig: text(160) }),
      a('ce_siret', 'siret', 'TEXT', { unique: true, nullable: true, typeConfig: text(14) }),
      a('ce_secteur', 'secteur', 'TEXT', { nullable: true, typeConfig: text(80) }),
    ]),
    entity('crm_contact', 'CONTACT', 420, 80, [
      a('cc_id', 'id_contact', 'INTEGER', { typeConfig: counter() }),
      a('cc_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('cc_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('cc_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('cc_fonction', 'fonction', 'TEXT', { nullable: true, typeConfig: text(80) }),
    ]),
    entity('crm_commercial', 'COMMERCIAL', 80, 400, [
      a('cm_id', 'id_commercial', 'INTEGER', { typeConfig: counter() }),
      a('cm_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('cm_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('crm_opportunite', 'OPPORTUNITE', 420, 400, [
      a('co_id', 'id_opportunite', 'INTEGER', { typeConfig: counter() }),
      a('co_titre', 'titre', 'TEXT', { typeConfig: text(160) }),
      a('co_montant', 'montant', 'DECIMAL', { typeConfig: money() }),
      a('co_etape', 'etape', 'TEXT', { typeConfig: text(40) }),
      a('co_echeance', 'echeance', 'DATE', { nullable: true, typeConfig: dateOnly() }),
    ]),
    entity('crm_activite', 'ACTIVITE', 760, 240, [
      a('ca_id', 'id_activite', 'INTEGER', { typeConfig: counter() }),
      a('ca_objet', 'objet', 'TEXT', { typeConfig: text(160) }),
      a('ca_type', 'type_activite', 'TEXT', { typeConfig: text(40) }),
      a('ca_date', 'planifiee_le', 'DATE', { typeConfig: datetime() }),
      a('ca_fait', 'terminee', 'BOOLEAN', { typeConfig: bool() }),
    ]),
  ],
  associations: [
    assoc('crm_regroupe', 'REGROUPE', 'crm_entreprise', C0N, 'crm_contact', C11, [], { x: 250, y: 80 }),
    assoc('crm_porte', 'PORTE_SUR', 'crm_entreprise', C0N, 'crm_opportunite', C11, [], { x: 250, y: 260 }),
    assoc('crm_pilote', 'PILOTE', 'crm_commercial', C0N, 'crm_opportunite', C11, [], { x: 250, y: 400 }),
    assoc('crm_suit', 'SUIT', 'crm_contact', C0N, 'crm_activite', C11, [], { x: 590, y: 140 }),
    assoc('crm_relie', 'RELIE', 'crm_opportunite', C0N, 'crm_activite', C01, [], { x: 590, y: 340 }),
  ],
  cifs: [
    { id: 'crm_cif_opp', name: 'CIF_OPPORTUNITE', sourceEntityId: 'crm_entreprise', targetEntityId: 'crm_opportunite', description: 'Chaque opportunité n’a qu’une entreprise (max cible = 1).', associationId: 'crm_porte', position: { x: 250, y: 200 } },
  ],
})

const bibliotheque = project('Bibliotheque', {
  entities: [
    entity('lib_oeuvre', 'OEUVRE', 80, 80, [
      a('lo_id', 'id_oeuvre', 'INTEGER', { typeConfig: counter() }),
      a('lo_isbn', 'isbn', 'TEXT', { unique: true, nullable: true, typeConfig: text(17) }),
      a('lo_titre', 'titre', 'TEXT', { typeConfig: text(200) }),
      a('lo_annee', 'annee_publication', 'INTEGER', { nullable: true, typeConfig: int32() }),
    ]),
    entity('lib_auteur', 'AUTEUR', 420, 80, [
      a('la_id', 'id_auteur', 'INTEGER', { typeConfig: counter() }),
      a('la_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('la_prenom', 'prenom', 'TEXT', { nullable: true, typeConfig: text(80) }),
    ]),
    entity('lib_exemplaire', 'EXEMPLAIRE', 80, 380, [
      a('lx_id', 'id_exemplaire', 'INTEGER', { typeConfig: counter() }),
      a('lx_cote', 'cote', 'TEXT', { unique: true, typeConfig: text(40) }),
      a('lx_etat', 'etat', 'TEXT', { typeConfig: text(20) }),
    ]),
    entity('lib_adherent', 'ADHERENT', 420, 380, [
      a('ld_id', 'id_adherent', 'INTEGER', { typeConfig: counter() }),
      a('ld_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('ld_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('ld_fin', 'adhesion_fin', 'DATE', { typeConfig: dateOnly() }),
    ]),
    entity('lib_emprunt', 'EMPRUNT', 760, 240, [
      a('le_id', 'id_emprunt', 'INTEGER', { typeConfig: counter() }),
      a('le_debut', 'emprunte_le', 'DATE', { typeConfig: dateOnly() }),
      a('le_retour', 'retour_prevu', 'DATE', { typeConfig: dateOnly() }),
      a('le_rendu', 'rendu_le', 'DATE', { nullable: true, typeConfig: dateOnly() }),
    ]),
  ],
  associations: [
    assoc('lib_ecrit', 'ECRIT', 'lib_auteur', C0N, 'lib_oeuvre', C1N, [], { x: 250, y: 80 }),
    assoc('lib_materialise', 'MATERIALISE', 'lib_oeuvre', C1N, 'lib_exemplaire', C11, [], { x: 80, y: 230 }),
    assoc('lib_emprunte', 'EFFECTUE', 'lib_adherent', C0N, 'lib_emprunt', C11, [], { x: 590, y: 380 }),
    assoc('lib_porte', 'PORTE_SUR', 'lib_exemplaire', C0N, 'lib_emprunt', C11, [], { x: 420, y: 300 }),
  ],
  cifs: [
    { id: 'lib_cif_emprunt', name: 'CIF_EMPRUNT', sourceEntityId: 'lib_exemplaire', targetEntityId: 'lib_emprunt', description: 'Chaque emprunt n’a qu’un exemplaire (max cible = 1).', associationId: 'lib_porte', position: { x: 590, y: 240 } },
  ],
  businessRules: [
    { id: 'lib_br_retour', name: 'RETOUR_COHERENT', description: 'La date de retour prévue est postérieure à la date d’emprunt.', level: 'warning', targetIds: ['lib_emprunt'], position: { x: 760, y: 80 } },
  ],
})

const scolarite = project('Scolarite', {
  entities: [
    entity('edu_enseignant', 'ENSEIGNANT', 80, 80, [
      a('ee_id', 'id_enseignant', 'INTEGER', { typeConfig: counter() }),
      a('ee_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('ee_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('ee_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('edu_etudiant', 'ETUDIANT', 80, 400, [
      a('et_id', 'id_etudiant', 'INTEGER', { typeConfig: counter() }),
      a('et_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('et_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('et_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('et_promo', 'promotion', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('edu_cours', 'COURS', 420, 80, [
      a('ec_id', 'id_cours', 'INTEGER', { typeConfig: counter() }),
      a('ec_code', 'code', 'TEXT', { unique: true, typeConfig: text(16) }),
      a('ec_intitule', 'intitule', 'TEXT', { typeConfig: text(160) }),
      a('ec_credits', 'credits', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('edu_session', 'SESSION', 420, 400, [
      a('es_id', 'id_session', 'INTEGER', { typeConfig: counter() }),
      a('es_annee', 'annee', 'INTEGER', { typeConfig: int32() }),
      a('es_semestre', 'semestre', 'INTEGER', { typeConfig: int32() }),
    ]),
  ],
  associations: [
    assoc('edu_enseigne', 'ENSEIGNE', 'edu_enseignant', C0N, 'edu_cours', C11, [], { x: 250, y: 80 }),
    assoc('edu_ouvre', 'OUVRE', 'edu_cours', C1N, 'edu_session', C11, [], { x: 420, y: 240 }),
    assoc('edu_inscrit', 'INSCRIT', 'edu_etudiant', C0N, 'edu_session', C0N, [
      a('ei_note', 'note', 'DECIMAL', { nullable: true, typeConfig: { numeric: { kind: 'DECIMAL', precision: 4, scale: 2 } } }),
      a('ei_valide', 'valide', 'BOOLEAN', { typeConfig: bool() }),
    ], { x: 250, y: 400 }),
  ],
  cifs: [
    { id: 'edu_cif_cours', name: 'CIF_COURS', sourceEntityId: 'edu_enseignant', targetEntityId: 'edu_cours', description: 'Chaque cours n’a qu’un enseignant responsable (max cible = 1).', associationId: 'edu_enseigne', position: { x: 250, y: 20 } },
  ],
  businessRules: [
    { id: 'edu_br_note', name: 'NOTE_BORNEE', description: 'Une note, si présente, est comprise entre 0 et 20.', level: 'info', targetIds: ['edu_inscrit'], position: { x: 80, y: 560 } },
  ],
})

const rh = project('RH', {
  entities: [
    entity('rh_personne', 'PERSONNE', 420, 80, [
      a('rp_id', 'id_personne', 'INTEGER', { typeConfig: counter() }),
      a('rp_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('rp_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('rp_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('rh_salarie', 'SALARIE', 80, 320, [
      a('rs_id', 'id_salarie', 'INTEGER', { typeConfig: counter() }),
      a('rs_matricule', 'matricule', 'TEXT', { unique: true, typeConfig: text(16) }),
      a('rs_embauche', 'embauche_le', 'DATE', { typeConfig: dateOnly() }),
    ]),
    entity('rh_stagiaire', 'STAGIAIRE', 760, 320, [
      a('rt_id', 'id_stagiaire', 'INTEGER', { typeConfig: counter() }),
      a('rt_ecole', 'ecole', 'TEXT', { typeConfig: text(120) }),
      a('rt_fin', 'stage_fin', 'DATE', { typeConfig: dateOnly() }),
    ]),
    entity('rh_service', 'SERVICE', 420, 520, [
      a('rv_id', 'id_service', 'INTEGER', { typeConfig: counter() }),
      a('rv_nom', 'nom', 'TEXT', { unique: true, typeConfig: text(80) }),
      a('rv_code', 'code', 'TEXT', { unique: true, typeConfig: text(8) }),
    ]),
  ],
  associations: [
    assoc('rh_affecte', 'AFFECTE', 'rh_salarie', C0N, 'rh_service', C11, [], { x: 250, y: 430 }),
    assoc('rh_accueille', 'ACCUEILLE', 'rh_service', C0N, 'rh_stagiaire', C01, [], { x: 590, y: 430 }),
  ],
  inheritances: [
    {
      id: 'rh_herit',
      name: 'SPECIALISATION',
      parentEntityId: 'rh_personne',
      childEntityIds: ['rh_salarie', 'rh_stagiaire'],
      coverage: 'total',
      exclusivity: 'exclusive',
      position: { x: 420, y: 220 },
    },
  ],
  businessRules: [
    { id: 'rh_br_exclu', name: 'PARTITION', description: 'Toute personne est soit salariée, soit stagiaire, jamais les deux.', level: 'info', targetIds: ['rh_herit'], position: { x: 620, y: 80 } },
  ],
})

const projects = {
  blog,
  boutique,
  crm,
  bibliotheque,
  scolarite,
  rh,
}

fs.writeFileSync('src/features/project-library/templates/projects.json', `${JSON.stringify(projects, null, 2)}\n`)
console.log(`Wrote ${Object.keys(projects).length} templates`)
