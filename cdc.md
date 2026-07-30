# Cahier des charges:

### Présentation du projet:

Jeu de carte inventé par moi et 4 autres amis
ici recodé en ligne acessible facilement depuis le navigateur, il suffit (*suffira) de se connecter avec google pour passer les sécurité de Firebase, le serveur ou seront stocké les parties jouée en temps réel en multijoueur

### Objectifs:

* joueur en direct avec entre 2 et 6 joueur
* partie en temps réel
* aucune installation
* interface responsive ?
* jeu agréable a jouer
* créer une vrai DA
* création de compte (en se connectant avec google)
* 


### Stack:

Front-end	React
Langage	TypeScript
Build	Vite
Base de données temps réel	Firebase Firestore
Authentification	Firebase Auth (anonyme ou Google)
Hébergement	Firebase Hosting
Style	CSS Modules ou Tailwind


### Regle du jeu:

Voir [regle.md](./regle.md)


### Fonctionnalité:

* Avant la partie:
  - créer une room (privée ou publique)
  - rejoindre une room (privée ou publique)
  - avoir un compte personalisable (pseudo)
* Pendant la partie:
  - afficher carte perso et carte joueur et tour (tas)
* Apres la partie:
  - relancer une game (rejouer)
  - quitter


### Ecrans:

- acceuil
- parametres
- join/create game
- game
- profil joueur (perso ou autre)
- salle d'attente/la ou on peut rejouer)


### regles metiers:
  - impossible de jouer quand hors tour (sauf vollé)
  - impossible de jouer carte inférieur (sauf 2 sur jocker)
  - impossible de jouer plusieur carte différente (en terme numérique)
  - impossible de jojindre une partie commencez
  - si jouer quitte, suprime de la partie et s'est carte son "suprimer"
  - si tout les jouers de la parties quitte, la game s'arretes.









