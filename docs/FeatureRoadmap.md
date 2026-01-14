# Feature Roadmap

This document tracks planned features and improvements for UniAssignment.

**Last Updated:** 2026-01-14

---

## Phase 1: Personal Value Features (High Priority)

These features directly improve the daily experience for active users. Low effort, high impact.

### 1.1 Quick Add via Telegram `/quick`

**Status:** ✅ Completed (v0.8.0)
**Priority:** High
**Effort:** Small

**Description:**
One-line assignment creation without multi-step flow.

**Usage:**
```
/quick Math homework due Friday 5pm
/quick Database report tomorrow 11:59pm high
/quick Essay for English next Monday
```

**Implementation Notes:**
- Parse: `<title> due <date/time> [priority]`
- Use existing `chrono-node` for natural language date parsing
- Default priority: Medium
- Default subject: None (or last used)
- Respond with confirmation + inline keyboard to edit/add subject

**Success Criteria:**
- [ ] Single message creates assignment
- [ ] Natural language dates work ("tomorrow", "next friday", "in 3 days")
- [ ] Optional priority parsing ("high", "low", "urgent")
- [ ] Confirmation message with edit option

---

### 1.2 Quick Status Commands `/today` `/week`

**Status:** ✅ Completed (v0.8.0)
**Priority:** High
**Effort:** Small

**Description:**
Instant view of upcoming deadlines without navigating menus.

**Commands:**
- `/today` - Assignments due today
- `/tomorrow` - Assignments due tomorrow
- `/week` - Assignments due in next 7 days
- `/overdue` - Past-due incomplete assignments

**Response Format:**
```
📅 This Week (3 assignments)

🔴 Database Lab Report
   Due: Tomorrow, 11:59 PM (18 hours left)
   Priority: High

🟡 Math Problem Set 5
   Due: Thursday, 5:00 PM (3 days left)
   Priority: Medium

🟢 History Reading Response
   Due: Sunday, 11:59 PM (6 days left)
   Priority: Low
```

**Implementation Notes:**
- Color-coded by urgency (not just priority)
- Show time remaining in human-readable format
- Include inline buttons for quick actions (toggle status, view details)

**Success Criteria:**
- [ ] Each command returns filtered list
- [ ] Empty state message if no assignments
- [ ] Time remaining shown for each
- [ ] Quick action buttons included

---

### 1.3 Weekly Digest (Automated Sunday Message)

**Status:** ✅ Completed (v0.8.0)
**Priority:** High
**Effort:** Medium

**Description:**
Proactive weekly summary sent every Sunday evening to prepare for the week ahead.

**Message Format:**
```
📊 Week Ahead: Jan 13-19

You have 5 assignments due this week.

🔴 High Priority (2)
• Database Lab Report - Monday
• Algorithm Analysis - Wednesday

📅 Upcoming
• Math Problem Set - Thursday
• History Essay - Friday
• CS Reading - Sunday

✅ Last Week: Completed 4/6 assignments (67%)

[View All] [Add New]
```

**Implementation Notes:**
- Scheduled cron job: Sundays at 6:00 PM user timezone
- Only send if user has assignments due in next 7 days
- Include completion stats from previous week
- Link to web app for full details

**Configuration:**
- Enable/disable in Settings
- Choose day and time for digest
- Option for daily digest instead

**Success Criteria:**
- [ ] Cron job runs reliably on schedule
- [ ] Message includes all assignments for next 7 days
- [ ] Previous week stats calculated correctly
- [ ] Respects user timezone
- [ ] Can be disabled in settings

---

### 1.4 Daily Morning Reminder (Optional)

**Status:** ✅ Completed (v0.8.0)
**Priority:** Medium
**Effort:** Small

**Description:**
Optional daily message showing what's due today and tomorrow.

**Message Format:**
```
☀️ Good morning!

📌 Due Today (2)
• Database Lab Report - 11:59 PM
• Quiz Preparation - 3:00 PM

📅 Due Tomorrow (1)
• Math Problem Set - 5:00 PM

Have a productive day!
```

**Configuration:**
- Enable/disable in Settings
- Set preferred time (default: 8:00 AM)
- Skip weekends option

