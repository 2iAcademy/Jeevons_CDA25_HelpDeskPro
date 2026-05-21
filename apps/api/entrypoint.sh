#!/bin/sh
set -e

echo "Synchronisation du schéma Prisma..."
npx prisma db push

echo "Chargement des données de test..."
node dist/database/seed.js

echo "Démarrage de l'API..."
exec node dist/main.js
