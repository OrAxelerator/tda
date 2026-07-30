## 1. Philosophie

> Le client n'est jamais une source de vérité.

Le navigateur affiche les informations.

Le serveur (Cloud Functions) décide.

## 2. Les responsabilités

Je voudrais vraiment séparer les couches.
```
React
↓
Interface
↓
Game Engine (règles)
↓
Firebase
```

Autrement dit :

- React ne connaît presque pas les règles.
- Firebase ne connaît pas React.
- Le moteur du jeu est indépendant.

## 3. Les environnements

TDA
├── Firebase Dev
│   ├── Auth
│   ├── Firestore
│   └── Hosting
│
└── Firebase Prod
    ├── Auth
    ├── Firestore
    └── Hosting

coté projet :
- .env.development
- .env.production

> firebase use dev / firebase use prod
C'est une fonctionnalité officielle du CLI Firebase, donc autant en profiter.
voir 3eme env -> test

## Première version de l'architecture

Le modèle de données : comment représenter une carte, un joueur, une room et une partie en TypeScript.
Le Game Engine : une bibliothèque indépendante qui contient toutes les règles du jeu.
Le schéma Firestore : quelles collections existent, quels documents elles contiennent et quelles informations sont stockées.
Les permissions Firebase : qui peut lire, créer ou modifier chaque document.
Le cycle de vie d'une room : création → attente → partie → fin → retour au lobby.

## Game engine
Le Game Engine est le cœur du jeu. Il contient toutes les règles métier de la Tour de l'As, indépendamment de l'interface ou de Firebase. Son rôle est de déterminer si une action est autorisée et de calculer le nouvel état de la partie. Par exemple, il vérifie qu'un joueur joue au bon moment, que les cartes posées sont valides, gère la pioche, la volée, les variantes, la super tour et toutes les autres mécaniques du jeu.

Le navigateur (React) n'est jamais autorisé à modifier directement l'état d'une partie. Lorsqu'un joueur effectue une action (jouer une carte, rejoindre une partie, prendre la pile, etc.), une Cloud Function Firebase récupère l'état actuel de la partie dans Firestore, appelle le Game Engine pour valider et appliquer cette action, puis enregistre le nouvel état si tout est correct. Les autres joueurs reçoivent automatiquement la mise à jour grâce à Firestore en temps réel. Cette architecture garantit que le serveur reste l'unique source de vérité et empêche un joueur de tricher en modifiant le code exécuté dans son navigateur.

## Une dernière idée que j'aimerais proposer

Je pense qu'il serait intéressant de distinguer deux notions :

Room : le salon où les joueurs discutent, rejoignent, choisissent les variantes et attendent.
Game : la partie en elle-même.

Concrètement, la room existerait en permanence tant que le host ne la ferme. Une partie (Game) est créée au lancement, détruite à la fin, puis une nouvelle peut être recréée dans la même room lorsqu'on clique sur Rejouer.

Ça simplifie énormément la logique, évite de recréer des salons à chaque manche et permettra plus tard d'ajouter facilement un chat, un historique des parties ou même des spectateurs sans revoir toute l'architecture.