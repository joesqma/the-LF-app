# AI Speedcubing Coach — Developer Specification (V1)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Audience](#2-target-audience)
3. [Tech Stack](#3-tech-stack)
4. [Authentication & Onboarding](#4-authentication--onboarding)
5. [Pages & Navigation](#5-pages--navigation)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Dashboard / Home
   - 6.2 Learn Section
   - 6.3 Timer
   - 6.4 AI Video Analysis
   - 6.5 Library
   - 6.6 Profile & Achievements
   - 6.7 Settings
7. [AI & Video Analysis Architecture](#7-ai--video-analysis-architecture)
8. [Gamification System](#8-gamification-system)
9. [Monetization & Tiers](#9-monetization--tiers)
10. [Database Schema](#10-database-schema)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Testing Plan](#12-testing-plan)
13. [V2 Scope (Parked Features)](#13-v2-scope-parked-features)

---

## 1. Product Overview

**Product Name:** Cubewise (working title)

An AI-powered speedcubing coaching web application that combines structured learning courses, a built-in solve timer, and video analysis to provide personalised coaching feedback. The core differentiator is AI feedback that feels tailored to the individual solver, not generic advice.

**Primary Events Supported (V1):** 3x3 only

**Solving Methods Supported (V1):** CFOP, Roux

---

## 2. Target Audience

- **Primary:** Intermediate to advanced speedcubers seeking personalised coaching and performance improvement
- **Secondary:** Complete beginners who want a structured path from zero to solving

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage (video uploads) |
| AI / Video Analysis | Google Gemini 1.5 Pro/Flash (video API) |
| AI Chat / Coaching | Anthropic Claude API (claude-sonnet-4-20250514) |
| Hosting | Vercel (recommended) |
| Styling | Tailwind CSS |

---

## 4. Authentication & Onboarding

### 4.1 Authentication

- Google OAuth via Supabase Auth
- Optional WCA profile link (manual input of WCA ID, fetched from WCA public API at `https://www.worldcubeassociation.org/api/v0/persons/{WCA_ID}`)
- WCA data stored in user profile but does not drive core analysis — used only for competition prep insights (consistency patterns, DNF inference)

### 4.2 Onboarding Flow

Triggered on first login. Questions are displayed one at a time, full-screen card UI.

**Question 1:** Can you solve a Rubik's Cube?
- Yes
- No (routes to "First Solve" beginner track on dashboard)

**Question 2 (if Yes):** What is your current 3x3 average?
- Under 2 minutes
- Sub-1 minute
- Sub-30 seconds
- Sub-15 seconds
- Sub-10 seconds
- I don't know

**Question 3:** What is your primary goal?
- Learn to solve for the first time
- Get faster (general improvement)
- Break a specific barrier (sub-X)
- Prepare for competition

**Question 4:** What solving method do you use?
- CFOP
- Roux
- Beginner method
- I don't know / Other

All answers stored in `user_profiles` table. Used to:
- Pre-select the AI recommended lesson on dashboard
- Set the default method context for video analysis
- Tailor AI coaching tone and complexity

---

## 5. Pages & Navigation

### Navigation Structure

Persistent sidebar or bottom nav with the following pages:

| Page | Route | Icon |
|---|---|---|
| Dashboard | `/` | Home |
| Learn | `/learn` | Book |
| Timer | `/timer` | Stopwatch |
| Analysis | `/analysis` | Video camera |
| Library | `/library` | Bookmark |
| Profile | `/profile` | User |
| Settings | `/settings` | Gear |

---

## 6. Feature Specifications

### 6.1 Dashboard / Home

The dashboard is intentionally minimal. It surfaces the most important next action for the user.

**Components:**
- **AI Recommended Lesson Card** — top of page, prominent. Pulls from the Learn section based on user profile and most recent analysis results. Shows lesson title, track (CFOP/Roux/Comp Prep), and an estimated duration.
- **Quick Stats Block** — only shown if the user has logged at least one session. Displays: current Ao5, Ao12, total solves logged, days active.
- **Quick Navigation Shortcuts** — icon cards linking to: Timer, Analysis, Learn. Clean and minimal.
- **"Don't Know Where to Start?" CTA** — shown to new users or users with no solves logged. Routes to:
  - Beginners (answered "No" to Q1 in onboarding) → First Solve lesson
  - Experienced users → choice between starting a video analysis or entering the Learn section

### 6.2 Learn Section

**Route:** `/learn`

Three structured tracks, each with a progressive curriculum:

#### Track 1: CFOP
Stages (in order):
1. Cross
2. F2L (each slot individually: FR, FL, BR, BL)
3. OLL (2-look OLL first, then full OLL)
4. PLL (2-look PLL first, then full PLL)
5. Advanced: F2L lookahead, cross efficiency, fingertrick optimisation, TPS training

#### Track 2: Roux
Stages (in order):
1. First Block (FB)
2. Second Square (SS)
3. Last Pair (LP)
4. CMLL
5. LSE (Edge Orientation, then UL/UR, then EP)
6. Advanced: Block building efficiency, LSE lookahead

#### Track 3: Competition Prep
Stages (in order):
1. Reading a WCA scorecard
2. Avoiding +2 penalties (inspection best practices)
3. Pre-competition routines
4. Handling nerves
5. Competing consistently (reading personal WCA result trends if WCA linked)
6. DNF prevention

**AI Highlight:**
- The AI recommends a specific lesson within a track based on onboarding answers and video analysis results.
- This is surfaced as a highlighted badge ("Recommended for you") on the relevant lesson card.
- Users are not locked to the recommendation — all lessons are freely accessible.

**Lesson Card Contents:**
- Title
- Short description
- Estimated time
- Curated YouTube video(s) embedded or linked
- Key tips (structured text)
- "Save to Library" button on each video

### 6.3 Timer

**Route:** `/timer`

Modelled after cstimer. Features for V1:

**Core Features:**
- Spacebar / touch hold-to-start timer
- Inspection countdown (15 seconds, WCA standard), with audio cue option
- WCA-legal scramble generation for 3x3 (use `scramble-utils` or `cstimer`'s scramble lib)
- Session management (create, rename, delete sessions)
- Per-solve: time, scramble, date/time, optional note
- Solve actions: delete, mark as DNF, mark as +2

**Statistics Displayed:**
- Current solve time
- Ao5, Ao12, Ao50, Ao100
- Session mean
- Session best single
- Best Ao5, Ao12 across session

**cstimer Import:**
- Accept `.json` export from cstimer
- Parse sessions and solves into the app's data model
- Map solve times, scrambles, timestamps, DNF/+2 flags

**Data Storage:**
- All solves stored in `solves` table in Supabase
- Linked to user and session

### 6.4 AI Video Analysis

**Route:** `/analysis`

This is the core feature of the product.

#### Upload Flow

1. User selects their solving method (CFOP or Roux) — pre-filled from profile but editable
2. User uploads a video file (mp4, mov, webm)
   - Max duration: 2 minutes
   - Max file size: 200MB (recommended)
   - Validation on client side before upload
3. Video is uploaded to Supabase Storage
4. A Supabase Edge Function (or Next.js API route) sends the video to Gemini 1.5 Pro/Flash via the File API
5. A structured prompt instructs Gemini to analyse the solve phase by phase

#### V1 Analysis Scope

**What the AI analyses:**
- Algorithm recognition (which algorithm was used in OLL/PLL or CMLL)
- Algorithm execution quality (hesitations, pauses, look-ahead into next phase)
- Phase timing (approximate time spent in each phase)
- General form observations at a high level

**What is explicitly out of scope for V1 (documented in UI):**
- Frame-precise finger trick detection
- Move-count optimisation
- Cross solution efficiency

#### Phase Breakdown

**CFOP:**
| Phase | What's Analysed |
|---|---|
| Cross | Time taken, whether solver pauses, inspection usage |
| F2L Pair 1–4 | Individual pair time, algorithm used if applicable, hesitation |
| OLL | Algorithm identified, execution fluency |
| PLL | Algorithm identified, execution fluency, AUF |

**Roux:**
| Phase | What's Analysed |
|---|---|
| First Block | Time, efficiency (high-level) |
| Second Square | Time, hesitation |
| Last Pair | Time |
| CMLL | Algorithm identified, execution |
| LSE | EO, UL/UR, EP — time and hesitation |

#### Analysis Report Format

The report is structured, not raw text. UI should render it as:

1. **Summary Card** — overall assessment, top 2–3 priorities to work on, estimated solve time breakdown
2. **Phase Breakdown** — collapsible sections per phase, each containing:
   - Phase time
   - What the AI observed
   - Specific timestamp reference (e.g., "0:04–0:07")
   - Recommended fix (text)
   - Linked curated video from the library (if applicable)
3. **Recommended Lessons** — 2–3 direct links into the Learn section based on the analysis

#### AI Chat Integration

- Below the report, a **"Chat with your coach"** button opens a chat interface
- The full analysis report is injected as system context
- The user can ask follow-up questions (e.g., "Why is my F2L recognition slow?", "What drill should I do for OLL?")
- Powered by Anthropic Claude API
- Chat history is stored per analysis session in `analysis_chats` table

#### Video Library Management
- All uploaded solve videos stored in Supabase Storage
- User can view history of past analyses at `/analysis/history`
- Each entry shows: date, method, thumbnail (first frame if possible), top recommendation

### 6.5 Library

**Route:** `/library`

A personal bookmarked video collection.

- Users can save any curated video from the Learn section or from an Analysis report
- Displayed as a grid of video cards: thumbnail, title, source (e.g., J Perm, CubeSkills), topic tag
- Filter by: method (CFOP/Roux), phase (Cross, F2L, OLL, etc.), topic
- Stored in `bookmarks` table in Supabase

### 6.6 Profile & Achievements

**Route:** `/profile`

**Profile Tab:**
- Display name, avatar (from Google)
- Onboarding answers (editable)
- WCA ID (optional, linkable/unlinkable)
- If WCA linked: display name, WCA profile link, best 3x3 single and average from WCA data
- Solving method preference

**Stats Tab:**
- Total solves logged
- Best single, best Ao5, best Ao12
- Total practice time
- Number of analyses uploaded
- Days active / streak

**Achievements Tab:**
- Grid of earned and locked badges
- XP progress bar and current level
- See Section 8 for full gamification spec

### 6.7 Settings

**Route:** `/settings`

- Dark mode / Light mode toggle (default: system preference)
- Timer preferences: inspection on/off, inspection audio on/off, hold-to-start duration
- Notification preferences (future)
- Linked accounts: Google, WCA
- Danger zone: delete account, delete all data

---

## 7. AI & Video Analysis Architecture

### 7.1 Video Upload Pipeline

```
Client
  → Validate file (duration ≤ 2 min, size ≤ 200MB, format check)
  → Upload to Supabase Storage (/videos/{user_id}/{uuid}.mp4)
  → Call Next.js API Route /api/analysis/create
      → Retrieve video from Supabase Storage
      → Upload to Gemini File API (files.upload)
      → Send analysis prompt to Gemini 1.5 Pro with file reference
      → Receive structured JSON response
      → Store result in `analyses` table
      → Return analysis ID to client
Client
  → Poll /api/analysis/{id} for status
  → Render report when complete
```

### 7.2 Gemini Prompt Design

The prompt sent to Gemini must:
- Specify the solving method (CFOP or Roux)
- Request a structured JSON response (not prose)
- Define the exact JSON schema expected
- List each phase and what to observe
- Instruct Gemini to include approximate timestamps
- Set clear V1 scope: do not attempt frame-precise fingertrick analysis

**Example prompt skeleton:**
```
You are an expert speedcubing coach analysing a 3x3 solve video.
The solver is using [METHOD].

Analyse the solve and return a JSON object with the following structure:
{
  "overall_summary": string,
  "total_time_estimate": string,
  "top_priorities": [string, string, string],
  "phases": [
    {
      "name": string,
      "timestamp_start": string,
      "timestamp_end": string,
      "algorithm_identified": string | null,
      "observations": string,
      "recommendation": string
    }
  ]
}

Focus on: algorithm recognition, execution hesitations, phase timing, look-ahead quality.
Do NOT attempt frame-precise finger trick analysis.
```

### 7.3 Claude Chat Integration

- System prompt for the chat is constructed by injecting the full analysis JSON
- Chat messages stored in `analysis_chats` with role (user/assistant), content, and timestamp
- Context window management: include full analysis + last N messages to stay within token limit

### 7.4 WCA Data Integration

- Fetch from: `https://www.worldcubeassociation.org/api/v0/persons/{WCA_ID}`
- Store: name, WCA ID, best single, best average, competition results (3x3 only for V1)
- Refresh: on profile load (max once per 24 hours, cache in Supabase)
- Competition Prep AI uses result arrays to infer consistency patterns

---

## 8. Gamification System

### 8.1 XP Sources

| Action | XP Awarded |
|---|---|
| Complete onboarding | 50 XP |
| Upload first video analysis | 100 XP |
| Upload each subsequent analysis | 30 XP |
| Complete a lesson | 25 XP |
| Log a solve on the timer | 2 XP |
| Hit a new PB (single) | 50 XP |
| Hit a new PB (Ao5) | 75 XP |
| Hit a new PB (Ao12) | 100 XP |
| 3-day practice streak | 30 XP |
| 7-day practice streak | 100 XP |
| Bookmark a video | 5 XP |
| Link WCA profile | 50 XP |

### 8.2 Levels

XP thresholds to be designed by developer (recommended: logarithmic curve). Display current level and XP to next level on profile.

### 8.3 Badge Examples (to be expanded in V2 detail spec)

| Badge | Trigger |
|---|---|
| First Steps | Complete onboarding |
| Cube Curious | Complete first lesson |
| On the Clock | Log first timer solve |
| Under the Lens | Upload first analysis |
| Sub-X Breaker | Hit a new PB tier |
| Week Warrior | 7-day streak |
| Algorithm Hunter | Identify 10 different algs in analysis |
| Method Master | Complete all lessons in one track |

Badges displayed as subtle icon cards — locked badges shown greyed out.

---

## 9. Monetization & Tiers

Three tiers:

| Feature | Free | Premium (Monthly/Annual) | Lifetime |
|---|---|---|---|
| Timer (unlimited) | ✅ | ✅ | ✅ |
| cstimer import | ✅ | ✅ | ✅ |
| Learn section (full) | ✅ | ✅ | ✅ |
| Video analyses per month | 3 | Unlimited | Unlimited |
| AI chat per analysis | Limited turns | Unlimited | Unlimited |
| Analysis history | Last 5 | Full history | Full history |
| Library bookmarks | 20 | Unlimited | Unlimited |
| WCA profile link | ✅ | ✅ | ✅ |
| Badge & XP system | ✅ | ✅ | ✅ |

Pricing values TBD. Payment via Stripe (recommended). Subscription status stored in `user_profiles`.

---

## 10. Database Schema

### `user_profiles`
```sql
id               uuid PRIMARY KEY REFERENCES auth.users(id)
display_name     text
avatar_url       text
wca_id           text NULLABLE
wca_data         jsonb NULLABLE
wca_last_fetched timestamptz NULLABLE
method           text  -- 'cfop' | 'roux' | 'beginner' | 'unknown'
current_average  text
primary_goal     text
knows_how_to_solve boolean
tier             text DEFAULT 'free'  -- 'free' | 'premium' | 'lifetime'
stripe_customer_id text NULLABLE
xp               integer DEFAULT 0
level            integer DEFAULT 1
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
```

### `solve_sessions`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES user_profiles(id)
name        text
created_at  timestamptz DEFAULT now()
```

### `solves`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid REFERENCES user_profiles(id)
session_id   uuid REFERENCES solve_sessions(id)
time_ms      integer  -- raw time in milliseconds
penalty      text NULLABLE  -- 'dnf' | '+2' | null
scramble     text
method       text
notes        text NULLABLE
created_at   timestamptz DEFAULT now()
```

### `analyses`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES user_profiles(id)
video_path      text  -- Supabase Storage path
method          text  -- 'cfop' | 'roux'
status          text  -- 'pending' | 'processing' | 'complete' | 'failed'
report          jsonb NULLABLE  -- structured Gemini response
created_at      timestamptz DEFAULT now()
```

### `analysis_chats`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
analysis_id uuid REFERENCES analyses(id)
user_id     uuid REFERENCES user_profiles(id)
role        text  -- 'user' | 'assistant'
content     text
created_at  timestamptz DEFAULT now()
```

### `bookmarks`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES user_profiles(id)
video_url   text
title       text
source      text  -- e.g. 'J Perm', 'CubeSkills'
topic_tag   text  -- e.g. 'OLL', 'F2L', 'CMLL'
method_tag  text NULLABLE  -- 'cfop' | 'roux' | null
created_at  timestamptz DEFAULT now()
```

### `badges`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES user_profiles(id)
badge_key   text  -- e.g. 'first_analysis', 'week_warrior'
earned_at   timestamptz DEFAULT now()
```

### `xp_events`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES user_profiles(id)
source      text  -- e.g. 'analysis_upload', 'new_pb_ao5'
xp_amount   integer
created_at  timestamptz DEFAULT now()
```

**Note:** Design schema with social features (leaderboards, shared analyses) in mind for V2 — add `is_public` columns where appropriate rather than retrofitting.

---

## 11. Error Handling Strategy

### Video Upload Errors
- File exceeds 2 minutes → client-side validation before upload, clear error message
- File format unsupported → validate on client, list accepted formats
- Upload fails mid-way → retry with exponential backoff (max 3 attempts), then surface error with option to retry manually
- Gemini analysis fails → mark analysis status as 'failed', notify user, do not charge analysis credit

### AI / API Errors
- Gemini returns malformed JSON → fallback prompt requesting retry; if repeated failure, store raw response and flag for manual review
- Claude chat API fails → surface "Coach is unavailable, try again" message, do not lose chat history
- WCA API unreachable → use cached data if available, otherwise skip WCA section silently

### Auth Errors
- Google OAuth failure → redirect to login with clear error
- Session expired → redirect to login, preserve intended destination

### Timer
- Session data not syncing → buffer locally in localStorage, sync when connection restored
- cstimer import parse failure → show specific error (e.g., "Unrecognised file format"), do not wipe existing data

### General
- All API routes return consistent error shape: `{ error: string, code: string }`
- Client displays user-friendly messages — never expose raw API errors
- Log errors server-side (use Vercel logs or integrate Sentry)

---

## 12. Testing Plan

### Unit Tests
- Scramble generation (valid WCA scrambles, correct length)
- Solve time calculation (correct handling of DNF, +2)
- Ao5/Ao12/Ao100 calculation (including DNF edge cases)
- cstimer JSON parser (handles all known cstimer export formats)
- XP calculation functions
- WCA result consistency inference logic

### Integration Tests
- Auth flow: Google login → onboarding → dashboard
- Video upload → Supabase Storage → Gemini API → report rendered
- Analysis chat: context injection, message persistence
- cstimer import: full session data round-trip
- Badge award triggers fire correctly on qualifying actions
- Tier gating: free user blocked at 4th analysis upload

### End-to-End Tests (Playwright recommended)
- New user full flow: signup → onboarding → dashboard → first timer solve → first analysis → chat with coach
- Beginner flow: signup → "No" on Q1 → dashboard CTA → First Solve lesson
- Premium upgrade flow: hit free limit → upsell modal → upgrade → limit removed
- WCA link flow: enter WCA ID → data fetched and displayed on profile

### Manual QA Checklist
- [ ] Dark mode / light mode renders correctly on all pages
- [ ] Timer works on all major browsers (Chrome, Firefox, Safari)
- [ ] Video upload works for mp4, mov, webm
- [ ] Analysis report renders correctly for both CFOP and Roux
- [ ] Bookmarking a video persists after page reload
- [ ] All onboarding paths route correctly
- [ ] Solve deletion correctly recalculates stats
- [ ] Free tier limits enforced correctly across sessions

### Performance
- Video upload should not block UI (show progress indicator)
- Analysis polling should use reasonable intervals (e.g., every 3 seconds)
- Timer must have sub-10ms response time — no async operations on start/stop

---

## 13. V2 Scope (Parked Features)

The following features were discussed and deliberately deferred to V2:

- **Additional WCA events:** 2x2, 4x4, one-handed, blindfolded
- **Precise fingertrick analysis:** Requires specialised computer vision model (e.g., Modal-hosted custom CV pipeline)
- **Social / community features:** Leaderboards, shared analyses, friend comparisons
- **Mobile app:** React Native or PWA
- **Custom AI-generated training plans:** Daily drills generated from analysis patterns
- **Multiple method support in timer:** Roux-specific stats (e.g., move count)
- **Expanded gamification:** Detailed badge taxonomy, seasonal challenges, XP leaderboards

---

*Specification compiled April 2026. All feature decisions confirmed through iterative product discovery session.*
