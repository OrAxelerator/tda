Le bug venait moins de l’index "0" lui-même que du fait que la main d’Axel n’était pas rendue par le bon composant et que l’état de sélection n’était pas appliqué comme attendu. Je t’explique clairement la cause réelle.

Le problème ne venait pas de “jouer[0]” comme valeur brute, mais de ce qui se passait autour.

La cause réelle était:

tu avais bien une main d’Axel dans le moteur
mais l’affichage de cette main ne passait pas par le bon rendu
le composant Card recevait une liste de cartes, mais son rendu n’était pas stable
donc même si la donnée existait, l’UI ne l’affichait pas comme tu t’y attendais
Autrement dit :

le bug n’était pas “l’index 0 est faux”
le bug était “la donnée existe, mais le rendu ne l’expose pas correctement”
En résumé :

la logique du jeu avait bien la main d’Axel
l’interface ne la rendait pas correctement
donc ça ressemblait à un bug de “jouer[0]”, alors que le vrai problème était l’affichage et la propagation de l’état
Si tu veux, je peux aussi te faire un mini schéma simple de la chaîne :

App → Card → sélection → affichage
pour que tu vois exactement où ça cassait.
		
