# Changelog

All notable changes to the UniAssignment project will be documented in this file.

## [0.7.0] - 2026-01-08

### Added
- **Telegram Reminder System**: Automated reminder notifications via Telegram
  - New Vercel cron endpoint (`api/cron/check-deadlines.ts`)
  - External scheduler via cron-job.org (every 15 minutes)
  - Reminder presets: 1h, 6h, 1d, 3d, 1w before due
  - Custom reminder support (relative or absolute time)
  - Timezone-aware notifications (Asia/Phnom_Penh)
- **Telegram Bot Enhancements**: Added 🔔 Reminder button to assignment view

### Changed
- **Reminder Re-triggering**: Editing due date or reminder settings now resets `sentAt`, allowing reminders to fire again
- **ReminderSelector**: Refactored to avoid nested form issue (converted inner `<form>` to `<div>`)

### Fixed
- **Custom Reminder Bug**: Fixed page reload when clicking "Set" in custom reminder form (nested form issue)

### Technical
- Uses external cron service (cron-job.org) instead of Vercel Cron (requires Pro plan for <1 day intervals)
- Reminder window: ±15 minutes for cron tolerance

---

## [0.6.2] - 2026-01-05

### Fixed
- **Assignment List Scroll** (Issue #16): Fixed scroll not working on Assignments page when many items present
  - Removed `overflow-hidden` from main content wrapper
  - Added `overflow-y-auto` to GlassCard container

---

## [0.6.1] - 2026-01-04

### Added
- **Firestore Security Rules**: Added local `firestore.rules` file for version control
  - User-scoped access for profiles, subjects, and assignments
  - Read-only access for telegramLinks (write via Cloud Functions only)
- **Google Sign-In Fallback**: Added redirect-based auth fallback when popup is blocked

### Changed
- **Routing**: Renamed `/app` route to `/dashboard` to avoid Vite serving `App.tsx` as a file
- **Navigation Paths**: Updated Sidebar and MobileNav to use `/dashboard/*` paths
- **Branding**: Updated footer to "UniAssignment © 2026"

### Fixed
- **Firebase Permission Errors**: Resolved "Missing or insufficient permissions" by deploying proper Firestore rules
- **Google Sign-In COOP Errors**: Auth popup now falls back to redirect when Cross-Origin-Opener-Policy blocks popup
- **Nested Route Paths**: Changed from absolute (`/assignments`) to relative (`assignments`) in AppLayout

---

## [0.6.0] - 2026-01-03

### Added
- **Landing Page**: Complete marketing landing page with modern design
  - `SpotlightHero` with mouse-tracking gradient effect
  - `FeatureTabs` with ARIA-compliant tab navigation
  - `BenefitsGrid` with animated feature cards
  - `ProductShowcase` with visual demos
  - `Pricing` section with tiered plans
  - `TestimonialsMarquee` with auto-scrolling reviews
  - `SiteFooter` with navigation links
- **New UI Components**: `ScrollReveal`, `ThemeToggle`, `Avatar`
- **CSS Utilities**: Animation delays, 3D transforms for landing page effects

### Changed
- **README**: Cleaned up and removed changelog (moved to docs/Changelog.md)
- **Font Stack**: Removed Geist font (not imported), using Inter as primary
- **Typography**: Updated `tailwind.config.js` font configuration

### Fixed
- **Rules of Hooks**: Fixed `useMotionTemplate` called inside JSX in `SpotlightHero`
- **Accessibility**: Added ARIA roles to `FeatureTabs` (tablist, tab, tabpanel)
- **CTA Buttons**: Added navigation handlers to landing page buttons
- **Button Labels**: Changed "Done" to "Cancel" in `CreateSubjectModal`
- **Dashboard Greeting**: Fixed `name.split()[1]` for single-word names
- **Calendar Styles**: Removed broken inline style using invalid CSS variable
- **"use client" Directives**: Removed Next.js directives from Vite project (`SignUp`, `avatar`)

---

## [0.5.0] - 2025-12-31

### Added
- **Revolutionary UI Redesign**: Modern "Avant-Garde" aesthetic with glassmorphism, refined gradients, and interactive components.
- **Kanban View**: New Trello-style board for managing assignments by status.
- **View Switcher**: Seamlessly toggle between List and Kanban views.
- **Core UI Components**: Added `GlassCard`, `BentoCard`, `NeonButton`, `Badge`, `ScrollArea`, `Tabs`, `Table`, `Input` and `Dialog`.
- **New Typography**: Integration of `Geist` and `Space Grotesk` fonts for a premium feel.
- **Utility Functions**: Added `cn` utility for Tailwind class merging.

### Changed
- **Design System**: Full migration to a theme-adaptive design system using CSS variables.
- **Improved Layouts**: Enhanced responsiveness and spacing across all pages.
- **Refined Transitions**: Smoother animations using Framer Motion and Lucide icons.

### Fixed
- Assignment reminder toggle button bounds (Issue #3).
- Optional fields deletion in Firebase updates (Issue #2).
- Font rendering and visual consistency issues.
- **AvatarUpload**: Applied `sizeClasses` to make `size` prop functional (was hardcoded to `w-24 h-24`).

---

## [0.4.0] - 2025-12-31

### Added
- Comprehensive Architecture documentation in `docs/Architecture.md`

### Changed
- **Component Hygiene**: Fixed `AvatarUpload` props interface (`onFileSelect` → `onUpload`) and added `size` prop support.
- **Icon Standardization**: Migrated `Calendar.tsx` from Material Symbols to Lucide React icons for visual consistency.
- **Code Hardening**: Replaced `any` with `unknown` in `context.tsx` sanitization logic with proper type assertions.
- **Cleanup**: Removed unused imports (`Logo`, `framer-motion`) across multiple components and pages.

### Fixed
- Assignment reminder toggle bounds in UI.
- Memory leak in `AvatarUpload` during file selection previews.

---

## [0.3.0] - 2025-12-23

### Added
- Smart Telegram link prompt modal with:
  - Shows to new users on first Dashboard visit (1s delay)
  - Shows to existing unlinked users every 5 days
  - Permanent "Don't Ask Again" option
  - Telegram-branded UI with benefits list
  - Three action buttons: Link Now, Remind Later, Don't Ask Again
- `TelegramPromptModal` component with Framer Motion animations
- `dismissTelegramPrompt()` function in context for prompt state management
- User fields: `telegramPromptLastShown`, `telegramPromptDismissed`

### Changed
- Updated `User` interface with prompt tracking fields
- Updated `INITIAL_USER` and all user creation points with new defaults
- Dashboard now checks prompt eligibility on mount

### Technical
- Comprehensive test report created in `tests/TELEGRAM_PROMPT_TEST_REPORT.md`
- All edge cases covered (backward compatibility, null states, etc.)
- Timer cleanup implemented to prevent memory leaks

---

## [0.2.0] - 2025-12-23

### Added
- Google OAuth authentication support (`loginWithGoogle`)
- Comprehensive Firebase error handling with user-friendly messages
- `GoogleIcon` reusable component
- `AvatarUpload` component with:
  - 5MB file size validation
  - Image type validation
  - Memory leak cleanup with `useRef` and `useEffect`
- Environment variable validation in `firebase.ts`
- UTF-8 encoding fix for `.env` file
- Cross-Origin-Opener-Policy meta tag for Google OAuth popups
- `createdAt` field to `Subject` interface

### Changed
- Complete rewrite of `context.tsx` with:
  - `FirebaseError` interface for type safety
  - `getFirebaseErrorMessage()` helper function
  - Proper error handling in `login()`, `signup()`, `logout()`, `loginWithGoogle()`
- Complete rewrite of `Login.tsx` with:
  - `useCallback` for event handlers
  - Separate loading states for email and Google auth
  - `try/finally` blocks for proper cleanup
- Complete rewrite of `SignUp.tsx` with:
  - `useCallback` for event handlers
  - Separate loading states for email and Google auth
  - `try/finally` blocks for proper cleanup
- Removed import map and Tailwind CDN from `index.html`
- Updated `tailwind.config.js` with custom colors

### Fixed
- UTF-16 encoding issue in `.env` file causing `auth/invalid-api-key` error
- Loading state not resetting on authentication errors
- Memory leak in `AvatarUpload` component (blob URLs not revoked)
- Missing `createdAt` in `Subject` interface causing type mismatches
- Code duplication of Google icon SVG in multiple components

### Technical Improvements
- Build verification: No TypeScript errors
- Bundle size: 1.27 MB (within acceptable range)

---

## [0.1.0] - 2025-12-20

### Added
- Initial project setup with React 19 + Vite
- Email/password authentication
- User profile management
- Assignment CRUD operations
- Subject CRUD operations
- Dashboard with statistics
- Dark/Light theme toggle
- Sidebar navigation
- Logo component
- View assignment modal
- Interactive assignment buttons (edit, delete, toggle status)

### Infrastructure
- Firebase Authentication (Email/Password)
- Firebase Firestore (Database)
- Firebase Storage (Profile pictures)
- React Router DOM v7
- Tailwind CSS styling
- Framer Motion animations
- Recharts for data visualization

---

## Version Format

- **[Unreleased]** - Features being worked on but not yet released
- **[X.Y.Z]** - Released versions where:
  - **X** = Major version (breaking changes)
  - **Y** = Minor version (new features)
  - **Z** = Patch version (bug fixes)

### Change Types
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features to be removed in future
- **Removed** - Features removed in this version
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes
