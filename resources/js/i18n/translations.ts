/**
 * ArtisanPro — Traductions multilingues
 * Langues : Français (fr) | Anglais (en) | Fon (fon) | Yoruba (yo)
 */

export type Locale = 'fr' | 'en' | 'fon' | 'yo';

export const LOCALES: { code: Locale; label: string; flag: string; nativeName: string }[] = [
    { code: 'fr',  label: 'Français',  flag: '🇫🇷', nativeName: 'Français' },
    { code: 'en',  label: 'English',   flag: '🇬🇧', nativeName: 'English' },
    { code: 'fon', label: 'Fon',       flag: '🇧🇯', nativeName: 'Fɔngbè' },
    { code: 'yo',  label: 'Yoruba',    flag: '🇧🇯', nativeName: 'Yorùbá' },
];

export const translations: Record<Locale, Record<string, string>> = {
    fr: {
        // Navbar
        'nav.annuaire':       'Annuaire',
        'nav.about':          'À propos',
        'nav.faq':            'FAQ',
        'nav.contact':        'Contact',
        'nav.login':          'Connexion',
        'nav.register':       "S'inscrire",
        'nav.dashboard':      'Mon espace',
        'nav.diagnostic':     'Diagnostic IA',

        // Hero
        'hero.badge':         'Plateforme artisans · Porto-Novo, Bénin',
        'hero.title1':        "L'artisan qu'il vous faut,",
        'hero.title2':        'près de chez vous',
        'hero.subtitle':      'Devis instantanés, réservations simples, paiements Mobile Money sécurisés. Tous nos artisans sont vérifiés et notés par la communauté.',
        'hero.cta.search':    'Trouver un artisan',
        'hero.cta.register':  'Créer un compte',
        'hero.search.title':  'Recherche par métier',
        'hero.search.sub':    'Catégories populaires',
        'hero.see.all':       'Voir tous les artisans',

        // Stats
        'stats.artisans':     'Artisans vérifiés',
        'stats.clients':      'Clients satisfaits',
        'stats.rating':       'Note moyenne',
        'stats.delay':        'Délai de réponse',

        // How it works
        'how.badge':          'Comment ça marche',
        'how.title':          'Simple, rapide, fiable',
        'how.sub':            'En 3 étapes, trouvez et réservez votre artisan à Porto-Novo.',
        'how.step1.title':    'Recherchez',
        'how.step1.desc':     "Parcourez l'annuaire par métier, catégorie ou zone d'intervention.",
        'how.step2.title':    'Demandez un devis',
        'how.step2.desc':     "Envoyez votre demande depuis la plateforme. L'artisan vous répond sous 2h.",
        'how.step3.title':    'Réservez & Payez',
        'how.step3.desc':     'Confirmez votre réservation et payez via Mobile Money ou carte.',

        // Featured artisans
        'featured.badge':     'Artisans recommandés',
        'featured.title':     'Les meilleurs de Porto-Novo',
        'featured.sub':       'Sélectionnés pour leur excellence et leurs avis clients.',
        'featured.see.all':   'Voir tous',
        'featured.profile':   'Voir le profil',

        // Categories
        'cats.badge':         'Nos métiers',
        'cats.title':         'Tous les corps de métier',

        // CTA
        'cta.badge':          'Rejoignez-nous',
        'cta.title1':         'Vous êtes artisan ?',
        'cta.title2':         'Développez votre activité',
        'cta.sub':            'Gérez vos réservations, recevez vos paiements en ligne et développez votre clientèle à Porto-Novo.',
        'cta.register':       "S'inscrire gratuitement",
        'cta.learn':          'En savoir plus',

        // Diagnostic IA
        'diag.title':         'Diagnostic IA',
        'diag.sub':           "Décrivez votre problème, l'IA trouve l'artisan idéal",
        'diag.desc.label':    'Décrivez votre problème *',
        'diag.desc.placeholder': "Ex: J'ai une fuite d'eau sous l'évier de ma cuisine depuis ce matin...",
        'diag.photos.label':  'Photos du problème',
        'diag.photos.sub':    '(optionnel, max 5)',
        'diag.privacy':       'Vos photos et descriptions sont analysées de manière confidentielle par notre IA et ne sont pas stockées.',
        'diag.submit':        "Analyser avec l'IA",
        'diag.loading':       'Analyse en cours...',
        'diag.loading.sub':   'Notre IA examine votre problème et recherche les meilleurs artisans',
        'diag.urgence':       'Urgence',
        'diag.precautions':   'Précautions importantes',
        'diag.conseils':      "En attendant l'artisan",
        'diag.artisans':      'Artisans recommandés',
        'diag.new':           'Nouveau diagnostic',
        'diag.see.annuaire':  "Voir l'annuaire",

        // Footer
        'footer.desc':        'La plateforme de référence pour mettre en relation clients et artisans à Porto-Novo, Bénin.',
        'footer.available':   'Service disponible 24h/24',
        'footer.services':    'Services',
        'footer.annuaire':    'Annuaire artisans',
        'footer.devis':       'Devis en ligne',
        'footer.account':     'Compte',
        'footer.legal':       'Légal',
        'footer.rights':      '© 2025 ArtisanPro. Tous droits réservés.',
        'footer.location':    'Porto-Novo, Bénin · Plateforme artisans-clients',

        // Common
        'common.artisan':     'artisan',
        'common.artisans':    'artisans',
        'common.per.hour':    '/ heure',
        'common.see.profile': 'Voir le profil',
        'common.add.photo':   'Ajouter des photos',
        'common.photo.types': 'JPG, PNG, WebP · Max 5 Mo par photo',
    },

    en: {
        // Navbar
        'nav.annuaire':       'Directory',
        'nav.about':          'About',
        'nav.faq':            'FAQ',
        'nav.contact':        'Contact',
        'nav.login':          'Login',
        'nav.register':       'Sign up',
        'nav.dashboard':      'My space',
        'nav.diagnostic':     'AI Diagnostic',

        // Hero
        'hero.badge':         'Artisan platform · Porto-Novo, Benin',
        'hero.title1':        'The craftsman you need,',
        'hero.title2':        'near you',
        'hero.subtitle':      'Instant quotes, simple bookings, secure Mobile Money payments. All our artisans are verified and rated by the community.',
        'hero.cta.search':    'Find an artisan',
        'hero.cta.register':  'Create an account',
        'hero.search.title':  'Search by trade',
        'hero.search.sub':    'Popular categories',
        'hero.see.all':       'See all artisans',

        // Stats
        'stats.artisans':     'Verified artisans',
        'stats.clients':      'Satisfied clients',
        'stats.rating':       'Average rating',
        'stats.delay':        'Response time',

        // How it works
        'how.badge':          'How it works',
        'how.title':          'Simple, fast, reliable',
        'how.sub':            'In 3 steps, find and book your artisan in Porto-Novo.',
        'how.step1.title':    'Search',
        'how.step1.desc':     'Browse the directory by trade, category or area.',
        'how.step2.title':    'Request a quote',
        'how.step2.desc':     'Send your request from the platform. The artisan responds within 2h.',
        'how.step3.title':    'Book & Pay',
        'how.step3.desc':     'Confirm your booking and pay via Mobile Money or card.',

        // Featured artisans
        'featured.badge':     'Recommended artisans',
        'featured.title':     'The best in Porto-Novo',
        'featured.sub':       'Selected for their excellence and client reviews.',
        'featured.see.all':   'See all',
        'featured.profile':   'View profile',

        // Categories
        'cats.badge':         'Our trades',
        'cats.title':         'All trades',

        // CTA
        'cta.badge':          'Join us',
        'cta.title1':         'Are you an artisan?',
        'cta.title2':         'Grow your business',
        'cta.sub':            'Manage your bookings, receive online payments and grow your clientele in Porto-Novo.',
        'cta.register':       'Sign up for free',
        'cta.learn':          'Learn more',

        // Diagnostic IA
        'diag.title':         'AI Diagnostic',
        'diag.sub':           'Describe your problem, AI finds the ideal artisan',
        'diag.desc.label':    'Describe your problem *',
        'diag.desc.placeholder': 'Ex: I have a water leak under my kitchen sink since this morning...',
        'diag.photos.label':  'Photos of the problem',
        'diag.photos.sub':    '(optional, max 5)',
        'diag.privacy':       'Your photos and descriptions are analyzed confidentially by our AI and are not stored.',
        'diag.submit':        'Analyze with AI',
        'diag.loading':       'Analysis in progress...',
        'diag.loading.sub':   'Our AI is examining your problem and searching for the best artisans',
        'diag.urgence':       'Urgency',
        'diag.precautions':   'Important precautions',
        'diag.conseils':      'While waiting for the artisan',
        'diag.artisans':      'Recommended artisans',
        'diag.new':           'New diagnostic',
        'diag.see.annuaire':  'See directory',

        // Footer
        'footer.desc':        'The reference platform for connecting clients and artisans in Porto-Novo, Benin.',
        'footer.available':   'Service available 24/7',
        'footer.services':    'Services',
        'footer.annuaire':    'Artisan directory',
        'footer.devis':       'Online quotes',
        'footer.account':     'Account',
        'footer.legal':       'Legal',
        'footer.rights':      '© 2025 ArtisanPro. All rights reserved.',
        'footer.location':    'Porto-Novo, Benin · Artisan-client platform',

        // Common
        'common.artisan':     'artisan',
        'common.artisans':    'artisans',
        'common.per.hour':    '/ hour',
        'common.see.profile': 'View profile',
        'common.add.photo':   'Add photos',
        'common.photo.types': 'JPG, PNG, WebP · Max 5 MB per photo',
    },

    fon: {
        // Navbar
        'nav.annuaire':       'Nùkplɔnmɛ',
        'nav.about':          'Mǐ dó',
        'nav.faq':            'Nùkanbyɔ',
        'nav.contact':        'Bló mǐ',
        'nav.login':          'Wá dó',
        'nav.register':       'Ðó nyikɔ',
        'nav.dashboard':      'Xwé ce',
        'nav.diagnostic':     'AI Diagnostic',

        // Hero
        'hero.badge':         'Azɔtɔ sín fɔtɛn · Porto-Novo, Bénin',
        'hero.title1':        'Azɔtɔ e a ɖó na,',
        'hero.title2':        'kpɔ́ towe',
        'hero.subtitle':      'Devis blɔ̌ blɔ̌, ɖiɖó nǔ jɛ jí vɛ́vɛ́, Mobile Money sín zán. Azɔtɔ lɛ bǐ wɛ è kpɔ́n bo ɖó wǔ.',
        'hero.cta.search':    'Mɔ azɔtɔ',
        'hero.cta.register':  'Ðó nyikɔ',
        'hero.search.title':  'Sɔ́ azɔ̌ tɔn',
        'hero.search.sub':    'Azɔ̌ e è ɖó nǔ jɛ jí',
        'hero.see.all':       'Mɔ azɔtɔ lɛ bǐ',

        // Stats
        'stats.artisans':     'Azɔtɔ e è kpɔ́n',
        'stats.clients':      'Kliyɛn e ɖó fɛ',
        'stats.rating':       'Wǔ e è ɖó',
        'stats.delay':        'Hwenu e è na xósin',

        // How it works
        'how.badge':          'Nɛ̌ é ɖò wɛn ɔ',
        'how.title':          'Vɛ́vɛ́, blɔ̌ blɔ̌, ɖagbe',
        'how.sub':            'Azɔ̌ atɔn mɛ, mɔ bo ɖó azɔtɔ towe Porto-Novo mɛ.',
        'how.step1.title':    'Sɔ́',
        'how.step1.desc':     'Kpɔ́n nùkplɔnmɛ ɔ azɔ̌ tɔn, azɔ̌ sín xwé alǒ fí.',
        'how.step2.title':    'Byɔ devis',
        'how.step2.desc':     'Sɛ́ nǔ byɔ towe ɔ. Azɔtɔ ɔ na xósin hwenu 2 mɛ.',
        'how.step3.title':    'Ðó nǔ jɛ jí & Sú akwɛ',
        'how.step3.desc':     'Ðó nǔ jɛ jí bo sú akwɛ Mobile Money alǒ kaaɖi sín.',

        // Featured artisans
        'featured.badge':     'Azɔtɔ e è sɔ́ ɖó',
        'featured.title':     'Porto-Novo sín ɖagbe lɛ',
        'featured.sub':       'È sɔ́ ye ɖó ɖagbe tɔn kpo kliyɛn lɛ sín xósin kpo.',
        'featured.see.all':   'Mɔ bǐ',
        'featured.profile':   'Kpɔ́n profil',

        // Categories
        'cats.badge':         'Mǐ sín azɔ̌',
        'cats.title':         'Azɔ̌ lɛ bǐ',

        // CTA
        'cta.badge':          'Wá kpɔ́ mǐ',
        'cta.title1':         'A nyí azɔtɔ à?',
        'cta.title2':         'Hɛn azɔ̌ towe ɖó',
        'cta.sub':            'Ðó nǔ jɛ jí, ɖu akwɛ internet sín bo hɛn kliyɛn lɛ ɖó Porto-Novo.',
        'cta.register':       'Ðó nyikɔ vɛ́vɛ́',
        'cta.learn':          'Ðɔ nǔ ɖevo',

        // Diagnostic IA
        'diag.title':         'AI Diagnostic',
        'diag.sub':           'Ðɔ nǔ e jɛ ɔ, AI na mɔ azɔtɔ ɖagbe',
        'diag.desc.label':    'Ðɔ nǔ e jɛ ɔ *',
        'diag.desc.placeholder': 'Kɛɖɛ: Tɔ̀ ɖò wɛ ɖò xwé ce mɛ...',
        'diag.photos.label':  'Foto nǔ e jɛ ɔ tɔn',
        'diag.photos.sub':    '(e ma ɖò jlɛ́ ǎ, max 5)',
        'diag.privacy':       'Foto kpo nǔ ɖɔ kpo lɛ wɛ AI ɖò kpɔ́n, é ma ɖó ye ǎ.',
        'diag.submit':        'Kpɔ́n AI sín',
        'diag.loading':       'Ðò kpɔ́n wɛ...',
        'diag.loading.sub':   'AI ɖò nǔ e jɛ ɔ kpɔ́n bo ɖò azɔtɔ ɖagbe lɛ sɔ́ wɛ',
        'diag.urgence':       'Hwenu',
        'diag.precautions':   'Nǔ e ɖó na kpɔ́n',
        'diag.conseils':      'Ɛ jɛ azɔtɔ ɔ wá',
        'diag.artisans':      'Azɔtɔ e è sɔ́ ɖó',
        'diag.new':           'Diagnostic yɔyɔ̌',
        'diag.see.annuaire':  'Kpɔ́n nùkplɔnmɛ',

        // Footer
        'footer.desc':        'Fɔtɛn e è ɖó kliyɛn kpo azɔtɔ kpo Porto-Novo mɛ.',
        'footer.available':   'Sɛ́n ɖò wɛ 24h/24',
        'footer.services':    'Sɛ́n',
        'footer.annuaire':    'Azɔtɔ nùkplɔnmɛ',
        'footer.devis':       'Devis internet',
        'footer.account':     'Akɔwuntun',
        'footer.legal':       'Sɛ́n',
        'footer.rights':      '© 2025 ArtisanPro. Nǔ lɛ bǐ ɖò mǐ.',
        'footer.location':    'Porto-Novo, Bénin · Azɔtɔ-kliyɛn fɔtɛn',

        // Common
        'common.artisan':     'azɔtɔ',
        'common.artisans':    'azɔtɔ lɛ',
        'common.per.hour':    '/ hwenu',
        'common.see.profile': 'Kpɔ́n profil',
        'common.add.photo':   'Ðó foto lɛ',
        'common.photo.types': 'JPG, PNG, WebP · Max 5 Mo',
    },

    yo: {
        // Navbar
        'nav.annuaire':       'Àkójọ',
        'nav.about':          'Nípa wa',
        'nav.faq':            'Ìbéèrè',
        'nav.contact':        'Kàn sí wa',
        'nav.login':          'Wọlé',
        'nav.register':       'Forúkọ',
        'nav.dashboard':      'Àyè mi',
        'nav.diagnostic':     'Ìwádìí AI',

        // Hero
        'hero.badge':         'Pẹpẹ àwọn ọmọ-ọwọ · Porto-Novo, Bénin',
        'hero.title1':        'Ọmọ-ọwọ tí o nílò,',
        'hero.title2':        'nítòsí rẹ',
        'hero.subtitle':      'Ìdiyèlé lẹsẹkẹsẹ, ìpamọ́ rọrùn, ìsanwó Mobile Money tó ní ààbò. Gbogbo àwọn ọmọ-ọwọ wa ni a ṣàyẹwò.',
        'hero.cta.search':    'Wá ọmọ-ọwọ',
        'hero.cta.register':  'Ṣẹ̀dá àkọọ́lẹ̀',
        'hero.search.title':  'Wá nípasẹ̀ iṣẹ́',
        'hero.search.sub':    'Àwọn ẹ̀ka tó gbajúmọ̀',
        'hero.see.all':       'Wo gbogbo àwọn ọmọ-ọwọ',

        // Stats
        'stats.artisans':     'Àwọn ọmọ-ọwọ tí a ṣàyẹwò',
        'stats.clients':      'Àwọn onibàárà tó ní ìtẹ́lọ́rùn',
        'stats.rating':       'Ìdíyelé àárọ̀',
        'stats.delay':        'Àkókò ìdáhùn',

        // How it works
        'how.badge':          'Bí ó ṣe ń ṣiṣẹ́',
        'how.title':          'Rọrùn, yára, gbẹ́kẹ̀lé',
        'how.sub':            'Ní ìgbésẹ̀ mẹ́ta, wá kí o sì gbé ọmọ-ọwọ rẹ ní Porto-Novo.',
        'how.step1.title':    'Wá',
        'how.step1.desc':     'Yẹ àkójọ wo nípasẹ̀ iṣẹ́, ẹ̀ka tàbí àgbègbè.',
        'how.step2.title':    'Béèrè ìdíyelé',
        'how.step2.desc':     'Fi ìbéèrè rẹ ránṣẹ́. Ọmọ-ọwọ náà yóò dáhùn ní àárọ̀ 2.',
        'how.step3.title':    'Gbé & San',
        'how.step3.desc':     'Jẹ́rìísí ìpamọ́ rẹ kí o sì san owó nípasẹ̀ Mobile Money tàbí káàdì.',

        // Featured artisans
        'featured.badge':     'Àwọn ọmọ-ọwọ tí a dábàá',
        'featured.title':     'Àwọn tó dára jùlọ ní Porto-Novo',
        'featured.sub':       'A yàn wọn fún ìgbàgbọ́ wọn àti àwọn àtúnyẹwò onibàárà.',
        'featured.see.all':   'Wo gbogbo',
        'featured.profile':   'Wo profáìlì',

        // Categories
        'cats.badge':         'Àwọn iṣẹ́ wa',
        'cats.title':         'Gbogbo àwọn iṣẹ́',

        // CTA
        'cta.badge':          'Darapọ̀ mọ́ wa',
        'cta.title1':         'Ṣé o jẹ́ ọmọ-ọwọ?',
        'cta.title2':         'Gbòòrò iṣẹ́ rẹ',
        'cta.sub':            'Ṣàkóso àwọn ìpamọ́ rẹ, gba owó lórí íńtánẹ́ẹ̀tì kí o sì gbòòrò onibàárà rẹ ní Porto-Novo.',
        'cta.register':       'Forúkọ sílẹ̀ lọ́fẹ̀ẹ́',
        'cta.learn':          'Kọ́ síi',

        // Diagnostic IA
        'diag.title':         'Ìwádìí AI',
        'diag.sub':           'Ṣàpèjúwe ìṣòro rẹ, AI yóò wá ọmọ-ọwọ tó dára jùlọ',
        'diag.desc.label':    'Ṣàpèjúwe ìṣòro rẹ *',
        'diag.desc.placeholder': 'Àpẹẹrẹ: Omi ń jó ní abẹ́ ìdọ̀tí ilé bíbẹ mi...',
        'diag.photos.label':  'Àwọn fọ́tò ìṣòro náà',
        'diag.photos.sub':    '(kò pọn dandan, max 5)',
        'diag.privacy':       'Àwọn fọ́tò àti àpèjúwe rẹ ni AI ń ṣàyẹwò ní ìkọ̀kọ̀, a kò tọ́jú wọn.',
        'diag.submit':        'Ṣàyẹwò pẹ̀lú AI',
        'diag.loading':       'Ìwádìí ń lọ...',
        'diag.loading.sub':   'AI wa ń ṣàyẹwò ìṣòro rẹ kí ó sì wá àwọn ọmọ-ọwọ tó dára jùlọ',
        'diag.urgence':       'Pàtàkì',
        'diag.precautions':   'Àwọn ìṣọ́ra pàtàkì',
        'diag.conseils':      'Nígbà tí o ń dúró de ọmọ-ọwọ',
        'diag.artisans':      'Àwọn ọmọ-ọwọ tí a dábàá',
        'diag.new':           'Ìwádìí tuntun',
        'diag.see.annuaire':  'Wo àkójọ',

        // Footer
        'footer.desc':        'Pẹpẹ ìtọ́kasí fún ìsopọ̀ àwọn onibàárà àti ọmọ-ọwọ ní Porto-Novo, Bénin.',
        'footer.available':   'Iṣẹ́ wà 24h/24',
        'footer.services':    'Àwọn iṣẹ́',
        'footer.annuaire':    'Àkójọ ọmọ-ọwọ',
        'footer.devis':       'Ìdíyelé lórí íńtánẹ́ẹ̀tì',
        'footer.account':     'Àkọọ́lẹ̀',
        'footer.legal':       'Òfin',
        'footer.rights':      '© 2025 ArtisanPro. Gbogbo ẹ̀tọ́ ni a pa mọ́.',
        'footer.location':    'Porto-Novo, Bénin · Pẹpẹ ọmọ-ọwọ-onibàárà',

        // Common
        'common.artisan':     'ọmọ-ọwọ',
        'common.artisans':    'àwọn ọmọ-ọwọ',
        'common.per.hour':    '/ wákàtí',
        'common.see.profile': 'Wo profáìlì',
        'common.add.photo':   'Fi àwọn fọ́tò kun',
        'common.photo.types': 'JPG, PNG, WebP · Max 5 Mo',
    },
};
