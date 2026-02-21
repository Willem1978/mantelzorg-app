#!/bin/bash
# Setup script voor Vercel deployment van mantelzorg-app
# Voer uit met: bash scripts/setup-vercel.sh

echo "🔧 Mantelzorg-app Vercel Setup"
echo "=============================="

# Check of vercel CLI geinstalleerd is
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI installeren..."
    npm install -g vercel
fi

# Login bij Vercel
echo ""
echo "📋 Stap 1: Inloggen bij Vercel..."
vercel login

# Link project
echo ""
echo "📋 Stap 2: Project koppelen aan Vercel..."
vercel link

# Environment variables instellen
echo ""
echo "📋 Stap 3: Environment variables instellen..."
echo ""
echo "Je hebt de volgende gegevens nodig:"
echo "  - DATABASE_URL (Supabase/PostgreSQL connection string)"
echo "  - AUTH_SECRET (genereer met: openssl rand -base64 32)"
echo "  - Je Vercel domein"
echo ""

read -sp "DATABASE_URL (PostgreSQL connection string): " DB_URL
echo ""
vercel env add DATABASE_URL production <<< "$DB_URL"
echo "  ✅ DATABASE_URL"

vercel env add DIRECT_URL production <<< "$DB_URL"
echo "  ✅ DIRECT_URL"

read -sp "AUTH_SECRET (geheime sleutel): " AUTH_SECRET
echo ""
vercel env add AUTH_SECRET production <<< "$AUTH_SECRET"
echo "  ✅ AUTH_SECRET"

echo ""
read -p "Wat is je Vercel domein? (bijv. mantelzorg-app.vercel.app): " DOMAIN
vercel env add NEXTAUTH_URL production <<< "https://$DOMAIN"
echo "  ✅ NEXTAUTH_URL"

# Deploy
echo ""
echo "📋 Stap 4: Deployen..."
vercel --prod

echo ""
echo "🎉 Klaar! Je app is nu live op Vercel."
