# Frontend docs


### App.tsx:

Avec ``<Router>`` selon url return un composant différents.

"/" : essaye d'aller sur la route "/user" et est protégé par ``<ProtectedRoute>``
"/login" : tout est dans le nom
"/registrer" : pareil

"/game/<roomCode>" : se connecte a une room, pour l'instant pas de système room privé/publique

"/home" : page home pour trouver/lancer game, se connecter, aller au parametres


### Game.tsx ou <Game />

Ne prends aucune donnée en entré, on s'y connect depuis Profile.tsx

#### useState de Game
- inputValue : utilisez pour recuprer input et fetch une certaine page du backend, **Debug, plus utile**
- playerHand : Stock les cartes du jouers, au début stock rien tant que la partie n'as pas commencé.
- selectedCards : Enregistre les cartes selectionnés par le joueur, envoyé dans ``<Card>`` pour l'affichage.
- "," : sert uniquement a refresh les donnés affiché des hooks, il suffit de faire : ``refresh((x) => x + 1)``.
- discardPileCard : enregistre les cartes dans la pile.
- seeDisCardPile : cache l'entièreté de la pile, il faudrait faire en sorte que affiche tout ou les 2 dernière
- user : truc compliqué avec firebase
- phase : le status de la partie : "wait" | "playing"
- ListUesr : la liste des joueurs connecté a la partie
- isHost : true : est le host de la partie, affiche plus de contenu comme les paramètres, exclure des gens ect ..








