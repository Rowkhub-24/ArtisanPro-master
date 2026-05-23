<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation Refusée</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px 20px;
        }
        .rejection-badge {
            display: inline-block;
            background-color: #ef4444;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .info-box {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #7f1d1d;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .button {
            display: inline-block;
            background-color: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✗ Réservation Refusée</h1>
        </div>
        
        <div class="content">
            <p>Bonjour <strong>{{ $client_name }}</strong>,</p>
            
            <p>Nous vous informons que votre réservation avec <strong>{{ $artisan_name }}</strong> a été <strong style="color: #ef4444;">refusée</strong>.</p>
            
            <div class="rejection-badge">Statut: REFUSÉE</div>
            
            <div class="info-box">
                <strong>Détails de votre réservation:</strong><br>
                Artisan: {{ $artisan_name }}<br>
                Date demandée: {{ $reservation_date }}<br>
                Heure demandée: {{ $reservation_time }}<br>
                Numéro de réservation: #{{ $reservation_id }}
            </div>
            
            <p>L'artisan n'a pas pu accepter votre réservation pour cette date. Nous vous invitons à consulter d'autres artisans ou à proposer une autre date.</p>
            
            <a href="{{ config('app.url') }}/artisans" class="button">Voir d'autres artisans</a>
        </div>
        
        <div class="footer">
            <p>© {{ now()->year }} ArtisanPro. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
        </div>
    </div>
</body>
</html>
