# HelpDesk Pro

Prototype de gestion de tickets de support informatique, développé dans le cadre de l'ECF de la formation CDA (Concepteur Développeur d'Applications) — pour la société fictive **MicroSoft Solutions**.

---

## Sommaire

1. [Contexte](#contexte)
2. [Stack technique](#stack-technique)
3. [Architecture](#architecture)
4. [Modèle de données](#modèle-de-données)
5. [Règles métier](#règles-métier)
6. [Guide de navigation — fonctionnalités ECF](#guide-de-navigation--fonctionnalités-ecf)
7. [Tests unitaires](#tests-unitaires)
8. [Lancer le projet](#lancer-le-projet)
9. [Comptes de démonstration](#comptes-de-démonstration)
10. [Structure du projet](#structure-du-projet)
11. [Planning prévisionnel & bilan](#planning-prévisionnel--bilan)
12. [Note sur le style et les interfaces](#note-sur-le-style-et-les-interfaces)
13. [Wireframes](#wireframes)

---

## Contexte

MicroSoft Solutions est une PME lyonnaise de 45 salariés spécialisée dans la maintenance de parcs informatiques pour des TPE/PME de la région Auvergne-Rhône-Alpes. Jusqu'ici, le suivi des interventions se faisait par e-mail et tableur Excel partagé — résultat : tickets perdus, doublons, aucune visibilité sur les délais ni les priorités.

L'objectif de ce prototype est de remplacer ce fonctionnement par un outil centralisé, simple à prendre en main, avec deux niveaux d'accès :

- **Administrateur** — crée les tickets à la réception des demandes clients, affecte un technicien, suit l'avancement depuis un dashboard, peut supprimer un ticket.
- **Technicien** — consulte ses tickets, met à jour les statuts, documente ses interventions via les commentaires.

---

## Stack technique

| Couche           | Technologie         | Version | Pourquoi ce choix                                                                                                                   |
| ---------------- | ------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Frontend         | Next.js App Router  | 16.2    | SSR natif, Server Components pour charger les données sans exposer le token au navigateur, routing basé sur le système de fichiers. |
| UI               | React               | 19.2    | `useTransition` pour les mutations optimistes, composants serveur et client selon les besoins.                                      |
| Auth             | Auth.js (next-auth) | v5 beta | S'intègre nativement à Next.js, gère la session JWT côté serveur sans base de données dédiée.                                       |
| Backend          | NestJS              | 10      | Architecture modulaire avec décorateurs, guards, pipes de validation. TypeScript de bout en bout.                                   |
| ORM              | Prisma              | 7       | Schéma déclaratif, génération automatique des types, migrations simples. Très bon DX au quotidien.                                  |
| Base de données  | PostgreSQL          | 16      | Relationnel robuste, support natif des enums (statuts, priorités, catégories), transactions ACID.                                   |
| Conteneurisation | Docker Compose      | —       | Un seul `docker compose up --build` pour démarrer les trois services. Zéro friction pour un autre dev qui récupère le projet.       |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Docker Compose                         │
│                                                              │
│  ┌───────────────┐    HTTP / JWT    ┌───────────────┐        │
│  │  Next.js 16   │ ───────────────► │   NestJS 10   │        │
│  │  :3001        │   Bearer token   │   :3000       │        │
│  │               │                  │               │        │
│  │  App Router   │                  │  REST API     │        │
│  │  Auth.js v5   │                  │  Prisma 7     │        │
│  └───────────────┘                  └───────┬───────┘        │
│                                             │                 │
│                                    ┌────────▼────────┐       │
│                                    │   PostgreSQL 16  │       │
│                                    │   :5432          │       │
│                                    └─────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### Flux d'authentification

1. L'utilisateur soumet son email et mot de passe sur `/login`
2. Auth.js appelle `POST /auth/login` sur NestJS (Credentials provider)
3. NestJS vérifie le mot de passe avec bcrypt et retourne un JWT signé
4. Auth.js stocke ce JWT dans un cookie `httpOnly` signé — le navigateur ne voit jamais le token brut
5. Chaque Server Component appelle `auth()` pour récupérer la session et injecte le Bearer token dans les requêtes vers l'API

### Pourquoi des Server Components ?

Les pages de liste et de détail sont des Server Components : les données sont récupérées côté serveur, il n'y a pas de flash de chargement, et le JWT ne transite pas par le navigateur. Seuls les éléments interactifs (filtres, formulaires, menus déroulants) sont des Client Components.

---

## Modèle de données

Trois entités principales, reliées entre elles :

![Schéma relationnel — users, tickets, comments](docs/assets/modele-donnees.png)

**Relations clés :**

- Un ticket est créé par un utilisateur (`created_by_id`) et peut être affecté à un technicien (`assigned_to_id`, optionnel)
- Un commentaire appartient à un ticket (suppression en cascade) et est rédigé par un utilisateur
- Les statuts, priorités, catégories et rôles sont des enums PostgreSQL — pas de tables de référence parasites

---

## Règles métier

| #   | Règle                                                                | Où c'est implémenté                                                  |
| --- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| R1  | Authentification requise sur toutes les routes                       | Guard JWT NestJS + proxy Next.js                                     |
| R2  | À la création : statut forcé à OPEN, pas de technicien affecté       | `TicketsService.create()`                                            |
| R3  | Passage en IN_PROGRESS impossible sans technicien affecté            | `TicketsService.updateStatus()` + option désactivée côté UI          |
| R4  | Un ticket CLOSED ne peut plus être modifié                           | `updateStatus()`, `assign()` + formulaires masqués côté UI           |
| R5  | Un technicien ne peut modifier que les tickets qui lui sont affectés | Vérification `assignedToId === currentUser.id` dans `updateStatus()` |
| R6  | Ticket "en retard" = OPEN ou IN_PROGRESS depuis plus de 48h          | `DashboardService.getStats()`, badge dans la liste et le détail      |
| R7  | Les mots de passe sont hachés avec bcrypt (12 rounds)                | `AuthService.validateUser()`, `UsersService.create()`                |

---

## Guide de navigation — fonctionnalités ECF

Ce tableau liste les fonctionnalités attendues dans le sujet ECF et indique exactement où elles sont implémentées dans le code, côté API et côté frontend.

| Fonctionnalité                              | Fichiers API (NestJS)                                                                         | Fichiers Frontend (Next.js)                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Authentification** (login, JWT, session)  | `apps/api/src/auth/auth.service.ts` `apps/api/src/auth/auth.controller.ts` `apps/api/src/auth/jwt.strategy.ts` | `apps/web/src/app/login/page.tsx` `apps/web/src/lib/auth.ts` `apps/web/src/app/api/auth/[...nextauth]/route.ts`           |
| **Protection des routes** (guards)          | `apps/api/src/auth/jwt-auth.guard.ts` `apps/api/src/auth/roles.guard.ts`                      | `apps/web/src/app/(app)/layout.tsx` `apps/web/src/proxy.ts`                                                               |
| **CRUD tickets** (créer, lire, modifier, supprimer) | `apps/api/src/tickets/tickets.service.ts` `apps/api/src/tickets/tickets.controller.ts` `apps/api/src/tickets/dto/` | `apps/web/src/app/(app)/tickets/page.tsx` `apps/web/src/app/(app)/tickets/[id]/page.tsx` `apps/web/src/components/organisms/TicketsClient.tsx` `apps/web/src/components/organisms/TicketDetailClient.tsx` |
| **Règles métier sur les statuts** (R2, R3, R4, R5) | `apps/api/src/tickets/tickets.service.ts` (méthodes `create`, `updateStatus`, `assign`) | `apps/web/src/components/organisms/TicketDetailClient.tsx` (options désactivées selon état) |
| **Affectation d'un technicien**             | `apps/api/src/tickets/tickets.service.ts` (méthode `assign`) `apps/api/src/users/users.service.ts` (méthode `findTechnicians`) | `apps/web/src/components/organisms/TicketDetailClient.tsx` (panneau latéral)              |
| **Commentaires**                            | `apps/api/src/comments/comments.service.ts` `apps/api/src/comments/comments.controller.ts`   | `apps/web/src/components/organisms/TicketDetailClient.tsx` (section timeline)                                             |
| **Dashboard admin** (KPIs, graphiques, retards) | `apps/api/src/dashboard/dashboard.service.ts` `apps/api/src/dashboard/dashboard.controller.ts` | `apps/web/src/app/(app)/dashboard/page.tsx` `apps/web/src/components/organisms/DashboardClient.tsx`                       |
| **Gestion des rôles** (ADMIN / TECHNICIEN) | `apps/api/src/auth/roles.decorator.ts` `apps/api/src/auth/roles.guard.ts`                    | `apps/web/src/app/(app)/dashboard/page.tsx` (redirect si non-admin)                                                       |
| **Schéma base de données**                  | `apps/api/prisma/schema.prisma`                                                               | —                                                                                                                         |
| **Données de démonstration** (seed)         | `apps/api/src/database/seed.ts`                                                               | —                                                                                                                         |

---

## Tests unitaires

Les tests couvrent les règles métier critiques du service tickets. Pas besoin de base de données : `PrismaService` est remplacé par un mock Jest, ce qui permet de lancer les tests en isolation complète.

**Fichier :** `apps/api/src/tickets/tickets.service.spec.ts`

| Test                   | Ce qu'il vérifie                                                             |
| ---------------------- | ---------------------------------------------------------------------------- |
| R2 — statut à la création | `TicketsService.create()` force toujours `status: OPEN`, quoi qu'on passe en paramètre |
| R3 — IN_PROGRESS sans technicien | `updateStatus()` lève une `BadRequestException` si aucun technicien n'est affecté |
| R4 — ticket CLOSED immuable | `updateStatus()` lève une `ForbiddenException` si le ticket est déjà fermé |

**Lancer les tests :**

```bash
cd apps/api
npm test
```

Résultat attendu : **3 tests passés, 0 échec**.

Les tests sont également exécutés automatiquement par la CI GitHub Actions à chaque push ou pull request vers la branche `DEV` (voir `.github/workflows/ci.yml`).

---

## Lancer le projet

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### Installation

```bash
git clone https://github.com/2iAcademy/Jeevons_CDA25_HelpDeskPro.git
cd Jeevons_CDA25_HelpDeskPro

cp .env.example .env
# Ouvrir .env et renseigner au minimum AUTH_SECRET (n'importe quelle chaîne aléatoire)

docker compose up --build
```

L'application est accessible sur **http://localhost:3001**.

Au premier démarrage, le script `entrypoint.sh` se charge automatiquement de :

1. Synchroniser le schéma Prisma avec la base (`prisma db push`)
2. Injecter les données de démonstration — utilisateurs, tickets et commentaires (idempotent : ignoré si des données existent déjà)
3. Démarrer l'API NestJS

Pas besoin de lancer de commande de seed manuellement.

### Variables d'environnement

Toutes les variables sont documentées dans `.env.example` à la racine du projet.

| Variable         | Description                                  | Exemple                                         |
| ---------------- | -------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`   | URL de connexion PostgreSQL                  | `postgresql://user:pass@postgres:5432/helpdesk` |
| `JWT_SECRET`     | Clé de signature des tokens JWT              | Chaîne aléatoire longue                         |
| `JWT_EXPIRES_IN` | Durée de validité du JWT                     | `7d`                                            |
| `CORS_ORIGIN`    | Origine autorisée pour CORS                  | `http://localhost:3001`                         |
| `AUTH_SECRET`    | Secret Auth.js pour les cookies de session   | Chaîne aléatoire longue                         |
| `API_URL`        | URL interne Next.js → NestJS (réseau Docker) | `http://api:3000`                               |
| `NEXTAUTH_URL`   | URL publique du frontend                     | `http://localhost:3001`                         |

---

## Comptes de démonstration

Mot de passe commun : **`demo-helpdesk-2026`**

| Nom            | Email                                 | Rôle            |
| -------------- | ------------------------------------- | --------------- |
| Marie Garnier  | marie.garnier@microsoft-solutions.fr  | Administratrice |
| Thomas Lefèvre | thomas.lefevre@microsoft-solutions.fr | Administrateur  |
| Sophie Bonnet  | sophie.bonnet@microsoft-solutions.fr  | Technicienne    |
| Karim Belkacem | karim.belkacem@microsoft-solutions.fr | Technicien      |
| Léa Moreau     | lea.moreau@microsoft-solutions.fr     | Technicienne    |

---

## Structure du projet

```
Jeevons_CDA25_HelpDeskPro/
├── apps/
│   ├── api/                            # Backend NestJS
│   │   ├── prisma/
│   │   │   └── schema.prisma           # Schéma base de données (entités + enums)
│   │   ├── src/
│   │   │   ├── auth/                   # Login, JWT, guards, décorateurs
│   │   │   ├── tickets/                # CRUD tickets + toutes les règles métier
│   │   │   ├── comments/               # Ajout / suppression de commentaires
│   │   │   ├── dashboard/              # Calcul des statistiques admin
│   │   │   ├── users/                  # Lecture des utilisateurs et techniciens
│   │   │   ├── prisma/                 # Service Prisma avec adapter pg (Prisma 7)
│   │   │   └── database/               # Seed de données de démonstration
│   │   ├── prisma.config.ts            # Config Prisma 7 (URL de connexion)
│   │   ├── entrypoint.sh               # db push + seed + démarrage API
│   │   └── Dockerfile
│   │
│   └── web/                            # Frontend Next.js
│       └── src/
│           ├── app/
│           │   ├── (app)/              # Groupe de routes protégées (layout partagé)
│           │   │   ├── tickets/        # Liste + détail tickets
│           │   │   └── dashboard/      # Dashboard admin
│           │   ├── api/                # Routes API Next.js → relais vers NestJS
│           │   ├── login/              # Page de connexion
│           │   └── globals.css         # Design tokens oklch + toutes les classes CSS
│           ├── components/
│           │   ├── atoms/              # StatusBadge, PriorityBadge, Select
│           │   ├── molecules/
│           │   ├── organisms/          # Sidebar, LoginForm, TicketsClient, …
│           │   └── templates/
│           ├── lib/
│           │   ├── auth.ts             # Config Auth.js v5
│           │   └── api.ts              # Client HTTP avec injection automatique du JWT
│           └── types/                  # Types TypeScript partagés front/back
│
├── docs/
│   └── assets/                       # Schéma BDD, wireframes, planning (README)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Planning prévisionnel & bilan

### Planning prévisionnel

| Tâche                                                   | Durée estimée |
| ------------------------------------------------------- | ------------- |
| Mise en place de l'environnement (Docker, monorepo, CI) | 1 h           |
| Schéma base de données + seed                           | 30 min        |
| Authentification API (NestJS JWT)                       | 45 min        |
| Page de connexion (Next.js + Auth.js)                   | 45 min        |
| CRUD tickets API (service + controller + DTOs)          | 1 h 30        |
| Dashboard API                                           | 30 min        |
| App shell (sidebar, layout)                             | 30 min        |
| Page liste tickets (tableau, filtres, modal)            | 1 h           |
| Page détail ticket (timeline, panneau latéral)          | 1 h 30        |
| Page dashboard (KPIs, graphiques)                       | 45 min        |
| README + documentation                                  | 30 min        |
| **Total estimé**                                        | **~9 h**      |

### Bilan

| Tâche                            | Durée réelle | Écart    | Commentaire                                                                                                                                            |
| -------------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mise en place de l'environnement | 1 h 30       | +30 min  | Incompatibilités Prisma 7 non documentées : l'URL de connexion ne se met plus dans `schema.prisma`, et l'adapter pg est obligatoire à l'instanciation. |
| Schéma base de données + seed    | 15 min       | -15 min  | Seed déplacé dans `src/database/` pour que `nest build` le compile. Données de démo générées avec l'IA.                                                |
| Authentification API             | 45 min       | =        | —                                                                                                                                                      |
| Page de connexion                | 30 min       | -15 min  | Quelques ajustements Next.js 16 (`proxy.ts`, `AUTH_SECRET`) mais le design était déjà généré.                                                          |
| CRUD tickets API                 | 1 h 30       | =        | —                                                                                                                                                      |
| Dashboard API                    | 30 min       | =        | —                                                                                                                                                      |
| App shell                        | 10 min       | -20 min  | Petite correction sur les icônes SVG, mais le design allait vite grâce à la génération IA.                                                             |
| Page liste tickets               | 20 min       | -40 min  | Problème 403 sur `/users` pour les techniciens → ajout de `/users/technicians`. Style généré.                                                          |
| Page détail ticket               | 15 min       | -45 min  | Implémentation du CRUD côté front (fetch, state), style pris en charge par l'IA.                                                                       |
| Page dashboard                   | 5 min        | -40 min  | Uniquement du câblage de données, pas de logique métier. Style généré.                                                                                 |
| README                           | 30 min       | =        | —                                                                                                                                                      |
| **Total réel**                   | **~6 h**     | **-3 h** | Gain principalement sur le front grâce à la génération d'interfaces par IA (voir section dédiée ci-dessous).                                           |

### Planning visuel

Comparaison estimé / réel par tâche (bleu = prévisionnel, vert = dans les temps, rouge = dépassement) :

![Planning visuel — estimé vs réel](docs/assets/planning-visuel.png)

### Points techniques rencontrés

**Prisma 7** — Changement de paradigme par rapport aux versions précédentes : l'URL de connexion se déclare désormais dans un fichier `prisma.config.ts` séparé, et l'adaptateur `@prisma/adapter-pg` est requis pour instancier le client en runtime. Pas documenté clairement dans les guides de migration, ça m'a pris du temps à débloquer.

**Next.js 16** — `middleware.ts` est renommé en `proxy.ts`, l'export par défaut devient `proxy`. Auth.js v5 de son côté impose `trustHost: true` et `AUTH_SECRET` (au lieu de `NEXTAUTH_SECRET`). Rien de bloquant une fois qu'on sait où chercher.

**Server Components + JWT** — Charger les données côté serveur simplifie vraiment la gestion de l'authentification : le token ne transite jamais par le navigateur, uniquement entre les deux conteneurs sur le réseau Docker interne.

---

## Note sur le style et les interfaces

Le `globals.css` (design tokens, classes utilitaires, composants visuels), certains composants React et les patterns d'organisation (Atomic Design, nommage des classes CSS) viennent d'un de mes side projects personnels. J'ai réutilisé ce système de design à l'identique — mêmes tokens oklch, mêmes classes, mêmes structures — et je l'ai transmis à Claude Design pour qu'il génère l'ensemble des interfaces en le respectant scrupuleusement.

Mon travail s'est concentré sur :

- l'infrastructure Docker et la configuration de l'environnement
- le backend NestJS dans son intégralité (modules, règles métier, authentification, guards, DTOs, validation)
- le câblage front ↔ back (Server Components, client `apiFetch`, gestion de session Auth.js, routes API relais)

Le prompt que j'ai utilisé pour la génération des interfaces :

```
Voici dans ces fichiers tous le styles, les règles, classes, et design patterns d'une de
mes applications. Je veux que tu t'en serve et les respecte scrupuleusement pour réaliser
l'interface du projet actuel dans lequel tu te trouve. Sert toi aussi du wirefrime que j'ai fais en pièces jointes. Ceci implique que tu comprenne correctement le backend que j'ai fais pour éviter des écarts dans les
implémentations. Soit précis, colle toi bien à ce que je te donne. Prends bien
connaissance du projet, n'hésite pas à me poser des questions. Fais au plus simple
possible (K.I.S.S; single responsibility; Atomic Design). Ne réinvente pas la roue, ne
cherche pas à modifier mon backend. Si tu remarques une erreur d'implémentation fais m'en
part et je m'en chargerai.
```

---

## Wireframes

Maquettes basse fidélité des deux écrans principaux de l'application (dashboard administrateur et liste des tickets), réalisées en amont du développement pour cadrer la navigation et la disposition des blocs.

![Wireframes — Dashboard et liste des tickets](docs/assets/wireframes.png)
