import { type User } from '@/types';

interface Props {
    user: User | { prenom?: string | null; nom?: string | null; avatar?: string | null; name?: string } | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZES = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
};

export function UserAvatar({ user, size = 'md', className = '' }: Props) {
    if (!user) {
        return (
            <div className={`${SIZES[size]} ${className} flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold shrink-0`}>
                ?
            </div>
        );
    }

    const initials = [
        (user as any).prenom?.[0] ?? '',
        (user as any).nom?.[0] ?? '',
    ].join('').toUpperCase() || ((user as any).name?.[0] ?? '?').toUpperCase();

    const avatarUrl = (user as any).avatar
        ? ((user as any).avatar.startsWith('http') ? (user as any).avatar : `/storage/${(user as any).avatar}`)
        : null;

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={initials}
                className={`${SIZES[size]} ${className} rounded-full object-cover shrink-0 ring-2 ring-amber-200`}
                onError={(e) => {
                    // fallback to initials on broken image
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                }}
            />
        );
    }

    return (
        <div className={`${SIZES[size]} ${className} flex items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold shrink-0 border border-amber-200`}>
            {initials}
        </div>
    );
}
