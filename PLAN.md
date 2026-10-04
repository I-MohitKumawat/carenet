# CareNet: Technical Specification & Implementation Plan (v1)

## 1. Executive Summary & Vision
**CareNet** is a mobile-first dementia care coordination platform designed to empower people living with dementia to maintain independence while keeping family members synchronized and responsive.

* **Single Codebase**: React Native (Expo SDK 57, Expo Router, NativeWind).
* **Backend**: Express.js, TypeScript, PostgreSQL, Drizzle ORM, Socket.io.
* **Authentication & Media**: Firebase Auth (SMS OTP) + Firebase Cloud Storage.
* **Core Philosophy for v1**: Simplicity, accessibility, and offline resilience for the patient; complete visibility, task synchronization, and emergency readiness for the family.

---

## 2. Personas & Scope Boundary

### 2.1 Personas
1. **Patient (Person Living with Dementia)**:
   * **Solo / Independent Mode**: Standard settings and profile customization for early-stage individuals using the app autonomously.
   * **Managed Care Mode**: Distraction-free, high-contrast, large-touch-target interface. No complex menus or settings (protected by caregiver PIN / hold gesture).
2. **Family Member**:
   * Onboards independently. Creates or joins a **Care Network**.
   * Role-based and granular permission controls (e.g., Primary Admin, Active Care Partner, Distant Relative).
3. **Professional Caregiver**:
   * *Explicitly deferred to v2.*

### 2.2 Scope Matrix
| Feature | v1 (Current Focus) | v1.1 (Next) | v2 (Future) |
| :--- | :---: | :---: | :---: |
| Firebase SMS OTP Auth & Handshake | ✅ | — | — |
| Care Network Creation & Member Invites | ✅ | — | — |
| Dynamic Patient UI (Solo vs Managed) | ✅ | — | — |
| Daily Routine & Med Reminders (Full-screen alarm, 1-tap "Done") | ✅ | — | — |
| Cross-party Task Completion Sync (Family & Patient) | ✅ | — | — |
| Offline-First Cache (Local Alarms & Contacts) | ✅ | — | — |
| Family Photo Directory & 1-Tap Phone Quick-Dial | ✅ | — | — |
| Cognitive Activities (Familiar Faces, Orientation, Tile Match) | ✅ | — | — |
| Cognitive Completion Trend Dashboard for Family | ✅ | — | — |
| 2-Second Hold SOS Emergency Broadcast | ✅ | — | — |
| Proximity-Filtered Emergency Notifications | ✅ | — | — |
| Geofencing (Safe Zones, min 100m, drift debounce) | ❌ | ✅ | — |
| Dynamic Speed-Adaptive GPS Tracking | ❌ | ✅ | — |
| Family Moments / Stories (Memory Wall Feed) | ❌ | ✅ | — |
| Caregiver Marketplace & Profiles | ❌ | ❌ | ✅ |
| Anonymized In-App Chat & Location Redaction | ❌ | ❌ | ✅ |

---

## 3. System Architecture & Project Structure

```
carenet/
├── package.json           # Mobile Expo app dependencies
├── app.json               # Expo configuration
├── src/                   # Mobile Application (React Native + Expo Router)
│   ├── app/               # Expo Router routes
│   │   ├── _layout.tsx    # Root layout & Auth Provider
│   │   ├── (auth)/        # Phone input, SMS OTP verify, Onboarding
│   │   ├── (patient)/     # Patient tabs: Today (Routine), Family, Activities
│   │   └── (family)/      # Family tabs: Home (Daily), Routine, Care Team, Settings
│   ├── components/        # Reusable UI (buttons, cards, full-screen alarms, modals)
│   ├── hooks/             # Custom hooks (useAuth, useSocket, useOfflineSync)
│   ├── lib/               # Firebase client, MMKV/SQLite storage, local notifications
│   └── styles/            # NativeWind tailwind config & theme
├── server/                # Backend API (Express.js + Drizzle ORM)
│   ├── package.json       # Backend dependencies
│   ├── drizzle.config.ts  # Drizzle configuration
│   ├── src/
│   │   ├── db/            # Schema, connection pool, migrations
│   │   ├── middleware/    # Firebase Admin JWT auth, RBAC permissions
│   │   ├── routes/        # Auth, networks, routine, cognitive, emergency
│   │   ├── sockets/       # Socket.io event handlers (task sync, SOS broadcast)
│   │   └── index.ts       # Server entrypoint
└── shared/                # Shared Types & Contracts
    └── types/             # TypeScript interfaces, Zod validation schemas
```

