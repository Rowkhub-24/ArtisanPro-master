# Requirements Document

## Introduction

ArtisanPro est une plateforme Laravel + React/Inertia.js qui met en relation des clients avec des artisans (prestataires de services) à Porto-Novo, Bénin (Afrique de l'Ouest). La Phase 1 a établi les fondations : authentification, profils, réservations, devis, paiements (Kkiapay/FedaPay), messagerie, notifications, avis, litiges, portfolio, certifications, scoring/badges, panel admin, DiagnosticIA (GPT-4o), sessions d'appel WebRTC, SMS (stub), géolocalisation, fournisseurs partenaires, académie de formation et catégories/prestations.

La Phase 2 vise à compléter les fonctionnalités partiellement implémentées (planning vide, revenus vide, SMS stub, messagerie par polling) et à ajouter les fonctionnalités manquantes les plus impactantes pour rendre la plateforme compétitive et complète.

## Glossary

- **Plateforme** : L'application web ArtisanPro dans son ensemble
- **Artisan** : Prestataire de services inscrit sur la plateforme (plombier, électricien, maçon, etc.)
- **Client** : Utilisateur cherchant à réserver les services d'un artisan
- **Admin** : Administrateur de la plateforme ArtisanPro
- **Réservation** : Contrat de prestation entre un client et un artisan
- **Devis** : Proposition tarifaire d'un artisan en réponse à une demande client
- **Litige** : Désaccord formel entre un client et un artisan sur une réservation
- **Avis** : Évaluation laissée par un client après une prestation terminée
- **Score_Confiance** : Score de 0 à 100 calculé automatiquement pour chaque artisan
- **Badge** : Distinction attribuée selon le Score_Confiance (aucun, certifié, élite)
- **Créneau** : Plage horaire de disponibilité définie par un artisan
- **Séquestre** : Mécanisme de rétention des fonds jusqu'à validation de la prestation
- **Acompte** : Paiement partiel versé à la réservation (pourcentage du montant total)
- **Solde** : Paiement du reste dû après validation de la prestation
- **Notification_Push** : Notification envoyée au navigateur ou à l'appareil mobile de l'utilisateur
- **DiagnosticIA** : Module d'analyse IA (GPT-4o) qui identifie le type de travaux et recommande des artisans
- **Académie** : Module de formations en ligne pour les artisans
- **Fournisseur_Partenaire** : Entreprise partenaire fournissant des matériaux ou services aux artisans
- **Tableau_de_Bord** : Interface de visualisation des statistiques et indicateurs clés
- **Webhook** : Notification HTTP envoyée par un prestataire de paiement externe vers la Plateforme
- **Systeme_Geolocalisation** : Composant backend gérant la réception et le stockage des positions GPS des artisans
- **FCFA** : Franc CFA, monnaie utilisée au Bénin (XOF)
- **Porto-Novo** : Capitale du Bénin, zone géographique principale de la Plateforme
- **Haversine** : Formule de calcul de distance entre deux coordonnées GPS
- **WebRTC** : Protocole de communication temps réel utilisé pour les appels audio/vidéo
- **Polling** : Technique d'interrogation périodique du serveur pour détecter de nouveaux messages

---

## Requirements

### Requirement 1: Messagerie en temps réel

**User Story:** En tant que client ou artisan, je veux recevoir les messages instantanément sans recharger la page, afin de pouvoir communiquer efficacement pendant la coordination d'une prestation.

#### Acceptance Criteria

1. WHEN un utilisateur envoie un message, THE Plateforme SHALL diffuser ce message au destinataire dans un délai inférieur à 2 secondes, en utilisant WebSockets (Laravel Reverb ou Pusher) comme mécanisme de transport principal.
2. WHEN un nouveau message est reçu, THE Interface_Messagerie SHALL afficher le message sans rechargement de page.
3. WHEN un utilisateur est en train de saisir un message, THE Interface_Messagerie SHALL afficher un indicateur de saisie ("en train d'écrire...") au destinataire.
4. WHEN un message est lu par le destinataire, THE Interface_Messagerie SHALL mettre à jour le statut du message de "non lu" à "lu" en temps réel.
5. WHEN un utilisateur est connecté à la messagerie, THE Interface_Messagerie SHALL afficher un indicateur de présence en ligne pour les interlocuteurs actifs.
6. THE Interface_Messagerie SHALL prendre en charge les types de messages suivants : texte, image, audio (message vocal), localisation GPS et notifications d'appel.
7. IF la connexion WebSocket est interrompue, THEN THE Interface_Messagerie SHALL basculer automatiquement vers le polling HTTP toutes les 5 secondes et afficher un indicateur de reconnexion.
8. WHEN un utilisateur reçoit un message alors qu'il n'est pas sur la page de messagerie, THE Plateforme SHALL incrémenter le compteur de messages non lus visible dans la navigation.

---

### Requirement 2: Calendrier de disponibilité et planning artisan

**User Story:** En tant qu'artisan, je veux gérer mes créneaux de disponibilité dans un calendrier interactif, afin que les clients puissent réserver uniquement aux horaires où je suis disponible.

#### Acceptance Criteria

1. THE Calendrier_Artisan SHALL afficher une vue mensuelle et une vue hebdomadaire des créneaux de disponibilité et des réservations confirmées.
2. WHEN un artisan crée un créneau de disponibilité, THE Calendrier_Artisan SHALL enregistrer ce créneau avec une date de début, une date de fin et un statut (disponible, indisponible, réservé).
3. WHEN un artisan marque une période comme indisponible (congé, absence), THE Plateforme SHALL empêcher toute nouvelle réservation sur cette période.
4. WHEN une réservation est confirmée, THE Calendrier_Artisan SHALL bloquer automatiquement le créneau correspondant et le marquer comme réservé.
5. WHEN un client consulte la fiche d'un artisan, THE Fiche_Artisan SHALL afficher les prochains créneaux disponibles sur les 30 prochains jours.
6. WHEN un client initie une réservation, THE Formulaire_Reservation SHALL proposer uniquement les créneaux disponibles de l'artisan sélectionné.
7. IF un artisan tente de créer un créneau qui chevauche une réservation confirmée existante, THEN THE Calendrier_Artisan SHALL rejeter la création et afficher un message d'erreur explicite. WHERE deux créneaux de disponibilité se chevauchent sans réservation confirmée, THE Calendrier_Artisan SHALL accepter la création sans erreur.
8. THE Calendrier_Artisan SHALL permettre à l'artisan de définir des horaires récurrents hebdomadaires (ex. : disponible tous les lundis de 8h à 17h).
9. WHEN un artisan débloque manuellement un créneau associé à une réservation confirmée, THE Calendrier_Artisan SHALL afficher un avertissement explicite indiquant que la réservation reste active avant de procéder au déblocage.

---

### Requirement 3: Recherche avancée et filtrage des artisans

**User Story:** En tant que client, je veux filtrer les artisans selon plusieurs critères simultanés, afin de trouver rapidement le prestataire le plus adapté à mon besoin.

#### Acceptance Criteria

1. THE Annuaire_Artisans SHALL permettre de filtrer les artisans par : catégorie de métier, note minimale, fourchette de tarif horaire, zone d'intervention (quartier de Porto-Novo), badge (certifié, élite) et disponibilité immédiate.
2. WHEN un client applique plusieurs filtres simultanément, THE Annuaire_Artisans SHALL retourner uniquement les artisans satisfaisant l'intégralité des critères sélectionnés (conjonction logique AND).
3. WHEN un client saisit un terme de recherche textuelle, THE Annuaire_Artisans SHALL rechercher dans le métier, la description, la bio et la zone d'intervention de l'artisan.
4. WHEN un client active le filtre de disponibilité immédiate, THE Annuaire_Artisans SHALL afficher uniquement les artisans ayant au moins un créneau de disponibilité effectivement enregistré dans les 48 heures suivantes, indépendamment de tout indicateur de disponibilité générique.
5. THE Annuaire_Artisans SHALL permettre de trier les résultats par : note moyenne (décroissant), tarif horaire (croissant/décroissant), distance (croissant si GPS disponible) et nombre d'avis.
6. WHEN un client active la géolocalisation, THE Annuaire_Artisans SHALL afficher la distance en kilomètres entre le client et chaque artisan, calculée avec la formule Haversine.
7. THE Annuaire_Artisans SHALL afficher le nombre total de résultats correspondant aux filtres actifs.
8. WHEN aucun artisan ne correspond aux filtres appliqués, THE Annuaire_Artisans SHALL afficher un message explicatif et proposer d'élargir les critères de recherche.

---

### Requirement 4: Paiement séquestre et paiement en plusieurs fois

**User Story:** En tant que client, je veux payer un acompte à la réservation et le solde après validation de la prestation, afin d'être protégé contre les prestations non réalisées.

#### Acceptance Criteria

1. WHEN un client confirme une réservation, THE Systeme_Paiement SHALL collecter un acompte dont le pourcentage (entre 20% et 50%) est défini par l'artisan dans son profil.
2. WHILE une réservation est en statut "en_cours" ou "confirmée", THE Systeme_Paiement SHALL conserver les fonds de l'acompte en séquestre et ne pas les verser à l'artisan.
3. WHEN un client marque une réservation comme terminée et satisfaisante, THE Systeme_Paiement SHALL déclencher le versement de l'acompte séquestré à l'artisan dans un délai de 24 heures.
4. WHEN un litige est ouvert sur une réservation, THE Systeme_Paiement SHALL geler les fonds en séquestre à titre indicatif, mais des versements manuels restent possibles si l'Admin le décide explicitement.
5. WHEN l'Admin résout un litige en faveur du client, THE Systeme_Paiement SHALL initier le remboursement de l'acompte au client.
6. WHEN l'Admin résout un litige en faveur de l'artisan, THE Systeme_Paiement SHALL verser les fonds séquestrés à l'artisan.
7. THE Systeme_Paiement SHALL enregistrer chaque transaction avec : montant, commission plateforme (pourcentage configurable par l'Admin sans restriction de valeur maximale), référence externe, statut et horodatage.
8. WHEN un Webhook de confirmation est reçu de Kkiapay ou FedaPay, THE Systeme_Paiement SHALL mettre à jour le statut du paiement correspondant et notifier le client et l'artisan.

---

### Requirement 5: Génération de factures et reçus

**User Story:** En tant que client ou artisan, je veux obtenir une facture ou un reçu PDF pour chaque transaction, afin de disposer d'une preuve de paiement pour mes dossiers.

#### Acceptance Criteria

1. WHEN un paiement est confirmé avec succès, THE Generateur_Facture SHALL créer automatiquement un reçu PDF contenant : numéro de référence unique, date, montant, détail de la prestation, coordonnées du client et de l'artisan, et mention de la commission plateforme.
2. WHEN un client ou un artisan accède à la page de détail d'un paiement, THE Interface_Paiement SHALL afficher un bouton de téléchargement du reçu PDF.
3. THE Generateur_Facture SHALL numéroter les factures de manière séquentielle et unique au format "AP-AAAA-NNNNN" (ex. : AP-2025-00001).
4. WHEN une facture est générée, THE Plateforme SHALL envoyer le reçu PDF en pièce jointe par email au client et à l'artisan.
5. THE Interface_Paiement SHALL permettre à l'artisan de consulter l'historique complet de ses revenus avec filtrage par période (semaine, mois, trimestre, année).
6. THE Tableau_de_Bord_Artisan SHALL afficher les indicateurs financiers suivants : revenus du mois en cours, revenus de l'année, nombre de prestations payées, montant moyen par prestation (affiché à 0 FCFA si aucune prestation n'a encore été payée) et commission totale versée à la plateforme.

---

### Requirement 6: Système de notifications push

**User Story:** En tant qu'utilisateur, je veux recevoir des notifications push sur mon navigateur ou appareil mobile, afin d'être alerté des événements importants même lorsque je n'utilise pas activement la plateforme.

#### Acceptance Criteria

1. WHEN un utilisateur se connecte pour la première fois, THE Systeme_Notifications SHALL demander l'autorisation d'envoyer des notifications push via l'API Web Push (VAPID).
2. WHEN un artisan reçoit une nouvelle réservation, THE Systeme_Notifications SHALL envoyer une notification push à l'artisan contenant le nom du client et la date demandée.
3. WHEN un client reçoit une réponse à son devis, THE Systeme_Notifications SHALL envoyer une notification push au client avec le montant proposé par l'artisan.
4. WHEN un paiement est confirmé, THE Systeme_Notifications SHALL envoyer une notification push au client et à l'artisan avec le montant et la référence de transaction.
5. WHEN un nouveau message est reçu, THE Systeme_Notifications SHALL envoyer une notification push au destinataire si celui-ci n'est pas actuellement sur la page de messagerie.
6. WHEN un litige change de statut, THE Systeme_Notifications SHALL envoyer une notification push au client et à l'artisan concernés.
7. THE Interface_Parametres SHALL permettre à chaque utilisateur de configurer individuellement quels types de notifications push il souhaite recevoir.
8. IF un utilisateur a refusé les notifications push ou si la permission n'a pas été accordée, THEN THE Systeme_Notifications SHALL ignorer l'envoi push pour cet utilisateur et continuer à envoyer uniquement les notifications in-app dans la cloche de notification existante.

---

### Requirement 7: Notifications SMS opérationnelles

**User Story:** En tant qu'utilisateur sans accès permanent à internet, je veux recevoir des SMS pour les événements critiques, afin d'être informé même hors connexion.

#### Acceptance Criteria

1. THE Service_SMS SHALL intégrer un fournisseur SMS opérationnel compatible avec les numéros béninois (Orange Bénin, MTN Bénin) tel que Twilio, Africa's Talking ou un équivalent régional.
2. WHEN une réservation est confirmée par un artisan, THE Service_SMS SHALL envoyer un SMS au client contenant : le nom de l'artisan, la date et l'heure de la prestation.
3. WHEN une réservation est annulée, THE Service_SMS SHALL envoyer un SMS au client et à l'artisan avec le motif d'annulation si disponible.
4. WHEN un paiement est confirmé, THE Service_SMS SHALL envoyer un SMS de confirmation au client avec le montant et la référence de transaction.
5. WHEN un litige est ouvert, THE Service_SMS SHALL envoyer un SMS à l'artisan concerné l'informant de l'ouverture du litige.
6. IF l'envoi d'un SMS échoue, THEN THE Service_SMS SHALL enregistrer l'échec dans les logs avec le numéro de téléphone (masqué), le type de message et le code d'erreur retourné.
7. THE Service_SMS SHALL respecter les préférences de l'utilisateur : WHEN un utilisateur désactive les SMS dans ses paramètres, THE Service_SMS SHALL ne plus envoyer de SMS à cet utilisateur. IF l'état des préférences SMS est ambigu ou indéterminé, THEN THE Service_SMS SHALL bloquer l'envoi par défaut.

---

### Requirement 8: Workflow de résolution des litiges

**User Story:** En tant qu'admin, je veux disposer d'un workflow structuré pour traiter les litiges avec collecte de preuves et médiation, afin de résoudre les conflits de manière équitable et traçable.

#### Acceptance Criteria

1. WHEN un client ouvre un litige, THE Formulaire_Litige SHALL permettre de joindre jusqu'à 5 fichiers de preuve (images ou documents PDF, max 10 Mo chacun) et de sélectionner un motif parmi une liste prédéfinie (travaux non réalisés, qualité insuffisante, désaccord tarifaire, autre).
2. WHEN un litige est ouvert, THE Plateforme SHALL notifier l'artisan concerné et lui accorder un délai de 72 heures pour soumettre sa réponse et ses propres preuves.
3. WHEN l'artisan soumet sa réponse, THE Interface_Litige SHALL permettre à l'artisan de joindre jusqu'à 5 fichiers de preuve et de rédiger une réponse textuelle.
4. THE Interface_Admin_Litige SHALL afficher côte à côte les preuves du client et de l'artisan, le détail de la réservation concernée et l'historique des messages échangés.
5. WHEN l'Admin prend une décision sur un litige, THE Interface_Admin_Litige SHALL bloquer la validation tant que l'Admin n'a pas saisi un motif de décision d'au moins 50 caractères.
6. WHEN un litige est résolu, THE Plateforme SHALL notifier le client et l'artisan par notification in-app, push et SMS avec le détail de la décision.
7. THE Interface_Litige SHALL afficher une chronologie (timeline) de toutes les actions effectuées sur le litige : ouverture, réponse artisan, prise en charge admin, décision.
8. IF le délai de réponse de 72 heures de l'artisan est dépassé, THEN THE Plateforme SHALL notifier l'Admin et marquer automatiquement le litige comme "en attente de décision admin". THE Interface_Litige SHALL ne pas permettre l'escalade manuelle vers l'Admin avant l'expiration de ce délai.

---

### Requirement 9: Système d'avis enrichi

**User Story:** En tant qu'artisan, je veux pouvoir répondre publiquement aux avis de mes clients, afin de montrer mon professionnalisme et d'apporter des précisions si nécessaire.

#### Acceptance Criteria

1. WHEN un artisan consulte ses avis, THE Interface_Avis_Artisan SHALL permettre à l'artisan de rédiger une réponse publique à chaque avis reçu, limitée à 500 caractères.
2. WHEN un artisan soumet une réponse à un avis, THE Plateforme SHALL notifier le client auteur de l'avis que l'artisan a répondu.
3. WHEN un visiteur consulte la fiche d'un artisan, THE Fiche_Artisan SHALL afficher les avis avec la réponse de l'artisan si elle existe, clairement identifiée comme "Réponse de l'artisan".
4. THE Interface_Avis SHALL permettre aux clients de noter séparément : qualité du travail, ponctualité, communication et rapport qualité/prix, chacun sur une échelle de 1 à 5.
5. WHEN un avis est soumis avec des notes détaillées, THE Fiche_Artisan SHALL afficher les moyennes par critère en plus de la note globale.
6. WHEN un utilisateur signale un avis comme inapproprié, THE Plateforme SHALL notifier l'Admin et masquer temporairement l'avis en attente de modération.
7. THE Interface_Admin_Avis SHALL permettre à l'Admin de valider (rendre visible) ou supprimer définitivement les avis signalés, avec saisie obligatoire d'un motif. Aucune autre action de changement de statut n'est autorisée sur les avis signalés.
8. THE Systeme_Scoring SHALL recalculer le Score_Confiance de l'artisan dans les 5 minutes suivant la soumission ou la suppression d'un avis.

---

### Requirement 10: Tableau de bord analytique artisan

**User Story:** En tant qu'artisan, je veux visualiser mes performances et revenus dans un tableau de bord détaillé, afin de piloter mon activité et identifier les axes d'amélioration.

#### Acceptance Criteria

1. THE Tableau_de_Bord_Artisan SHALL afficher les indicateurs suivants pour la période sélectionnée : nombre de réservations (total, en cours, terminées, annulées), revenus bruts, revenus nets (après commission), note moyenne, nombre d'avis reçus et taux de complétion des réservations.
2. THE Tableau_de_Bord_Artisan SHALL permettre de filtrer les données par période : 7 derniers jours, 30 derniers jours, 3 derniers mois, 12 derniers mois et période personnalisée.
3. THE Tableau_de_Bord_Artisan SHALL afficher un graphique d'évolution mensuelle des revenus sur les 12 derniers mois.
4. THE Tableau_de_Bord_Artisan SHALL afficher la répartition des réservations par catégorie de prestation sous forme de graphique.
5. THE Tableau_de_Bord_Artisan SHALL afficher les 5 clients les plus fidèles (nombre de réservations terminées) sur la période sélectionnée.
6. WHEN le Score_Confiance de l'artisan évolue, THE Tableau_de_Bord_Artisan SHALL afficher l'historique des 6 dernières valeurs du score avec la date de calcul.
7. THE Tableau_de_Bord_Artisan SHALL afficher le positionnement de l'artisan dans son classement de catégorie (ex. : "3ème plombier sur 12 dans votre zone").
8. THE Tableau_de_Bord_Artisan SHALL afficher des recommandations personnalisées pour améliorer le Score_Confiance (ex. : "Ajoutez 2 photos à votre portfolio pour gagner 2 points").

---

### Requirement 11: Tableau de bord analytique admin enrichi

**User Story:** En tant qu'admin, je veux disposer d'indicateurs avancés et d'exports de données, afin de prendre des décisions éclairées sur la gestion de la plateforme.

#### Acceptance Criteria

1. THE Tableau_de_Bord_Admin SHALL afficher en temps réel : le nombre d'utilisateurs connectés, les réservations créées dans les dernières 24 heures et les paiements en attente de confirmation.
2. THE Tableau_de_Bord_Admin SHALL afficher un graphique de rétention des utilisateurs : pourcentage d'utilisateurs ayant effectué au moins une réservation dans les 30 jours suivant leur inscription.
3. THE Tableau_de_Bord_Admin SHALL afficher le taux de conversion devis → réservation par catégorie de métier.
4. THE Interface_Admin_Rapports SHALL permettre d'exporter les données de réservations, paiements et avis au format CSV pour une période sélectionnée.
5. THE Interface_Admin_Rapports SHALL afficher une carte de chaleur (heatmap) de la densité des réservations par quartier de Porto-Novo.
6. WHEN le nombre de litiges ouverts est strictement supérieur à 10, THE Tableau_de_Bord_Admin SHALL afficher une alerte visuelle prominente sur le tableau de bord. WHILE le nombre de litiges ouverts est inférieur ou égal à 10, THE Tableau_de_Bord_Admin SHALL ne pas afficher cette alerte.
7. THE Interface_Admin_Rapports SHALL afficher le revenu moyen par artisan, par catégorie et par mois.
8. THE Tableau_de_Bord_Admin SHALL afficher les artisans inactifs (aucune réservation depuis 60 jours) avec une option de relance par notification.

---

### Requirement 12: Académie de formation enrichie

**User Story:** En tant qu'artisan, je veux accéder à des formations structurées avec du contenu intégré (vidéos, quiz), afin de développer mes compétences directement sur la plateforme.

#### Acceptance Criteria

1. THE Academie SHALL prendre en charge les types de contenu suivants : vidéo (URL YouTube/Vimeo intégrée), document PDF téléchargeable, article texte riche (HTML) et quiz à choix multiples.
2. WHEN un artisan accède à une formation, THE Academie SHALL enregistrer sa progression (pourcentage de contenu consulté) et reprendre depuis le dernier point d'arrêt.
3. WHEN un artisan complète une formation avec un score de quiz supérieur ou égal à 70%, THE Academie SHALL générer automatiquement un certificat de complétion PDF avec le nom de l'artisan, le titre de la formation et la date.
4. THE Interface_Admin_Academie SHALL permettre à l'Admin de créer, modifier et supprimer des formations avec : titre, description, type de contenu, URL ou fichier, et catégorie de métier associée.
5. THE Academie SHALL organiser les formations en parcours thématiques (ex. : "Parcours Plomberie Débutant") composés de plusieurs modules ordonnés.
6. WHEN un artisan complète toutes les formations d'un parcours thématique, THE Systeme_Scoring SHALL ajouter 5 points bonus au Score_Confiance de l'artisan, indépendamment des scores obtenus aux quiz individuels.
7. THE Academie SHALL afficher pour chaque formation : le nombre d'artisans l'ayant complétée, la durée estimée et le niveau requis (débutant, intermédiaire, avancé).
8. WHEN une nouvelle formation est publiée dans une catégorie, THE Plateforme SHALL notifier les artisans de cette catégorie par notification in-app.

---

### Requirement 13: Marketplace fournisseurs partenaires

**User Story:** En tant qu'artisan, je veux accéder à un catalogue de fournisseurs partenaires avec leurs offres et tarifs, afin de sourcer facilement les matériaux nécessaires à mes prestations.

#### Acceptance Criteria

1. THE Marketplace_Fournisseurs SHALL afficher les fournisseurs partenaires avec : nom, description, type (matériaux, outillage, équipements), logo, coordonnées, site web et catégories de produits proposés.
2. THE Marketplace_Fournisseurs SHALL permettre de filtrer les fournisseurs par type et par catégorie de métier associée.
3. WHEN un artisan clique sur "Contacter ce fournisseur", THE Marketplace_Fournisseurs SHALL afficher les coordonnées complètes du fournisseur et proposer d'envoyer un message pré-rempli par email.
4. THE Interface_Admin_Fournisseurs SHALL permettre à l'Admin de créer, modifier, activer et désactiver des fiches fournisseurs avec : nom, description, type, logo, email, téléphone, site web et catégories associées.
5. THE Marketplace_Fournisseurs SHALL permettre aux artisans de noter les fournisseurs partenaires sur une échelle de 1 à 5 avec un commentaire optionnel.
6. WHEN un fournisseur partenaire est désactivé par l'Admin, THE Marketplace_Fournisseurs SHALL masquer immédiatement sa fiche pour tous les utilisateurs, y compris ceux qui consultent actuellement la page du fournisseur.
7. THE Marketplace_Fournisseurs SHALL afficher les fournisseurs les mieux notés en priorité dans les résultats de recherche.

---

### Requirement 14: Géodécouverte avancée des artisans

**User Story:** En tant que client, je veux voir les artisans disponibles autour de moi sur une carte interactive avec filtrage en temps réel, afin de choisir le prestataire le plus proche et le plus adapté.

#### Acceptance Criteria

1. THE Carte_Artisans SHALL afficher les artisans actifs sur une carte interactive centrée sur Porto-Novo avec des marqueurs colorés selon leur badge (aucun : gris, certifié : orange, élite : violet).
2. WHEN un client active sa géolocalisation, THE Carte_Artisans SHALL centrer la carte sur sa position et afficher un rayon de recherche ajustable (1 km, 3 km, 5 km, 10 km).
3. WHEN un client clique sur le marqueur d'un artisan, THE Carte_Artisans SHALL afficher une fiche résumée avec : photo, métier, note, badge, tarif horaire et un bouton "Voir le profil".
4. THE Carte_Artisans SHALL se mettre à jour automatiquement lorsque les filtres de catégorie ou de note sont modifiés, sans rechargement de page.
5. WHEN un artisan met à jour sa position GPS, THE Carte_Artisans SHALL refléter la nouvelle position dans un délai de 60 secondes pour les clients consultant la carte. THE Systeme_Geolocalisation SHALL traiter toutes les mises à jour de position reçues, quelle que soit la localisation actuelle de l'artisan, et afficher la mise à jour même si elle arrive après le délai de 60 secondes.
6. THE Carte_Artisans SHALL afficher uniquement les artisans dont la position GPS est dans les limites géographiques de Porto-Novo (latitude entre 6.47 et 6.52, longitude entre 2.60 et 2.68).
7. IF la géolocalisation du client est refusée ou indisponible, THEN THE Carte_Artisans SHALL centrer la carte sur Porto-Novo (6.4969° N, 2.6289° E) par défaut.

---

### Requirement 15: Amélioration de la réactivité mobile

**User Story:** En tant qu'utilisateur sur mobile, je veux que toutes les fonctionnalités de la plateforme soient pleinement utilisables sur un écran de 375px de large, afin d'accéder au service depuis mon smartphone sans friction.

#### Acceptance Criteria

1. THE Plateforme SHALL afficher correctement toutes les pages sur des écrans de largeur minimale de 375px (iPhone SE) sans défilement horizontal. Cette exigence s'applique uniquement aux écrans dont la largeur est supérieure ou égale à 375px.
2. THE Interface_Messagerie SHALL adapter son layout sur mobile : liste des conversations en plein écran, conversation active en plein écran avec navigation retour.
3. THE Formulaire_Reservation SHALL être entièrement utilisable sur mobile avec des champs de saisie et boutons d'au moins 44px de hauteur (recommandation WCAG 2.5.5).
4. THE Carte_Artisans SHALL être utilisable sur mobile avec des contrôles de zoom tactiles et des marqueurs d'au moins 44px de zone de toucher.
5. THE Tableau_de_Bord_Artisan SHALL adapter ses graphiques sur mobile en affichant une version simplifiée avec défilement horizontal si nécessaire.
6. THE Interface_Paiement SHALL afficher les formulaires de paiement mobile-money en priorité sur les appareils dont la largeur d'écran CSS est strictement inférieure à 768px, détectée uniquement par la largeur d'écran sans recours à d'autres mécanismes de détection d'appareil.
7. THE Plateforme SHALL obtenir un score Lighthouse Performance supérieur à 70 sur mobile pour les pages principales (accueil, annuaire, fiche artisan, tableau de bord).
