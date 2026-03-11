# UniAssignment

A modern academic workspace for university students. Track assignments, manage subjects, and never miss a deadline.

<p align="center">
  <a href="https://uni-assignment.vercel.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

## Features

- **Assignment Tracking** — Create, prioritize, and track assignments with status updates
- **Subject Management** — Organize by subject with color-coded tags
- **Calendar View** — Visualize deadlines at a glance
- **Rich Notes Editor** — Notion-like block editor with images and formatting
- **Pomodoro Timer** — Floating productivity timer with assignment linking
- **AI Study Chat** — OpenRouter-powered assistant for explanations, summaries, and study planning with streaming responses
- **Kanban Board View** — Switch between list and board layouts to manage assignments by status
- **PWA & Offline Support** — Installable web app with service worker caching and offline status indicator
- **Smart Reminders** — Telegram bot notifications (customizable timing)
- **Dark/Light Mode** — System-aware theme support
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | React 19, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Firebase Auth, Cloud Firestore, Cloud Functions |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project

### Installation

```bash
# Clone the repository
git clone https://github.com/Mineaworld/UniAssignment.git
cd UniAssignment

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your Firebase config to .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Testing

### Run locally

```bash
# Type checks
npm run typecheck

# Unit/component tests
npm run test

# Unit coverage
npm run test:coverage

# End-to-end tests
npm run e2e
```

### E2E environment

Playwright auth-required tests use these env vars:

```env
E2E_TEST_EMAIL=your_test_user_email
E2E_TEST_PASSWORD=your_test_user_password
```

E2E app runtime requires Firebase config (`VITE_FIREBASE_*`).
See `docs/TestingPlan.md` for the full test strategy and CI behavior.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.
