# Architecture

## Modules

L'app suit le pattern Nest : chaque domaine est un module isolé qui exporte ce qu'il veut partager.

- `AppModule` — racine. Importe la config globale, TypeORM, et les modules métier.
- `ConfigModule` (global) — charge `.env` et valide les variables au boot.
- `HealthModule` — expose `/health` via `@nestjs/terminus`. Ping la DB.
- `UsersModule` — exemple CRUD. Entity + DTO + Service + Controller.

Ajouter un nouveau domaine : `nest g resource <name>` (ou copier la structure de `users/`).

## TypeORM : migrations vs synchronize

`synchronize: true` laisse TypeORM faire `ALTER TABLE` au boot d'après les entités. Pratique en démo, **dangereux en prod** : un rename de colonne devient un drop+create et perd les données.

Choix ici :
- `synchronize: false` partout.
- Migrations versionnées dans `src/database/migrations/`.
- `migrationsRun: true` au boot de l'app : ce qui est commit s'applique automatiquement au démarrage du container.
- Génération via `npm run migration:generate` (compare entités vs schéma DB).

La source de vérité du schéma, c'est le fichier de migration. Les entités décrivent ce que TypeScript voit.

## Validation de la config

`@nestjs/config` charge `.env`, puis on lui passe un `validationSchema` Joi (`src/config/config.validation.ts`). Si une var requise manque ou a un mauvais type, l'app **refuse de démarrer** avec un message explicite. C'est volontaire : mieux vaut crasher au boot qu'avoir un comportement bizarre en runtime.

`abortEarly: true` arrête à la première erreur — suffisant en pratique.

## Docker

Build multi-stage : `builder` installe tout, compile, prune les devDeps. `runner` ne contient que `node_modules` prod + `dist/`. User non-root (`app`). Image finale basée `node:22-alpine`.

`docker-compose` attend que Postgres soit `healthy` avant de lancer l'API (`pg_isready`), évitant les races au premier boot.
