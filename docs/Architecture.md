# Architecture

## System Overview

UniAssignment is a university assignment management application with both web and Telegram bot interfaces.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UNIASSIGNMENT                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐   │
│  │   React App  │         │  Vercel API      │         │   Telegram   │   │
│  │  (Frontend)  │◄────────►│   Webhook        │◄────────►     Bot      │   │
│  │              │         │  (api/telegram)  │         │              │   │
│  └──────┬───────┘         └────────┬─────────┘         └──────────────┘   │
│         │                          │                                        │
│         │                          │                                        │
│         ▼                          ▼                                        │
│  ┌──────────────────────────────────────────────────┐                     │
│  │              Firebase Backend                     │                     │
│  ├──────────────────────────────────────────────────┤                     │
│  │  │  Authentication  │  │  Firestore DB  │        │                     │
│  │  │   (Email/Google) │  │  (Users/Data)  │  Storage│                     │
│  └──────────────────────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI Framework |
| TypeScript | 5.8.2 | Type Safety |
| Vite | 6.2.0 | Build Tool |
| Tailwind CSS | 3.4.17 | Styling |
| Framer Motion | 12.23.25 | Animations |
| React Router | 7.10.1 | Navigation |
| Recharts | 3.5.1 | Data Visualization |
| Firebase SDK | 12.6.0 | Backend Client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Vercel | - | Serverless Hosting |
| Firebase Functions | 5.0.0 | Scheduled Tasks |
| Firebase Admin | 13.6.0 | Server SDK |
| chrono-node | 2.9.0 | Date Parsing |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Auth | User Authentication |
| Firestore | NoSQL Database |
| Firebase Storage | File Storage (Profile Pictures) |
| Telegram Bot API | Chatbot Interface |

## Data Flow

### Authentication Flow

```
User                    React App               Firebase Auth              Firestore
 │                        │                          │                         │
 │─[Email/Password]─────►│                          │                         │
 │                       │─[signInWithEmailAndPassword]─►│                         │
 │                       │                          │─[Validate]────────────►│
 │                       │                          │◄──[UserData]──────────│
 │◄──[Success/Error]────│◄─────────────────────────│                         │
 │                        │                          │                         │
 │─[Google OAuth]───────►│                          │                         │
 │                       │─[signInWithPopup]────────►│                         │
 │                       │                          │─[Create/Get User]─────►│
 │◄──[Success/Error]────│◄─────────────────────────│                         │
```

### Assignment Management Flow

```
User                    React App                 Firestore
 │                        │                          │
 │─[Add Assignment]──────►│                          │
 │                       │─[addDoc()]──────────────►│
 │                       │                          │─[Store Assignment]
 │◄──[Update]────────────│◄─────────────────────────│
 │                        │                          │
 │                       │──[onSnapshot()]──────────►│
 │◄──[Real-time Update]──│◄─────────────────────────│
```

### Telegram Bot Flow

```
Telegram User           Telegram API            Vercel Webhook           Firestore
     │                        │                        │                      │
     │─[Message]─────────────►│                        │                      │
     │                        │─[Webhook POST]────────►│                      │
     │                        │                        │─[Query User Link]───►│
     │                        │                        │◄──[User UID]─────────│
     │                        │                        │                      │
     │                        │                        │─[Get Assignments]───►│
     │                        │◄──[Send Response]──────│◄──[Data]─────────────│
     │◀────[Reply]────────────│                        │                      │
```

## Database Schema

### Collections Structure

```
uni-assignment-f0fbe/
│
├── users/
│   └── {uid}/                              # User document
│       ├── name: string
│       ├── email: string
│       ├── avatar: string (URL)
│       ├── major: string
│       ├── telegramLinked: boolean
│       └── telegramLinkedAt: string | null
│
│   ├── subjects/                           # User's subjects
│   │   └── {subjectId}
│   │       ├── name: string
│   │       ├── color: string (Tailwind class)
│   │       ├── createdAt: string (ISO)
│   │       └── lastUpdated: string
│   │
│   └── assignments/                        # User's assignments
│       └── {assignmentId}
│           ├── title: string
│           ├── subjectId: string
│           ├── dueDate: string (ISO)
│           ├── status: "Pending" | "In Progress" | "Completed"
│           ├── priority: "Low" | "Medium" | "High"
│           ├── description: string | undefined
│           ├── examType: "midterm" | "final" | null
│           └── createdAt: string (ISO)
│
├── telegramLinks/                          # Telegram account linking
│   └── {linkToken}                         # = user UID
│       ├── chatId: string
│       ├── telegramUserId: string
│       └── linkedAt: Timestamp
│
└── telegramStates/                         # Bot conversation state
    └── {chatId}
        ├── step: "AWAITING_TITLE" | "AWAITING_SUBJECT" | "AWAITING_DUE_DATE" | "AWAITING_EDIT_VALUE"
        ├── data: object
        ├── uid: string
        └── updatedAt: Timestamp
```

## Component Architecture

### Frontend Structure

```
src/
├── pages/                    # Route components
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── Dashboard.tsx
│   ├── Assignments.tsx
│   ├── Subjects.tsx
│   └── Settings.tsx
│
├── components/               # Reusable components
│   ├── Logo.tsx
│   ├── GoogleIcon.tsx
│   ├── AvatarUpload.tsx
│   ├── Sidebar.tsx
│   └── ...
│
├── context.tsx              # App state management
├── firebase.ts              # Firebase initialization
├── types.ts                 # TypeScript definitions
├── constants.ts             # App constants
└── main.tsx                 # App entry point
```

### Backend Structure

```
api/
└── telegram.ts              # Vercel webhook handler

functions/
└── src/
    └── index.ts             # Firebase Functions
        ├── telegramWebhook  # Webhook endpoint
        └── checkDeadlines   # Scheduled notification (every 1 hour)
```

## Security Considerations

### Environment Variables

| Variable | Location | Access |
|----------|----------|--------|
| `VITE_FIREBASE_*` | `.env` (frontend) | Public (exposed to client) |
| `TELEGRAM_BOT_TOKEN` | Vercel Dashboard | Server-only |
| `FIREBASE_PRIVATE_KEY` | Vercel Dashboard | Server-only |

### Security Rules

- Firestore rules ensure users can only access their own data
- Authentication required for all data operations
- Profile pictures stored in Firebase Storage with appropriate rules

## Deployment

### Frontend
- **Development:** `npm run dev` (localhost:3000)
- **Production:** Build and deploy to Vercel/Vite hosting

### Backend
- **Vercel API:** Auto-deploys from `api/` directory
- **Firebase Functions:** `cd functions && npm run deploy`

### Environment Configuration

| Environment | File/Location |
|-------------|---------------|
| Local (Frontend) | `.env` |
| Vercel | Dashboard → Settings → Environment Variables |
| Firebase Functions | `firebase functions:config:set` or `functions/.env`
