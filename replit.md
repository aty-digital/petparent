# PetParent

## Overview

PetParent (AI Vet Assistant & Pet Health Log) is a pet health management mobile application built with Expo (React Native). It allows pet parents to track their pets' health through medical records, daily wellness logging, health task scheduling, and an AI-powered symptom triage system. The app uses a dark green-themed UI with a focus on pet wellness tracking and veterinary guidance.

Key features:
- **Onboarding Flow**: Multi-step guided onboarding with sign-up/login, role selection (Pet Parent/Sitter/Vet), pet count picker, and multi-pet profile creation loop. Sitters get a follow-up step asking if they're also a Pet Parent (dual-role support). Gates main app until completed.
- **Pet Profiles**: Add/edit multiple pets with breed, species, weight, vet info
- **Medical Records**: Track vet visits, vaccinations, and medications with optional medication reminders. Medications support a "No Longer Taking" status (with stopped date) that is mutually exclusive with "Currently Taking" — discontinued meds show a "Stopped" badge in records and are excluded from Active Medications on the dashboard.
- **Daily Wellness Tracker**: Log daily metrics (water, food, energy, mood, bathroom, sleep) on a 1-5 scale
- **Health Tasks**: Schedule medication, vaccination, supplement, and checkup tasks
- **AI Symptom Triage**: Submit symptoms and get AI-powered urgency assessment via OpenAI
- **Pet Profile/QR Code**: Share pet info, view vaccination compliance, get AI care tips
- **Pet Sitter Role**: Sitters see a dedicated home screen with shared pets. They can accept invite codes to access Pet Parent's pet profiles in read-only mode and add their own notes/updates. Sitters have AI Symptom Triage access (3 free sessions/month, paywall for more). Sitters have separate paywall pricing ($6.99/month, $69.99/year vs Pet Parent's $4.99/$49.99).
- **Dual-Role Support**: Sitters who are also Pet Parents can switch between "Pet Sitter" and "Pet Parent" views via the Settings page. In Pet Parent mode, they see the full Pet Parent experience with their own pets.
- **Pet Sharing**: Pet Parents can generate invite codes (valid 7 days) from the Profile tab to share pet profiles with sitters. Sitters enter codes via the accept-invite screen to add shared pets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, using expo-router for file-based routing
- **Navigation**: Tab-based layout with 4 tabs (Home, Records, Tracker, Profile) plus modal screens for forms (add-pet, add-record, add-task, triage, daily-tracker, edit-pet, settings)
- **State Management**: React Context (`PetProvider` in `lib/pet-context.tsx`) manages all pet-related state. No Redux or external state library.
- **Local Storage**: All pet data (pets, records, daily logs, tasks, triage results) persists via `@react-native-async-storage/async-storage` with keys scoped per user email (format: `@pawguard_user_{email}_{suffix}`). An accounts registry (`@pawguard_accounts_registry`) tracks all registered accounts. Active session stored in `@pawguard_active_session`. This is the primary data store for user content — not the PostgreSQL database.
- **Multi-Account Support**: Each user's data is fully isolated by email. Signup checks the accounts registry for duplicate emails. Login verifies credentials from the registry and loads user-scoped data. Logout clears in-memory state and session.
- **Subscription/Paywall**: `SubscriptionProvider` (in `lib/subscription-context.tsx`) manages RevenueCat integration, free/premium tier enforcement, triage usage tracking (3/month free), and pet count limits (1 pet free). Subscription data is also scoped per user email.
- **Styling**: Inline StyleSheet with a consistent dark theme defined in `constants/colors.ts`. Uses Inter font family loaded via `@expo-google-fonts/inter`.
- **API Communication**: `lib/query-client.ts` provides `apiRequest()` helper using `expo/fetch`. TanStack React Query is available but the app primarily uses direct API calls for triage and care tips.
- **Notifications**: `lib/notifications.ts` handles medication reminders via `expo-notifications` with scheduling support for various frequencies.

### Backend (Express)
- **Server**: Express 5 running in `server/index.ts`, serves on port 5000
- **Primary API Routes** (`server/routes.ts`):
  - `POST /api/triage` — AI symptom analysis using OpenAI (gpt-5.2 model). Takes pet info + symptoms, returns urgency assessment JSON.
  - `POST /api/care-tips` — AI-generated breed-specific care tips for the profile page.
- **CORS**: Dynamic CORS based on Replit domain environment variables, plus localhost support for dev.
- **Static Serving**: In production, serves Expo web build from `dist/` directory. In development, proxies to Metro bundler.

### Database (PostgreSQL + Drizzle)
- **ORM**: Drizzle ORM with PostgreSQL dialect, configured in `drizzle.config.ts`
- **Schema** (`shared/schema.ts`): Currently defines a `users` table (id, username, password) — this appears to be scaffolding and is not actively used by the app's core pet features
- **Chat Models** (`shared/models/chat.ts`): Defines `conversations` and `messages` tables for a chat integration feature
- **Storage Layer** (`server/storage.ts`): `MemStorage` class provides in-memory user storage (not using Drizzle for the main app data)
- **Important**: The main pet data does NOT use the database — it's all in AsyncStorage on the client. The database is primarily used by the Replit integration modules (chat storage).

### Replit Integration Modules (`server/replit_integrations/`)
Pre-built integration modules that provide:
- **Chat**: Conversation CRUD with message history, stored in PostgreSQL via Drizzle
- **Audio**: Voice recording, speech-to-text, text-to-speech via OpenAI
- **Image**: Image generation via OpenAI's gpt-image-1
- **Batch**: Generic batch processing utility with rate limiting and retries

### Build & Deploy
- **Dev**: Two processes — `expo:dev` for Metro bundler, `server:dev` for Express API
- **Production Build**: `scripts/build.js` handles Expo static web build, `server:build` bundles server with esbuild
- **Production Run**: `server:prod` serves the static build + API from a single Express server
- **Database Migrations**: `npm run db:push` uses drizzle-kit push

## External Dependencies

### APIs & Services
- **OpenAI API**: Used for symptom triage analysis and care tip generation. Accessed via Replit AI Integrations proxy (`AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` env vars). Models used: gpt-5.2 for triage, gpt-4o-mini for care tips.
- **PostgreSQL**: Required database, connection via `DATABASE_URL` environment variable. Used by Drizzle ORM for chat integration storage.

### Key NPM Packages
- **expo** (~54.0.27): Core mobile framework
- **expo-router** (~6.0.17): File-based routing
- **@tanstack/react-query** (^5.83.0): Server state management
- **drizzle-orm** (^0.39.3) + **drizzle-zod**: Database ORM with Zod schema validation
- **openai** (^6.21.0): OpenAI API client
- **express** (^5.0.1): Backend web server
- **react-native-qrcode-svg**: QR code generation for pet profiles
- **expo-notifications**: Local push notifications for medication reminders
- **expo-haptics**: Haptic feedback on interactions
- **expo-image-picker**: Pet photo selection
- **expo-location**: Location services (available but usage not prominent)
- **patch-package**: Applied via postinstall script for dependency patches

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY`: OpenAI API key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL`: OpenAI API base URL (via Replit AI Integrations)
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests from the client
- `REPLIT_DEV_DOMAIN`: Replit development domain (auto-set by Replit)
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`: RevenueCat iOS public API key for in-app purchases
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`: RevenueCat Android public API key (not yet configured)