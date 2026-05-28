<?php

namespace Database\Seeders;

use App\Models\AcademieFormation;
use App\Models\Artisan;
use App\Models\Avis;
use App\Models\Category;
use App\Models\Certification;
use App\Models\Client;
use App\Models\FournisseurPartenaire;
use App\Models\PortfolioImage;
use App\Models\Prestation;
use App\Models\User;
use App\Services\ScoringService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach ([
            'avis','certifications','portfolio_images','prestations',
            'artisan_specialites','client_favoris','reservations','devis',
            'messages','paiements','artisans','clients','utilisateurs','categories',
            'academie_formations','artisan_formation','fournisseur_partenaires',
        ] as $t) {
            DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $cats = $this->seedCategories();
        $artisanUsers = $this->seedArtisans($cats);
        $clientUsers  = $this->seedClients();
        $this->seedAdmin();
        $this->seedAvis($clientUsers, $artisanUsers);
        $this->seedFormations($artisanUsers);
        $this->seedPartenaires();

        foreach (Category::all() as $cat) {
            $cat->update(['nombre_artisans' => $cat->artisans()->count()]);
        }

        // Recalcul scores de confiance
        $scoring = new ScoringService();
        foreach ($artisanUsers as $au) {
            $artisan = $au['artisan']->fresh();
            $avg = Avis::where('id_artisan', $artisan->id)->where('masque', false)->avg('note') ?? 0;
            $artisan->update(['note_moyenne' => round($avg, 2)]);
            $score = $scoring->calculer($artisan->fresh());
            $badge = $scoring->badgeDepuisScore($score);
            $artisan->update(['score_confiance' => $score, 'badge' => $badge]);
        }

        $this->command->info('Seeder OK — admin@artisanpro.bj / Admin@2025 | clients & artisans: password');
    }

    private function seedCategories(): array
    {
        $list = [
            ['nom'=>'Plomberie','icone'=>'🔧','description'=>'Fuites, installations sanitaires, débouchage, chauffe-eau'],
            ['nom'=>'Électricité','icone'=>'⚡','description'=>'Installation, dépannage, mise aux normes, tableau électrique'],
            ['nom'=>'Maçonnerie','icone'=>'🧱','description'=>'Gros œuvre, rénovation, cloisons, fondations'],
            ['nom'=>'Menuiserie','icone'=>'🪚','description'=>'Portes, fenêtres, meubles sur mesure, parquet'],
            ['nom'=>'Peinture','icone'=>'🎨','description'=>'Intérieur, façade, décoration, enduits'],
            ['nom'=>'Climatisation','icone'=>'❄️','description'=>'Installation, entretien, réparation climatiseurs'],
            ['nom'=>'Carrelage','icone'=>'🏠','description'=>'Pose carrelage sol et mur, faïence, mosaïque'],
            ['nom'=>'Soudure','icone'=>'🔩','description'=>'Ferronnerie, portails, grilles, structures métalliques'],
            ['nom'=>'Jardinage','icone'=>'🌿','description'=>'Entretien espaces verts, élagage, aménagement'],
            ['nom'=>'Informatique','icone'=>'💻','description'=>'Réparation PC, réseaux, maintenance, récupération données'],
        ];
        $r = [];
        foreach ($list as $c) { $r[$c['nom']] = Category::create(array_merge($c, ['nombre_artisans'=>0])); }
        return $r;
    }

    private function seedAdmin(): void
    {
        User::create([
            'prenom'=>'Rodrigue','nom'=>'Ahouansou',
            'email'=>'admin@artisanpro.bj','telephone'=>'+22997000099',
            'mot_de_passe'=>Hash::make('Admin@2025'),
            'type_utilisateur'=>'admin','statut'=>'actif',
            'date_inscription'=>Carbon::now()->subYear(),
            'email_verified_at'=>now(),
            'avatar'=>'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&h=200&fit=crop&crop=face',
        ]);
    }

    private function seedClients(): array
    {
        $list = [
            // Clients existants — photos de personnes africaines
            ['prenom'=>'Marie','nom'=>'Akpovi','email'=>'marie.akpovi@gmail.com','telephone'=>'+22997220001',
             'avatar'=>'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Jean-Baptiste','nom'=>'Soglo','email'=>'jb.soglo@gmail.com','telephone'=>'+22997220002',
             'avatar'=>'https://images.unsplash.com/photo-1539701938214-0d9736e1c16b?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Fatou','nom'=>'Diallo','email'=>'fatou.diallo@gmail.com','telephone'=>'+22997220003',
             'avatar'=>'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Christophe','nom'=>'Hounsa','email'=>'c.hounsa@gmail.com','telephone'=>'+22997220004',
             'avatar'=>'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Aminata','nom'=>'Bello','email'=>'aminata.bello@gmail.com','telephone'=>'+22997220005',
             'avatar'=>'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&crop=face'],
            // Nouveaux clients — photos de personnes africaines
            ['prenom'=>'Rodrigue','nom'=>'Fagnon','email'=>'rodrigue.fagnon@gmail.com','telephone'=>'+22997220006',
             'avatar'=>'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Cécile','nom'=>'Amoussou','email'=>'cecile.amoussou@gmail.com','telephone'=>'+22997220007',
             'avatar'=>'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Hervé','nom'=>'Dossou-Yovo','email'=>'herve.dossou@gmail.com','telephone'=>'+22997220008',
             'avatar'=>'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Nadège','nom'=>'Hounkpè','email'=>'nadege.hounkpe@gmail.com','telephone'=>'+22997220009',
             'avatar'=>'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Sylvain','nom'=>'Gbèdo','email'=>'sylvain.gbedo@gmail.com','telephone'=>'+22997220010',
             'avatar'=>'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Prudence','nom'=>'Azonhiho','email'=>'prudence.azonhiho@gmail.com','telephone'=>'+22997220011',
             'avatar'=>'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Léonce','nom'=>'Kpèdékpo','email'=>'leonce.kpedekpo@gmail.com','telephone'=>'+22997220012',
             'avatar'=>'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Victorine','nom'=>'Adanlin','email'=>'victorine.adanlin@gmail.com','telephone'=>'+22997220013',
             'avatar'=>'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=200&h=200&fit=crop&crop=face'],
        ];
        $result = [];
        foreach ($list as $cd) {
            $user = User::create(array_merge($cd, [
                'mot_de_passe'=>Hash::make('password'),'type_utilisateur'=>'client',
                'statut'=>'actif','date_inscription'=>Carbon::now()->subMonths(rand(1,18)),
                'email_verified_at'=>now(),
            ]));
            $client = Client::create(['id_utilisateur'=>$user->id,'telephone'=>$cd['telephone']]);
            $result[] = ['user'=>$user,'client'=>$client];
        }
        return $result;
    }

    private function seedArtisans(array $cats): array
    {
        $result = [];
        foreach ($this->artisansData() as $d) {
            $user = User::create([
                'prenom'=>$d['prenom'],'nom'=>$d['nom'],'email'=>$d['email'],
                'telephone'=>$d['telephone'],'mot_de_passe'=>Hash::make('password'),
                'type_utilisateur'=>'artisan','statut'=>'actif',
                'date_inscription'=>Carbon::now()->subMonths(rand(3,24)),
                'email_verified_at'=>now(),'avatar'=>$d['avatar'],
            ]);
            $artisan = Artisan::create([
                'id_utilisateur'=>$user->id,'metier'=>$d['metier'],
                'description'=>$d['description'],'bio'=>$d['bio'],
                'zone_intervention'=>$d['zone'],'tarifs_horaire'=>$d['tarif'],
                'note_moyenne'=>$d['note'],'badge'=>$d['badge'],
                'latitude'=>$d['lat'],'longitude'=>$d['lng'],
            ]);
            $catIds = collect($d['categories'])->map(fn($n)=>$cats[$n]?->id)->filter()->all();
            $artisan->categories()->sync($catIds);
            foreach ($d['prestations'] as $p) {
                Prestation::create(['id_artisan'=>$artisan->id,'titre'=>$p['titre'],
                    'description'=>$p['desc'],'tarif_min'=>$p['min'],'tarif_max'=>$p['max'],
                    'duree_estimee'=>$p['duree'],'id_categorie'=>$cats[$p['cat']]?->id]);
            }
            foreach ($d['portfolio'] as $img) {
                PortfolioImage::create(['id_artisan'=>$artisan->id,'titre'=>$img['titre'],
                    'description'=>$img['desc'],'url_media'=>$img['url'],'type_media'=>'image']);
            }
            foreach ($d['certifications'] as $c) {
                Certification::create(['id_artisan'=>$artisan->id,'nom_certification'=>$c['nom'],
                    'organisme_delivrance'=>$c['org'],'date_obtention'=>$c['date']]);
            }
            $result[] = ['user'=>$user,'artisan'=>$artisan];
        }
        return $result;
    }

    private function seedAvis(array $clients, array $artisans): void
    {
        $comments = [
            5 => [
                "Travail impeccable, je recommande vivement !",
                "Excellent artisan, très professionnel et ponctuel.",
                "Résultat parfait, au-delà de mes attentes. Merci !",
                "Très satisfait du travail réalisé. Propre et soigné.",
                "Artisan sérieux et compétent. Je referai appel à lui sans hésiter.",
                "Intervention rapide et efficace. Prix raisonnable. Parfait !",
                "Qualité de travail exceptionnelle. Délais respectés à la lettre.",
                "Je suis bluffé par le résultat. Vraiment du grand travail.",
            ],
            4 => [
                "Bon travail dans l'ensemble, quelques petits détails à revoir.",
                "Professionnel et efficace. Légèrement en retard mais bon résultat.",
                "Bonne prestation, rapport qualité-prix correct.",
                "Travail bien fait, communication agréable tout au long du chantier.",
                "Satisfait du résultat. Je recommande pour ce type de travaux.",
                "Artisan sérieux, travail soigné. Reviendra pour d'autres travaux.",
            ],
            3 => [
                "Travail correct mais délai non respecté. À améliorer.",
                "Résultat moyen, quelques finitions à améliorer.",
                "Prestation correcte mais communication difficile.",
            ],
        ];

        foreach ($artisans as $au) {
            $shuffled = $clients;
            shuffle($shuffled);
            $n = min(rand(4, 8), count($shuffled));
            for ($i = 0; $i < $n; $i++) {
                $note = $i === 0 ? 5 : (rand(0, 10) > 2 ? rand(4, 5) : rand(3, 4));
                $cl = $comments[$note] ?? $comments[4];
                Avis::create([
                    'id_client'      => $shuffled[$i]['client']->id,
                    'id_artisan'     => $au['artisan']->id,
                    'id_reservation' => null,
                    'note'           => $note,
                    'commentaire'    => $cl[array_rand($cl)],
                    'date_avis'      => Carbon::now()->subDays(rand(5, 365)),
                ]);
            }
        }
    }

    private function artisansData(): array { return [
        ['prenom'=>'Kofi','nom'=>'Hounsou','email'=>'kofi.hounsou@artisanpro.bj','telephone'=>'+22997110001',
         'avatar'=>'https://images.unsplash.com/photo-1539701938214-0d9736e1c16b?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Plombier certifié',
         'description'=>'Spécialiste en plomberie résidentielle et tertiaire à Porto-Novo. Interventions rapides 7j/7 pour fuites, installations sanitaires, chauffe-eau et débouchage. Devis gratuit sous 2h.',
         'bio'=>"Titulaire d'un CAP Plomberie obtenu à l'École des Métiers de Cotonou, j'exerce depuis 12 ans dans la région de Porto-Novo. J'ai réalisé plus de 800 interventions chez des particuliers et des entreprises.",
         'zone'=>'Porto-Novo, Akpro-Missérété, Sèmè-Podji, Adjarra','tarif'=>15000,'note'=>4.8,'badge'=>'certifie','lat'=>6.4969,'lng'=>2.6289,
         'categories'=>['Plomberie','Maçonnerie'],
         'prestations'=>[
             ['titre'=>"Réparation fuite d'eau",'desc'=>'Détection et réparation de toute fuite. Intervention urgence possible.','min'=>8000,'max'=>25000,'duree'=>120,'cat'=>'Plomberie'],
             ['titre'=>'Installation sanitaire complète','desc'=>'Pose WC, lavabo, douche, baignoire. Raccordement eau et évacuation.','min'=>35000,'max'=>120000,'duree'=>1440,'cat'=>'Plomberie'],
             ['titre'=>'Débouchage canalisation','desc'=>'Débouchage manuel ou haute pression. Évier, WC, douche, cour.','min'=>10000,'max'=>30000,'duree'=>90,'cat'=>'Plomberie'],
             ['titre'=>'Installation chauffe-eau','desc'=>'Pose et raccordement chauffe-eau électrique ou solaire. Toutes marques.','min'=>20000,'max'=>60000,'duree'=>180,'cat'=>'Plomberie'],
         ],
         'portfolio'=>[
             ['titre'=>'Salle de bain moderne — Résidence Fidjrossè','desc'=>'Rénovation complète : douche italienne, double vasque, robinetterie chromée.','url'=>'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop'],
             ['titre'=>'Installation cuisine équipée — Villa Akpro','desc'=>'Raccordement évier, lave-vaisselle, machine à laver. Tuyauterie encastrée.','url'=>'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
             ['titre'=>'Chauffe-eau solaire — Immeuble Porto-Novo','desc'=>'Installation de 3 chauffe-eaux solaires pour un immeuble de 6 appartements.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
             ['titre'=>'Réparation urgence fuite — Nuit','desc'=>"Intervention d'urgence à 22h pour rupture de canalisation principale. Résolu en 1h30.",'url'=>'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Plomberie-Sanitaire','org'=>'École des Métiers de Cotonou','date'=>'2012-06-15'],
             ['nom'=>'Habilitation Gaz Naturel','org'=>'SBEE Bénin','date'=>'2018-03-20'],
             ['nom'=>'Certification Chauffe-eau Solaire','org'=>'ANADER Bénin','date'=>'2020-09-10'],
         ]],

        ['prenom'=>'Aïcha','nom'=>'Dossou','email'=>'aicha.dossou@artisanpro.bj','telephone'=>'+22997110002',
         'avatar'=>'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Électricienne diplômée',
         'description'=>'Électricienne certifiée, spécialisée en installation résidentielle et tertiaire. Mise aux normes, dépannage, tableau électrique, éclairage LED, domotique.',
         'bio'=>"Diplômée en Électrotechnique de l'INMES de Cotonou (2015). L'une des rares femmes électriciennes certifiées au Bénin. Installations conformes aux normes NFC 15-100.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi, Ouidah','tarif'=>12000,'note'=>4.9,'badge'=>'elite','lat'=>6.4970,'lng'=>2.6300,
         'categories'=>['Électricité','Climatisation'],
         'prestations'=>[
             ['titre'=>'Mise aux normes tableau électrique','desc'=>'Remplacement ou mise à niveau du tableau électrique selon normes NFC 15-100.','min'=>45000,'max'=>150000,'duree'=>960,'cat'=>'Électricité'],
             ['titre'=>'Installation éclairage LED','desc'=>'Pose spots encastrés, luminaires, variateurs. Économie énergie garantie.','min'=>15000,'max'=>80000,'duree'=>360,'cat'=>'Électricité'],
             ['titre'=>'Dépannage électrique urgent','desc'=>'Diagnostic et réparation panne électrique. Court-circuit, disjoncteur, prise défectueuse.','min'=>8000,'max'=>35000,'duree'=>120,'cat'=>'Électricité'],
             ['titre'=>'Installation climatiseur','desc'=>'Pose et raccordement climatiseur split. Toutes marques. Garantie 1 an sur la pose.','min'=>25000,'max'=>60000,'duree'=>240,'cat'=>'Climatisation'],
         ],
         'portfolio'=>[
             ['titre'=>'Tableau électrique neuf — Villa Cotonou','desc'=>'Remplacement complet du tableau vétuste par un tableau 3 rangées avec protection différentielle.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Éclairage LED showroom — Porto-Novo','desc'=>'Installation de 120 spots LED encastrés dans un showroom de 400m². Économie 60%.','url'=>'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&h=600&fit=crop'],
             ['titre'=>'Installation domotique — Résidence Fidjrossè','desc'=>'Système domotique complet : éclairage, volets, alarme, contrôle smartphone.','url'=>'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop'],
             ['titre'=>'Climatisation bureau — Immeuble Ganhi','desc'=>'Installation de 8 climatiseurs split dans un immeuble de bureaux.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BTS Électrotechnique','org'=>'INMES Cotonou','date'=>'2015-07-20'],
             ['nom'=>'Habilitation Électrique B2V BR BC','org'=>'SBEE Bénin','date'=>'2016-11-05'],
             ['nom'=>'Certification Domotique KNX','org'=>'KNX Association','date'=>'2022-04-18'],
         ]],

        ['prenom'=>'Théodore','nom'=>'Agossou','email'=>'theodore.agossou@artisanpro.bj','telephone'=>'+22997110003',
         'avatar'=>'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Maçon & Carreleur expert',
         'description'=>'Construction, rénovation et pose de carrelage haut de gamme. Spécialiste des finitions soignées pour villas, immeubles et locaux commerciaux.',
         'bio'=>"Artisan polyvalent avec 15 ans d'expérience dans le BTP béninois. J'ai participé à la construction de plus de 50 villas et 10 immeubles dans la région.",
         'zone'=>'Porto-Novo, Adjarra, Avrankou, Dangbo, Bonou','tarif'=>10000,'note'=>4.6,'badge'=>'certifie','lat'=>6.5025,'lng'=>2.6390,
         'categories'=>['Maçonnerie','Carrelage'],
         'prestations'=>[
             ['titre'=>'Construction mur en parpaing','desc'=>'Élévation de murs, cloisons, clôtures. Fourniture matériaux possible.','min'=>50000,'max'=>500000,'duree'=>5760,'cat'=>'Maçonnerie'],
             ['titre'=>'Pose carrelage sol','desc'=>'Pose carrelage grès cérame, marbre, granit. Joints époxy ou ciment.','min'=>3500,'max'=>8000,'duree'=>60,'cat'=>'Carrelage'],
             ['titre'=>'Rénovation façade','desc'=>'Ravalement, enduit, peinture façade. Traitement fissures et infiltrations.','min'=>80000,'max'=>400000,'duree'=>7200,'cat'=>'Maçonnerie'],
             ['titre'=>'Pose faïence salle de bain','desc'=>'Carrelage mural salle de bain, cuisine. Découpe précise, joints parfaits.','min'=>4000,'max'=>9000,'duree'=>60,'cat'=>'Carrelage'],
         ],
         'portfolio'=>[
             ['titre'=>'Villa R+1 — Adjarra','desc'=>'Construction complète d\'une villa R+1 de 180m². Gros œuvre, enduits, carrelage. Livraison en 4 mois.','url'=>'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop'],
             ['titre'=>'Carrelage marbre — Salon de réception','desc'=>'Pose de 120m² de marbre blanc veiné dans un salon de réception. Joints époxy gris.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Rénovation façade — Immeuble Porto-Novo','desc'=>'Ravalement complet d\'un immeuble R+3. Enduit projeté, peinture hydrofuge.','url'=>'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop'],
             ['titre'=>'Clôture et portail — Résidence Avrankou','desc'=>'Construction clôture 80m en parpaing + portail métallique. Finition crépi blanc.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Maçonnerie','org'=>'CFPA Porto-Novo','date'=>'2009-06-10'],
             ['nom'=>'Qualification RGE Rénovation','org'=>'ANADER Bénin','date'=>'2019-02-14'],
         ]],

        ['prenom'=>'Rosine','nom'=>'Kpossou','email'=>'rosine.kpossou@artisanpro.bj','telephone'=>'+22997110004',
         'avatar'=>'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Menuisière ébéniste',
         'description'=>'Fabrication sur mesure de portes, fenêtres, meubles et parquets en bois massif. Travail artisanal de qualité, bois locaux et importés.',
         'bio'=>"Passionnée de bois depuis l'enfance, formée à l'École des Arts et Métiers de Cotonou. Je travaille principalement le teck, l'iroko et le fraké. Chaque pièce est unique.",
         'zone'=>'Porto-Novo, Ouidah, Cotonou, Abomey-Calavi','tarif'=>18000,'note'=>4.7,'badge'=>'certifie','lat'=>6.4910,'lng'=>2.6190,
         'categories'=>['Menuiserie'],
         'prestations'=>[
             ['titre'=>"Porte d'entrée sur mesure",'desc'=>'Fabrication porte en bois massif (teck, iroko). Serrure multipoints, finition vernis ou laqué.','min'=>80000,'max'=>250000,'duree'=>5040,'cat'=>'Menuiserie'],
             ['titre'=>'Cuisine équipée sur mesure','desc'=>'Conception et fabrication de cuisine complète. Placards, plan de travail, tiroirs.','min'=>300000,'max'=>1500000,'duree'=>14400,'cat'=>'Menuiserie'],
             ['titre'=>'Parquet bois massif','desc'=>'Fourniture et pose parquet teck ou fraké. Ponçage, vitrification. Garantie 10 ans.','min'=>15000,'max'=>35000,'duree'=>60,'cat'=>'Menuiserie'],
             ['titre'=>'Dressing sur mesure','desc'=>'Conception dressing personnalisé. Penderies, tiroirs, étagères. Portes coulissantes ou battantes.','min'=>150000,'max'=>600000,'duree'=>7200,'cat'=>'Menuiserie'],
         ],
         'portfolio'=>[
             ['titre'=>'Cuisine teck massif — Villa Cotonou','desc'=>'Cuisine complète en teck massif avec îlot central. 12m² de plan de travail en granit.','url'=>'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
             ['titre'=>'Bibliothèque murale — Bureau Porto-Novo','desc'=>'Bibliothèque sur mesure du sol au plafond en iroko verni. 8 mètres linéaires.','url'=>'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
             ['titre'=>'Parquet fraké — Salon 60m²','desc'=>'Pose parquet fraké huilé dans un salon de 60m². Finition naturelle, joints serrés.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>"Portes intérieures — Résidence Ouidah",'desc'=>'Fabrication et pose de 12 portes intérieures en bois massif pour une villa.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BEP Menuiserie-Ébénisterie','org'=>'École des Arts et Métiers de Cotonou','date'=>'2010-07-05'],
             ['nom'=>'Certification Bois Certifié FSC','org'=>'Forest Stewardship Council','date'=>'2021-01-20'],
         ]],

        ['prenom'=>'Patrice','nom'=>'Zinsou','email'=>'patrice.zinsou@artisanpro.bj','telephone'=>'+22997110005',
         'avatar'=>'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Peintre décorateur',
         'description'=>'Peinture intérieure et extérieure, enduits décoratifs, ravalement de façade. Conseil en couleurs et décoration inclus.',
         'bio'=>"Artiste et artisan depuis 10 ans. Formé à la peinture décorative à Cotonou. Je propose aussi des fresques murales personnalisées pour hôtels et restaurants.",
         'zone'=>'Porto-Novo, Grand Nokoué, Cotonou, Abomey-Calavi','tarif'=>8000,'note'=>4.5,'badge'=>'aucun','lat'=>6.4930,'lng'=>2.6210,
         'categories'=>['Peinture'],
         'prestations'=>[
             ['titre'=>'Peinture intérieure','desc'=>'Préparation murs, sous-couche, 2 couches finition. Peintures lessivables ou mate.','min'=>1500,'max'=>4000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Ravalement façade','desc'=>'Nettoyage, traitement fissures, enduit, peinture hydrofuge. Garantie 10 ans.','min'=>3000,'max'=>7000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Enduit décoratif','desc'=>'Béton ciré, stuc, tadelakt, enduit à la chaux. Effets uniques et durables.','min'=>5000,'max'=>15000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Fresque murale','desc'=>'Création artistique sur mesure. Motifs africains, géométriques, portraits.','min'=>50000,'max'=>300000,'duree'=>2520,'cat'=>'Peinture'],
         ],
         'portfolio'=>[
             ['titre'=>'Hôtel Azalaï — Lobby décoratif','desc'=>'Enduit tadelakt et fresque murale de 20m² dans le lobby d\'un hôtel 4 étoiles.','url'=>'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
             ['titre'=>'Villa moderne — Peinture intérieure','desc'=>'Peinture complète d\'une villa de 250m². Couleurs tendance, finition velours.','url'=>'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop'],
             ['titre'=>'Restaurant — Décoration murale africaine','desc'=>'Fresque murale de 15m² représentant des scènes de vie béninoise.','url'=>'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
             ['titre'=>'Façade immeuble — Ravalement','desc'=>'Ravalement complet d\'un immeuble R+4. Enduit projeté, peinture siloxane.','url'=>'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Peinture-Décoration','org'=>'CFPA Cotonou','date'=>'2014-06-20'],
             ['nom'=>'Formation Enduits Décoratifs','org'=>'Weber Saint-Gobain Bénin','date'=>'2019-09-15'],
         ]],

        ['prenom'=>'Serge','nom'=>'Gbaguidi','email'=>'serge.gbaguidi@artisanpro.bj','telephone'=>'+22997110006',
         'avatar'=>'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Technicien Climatisation & Froid',
         'description'=>'Installation, entretien et réparation de tous types de climatiseurs. Certifié Daikin, Samsung et LG. Contrats de maintenance disponibles.',
         'bio'=>"Technicien frigoriste depuis 8 ans, certifié par les principales marques. J'interviens pour les particuliers, hôtels, restaurants et entreprises.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi, Sèmè-Podji','tarif'=>20000,'note'=>4.9,'badge'=>'elite','lat'=>6.4955,'lng'=>2.6260,
         'categories'=>['Climatisation','Électricité'],
         'prestations'=>[
             ['titre'=>'Installation climatiseur split','desc'=>'Pose et raccordement climatiseur split mural. Toutes puissances. Garantie 2 ans sur la pose.','min'=>30000,'max'=>80000,'duree'=>270,'cat'=>'Climatisation'],
             ['titre'=>'Entretien annuel climatiseur','desc'=>'Nettoyage filtres, vérification gaz, contrôle électrique. Contrat annuel disponible.','min'=>15000,'max'=>35000,'duree'=>90,'cat'=>'Climatisation'],
             ['titre'=>'Réparation panne climatiseur','desc'=>'Diagnostic et réparation toutes pannes. Remplacement compresseur, carte électronique, gaz.','min'=>20000,'max'=>120000,'duree'=>300,'cat'=>'Climatisation'],
             ['titre'=>'Climatisation centralisée','desc'=>'Installation système VRV/VRF pour immeubles et bureaux. Étude thermique incluse.','min'=>500000,'max'=>5000000,'duree'=>10800,'cat'=>'Climatisation'],
         ],
         'portfolio'=>[
             ['titre'=>'Hôtel 4 étoiles — 40 chambres climatisées','desc'=>'Installation de 40 climatiseurs Daikin dans un hôtel de Porto-Novo. Système centralisé.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
             ['titre'=>'Immeuble de bureaux — VRF Mitsubishi','desc'=>'Système VRF pour 800m² de bureaux. 15 unités intérieures, 2 groupes extérieurs.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Restaurant — Climatisation salle 200 couverts','desc'=>'Installation 6 cassettes de plafond Samsung dans un restaurant.','url'=>'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
             ['titre'=>'Villa — Climatisation 8 pièces','desc'=>'Équipement complet d\'une villa de 8 pièces en LG Artcool.','url'=>'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BTS Froid et Climatisation','org'=>'INMES Cotonou','date'=>'2016-07-15'],
             ['nom'=>'Certification Daikin D1','org'=>'Daikin Europe','date'=>'2018-05-20'],
             ['nom'=>'Certification Samsung HVAC','org'=>'Samsung Electronics','date'=>'2020-11-10'],
         ]],
        ['prenom'=>'Gilles','nom'=>'Akpovi','email'=>'gilles.akpovi@artisanpro.bj','telephone'=>'+22997110007',
         'avatar'=>'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Soudeur-Ferronnier',
         'description'=>'Fabrication et pose de portails, grilles, escaliers, garde-corps et structures métalliques sur mesure. Soudure MIG/TIG/électrode.',
         'bio'=>"Ferronnier de métier depuis 14 ans, j'ai créé mon atelier à Porto-Novo en 2015. Je réalise des pièces uniques alliant solidité et esthétique.",
         'zone'=>'Porto-Novo, Adjarra, Akpro-Missérété, Avrankou','tarif'=>12000,'note'=>4.6,'badge'=>'certifie','lat'=>6.5070,'lng'=>2.6480,
         'categories'=>['Soudure'],
         'prestations'=>[
             ['titre'=>'Portail coulissant sur mesure','desc'=>'Fabrication portail acier ou aluminium. Motorisation possible. Finition peinture ou galvanisation.','min'=>150000,'max'=>600000,'duree'=>7200,'cat'=>'Soudure'],
             ['titre'=>'Grilles de sécurité','desc'=>'Grilles fenêtres, portes, vérandas. Barreaux ronds ou plats. Peinture antirouille.','min'=>25000,'max'=>120000,'duree'=>3600,'cat'=>'Soudure'],
             ['titre'=>'Escalier métallique','desc'=>'Escalier droit ou hélicoïdal en acier. Garde-corps inclus. Finition peinture ou inox.','min'=>200000,'max'=>800000,'duree'=>9000,'cat'=>'Soudure'],
             ['titre'=>'Réparation soudure','desc'=>'Réparation portail, grille, structure métallique. Intervention rapide.','min'=>5000,'max'=>40000,'duree'=>150,'cat'=>'Soudure'],
         ],
         'portfolio'=>[
             ['titre'=>'Portail motorisé — Villa Adjarra','desc'=>'Portail coulissant 4m en acier galvanisé avec motorisation automatique et interphone.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
             ['titre'=>'Escalier hélicoïdal — Duplex Porto-Novo','desc'=>'Escalier hélicoïdal en acier noir avec marches en bois. Garde-corps design.','url'=>'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop'],
             ['titre'=>'Grilles décoratives — Résidence Akpro','desc'=>'Grilles fenêtres avec motifs géométriques africains. 24 fenêtres équipées.','url'=>'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop'],
             ['titre'=>'Structure métallique — Hangar industriel','desc'=>'Charpente métallique pour hangar de 500m². Poteaux HEA, pannes, bardage.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Soudure-Chaudronnerie','org'=>'CFPA Porto-Novo','date'=>'2010-06-15'],
             ['nom'=>'Qualification Soudeur TIG Inox','org'=>'CODINORM Bénin','date'=>'2017-08-22'],
         ]],
        ['prenom'=>'Éric','nom'=>'Toviho','email'=>'eric.toviho@artisanpro.bj','telephone'=>'+22997110008',
         'avatar'=>'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Technicien Informatique & Réseaux',
         'description'=>'Réparation PC et Mac, installation réseaux WiFi et filaires, maintenance informatique pour entreprises. Récupération de données, antivirus, formation utilisateurs.',
         'bio'=>"Technicien informatique certifié depuis 7 ans. J'interviens chez les particuliers et les entreprises. Contrats de maintenance mensuelle pour les PME de Porto-Novo.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi','tarif'=>10000,'note'=>4.7,'badge'=>'certifie','lat'=>6.4850,'lng'=>2.6180,
         'categories'=>['Informatique'],
         'prestations'=>[
             ['titre'=>'Réparation PC/Mac','desc'=>'Diagnostic et réparation ordinateurs. Remplacement pièces, réinstallation OS, nettoyage.','min'=>10000,'max'=>80000,'duree'=>1440,'cat'=>'Informatique'],
             ['titre'=>'Installation réseau WiFi','desc'=>'Installation routeur, répéteurs, câblage réseau. Configuration sécurisée.','min'=>25000,'max'=>150000,'duree'=>300,'cat'=>'Informatique'],
             ['titre'=>'Maintenance informatique entreprise','desc'=>'Contrat mensuel : mises à jour, sauvegardes, antivirus, support utilisateurs.','min'=>50000,'max'=>200000,'duree'=>480,'cat'=>'Informatique'],
             ['titre'=>'Récupération de données','desc'=>'Récupération données disque dur défaillant, clé USB, carte mémoire. Taux de succès 90%.','min'=>30000,'max'=>100000,'duree'=>1800,'cat'=>'Informatique'],
         ],
         'portfolio'=>[
             ['titre'=>"Réseau d'entreprise — 30 postes",'desc'=>"Installation réseau filaire et WiFi pour une PME de 30 employés. Serveur NAS, VPN.",'url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Salle informatique — École privée','desc'=>'Mise en place de 20 postes informatiques en réseau pour une école.','url'=>'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop'],
             ['titre'=>'Vidéosurveillance — Commerce Porto-Novo','desc'=>'Installation 8 caméras IP avec enregistrement cloud. Accès à distance smartphone.','url'=>'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop'],
             ['titre'=>'Récupération données — Disque dur crashé','desc'=>'Récupération de 500 Go de données sur disque dur défaillant pour un cabinet médical.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CompTIA A+ Certified','org'=>'CompTIA','date'=>'2017-04-10'],
             ['nom'=>'Cisco CCNA','org'=>'Cisco Systems','date'=>'2019-09-25'],
             ['nom'=>'Microsoft Certified: Azure Fundamentals','org'=>'Microsoft','date'=>'2022-06-15'],
         ]],

        // ── Nouveaux artisans ────────────────────────────────────────────────

        ['prenom'=>'Brice','nom'=>'Dèdèhou','email'=>'brice.dededhou@artisanpro.bj','telephone'=>'+22997110009',
         'avatar'=>'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Jardinier paysagiste',
         'description'=>'Création et entretien d\'espaces verts, jardins tropicaux, pelouses et haies. Spécialiste des plantes locales du Bénin. Devis gratuit à domicile.',
         'bio'=>"Passionné de nature depuis l'enfance, j'ai suivi une formation en horticulture à l'INRAB de Cotonou. Je crée des jardins qui respectent l'écosystème local tout en apportant fraîcheur et beauté.",
         'zone'=>'Porto-Novo, Adjarra, Avrankou, Akpro-Missérété','tarif'=>8000,'note'=>4.7,'badge'=>'certifie','lat'=>6.5060,'lng'=>2.6460,
         'categories'=>['Jardinage'],
         'prestations'=>[
             ['titre'=>'Création jardin tropical','desc'=>'Conception et plantation jardin avec espèces locales. Plan personnalisé inclus.','min'=>80000,'max'=>500000,'duree'=>4320,'cat'=>'Jardinage'],
             ['titre'=>'Entretien mensuel espaces verts','desc'=>'Tonte, taille, désherbage, arrosage. Contrat mensuel ou trimestriel.','min'=>15000,'max'=>60000,'duree'=>240,'cat'=>'Jardinage'],
             ['titre'=>'Élagage et abattage arbres','desc'=>'Élagage sécurisé, abattage contrôlé, broyage des déchets verts.','min'=>20000,'max'=>150000,'duree'=>480,'cat'=>'Jardinage'],
             ['titre'=>'Pose gazon naturel ou synthétique','desc'=>'Fourniture et pose gazon. Préparation sol, drainage, arrosage automatique.','min'=>5000,'max'=>15000,'duree'=>60,'cat'=>'Jardinage'],
         ],
         'portfolio'=>[
             ['titre'=>'Jardin tropical — Villa Anavié','desc'=>'Création d\'un jardin de 300m² avec palmiers, bananiers, hibiscus et allée en latérite.','url'=>'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'],
             ['titre'=>'Haie décorative — Résidence Ouando','desc'=>'Plantation et taille d\'une haie de 50m en bougainvilliers multicolores.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Pelouse gazon — Terrain de sport','desc'=>'Pose de 800m² de gazon naturel pour un terrain de football d\'école.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
             ['titre'=>'Jardin zen — Hôtel Porto-Novo','desc'=>'Aménagement d\'un espace de détente avec bambous, pierres et bassin.','url'=>'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BTS Horticulture','org'=>'INRAB Cotonou','date'=>'2013-07-10'],
             ['nom'=>'Certification Phytosanitaire','org'=>'MAEP Bénin','date'=>'2018-04-15'],
         ]],

        ['prenom'=>'Célestine','nom'=>'Vodounou','email'=>'celestine.vodounou@artisanpro.bj','telephone'=>'+22997110010',
         'avatar'=>'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Carreleur & Faïencier',
         'description'=>'Pose de carrelage haut de gamme, faïence, mosaïque et pierre naturelle. Spécialiste des salles de bain et cuisines modernes. Finitions impeccables garanties.',
         'bio'=>"Artisane depuis 11 ans, formée à l'École des Métiers de Porto-Novo. Je suis l'une des rares femmes carreleurs certifiées au Bénin. Mon travail est reconnu pour sa précision et ses finitions soignées.",
         'zone'=>'Porto-Novo, Sèmè-Podji, Cotonou','tarif'=>6000,'note'=>4.8,'badge'=>'certifie','lat'=>6.4940,'lng'=>2.6240,
         'categories'=>['Carrelage','Maçonnerie'],
         'prestations'=>[
             ['titre'=>'Pose carrelage grand format','desc'=>'Carrelage 60x60, 80x80, 120x60. Rectifié, joints fins. Résultat haut de gamme.','min'=>5000,'max'=>12000,'duree'=>60,'cat'=>'Carrelage'],
             ['titre'=>'Salle de bain complète','desc'=>'Carrelage sol et mur, faïence, niche de douche, tablette. Clé en main.','min'=>150000,'max'=>600000,'duree'=>5760,'cat'=>'Carrelage'],
             ['titre'=>'Mosaïque décorative','desc'=>'Création mosaïque sur mesure : piscine, fontaine, tableau mural.','min'=>20000,'max'=>200000,'duree'=>2880,'cat'=>'Carrelage'],
             ['titre'=>'Rénovation cuisine','desc'=>'Dépose ancien carrelage, ragréage, pose nouveau carrelage et crédence.','min'=>80000,'max'=>300000,'duree'=>2880,'cat'=>'Carrelage'],
         ],
         'portfolio'=>[
             ['titre'=>'Salle de bain marbre — Villa Hinkoudé','desc'=>'Salle de bain 12m² entièrement en marbre blanc de Carrare. Douche à l\'italienne.','url'=>'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop'],
             ['titre'=>'Cuisine moderne — Appartement Agbokou','desc'=>'Carrelage grès cérame 60x60 gris anthracite + crédence en mosaïque dorée.','url'=>'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
             ['titre'=>'Piscine mosaïque — Résidence Djègan','desc'=>'Revêtement piscine en mosaïque bleu turquoise. 45m² de surface.','url'=>'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&h=600&fit=crop'],
             ['titre'=>'Hall d\'entrée — Immeuble Attakè','desc'=>'Carrelage marbre noir et blanc en damier pour hall d\'entrée de 30m².','url'=>'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Carrelage-Mosaïque','org'=>'École des Métiers de Porto-Novo','date'=>'2013-06-20'],
             ['nom'=>'Formation Pose Grands Formats','org'=>'Mapei Bénin','date'=>'2020-03-10'],
         ]],

        ['prenom'=>'Narcisse','nom'=>'Agbangla','email'=>'narcisse.agbangla@artisanpro.bj','telephone'=>'+22997110011',
         'avatar'=>'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Électricien bâtiment & solaire',
         'description'=>'Installation électrique, énergie solaire photovoltaïque, onduleurs et batteries. Spécialiste des systèmes hybrides pour particuliers et entreprises.',
         'bio'=>"Électricien depuis 9 ans, reconverti dans le solaire en 2019. J'ai installé plus de 120 systèmes solaires dans la région de Porto-Novo. Formé par SolarEdge et Victron Energy.",
         'zone'=>'Porto-Novo, Adjarra, Avrankou, Dangbo','tarif'=>14000,'note'=>4.9,'badge'=>'elite','lat'=>6.5000,'lng'=>2.6350,
         'categories'=>['Électricité'],
         'prestations'=>[
             ['titre'=>'Installation solaire résidentielle','desc'=>'Système solaire complet : panneaux, onduleur, batteries, tableau. Autonomie 24h.','min'=>500000,'max'=>3000000,'duree'=>14400,'cat'=>'Électricité'],
             ['titre'=>'Dépannage électrique urgent','desc'=>'Intervention rapide toutes pannes. Disponible 7j/7 de 7h à 22h.','min'=>10000,'max'=>50000,'duree'=>120,'cat'=>'Électricité'],
             ['titre'=>'Installation tableau électrique','desc'=>'Tableau neuf ou remplacement. Disjoncteurs différentiels, protection parafoudre.','min'=>60000,'max'=>200000,'duree'=>720,'cat'=>'Électricité'],
             ['titre'=>'Éclairage solaire extérieur','desc'=>'Lampadaires solaires, spots de jardin, éclairage parking. Autonome et économique.','min'=>30000,'max'=>200000,'duree'=>480,'cat'=>'Électricité'],
         ],
         'portfolio'=>[
             ['titre'=>'Système solaire 5kWc — Villa Adjina','desc'=>'Installation 12 panneaux 450W + onduleur Victron + 4 batteries lithium 200Ah.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
             ['titre'=>'Éclairage solaire — Quartier Ouando','desc'=>'Installation de 15 lampadaires solaires pour l\'éclairage d\'une rue résidentielle.','url'=>'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800&h=600&fit=crop'],
             ['titre'=>'Centrale solaire — École primaire','desc'=>'Système 3kWc pour alimenter 6 salles de classe. Économie 80% sur la facture SBEE.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Tableau électrique neuf — Immeuble R+3','desc'=>'Remplacement tableau vétuste par tableau 4 rangées avec protection différentielle.','url'=>'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BTS Électrotechnique','org'=>'INMES Cotonou','date'=>'2015-07-15'],
             ['nom'=>'Certification SolarEdge Installateur','org'=>'SolarEdge Technologies','date'=>'2020-02-20'],
             ['nom'=>'Victron Energy Certified Installer','org'=>'Victron Energy','date'=>'2021-11-08'],
         ]],

        ['prenom'=>'Yvette','nom'=>'Kossou','email'=>'yvette.kossou@artisanpro.bj','telephone'=>'+22997110012',
         'avatar'=>'https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Peintre en bâtiment',
         'description'=>'Peinture intérieure et extérieure, enduits, ravalement. Travail soigné, délais respectés. Devis gratuit sous 24h.',
         'bio'=>"Artisane peintre depuis 8 ans à Porto-Novo. Formée à l'CFPA de Cotonou, je travaille aussi bien pour les particuliers que pour les promoteurs immobiliers.",
         'zone'=>'Porto-Novo, Sèmè-Podji, Akpro-Missérété','tarif'=>7000,'note'=>4.5,'badge'=>'aucun','lat'=>6.4985,'lng'=>2.6330,
         'categories'=>['Peinture'],
         'prestations'=>[
             ['titre'=>'Peinture intérieure complète','desc'=>'Préparation, sous-couche, 2 couches finition. Peinture lessivable ou velours.','min'=>2000,'max'=>5000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Peinture façade','desc'=>'Nettoyage, traitement fissures, peinture hydrofuge. Garantie 5 ans.','min'=>3500,'max'=>8000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Enduit de lissage','desc'=>'Enduit de finition pour murs neufs ou rénovation. Résultat lisse et uniforme.','min'=>2500,'max'=>6000,'duree'=>60,'cat'=>'Peinture'],
             ['titre'=>'Peinture plafond','desc'=>'Peinture plafond blanc mat ou satiné. Traitement taches et auréoles.','min'=>1500,'max'=>3500,'duree'=>60,'cat'=>'Peinture'],
         ],
         'portfolio'=>[
             ['titre'=>'Appartement neuf — Résidence Koutongbé','desc'=>'Peinture complète d\'un appartement T4 de 90m². Couleurs personnalisées par pièce.','url'=>'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&h=600&fit=crop'],
             ['titre'=>'Façade villa — Quartier Djègan Daho','desc'=>'Ravalement façade villa R+1. Enduit projeté + peinture siloxane blanc cassé.','url'=>'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop'],
             ['titre'=>'Bureau moderne — Immeuble Hinkoudé','desc'=>'Peinture bureaux 200m². Couleurs corporate, finition satiné lavable.','url'=>'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
             ['titre'=>'Chambre enfant — Villa Attakè','desc'=>'Décoration chambre enfant avec frise murale et peinture thématique jungle.','url'=>'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Peinture Bâtiment','org'=>'CFPA Cotonou','date'=>'2016-06-15'],
         ]],

        ['prenom'=>'Damien','nom'=>'Hounkpatin','email'=>'damien.hounkpatin@artisanpro.bj','telephone'=>'+22997110013',
         'avatar'=>'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Plombier & Sanitaire',
         'description'=>'Plomberie générale, installation sanitaire, chauffe-eau, fosse septique. Intervention rapide sur Porto-Novo et environs. Disponible week-end.',
         'bio'=>"Plombier depuis 10 ans, j'ai travaillé sur des chantiers de construction à Cotonou avant de m'installer à Porto-Novo. Je maîtrise les installations en PVC, PPR et cuivre.",
         'zone'=>'Porto-Novo, Adjarra, Avrankou','tarif'=>12000,'note'=>4.6,'badge'=>'certifie','lat'=>6.4960,'lng'=>2.6280,
         'categories'=>['Plomberie'],
         'prestations'=>[
             ['titre'=>'Installation fosse septique','desc'=>'Fosse septique toutes eaux. Terrassement, pose, raccordement. Conforme normes.','min'=>200000,'max'=>800000,'duree'=>5760,'cat'=>'Plomberie'],
             ['titre'=>'Réparation fuite urgente','desc'=>'Intervention urgence 7j/7. Fuite canalisation, robinet, chasse d\'eau.','min'=>8000,'max'=>30000,'duree'=>90,'cat'=>'Plomberie'],
             ['titre'=>'Installation salle de bain','desc'=>'Pose WC, lavabo, douche, baignoire. Raccordement eau froide/chaude et évacuation.','min'=>50000,'max'=>200000,'duree'=>2880,'cat'=>'Plomberie'],
             ['titre'=>'Chauffe-eau solaire','desc'=>'Installation chauffe-eau solaire 200L. Économie 70% sur la facture d\'eau chaude.','min'=>150000,'max'=>400000,'duree'=>480,'cat'=>'Plomberie'],
         ],
         'portfolio'=>[
             ['titre'=>'Fosse septique — Villa Avakpa','desc'=>'Installation fosse septique 5000L pour villa de 6 personnes. Conforme normes SONEB.','url'=>'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&h=600&fit=crop'],
             ['titre'=>'Salle de bain moderne — Appartement Agbokou','desc'=>'Installation complète : douche à l\'italienne, WC suspendu, double vasque.','url'=>'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop'],
             ['titre'=>'Réseau eau — Immeuble R+4','desc'=>'Installation réseau eau froide et chaude pour immeuble de 8 appartements.','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
             ['titre'=>'Chauffe-eau solaire — Résidence Sèdjèko','desc'=>'Installation 2 chauffe-eaux solaires 300L pour résidence de 4 appartements.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Plomberie','org'=>'CFPA Porto-Novo','date'=>'2014-06-10'],
             ['nom'=>'Habilitation Assainissement','org'=>'SONEB Bénin','date'=>'2019-05-20'],
         ]],

        ['prenom'=>'Fidèle','nom'=>'Azonhiho','email'=>'fidele.azonhiho@artisanpro.bj','telephone'=>'+22997110014',
         'avatar'=>'https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Menuisier aluminium & PVC',
         'description'=>'Fabrication et pose de menuiseries aluminium et PVC : fenêtres, portes, vérandas, garde-corps, pergolas. Isolation thermique et phonique garantie.',
         'bio'=>"Spécialiste de la menuiserie aluminium depuis 12 ans. J'ai équipé plus de 200 villas et immeubles à Porto-Novo. Mes réalisations allient esthétique moderne et performance thermique.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi, Sèmè-Podji','tarif'=>16000,'note'=>4.7,'badge'=>'certifie','lat'=>6.5080,'lng'=>2.6500,
         'categories'=>['Menuiserie'],
         'prestations'=>[
             ['titre'=>'Fenêtres aluminium double vitrage','desc'=>'Fabrication et pose fenêtres aluminium. Double vitrage 4/16/4. Isolation optimale.','min'=>80000,'max'=>300000,'duree'=>2880,'cat'=>'Menuiserie'],
             ['titre'=>'Porte d\'entrée aluminium','desc'=>'Porte blindée aluminium avec serrure multipoints. Finition laquée ou anodisée.','min'=>150000,'max'=>500000,'duree'=>1440,'cat'=>'Menuiserie'],
             ['titre'=>'Véranda aluminium','desc'=>'Conception et pose véranda sur mesure. Toit polycarbonate ou verre feuilleté.','min'=>500000,'max'=>3000000,'duree'=>14400,'cat'=>'Menuiserie'],
             ['titre'=>'Garde-corps aluminium','desc'=>'Garde-corps balcon, escalier, terrasse. Barreaux, câbles ou verre. Sur mesure.','min'=>40000,'max'=>200000,'duree'=>1440,'cat'=>'Menuiserie'],
         ],
         'portfolio'=>[
             ['titre'=>'Véranda moderne — Villa Gbèdjromèdé','desc'=>'Véranda 25m² en aluminium blanc avec toit en verre feuilleté. Vue jardin.','url'=>'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop'],
             ['titre'=>'Fenêtres double vitrage — Immeuble Dodji','desc'=>'Remplacement 24 fenêtres par menuiseries aluminium double vitrage. Économie 40% climatisation.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
             ['titre'=>'Garde-corps verre — Duplex Anavié','desc'=>'Garde-corps en verre feuilleté 10mm pour terrasse de 15m linéaires.','url'=>'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop'],
             ['titre'=>'Porte coulissante — Salon Gbodjè','desc'=>'Grande baie vitrée coulissante 4m en aluminium thermolaqué gris anthracite.','url'=>'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'CAP Menuiserie Aluminium','org'=>'CFPA Cotonou','date'=>'2012-06-20'],
             ['nom'=>'Certification Technal Installateur','org'=>'Technal France','date'=>'2018-09-15'],
         ]],

        ['prenom'=>'Sandrine','nom'=>'Dossevi','email'=>'sandrine.dossevi@artisanpro.bj','telephone'=>'+22997110015',
         'avatar'=>'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Technicienne en climatisation',
         'description'=>'Installation, entretien et dépannage de climatiseurs résidentiels et commerciaux. Certifiée Mitsubishi et Gree. Contrats de maintenance annuelle disponibles.',
         'bio'=>"Technicienne frigoriste depuis 6 ans, je suis l'une des rares femmes dans ce métier au Bénin. Formée à l'INMES de Cotonou, je maîtrise tous les types de climatiseurs du marché.",
         'zone'=>'Porto-Novo, Sèmè-Podji, Adjarra','tarif'=>18000,'note'=>4.8,'badge'=>'certifie','lat'=>6.5090,'lng'=>2.6520,
         'categories'=>['Climatisation','Électricité'],
         'prestations'=>[
             ['titre'=>'Installation climatiseur résidentiel','desc'=>'Pose climatiseur split 9000 à 24000 BTU. Câblage électrique inclus. Garantie 2 ans.','min'=>35000,'max'=>90000,'duree'=>300,'cat'=>'Climatisation'],
             ['titre'=>'Maintenance préventive','desc'=>'Nettoyage complet, vérification gaz, contrôle électrique. Rapport d\'intervention.','min'=>15000,'max'=>40000,'duree'=>120,'cat'=>'Climatisation'],
             ['titre'=>'Recharge gaz climatiseur','desc'=>'Détection fuite, réparation, recharge gaz R32 ou R410A. Garantie 6 mois.','min'=>25000,'max'=>60000,'duree'=>180,'cat'=>'Climatisation'],
             ['titre'=>'Climatisation commerciale','desc'=>'Systèmes multi-split pour boutiques, restaurants, bureaux. Étude et devis gratuits.','min'=>200000,'max'=>2000000,'duree'=>7200,'cat'=>'Climatisation'],
         ],
         'portfolio'=>[
             ['titre'=>'Boutique climatisée — Centre commercial Ouando','desc'=>'Installation 4 climatiseurs Mitsubishi 18000 BTU dans une boutique de 80m².','url'=>'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&h=600&fit=crop'],
             ['titre'=>'Villa 5 pièces — Quartier Akonaboè','desc'=>'Équipement complet villa : 5 climatiseurs Gree avec télécommande WiFi.','url'=>'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'],
             ['titre'=>'Salle de conférence — Hôtel Djlado','desc'=>'Climatisation salle 100 personnes avec système VRF Daikin. Contrôle centralisé.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>'Maintenance annuelle — Résidence Houinvié','desc'=>'Contrat maintenance 12 climatiseurs pour résidence de 6 appartements.','url'=>'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BTS Génie Climatique','org'=>'INMES Cotonou','date'=>'2018-07-20'],
             ['nom'=>'Certification Mitsubishi Electric','org'=>'Mitsubishi Electric','date'=>'2020-06-10'],
             ['nom'=>'Certification Gree Installateur','org'=>'Gree Electric','date'=>'2022-03-15'],
         ]],
    ]; }

    private function seedFormations(array $artisanUsers): void
    {
        $formations = [
            AcademieFormation::create([
                'titre'       => 'Sécurité sur les chantiers',
                'description' => 'Règles de sécurité essentielles pour travailler en toute sécurité sur les chantiers de construction et de rénovation.',
                'url_contenu' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            ]),
            AcademieFormation::create([
                'titre'       => 'Relation client et communication professionnelle',
                'description' => 'Comment accueillir, conseiller et fidéliser vos clients. Techniques de communication et gestion des conflits.',
                'url_contenu' => null,
            ]),
            AcademieFormation::create([
                'titre'       => 'Gestion financière pour artisans',
                'description' => 'Établir un devis, facturer, gérer sa trésorerie et comprendre les bases de la comptabilité artisanale.',
                'url_contenu' => null,
            ]),
            AcademieFormation::create([
                'titre'       => 'Utilisation de la plateforme ArtisanPro',
                'description' => 'Guide complet pour optimiser votre profil, gérer vos réservations et maximiser votre visibilité sur ArtisanPro.',
                'url_contenu' => null,
            ]),
            AcademieFormation::create([
                'titre'       => 'Normes et réglementations du bâtiment au Bénin',
                'description' => 'Les normes de construction, les obligations légales et les certifications requises pour exercer au Bénin.',
                'url_contenu' => null,
            ]),
            AcademieFormation::create([
                'titre'       => 'Développement durable et éco-construction',
                'description' => 'Matériaux écologiques, techniques d\'isolation thermique et pratiques durables pour les artisans du bâtiment.',
                'url_contenu' => null,
            ]),
        ];

        // Associer quelques formations aux artisans (simulation de complétion)
        foreach ($artisanUsers as $i => $au) {
            $artisan = $au['artisan'];
            // Les premiers artisans ont complété plus de formations
            $nbFormations = max(1, 4 - $i);
            $selected = array_slice($formations, 0, min($nbFormations, count($formations)));
            foreach ($selected as $formation) {
                $artisan->formations()->syncWithoutDetaching([
                    $formation->id => ['date_achevement' => Carbon::now()->subDays(rand(10, 180))],
                ]);
            }
        }
    }

    private function seedPartenaires(): void
    {
        $partenaires = [
            [
                'nom_fournisseur'   => 'SBEE Bénin',
                'description'       => 'Société Béninoise d\'Énergie Électrique — Partenaire officiel pour les habilitations électriques et raccordements réseau.',
                'contact_email'     => 'partenariat@sbee.bj',
                'contact_telephone' => '+229 21 31 22 45',
                'logo_url'          => null,
                'site_web'          => 'https://www.sbee.bj',
                'type'              => 'partenaire',
                'actif'             => true,
            ],
            [
                'nom_fournisseur'   => 'SONEB',
                'description'       => 'Société Nationale des Eaux du Bénin — Partenaire pour les raccordements eau potable et certifications plomberie.',
                'contact_email'     => 'contact@soneb.bj',
                'contact_telephone' => '+229 21 30 08 08',
                'logo_url'          => null,
                'site_web'          => 'https://www.soneb.bj',
                'type'              => 'partenaire',
                'actif'             => true,
            ],
            [
                'nom_fournisseur'   => 'CFPA Porto-Novo',
                'description'       => 'Centre de Formation Professionnelle des Artisans — Partenaire formation et certification des artisans du Bénin.',
                'contact_email'     => 'formation@cfpa-portonovo.bj',
                'contact_telephone' => '+229 20 21 45 67',
                'logo_url'          => null,
                'site_web'          => null,
                'type'              => 'formation',
                'actif'             => true,
            ],
            [
                'nom_fournisseur'   => 'Assurances NSIA Bénin',
                'description'       => 'Assureur partenaire pour la responsabilité civile professionnelle des artisans inscrits sur ArtisanPro.',
                'contact_email'     => 'artisans@nsia.bj',
                'contact_telephone' => '+229 21 31 50 00',
                'logo_url'          => null,
                'site_web'          => 'https://www.nsia.bj',
                'type'              => 'assureur',
                'actif'             => true,
            ],
            [
                'nom_fournisseur'   => 'Quincaillerie Centrale Porto-Novo',
                'description'       => 'Fournisseur de matériaux de construction, outillage et équipements pour artisans. Tarifs préférentiels pour les membres ArtisanPro.',
                'contact_email'     => 'pro@quincaillerie-centrale.bj',
                'contact_telephone' => '+229 20 22 33 44',
                'logo_url'          => null,
                'site_web'          => null,
                'type'              => 'fournisseur',
                'actif'             => true,
            ],
            [
                'nom_fournisseur'   => 'MTN Bénin Business',
                'description'       => 'Solutions Mobile Money et paiement digital pour artisans. Intégration MoMo Pay sur ArtisanPro.',
                'contact_email'     => 'business@mtn.bj',
                'contact_telephone' => '+229 97 00 00 00',
                'logo_url'          => null,
                'site_web'          => 'https://www.mtn.bj',
                'type'              => 'partenaire',
                'actif'             => true,
            ],
        ];

        foreach ($partenaires as $p) {
            FournisseurPartenaire::create($p);
        }
    }
}
