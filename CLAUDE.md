# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Uni Assignment is a university assignment management application with a React 19 + Vite frontend, Firebase backend (Auth + Firestore), and Telegram bot integration for deadline notifications.

## Development Commands

### Frontend (Root Directory)
- `npm run dev` - Start Vite dev server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Firebase Cloud Functions
- `cd functions && npm run build` - Compile TypeScript to `lib/`
- `cd functions && npm run build:watch` - Watch mode compilation
- `cd functions && npm run serve` - Run Firebase emulators locally
- `cd functions && npm run deploy` - Deploy to Firebase

## Architecture

### Frontend Structure

**Entry Point:** `App.tsx` uses `react-router-dom` (HashRouter) with protected routes.

**State Management:** `context.tsx` provides `AppContext` with:
- Firebase Auth state (email/password + Google OAuth)
- Real-time Firestore listeners for user's assignments and subjects
- Theme toggling (dark/light mode)
- CRUD operations for assignments, subjects, and user profile

**Key Files:**
- `firebase.ts` - Firebase client initialization with env var validation
- `types.ts` - TypeScript interfaces for Assignment, Subject, User, Priority, Status
- `api/telegram.ts` - Vercel serverless function for Telegram webhook
- `components/` - Reusable UI components (modals, sidebar, navigation)
- `pages/` - Route components (Dashboard, Assignments, Subjects, Calendar, Settings, Login, SignUp)

### Firestore Data Model

Collections use subcollections per user:
- `users/{uid}/assignments` - Assignments ordered by `dueDate`
- `users/{uid}/subjects` - Subjects ordered by `createdAt`
- `users/{uid}` - User profile document
- `telegramLinks/{uid}` - Links Telegram chatId to Firebase UID (for bot notifications)
- `telegramStates/{chatId}` - Bot conversation state machine (multi-step flows)

### Telegram Bot Integration

**Two Implementations:**

1. **Firebase Cloud Functions** (`functions/src/index.ts`):
   - `telegramWebhook` - HTTP endpoint for Telegram updates
   - `checkDeadlines` - Scheduled function (every 15 minutes) for deadline notifications
   - Uses `firebase-functions/params` for `TELEGRAM_BOT_TOKEN`
   - Deployed via Firebase: `firebase deploy --only functions`

2. **Vercel Serverless** (`api/telegram.ts`):
   - Alternative hosting on Vercel with callback query support (inline keyboards)
   - More feature-rich: edit assignments, toggle status, delete via bot buttons
   - Uses `@vercel/node` types

**Bot Flow:**
- `/start <token>` - Links Telegram account to web app user
- `/add` - Multi-step conversation: title → subject → due date
- `/assignments` - List with inline keyboard buttons for view/toggle/edit/delete
- State stored in `telegramStates` collection with steps: `AWAITING_TITLE`, `AWAITING_SUBJECT`, `AWAITING_DUE_DATE`, `AWAITING_EDIT_VALUE`

### Styling

- **Tailwind CSS** with dark mode support
- **Framer Motion** for animations
- **Recharts** for data visualization
- Path alias: `@/*` maps to root directory

## Environment Variables

Required in `.env.local` (frontend):
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

For Firebase Functions (set via Firebase config or `.env`):
```
TELEGRAM_BOT_TOKEN=
```

For Vercel deployment (set in Vercel dashboard):
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
TELEGRAM_BOT_TOKEN=
```

## Deployment

- **Frontend:** Vercel (uses `vercel.json` for SPA routing)
- **Cloud Functions:** Firebase (`firebase deploy --only functions`)
- **Bot Webhook:** Configure Telegram bot webhook URL to point to deployed endpoint

## Troubleshooting & Best Practices

### After Destructive Git Operations

**After `git-filter-repo` or any history rewrite:**
```bash
npm run build    # Verify build still works
npm test         # Run tests if you have them
git status       # Check what changed
```

### Handling Leaked Secrets

**Prefer `git rm --cached` over history rewrites:**
```bash
# Instead of git-filter-repo:
git rm --cached firebase.ts        # Remove from git tracking
echo "firebase.ts" >> .gitignore   # Ignore going forward
git add .gitignore
git commit -m "chore: remove sensitive file from tracking"

# Then rotate the API key in the service console
```

History rewrites (`git-filter-repo`, `git rebase -i`) should be **last resort** because:
- They break all existing PRs
- They require force-pushing
- Team members need to re-clone
- You can lose work if not done carefully

### Vercel Deployment Debugging

**If Vercel build fails but local build works:**
1. Check if `firebase.ts` or similar config files exist
2. Redeploy with **"Skip Build Cache"** enabled
3. Keep `vercel.json` minimal - Vercel auto-detects runtimes

```json
// ✅ Good - minimal config
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}

// ❌ Bad - over-engineered
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"  // Invalid format!
    }
  }
}
```

### Missing Import Errors

**Local dev may hide missing imports**, but CI/build will expose them:
- After any file deletion, always run `npm run build`
- Missing files show up first in clean build environments (Vercel, CI)

### Pre-PR Checklist

1. Ensure `main` branch is healthy before merging
2. Run `npm run build` locally before pushing
3. Verify base branch (`main`) has all required files
4. Check `.env.example` is up to date with new env vars
