<?php

namespace Database\Seeders;

use App\Models\Artisan;
use App\Models\Avis;
use App\Models\Category;
use App\Models\Certification;
use App\Models\Client;
use App\Models\PortfolioImage;
use App\Models\Prestation;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        foreach (['avis','certifications','portfolio_images','prestations','artisan_specialites','client_favoris','reservations','devis','messages','paiements','artisans','clients','utilisateurs','categories'] as $t) {
            DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $cats = $this->seedCategories();
        $artisanUsers = $this->seedArtisans($cats);
        $clientUsers  = $this->seedClients();
        $this->seedAdmin();
        $this->seedAvis($clientUsers, $artisanUsers);

        foreach (Category::all() as $cat) {
            $cat->update(['nombre_artisans' => $cat->artisans()->count()]);
        }
        foreach ($artisanUsers as $au) {
            $avg = Avis::where('id_artisan', $au['artisan']->id)->avg('note');
            $au['artisan']->update(['note_moyenne' => round($avg ?? $au['artisan']->note_moyenne, 2)]);
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
            'avatar'=>'https://api.dicebear.com/7.x/initials/svg?seed=RA',
        ]);
    }

    private function seedClients(): array
    {
        $list = [
            ['prenom'=>'Marie','nom'=>'Akpovi','email'=>'marie.akpovi@gmail.com','telephone'=>'+22997220001','avatar'=>'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Jean-Baptiste','nom'=>'Soglo','email'=>'jb.soglo@gmail.com','telephone'=>'+22997220002','avatar'=>'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Fatou','nom'=>'Diallo','email'=>'fatou.diallo@gmail.com','telephone'=>'+22997220003','avatar'=>'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Christophe','nom'=>'Hounsa','email'=>'c.hounsa@gmail.com','telephone'=>'+22997220004','avatar'=>'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
            ['prenom'=>'Aminata','nom'=>'Bello','email'=>'aminata.bello@gmail.com','telephone'=>'+22997220005','avatar'=>'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face'],
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
            5=>["Travail impeccable, je recommande vivement !","Excellent artisan, très professionnel et ponctuel.","Résultat parfait, au-delà de mes attentes.","Très satisfait du travail réalisé. Propre et soigné.","Artisan sérieux et compétent. Je referai appel à lui."],
            4=>["Bon travail dans l'ensemble, quelques petits détails.","Professionnel et efficace. Légèrement en retard mais bon résultat.","Bonne prestation, rapport qualité-prix correct.","Travail bien fait, communication agréable."],
            3=>["Travail correct mais délai non respecté.","Résultat moyen, quelques finitions à améliorer."],
        ];
        foreach ($artisans as $au) {
            $shuffled = $clients; shuffle($shuffled);
            $n = min(rand(3,5), count($shuffled));
            for ($i=0; $i<$n; $i++) {
                $note = $i===0 ? 5 : (rand(0,10)>2 ? rand(4,5) : rand(3,4));
                $cl = $comments[$note] ?? $comments[4];
                Avis::create(['id_client'=>$shuffled[$i]['client']->id,'id_artisan'=>$au['artisan']->id,
                    'id_reservation'=>null,
                    'note'=>$note,'commentaire'=>$cl[array_rand($cl)],
                    'date_avis'=>Carbon::now()->subDays(rand(5,180))]);
            }
        }
    }

    private function artisansData(): array { return [
        ['prenom'=>'Kofi','nom'=>'Hounsou','email'=>'kofi.hounsou@artisanpro.bj','telephone'=>'+22997110001',
         'avatar'=>'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop&crop=face',
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
         'avatar'=>'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Électricienne diplômée',
         'description'=>'Électricienne certifiée, spécialisée en installation résidentielle et tertiaire. Mise aux normes, dépannage, tableau électrique, éclairage LED, domotique.',
         'bio'=>"Diplômée en Électrotechnique de l'INMES de Cotonou (2015). L'une des rares femmes électriciennes certifiées au Bénin. Installations conformes aux normes NFC 15-100.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi, Ouidah','tarif'=>12000,'note'=>4.9,'badge'=>'elite','lat'=>6.3703,'lng'=>2.3912,
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
         'avatar'=>'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Maçon & Carreleur expert',
         'description'=>'Construction, rénovation et pose de carrelage haut de gamme. Spécialiste des finitions soignées pour villas, immeubles et locaux commerciaux.',
         'bio'=>"Artisan polyvalent avec 15 ans d'expérience dans le BTP béninois. J'ai participé à la construction de plus de 50 villas et 10 immeubles dans la région.",
         'zone'=>'Porto-Novo, Adjarra, Avrankou, Dangbo, Bonou','tarif'=>10000,'note'=>4.6,'badge'=>'certifie','lat'=>6.5000,'lng'=>2.6500,
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
         'avatar'=>'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Menuisière ébéniste',
         'description'=>'Fabrication sur mesure de portes, fenêtres, meubles et parquets en bois massif. Travail artisanal de qualité, bois locaux et importés.',
         'bio'=>"Passionnée de bois depuis l'enfance, formée à l'École des Arts et Métiers de Cotonou. Je travaille principalement le teck, l'iroko et le fraké. Chaque pièce est unique.",
         'zone'=>'Porto-Novo, Ouidah, Cotonou, Abomey-Calavi','tarif'=>18000,'note'=>4.7,'badge'=>'certifie','lat'=>6.4800,'lng'=>2.6100,
         'categories'=>['Menuiserie'],
         'prestations'=>[
             ['titre'=>"Porte d'entrée sur mesure",'desc'=>'Fabrication porte en bois massif (teck, iroko). Serrure multipoints, finition vernis ou laqué.','min'=>80000,'max'=>250000,'duree'=>5040,'cat'=>'Menuiserie'],
             ['titre'=>'Cuisine équipée sur mesure','desc'=>'Conception et fabrication de cuisine complète. Placards, plan de travail, tiroirs.','min'=>300000,'max'=>1500000,'duree'=>14400,'cat'=>'Menuiserie'],
             ['titre'=>'Parquet bois massif','desc'=>'Fourniture et pose parquet teck ou fraké. Ponçage, vitrification. Garantie 10 ans.','min'=>15000,'max'=>35000,'duree'=>60,'cat'=>'Menuiserie'],
             ['titre'=>'Dressing sur mesure','desc'=>'Conception dressing personnalisé. Penderies, tiroirs, étagères. Portes coulissantes ou battantes.','min'=>150000,'max'=>600000,'duree'=>7200,'cat'=>'Menuiserie'],
         ],
         'portfolio'=>[
             ['titre'=>'Cuisine teck massif — Villa Cotonou','desc'=>'Cuisine complète en teck massif avec îlot central. 12m² de plan de travail en granit.','url'=>'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'],
             ['titre'=>'Bibliothèque murale — Bureau Porto-Novo','desc'=>'Bibliothèque sur mesure du sol au plafond en iroko verni. 8 mètres linéaires.','url'=>'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'],
             ['titre'=>'Parquet fraké — Salon 60m²','desc'=>'Pose parquet fraké huilé dans un salon de 60m². Finition naturelle, joints serrés.','url'=>'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'],
             ['titre'=>"Portes intérieures — Résidence Ouidah",'desc'=>'Fabrication et pose de 12 portes intérieures en bois massif pour une villa.','url'=>'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop'],
         ],
         'certifications'=>[
             ['nom'=>'BEP Menuiserie-Ébénisterie','org'=>'École des Arts et Métiers de Cotonou','date'=>'2010-07-05'],
             ['nom'=>'Certification Bois Certifié FSC','org'=>'Forest Stewardship Council','date'=>'2021-01-20'],
         ]],

        ['prenom'=>'Patrice','nom'=>'Zinsou','email'=>'patrice.zinsou@artisanpro.bj','telephone'=>'+22997110005',
         'avatar'=>'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Peintre décorateur',
         'description'=>'Peinture intérieure et extérieure, enduits décoratifs, ravalement de façade. Conseil en couleurs et décoration inclus.',
         'bio'=>"Artiste et artisan depuis 10 ans. Formé à la peinture décorative à Cotonou. Je propose aussi des fresques murales personnalisées pour hôtels et restaurants.",
         'zone'=>'Porto-Novo, Grand Nokoué, Cotonou, Abomey-Calavi','tarif'=>8000,'note'=>4.5,'badge'=>'aucun','lat'=>6.4900,'lng'=>2.6200,
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
         'avatar'=>'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Technicien Climatisation & Froid',
         'description'=>'Installation, entretien et réparation de tous types de climatiseurs. Certifié Daikin, Samsung et LG. Contrats de maintenance disponibles.',
         'bio'=>"Technicien frigoriste depuis 8 ans, certifié par les principales marques. J'interviens pour les particuliers, hôtels, restaurants et entreprises.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi, Sèmè-Podji','tarif'=>20000,'note'=>4.9,'badge'=>'elite','lat'=>6.4750,'lng'=>2.6050,
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
         'avatar'=>'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Soudeur-Ferronnier',
         'description'=>'Fabrication et pose de portails, grilles, escaliers, garde-corps et structures métalliques sur mesure. Soudure MIG/TIG/électrode.',
         'bio'=>"Ferronnier de métier depuis 14 ans, j'ai créé mon atelier à Porto-Novo en 2015. Je réalise des pièces uniques alliant solidité et esthétique.",
         'zone'=>'Porto-Novo, Adjarra, Akpro-Missérété, Avrankou','tarif'=>12000,'note'=>4.6,'badge'=>'certifie','lat'=>6.5100,'lng'=>2.6400,
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
         'avatar'=>'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
         'metier'=>'Technicien Informatique & Réseaux',
         'description'=>'Réparation PC et Mac, installation réseaux WiFi et filaires, maintenance informatique pour entreprises. Récupération de données, antivirus, formation utilisateurs.',
         'bio'=>"Technicien informatique certifié depuis 7 ans. J'interviens chez les particuliers et les entreprises. Contrats de maintenance mensuelle pour les PME de Porto-Novo.",
         'zone'=>'Porto-Novo, Cotonou, Abomey-Calavi','tarif'=>10000,'note'=>4.7,'badge'=>'certifie','lat'=>6.4850,'lng'=>2.6150,
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
    ]; }
}
