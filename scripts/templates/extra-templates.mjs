import {
  a,
  assoc,
  bool,
  C01,
  C0N,
  C11,
  C1N,
  counter,
  dateOnly,
  datetime,
  decimal,
  entity,
  int32,
  money,
  project,
  text,
} from './helpers.mjs'

export const cinema = project('Cinema', {
  entities: [
    entity('cin_cinema', 'CINEMA', 80, 80, [
      a('ci_id', 'id_cinema', 'INTEGER', { typeConfig: counter() }),
      a('ci_nom', 'nom', 'TEXT', { typeConfig: text(120) }),
      a('ci_ville', 'ville', 'TEXT', { typeConfig: text(80) }),
      a('ci_adresse', 'adresse', 'TEXT', { typeConfig: text(200) }),
    ]),
    entity('cin_salle', 'SALLE', 420, 80, [
      a('cs_id', 'id_salle', 'INTEGER', { typeConfig: counter() }),
      a('cs_numero', 'numero', 'TEXT', { typeConfig: text(10) }),
      a('cs_capacite', 'capacite', 'INTEGER', { typeConfig: int32() }),
      a('cs_pmr', 'acces_pmr', 'BOOLEAN', { typeConfig: bool() }),
    ]),
    entity('cin_film', 'FILM', 80, 380, [
      a('cf_id', 'id_film', 'INTEGER', { typeConfig: counter() }),
      a('cf_titre', 'titre', 'TEXT', { typeConfig: text(180) }),
      a('cf_duree', 'duree_min', 'INTEGER', { typeConfig: int32() }),
      a('cf_classif', 'classification', 'TEXT', { typeConfig: text(10) }),
      a('cf_synopsis', 'synopsis', 'TEXT', { nullable: true, typeConfig: text(0, true) }),
    ]),
    entity('cin_seance', 'SEANCE', 420, 380, [
      a('cn_id', 'id_seance', 'INTEGER', { typeConfig: counter() }),
      a('cn_debut', 'debut', 'DATE', { typeConfig: datetime() }),
      a('cn_fin', 'fin', 'DATE', { typeConfig: datetime() }),
      a('cn_prix', 'prix_base', 'DECIMAL', { typeConfig: money() }),
    ]),
    entity('cin_spectateur', 'SPECTATEUR', 760, 80, [
      a('sp_id', 'id_spectateur', 'INTEGER', { typeConfig: counter() }),
      a('sp_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('sp_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('sp_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('cin_reservation', 'RESERVATION', 760, 380, [
      a('cr_id', 'id_reservation', 'INTEGER', { typeConfig: counter() }),
      a('cr_date', 'reserve_le', 'DATE', { typeConfig: datetime() }),
      a('cr_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
      a('cr_places', 'nb_places', 'INTEGER', { typeConfig: int32() }),
    ]),
  ],
  associations: [
    assoc('cin_possede', 'POSSEDE', 'cin_cinema', C1N, 'cin_salle', C11, [], { x: 250, y: 80 }),
    assoc('cin_programme', 'PROGRAMME', 'cin_salle', C1N, 'cin_seance', C11, [], { x: 420, y: 230 }),
    assoc('cin_projette', 'PROJETTE', 'cin_film', C1N, 'cin_seance', C11, [], { x: 250, y: 380 }),
    assoc('cin_effectue', 'EFFECTUE', 'cin_spectateur', C0N, 'cin_reservation', C11, [], { x: 590, y: 80 }),
    assoc('cin_concerne', 'CONCERNE', 'cin_seance', C0N, 'cin_reservation', C11, [], { x: 590, y: 380 }),
  ],
  cifs: [
    { id: 'cin_cif_resa', name: 'CIF_RESERVATION', sourceEntityId: 'cin_spectateur', targetEntityId: 'cin_reservation', description: 'Chaque réservation n’a qu’un spectateur (max cible = 1).', associationId: 'cin_effectue', position: { x: 590, y: 20 } },
  ],
  businessRules: [
    { id: 'cin_br_places', name: 'PLACES_POSITIVES', description: 'Le nombre de places réservées est strictement positif.', level: 'warning', targetIds: ['cin_reservation'], position: { x: 920, y: 380 } },
  ],
})

export const hotel = project('Hotel', {
  entities: [
    entity('hot_hotel', 'HOTEL', 80, 80, [
      a('ho_id', 'id_hotel', 'INTEGER', { typeConfig: counter() }),
      a('ho_nom', 'nom', 'TEXT', { typeConfig: text(120) }),
      a('ho_ville', 'ville', 'TEXT', { typeConfig: text(80) }),
      a('ho_etoiles', 'etoiles', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('hot_type_chambre', 'TYPE_CHAMBRE', 420, 80, [
      a('ht_id', 'id_type', 'INTEGER', { typeConfig: counter() }),
      a('ht_libelle', 'libelle', 'TEXT', { typeConfig: text(80) }),
      a('ht_capacite', 'capacite', 'INTEGER', { typeConfig: int32() }),
      a('ht_prix_nuit', 'prix_nuit', 'DECIMAL', { typeConfig: money() }),
    ]),
    entity('hot_chambre', 'CHAMBRE', 80, 380, [
      a('hc_id', 'id_chambre', 'INTEGER', { typeConfig: counter() }),
      a('hc_numero', 'numero', 'TEXT', { typeConfig: text(10) }),
      a('hc_etage', 'etage', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('hot_client', 'CLIENT', 420, 380, [
      a('hl_id', 'id_client', 'INTEGER', { typeConfig: counter() }),
      a('hl_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('hl_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('hl_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
      a('hl_tel', 'telephone', 'TEXT', { nullable: true, typeConfig: text(20) }),
    ]),
    entity('hot_reservation', 'RESERVATION', 760, 230, [
      a('hr_id', 'id_reservation', 'INTEGER', { typeConfig: counter() }),
      a('hr_arrivee', 'arrivee', 'DATE', { typeConfig: dateOnly() }),
      a('hr_depart', 'depart', 'DATE', { typeConfig: dateOnly() }),
      a('hr_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
    ]),
    entity('hot_service', 'SERVICE', 760, 480, [
      a('hs_id', 'id_service', 'INTEGER', { typeConfig: counter() }),
      a('hs_libelle', 'libelle', 'TEXT', { typeConfig: text(80) }),
      a('hs_tarif', 'tarif', 'DECIMAL', { typeConfig: money() }),
    ]),
  ],
  associations: [
    assoc('hot_heberge', 'HEBERGE', 'hot_hotel', C1N, 'hot_chambre', C11, [], { x: 250, y: 230 }),
    assoc('hot_classe', 'CLASSE', 'hot_type_chambre', C0N, 'hot_chambre', C11, [], { x: 250, y: 80 }),
    assoc('hot_reserve', 'RESERVE', 'hot_client', C0N, 'hot_reservation', C11, [], { x: 590, y: 380 }),
    assoc('hot_occupe', 'OCCUPE', 'hot_chambre', C0N, 'hot_reservation', C11, [], { x: 420, y: 380 }),
    assoc('hot_propose', 'PROPOSE', 'hot_hotel', C1N, 'hot_service', C11, [], { x: 420, y: 80 }),
    assoc('hot_souscrit', 'SOUSCRIT', 'hot_reservation', C0N, 'hot_service', C0N, [
      a('hs_qte', 'quantite', 'INTEGER', { typeConfig: int32() }),
    ], { x: 590, y: 480 }),
  ],
  cifs: [
    { id: 'hot_cif_resa', name: 'CIF_RESERVATION', sourceEntityId: 'hot_client', targetEntityId: 'hot_reservation', description: 'Chaque réservation n’a qu’un client (max cible = 1).', associationId: 'hot_reserve', position: { x: 590, y: 330 } },
  ],
  businessRules: [
    { id: 'hot_br_dates', name: 'DATES_COHERENTES', description: 'La date de départ est postérieure à la date d’arrivée.', level: 'warning', targetIds: ['hot_reservation'], position: { x: 920, y: 230 } },
  ],
})

export const restaurant = project('Restaurant', {
  entities: [
    entity('rest_resto', 'RESTAURANT', 80, 80, [
      a('rr_id', 'id_restaurant', 'INTEGER', { typeConfig: counter() }),
      a('rr_nom', 'nom', 'TEXT', { typeConfig: text(120) }),
      a('rr_adresse', 'adresse', 'TEXT', { typeConfig: text(200) }),
    ]),
    entity('rest_table', 'TABLE', 420, 80, [
      a('rt_id', 'id_table', 'INTEGER', { typeConfig: counter() }),
      a('rt_numero', 'numero', 'TEXT', { typeConfig: text(10) }),
      a('rt_places', 'places', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('rest_serveur', 'SERVEUR', 80, 380, [
      a('rv_id', 'id_serveur', 'INTEGER', { typeConfig: counter() }),
      a('rv_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('rv_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
    ]),
    entity('rest_categorie', 'CATEGORIE', 420, 380, [
      a('rc_id', 'id_categorie', 'INTEGER', { typeConfig: counter() }),
      a('rc_libelle', 'libelle', 'TEXT', { unique: true, typeConfig: text(60) }),
    ]),
    entity('rest_plat', 'PLAT', 760, 80, [
      a('rp_id', 'id_plat', 'INTEGER', { typeConfig: counter() }),
      a('rp_nom', 'nom', 'TEXT', { typeConfig: text(120) }),
      a('rp_prix', 'prix', 'DECIMAL', { typeConfig: money() }),
      a('rp_vegetarien', 'vegetarien', 'BOOLEAN', { typeConfig: bool() }),
      a('rp_allergenes', 'allergenes', 'TEXT', { nullable: true, typeConfig: text(200) }),
    ]),
    entity('rest_commande', 'COMMANDE', 760, 380, [
      a('ro_id', 'id_commande', 'INTEGER', { typeConfig: counter() }),
      a('ro_heure', 'passee_le', 'DATE', { typeConfig: datetime() }),
      a('ro_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
    ]),
  ],
  associations: [
    assoc('rest_equipe', 'EQUIPE', 'rest_resto', C1N, 'rest_table', C11, [], { x: 250, y: 80 }),
    assoc('rest_emploie', 'EMPLOIE', 'rest_resto', C1N, 'rest_serveur', C11, [], { x: 250, y: 380 }),
    assoc('rest_classe', 'CLASSE', 'rest_categorie', C0N, 'rest_plat', C11, [], { x: 590, y: 80 }),
    assoc('rest_sert', 'SERT', 'rest_serveur', C0N, 'rest_commande', C11, [], { x: 420, y: 380 }),
    assoc('rest_associe', 'ASSOCIE', 'rest_table', C0N, 'rest_commande', C11, [], { x: 590, y: 380 }),
    assoc('rest_compose', 'COMPOSE', 'rest_commande', C0N, 'rest_plat', C0N, [
      a('rl_qte', 'quantite', 'INTEGER', { typeConfig: int32() }),
      a('rl_note', 'instruction', 'TEXT', { nullable: true, typeConfig: text(120) }),
    ], { x: 920, y: 230 }),
  ],
  cifs: [
    { id: 'rest_cif_cmd', name: 'CIF_COMMANDE', sourceEntityId: 'rest_serveur', targetEntityId: 'rest_commande', description: 'Chaque commande n’a qu’un serveur (max cible = 1).', associationId: 'rest_sert', position: { x: 420, y: 330 } },
  ],
})

export const sante = project('Sante', {
  entities: [
    entity('san_patient', 'PATIENT', 80, 80, [
      a('pa_id', 'id_patient', 'INTEGER', { typeConfig: counter() }),
      a('pa_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('pa_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('pa_naissance', 'date_naissance', 'DATE', { typeConfig: dateOnly() }),
      a('pa_secu', 'num_secu', 'TEXT', { unique: true, typeConfig: text(15) }),
    ]),
    entity('san_medecin', 'MEDECIN', 420, 80, [
      a('me_id', 'id_medecin', 'INTEGER', { typeConfig: counter() }),
      a('me_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('me_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('me_rpps', 'num_rpps', 'TEXT', { unique: true, typeConfig: text(11) }),
    ]),
    entity('san_specialite', 'SPECIALITE', 80, 380, [
      a('ss_id', 'id_specialite', 'INTEGER', { typeConfig: counter() }),
      a('ss_libelle', 'libelle', 'TEXT', { unique: true, typeConfig: text(80) }),
    ]),
    entity('san_cabinet', 'CABINET', 420, 380, [
      a('sc_id', 'id_cabinet', 'INTEGER', { typeConfig: counter() }),
      a('sc_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('sc_adresse', 'adresse', 'TEXT', { typeConfig: text(200) }),
    ]),
    entity('san_rdv', 'RENDEZ_VOUS', 760, 230, [
      a('sr_id', 'id_rdv', 'INTEGER', { typeConfig: counter() }),
      a('sr_debut', 'debut', 'DATE', { typeConfig: datetime() }),
      a('sr_motif', 'motif', 'TEXT', { typeConfig: text(200) }),
      a('sr_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
    ]),
    entity('san_ordonnance', 'ORDONNANCE', 760, 480, [
      a('so_id', 'id_ordonnance', 'INTEGER', { typeConfig: counter() }),
      a('so_date', 'delivree_le', 'DATE', { typeConfig: dateOnly() }),
      a('so_duree', 'duree_jours', 'INTEGER', { typeConfig: int32() }),
    ]),
  ],
  associations: [
    assoc('san_exerce', 'EXERCE', 'san_medecin', C0N, 'san_specialite', C0N, [], { x: 250, y: 230 }),
    assoc('san_travaille', 'TRAVAILLE', 'san_medecin', C0N, 'san_cabinet', C11, [], { x: 420, y: 230 }),
    assoc('san_planifie', 'PLANIFIE', 'san_patient', C0N, 'san_rdv', C11, [], { x: 590, y: 80 }),
    assoc('san_assure', 'ASSURE', 'san_medecin', C0N, 'san_rdv', C11, [], { x: 590, y: 380 }),
    assoc('san_delivre', 'DELIVRE', 'san_medecin', C0N, 'san_ordonnance', C11, [], { x: 920, y: 380 }),
    assoc('san_concerne', 'CONCERNE', 'san_patient', C0N, 'san_ordonnance', C11, [], { x: 420, y: 480 }),
  ],
  cifs: [
    { id: 'san_cif_rdv', name: 'CIF_RDV', sourceEntityId: 'san_patient', targetEntityId: 'san_rdv', description: 'Chaque rendez-vous n’a qu’un patient (max cible = 1).', associationId: 'san_planifie', position: { x: 590, y: 20 } },
  ],
})

export const logistique = project('Logistique', {
  entities: [
    entity('log_entrepot', 'ENTREPOT', 80, 80, [
      a('le_id', 'id_entrepot', 'INTEGER', { typeConfig: counter() }),
      a('le_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('le_ville', 'ville', 'TEXT', { typeConfig: text(80) }),
    ]),
    entity('log_fournisseur', 'FOURNISSEUR', 420, 80, [
      a('lf_id', 'id_fournisseur', 'INTEGER', { typeConfig: counter() }),
      a('lf_nom', 'raison_sociale', 'TEXT', { typeConfig: text(120) }),
      a('lf_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('log_article', 'STOCK_ITEM', 80, 380, [
      a('la_id', 'id_article', 'INTEGER', { typeConfig: counter() }),
      a('la_ref', 'reference', 'TEXT', { unique: true, typeConfig: text(40) }),
      a('la_libelle', 'libelle', 'TEXT', { typeConfig: text(160) }),
      a('la_unite', 'unite', 'TEXT', { typeConfig: text(20) }),
    ]),
    entity('log_commande_achat', 'COMMANDE_ACHAT', 420, 380, [
      a('lc_id', 'id_commande', 'INTEGER', { typeConfig: counter() }),
      a('lc_date', 'passee_le', 'DATE', { typeConfig: dateOnly() }),
      a('lc_statut', 'statut', 'TEXT', { typeConfig: text(20) }),
    ]),
    entity('log_mouvement', 'MOUVEMENT', 760, 230, [
      a('lm_id', 'id_mouvement', 'INTEGER', { typeConfig: counter() }),
      a('lm_date', 'effectue_le', 'DATE', { typeConfig: datetime() }),
      a('lm_type', 'type_mouvement', 'TEXT', { typeConfig: text(20) }),
      a('lm_qte', 'quantite', 'INTEGER', { typeConfig: int32() }),
    ]),
  ],
  associations: [
    assoc('log_approvisionne', 'APPROVISIONNE', 'log_fournisseur', C0N, 'log_article', C0N, [
      a('lap_delai', 'delai_jours', 'INTEGER', { typeConfig: int32() }),
    ], { x: 250, y: 230 }),
    assoc('log_stocke', 'STOCKE', 'log_entrepot', C0N, 'log_article', C0N, [
      a('lst_seuil', 'seuil_alerte', 'INTEGER', { typeConfig: int32() }),
      a('lst_niveau', 'niveau_stock', 'INTEGER', { typeConfig: int32() }),
    ], { x: 250, y: 80 }),
    assoc('log_passe', 'PASSE', 'log_fournisseur', C0N, 'log_commande_achat', C11, [], { x: 420, y: 380 }),
    assoc('log_detaille', 'DETAILLE', 'log_commande_achat', C0N, 'log_article', C0N, [
      a('ld_qte', 'quantite', 'INTEGER', { typeConfig: int32() }),
      a('ld_prix', 'prix_unitaire', 'DECIMAL', { typeConfig: money() }),
    ], { x: 590, y: 380 }),
    assoc('log_enregistre', 'ENREGISTRE', 'log_entrepot', C1N, 'log_mouvement', C11, [], { x: 420, y: 80 }),
    assoc('log_concerne_art', 'CONCERNE', 'log_article', C0N, 'log_mouvement', C11, [], { x: 590, y: 230 }),
  ],
  cifs: [
    { id: 'log_cif_cmd', name: 'CIF_COMMANDE_ACHAT', sourceEntityId: 'log_fournisseur', targetEntityId: 'log_commande_achat', description: 'Chaque commande d’achat n’a qu’un fournisseur (max cible = 1).', associationId: 'log_passe', position: { x: 420, y: 330 } },
  ],
})

export const evenement = project('Evenement', {
  entities: [
    entity('evt_evenement', 'EVENEMENT', 420, 80, [
      a('ev_id', 'id_evenement', 'INTEGER', { typeConfig: counter() }),
      a('ev_titre', 'titre', 'TEXT', { typeConfig: text(180) }),
      a('ev_debut', 'debut', 'DATE', { typeConfig: datetime() }),
      a('ev_fin', 'fin', 'DATE', { typeConfig: datetime() }),
      a('ev_capacite', 'capacite_max', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('evt_lieu', 'LIEU', 80, 80, [
      a('el_id', 'id_lieu', 'INTEGER', { typeConfig: counter() }),
      a('el_nom', 'nom', 'TEXT', { typeConfig: text(120) }),
      a('el_ville', 'ville', 'TEXT', { typeConfig: text(80) }),
      a('el_capacite', 'capacite', 'INTEGER', { typeConfig: int32() }),
    ]),
    entity('evt_organisateur', 'ORGANISATEUR', 80, 380, [
      a('eo_id', 'id_organisateur', 'INTEGER', { typeConfig: counter() }),
      a('eo_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('eo_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('evt_participant', 'PARTICIPANT', 420, 380, [
      a('ep_id', 'id_participant', 'INTEGER', { typeConfig: counter() }),
      a('ep_nom', 'nom', 'TEXT', { typeConfig: text(80) }),
      a('ep_prenom', 'prenom', 'TEXT', { typeConfig: text(80) }),
      a('ep_email', 'email', 'TEXT', { unique: true, typeConfig: text(254) }),
    ]),
    entity('evt_billet', 'BILLET', 760, 230, [
      a('eb_id', 'id_billet', 'INTEGER', { typeConfig: counter() }),
      a('eb_code', 'code', 'TEXT', { unique: true, typeConfig: text(32) }),
      a('eb_prix', 'prix', 'DECIMAL', { typeConfig: money() }),
      a('eb_utilise', 'utilise', 'BOOLEAN', { typeConfig: bool() }),
    ]),
  ],
  associations: [
    assoc('evt_se_deroule', 'SE_DEROULE', 'evt_lieu', C0N, 'evt_evenement', C11, [], { x: 250, y: 80 }),
    assoc('evt_organise', 'ORGANISE', 'evt_organisateur', C0N, 'evt_evenement', C11, [], { x: 250, y: 380 }),
    assoc('evt_inscrit', 'INSCRIT', 'evt_participant', C0N, 'evt_evenement', C0N, [
      a('ei_date', 'inscrit_le', 'DATE', { typeConfig: datetime() }),
    ], { x: 590, y: 380 }),
    assoc('evt_delivre', 'DELIVRE', 'evt_participant', C0N, 'evt_billet', C11, [], { x: 590, y: 80 }),
    assoc('evt_valable', 'VALIDE_POUR', 'evt_billet', C11, 'evt_evenement', C11, [], { x: 590, y: 230 }),
  ],
  cifs: [
    { id: 'evt_cif_billet', name: 'CIF_BILLET', sourceEntityId: 'evt_participant', targetEntityId: 'evt_billet', description: 'Chaque billet n’a qu’un participant (max cible = 1).', associationId: 'evt_delivre', position: { x: 760, y: 20 } },
  ],
  businessRules: [
    { id: 'evt_br_capacite', name: 'CAPACITE_LIEU', description: 'La capacité de l’événement ne dépasse pas celle du lieu.', level: 'info', targetIds: ['evt_evenement', 'evt_lieu'], position: { x: 920, y: 80 } },
  ],
})

export const extraTemplates = {
  cinema,
  hotel,
  restaurant,
  sante,
  logistique,
  evenement,
}
