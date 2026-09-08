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

## Game engine
Le Game Engine est le cœur du jeu. Il contient toutes les règles métier de la Tour de l'As, indépendamment de l'interface ou de Firebase. Son rôle est de déterminer si une action est autorisée et de calculer le nouvel état de la partie. Par exemple, il vérifie qu'un joueur joue au bon moment, que les cartes posées sont valides, gère la pioche, la volée, les variantes, la super tour et toutes les autres mécaniques du jeu.

Le navigateur (React) n'est jamais autorisé à modifier directement l'état d'une partie. Lorsqu'un joueur effectue une action (jouer une carte, rejoindre une partie, prendre la pile, etc.), une Cloud Function Firebase récupère l'état actuel de la partie dans Firestore, appelle le Game Engine pour valider et appliquer cette action, puis enregistre le nouvel état si tout est correct. Les autres joueurs reçoivent automatiquement la mise à jour grâce à Firestore en temps réel. Cette architecture garantit que le serveur reste l'unique source de vérité et empêche un joueur de tricher en modifiant le code exécuté dans son navigateur.
