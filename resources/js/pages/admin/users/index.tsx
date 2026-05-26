import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Eye, UserX, UserCheck, Trash2, Plus, Users } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
    type_utilisateur: string;
    statut: string;
    date_inscription: string;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    users: Paginated<User>;
    filters: { q?: string; type?: string; statut?: string };
}

const typeColors: Record<string, string> = {
    client:  'bg-blue-100 text-blue-800',
    artisan: 'bg-indigo-100 text-indigo-800',
    admin:   'bg-purple-100 text-purple-800',
};

const statutColors: Record<string, string> = {
    actif:    'bg-green-100 text-green-800',
    suspendu: 'bg-yellow-100 text-yellow-800',
    banni:    'bg-red-100 text-red-800',
};

export default function AdminUsersIndex({ users, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.users.index'), Object.fromEntries(fd), { preserveState: true });
    };

    const updateStatut = (userId: number, statut: string) => {
        router.patch(route('admin.users.statut', userId), { statut }, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Utilisateurs">
            <Head title="Utilisateurs - Admin ArtisanPro" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
                        <p className="text-sm text-gray-500 mt-1">{users.meta.total} utilisateurs au total</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input name="q" defaultValue={filters.q} placeholder="Nom, prénom, email..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="type" defaultValue={filters.type ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none">
                                <option value="">Tous les types</option>
                                <option value="client">Client</option>
                                <option value="artisan">Artisan</option>
                                <option value="admin">Admin</option>
                            </select>
                            <select name="statut" defaultValue={filters.statut ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none">
                                <option value="">Tous les statuts</option>
                                <option value="actif">Actif</option>
                                <option value="suspendu">Suspendu</option>
                                <option value="banni">Banni</option>
                            </select>
                            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-[hsl(36,33%,97%)]">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">Utilisateur</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">Inscription</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                            Aucun utilisateur trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold shrink-0">
                                                        {u.prenom.charAt(0)}{u.nom.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{u.prenom} {u.nom}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`text-xs ${typeColors[u.type_utilisateur] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {u.type_utilisateur}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`text-xs ${statutColors[u.statut] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {u.statut}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {new Date(u.date_inscription).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={route('admin.users.show', u.id)}>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-gray-200">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {u.statut === 'actif' ? (
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                                            onClick={() => updateStatut(u.id, 'suspendu')}>
                                                            <UserX className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50"
                                                            onClick={() => updateStatut(u.id, 'actif')}>
                                                            <UserCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <p className="text-sm text-gray-500">Page {users.meta.current_page} sur {users.meta.last_page}</p>
                            <div className="flex gap-1">
                                {users.links.map((l, i) =>
                                    l.url ? (
                                        <Link key={i} href={l.url} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                            dangerouslySetInnerHTML={{ __html: l.label }} />
                                    ) : (
                                        <span key={i} className="px-3 py-1.5 text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: l.label }} />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
