import React from 'react';
import { LigneMateriel } from './MaterielsEditor';

export interface MaterielsReadOnlyProps {
    materiels: LigneMateriel[];
    sousTotalMateriels: number;
}

/**
 * Formate un nombre en FCFA avec séparateurs de milliers (espace insécable).
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
 * Composant d'affichage en lecture seule de la liste de matériels.
 * Utilisé côté client pour consulter les matériels inclus dans un devis.
 *
 * Req 6.2 : tableau non éditable avec colonnes nom, quantite, unite,
 *            prix_unitaire, sous_total et sous-total global formaté FCFA.
 * Req 6.3 : si la liste est vide, affiche les en-têtes et un message
 *            "Aucun matériel renseigné" sans aucune ligne de données.
 */
export default function MaterielsReadOnly({
    materiels,
    sousTotalMateriels,
}: MaterielsReadOnlyProps) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[hsl(30,20%,88%)]">
            <table className="w-full min-w-[580px] text-sm">
                <thead>
                    <tr className="bg-[hsl(36,33%,97%)] border-b border-[hsl(30,20%,88%)]">
                        <th className="text-left px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-2/5">
                            Désignation
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-20">
                            Qté
                        </th>
                        <th className="text-left px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-24">
                            Unité
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-28">
                            P.U. (FCFA)
                        </th>
                        <th className="text-right px-3 py-2 font-semibold text-[hsl(20,14%,12%)] w-28">
                            Sous-total
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(30,20%,92%)]">
                    {materiels.length === 0 ? (
                        /* Req 6.3 — tableau vide : en-têtes + message, pas de ligne de données */
                        <tr>
                            <td
                                colSpan={5}
                                className="px-3 py-6 text-center text-[hsl(20,10%,55%)] italic"
                            >
                                Aucun matériel renseigné.
                            </td>
                        </tr>
                    ) : (
                        materiels.map((ligne, index) => {
                            const sousTotalLigne =
                                Math.round(
                                    (Number(ligne.quantite) || 0) *
                                        (Number(ligne.prix_unitaire) || 0) *
                                        100,
                                ) / 100;
                            return (
                                <tr
                                    key={ligne.id ?? index}
                                    className="bg-white hover:bg-[hsl(36,33%,98%)]"
                                >
                                    <td className="px-3 py-2 text-[hsl(20,14%,12%)]">
                                        {ligne.nom}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[hsl(20,14%,12%)]">
                                        {Number(ligne.quantite)}
                                    </td>
                                    <td className="px-3 py-2 text-[hsl(20,14%,12%)]">
                                        {ligne.unite}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[hsl(20,14%,12%)]">
                                        {Math.round(Number(ligne.prix_unitaire)).toLocaleString('fr-FR')}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-[hsl(20,14%,12%)]">
                                        {Math.round(sousTotalLigne).toLocaleString('fr-FR')}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
                {/* Ligne de total — affichée même si la liste est vide pour montrer le sous-total */}
                <tfoot>
                    <tr className="bg-amber-50 border-t-2 border-amber-200">
                        <td
                            colSpan={4}
                            className="px-3 py-2 text-right font-semibold text-[hsl(20,14%,12%)]"
                        >
                            Total matériels
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-amber-700">
                            {formatFCFA(sousTotalMateriels)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
