# 🗺️ Mapbox Setup Guide

To enable the mapping functionality, you need to set up a Mapbox account and API token.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Mapbox Token
1. **Sign up** at https://www.mapbox.com/ (free tier available)
2. **Go to** your account dashboard
3. **Copy your default public token** (starts with `pk.`)

### Step 2: Add to Environment
```bash
# Add to your .env.local file in apps/web/
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-actual-token-here" >> apps/web/.env.local
```

### Step 3: Restart Development Server
```bash
# Restart your Next.js dev server
npm run dev
```

## 🎯 What You Get

Once configured, the map will show:
- ✅ **Interactive map** of Australia
- ✅ **Tenement clustering** when zoomed out
- ✅ **Individual tenements** when zoomed in
- ✅ **Color-coded status** (live=green, pending=yellow, expired=red)
- ✅ **Click for details** with popup info panels
- ✅ **Filtering** by jurisdiction, status, type, holder
- ✅ **Search functionality** across all tenements
- ✅ **Shareable URLs** with current view state
- ✅ **"View on Map"** from tenements list

## 🆓 Free Tier Limits

Mapbox free tier includes:
- **50,000 map loads** per month
- **Unlimited** API requests for geocoding/routing
- **No credit card** required for basic usage

## 🔧 Alternative: Use Demo Mode

If you don't want to set up Mapbox immediately, the map will show a placeholder message with instructions to configure the token.

## 📱 Features Ready

The mapping system is fully implemented with:
- **Responsive design** (desktop/tablet)
- **Performance optimization** for large datasets
- **Deep linking** from tenements list
- **Filter persistence** in URLs
- **Modern UI** matching your app design
- **Accessibility** features
