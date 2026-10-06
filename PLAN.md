# CareNet — Product & Architecture Plan

> **Status:** Approved by founder. Ready for step-by-step implementation.  
> **Last updated:** 2026-10-04  
> **Stack:** Expo SDK 57 · React Native 0.86 · NativeWind · Expo Router · Express · PostgreSQL · Drizzle ORM · Socket.io · Firebase Auth (SMS OTP) · Firebase Storage · Expo Push Notifications

---

## 1. Product Summary

CareNet is a dementia care platform designed to help people living with dementia remain independent for as long as possible, while keeping their families connected and coordinated.

### Core Problem
Families struggle to coordinate care, monitor safety, manage daily routines, and find suitable caregivers for loved ones with dementia.

### Primary Users (v1)
| Role | Description |
|---|---|
| **Patient** | Person living with dementia. May be early-stage (self-managing) or moderate/severe (managed by family). |
| **Family Member** | Family or close network member. Manages care coordination and monitors patient safety. |

> **Out of scope for v1:** Professional caregiver role (fully deferred to v2+).

---

## 2. Version Scope

### ✅ v1 — Core Care & Family Coordination
- Patient + Family onboarding and profile creation
- Care Network creation and family invitation flow
- Dynamic patient UI (solo mode vs. managed/kiosk mode)
- Daily routine management: creation by family, completion by patient or family
- Offline-first routine alarms and reminders (full-screen audio prompt)
- Cognitive activities (3 focused activities)
- Photo Family Directory (names, photos, relationship, quick-dial)
- Emergency Quick-Dial (redirects to native phone app)
- SOS Button (broadcasts GPS + auto-dials primary contact)
- Family permission model (preset tiers + advanced fine-grained toggle)
- Push notifications for missed routines and SOS alerts
- Family deep-link navigation from push notifications
- Cognitive check-in trend reporting for family

### 🔜 v1.1 — Memory & Moments (before v2)
- Family Moments feed on patient Home screen (WhatsApp Status-style)
- Voice messages in family directory (tap a family member to hear their voice)
- Patient can browse historical moments per family member

### 🔜 v2 — Safety & Location
- Live GPS location tracking (speed-adaptive pings)
- Safe Zone (geofencing) creation and management
- Geofence breach detection with debounce (2 samples, 30–45s apart, minimum radius 100m)
- Family Map screen with live patient pin
- SOS location broadcast over WebSockets
- Battery-aware location logic (inside zone = OS geofence only; outside zone = GPS active)
  - Stationary outside zone: ping every 2–3 minutes
  - Moving outside zone: ping every 15–30 seconds (speed-adaptive)
- Push alert deep-links to /family/map on SOS and geofence breach
- Proximity-based urgency alerts (non-long-distance family members get "URGENT: go assess" on SOS/geofence breach)

### 🔜 v3 — Caregiver Marketplace
- Professional caregiver role, profile, and full onboarding (7 steps)
- Caregiver discovery and search (radius, rate, specialization filters)
- Care request lifecycle: send / accept / decline
- In-app marketplace chat (phone numbers masked until both parties agree to meet)
- City-level location masking for caregiver until hiring is finalized
- Care relationship history: pending → active → ended
- Caregiver home tabs: Dashboard · Patient List · Care Requests · Messages · Profile
- Caregiver profile: experience, dementia training, skills, availability, rates, bio, discoverability

---

## 3. Repository Structure

