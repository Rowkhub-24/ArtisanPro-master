<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Contrat finalisé — ArtisanPro</title>
</head>
<body>
    <h1>Votre contrat {{ $numeroContrat }} a été finalisé</h1>

    <p>Bonjour,</p>

    <p>
        Nous avons le plaisir de vous informer que le contrat
        <strong>{{ $numeroContrat }}</strong> entre <strong>{{ $nomClient }}</strong>
        et <strong>{{ $nomArtisan }}</strong> a été signé par les deux parties.
    </p>

    <p>
        <strong>Prestation :</strong> {{ $descriptionPrestation }}<br>
        <strong>Montant total :</strong> {{ number_format($montantTotal, 0, ',', ' ') }} FCFA<br>
        @if($dateDebutPrestation)
        <strong>Date de début :</strong> {{ $dateDebutPrestation }}
        @endif
    </p>

    <p>
        Vous trouverez ci-joint le PDF final de votre contrat. Vous pouvez également
        le télécharger depuis votre espace personnel ArtisanPro.
    </p>

    <p>Cordialement,<br>L'équipe ArtisanPro</p>
</body>
</html>
