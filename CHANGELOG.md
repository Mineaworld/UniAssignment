# Changelog

All notable changes to Uni Assignment will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-25

### Fixed
- **Critical:** Firebase production error - `FirebaseError: Function addDoc() called with invalid data` ([#7](https://github.com/Mineaworld/UniAssignment/issues/7))
  - Implemented deep recursive sanitization function `sanitizeForFirestore()`
  - Handles nested objects, arrays, and deeply nested structures
  - Preserves `null` values while removing `undefined` values
  - Tested with 7 comprehensive edge cases

- **UI:** Reminder badge overlapping with assignment title text ([#6](https://github.com/Mineaworld/UniAssignment/issues/6))
  - Added conditional left padding when reminder badge is displayed
  - Calculated precise spacing for optimal readability (32px clearance)
  - Dynamic Tailwind classes for responsive behavior

### Changed
- Enhanced `addAssignment()` function with data sanitization
- Improved assignment card layout spacing calculations
- Updated documentation with best practices for Firestore operations

### Technical Details
- Modified files: `context.tsx`, `pages/Assignments.tsx`
- Added 55 lines, removed 2 lines
- Zero breaking changes
- Production build verified successful

## [1.0.0] - 2025-12-XX

### Added
- Initial release of Uni Assignment
- Firebase Authentication (Email/Password, Google Sign-in)
- Assignment management (CRUD operations)
- Subject management with color coding
- Dashboard with progress visualization
- Calendar view for deadline tracking
- Telegram bot integration for notifications
- Dark/Light mode theme support
- Responsive mobile-first design
- Real-time data synchronization with Firestore

### Features
- Assignment tracking with priorities (High, Medium, Low)
- Status management (Pending, In Progress, Completed)
- Custom reminder system with multiple presets
- Telegram notifications (24h and 1h before deadlines)
- Interactive Telegram bot commands
- Subject-based organization
- Visual progress charts
- Deadline calendar

---

## Version History

- **v1.1.0** (Current) - Bug fixes and stability improvements
- **v1.0.0** - Initial release

For detailed technical documentation, see [CLAUDE.md](CLAUDE.md).
For detailed fix verification, see [FIX_VERIFICATION_REPORT.md](FIX_VERIFICATION_REPORT.md).