```
carenet/                        ← project root
├── src/                        ← Expo / React Native mobile app
│   ├── app/                    ← Expo Router file-based routes
│   │   ├── (auth)/             ← OTP, role selection
│   │   ├── (onboarding)/       ← multi-step onboarding flows
│   │   ├── (patient)/          ← patient tab stack
│   │   ├── (family)/           ← family tab stack
│   │   └── _layout.tsx
│   ├── components/             ← shared UI components
│   ├── hooks/                  ← custom React hooks
│   ├── stores/                 ← client state (Zustand)
│   ├── services/               ← API clients, socket, firebase
│   ├── db/                     ← SQLite schema + MMKV keys (offline cache)
│   └── utils/
├── server/                     ← Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── db/                 ← Drizzle schema + migrations
│   │   └── socket/             ← Socket.io event handlers
│   └── drizzle.config.ts
├── shared/                     ← shared TypeScript types/enums
│   └── types/                  ← DB entity types, API request/response contracts
├── AGENTS.md
├── PLAN.md
└── package.json
```

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Mobile framework | Expo SDK 57 / React Native 0.86 | Single binary, role-switched UI |
| Navigation | Expo Router (file-based) | Routes in `src/app/` |
| Styling | NativeWind | Tailwind-like classes for React Native |
| Auth | Firebase Auth (SMS OTP only) | Phone number as sole identity |
| Backend | Express.js (TypeScript) | REST + Socket.io |
| Database | PostgreSQL | Primary relational store |
| ORM | Drizzle ORM | Type-safe, SQL-like, lightweight |
| Real-time | Socket.io (WebSockets) | SOS alerts in v1; live location in v2 |
| Push Notifications | Expo Push Notifications → FCM/APNs | Alerts when app is closed/backgrounded |
| File/Media Storage | Firebase Cloud Storage | Profile photos, Moments media (v1.1) |
| Cache / Queue | Redis | Deferred to v1.1/v2 as needed |
| Offline cache | MMKV + expo-sqlite | Patient-side offline-first data |
| Location (v2) | expo-location (OS geofencing + GPS) | Battery-aware logic |

---

## 5. Authentication Flow

1. User opens app → enters phone number → Firebase triggers SMS OTP.
2. User enters OTP → Firebase SDK returns a Firebase ID Token (JWT).
3. Mobile sends `Authorization: Bearer <firebase_id_token>` with every API request.
4. Express backend calls `firebase-admin.auth().verifyIdToken(token)` → extracts verified phone number.
5. Backend upserts a `users` row keyed on `phone_number` and returns:
   - `role` (patient | family | caregiver)
   - `profileCompleted` flag
   - active Care Network memberships
6. Expo Router redirects based on state:
   - `profileCompleted = false` → Onboarding stack
   - `profileCompleted = true` → Role-based home tab stack

---

## 6. Onboarding Flows

### 6a. Family Member Onboarding (4 steps)
1. **About You** — Name, preferred language, optional profile photo.
2. **Your Relationship** — Relationship to patient (son/daughter/spouse/etc.), proximity (living together / nearby / long-distance).
3. **Your Involvement** — Areas to be involved in: updates, appointments, safety, caregiver coordination, daily care, emergencies.
4. **Notifications** — Alert preferences: important alerts, appointments, medication, daily updates. (Location alerts added in v2.)

After onboarding, the family member can:
- **Create a Care Network** (invite patient + other family)
- **Join an existing network** (via SMS invite link)

### 6b. Patient Account — Two Entry Paths

#### Path 1: Family-Proxy Creation (primary flow for moderate/severe dementia)
- Family member completes their own onboarding first.
- Inside the "Create Care Network" flow, they optionally create the patient's profile:
  1. About Patient — Name, DOB, gender, photo, general location.
  2. Communication — Preferred language, communication preferences.
  3. Living Situation — Living arrangement, household context.
  4. Health Status — Dementia severity, other health conditions.
  5. Medications — Current medication information.
  6. Care Needs — Assistance required with daily activities.
  7. Safety Concerns — Wandering risk, other safety concerns.
  8. Emergency Contact — Contact details, relationship, optional linked account.
  9. Review — Confirm all information.
- Family enters the patient's phone number.
- Patient receives an SMS with an invite/auth link.
- Patient clicks link → Firebase OTP pre-confirmed → lands directly inside the app (their profile already exists, created by proxy).