**Success Criteria:**
- [ ] Sends at user-configured time
- [ ] Only sends if there are assignments due today/tomorrow
- [ ] Respects user timezone
- [ ] Weekend skip option works

---

## Phase 2: Rich Notes for Assignments

### 2.1 Notion-like Notes Editor

**Status:** ✅ Completed (v0.8.0)
**Priority:** High
**Effort:** Large

**Description:**
Rich content notes attached to each assignment. Supports text, code blocks, and images.

**Features:**
- Block-based editor (similar to Notion)
- Markdown support
- Code blocks with syntax highlighting
- Image upload/paste
- Fullscreen editing mode
- Fullscreen viewing mode
- Auto-save

**Supported Block Types:**
1. Text (paragraphs, headings)
2. Code block (with language selection)
3. Image (upload or paste)
4. Bullet/numbered lists
5. Checkbox lists
6. Blockquotes

**Technical Approach:**
- Use TipTap or BlockNote library (React-native, Notion-like)
- Store content as JSON in Firestore
- Images stored in Firebase Storage
- Lazy load editor to reduce bundle size

**UI/UX:**
- "Notes" tab/section in assignment detail view
- Expand button for fullscreen edit mode
- Clean read-only view mode
- Mobile-responsive editor

**Success Criteria:**
- [x] Editor loads without page jank
- [x] Code blocks have syntax highlighting
- [x] Images upload and display correctly
- [x] Fullscreen mode works on desktop and mobile
- [x] Content persists correctly
- [x] Auto-save with visual indicator

---

## Phase 3: Portfolio Polish

### 3.1 Guest/Demo Mode

**Status:** ✅ Completed (v0.8.0)
**Priority:** Medium
**Effort:** Medium

**Description:**
Allow visitors to try the app without signing up. Pre-populated with sample data.

**Implementation:**
- "Try Demo" button on landing page
- Creates temporary session with sample assignments
- Clear banner: "Demo Mode - Sign up to save your data"
- Sample data covers various states (overdue, upcoming, completed)

---

### 3.2 Landing Page Demo Video/GIF

**Status:** ✅ Completed (v0.8.0)
**Priority:** Medium
**Effort:** Small

**Description:**
Add visual demo of the app in action to landing page.

**Options:**
- Animated GIF showing key flows
- Embedded video walkthrough
- Interactive product tour

---

### 3.3 Case Study Documentation

**Status:** ✅ Completed (v0.8.0)
**Priority:** Low
**Effort:** Small

**Description:**
Write technical case study for portfolio.

**Sections:**
- Problem statement
- Technical decisions (React 19, Firebase, Telegram)
- Challenges overcome
- Architecture overview
- Future improvements

---

## Phase 4: General Student Features (Future)

These are larger features to consider after core functionality is polished.

| Feature | Notes |
|---------|-------|
| ~~Pomodoro Timer~~ | ✅ Completed (v0.9.0) - Assignment-aware floating widget |
| ~~Note-taking~~ | ✅ Completed (v0.8.0) - BlockNote integration |
| Shared Courses | High value but complex - one person adds, others sync |
| Grade Tracking | GPA calculator, grade predictions |
| Calendar Sync | Google Calendar integration |
| AI Features | Smart date parsing, study suggestions |

---

## Completed Features

See [Changelog.md](./Changelog.md) for full history.

### Recently Completed
- [x] Rich notes editor with BlockNote (v0.8.0)
- [x] Automated Telegram reminders (v0.7.0)
- [x] Landing page (v0.6.0)
- [x] Kanban view (v0.5.0)
- [x] Calendar view
- [x] Reminder presets and custom reminders

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-13 | Phase 1 focuses on Telegram commands | User's primary interaction is via Telegram when mobile |
| 2026-01-13 | Notes feature scoped to assignments only | Avoids scope creep into full note-taking app |
| 2026-01-13 | Use TipTap/BlockNote for editor | Mature libraries with Notion-like UX, reduces dev time |

---

## How to Contribute

When adding new feature ideas:
1. Add to appropriate phase based on priority
2. Include: Status, Priority, Effort, Description
3. Define clear Success Criteria
4. Update "Last Updated" date at top
