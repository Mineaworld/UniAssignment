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
- **Smart Reminders** — Telegram bot notifications (24h and 1h before deadlines)
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

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.