#### Path 2: Self-Signup (early-stage / independent patient)
- Patient selects "I am the person with dementia" during role selection after OTP.
- Completes a trimmed version of the full profile (steps 1, 2, 6, 7, 8 minimum; health depth optional).
- Gets immediate access to all features in **Solo Mode** (full settings, profile, routine editing).
- Can join or create a Care Network at any time; this transitions them to Managed Mode.

### 6c. Dynamic Patient UI Mode
| Condition | UI Mode |
|---|---|
| No Care Network linked | **Solo Mode** — Full access: profile tab, settings, routine editing, all controls visible |
| In Care Network with a privileged Admin | **Managed Mode** — Simplified large-tap UI. Profile/settings hidden behind 3-second long-press lock (configurable by Admin). Routine creation disabled; only completion allowed. |

---

## 7. Care Network & Permissions

### Network Creation Flow
1. Any family member can create a Care Network after completing their own profile.
2. Creator becomes the **Owner** (always Admin; cannot be removed; can grant Admin to others).
3. Owner invites Patient by phone number → Patient gets SMS link → Patient joins and their existing or proxy-created profile is linked.
4. Owner invites additional family members by phone number → Each receives an SMS invite link → After accepting and completing their profile, the Owner assigns their role and permissions.

### Permission Model

#### Quick Mode (3 preset tiers)
| Tier | Label | Default Capabilities |
|---|---|---|
| 1 | **Admin** | Full control: edit routine, invite/remove members, manage permissions, view all patient info, mark routine done, receive all alert types |
| 2 | **Care Partner** | View patient status, mark routine items done, post Moments (v1.1), receive non-critical alerts. Cannot change network membership or geofences. |
| 3 | **Companion** | View daily check-in summary and Moments, quick-dial patient. Cannot see sensitive health info, routine editing, or manage anything. |

> **Naming note:** "Admin" replaces "Primary Caregiver" since v1 is family-only. The "caregiver" label is reserved for the professional role in v3.

#### Advanced Mode (fine-grained toggles)
- Only accessible to **Admin** tier members.
- Any individual capability can be independently toggled per network member:
  - View health details (dementia severity, medications, conditions)
  - Create/edit routine items
  - Mark routine items as done remotely
  - Post Moments to the family network (v1.1)
  - View live location (v2)
  - Receive SOS alerts
  - Receive geofence breach alerts (v2)
  - Receive missed routine escalation alerts
  - Invite/remove network members

### Multi-Network & Multi-Patient Support
- A user account can belong to multiple Care Networks (e.g., one for mother, one for father).
- A Care Network can have multiple Admins.
- App provides a network/patient switcher for multi-network users.
- **Constraint:** A patient account can only be the "active patient" in ONE Care Network at a time. (Prevents two families independently managing the same person — resolves data consistency.)

---

## 8. Core Feature Specs

### 8a. Daily Routine & Reminders

**Who creates:** Family members with Admin or Care Partner tier (not patients in Managed Mode). Patients in Solo Mode can create their own routine items.

**Routine item schema:**
- Title, Time, Type (medication | meal | activity | appointment | custom), optional Notes, is_active flag.

**Patient experience:**
- Scheduled local notification fires at the set time (expo-notifications, works offline).
- Full-screen audio alarm with a single large **"Done"** button. No snooze option.

