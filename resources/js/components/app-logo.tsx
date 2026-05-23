import { useState } from 'react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="flex items-center">
            {!imageError ? (
                <img
                    src="/images/ArtisanPro.jpg"
                    alt="Artisans Pro"
                    className="h-10 w-auto"
                    onError={() => setImageError(true)}
                />
            ) : (
                <AppLogoIcon className="h-10 w-auto" />
            )}
        </div>
    );
}
