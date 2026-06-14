import React, { useCallback, useImperativeHandle, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface LigneMateriel {
    id?: number;
    nom: string;
    quantite: number;
    unite: string;
    prix_unitaire: number;
    sous_total?: number;
}

export interface MaterielsEditorProps {
    value: LigneMateriel[];
    onChange: (lignes: LigneMateriel[]) => void;
    disabled?: boolean;
    /** Appelé chaque fois que l'état d'erreur change (quand touched === true). */
    onHasErrors?: (hasErrors: boolean) => void;
}

/**
 * Handle exposé via React.forwardRef / useImperativeHandle.
 * Permet au parent d'appeler `ref.current.validate()` au moment de la soumission.
 */
export interface MaterielsEditorHandle {
    validate: () => boolean;
}

interface LigneErrors {
    nom?: string;
    quantite?: string;
    unite?: string;
    prix_unitaire?: string;
}

/**
 * Formate un nombre en FCFA avec séparateurs de milliers (espace).
 * Ex: 1500000 → "1 500 000 FCFA"
 */
function formatFCFA(value: number): string {
    return (
        Math.round(value)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ' FCFA'
    );
}

/**
 * Composant d'édition de la liste de matériels.
 * Tableau interactif avec validation inline, calcul temps-réel, mode disabled.
 *
 * Expose un handle { validate: () => boolean } via React.forwardRef.
 */
const MaterielsEditor = React.forwardRef<MaterielsEditorHandle, MaterielsEditorProps>(
    function MaterielsEditor({ value, onChange, disabled = false, onHasErrors }, ref) {
        const [errors, setErrors] = useState<LigneErrors[]>([]);
        const [touched, setTouched] = useState(false);

        const MAX_LIGNES = 50;

        // Calcul du total général
        const totalGeneral = value.reduce((acc, ligne) => {
            return acc + (Number(ligne.quantite) || 0) * (Number(ligne.prix_unitaire) || 0);
        }, 0);

        const validateLignes = useCallback((lignes: LigneMateriel[]): LigneErrors[] => {
            return lignes.map((ligne) => {
                const errs: LigneErrors = {};
                if (!ligne.nom || ligne.nom.trim() === '') {
                    errs.nom = 'Le nom est requis.';
                }
                const qty = Number(ligne.quantite);
                if (isNaN(qty) || qty <= 0) {
                    errs.quantite = 'La quantité doit être supérieure à 0.';
                } else if (qty > 9_999_999) {
                    errs.quantite = 'La quantité ne peut pas dépasser 9 999 999.';
                }
                if (!ligne.unite || ligne.unite.trim() === '') {
                    errs.unite = "L'unité est requise.";
                }
                const pu = Number(ligne.prix_unitaire);
                if (isNaN(pu) || pu < 0) {
                    errs.prix_unitaire = 'Le prix unitaire doit être ≥ 0.';
                } else if (pu > 99_999_999.99) {
                    errs.prix_unitaire = 'Le prix unitaire ne peut pas dépasser 99 999 999,99.';
                }
                return errs;
            });
        }, []);

        const computeHasErrors = (errs: LigneErrors[]): boolean => {
            return errs.some((e) => Object.keys(e).length > 0);
        };

        const updateLigne = (index: number, field: keyof LigneMateriel, rawValue: string | number) => {
            const updated = value.map((ligne, i) => {
                if (i !== index) return ligne;
                return { ...ligne, [field]: rawValue };
            });
            onChange(updated);
            if (touched) {
                const errs = validateLignes(updated);
                setErrors(errs);
                onHasErrors?.(computeHasErrors(errs));
            }
        };

        const ajouterLigne = () => {
            if (disabled || value.length >= MAX_LIGNES) return;
            const newLigne: LigneMateriel = {
                nom: '',
                quantite: 0,
                unite: '',
                prix_unitaire: 0,
            };
            const updated = [...value, newLigne];
            onChange(updated);
            if (touched) {
                const errs = validateLignes(updated);
                setErrors(errs);
                onHasErrors?.(computeHasErrors(errs));
            }
        };

        const supprimerLigne = (index: number) => {
            if (disabled) return;
            const updated = value.filter((_, i) => i !== index);
            onChange(updated);
            if (touched) {
                const errs = validateLignes(updated);
                setErrors(errs);
                onHasErrors?.(computeHasErrors(errs));
            }
        };

        // Exposer la validation via useImperativeHandle (appelée depuis le parent au moment de la soumission)
        const validateAndMark = (): boolean => {
            setTouched(true);
            const errs = validateLignes(value);
            setErrors(errs);
            const valid = !computeHasErrors(errs);
            onHasErrors?.(!valid);
            return valid;
        };

        useImperativeHandle(ref, () => ({
            validate: validateAndMark,
        }));

        const currentErrors = touched ? errors : value.map((): LigneErrors => ({}));
        const showErrors = touched && computeHasErrors(currentErrors);

        return (
            <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-[hsl(30,20%,88%)]">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="bg-[hsl(36,33%,97%)] border-b border-[hsl(30,20%,88%)]">
                                <th className="text-left px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-2/5">Désignation</th>
                                <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-20">Qté</th>
                                <th className="text-left px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-24">Unité</th>
                                <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-28">P.U. (FCFA)</th>
                                <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-28">Sous-total</th>
                                {!disabled && (
                                    <th className="px-3 py-2 w-10" aria-label="Actions" />
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[hsl(30,20%,92%)]">
                            {value.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={disabled ? 5 : 6}
                                        className="px-3 py-6 text-center text-[hsl(20,10%,55%)] italic"
                                    >
                                        Aucun matériel ajouté. Cliquez sur « Ajouter une ligne » pour commencer.
                                    </td>
                                </tr>
                            ) : (
                                value.map((ligne, index) => {
                                    const errs = currentErrors[index] ?? {};
                                    const sousTotalLigne = (Number(ligne.quantite) || 0) * (Number(ligne.prix_unitaire) || 0);
                                    return (
                                        <tr key={index} className="bg-white hover:bg-[hsl(36,33%,98%)]">
                                            {/* Nom */}
                                            <td className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    value={ligne.nom}
                                                    onChange={(e) => updateLigne(index, 'nom', e.target.value)}
                                                    disabled={disabled}
                                                    placeholder="Ex. Ciment Portland"
                                                    className={`w-full rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50 disabled:text-gray-500 ${
                                                        errs.nom ? 'border-red-400 bg-red-50' : 'border-[hsl(30,20%,82%)]'
                                                    }`}
                                                    aria-invalid={!!errs.nom}
                                                />
                                                {errs.nom && (
                                                    <p className="mt-0.5 text-xs text-red-600">{errs.nom}</p>
                                                )}
                                            </td>
                                            {/* Quantité */}
                                            <td className="px-2 py-1.5">
                                                <input
                                                    type="number"
                                                    value={ligne.quantite}
                                                    onChange={(e) => updateLigne(index, 'quantite', e.target.value)}
                                                    disabled={disabled}
                                                    min={0}
                                                    step="any"
                                                    className={`w-full rounded-lg border px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50 disabled:text-gray-500 ${
                                                        errs.quantite ? 'border-red-400 bg-red-50' : 'border-[hsl(30,20%,82%)]'
                                                    }`}
                                                    aria-invalid={!!errs.quantite}
                                                />
                                                {errs.quantite && (
                                                    <p className="mt-0.5 text-xs text-red-600">{errs.quantite}</p>
                                                )}
                                            </td>
                                            {/* Unité */}
                                            <td className="px-2 py-1.5">
                                                <input
                                                    type="text"
                                                    value={ligne.unite}
                                                    onChange={(e) => updateLigne(index, 'unite', e.target.value)}
                                                    disabled={disabled}
                                                    placeholder="sacs, m², kg…"
                                                    className={`w-full rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50 disabled:text-gray-500 ${
                                                        errs.unite ? 'border-red-400 bg-red-50' : 'border-[hsl(30,20%,82%)]'
                                                    }`}
                                                    aria-invalid={!!errs.unite}
                                                />
                                                {errs.unite && (
                                                    <p className="mt-0.5 text-xs text-red-600">{errs.unite}</p>
                                                )}
                                            </td>
                                            {/* Prix unitaire */}
                                            <td className="px-2 py-1.5">
                                                <input
                                                    type="number"
                                                    value={ligne.prix_unitaire}
                                                    onChange={(e) => updateLigne(index, 'prix_unitaire', e.target.value)}
                                                    disabled={disabled}
                                                    min={0}
                                                    step="any"
                                                    className={`w-full rounded-lg border px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:bg-gray-50 disabled:text-gray-500 ${
                                                        errs.prix_unitaire ? 'border-red-400 bg-red-50' : 'border-[hsl(30,20%,82%)]'
                                                    }`}
                                                    aria-invalid={!!errs.prix_unitaire}
                                                />
                                                {errs.prix_unitaire && (
                                                    <p className="mt-0.5 text-xs text-red-600">{errs.prix_unitaire}</p>
                                                )}
                                            </td>
                                            {/* Sous-total (lecture seule) */}
                                            <td className="px-3 py-1.5 text-right font-medium text-[hsl(20,14%,12%)]">
                                                {Math.round(sousTotalLigne).toLocaleString('fr-FR')}
                                            </td>
                                            {/* Action suppression */}
                                            {!disabled && (
                                                <td className="px-2 py-1.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => supprimerLigne(index)}
                                                        className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition-colors"
                                                        aria-label={`Supprimer la ligne ${index + 1}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {value.length > 0 && (
                            <tfoot>
                                <tr className="bg-amber-50 border-t-2 border-amber-200">
                                    <td
                                        colSpan={disabled ? 4 : 5}
                                        className="px-3 py-2 text-right font-semibold text-[hsl(20,14%,12%)]"
                                    >
                                        Total matériels
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-amber-700">
                                        {formatFCFA(totalGeneral)}
                                    </td>
                                    {!disabled && <td />}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* Bouton Ajouter une ligne */}
                {!disabled && (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={ajouterLigne}
                            disabled={value.length >= MAX_LIGNES}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter une ligne
                        </button>
                        {value.length >= MAX_LIGNES && (
                            <p className="text-xs text-amber-600">
                                Limite de {MAX_LIGNES} lignes atteinte.
                            </p>
                        )}
                    </div>
                )}

                {showErrors && (
                    <p className="text-sm text-red-600">
                        Certains champs sont invalides. Veuillez corriger les erreurs avant de soumettre.
                    </p>
                )}
            </div>
        );
    }
);

MaterielsEditor.displayName = 'MaterielsEditor';

export default MaterielsEditor;
