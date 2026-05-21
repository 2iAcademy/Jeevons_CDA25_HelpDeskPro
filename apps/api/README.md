# node-api

Starter API NestJS 10 + TypeORM + Postgres 16. TypeScript strict, migrations, healthcheck, Docker prêt à l'emploi.

## Quickstart

```bash
cp .env.example .env
docker compose up -d --build
```

L'API écoute sur http://localhost:3000. Vérifie avec :

```bash
curl http://localhost:3000/health
```

Les migrations tournent automatiquement au démarrage (`migrationsRun: true`).

## Scripts npm

- `npm run dev` — démarre en watch mode
- `npm run build` — compile vers `dist/`
- `npm run start:prod` — lance le build compilé
- `npm test` — tests unitaires (Jest)
- `npm run test:e2e` — tests e2e
- `npm run lint` — ESLint avec autofix
- `npm run format` — Prettier
- `npm run migration:generate -- src/database/migrations/NomMigration` — génère une migration depuis le diff entités/DB
- `npm run migration:run` — applique les migrations en attente
- `npm run migration:revert` — annule la dernière

## Ajouter une migration

1. Modifie ou ajoute une entité dans `src/**/entities/`.
2. Assure-toi que la DB est up (`docker compose up -d postgres`) et que `.env` pointe sur `localhost`.
3. Génère : `npm run migration:generate -- src/database/migrations/AddSomething`.
4. Relis le SQL produit, commit, puis `npm run migration:run` (ou laisse le boot le faire).

Note : `synchronize` est **désactivé**. Les schémas ne bougent qu'avec une migration explicite.

## Structure du projet

```
src/
  config/              validation des env vars (Joi)
  database/            data-source TypeORM + migrations
  health/              endpoint /health (Terminus, ping DB)
  users/               exemple de ressource (CRUD + DTO + entity)
  app.module.ts
  main.ts
test/                  tests e2e
```

## Variables d'environnement

Voir `.env.example`. Toutes sont validées au boot — l'app refuse de démarrer si une var requise manque.

| Var | Description |
|---|---|
| `NODE_ENV` | `development` / `production` / `test` |
| `PORT` | port HTTP (défaut 3000) |
| `DB_HOST` | hôte Postgres |
| `DB_PORT` | port Postgres (défaut 5432) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | credentials DB |

## Hooks Git

Husky est configuré via `npm run prepare`. Au premier `npm install`, lance :

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
```

(Ou copie les fichiers depuis ce repo.)

## Tests

- Unitaire : `src/users/users.service.spec.ts`
- E2E : `test/health.e2e-spec.ts`
