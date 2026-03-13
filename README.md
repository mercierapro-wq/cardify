# Cardify

Application de gestion de cartes de vœux collaboratives avec authentification Firebase et backend N8N.

## Fonctionnalités

- Authentification utilisateur (Firebase + N8N backend)
- Gestion de cartes collaboratives
- Messagerie entre participants
- Gestion automatique des sessions expirées

## Gestion des erreurs 401

L'application implémente une gestion globale des erreurs HTTP 401 (Unauthorized) :

### Comportement
- **Détection automatique** : Toutes les requêtes API sont interceptées
- **Déconnexion automatique** : L'utilisateur est déconnecté dès qu'une erreur 401 est détectée
- **Nettoyage des données** : Le localStorage est vidé automatiquement
- **Redirection** : L'utilisateur est redirigé vers la page de connexion
- **Notification** : Un message informe l'utilisateur que sa session a expiré

### Protection contre les boucles infinies
- Flag global `isLoggingOut` pour éviter les déconnexions multiples simultanées
- Les endpoints de login/register sont exclus de l'interception 401
- Timeout de sécurité après redirection

### Utilisation dans le code

Pour les appels API normaux (avec gestion 401) :
```typescript
import { apiCall, API_ENDPOINTS } from '../config/api';

const response = await apiCall(API_ENDPOINTS.GET_CARDS, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

Pour les endpoints de connexion/inscription (sans gestion 401) :
```typescript
import { apiCallNoAuth, API_ENDPOINTS } from '../config/api';

const response = await apiCallNoAuth(API_ENDPOINTS.GET_USER, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id, password })
});
```

## Installation

```bash
npm install
npm run dev
```

## Variables d'environnement

Créer un fichier `.env` :
```
VITE_API_URL=https://your-n8n-backend.com
VITE_GOOGLE_OAUTH_URL=https://your-oauth-url.com
```