---

## 4. Database Schema (Drizzle ORM + PostgreSQL)

```typescript
// 1. Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: varchar('firebase_uid', { length: 128 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  role: varchar('role', { length: 20 }).notNull(), // 'patient' | 'family'
  fullName: varchar('full_name', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Care Networks
export const careNetworks = pgTable('care_networks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  patientUserId: uuid('patient_user_id').references(() => users.id).notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Care Network Members
export const careNetworkMembers = pgTable('care_network_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  networkId: uuid('network_id').references(() => careNetworks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  relationshipToPatient: varchar('relationship_to_patient', { length: 50 }).notNull(), // 'Daughter', 'Spouse', etc.
  proximity: varchar('proximity', { length: 20 }).notNull(), // 'living_together' | 'nearby' | 'distant'
  presetRole: varchar('preset_role', { length: 30 }).notNull(), // 'admin' | 'active_carer' | 'companion'
  permissions: jsonb('permissions').notNull(), // { canEditRoutine: true, canMarkTasks: true, receiveUrgentSOS: true, ... }
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// 4. Patient Profiles
export const patientProfiles = pgTable('patient_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  networkId: uuid('network_id').references(() => careNetworks.id),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  livingSituation: varchar('living_situation', { length: 50 }),
  dementiaSeverity: varchar('dementia_severity', { length: 30 }), // 'mild' | 'moderate' | 'severe' | 'unspecified'
  emergencyNotes: text('emergency_notes'), // Allergies, critical medical info
  isManaged: boolean('is_managed').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Routine Tasks
export const routineTasks = pgTable('routine_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  networkId: uuid('network_id').references(() => careNetworks.id).notNull(),
  patientId: uuid('patient_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  category: varchar('category', { length: 30 }).notNull(), // 'medication' | 'meal' | 'hydration' | 'exercise' | 'appointment' | 'custom'
  scheduledTime: time('scheduled_time').notNull(), // '09:00:00'
  recurrenceDays: jsonb('recurrence_days').notNull(), // [1, 2, 3, 4, 5, 6, 7]
  instructions: text('instructions'),
  audioPromptUrl: text('audio_prompt_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id).notNull(),
});

// 6. Task Completions
export const taskCompletions = pgTable('task_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => routineTasks.id).notNull(),
  date: date('date').notNull(), // '2026-10-04'
  status: varchar('status', { length: 20 }).notNull(), // 'completed' | 'missed'
  completedAt: timestamp('completed_at'),
  completedByUserId: uuid('completed_by_user_id').references(() => users.id),
});

// 7. Cognitive Test Results
export const cognitiveSessions = pgTable('cognitive_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => users.id).notNull(),
  activityType: varchar('activity_type', { length: 40 }).notNull(), // 'familiar_faces' | 'orientation_check' | 'tile_match'
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
});

// 8. Emergency Contacts (Quick-Dial Directory)
export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  photoUrl: text('photo_url'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
});
```

---

## 5. Core User Journeys & Flows

### 5.1 Authentication & Network Provisioning
1. User enters phone number -> Receives SMS OTP via Firebase.
2. Verified user record is looked up in PostgreSQL:
   * **New User**: Prompted for Profile basics (Name, preferred language).
   * **Family User**: Can "Create Care Network" by entering patient's phone number or join an existing network via SMS invitation link.
   * **Patient User**: If their phone number is already attached to a Care Network created by family, they are instantly routed into **Managed Patient Mode**. If solo, they enter **Solo Patient Mode** with standard profile controls.

