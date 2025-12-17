# Uni Assignment

**Uni Assignment** is a modern, responsive application designed to help university students manage their academic workload efficiently. By centralizing assignment tracking, subject management, and deadline notifications, it empowers students to stay organized and reduce academic stress.

## 🚀 Project Overview

Students often struggle with fragmented information across multiple course portals. This project solves that problem by providing a verified single source of truth for:
*   **Assignment Tracking**: Create, update, and manage assignments with priorities and status updates.
*   **Subject Management**: Organize tasks by subject with color-coded tags for visual clarity.
*   **Deadline Management**: Visualize upcoming work with dashboard summaries and calendar views.
*   **Smart Notifications**: Integrated Telegram Bot for real-time reminders (24h and 1h before deadlines).

## 🛠️ Technology Stack

This project leverages a modern web development stack to ensure performance, scalability, and a premium user experience.

### Frontend
*   **React 19** (via Vite): Fast, component-based UI development.
*   **TypeScript**: Ensures type safety and improves code maintainability.
*   **Tailwind CSS**: Utility-first CSS for rapid and consistent styling.
*   **Framer Motion**: Smooth, production-grade animations.
*   **Recharts**: Data visualization for user progress.

### Backend & Services
*   **Firebase Authentication**: Secure user management (Email/Password, Google Sign-in).
*   **Cloud Firestore**: Scalable NoSQL database for real-time data syncing.
*   **Firebase Cloud Functions**: Serverless backend logic for scheduled tasks and database triggers.
*   **Vercel Serverless Functions**: Hosting for the Telegram Bot integration to ensure reliable uptime and separation of concerns.

## ✨ Core Features

*   **Authentication**: Secure, persistent sessions with fast sign-up/login.
*   **Dashboard**: "Up Next" view for immediate priorities and progress visualization.
*   **Assignment CRUD**: Full control over assignment details (Due Date, Priority, Status).
*   **Interactive Notifications**: Receive alerts and mark tasks as "Done" directly from Telegram.
*   **Responsive Design**: Mobile-first approach, optimized for all devices.
*   **Dark/Light Mode**: System-aware theme support.

## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn**
*   A **Firebase** project (for backend services)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/uni-assignment.git
    cd uni-assignment
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file in the root directory and add your Firebase configuration keys:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the application**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## 🤝 Contribution

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch and open a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
