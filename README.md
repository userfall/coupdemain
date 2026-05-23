# CoupDeMain

CoupDeMain est une mini-place de marche solidaire locale. On peut y creer un compte, se connecter, publier une annonce avec image, puis retrouver ses publications dans un espace membre.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite locale via `node:sqlite`

## Parcours fonctionnels

- `/connexion` : connexion reelle
- `/inscription` : creation de compte reelle
- `/deposer` : publication avec image
- `/annonces` : catalogue public filtre
- `/annonces/[slug]` : detail d'annonce
- `/mon-espace` : annonces du membre connecte
- `/tableau-de-bord` : vue produit / plateforme

## Lancer le projet

```bash
npm run dev
```

Application disponible ensuite sur `http://localhost:3000`.

## Base locale

- La base est creee automatiquement au premier chargement d'une page ou au premier appel API.
- Fichier SQLite : `data/coupdemain.sqlite`
- Images uploadees : `public/uploads/` en local, ou `APP_STORAGE_ROOT/media/` si un hebergeur utilise un disque persistant.

## Compte de demo

- Email : `lea@coupdemain.local`
- Mot de passe : `demo1234`

## Verifications

```bash
npm run lint
npm run build
```

## Mise en ligne

Cette app utilise :

- SQLite locale
- des uploads d'images ecrits sur disque

Du coup, un hebergement serverless classique comme Vercel n'est pas adapte pour une version publique persistante. Pour un vrai lien partageable, le chemin le plus simple est un hebergeur avec disque persistant, par exemple Render.

Configuration conseillee pour Render :

- Build command : `npm install && npm run build`
- Start command : `npm run start -- --hostname 0.0.0.0 --port $PORT`
- Variable d'environnement : `APP_STORAGE_ROOT=/opt/render/project/src/storage`
- Persistent disk : monter le disque sur `/opt/render/project/src/storage`

Une fois deployee, les nouvelles images seront servies depuis `/media/...` et la base SQLite sera stockee dans le disque persistant.

## Suite logique

1. Ajouter une vraie messagerie entre membres.
2. Ajouter la moderation et le signalement d'annonce.
3. Permettre l'edition et la fermeture d'une annonce.
4. Migrer vers un backend distant si tu veux une mise en ligne publique.
