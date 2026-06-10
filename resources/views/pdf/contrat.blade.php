<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Contrat de Prestation {{ $contrat->numero_contrat }}</title>
    <style>
        /* ── Reset & base ──────────────────────────────────────────── */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            background: #ffffff;
            line-height: 1.5;
        }

        /* ── Page layout ───────────────────────────────────────────── */
        .page {
            width: 100%;
            padding: 20px 30px;
            position: relative;
        }

        /* ── Watermark (brouillon only) ────────────────────────────── */
        @if($brouillon)
        .watermark {
            position: fixed;
            top: 38%;
            left: 50%;
            transform: translateX(-50%) rotate(-35deg);
            font-size: 72px;
            font-weight: bold;
            color: rgba(220, 38, 38, 0.18);
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            letter-spacing: 6px;
        }
        @endif

        /* ── Header ────────────────────────────────────────────────── */
        .header {
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 14px;
            margin-bottom: 18px;
        }

        .header-inner {
            width: 100%;
        }

        .header-left {
            display: inline-block;
            width: 60%;
            vertical-align: middle;
        }

        .header-right {
            display: inline-block;
            width: 38%;
            vertical-align: middle;
            text-align: right;
        }

        .brand-name {
            font-size: 22px;
            font-weight: bold;
            color: #4f46e5;
            letter-spacing: 1px;
        }

        .brand-sub {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
        }

        .contract-title {
            font-size: 15px;
            font-weight: bold;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .contract-meta {
            font-size: 10px;
            color: #6b7280;
            margin-top: 4px;
        }

        .contract-numero {
            font-size: 13px;
            font-weight: bold;
            color: #4f46e5;
        }

        /* ── Statut badge ──────────────────────────────────────────── */
        .statut-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }

        .statut-genere         { background: #fef3c7; color: #92400e; }
        .statut-en-attente     { background: #dbeafe; color: #1e40af; }
        .statut-partiel        { background: #ede9fe; color: #5b21b6; }
        .statut-finalise       { background: #d1fae5; color: #065f46; }
        .statut-annule         { background: #fee2e2; color: #991b1b; }

        /* ── Section titles ────────────────────────────────────────── */
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 10px;
            margin-top: 16px;
        }

        /* ── Parties table ─────────────────────────────────────────── */
        .parties-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }

        .parties-table td {
            width: 50%;
            padding: 10px 12px;
            vertical-align: top;
        }

        .party-box {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 12px;
            background: #f9fafb;
        }

        .party-role {
            font-size: 9px;
            font-weight: bold;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .party-name {
            font-size: 13px;
            font-weight: bold;
            color: #1a1a1a;
        }

        /* ── Info rows ─────────────────────────────────────────────── */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table tr td {
            padding: 5px 0;
            vertical-align: top;
        }

        .info-label {
            width: 38%;
            font-weight: bold;
            color: #374151;
            font-size: 10px;
        }

        .info-value {
            color: #1a1a1a;
            font-size: 11px;
        }

        /* ── Amount box ────────────────────────────────────────────── */
        .amount-box {
            background: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 10px 14px;
            border-radius: 0 6px 6px 0;
            margin-top: 8px;
        }

        .amount-label {
            font-size: 10px;
            color: #0c4a6e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .amount-value {
            font-size: 18px;
            font-weight: bold;
            color: #0284c7;
            margin-top: 2px;
        }

        /* ── Description box ───────────────────────────────────────── */
        .description-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 12px;
            margin-top: 6px;
            font-size: 11px;
            color: #374151;
            white-space: pre-wrap;
        }

        /* ── Clauses litige ────────────────────────────────────────── */
        .clause-item {
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #fffbeb;
            border-left: 3px solid #f59e0b;
            border-radius: 0 4px 4px 0;
        }

        .clause-titre {
            font-size: 10px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 3px;
        }

        .clause-contenu {
            font-size: 10px;
            color: #374151;
            line-height: 1.5;
        }

        /* ── Signatures section ────────────────────────────────────── */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
        }

        .signatures-table td {
            width: 50%;
            padding: 6px 8px;
            vertical-align: top;
        }

        .signature-box {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            min-height: 90px;
            background: #fafafa;
        }

        .signature-role {
            font-size: 10px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .signature-signed {
            background: #f0fdf4;
            border-color: #86efac;
        }

        .signature-pending {
            background: #fafafa;
            border-color: #e5e7eb;
        }

        .signature-status {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
        }

        .signature-date {
            font-size: 10px;
            color: #374151;
            margin-top: 4px;
        }

        .signature-hash {
            font-size: 8px;
            color: #9ca3af;
            font-family: DejaVu Sans Mono, Courier New, monospace;
            word-break: break-all;
            margin-top: 4px;
            line-height: 1.4;
        }

        .signature-check {
            font-size: 16px;
            color: #16a34a;
        }

        /* ── Footer ────────────────────────────────────────────────── */
        .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
        }

        /* ── Legal mentions (PDF final only) ──────────────────────── */
        .legal-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 8px;
            font-size: 9px;
            color: #6b7280;
            line-height: 1.5;
        }

        /* ── Divider ───────────────────────────────────────────────── */
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 12px 0;
        }

        /* ── Utility ────────────────────────────────────────────────── */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .mt-4 { margin-top: 4px; }
        .mt-8 { margin-top: 8px; }
        .bold { font-weight: bold; }
    </style>
