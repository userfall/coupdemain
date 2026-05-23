# CoupDeMain

CoupDeMain est une mini-place de marche solidaire locale. On peut y creer un compte, se connecter, publier une annonce avec image, puis retrouver ses publications dans un espace membre.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- SQLite locale via `node:sqlite` pour le dev
- Supabase Database + Storage pour une mise en ligne gratuite au maximum

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

## Mise en ligne gratuite au maximum

Le projet peut maintenant fonctionner de deux manieres :

- en local, avec SQLite + fichiers sur disque
- en ligne, avec Supabase pour la base et les images

### 1. Creer le projet Supabase

Dans Supabase :

- cree un nouveau projet
- ouvre le SQL Editor
- colle puis execute `supabase/schema.sql`
- ouvre Storage
- cree un bucket `media`
- rends ce bucket public

### 2. Recuperer les variables

Dans Supabase, recopie :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=media`

Le fichier d'exemple est [`.env.example`](</C:/Users/abdou/OneDrive/Dokumente/New project/coupdemain/.env.example>).

### 3. Deployer sur Vercel

Dans Vercel :

- importe le repo GitHub `userfall/coupdemain`
- garde le preset Next.js par defaut
- ajoute les variables d'environnement Supabase
- verifie que Node.js 22 est utilise
- lance le deploiement

Le lien public sera alors genere par Vercel, en general sous une forme proche de :

`https://coupdemain.vercel.app`

### Notes utiles

- le client serveur utilise une cle serveur Supabase pour les operations privees
- les images utilisateurs sont envoyees dans le bucket public `media`
- si les variables Supabase ne sont pas renseignees, le projet retombe automatiquement sur le mode local SQLite
- `render.yaml` reste disponible si tu veux plus tard une option avec disque persistant sans Supabase

## Suite logique

1. Ajouter une vraie messagerie entre membres.
2. Ajouter la moderation et le signalement d'annonce.
3. Permettre l'edition et la fermeture d'une annonce.
4. Brancher ensuite un vrai domaine si tu veux un lien plus propre.
