## Tests des webhooks (Kkiapay & Fedapay)

Instructions rapides pour tester localement les endpoints webhook et générer la signature HMAC-SHA256.

1) Mettez les secrets dans `.env` :

```
KKIAPAY_SECRET=your_kkiapay_secret_here
FEDAPAY_SECRET=your_fedapay_secret_here
```

2) Exemple curl (Linux/macOS) — Kkiapay :

```bash
payload='{"id":"tx_test_123","status":"success","amount":15000,"currency":"XOF","metadata":{"id_artisan":10}}'
secret='YOUR_KKIAPAY_SECRET'
sig=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$secret" -binary | xxd -p -c 256)
curl -X POST http://127.0.0.1:8000/webhook/kkiapay \
  -H "Content-Type: application/json" \
  -H "X-Kkiapay-Signature: ${sig}" \
  --data "$payload"
```

3) Exemple PowerShell (Windows) — Kkiapay :

```powershell
$payload='{"id":"tx_test_123","status":"success","amount":15000,"currency":"XOF","metadata":{"id_artisan":10}}'
$secret='YOUR_KKIAPAY_SECRET'
$hmac = [System.BitConverter]::ToString((New-Object System.Security.Cryptography.HMACSHA256 ([System.Text.Encoding]::UTF8.GetBytes($secret))).ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))).Replace('-','').ToLower()
curl -X POST http://127.0.0.1:8000/webhook/kkiapay -H "Content-Type: application/json" -H "X-Kkiapay-Signature: $hmac" --data $payload
```

4) Notes sur les encodages :
- Certains fournisseurs envoient la signature en hex (ex: `a1b2c3...`), d'autres en base64. Le service serveur vérifie les deux formats.
- Certains préfixent la signature avec `sha256=`. Le vérificateur ignore ce préfixe automatiquement.

5) Exemple pour Fedapay — même principe (adaptez le header si le fournisseur l'indique) :

```bash
payload='{"transaction_id":"fp_test_987","status":"PAID","amount":20000,"currency":"XOF","metadata":{"id_artisan":10}}'
secret='YOUR_FEDAPAY_SECRET'
sig=$(printf '%s' "$payload" | openssl dgst -sha256 -hmac "$secret" -binary | xxd -p -c 256)
curl -X POST http://127.0.0.1:8000/webhook/fedapay \
  -H "Content-Type: application/json" \
  -H "X-Fedapay-Signature: ${sig}" \
  --data "$payload"
```

6) Vérification rapide après envoi :
- Contrôlez la table `transactions` dans la base de données.
- Vérifiez les logs (`storage/logs/laravel.log`) pour messages de traitement.

Si vous avez des exemples réels de payloads de Kkiapay ou Fedapay, copiez-les ici et je les intègre dans les tests.
