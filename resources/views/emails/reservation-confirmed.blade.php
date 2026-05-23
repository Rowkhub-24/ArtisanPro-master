<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réservation Confirmée</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .success-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #0c4a6e;
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
            <h1>✓ Réservation Confirmée</h1>
        </div>
        
        <div class="content">
            <p>Bonjour <strong>{{ $client_name }}</strong>,</p>
            
            <p>Nous vous confirmons que votre réservation avec <strong>{{ $artisan_name }}</strong> a été <strong style="color: #10b981;">confirmée</strong>.</p>
            
            <div class="success-badge">Statut: CONFIRMÉE</div>
            
            <div class="info-box">
                <strong>Détails de votre réservation:</strong><br>
                Artisan: {{ $artisan_name }}<br>
                Date: {{ $reservation_date }}<br>
                Heure: {{ $reservation_time }}<br>
                Numéro de réservation: #{{ $reservation_id }}
            </div>
            
            <p>L'artisan vous recontactera bientôt pour confirmer les détails finaux et répondre à vos questions.</p>
            
            <p>Merci d'avoir choisi ArtisanPro!</p>
        </div>
        
        <div class="footer">
            <p>© {{ now()->year }} ArtisanPro. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas répondre.</p>
        </div>
    </div>
</body>
</html>
