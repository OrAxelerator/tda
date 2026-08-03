# Déploiement Render

Ce projet contient un frontend React/Vite et un mini backend Node de test.

## Erreur actuelle

Render affiche :

```text
Couldn't find a package.json file in "/opt/render/project/src"
Running 'yarn start'
```

Ça veut dire que Render lance la commande dans un dossier où il ne voit pas `package.json`.

Dans ce projet, le `package.json` est dans le dossier `test-card`. Si ton dépôt GitHub contient un dossier parent, configure Render avec :

```text
Root Directory: test-card
```

Si ton dépôt GitHub commence directement dans ce dossier, laisse `Root Directory` vide.

## Déployer le frontend React

Le frontend Vite doit être un **Static Site** Render, pas un Web Service.

Configuration Render :

```text
Type: Static Site
Root Directory: test-card
Build Command: npm ci && npm run build
Publish Directory: dist
```

Si Render utilise Yarn :

```text
Build Command: yarn install --frozen-lockfile && yarn build
Publish Directory: dist
```

Comme l'app utilise React Router (`/user`, `/game/:roomCode`), ajoute une rewrite :

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

Sans cette rewrite, une page comme `/game/ABC123` peut marcher en navigation interne mais faire 404 au refresh.

## Déployer le backend de test

Le backend minimal est dans `server.js`.

Endpoints :

```text
GET /
GET /api/health
```

Configuration Render :

```text
Type: Web Service
Root Directory: test-card
Runtime: Node
Build Command: npm ci
Start Command: npm start
```

Si Render utilise Yarn :

```text
Build Command: yarn install --frozen-lockfile
Start Command: yarn start
```

Render injecte automatiquement `PORT`. Le serveur lit donc :

```js
process.env.PORT || 10000
```

## Important

Un Static Site Render ne lance pas de backend Node. Pour avoir frontend + backend sur Render, crée deux services :

```text
1. test-card-front  -> Static Site
2. test-card-api    -> Web Service
```

Pour l'instant, Firebase Auth et Firestore fonctionnent côté navigateur. Le backend est seulement un point de test pour vérifier que Render lance bien un serveur Node.

## Liens utiles

- Render Static Site avec Vite : https://vite.dev/guide/static-deploy.html#render
- Render Root Directory : https://render.com/docs/your-first-deploy
- Render Node Web Service : https://render.com/docs/deploy-node-express-app

## À propos de `render.yaml`

J'ai ajouté un fichier `render.yaml` comme base de configuration.

Attention : Render détecte automatiquement `render.yaml` seulement s'il est à la racine du dépôt GitHub connecté.

Si ton dépôt GitHub est le dossier parent qui contient `test-card`, déplace `render.yaml` à la racine du dépôt et remplace les deux lignes :

```yaml
rootDir: .
```

par :

```yaml
rootDir: test-card
```

Si ton dépôt GitHub est directement ce dossier, garde :

```yaml
rootDir: .
```
