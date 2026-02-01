# Cupi App

Cupidon est une application de rencontres moderne et interactive conçue pour connecter les âmes sœurs grâce à un algorithme de matchmaking par affinités, des appels vidéo en temps réel et un chat fluide.

![Cupi App](/public/logo.png) (Logo à ajouter)

## ✨ Fonctionnalités Principales

- **Matchmaking Intelligent** : Un algorithme basé sur les préférences et la géolocalisation pour trouver des profils compatibles.
- **Chat en Temps Réel** : Messagerie instantanée pour échanger avec vos matchs sans délai.
- **Appels Vidéo (WebRTC)** : Faites connaissance en face à face virtuel grâce à la fonctionnalité d'appel vidéo intégrée, sans quitter l'application.
- **Profils Riches** : Créez un profil détaillé avec photos, bio, âge et genre.
- **Interface Premium** : Un design soigné, réactif et animé pour une expérience utilisateur agréable.
- **Système de "J'aime"** : Likez les profils qui vous intéressent pour déclencher un match.

## 🛠 Technologies Utilisées

Ce projet utilise une stack technique moderne et performante :

- **Frontend** : [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styles** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Données** : [MongoDB](https://www.mongodb.com/) (avec Mongoose)
- **Temps Réel** : Polling / WebSocket (Socket.io - *en cours d'intégration*)
- **Vidéo** : WebRTC (Native API)

## 🚀 Installation et Démarrage

Suivez ces étapes pour lancer le projet localement :

### Prérequis

- Node.js (v18 ou supérieur recommandé)
- npm ou yarn
- Une instance MongoDB (locale ou Atlas)

### Étapes

1.  **Cloner le dépôt**
    ```bash
    git clone https://github.com/votre-user/cupidon-app.git
    cd cupidon-app
    ```

2.  **Installer les dépendances**
    ```bash
    npm install
    ```

3.  **Configurer les variables d'environnement**
    Créez un fichier `.env.local` à la racine du projet et ajoutez votre chaîne de connexion MongoDB :
    ```env
    MONGODB_URI=mongodb://localhost:27017/cupidon
    # Ajoutez d'autres clés si nécessaire (NEXTAUTH_SECRET, etc.)
    ```

4.  **Lancer le serveur de développement**
    ```bash
    npm run dev
    ```

5.  **Accéder à l'application**
    Ouvrez votre navigateur et allez sur `http://localhost:3000`.

## 📁 Structure du Projet

```
cupidon-app/
├── src/
│   ├── app/              # Routes Next.js (App Router)
│   │   ├── api/          # Endpoints API (Backend)
│   │   ├── chat/         # Page de messagerie
│   │   ├── match/        # Page de match
│   │   └── ...
│   ├── components/       # Composants React réutilisables (Navbar, VideoCall, etc.)
│   ├── lib/              # Utilitaires (connexion DB, auth)
│   └── models/           # Schémas Mongoose (User, Message, Match)
├── public/               # Assets statiques
└── ...
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request pour suggérer des améliorations.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
