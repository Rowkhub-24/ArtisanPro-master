import React, { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { AlertTriangle, X } from 'lucide-react';
import MaterielsEditor, { type LigneMateriel, type MaterielsEditorHandle } from './MaterielsEditor';

export interface DevisItem {
    id: number;
    description_travaux: string;
    statut: 'en_attente' | 'accepte' | 'refuse' | 'contre_offre';
    created_at: string;
    montant_propose?: number | null;
    notes_artisan?: string | null;
    sous_total_materiels?: number | null;
    materiels?: LigneMateriel[];
    client?: {
        user: {
            prenom: string;
            nom: string;
            email: string;
            telephone?: string;
        };
    };
}

interface DevisReponsePanelProps {
    devis: DevisItem;
    onClose: () => void;
    onSuccess: (updated: Partial<DevisItem>) => void;
}

/**
 * Panneau de réponse artisan à un devis.
 * Intègre saisie du montant proposé, notes libres, et la liste des matériels.
 */
export default function DevisReponsePanel({ devis, onClose, onSuccess }: DevisReponsePanelProps) {
    const [montantPropose, setMontantPropose] = useState<string>(
        devis.montant_propose != null ? String(devis.montant_propose) : ''
    );
    const [notesArtisan, setNotesArtisan] = useState<string>(devis.notes_artisan ?? '');
    const [materiels, setMateriels] = useState<LigneMateriel[]>(devis.materiels ?? []);
    const [submitting, setSubmitting] = useState(false);
    const [touched, setTouched] = useState(false);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

    // Référence vers le handle impératif du MaterielsEditor
    const editorRef = useRef<MaterielsEditorHandle>(null);

    const sousTotalMateriels = materiels.reduce((acc, ligne) => {
        return acc + (Number(ligne.quantite) || 0) * (Number(ligne.prix_unitaire) || 0);
    }, 0);

    const montantProposeParsed = parseFloat(montantPropose) || 0;
    const showWarning =
        touched &&
        montantProposeParsed > 0 &&
        sousTotalMateriels > 0 &&
        montantProposeParsed < sousTotalMateriels;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);

        // Déclencher la validation inline du MaterielsEditor via le ref
        if (editorRef.current) {
            const valid = editorRef.current.validate();
            if (!valid) return;
        }

        if (!montantPropose || isNaN(parseFloat(montantPropose))) return;

        setSubmitting(true);

        router.patch(
            route('artisan.devis.repondre', devis.id),
            {
                montant_propose: parseFloat(montantPropose),
                notes_artisan: notesArtisan || null,
                materiels: materiels.map(({ nom, quantite, unite, prix_unitaire }) => ({
                    nom,
                    quantite: Number(quantite),
                    unite,
                    prix_unitaire: Number(prix_unitaire),
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Inertia recharge la page avec les nouvelles données du serveur.
                    // On ferme juste le panel — le state est mis à jour par le rechargement Inertia.
                    setSubmitting(false);
                    setServerErrors({});
                    onSuccess({
                        statut: 'accepte',
                        montant_propose: parseFloat(montantPropose),
                        notes_artisan: notesArtisan || null,
                        sous_total_materiels: Math.round(sousTotalMateriels * 100) / 100,
                        materiels: materiels.map(({ nom, quantite, unite, prix_unitaire }, i) => ({
                            nom,
                            quantite: Number(quantite),
                            unite,
                            prix_unitaire: Number(prix_unitaire),
                            ordre: i,
                            sous_total: Number(quantite) * Number(prix_unitaire),
                        })),
                    });
                    onClose();
                },
                onError: (errors) => {
                    setSubmitting(false);
                    setServerErrors(errors as Record<string, string>);
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">Répondre au devis</h2>
                        <p className="text-sm text-[hsl(20,10%,50%)]">
                            Client : {devis.client?.user
                                ? `${devis.client.user.prenom} ${devis.client.user.nom}`
                                : 'Client inconnu'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-[hsl(20,10%,50%)] hover:bg-gray-100 transition-colors"
                        aria-label="Fermer le panneau"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Description des travaux */}
                <div className="mx-6 mt-4 rounded-xl bg-[hsl(36,33%,97%)] px-4 py-3">
                    <p className="text-xs font-medium text-[hsl(20,10%,50%)] uppercase tracking-wide mb-1">
                        Description des travaux
                    </p>
                    <p className="text-sm text-[hsl(20,14%,12%)]">{devis.description_travaux}</p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 mt-4">
                    {/* Montant proposé */}
                    <div>
                        <label
                            htmlFor="montant_propose"
                            className="block text-sm font-semibold text-[hsl(20,14%,12%)] mb-1"
                        >
                            Montant proposé (FCFA) <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="montant_propose"
                            type="number"
                            value={montantPropose}
                            onChange={(e) => setMontantPropose(e.target.value)}
                            min={0}
                            step="any"
                            required
                            className="w-full rounded-xl border border-[hsl(30,20%,82%)] px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder="Ex. 150000"
                        />

                        {/* Avertissement non-bloquant si montant < sous-total matériels */}
                        {showWarning && (
                            <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    Attention : le montant proposé ({parseFloat(montantPropose).toLocaleString('fr-FR')} FCFA)
                                    est inférieur au sous-total des matériels (
                                    {Math.round(sousTotalMateriels).toLocaleString('fr-FR')} FCFA). Cela est autorisé,
                                    mais vérifiez que votre proposition est cohérente.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes artisan */}
                    <div>
                        <label
                            htmlFor="notes_artisan"
                            className="block text-sm font-semibold text-[hsl(20,14%,12%)] mb-1"
                        >
                            Notes / commentaires (optionnel)
                        </label>
                        <textarea
                            id="notes_artisan"
                            value={notesArtisan}
                            onChange={(e) => setNotesArtisan(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            className="w-full rounded-xl border border-[hsl(30,20%,82%)] px-3 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                            placeholder="Informations complémentaires pour le client…"
                        />
                    </div>

                    {/* Liste des matériels */}
                    <div>
                        <h3 className="text-sm font-semibold text-[hsl(20,14%,12%)] mb-2">
                            Liste des matériels
                        </h3>
                        <MaterielsEditor
                            ref={editorRef}
                            value={materiels}
                            onChange={setMateriels}
                            disabled={submitting}
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[hsl(30,20%,88%)]">
                        {/* Erreurs serveur */}
                        {Object.keys(serverErrors).length > 0 && (
                            <div className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 mb-3">
                                {Object.values(serverErrors).map((err, i) => (
                                    <p key={i} className="text-xs text-red-700">{err}</p>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-gray-400 transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2.5 text-sm transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Envoi en cours…' : 'Envoyer ma réponse'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
