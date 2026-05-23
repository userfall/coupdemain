import type { DashboardTask, FaqItem } from "@/lib/types";

export const journeySteps = [
  {
    title: "Creer un compte",
    description:
      "Un compte local te permet de garder tes annonces, ton email et ta ville au meme endroit.",
  },
  {
    title: "Publier avec une image",
    description:
      "Le formulaire enregistre le titre, la description, la photo et les infos de contact dans la base locale.",
  },
  {
    title: "Discuter et suivre",
    description:
      "L'espace membre liste les publications, les favoris, les messages et les notifications utiles.",
  },
  {
    title: "Faire evoluer la plateforme",
    description:
      "La structure est prete pour passer plus tard sur un backend distant si tu veux deployer pour de vrai.",
  },
];

export const trustSignals = [
  {
    title: "Compte identifiable",
    description:
      "Chaque annonce est rattachee a un membre connecte avec email, nom affiche et ville.",
  },
  {
    title: "Coordonnees protegees",
    description:
      "L'email et le telephone restent masques publiquement jusqu'au premier echange prive.",
  },
  {
    title: "Annonce plus claire",
    description:
      "Le support des images, tags, vues et statuts rend les publications plus lisibles et plus rassurantes.",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Est-ce que l'inscription fonctionne vraiment ?",
    answer:
      "Oui. Les comptes sont maintenant crees dans une base SQLite locale avec session active dans le navigateur.",
  },
  {
    question: "Peut-on publier avec une photo ?",
    answer:
      "Oui. L'image est enregistree dans le dossier public/uploads puis affichee dans le catalogue.",
  },
  {
    question: "La messagerie est-elle active ?",
    answer:
      "Oui. Deux membres peuvent echanger dans une conversation privee qui se rafraichit automatiquement.",
  },
  {
    question: "Pourquoi une base locale ?",
    answer:
      "Parce qu'elle permet de tester tout de suite le vrai parcours sans dependre d'un service externe.",
  },
];

export const dashboardTasks: DashboardTask[] = [
  {
    title: "Temps reel complet",
    priority: "Priorite haute",
    description:
      "Passer du rafraichissement automatique a du vrai websocket pour des messages instantanes.",
  },
  {
    title: "Moderation et signalement",
    priority: "Important",
    description:
      "Ajouter le signalement d'annonce et une vue admin pour garder le catalogue sain.",
  },
  {
    title: "Notifications plus fines",
    priority: "Produit",
    description:
      "Ajouter des alertes sur favoris, statut d'annonce et relances intelligentes pour reprendre un echange.",
  },
  {
    title: "Version mobile encore plus forte",
    priority: "Confort",
    description:
      "Ameliorer les micro-interactions, les apercus photo et le suivi d'annonce sur petit ecran.",
  },
];
