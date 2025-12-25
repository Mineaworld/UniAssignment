# Changelog

All notable changes to the UniAssignment project will be documented in this file.

## [Unreleased]

### Fixed
- Assignment reminder toggle button now stays within bounds (Issue #3)
- Assignment updates properly delete optional fields when set to undefined (Issue #2)
- Assignment title text wrapping and spacing to prevent overlap with action buttons
- Modern React imports: use direct FormEvent import instead of React namespace

### Planned
- Enhanced assignment statistics dashboard
- Calendar view for assignments
- Subject-specific grade tracking
- Export assignments to PDF/iCal

---

## [0.3.0] - 2024-12-23

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

## [0.2.0] - 2024-12-23

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

## [0.1.0] - 2024-12-20

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