### 5.2 Routine Reminders & Two-Way Sync
1. Family member with `canEditRoutine` permission creates daily tasks (e.g., Morning Meds at 9:00 AM).
2. Server broadcasts task updates via Socket.io and updates the database.
3. Patient app schedules local OS notifications (`expo-notifications`) for offline reliability.
4. At 9:00 AM:
   * Patient phone rings with audio chime and displays a full-screen, high-contrast modal with the task title, clear instructions, and one large green **"Done"** button.
   * Patient taps "Done": Task status flips to `completed`, local notification cancels, and an event fires to the server.
   * If a family member gave the medication physically, they can tap "Mark as Done" in the Family app, immediately dismissing the alarm on the patient's screen in real time.

### 5.3 Family Memory Directory & 1-Tap Quick-Dial
1. Patient navigates to the **Family** tab:
   * Large visual cards display each family member's photo, name, and relationship (e.g., "Sarah - Daughter").
   * Tapping a card opens a detailed view with a large, accessible "Call Sarah" button.
   * Tapping "Call" triggers native dialer (`Linking.openURL('tel:+1...')`).
   * Contact details and photos are stored in local offline cache (MMKV) to ensure 100% functionality without cellular data.

### 5.4 Cognitive Activities & Engagement
1. Patient opens **Activities** tab:
   * **Familiar Faces Game**: Displays a photo of a family network member and prompts the patient to select the correct name from 2–3 large buttons.
   * **Daily Orientation Check**: 3 friendly questions: "What day is today?", "What is the season right now?", "Where are you currently?".
   * **Tile Memory Match**: 6 to 12 gentle matching cards featuring calm, high-contrast symbols.
2. Results are recorded locally and synced to backend. Family app displays a 7-day completion and score trend card.

### 5.5 Emergency SOS Broadcast
1. Patient's Home screen features a prominent red **"SOS / I Need Help"** button.
2. Requires a **2-second hold** to prevent accidental triggers:
   * Fires instant `emergency:sos` WebSocket event to backend.
   * Backend sends high-priority Push Notifications to all network members **except** those marked with `proximity: 'distant'`.
   * Patient's app immediately launches the native phone app with the primary emergency contact's number.

---

## 6. Implementation Milestones

* **Milestone 1: Project & Shared Core Setup**
  * Establish `/server` with Express, Drizzle ORM, PostgreSQL connection, and Firebase Admin.
  * Establish `/shared` for TypeScript interfaces and Zod validation schemas.
  * Configure NativeWind styling and theme tokens in Expo app.
* **Milestone 2: Auth & Role Handshake**
  * Firebase Auth integration with SMS OTP flow.
  * Express JWT verification middleware and user auto-provisioning.
* **Milestone 3: Care Network & Permission Engine**
  * Network creation, member invitations, and role/permission matrix assignment.
  * Dynamic role switcher (Solo Patient vs Managed Patient vs Family).
* **Milestone 4: Daily Routine & Offline-First Reminders**
  * Routine CRUD in Family interface.
  * Local notification scheduling via `expo-notifications`.
  * Full-screen alarm modal with single "Done" tap.
  * Socket.io real-time status synchronization between Patient and Family devices.
* **Milestone 5: Family Directory & Photo Quick-Dial**
  * Emergency contact management and local offline cache.
  * Accessible high-contrast card UI with native `tel:` invocation.
* **Milestone 6: Cognitive Activities Suite**
  * Implement Familiar Faces, Daily Orientation Check, and Tile Match.
  * Cognitive session reporting and Family trend dashboard.
* **Milestone 7: Emergency SOS System**
  * 2-second hold SOS gesture.
  * Proximity-based push notification filtering (alerting living-together and nearby members first).
  * Auto-dialer integration.
* **Milestone 8: Verification & Hardening**
  * End-to-end integration testing.
  * `npx tsc --noEmit` and `npx expo lint` validation across both client and server.