**Family experience:**
- View all routine items in their Routine tab with completion status.
- Can mark any item as **Done** remotely (e.g., physically administered medication; patient didn't tap themselves).

**Sync behavior:**
- Marking done on any device emits a `routine:completed` WebSocket event → server stores completion → broadcasts to all other active network clients.
- If patient is offline: completion stored locally in SQLite → synced to server when connectivity restores.
- Idempotency: `unique(routine_item_id, date)` on completions table prevents duplicate records.

**Escalation:**
- If not marked done within a configurable window (default: 30 minutes, adjustable by Admin):
  - Push notification sent to all family members with the "receive missed routine alerts" permission.
  - Notification includes item name and quick "Mark Done" action (deep-links to `/family/routine`).

**Local caching (patient device):**
- Today's routine items synced to SQLite on app open and on every server update.
- Local notification schedule rebuilt on each sync so alarms fire without internet.

### 8b. SOS Button

- Located prominently on the Patient Home screen (Today tab).
- Requires a **2-second press-and-hold** to prevent accidental activation.
- Visual countdown ring shows during hold.

**On activation:**
1. Sends current device GPS coordinates to the backend (via WebSocket if connected, HTTP fallback if not).
2. Server stores an `sos_events` record.
3. Server emits `sos:triggered` WebSocket event + FCM/APNs push notification marked **CRITICAL** to all network family members.
4. **Non-long-distance members** (proximity = "living together" or "nearby") receive an additional "URGENT — please go and assess the situation" overlay.
5. Native phone dialer automatically opens with the Primary Contact (first Admin in network) pre-dialed.

**v2 addition:** When family taps the SOS push notification, they deep-link to `/family/map` with a pulsing red live pin and quick-call bar at bottom.

### 8c. Cognitive Activities (v1 — 3 activities)

All activities are available offline (content bundled in app assets).

1. **Familiar Faces** — Show a photo of a connected family member; patient selects their name/relationship from multiple choice. Uses the family directory photos.
2. **Daily Orientation Check** — 3 morning questions: "What day is today?", "What is the season?", "Where are you right now?" (recognizes the current city from stored general location).
3. **Tile Memory Match** — Classic card flip matching game using pleasant icons (or optionally family member photos).

**Session recording:** On completion, a `cognitive_sessions` record is saved with: activity_type, score, total_questions, completed_at.

**Family reporting:** Family members with relevant permission can see a **Cognitive Check-in Trend** card on their Home tab showing: completion rate (days completed / days in streak), average accuracy per activity, over the last 7/30 days.

### 8d. Photo Family Directory

**Location:** "Family" tab on the patient's screen.

**Content per member:**
- Profile photo (large, high-contrast)
- Full name
- Relationship label (e.g., "Your daughter")
- Phone number
- Quick-Dial button → opens native phone dialer (works offline)

**Member detail screen (on tap):**
- Photo, name, relationship, brief info (location/city, any note added by Admin)
- Quick-dial button
- v1.1: Moments history (chronological photo/video posts from this person)
- v1.1: Voice message playback button

**v1.1 — Moments Feed:**
- Family members with Care Partner or Admin role can post photo/video updates to the network.
- Patient sees a horizontal story row on their Home/Today screen when they open the app.
- Tapping a story shows full-screen photo/video.
- Moments are also accessible per family member on their detail screen.
- Optional expiry for stories (default: 7 days, configurable).

### 8e. Emergency Contacts (Offline Safe)

- All emergency contacts and family directory phone numbers are cached in MMKV on the patient device.
- Never auto-cleared; updated whenever the server data changes.
- Quick-dial and SOS auto-dial work fully offline.

---

## 9. Navigation Structure

### Patient Tabs (3 tabs)

| Tab | Icon | Contents |
|---|---|---|
| **Today** | ☀️ | Daily routine items, SOS button (prominent), upcoming reminders, v1.1: Moments story row at top |
| **Family** | 👨‍👩‍👧 | List of all network members with photo + name + relationship + quick-dial. Tap for detail screen. |
| **Mind & Fun** | 🧩 | 3 cognitive activities, session history ("Your recent scores") |

**Profile/Settings access:**
- **Solo Mode:** Profile tab visible as a 4th tab (or accessible from Today screen avatar tap).
- **Managed Mode:** Profile/settings hidden. Accessible via 3-second long-press on the patient's avatar on the Today screen (triggers Admin PIN or family confirmation).

### Family Member Tabs (4 tabs)

| Tab | Icon | Contents |
|---|---|---|
| **Home** | 🏠 | Patient daily status overview, routine completion summary, Cognitive trend card, v1.1: Moments feed |
| **Routine** | 📋 | Full routine item list for the patient — create, edit, mark done, view completion history |
| **Care Team** | 👥 | Network member list with roles/permissions, invite new member, permission management (Quick/Advanced) |
| **More** | ⚙️ | Patient profile (view/edit if Admin), notification preferences, network settings, account settings |

> **v2 addition:** A **Map** tab will be inserted between Routine and Care Team for live location and geofence management.

---

## 10. Push Notification Deep-Links

| Notification Type | When | Deep-Link Destination | Version |
|---|---|---|---|
| Missed Routine Escalation | 30 min after scheduled time, not marked done | `/family/routine` → missed item highlighted + Mark Done action | v1 |
| SOS Alert | Patient triggers SOS button | Family app opens; v2: `/family/map` with live pin + quick-call bar | v1 / v2 |
| Geofence Breach | Patient exits safe zone (debounced) | `/family/map` with breached zone perimeter + patient trajectory | v2 |
| Family Network Invite | Sent to invitee's phone | Onboarding join flow (links to app store if not installed) | v1 |
| Moments Posted (v1.1) | Family member posts a Moment | Patient Today tab → Moments story row | v1.1 |

---

## 11. Core Data Model

```sql
-- Identity
users
  id (uuid pk), phone_number (unique), firebase_uid (unique),
  role (enum: patient | family | caregiver),
  full_name, dob, gender, profile_photo_url, preferred_language,
  created_at, updated_at

-- Patient clinical/care profile
patient_profiles
  id, user_id (FK → users, unique), dementia_severity (enum: mild | moderate | severe),
  living_situation, health_conditions (jsonb), medications (jsonb),
  care_needs (jsonb), safety_concerns (jsonb), general_location,
  created_at, updated_at

-- Family member profile
family_profiles
  id, user_id (FK → users, unique), proximity (enum: together | nearby | long_distance),
  involvement_areas (jsonb), notification_preferences (jsonb),
  created_at, updated_at

-- Care network (the "family group")
care_networks
  id, name, created_by (FK → users), created_at

-- Network membership (family members + patient)
care_network_members
  id, network_id (FK → care_networks), user_id (FK → users),
  patient_user_id (FK → users, nullable — which patient this relationship is about),
  tier (enum: owner | admin | care_partner | companion),
  permissions (jsonb — fine-grained toggle overrides),
  proximity (enum: together | nearby | long_distance),
  status (enum: invited | active | removed),
  joined_at, removed_at

-- Daily routine
routine_items
  id, network_id (FK → care_networks), patient_user_id (FK → users),
  created_by (FK → users), title, type (enum: medication | meal | activity | appointment | custom),
  scheduled_time (time), notes, is_active, created_at, updated_at

routine_completions
  id, routine_item_id (FK → routine_items), date (date),
  completed_by (FK → users), completed_at,
  method (enum: patient_self | family_remote),
  UNIQUE(routine_item_id, date)  -- idempotency

-- Emergency contacts
emergency_contacts
  id, patient_user_id (FK → users), name, phone_number, relationship,
  is_primary, linked_user_id (FK → users, nullable), sort_order

-- Cognitive activities
cognitive_sessions
  id, patient_user_id (FK → users), activity_type (enum: familiar_faces | orientation | memory_match),
  score, total_questions, completed_at

-- SOS events
sos_events
  id, patient_user_id (FK → users), latitude, longitude,
  triggered_at, resolved_at

-- Moments (v1.1)
moments
  id, network_id (FK → care_networks), posted_by (FK → users),
  media_url, media_type (enum: photo | video), caption,
  created_at, expires_at (nullable)
```

---

## 12. Backend Architecture

### REST Endpoints

```
POST   /auth/verify-token              Validate Firebase ID Token; upsert user; return session
GET    /users/me                       Current user profile + network memberships
PATCH  /users/me                       Update user profile

POST   /networks                       Create Care Network
GET    /networks/:id                   Get network details + patient info
POST   /networks/:id/invite            Send SMS invite to phone number (family or patient)
POST   /networks/:id/join              Accept invite via token (from SMS link)
GET    /networks/:id/members           List members with roles + permissions
PATCH  /networks/:id/members/:uid      Update a member's tier or permissions

POST   /patients/profile               Create/upsert patient profile (proxy or self)
GET    /patients/:id/profile           Get patient profile (permissioned)

GET    /patients/:id/routine           Get routine items for today (+ upcoming)
POST   /routine                        Create a routine item
PATCH  /routine/:id                    Edit a routine item
DELETE /routine/:id                    Soft-delete (set is_active = false)
POST   /routine/:id/complete           Mark routine item done (with idempotency)
GET    /routine/:id/completions        Get completion history for an item

GET    /patients/:id/family-directory  List network members for patient Family tab
GET    /emergency-contacts/:patientId  Get patient's emergency contacts

POST   /sos                            Trigger SOS event (store + WebSocket broadcast)

GET    /activities/sessions            Get cognitive session history for a patient
POST   /activities/sessions            Save a completed cognitive session

-- v1.1
POST   /moments                        Post a Moment (photo/video)
GET    /moments/:networkId             Get active Moments for a network
DELETE /moments/:id                    Delete own Moment

-- v2
POST   /location/ping                  Patient GPS ping
GET    /location/:patientId/latest     Latest known location
POST   /safezones                      Create a safe zone
GET    /safezones/:networkId           List safe zones
PATCH  /safezones/:id                  Edit a safe zone
DELETE /safezones/:id                  Delete a safe zone
```

### WebSocket Events (Socket.io)

```
Client → Server:
  join_network        { networkId }             Join a Socket.io room
  routine:complete    { itemId, date }           Mark item done in real-time
  sos:trigger         { lat, lng }              SOS broadcast (v1: alert only, v2: + live location)
  [v2] location:ping  { lat, lng, speed }       Patient GPS ping

Server → Client:
  routine:updated     { itemId, date, completedBy, method }
  sos:triggered       { patientId, lat, lng, timestamp, urgency }
  [v2] location:update { patientId, lat, lng, speed, timestamp }
  [v2] geofence:breach { patientId, zoneId, zoneName, lat, lng }
```

### Middleware Chain
```
Request → Firebase Token Verification → Attach User → Network Membership Check (where needed) → Permission Check → Controller
```

---

## 13. Offline-First Strategy (Patient Device)

| Data | Storage | Behavior |
|---|---|---|
| Today's routine items | expo-sqlite | Synced on app open and on WebSocket updates; local notification schedule rebuilt on each sync |
| Emergency contacts + family phone numbers | MMKV | Never auto-cleared; updated on every server sync |
| Family directory (names, photos, relationships) | expo-sqlite + local image cache | Fully available offline |
| Cognitive activity content (questions, assets) | Bundled in app (assets/) | Zero network dependency |
| Routine completions (offline) | expo-sqlite queue | Sent to server on reconnect with idempotency |
| Moments media (v1.1) | Downloaded to local cache | Available offline after first load |

**Notification scheduling:** `expo-notifications` scheduled local notifications are rebuilt every time routine data syncs, ensuring alarms fire without active internet.

---

## 14. ASSUMPTIONS

| # | Assumption | Basis |
|---|---|---|
| A1 | Caregiver marketplace fully deferred to v3 | Explicitly agreed |
| A2 | Geofencing and live location deferred to v2 | Explicitly agreed |
| A3 | Moments (WhatsApp-status style) and voice messages are v1.1 | Explicitly agreed |
| A4 | Minimum safe zone radius = 100m (v2) | Agreed |
| A5 | GPS drift debounce = 2 samples, 30–45s apart (v2) | Agreed |
| A6 | Redis deferred until v1.1/v2 introduces queuing needs | Agreed |
| A7 | No in-app VoIP/video — quick-dial always redirects to native phone dialer | Agreed |
| A8 | SMS OTP is the only authentication method (no email, no social login) | Explicitly stated |
| A9 | Routine escalation fires 30 minutes after scheduled time (configurable by Admin) | Agreed |
| A10 | A patient can be the active patient in only ONE Care Network | Derived; resolves data consistency |
| A11 | Single Node.js Express server (no microservices) for all versions up to v2 | Stack simplicity |
| A12 | English-first for v1; preferred_language field stored but UI translation deferred to v2 | Not discussed; assumption |
| A13 | Accessibility (WCAG formal compliance) is best-effort in v1; full audit in v2 | Not discussed; assumption |
| A14 | No monetization or billing in v1/v2; subscription model consideration for v3 | Not discussed; assumption |
| A15 | Staging environment: local dev + production only for v1 | Not discussed; assumption |

---

## 15. OUT OF SCOPE (Full Tracking)

### Deferred to v1.1
- Moments / Status feed (family photo/video posts visible on patient Home)
- Voice messages in Family Directory per member detail screen
- Historical Moments browsing per family member

### Deferred to v2
- Live GPS location tracking (speed-adaptive)
- Safe Zone (geofence) creation and management
- Geofence breach detection, debounce logic, and alerts
- Family Map screen with live patient location pin
- Battery-aware location switching (OS geofence → GPS on breach)
- SOS coordinates displayed on live map
- Push notification deep-links to /family/map
- Proximity-based urgency escalation for SOS/geofence (non-long-distance)

### Deferred to v3 (Caregiver Marketplace)
- Professional caregiver role, full 7-step onboarding, and profile
- Caregiver discovery, search, and filtering (radius, rate, specialization)
- Care request lifecycle (pending → accepted/declined → active → ended)
- In-app marketplace chat
- Phone number masking and privacy reveal flow
- City-level caregiver location masking until hire confirmed
- Care relationship history preservation
- Caregiver navigation: Dashboard · Patient List · Care Requests · Messages · Profile

### Not in Scope (unless explicitly revisited)
- In-app VoIP, video calling
- Web portal or browser-based access
- AI-generated care suggestions or cognitive assessments
- Wearable / smartwatch integration
- Billing, payment, or subscription management
- Formal HIPAA / GDPR compliance certification (legal review recommended before launch)

---

## 16. OPEN RISKS & UNKNOWNS

| # | Risk | Recommended Mitigation |
|---|---|---|
| R1 | **iOS background execution limits** — iOS kills background JS; routine alarms must not rely on background network calls. | Use `expo-notifications` scheduled local notifications exclusively. Test on physical iOS device before releasing. |
| R2 | **SMS OTP cost at scale** — Firebase Auth free tier is ~10k SMS/month on Spark plan. | Monitor usage; set Firebase billing alert; plan Blaze plan upgrade before soft launch. |
| R3 | **Multi-network patient conflict** — If the same patient is somehow linked to two networks, routine and permissions can collide. | Enforce server-side: one active Care Network per patient. Attempting to link to a second returns a clear error with an invitation to transfer. |
| R4 | **Offline/online routine completion race condition** — Patient marks done offline; family marks done online simultaneously. | Idempotency key `UNIQUE(routine_item_id, date)` on completions. First write wins; duplicate is silently discarded on sync. |
| R5 | **Firebase Storage media costs (v1.1)** — Uncontrolled Moments uploads could grow quickly. | Enforce file size limits: photos ≤ 5MB, videos ≤ 30MB. Set Firebase Storage budget alert. Consider Moments expiry (default 7 days). |
| R6 | **Dementia-specific UX validation** — Our UI assumptions (large fonts, single-button flows, 3s long-press lock) are untested with actual patients. | Plan a care home pilot or caregiver-assisted usability test before any public launch. |
| R7 | **Health data privacy & compliance** — Storing dementia severity, medications, and diagnoses. Jurisdiction for compliance (HIPAA / GDPR) not discussed. | Add privacy policy and ToS before launch. Encrypt sensitive fields at rest (PostgreSQL column encryption or application-level). Consult legal if launching in US/EU. |
| R8 | **Expo SDK version drift** — SDK 57 ships with specific package version constraints; installing packages with bare `npm add` can break native compatibility silently. | All package installs via `npx expo install`. Run `npx expo-doctor` before every new addition. Never manually edit package versions. |
| R9 | **Phone number as identity collisions** — If a patient changes their phone number, they lose access to their account. | Build an account recovery flow (Admin can re-link a patient to a new phone number). Add to v1 backlog. |
| R10 | **NativeWind compatibility with Expo SDK 57** — NativeWind v4 requires specific Babel config and has known issues on certain RN versions. | Verify NativeWind compatibility with RN 0.86 before starting styling work. Check NativeWind GitHub issues/changelog. |

---

## 17. Implementation Phases

### Phase 1 — Foundation & Auth
- [ ] Set up `/server`, `/shared` directory structure alongside existing `/src`
- [ ] Initialize Express + TypeScript server with Drizzle ORM
- [ ] Design and run initial PostgreSQL schema migrations (users, patient_profiles, family_profiles, care_networks, care_network_members)
- [ ] Firebase Admin SDK on backend; validate ID Token middleware
- [ ] Firebase Auth (SMS OTP) SDK integration on mobile
- [ ] Auth flow end-to-end: OTP → Firebase Token → Express upsert → session
- [ ] Expo Router auth guard (redirect to onboarding if profile incomplete)

### Phase 2 — Onboarding Flows
- [ ] Family member onboarding (4 screens)
- [ ] Patient self-signup onboarding (trimmed flow)
- [ ] Family-proxy patient profile creation (9-step wizard, triggered from Care Network creation)
- [ ] Care Network creation screen
- [ ] Phone number invite flow + SMS link generation
- [ ] Invite acceptance + join flow (from SMS deep-link)
- [ ] Permission assignment UI (Quick presets + Advanced toggle screen)
- [ ] Dynamic patient UI mode switch (Solo vs. Managed detection)

### Phase 3 — Core Patient Experience
- [ ] Patient Today tab: routine item list, completion UI, SOS button
- [ ] Full-screen audio alarm (expo-notifications local scheduled)
- [ ] Offline routine caching (expo-sqlite sync + notification rebuild)
- [ ] SOS button (2s hold, visual countdown ring, broadcast + auto-dial)
- [ ] Patient Family tab: directory list + member detail screen + quick-dial
- [ ] Patient Mind & Fun tab: 3 cognitive activities + session recording

### Phase 4 — Core Family Experience
- [ ] Family Home tab: patient status summary, routine completion overview, cognitive trend card
- [ ] Family Routine tab: full item list, create/edit/delete, remote Mark Done
- [ ] WebSocket real-time sync: routine:completed broadcast
- [ ] Routine escalation: 30-min missed item → push notification to family
- [ ] Family Care Team tab: member list, role/permission management, invite
- [ ] Family More/Settings tab: patient profile view, notification prefs

### Phase 5 — Notifications & Deep-Links
- [ ] Expo Push Notification registration and token storage
- [ ] FCM/APNs push send service on backend
- [ ] Deep-link routing: missed routine → `/family/routine`
- [ ] Deep-link routing: SOS alert → family app focus (v2: `/family/map`)
- [ ] Background notification handling (app closed / backgrounded)

### Phase 6 — Polish & v1 Launch Prep
- [ ] Multi-network switcher (for family members in multiple networks)
- [ ] Patient account recovery flow design (Admin re-link to new phone number)
- [ ] Empty states for all screens
- [ ] Error handling and offline indicators
- [ ] `npx expo lint` — zero warnings
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npx expo-doctor` — all checks green
- [ ] End-to-end smoke test: Family onboard → Create Network → Invite Patient → Patient joins → Routine created → Alarm fires → Mark Done syncs → SOS triggers alert

---

*This document is the single source of truth for CareNet's v1 build. All implementation decisions must trace back to a choice recorded here. Any deviation, new decision, or scope change must be appended to the relevant section with a date.*