</head>
<body>
<div class="page">

    {{-- ── Watermark (brouillon) ──────────────────────────────────── --}}
    @if($brouillon)
        <div class="watermark">À SIGNER</div>
    @endif

    {{-- ══════════════════════════════════════════════════════════════
         HEADER — Logo + titre + numéro de contrat
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="header">
        <table class="header-inner" cellpadding="0" cellspacing="0">
            <tr>
                <td class="header-left">
                    <div class="brand-name">ArtisanPro</div>
                    <div class="brand-sub">Plateforme de mise en relation artisans &amp; clients</div>
                </td>
                <td class="header-right">
                    <div class="contract-title">Contrat de Prestation</div>
                    <div class="contract-numero">{{ $contrat->numero_contrat }}</div>
                    <div class="contract-meta">
                        Généré le {{ $contrat->genere_at ? $contrat->genere_at->format('d/m/Y à H:i') : $contrat->created_at->format('d/m/Y à H:i') }}
                    </div>
                    <div class="mt-4">
                        @php
                            $statutClass = match($contrat->statut) {
                                'genere'                => 'statut-genere',
                                'en_attente_signatures' => 'statut-en-attente',
                                'partiellement_signe'   => 'statut-partiel',
                                'finalise'              => 'statut-finalise',
                                'annule'                => 'statut-annule',
                                default                 => 'statut-genere',
                            };
                            $statutLabel = match($contrat->statut) {
                                'genere'                => 'Généré',
                                'en_attente_signatures' => 'En attente de signatures',
                                'partiellement_signe'   => 'Partiellement signé',
                                'finalise'              => 'Finalisé',
                                'annule'                => 'Annulé',
                                default                 => $contrat->statut,
                            };
                        @endphp
                        <span class="statut-badge {{ $statutClass }}">{{ $statutLabel }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- ══════════════════════════════════════════════════════════════
         SECTION 1 — Parties contractantes
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="section-title">1. Parties contractantes</div>
    <table class="parties-table" cellpadding="0" cellspacing="0">
        <tr>
            <td style="padding-right: 8px;">
                <div class="party-box">
                    <div class="party-role">Le Client</div>
                    <div class="party-name">{{ $contrat->nom_client }}</div>
                </div>
            </td>
            <td style="padding-left: 8px;">
                <div class="party-box">
                    <div class="party-role">L'Artisan / Prestataire</div>
                    <div class="party-name">{{ $contrat->nom_artisan }}</div>
                </div>
            </td>
        </tr>
    </table>

    {{-- ══════════════════════════════════════════════════════════════
         SECTION 2 — Objet du contrat / Prestation
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="section-title">2. Objet de la prestation</div>
    <div class="description-box">{{ $contrat->description_prestation }}</div>

    {{-- ══════════════════════════════════════════════════════════════
         SECTION 3 — Détails financiers & calendrier
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="section-title">3. Conditions financières et calendrier</div>
    <table class="info-table" cellpadding="0" cellspacing="0">
        <tr>
            <td class="info-label">Date de début :</td>
            <td class="info-value">
                {{ $contrat->date_debut_prestation ? $contrat->date_debut_prestation->format('d/m/Y') : '—' }}
            </td>
        </tr>
        <tr>
            <td class="info-label">Date de fin :</td>
            <td class="info-value">
                {{ $contrat->date_fin_prestation ? $contrat->date_fin_prestation->format('d/m/Y') : 'Non définie' }}
            </td>
        </tr>
        <tr>
            <td class="info-label">Adresse d'intervention :</td>
            <td class="info-value">
                {{ $contrat->adresse_intervention ?? 'Non précisée' }}
            </td>
        </tr>
    </table>

    <div class="amount-box mt-8">
        <div class="amount-label">Montant total de la prestation</div>
        <div class="amount-value">{{ number_format((float) $contrat->montant_total, 0, ',', ' ') }} FCFA</div>
    </div>

    {{-- ══════════════════════════════════════════════════════════════
         SECTION 4 — Clauses de résolution des litiges
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="section-title">4. Clauses de résolution des litiges</div>
    @if(!empty($contrat->clauses_litige))
        @foreach($contrat->clauses_litige as $clause)
            <div class="clause-item">
                <div class="clause-titre">{{ $clause['titre'] ?? '' }}</div>
                <div class="clause-contenu">{{ $clause['contenu'] ?? '' }}</div>
            </div>
        @endforeach
    @else
        <p style="font-size:10px; color:#9ca3af; font-style:italic;">Aucune clause de litige enregistrée.</p>
    @endif

    {{-- ══════════════════════════════════════════════════════════════
         SECTION 5 — Signatures électroniques
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="section-title">5. Signatures électroniques</div>
    <table class="signatures-table" cellpadding="0" cellspacing="0">
        <tr>
            {{-- Signature Client --}}
            <td style="padding-right: 8px;">
                @if($contrat->signature_client_at)
                    <div class="signature-box signature-signed">
                        <div class="signature-role">Signature du Client</div>
                        <div class="signature-check">&#10003;</div>
                        <div class="signature-date">
                            <span class="bold">{{ $contrat->nom_client }}</span><br>
                            Signé le {{ $contrat->signature_client_at->format('d/m/Y à H:i:s') }}
                        </div>
                        @if(!$brouillon && $contrat->signature_client_hash)
                            <div class="signature-hash">
                                Empreinte HMAC&nbsp;:<br>
                                {{ $contrat->signature_client_hash }}
                            </div>
                        @endif
                    </div>
                @else
                    <div class="signature-box signature-pending">
                        <div class="signature-role">Signature du Client</div>
                        <div class="signature-status">En attente de signature</div>
                        <div style="margin-top: 30px; border-bottom: 1px dashed #d1d5db;"></div>
                        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">Signature à apposer</div>
                    </div>
                @endif
            </td>

            {{-- Signature Artisan --}}
            <td style="padding-left: 8px;">
                @if($contrat->signature_artisan_at)
                    <div class="signature-box signature-signed">
                        <div class="signature-role">Signature de l'Artisan</div>
                        <div class="signature-check">&#10003;</div>
                        <div class="signature-date">
                            <span class="bold">{{ $contrat->nom_artisan }}</span><br>
                            Signé le {{ $contrat->signature_artisan_at->format('d/m/Y à H:i:s') }}
                        </div>
                        @if(!$brouillon && $contrat->signature_artisan_hash)
                            <div class="signature-hash">
                                Empreinte HMAC&nbsp;:<br>
                                {{ $contrat->signature_artisan_hash }}
                            </div>
                        @endif
                    </div>
                @else
                    <div class="signature-box signature-pending">
                        <div class="signature-role">Signature de l'Artisan</div>
                        <div class="signature-status">En attente de signature</div>
                        <div style="margin-top: 30px; border-bottom: 1px dashed #d1d5db;"></div>
                        <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">Signature à apposer</div>
                    </div>
                @endif
            </td>
        </tr>
    </table>

    {{-- ══════════════════════════════════════════════════════════════
         MENTIONS LÉGALES (PDF final uniquement)
    ══════════════════════════════════════════════════════════════════ --}}
    @if(!$brouillon)
        <div class="section-title">6. Mentions légales</div>
        <div class="legal-box">
            <p>
                Le présent contrat a été généré électroniquement par la plateforme <strong>ArtisanPro</strong>
                et engage juridiquement les parties signataires conformément aux dispositions légales en vigueur
                relatives aux contrats électroniques.
            </p>
            <p style="margin-top: 6px;">
                Les signatures électroniques apposées sur ce document constituent une preuve d'accord des parties
                sur les termes du contrat. Les empreintes HMAC-SHA256 horodatées garantissent l'intégrité et
                l'authenticité de chaque signature.
            </p>
            <p style="margin-top: 6px;">
                En cas de litige, les parties s'engagent à respecter la procédure de médiation ArtisanPro
                avant tout recours judiciaire, conformément aux clauses de résolution des litiges du présent contrat.
            </p>
            @if($contrat->finalise_at)
                <p style="margin-top: 6px;">
                    <strong>Date de finalisation :</strong>
                    {{ $contrat->finalise_at->format('d/m/Y à H:i:s') }}
                </p>
            @endif
        </div>
    @endif

    {{-- ══════════════════════════════════════════════════════════════
         FOOTER
    ══════════════════════════════════════════════════════════════════ --}}
    <div class="footer">
        <p>
            &copy; {{ now()->year }} ArtisanPro — Tous droits réservés.
            Ce document est confidentiel et réservé aux parties contractantes.
        </p>
        <p class="mt-4">
            Contrat N° <strong>{{ $contrat->numero_contrat }}</strong>
            @if($brouillon)
                — <em>BROUILLON — À SIGNER</em>
            @else
                — <em>Document officiel finalisé</em>
            @endif
        </p>
    </div>

</div>
</body>
</html>
