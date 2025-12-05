# Product Requirements Document (PRD)
## Uni Assignment - University Assignment Management System

### 1. Executive Summary
**Product Name:** Uni Assignment
**Version:** (Firebase Edition)
**Target Audience:** University students juggling multiple subjects and deadlines.
**Primary Goal:** To provide a streamlined, aesthetic, and efficient platform for students to track assignments, manage subject workloads, and receive timely notifications.

### 2. Problem Statement
Students often struggle with:
- Fragmented tracking of assignments across different syllabi.
- Missing deadlines due to lack of centralized reminders.
- Difficulty visualizing their academic workload (e.g., "Do I have a heavy week coming up?").
- Cluttered or outdated interfaces in existing tools.

### 3. Technical Architecture

#### 3.1 Frontend (Current)
- **Framework:** React 19 (via Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Custom Design System)
- **Animations:** Framer Motion
- **Icons:** Material Symbols (Google Fonts)
- **State Management:** React Context (currently), moving to TanStack Query for server state.
- **Routing:** React Router DOM v7

#### 3.2 Backend & Database (Selected: Firebase)
*Rationale: Firebase provides a robust serverless infrastructure that is excellent for learning modern app development. Its real-time capabilities and easy-to-use Authentication make it a great fit.*

- **Platform:** **Google Firebase**
- **Database:** **Cloud Firestore** (NoSQL).
- **Auth:** **Firebase Authentication** (Email/Password, Google Sign-in).
- **Backend Logic:** **Firebase Cloud Functions** (for Telegram bot integration and scheduled deadline checks).
- **Hosting:** Firebase Hosting (or Vercel).

#### 3.3 Integrations
- **Notifications:** Telegram Bot API (via Cloud Functions).
- **Calendar:** .ics export or Google Calendar API (Future).

### 4. Core Features (MVP)

#### 4.1 Authentication
- Sign Up / Sign In (Email & Password).
- Persistent Sessions.
- Password Reset flow.

#### 4.2 Subject Management
- **Create Subject:** Name, Color Code (for visual distinction).
- **List View:** See all subjects with "Last Updated" status.
- **Edit/Delete:** Manage subject details.

#### 4.3 Assignment Tracking
- **CRUD:** Create, Read, Update, Delete assignments.
- **Fields:** Title, Description, Subject (Link), Due Date/Time, Priority (High/Med/Low), Status (Pending/In Progress/Done).
- **Views:**
  - *List View:* Filter by Subject, Status, Priority.
  - *Calendar View:* Monthly/Weekly view of deadlines.
  - *Kanban View (Optional):* Drag and drop by status.

#### 4.4 Dashboard
- **"Up Next":** Immediate deadlines (next 48 hours).
- **Progress:** Visual stats (e.g., "3/5 Assignments completed this week").
- **Subject Overview:** Quick links to subjects.

#### 4.5 Notifications (Telegram)
- **Connection:** Link Telegram account to User Profile via a unique start token.
- **Alerts:**
  - 24 hours before deadline.
  - 1 hour before deadline.
  - Daily summary at 8 AM.
- **Interactivity (Cloud Functions):**
  - "Mark as Done" button directly in the Telegram message.
  - Command `/assignments` to view pending tasks.

### 5. Database Schema (Firestore - NoSQL)

Since we are using Firestore, we will structure data using **Collections** and **Subcollections** to ensure security and scalability.

#### `users` (Collection)
Document ID: `userId` (from Auth)
- `email`: string
- `displayName`: string
- `telegramId`: string (nullable)
- `createdAt`: timestamp

#### `users/{userId}/subjects` (Subcollection)
Document ID: `subjectId` (Auto-generated)
- `name`: string
- `color`: string
- `createdAt`: timestamp

#### `users/{userId}/assignments` (Subcollection)
Document ID: `assignmentId` (Auto-generated)
- `subjectId`: string (Reference to subject document)
- `title`: string
- `description`: string
- `dueDate`: timestamp
- `priority`: 'low' | 'medium' | 'high'
- `status`: 'pending' | 'in_progress' | 'completed'
- `createdAt`: timestamp

*Note: Storing assignments as a subcollection of the user (rather than the subject) makes it much easier to query "All assignments for this user" regardless of subject.*

### 6. User Interface Guidelines
- **Theme:** Dark/Light mode support (System default).
- **Colors:** 
  - **Base:** Monochromatic foundation (White, Black, Gray scales) for a clean, sophisticated look.

  - **Goal:** Maintain visual clarity while ensuring important elements stand out.
- **Typography:** Clean, sans-serif (Inter or similar).
- **Responsiveness:** Mobile-first approach.

### 7. Development Roadmap

#### Phase 1: Frontend Polish (Current)
- [x] Basic Subject Management UI.
- [ ] Assignment List & Create Modal.
- [ ] Calendar View implementation.
- [ ] Dashboard stats visualization.

#### Phase 2: Firebase Integration
- [ ] Create Firebase Project.
- [ ] Implement Firebase Auth (Sign up/Login).
- [ ] Create Firestore Hooks (useFirestore).
- [ ] Connect Frontend to Firestore (Replace mock data).

#### Phase 3: Notifications & Bot
- [ ] Set up Firebase Cloud Functions.
- [ ] Create Telegram Bot via BotFather.
- [ ] Implement Webhook for Bot commands.
- [ ] Implement Scheduled Function (Pub/Sub) for deadline checks.

### 8. Open Questions
1. **Deployment:** Will this be hosted on Vercel (Frontend) + Supabase/Atlas (DB)? -> **Answered: Firebase Hosting or Vercel + Firebase Backend.**
2. **Telegram Integration:** Interactive or Read-only? -> **Answered: Alerts + Basic Interactivity (Mark Done, View List).**
