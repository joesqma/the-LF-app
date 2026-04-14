# CubeCoach AI — Implementation Blueprint & LLM Prompts

---

## Part 1: High-Level Blueprint

The project is built in six phases, each producing a fully working slice of the app before the next phase begins. No phase leaves orphaned code.

### Phase 1 — Project Foundation
Set up Next.js, Supabase, authentication, global layout, dark/light mode, and routing skeleton.

### Phase 2 — Onboarding & User Profiles
Build the onboarding questionnaire flow, user profile table, and profile page.

### Phase 3 — Timer
Build the full solve timer: scrambles, sessions, stats, cstimer import.

### Phase 4 — Learn Section
Build the structured course tracks (CFOP, Roux, Competition Prep) with curated video content and lesson pages.

### Phase 5 — AI Video Analysis
Build the video upload pipeline, Gemini analysis, structured report UI, and Claude chat integration.

### Phase 6 — Gamification, Library & Polish
Build XP/badges, bookmarks library, achievements page, dashboard AI recommendation, and final wiring.

---

## Part 2: Iterative Chunks

### Phase 1 Chunks
- 1A: Initialise Next.js project with Tailwind, folder structure, environment variables
- 1B: Supabase project setup — client, types, initial schema migration
- 1C: Google OAuth via Supabase Auth — login page, session handling, protected routes
- 1D: Global layout — sidebar nav, dark/light mode toggle, page shell

### Phase 2 Chunks
- 2A: `user_profiles` table + Supabase trigger to auto-create on signup
- 2B: Onboarding question flow UI (one question at a time, card animation)
- 2C: Save onboarding answers to `user_profiles`
- 2D: Profile page — display info, edit method/goal, link WCA ID, fetch WCA data

### Phase 3 Chunks
- 3A: Timer core — hold-to-start, spacebar, display, inspection countdown
- 3B: Scramble generation (3x3 WCA scrambles)
- 3C: Session management — create, rename, delete sessions; store solves in Supabase
- 3D: Stats calculation — Ao5, Ao12, Ao50, Ao100, best single, session mean
- 3E: cstimer JSON import — parse and insert into sessions/solves tables
- 3F: Solve management — delete, DNF, +2 actions; stats recalculation

### Phase 4 Chunks
- 4A: Learn page layout — three track cards (CFOP, Roux, Comp Prep)
- 4B: CFOP track — lesson list with stage progression, lesson detail page
- 4C: Roux track — lesson list with stage progression, lesson detail page
- 4D: Competition Prep track — lesson list, lesson detail page
- 4E: "Save to Library" button wired to `bookmarks` table (stub for Phase 6)

### Phase 5 Chunks
- 5A: Supabase Storage setup for videos; `analyses` table migration
- 5B: Video upload UI — file picker, validation (duration ≤ 2 min, size ≤ 200MB), upload to Supabase Storage
- 5C: Next.js API route — retrieve video, send to Gemini, store structured JSON result
- 5D: Analysis report UI — summary card, phase breakdown sections, timestamps
- 5E: `analysis_chats` table; Claude chat UI wired to analysis context
- 5F: Analysis history page — past uploads, status, link to report

### Phase 6 Chunks
- 6A: `xp_events` and `badges` tables; XP award helper function
- 6B: Wire XP triggers to existing actions (solve logged, analysis uploaded, lesson completed, PB hit)
- 6C: Achievements/badges UI on profile page
- 6D: Library page — bookmarks grid, filter by method/phase/topic
- 6E: Dashboard wiring — AI recommended lesson card, stats block, "don't know where to start?" CTA
- 6F: Free tier gating — analysis upload limit, chat turn limit, bookmark limit

---

## Part 3: Step-Level Breakdown (Right-Sized)

Each step below is scoped to be completable in one focused coding session, produces testable output, and integrates cleanly before the next step starts.

```
1A-1: npx create-next-app with TypeScript, Tailwind, App Router, src/ directory
1A-2: Install dependencies: @supabase/supabase-js, @supabase/ssr, lucide-react, clsx
1A-3: Set up .env.local with SUPABASE_URL, SUPABASE_ANON_KEY, placeholders for Gemini/Anthropic keys
1A-4: Define folder structure: /app, /components, /lib, /types, /hooks, /utils

1B-1: Create Supabase project, enable Google OAuth provider in dashboard
1B-2: Write initial SQL migration: user_profiles table with all columns from spec
1B-3: Write migrations for: solve_sessions, solves, analyses, analysis_chats, bookmarks, badges, xp_events
1B-4: Generate TypeScript types from Supabase schema (supabase gen types)
1B-5: Create /lib/supabase/client.ts (browser client) and /lib/supabase/server.ts (server client)

1C-1: Create /app/login/page.tsx with Google sign-in button using Supabase Auth
1C-2: Create /app/auth/callback/route.ts to handle OAuth redirect
1C-3: Create middleware.ts to protect all routes except /login and /auth/*
1C-4: Create useUser() hook that reads session from Supabase

1D-1: Create root layout.tsx with HTML shell, ThemeProvider (next-themes), font
1D-2: Create Sidebar component with nav links and icons (collapsed on mobile placeholder)
1D-3: Create ThemeToggle component wired to next-themes
1D-4: Create page shell wrapper component (PageShell) with consistent padding/max-width
1D-5: Create skeleton pages (just h1 headings) for all 7 routes so nav links work

2A-1: Write Supabase DB trigger (SQL) to insert into user_profiles on auth.users insert
2A-2: Write server action: updateUserProfile(data) that upserts to user_profiles
2A-3: Write server action: getUserProfile() that fetches current user's profile

2B-1: Create OnboardingProvider context that tracks current question index and answers
2B-2: Create OnboardingCard component — full-screen card with question text and option buttons
2B-3: Create /app/onboarding/page.tsx — render questions one at a time with slide animation
2B-4: Add guard: if user_profiles.method is already set, redirect to dashboard on /onboarding

2C-1: On final onboarding answer, call updateUserProfile with all collected answers
2C-2: Set onboarding_complete flag in user_profiles
2C-3: Redirect to /dashboard after completion
2C-4: In middleware, check onboarding_complete — redirect to /onboarding if not done

2D-1: Create /app/profile/page.tsx — display name, avatar, method, goal from profile
2D-2: Add edit form for method and primary_goal fields
2D-3: Add WCA ID input field with "Link" button
2D-4: Create /api/wca/route.ts — fetch WCA data for a given WCA ID and return it
2D-5: On link, call WCA API, store result in user_profiles.wca_data, display name and best results

3A-1: Create /app/timer/page.tsx with basic layout
3A-2: Create TimerDisplay component — large monospace time display
3A-3: Create useTimer hook — hold-to-start logic (300ms hold), spacebar listener, running/stopped state
3A-4: Create InspectionCountdown component — 15s countdown, colour changes at 8s and 12s, audio cue option

3B-1: Install scramble-utils or port a minimal 3x3 scramble generator
3B-2: Create ScrambleDisplay component — shows current scramble above timer
3B-3: Auto-generate new scramble after each solve is saved

3C-1: Create SessionSelector component — dropdown to select or create a session
3C-2: Create server action: createSession(), getSessions(), deleteSession()
3C-3: Create server action: saveSolve(sessionId, timeMs, scramble, penalty)
3C-4: Wire timer stop to saveSolve() call; show saved confirmation

3D-1: Create /utils/stats.ts — calculateAo(times, n) function handling DNF edge cases
3D-2: Create StatsBar component — displays Ao5, Ao12, Ao100, best single, session mean
3D-3: Create SolveList component — scrollable list of all solves in current session with time, penalty indicator
3D-4: Wire stats to update reactively when a new solve is saved

3E-1: Create /utils/cstimer-parser.ts — parse cstimer JSON export format into internal solve shape
3E-2: Create ImportButton component — file input for .json, calls parser, previews session count
3E-3: Create server action: importSolves(sessions[]) — batch insert into DB
3E-4: Show import success summary (X sessions, Y solves imported)

3F-1: Add solve context menu — right-click or long-press: Delete, Mark DNF, Mark +2
3F-2: Create server actions: deleteSolve(), updateSolvePenalty()
3F-3: Recalculate stats client-side after any solve modification
3F-4: Add confirm dialog for delete action

4A-1: Create /app/learn/page.tsx — three track cards with title, description, progress indicator
4A-2: Create TrackCard component — icon, title, lesson count, progress bar (% complete based on completed_lessons)
4A-3: Create completed_lessons column in user_profiles (jsonb array of lesson IDs)

4B-1: Define CFOP lesson data in /lib/content/cfop.ts — array of lesson objects (id, title, description, videoUrls, tips, phase)
4B-2: Create /app/learn/cfop/page.tsx — list of lessons grouped by phase with lock/unlock logic (sequential)
4B-3: Create /app/learn/cfop/[lessonId]/page.tsx — lesson detail: title, embedded YouTube video(s), tips, mark complete button
4B-4: "Mark Complete" calls server action that appends lesson ID to completed_lessons

4C-1: Define Roux lesson data in /lib/content/roux.ts
4C-2: Create /app/learn/roux/page.tsx — same pattern as CFOP
4C-3: Create /app/learn/roux/[lessonId]/page.tsx — lesson detail page

4D-1: Define Competition Prep lesson data in /lib/content/comp-prep.ts
4D-2: Create /app/learn/comp-prep/page.tsx and [lessonId]/page.tsx

4E-1: Add SaveToLibrary button component to lesson detail pages
4E-2: Button calls server action: saveBookmark(videoUrl, title, source, topicTag, methodTag)
4E-3: Button shows saved/unsaved state based on bookmarks query

5A-1: Create Supabase Storage bucket: "solve-videos" with private access policy
5A-2: Confirm analyses table migration is in place; add status enum check constraint

5B-1: Create /app/analysis/page.tsx — upload area with method selector (CFOP/Roux), pre-filled from profile
5B-2: Create VideoUploader component — drag-and-drop or file picker, client-side validation (type, size)
5B-3: Validate video duration client-side using HTMLVideoElement before upload
5B-4: Upload file to Supabase Storage at /videos/{userId}/{uuid}, insert pending row in analyses table

5C-1: Create /app/api/analysis/create/route.ts — POST handler: receive analysisId, retrieve video from Storage
5C-2: Upload video to Gemini File API using @google/generative-ai SDK
5C-3: Send structured analysis prompt to Gemini 1.5 Flash with video reference
5C-4: Parse and validate Gemini JSON response against expected schema
5C-5: Store result in analyses.report, set status to 'complete' (or 'failed')
5C-6: Create /app/api/analysis/[id]/route.ts — GET handler to poll analysis status

5D-1: Create /app/analysis/[id]/page.tsx — poll status every 3s, show loading skeleton
5D-2: Create AnalysisSummaryCard component — overall summary, top 3 priorities, estimated time breakdown
5D-3: Create PhaseBreakdown component — collapsible accordion per phase, timestamp, observations, recommendation
5D-4: Create RecommendedLessons component — 2-3 linked lesson cards from analysis results

5E-1: Create ChatPanel component — message list, text input, send button
5E-2: Create /app/api/analysis/[id]/chat/route.ts — POST handler: load analysis report + chat history, call Claude API, save assistant message
5E-3: Wire ChatPanel to API route; persist messages to analysis_chats table; show "Chat with your coach" button below report

5F-1: Create /app/analysis/history/page.tsx — list of past analyses: date, method, status badge, link to report
5F-2: Create AnalysisCard component for history list
5F-3: Add navigation link to history from analysis page

6A-1: Create /lib/xp.ts — awardXP(userId, source, amount) function that inserts to xp_events and updates user_profiles.xp
6A-2: Create getLevel(xp) utility using defined XP threshold table
6A-3: Create checkAndAwardBadge(userId, badgeKey) — idempotent, checks if already earned before inserting

6B-1: Wire awardXP to: saveSolve() — 2 XP per solve
6B-2: Wire awardXP to: video analysis complete — 30/100 XP
6B-3: Wire awardXP to: lesson marked complete — 25 XP
6B-4: Wire awardXP + badge check to: new PB detection after solve saved (compare against user's stored best)
6B-5: Wire awardXP to: streak detection (check last solve date on each save, award if 3 or 7 day streak)

6C-1: Create /app/profile/achievements/page.tsx (tab within profile)
6C-2: Create BadgeGrid component — all defined badges, earned ones highlighted, locked ones greyed
6C-3: Create XPProgressBar component — current level, XP to next level
6C-4: Add XP/level display to Sidebar (small indicator under user avatar)

6D-1: Create /app/library/page.tsx — fetch user bookmarks
6D-2: Create BookmarkCard component — thumbnail (YouTube preview), title, source, topic tag
6D-3: Add filter bar — method filter (CFOP/Roux/All), phase filter (dynamic from bookmark tags)
6D-4: Add remove bookmark action from library page

6E-1: Create getRecommendedLesson(userProfile, recentAnalysis) server function — maps profile + analysis to a lesson ID
6E-2: Create RecommendedLessonCard component for dashboard
6E-3: Create QuickStatsBlock component — Ao5, Ao12, total solves (only if solves > 0)
6E-4: Create DontKnowCTA component — routes based on knows_how_to_solve flag
6E-5: Assemble /app/dashboard/page.tsx with all components, make it the root redirect after auth

6F-1: Create /lib/tier.ts — helper functions: canUploadAnalysis(userId), canChat(analysisId, userId), canBookmark(userId)
6F-2: Wire canUploadAnalysis check to upload flow — show upsell modal if limit reached
6F-3: Wire canChat check to chat API route — return 403 with upsell flag if limit reached
6F-4: Create UpsellModal component — explains limits, links to pricing page (pricing page is static placeholder for V1)
6F-5: Create /app/settings/page.tsx — theme toggle, timer prefs, linked accounts display, danger zone (delete account)
```

---

## Part 4: LLM Prompts

Each prompt below is self-contained, references what was built in the previous step, and ends by wiring new code into the running app.

---

### PROMPT 1 — Project Initialisation & Folder Structure

```
You are building a Next.js 14 web application called CubeCoach AI — an AI-powered speedcubing coaching platform. Use the App Router, TypeScript, and Tailwind CSS.

Your task is step 1A: project initialisation.

1. Scaffold a new Next.js 14 project with:
   - TypeScript
   - Tailwind CSS
   - App Router (src/ directory structure)
   - ESLint

2. Install these additional dependencies:
   - @supabase/supabase-js
   - @supabase/ssr
   - lucide-react
   - clsx
   - next-themes
   - @google/generative-ai

3. Set up the following folder structure under src/:
   - /app — Next.js routes
   - /components — reusable UI components
   - /lib — Supabase clients, AI helpers, content data
   - /types — TypeScript types
   - /hooks — custom React hooks
   - /utils — pure utility functions

4. Create a .env.local file with these placeholder keys:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   GEMINI_API_KEY=
   ANTHROPIC_API_KEY=

5. Create /src/types/database.ts as an empty placeholder file with a comment: "Supabase generated types will go here."

6. Create /src/lib/supabase/client.ts — browser-side Supabase client using createBrowserClient from @supabase/ssr:
   - Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Exports a createClient() function

7. Create /src/lib/supabase/server.ts — server-side Supabase client using createServerClient from @supabase/ssr:
   - Reads cookies from next/headers
   - Exports an async createClient() function

8. Confirm the dev server starts with no errors.

Do not build any UI beyond what is needed. No placeholder pages yet.
```

---

### PROMPT 2 — Database Schema & Migrations

```
Continuing CubeCoach AI. The Next.js project is scaffolded with Supabase clients set up.

Your task is step 1B: define the full database schema.

Write a single SQL migration file at /supabase/migrations/001_initial_schema.sql that creates the following tables exactly as specified. Use uuid_generate_v4() for IDs. Enable the uuid-ossp extension at the top.

Tables to create:

1. user_profiles
   - id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
   - display_name text
   - avatar_url text
   - wca_id text
   - wca_data jsonb
   - wca_last_fetched timestamptz
   - method text CHECK (method IN ('cfop', 'roux', 'beginner', 'unknown'))
   - current_average text
   - primary_goal text
   - knows_how_to_solve boolean DEFAULT false
   - onboarding_complete boolean DEFAULT false
   - tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'lifetime'))
   - stripe_customer_id text
   - xp integer DEFAULT 0
   - level integer DEFAULT 1
   - completed_lessons jsonb DEFAULT '[]'
   - created_at timestamptz DEFAULT now()
   - updated_at timestamptz DEFAULT now()

2. solve_sessions
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - name text NOT NULL
   - created_at timestamptz DEFAULT now()

3. solves
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - session_id uuid REFERENCES solve_sessions(id) ON DELETE CASCADE NOT NULL
   - time_ms integer NOT NULL
   - penalty text CHECK (penalty IN ('dnf', '+2', null))
   - scramble text
   - method text
   - notes text
   - created_at timestamptz DEFAULT now()

4. analyses
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - video_path text
   - method text CHECK (method IN ('cfop', 'roux'))
   - status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed'))
   - report jsonb
   - created_at timestamptz DEFAULT now()

5. analysis_chats
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE NOT NULL
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - role text CHECK (role IN ('user', 'assistant')) NOT NULL
   - content text NOT NULL
   - created_at timestamptz DEFAULT now()

6. bookmarks
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - video_url text NOT NULL
   - title text NOT NULL
   - source text
   - topic_tag text
   - method_tag text
   - created_at timestamptz DEFAULT now()

7. badges
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - badge_key text NOT NULL
   - earned_at timestamptz DEFAULT now()
   - UNIQUE(user_id, badge_key)

8. xp_events
   - id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
   - user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
   - source text NOT NULL
   - xp_amount integer NOT NULL
   - created_at timestamptz DEFAULT now()

After all table definitions, write a Postgres function and trigger that automatically inserts a row into user_profiles when a new row is inserted into auth.users. The trigger should copy id, raw_user_meta_data->>'full_name' as display_name, and raw_user_meta_data->>'avatar_url' as avatar_url.

Enable Row Level Security on all tables. Write RLS policies for each table so that users can only SELECT, INSERT, UPDATE, DELETE their own rows (using auth.uid() = user_id or auth.uid() = id).

Also write the SQL to create a Supabase Storage bucket named 'solve-videos' with private access.

After writing the migration, update /src/types/database.ts with the full TypeScript type definitions for all tables (as a Database interface compatible with the Supabase client generic).
```

---

### PROMPT 3 — Authentication

```
Continuing CubeCoach AI. Database schema is defined, Supabase clients exist.

Your task is step 1C: implement Google OAuth authentication.

1. Create /src/app/login/page.tsx:
   - Clean centred card UI
   - App name "CubeCoach AI" as heading
   - Tagline: "Your personal AI speedcubing coach"
   - A single "Continue with Google" button using lucide-react's Chrome icon
   - On click, calls supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })
   - The page should respect dark/light mode

2. Create /src/app/auth/callback/route.ts:
   - GET handler
   - Exchanges the code from search params for a session using supabase.auth.exchangeCodeForSession(code)
   - On success, redirects to /dashboard
   - On error, redirects to /login?error=auth_failed

3. Create /src/middleware.ts:
   - Uses @supabase/ssr to read the session from cookies
   - Protects all routes except: /login, /auth/callback, and any /api/auth/* routes
   - If unauthenticated and not on a public route, redirect to /login
   - If authenticated and on /login, redirect to /dashboard
   - Refreshes the session cookie on every request

4. Create /src/hooks/useUser.ts:
   - Client-side hook
   - Returns { user, profile, loading } where profile comes from a query to user_profiles
   - Uses the browser Supabase client
   - Subscribes to onAuthStateChange to keep state fresh

Wire up: confirm that visiting any route while unauthenticated redirects to /login, and that after Google login the user lands on /dashboard (even as a blank page for now).
```

---

### PROMPT 4 — Global Layout & Navigation Shell

```
Continuing CubeCoach AI. Auth is working. Users land on /dashboard after login.

Your task is step 1D: build the global layout and navigation.

Design philosophy: clean, minimal, educational feel (similar to Khan Academy structure but more subdued). Light mode default with dark mode support via next-themes. Use Tailwind CSS throughout. No bold colours dominating — the mode (light/dark) is the primary palette.

1. Create /src/app/layout.tsx (root layout):
   - Wrap everything in a ThemeProvider from next-themes (attribute="class", defaultTheme="system")
   - Use Inter or Geist font from next/font
   - Include global CSS (Tailwind base)

2. Create /src/components/layout/Sidebar.tsx:
   - Fixed left sidebar on desktop
   - Navigation links with icons (lucide-react) for:
     - Dashboard (/dashboard) — Home icon
     - Learn (/learn) — BookOpen icon
     - Timer (/timer) — Timer icon
     - Analysis (/analysis) — Video icon
     - Library (/library) — Bookmark icon
     - Profile (/profile) — User icon
     - Settings (/settings) — Settings icon
   - Active link highlighted with a subtle background
   - User avatar + name at the bottom of the sidebar (from useUser hook)
   - Small XP indicator under the avatar (just "0 XP" placeholder for now)
   - Sign out button at the very bottom

3. Create /src/components/layout/ThemeToggle.tsx:
   - Icon button that switches between light/dark using next-themes
   - Sun icon for light, Moon icon for dark
   - Place it at the top of the sidebar

4. Create /src/components/layout/PageShell.tsx:
   - Wrapper component with consistent max-width, padding, and top heading area
   - Props: title (string), subtitle (string optional), children

5. Create /src/app/(app)/layout.tsx (authenticated layout):
   - Renders Sidebar + main content area side by side
   - All authenticated pages live under this route group

6. Create skeleton pages (just PageShell with an h1) for all routes:
   - /app/(app)/dashboard/page.tsx
   - /app/(app)/learn/page.tsx
   - /app/(app)/timer/page.tsx
   - /app/(app)/analysis/page.tsx
   - /app/(app)/library/page.tsx
   - /app/(app)/profile/page.tsx
   - /app/(app)/settings/page.tsx

Wire up: all nav links should navigate correctly. The active state should reflect the current route. Dark mode toggle should work immediately.
```

---

### PROMPT 5 — Onboarding Flow

```
Continuing CubeCoach AI. Layout and auth are complete.

Your task is steps 2B–2C: build the onboarding questionnaire flow.

The onboarding runs after a user's first login, before they see the dashboard. It asks questions one at a time in a full-screen card format, collects answers, and saves them to user_profiles.

1. Create /src/app/onboarding/page.tsx:
   - Full-screen layout (no sidebar) — separate from the (app) route group
   - Renders one question at a time
   - Smooth fade or slide transition between questions
   - Progress indicator (e.g., "Step 2 of 4") at the top

2. Define the four questions as a config array in /src/lib/onboarding-questions.ts:

   Question 1: "Can you solve a Rubik's Cube?"
   Options: ["Yes", "No"]

   Question 2: "What is your current 3x3 average?" (shown only if Q1 = Yes)
   Options: ["Under 2 minutes", "Sub-1 minute", "Sub-30 seconds", "Sub-15 seconds", "Sub-10 seconds", "I don't know"]

   Question 3: "What is your primary goal?"
   Options: ["Learn to solve for the first time", "Get faster (general improvement)", "Break a specific barrier", "Prepare for competition"]

   Question 4: "What solving method do you use?"
   Options: ["CFOP", "Roux", "Beginner method", "I don't know"]

3. Create /src/components/onboarding/OnboardingCard.tsx:
   - Displays the question text prominently
   - Renders answer options as large clickable button cards (full width, with hover state)
   - On click, records the answer and advances to the next question

4. On completing the final question:
   - Call a server action: saveOnboardingAnswers(answers)
   - The action upserts to user_profiles: method, current_average, primary_goal, knows_how_to_solve, onboarding_complete = true
   - Redirect to /dashboard

5. Update /src/middleware.ts:
   - After confirming the user is authenticated, check if onboarding_complete is true in user_profiles
   - If false and not already on /onboarding, redirect to /onboarding
   - If true and on /onboarding, redirect to /dashboard

Wire up: new users should always hit onboarding before the dashboard. Existing users with onboarding_complete = true should never see onboarding again.
```

---

### PROMPT 6 — Profile Page & WCA Integration

```
Continuing CubeCoach AI. Onboarding is complete and saves to user_profiles.

Your task is step 2D: build the profile page with WCA linking.

1. Create /src/app/(app)/profile/page.tsx:
   - Use PageShell with title "Profile"
   - Three tabs: "Profile", "Stats", "Achievements" (Achievements tab is a placeholder for now)
   - Default to "Profile" tab

2. Profile tab contents:
   - Avatar (from Google, displayed as circular image)
   - Display name
   - Read-only: email from auth session
   - Editable fields: Method (select: CFOP/Roux/Beginner/Unknown), Primary Goal (select from onboarding options)
   - "Save changes" button that calls updateUserProfile server action

3. WCA Linking section (within Profile tab):
   - If not linked: input field for WCA ID + "Link WCA Profile" button
   - If linked: show WCA display name, WCA ID, best 3x3 single and average from wca_data, "Unlink" button

4. Create /src/app/api/wca/route.ts:
   - GET handler, takes ?wca_id= query param
   - Fetches https://www.worldcubeassociation.org/api/v0/persons/{wca_id}
   - Returns relevant fields: name, wca_id, personal_records (333 event only: single best, average best), competition results (last 10, 333 only)
   - Returns 404 with { error: 'WCA profile not found' } if the person doesn't exist

5. Create server action: linkWCAProfile(wcaId):
   - Calls the WCA API route
   - Stores full response in user_profiles.wca_data
   - Sets user_profiles.wca_id and wca_last_fetched = now()

6. Create server action: unlinkWCAProfile():
   - Clears wca_id, wca_data, wca_last_fetched in user_profiles

7. Stats tab contents (all data from Supabase queries):
   - Total solves logged
   - Best single (fastest solve with no DNF)
   - Best Ao5, best Ao12 (calculate from all solves across all sessions)
   - Total sessions
   - Member since date

Wire up: all changes must persist immediately. WCA data must display after linking without page reload.
```

---

### PROMPT 7 — Timer Core

```
Continuing CubeCoach AI. Profile page is complete.

Your task is step 3A–3B: build the core timer with scramble generation.

The timer is the most performance-sensitive part of the app. No async operations must happen between spacebar down and time start, or between spacebar up and time stop. All DB writes happen after the time is captured.

1. Create /src/utils/timer.ts:
   - formatTime(ms: number): string — converts milliseconds to "M:SS.ss" or "SS.ss" format

2. Create /src/hooks/useTimer.ts:
   - States: idle | holding | inspection | running | stopped
   - On spacebar down (keydown): if idle or stopped, start 300ms hold timer; change display to green
   - On spacebar up (keyup): if held ≥ 300ms, begin inspection (if enabled) or start timer; if held < 300ms, cancel
   - During inspection: countdown from 15; at 8s change colour to yellow; at 12s change to red; at 0 auto-start timer
   - On spacebar down while running: stop timer, record time_ms
   - Returns: { displayTime, phase, startTimer, stopTimer, resetTimer }
   - Also supports touch events (touchstart/touchend on a target element) for mobile compatibility

3. Create /src/components/timer/TimerDisplay.tsx:
   - Large centred monospace number (use tabular-nums font feature)
   - Colour changes based on phase: default → green (holding) → yellow/red (inspection) → white/default (running)
   - Shows "READY" when idle, inspection countdown when inspecting, time when running/stopped

4. Create /src/utils/scramble.ts:
   - Implement a WCA-legal 3x3 scramble generator in TypeScript
   - Generates random-state-style or at minimum a shuffled 20-move scramble with no redundant moves (no R R, no R L R patterns)
   - Returns a string like "R U R' F2 D' L U2 ..."

5. Create /src/components/timer/ScrambleDisplay.tsx:
   - Displays the current scramble above the timer in monospace text
   - "New Scramble" icon button to manually regenerate

6. Assemble /src/app/(app)/timer/page.tsx:
   - ScrambleDisplay at top
   - TimerDisplay centred
   - Wire spacebar/touch to useTimer
   - Generate a new scramble automatically after each solve is stopped

Wire up: the timer should be fully functional as a standalone stop watch with scrambles before any DB integration.
```

---

### PROMPT 8 — Timer Sessions & Solve Storage

```
Continuing CubeCoach AI. Timer core is working with scramble generation.

Your task is steps 3C–3D: add session management and solve persistence.

1. Create /src/lib/actions/timer.ts (server actions):
   - getSessions(userId): returns all sessions for the user, ordered by created_at desc
   - createSession(userId, name): inserts new session, returns the new session row
   - deleteSession(sessionId): deletes session and all its solves (cascade handles this)
   - saveSolve(sessionId, userId, timeMs, scramble, penalty?): inserts solve row, returns the new solve
   - getSolves(sessionId): returns all solves for a session ordered by created_at desc
   - deleteSolve(solveId): deletes a single solve
   - updateSolvePenalty(solveId, penalty): updates penalty field ('+2' | 'dnf' | null)

2. Create /src/components/timer/SessionSelector.tsx:
   - Dropdown showing current session name
   - "+" button to create new session (prompts for name with a simple inline input)
   - List of existing sessions to switch between
   - Trash icon to delete current session (with confirmation)

3. Create /src/utils/stats.ts:
   - effectiveTime(solve): returns Infinity for DNF, time_ms + 2000 for +2, time_ms otherwise
   - calculateAo(solves, n): returns the average of n, dropping best and worst, returning Infinity if any DNF in window makes it invalid (standard WCA rules: Ao5 with 2+ DNFs = DNF)
   - calculateBest(solves): returns lowest effectiveTime

4. Create /src/components/timer/StatsBar.tsx:
   - Horizontally scrollable row of stat pills
   - Shows: Single (last solve), Ao5, Ao12, Ao50, Ao100, Best, Session Mean
   - Each pill shows label + value; DNF displayed as "DNF"
   - Updates after every new solve

5. Create /src/components/timer/SolveList.tsx:
   - Scrollable list below the stats bar
   - Each row: solve number, formatted time, penalty badge (DNF/+2 if applicable), scramble (truncated, expand on click)
   - Right-click or "..." menu per row: Delete, Mark as DNF, Remove Penalty, Mark as +2
   - Optimistic UI updates on penalty change

6. Wire everything into /src/app/(app)/timer/page.tsx:
   - On timer stop: call saveSolve() with current time and scramble
   - After save: refresh SolveList and StatsBar
   - SessionSelector at the top right
   - SolveList below the timer/stats area
   - Auto-create a "Default Session" if the user has no sessions

Wire up: a complete solve cycle — time a solve, see it appear in the list, stats update correctly, session switching works.
```

---

### PROMPT 9 — Timer: cstimer Import & Solve Actions

```
Continuing CubeCoach AI. Timer with sessions and solve storage is working.

Your task is steps 3E–3F: cstimer import and solve management actions.

1. Create /src/utils/cstimer-parser.ts:
   - cstimer exports JSON in this format:
     { "session1": { "name": "...", "opt": {...}, "scrambles": [...], "date": [...], "result": [...] }, ... }
   - Each result is [time_ms, penalty] where penalty: 0 = clean, -1 = DNF, 2000 = +2
   - Parse this into an array of: { sessionName: string, solves: { timeMs, scramble, penalty, createdAt }[] }
   - Handle edge cases: missing fields, corrupted entries (skip and continue), empty sessions

2. Create /src/lib/actions/import.ts:
   - importFromCsTimer(userId, parsedData): 
     - For each parsed session, create a new solve_session row with the name + " (imported)"
     - Batch insert all solves for that session
     - Return summary: { sessionsCreated, solvesImported, errors }

3. Create /src/components/timer/ImportButton.tsx:
   - "Import cstimer data" button (small, secondary style)
   - Opens a file picker (accept=".json")
   - On file select: read and parse the JSON using cstimer-parser
   - Show a preview modal: "Found X sessions, Y total solves — Import all?"
   - On confirm: call importFromCsTimer action, show success toast with summary
   - On error: show error toast with specific message

4. Add solve actions to SolveList (from previous step):
   - Delete: calls deleteSolve(), removes from list optimistically
   - Mark as DNF: calls updateSolvePenalty(id, 'dnf'), updates row
   - Mark as +2: calls updateSolvePenalty(id, '+2'), updates row, adjusts displayed time (shows time+2)
   - Remove Penalty: calls updateSolvePenalty(id, null)
   - After any action, recalculate and re-render StatsBar

5. Create /src/components/ui/ConfirmDialog.tsx:
   - Reusable modal with title, description, confirm button (destructive style for deletes), cancel button
   - Use for: session delete, solve delete, import confirmation

6. Place ImportButton in the timer page, near the SessionSelector.

Wire up: import a real cstimer JSON file and verify sessions appear correctly with proper times, penalties, and stats.
```

---

### PROMPT 10 — Learn Section: Structure & CFOP Track

```
Continuing CubeCoach AI. Timer is fully working.

Your task is steps 4A–4B: build the Learn section structure and the CFOP track.

1. Define lesson content data in /src/lib/content/cfop.ts:
   Create an array of lesson objects with this TypeScript type:
   
   type Lesson = {
     id: string           // e.g. 'cfop-cross-1'
     track: 'cfop'
     phase: string        // e.g. 'Cross', 'F2L', 'OLL', 'PLL', 'Advanced'
     order: number        // within phase
     title: string
     description: string  // 1-2 sentences
     estimatedMinutes: number
     videos: { url: string; title: string; source: string }[]
     tips: string[]
   }

   Create at minimum these lessons (use real YouTube video URLs from J Perm, CubeSkills, SpeedCubeReview):
   - Phase: Cross — "Cross Overview", "Efficient Cross on Bottom"
   - Phase: F2L — "F2L Introduction", "F2L Slot FR", "F2L Slot FL", "F2L Slot BR", "F2L Slot BL", "F2L Tricks"
   - Phase: OLL — "2-Look OLL", "Full OLL Part 1", "Full OLL Part 2"
   - Phase: PLL — "2-Look PLL", "Full PLL"
   - Phase: Advanced — "F2L Lookahead", "TPS and Fingertricks"

2. Create /src/lib/content/roux.ts — same structure, lessons:
   - First Block, Second Square, Last Pair, CMLL, LSE (EO, UL/UR, EP), Advanced Roux

3. Create /src/lib/content/comp-prep.ts — same structure, lessons:
   - Reading a WCA Scorecard, Avoiding +2 Penalties, Pre-Competition Routine, Handling Nerves, Competing Consistently

4. Create /src/app/(app)/learn/page.tsx:
   - PageShell with title "Learn"
   - Three TrackCard components side by side (grid on desktop, stacked on mobile)
   - Each card: track name, icon, lesson count, short description, progress bar (completed / total lessons)
   - Progress reads from user_profiles.completed_lessons (array of lesson IDs)
   - Clicking a card navigates to /learn/cfop, /learn/roux, or /learn/comp-prep

5. Create /src/components/learn/TrackCard.tsx:
   - Card with track name, description, lesson count, progress bar

6. Create /src/app/(app)/learn/cfop/page.tsx:
   - List all CFOP lessons grouped by phase
   - Each lesson shown as a row: title, estimated time, completed checkmark if in completed_lessons
   - Lessons within a phase are sequential — a lesson is only accessible if the previous one is completed (or it's the first)
   - Clicking a lesson navigates to /learn/cfop/[lessonId]

7. Create /src/app/(app)/learn/cfop/[lessonId]/page.tsx:
   - PageShell with lesson title
   - For each video in the lesson: embed YouTube iframe (use youtube-nocookie.com)
   - Tips section: bulleted list of tips
   - "Mark as Complete" button at the bottom
   - Calls server action: completeLesson(lessonId) that appends lessonId to user_profiles.completed_lessons (if not already present)
   - After marking complete, show a success state and "Next Lesson →" button

Wire up: the full CFOP track should be navigable, lesson completion should persist, and progress bar on /learn should update.
```

---

### PROMPT 11 — Learn Section: Roux, Comp Prep & Save to Library

```
Continuing CubeCoach AI. CFOP track is complete and wired.

Your task is steps 4C–4E: Roux track, Competition Prep track, and Save to Library.

1. Create /src/app/(app)/learn/roux/page.tsx:
   - Same structure as CFOP track list page
   - Uses /src/lib/content/roux.ts data
   - Sequential unlock logic per phase

2. Create /src/app/(app)/learn/roux/[lessonId]/page.tsx:
   - Same structure as CFOP lesson detail page
   - Uses Roux lesson data

3. Create /src/app/(app)/learn/comp-prep/page.tsx and /[lessonId]/page.tsx:
   - Same structure, uses comp-prep lesson data
   - No sequential lock for comp-prep — all lessons freely accessible from the start

4. Create /src/lib/actions/bookmarks.ts:
   - saveBookmark(userId, { videoUrl, title, source, topicTag, methodTag }): upserts to bookmarks table (no duplicates by videoUrl + userId)
   - removeBookmark(userId, videoUrl): deletes matching bookmark
   - getUserBookmarks(userId): returns all bookmarks for user
   - isBookmarked(userId, videoUrl): returns boolean

5. Create /src/components/learn/SaveToLibraryButton.tsx:
   - Icon button (Bookmark icon from lucide-react)
   - Filled when bookmarked, outline when not
   - On click: if not bookmarked, call saveBookmark; if bookmarked, call removeBookmark
   - Uses optimistic UI update (toggle state immediately, revert on error)
   - Props: videoUrl, title, source, topicTag, methodTag

6. Add SaveToLibraryButton to each video embed in all lesson detail pages (CFOP, Roux, Comp Prep).

7. Update /src/app/(app)/learn/page.tsx to show which track has the AI recommendation badge (hardcode to "CFOP – F2L" for now as a placeholder; will be dynamic in Phase 6).

Wire up: saving a video from any lesson detail page should persist to the bookmarks table. Saving the same video twice should not create duplicates.
```

---

### PROMPT 12 — Analysis: Video Upload Pipeline

```
Continuing CubeCoach AI. Learn section is complete.

Your task is steps 5A–5B: set up video storage and build the upload UI.

1. Confirm the Supabase Storage bucket 'solve-videos' exists with:
   - Private access (authenticated users only)
   - RLS policy: users can only upload to and read from their own folder (path must start with their user ID)
   - Max file size: 200MB

2. Create /src/app/(app)/analysis/page.tsx:
   - PageShell with title "AI Analysis"
   - Method selector at the top: radio group or segmented control for "CFOP" | "Roux"
   - Pre-fill from user_profiles.method
   - VideoUploader component below
   - Link to /analysis/history at the top right

3. Create /src/components/analysis/VideoUploader.tsx:
   - Drag-and-drop zone + click-to-browse file picker
   - Accepted formats: video/mp4, video/quicktime, video/webm
   - Client-side validation (before any upload):
     a. File type check
     b. File size ≤ 200MB
     c. Video duration check using: create an <video> element, set src to URL.createObjectURL(file), wait for loadedmetadata event, check duration ≤ 120 seconds
   - If validation fails: show specific inline error message, do not proceed
   - If validation passes: show file name, duration, size — and an "Analyse Solve" button

4. On "Analyse Solve" button click:
   a. Upload file to Supabase Storage at: solve-videos/{userId}/{uuid}.{ext}
   b. Show upload progress bar (using Supabase upload with onUploadProgress)
   c. On upload complete: call server action createAnalysis(userId, videoPath, method)
   d. createAnalysis inserts a row in analyses with status='pending', returns the new analysis ID
   e. Redirect to /analysis/{id}

5. Create /src/lib/actions/analysis.ts:
   - createAnalysis(userId, videoPath, method): inserts pending analysis row, returns id
   - getAnalysis(id): returns analysis row
   - getAnalysisHistory(userId): returns all analyses for user, ordered by created_at desc

Wire up: upload a video, confirm it appears in Supabase Storage, confirm the pending analyses row is created, confirm redirect to /analysis/{id}.
```

---

### PROMPT 13 — Analysis: Gemini Integration & Report UI

```
Continuing CubeCoach AI. Video upload creates a pending analysis row and redirects to /analysis/{id}.

Your task is steps 5C–5D: send the video to Gemini and render the structured report.

1. Create /src/app/api/analysis/create/route.ts:
   - POST handler, body: { analysisId: string }
   - Authenticate the request (verify the analysis row belongs to the requesting user)
   - Update analysis status to 'processing'
   - Download the video from Supabase Storage as a Buffer
   - Upload to Gemini File API using @google/generative-ai:
     const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY)
     const uploadResult = await fileManager.uploadFile(buffer, { mimeType, displayName })
   - Wait for file to be ACTIVE (poll getFile if needed)
   - Send this prompt to gemini-1.5-flash with the file reference:

     "You are an expert speedcubing coach analysing a 3x3 Rubik's Cube solve video.
      The solver is using [METHOD].
      
      Analyse the solve and return ONLY a valid JSON object with no additional text, no markdown, no explanation.
      
      Return this exact structure:
      {
        \"overall_summary\": \"2-3 sentence summary of the solve\",
        \"estimated_total_time\": \"time in seconds as string\",
        \"top_priorities\": [\"priority 1\", \"priority 2\", \"priority 3\"],
        \"phases\": [
          {
            \"name\": \"phase name\",
            \"timestamp_start\": \"0:00\",
            \"timestamp_end\": \"0:00\",
            \"algorithm_identified\": \"algorithm name or null\",
            \"observations\": \"what you observed\",
            \"recommendation\": \"specific actionable improvement\"
          }
        ],
        \"recommended_lesson_ids\": [\"lesson-id-1\", \"lesson-id-2\"]
      }
      
      For CFOP, phases are: Cross, F2L Pair 1, F2L Pair 2, F2L Pair 3, F2L Pair 4, OLL, PLL.
      For Roux, phases are: First Block, Second Square, Last Pair, CMLL, LSE.
      
      Focus on: algorithm identification, execution hesitations, phase timing, look-ahead quality.
      Do not attempt frame-precise fingertrick analysis. Do not return anything except the JSON object."

   - Parse the JSON response (strip any accidental markdown fences)
   - Store result in analyses.report, set status='complete'
   - On any error: set status='failed', log error

2. Create /src/app/api/analysis/[id]/route.ts:
   - GET handler: returns the analysis row (status + report if complete)
   - Only accessible by the owner of the analysis

3. Create /src/app/(app)/analysis/[id]/page.tsx:
   - On mount: trigger POST to /api/analysis/create with the analysisId (only if status is 'pending')
   - Poll GET /api/analysis/{id} every 3 seconds while status is 'pending' or 'processing'
   - Loading state: animated skeleton with "Analysing your solve..." message
   - Failed state: error message + "Try Again" button that re-triggers the analysis
   - Complete state: render the report

4. Create /src/components/analysis/AnalysisSummaryCard.tsx:
   - Overall summary text
   - Top 3 priorities as numbered cards with subtle background
   - Estimated total time

5. Create /src/components/analysis/PhaseBreakdown.tsx:
   - Accordion list — one collapsible panel per phase
   - Each panel header: phase name + timestamp range
   - Panel content: algorithm identified (or "—"), observations paragraph, recommendation paragraph

6. Create /src/components/analysis/RecommendedLessons.tsx:
   - Maps recommended_lesson_ids from the report to lesson objects from the content files
   - Renders 2-3 lesson cards with title, track badge, link to lesson

Wire up: full flow — upload video → Gemini analyses → report renders with phases, summary, and lesson recommendations.
```

---

### PROMPT 14 — Analysis: Claude Chat Integration

```
Continuing CubeCoach AI. Analysis reports render correctly.

Your task is step 5E: add the Claude-powered coaching chat to analysis reports.

1. Create /src/app/api/analysis/[id]/chat/route.ts:
   - POST handler, body: { message: string }
   - Authenticate: verify analysis belongs to requesting user
   - Load the analysis report from analyses.report
   - Load existing chat history from analysis_chats (ordered by created_at asc)
   - Check free tier limit: if user is on free tier and chat messages from this analysis > 10, return 403 with { error: 'chat_limit_reached' }
   - Construct Claude API request:
     - Model: claude-sonnet-4-20250514
     - System prompt: "You are an expert speedcubing coach. You are reviewing a solver's recent 3x3 solve analysis. Here is the analysis report: [JSON.stringify(report)]. Answer the solver's questions about their performance, recommend drills, explain techniques, and provide encouragement. Be specific, reference the analysis data directly. Keep responses concise and actionable."
     - Messages: full chat history + new user message
   - Call Anthropic API (use fetch to https://api.anthropic.com/v1/messages with Authorization header using ANTHROPIC_API_KEY)
   - Save user message to analysis_chats
   - Save assistant response to analysis_chats
   - Return the assistant response text

2. Create /src/components/analysis/ChatPanel.tsx:
   - "Chat with your coach" button that expands the panel (collapsed by default)
   - Message list: user messages right-aligned, assistant messages left-aligned
   - Loading indicator while waiting for response (animated dots)
   - Text input + send button at the bottom
   - On send: optimistically add user message, call POST /api/analysis/{id}/chat, append response
   - If 403 with chat_limit_reached: show inline upsell message ("Upgrade to continue chatting")
   - Auto-scroll to latest message

3. Add ChatPanel to /src/app/(app)/analysis/[id]/page.tsx, below RecommendedLessons.

4. Load existing chat history on page mount by fetching analysis_chats for this analysis_id (call from the analysis GET API or a separate server component).

Wire up: open a completed analysis, click "Chat with your coach", ask a follow-up question, verify the response references the analysis data, verify chat history persists after page reload.
```

---

### PROMPT 15 — Analysis History & Library Page

```
Continuing CubeCoach AI. Analysis with chat is working.

Your task is steps 5F and 6D: build the analysis history page and the library page.

1. Create /src/app/(app)/analysis/history/page.tsx:
   - PageShell with title "Analysis History"
   - Fetches all analyses for the current user via getAnalysisHistory()
   - Renders a list of AnalysisCard components
   - Empty state: "No analyses yet — upload your first solve to get started"

2. Create /src/components/analysis/AnalysisCard.tsx:
   - Shows: date formatted as "Apr 14, 2026", method badge (CFOP/Roux), status badge (Pending/Processing/Complete/Failed)
   - If complete: shows first line of overall_summary (truncated)
   - Clicking the card navigates to /analysis/{id}
   - If failed: show "Analysis failed" with a retry option

3. Add "View History" link button to /analysis page (top right).

4. Create /src/app/(app)/library/page.tsx:
   - PageShell with title "Library"
   - Fetches user's bookmarks via getUserBookmarks()
   - Filter bar: method filter (All/CFOP/Roux), topic filter (dynamic from unique topic_tags in bookmarks)
   - Renders BookmarkCard grid (3 columns desktop, 1 mobile)
   - Empty state: "Save videos from your lessons to build your library"

5. Create /src/components/library/BookmarkCard.tsx:
   - YouTube thumbnail (use https://img.youtube.com/vi/{videoId}/mqdefault.jpg — extract videoId from URL)
   - Video title
   - Source badge (e.g., "J Perm")
   - Topic tag chip
   - Method tag chip (if present)
   - Bookmark icon button to remove (with confirm)
   - Clicking the card opens the YouTube URL in a new tab

6. Create /src/lib/actions/bookmarks.ts removeBookmark action if not already created.

Wire up: bookmarks saved from lesson pages should appear in the library. Filters should work client-side without additional API calls. History page should show all past analyses.
```

---

### PROMPT 16 — Gamification: XP & Badges

```
Continuing CubeCoach AI. All core features are built.

Your task is steps 6A–6C: implement the XP and badge system.

1. Create /src/utils/levels.ts:
   - Define XP thresholds array: [0, 100, 250, 500, 900, 1400, 2100, 3000, 4000, 5500, 7500] (levels 1–11, extend as needed)
   - getLevel(xp: number): number — returns current level
   - getXpForNextLevel(xp: number): number — XP needed to reach next level
   - getLevelProgress(xp: number): number — percentage (0–100) through current level

2. Create /src/lib/xp.ts:
   - awardXP(supabase, userId, source, amount):
     - Insert into xp_events
     - Increment user_profiles.xp by amount
     - Recalculate level using getLevel(newXp) and update user_profiles.level if changed
   - XP_AMOUNTS constant object:
     { ONBOARDING: 50, FIRST_ANALYSIS: 100, ANALYSIS: 30, LESSON: 25, SOLVE: 2, PB_SINGLE: 50, PB_AO5: 75, PB_AO12: 100, STREAK_3: 30, STREAK_7: 100, BOOKMARK: 5, WCA_LINK: 50 }

3. Create /src/lib/badges.ts:
   - BADGE_DEFINITIONS: array of { key, name, description, icon } for all badges defined in spec
   - checkAndAwardBadge(supabase, userId, badgeKey): 
     - Check if badges table already has this row (idempotent)
     - If not, insert and also call awardXP for any XP tied to the badge trigger

4. Wire XP awards into existing server actions (update each action file):
   - saveOnboardingAnswers: award ONBOARDING XP + "First Steps" badge
   - saveSolve: award SOLVE XP (2 XP); check for new PB (compare against user's best) and award PB XP + badge if applicable; check streak
   - createAnalysis (on complete): award FIRST_ANALYSIS on first ever analysis, ANALYSIS on subsequent; award "Under the Lens" badge on first
   - completeLesson: award LESSON XP; check if entire track complete for "Method Master" badge
   - saveBookmark: award BOOKMARK XP
   - linkWCAProfile: award WCA_LINK XP + badge

5. Streak detection (add to saveSolve):
   - Query the most recent solve before this one
   - If it was yesterday (date difference = 1 day): increment streak
   - If it was today: continue streak, no new XP
   - If gap > 1 day: reset streak to 1
   - Store current_streak and longest_streak in user_profiles (add these columns in a new migration: /supabase/migrations/002_add_streak_columns.sql)
   - Award streak XP at 3 and 7 days

6. Create /src/app/(app)/profile/achievements/page.tsx (or implement as a tab within profile):
   - BadgeGrid: all BADGE_DEFINITIONS rendered; earned ones full colour with earned date, unearned ones greyed out
   - XPProgressBar: "Level {n}" label, progress bar, "{x} XP to Level {n+1}"
   - Recent XP events list (last 10 from xp_events): source label + amount + date

7. Update the Sidebar XP indicator (from Step 4) to show real XP and level from useUser().

Wire up: log a solve and verify XP increments. Complete a lesson and verify badge is awarded. Check the achievements tab shows correct state.
```

---

### PROMPT 17 — Dashboard & Free Tier Gating

```
Continuing CubeCoach AI. Gamification is wired to all actions.

Your task is steps 6E–6F: build the final dashboard and implement free tier limits.

1. Create /src/lib/recommendations.ts:
   - getRecommendedLesson(profile: UserProfile, recentAnalysis?: Analysis): { lessonId, lessonTitle, track, reason }
   - Logic:
     - If knows_how_to_solve = false → recommend 'cfop-cross-1' (First Solve equivalent), reason: "Start your journey"
     - If recentAnalysis exists and has recommended_lesson_ids → use the first uncompleted one, reason: "Based on your latest analysis"
     - Else: find the first uncompleted lesson in the user's preferred method track, reason: "Continue your [METHOD] journey"
     - Fallback: recommend 'cfop-cross-1'

2. Create /src/components/dashboard/RecommendedLessonCard.tsx:
   - Prominent card at the top of the dashboard
   - "Recommended for you" label
   - Lesson title, track badge, reason text
   - "Start Lesson →" button linking to the lesson page

3. Create /src/components/dashboard/QuickStatsBlock.tsx:
   - Only renders if user has at least 1 solve
   - Shows: Last Ao5, Last Ao12, Total Solves, Days Active
   - Compact horizontal layout

4. Create /src/components/dashboard/QuickNavGrid.tsx:
   - Grid of shortcut cards: Timer, Analysis, Learn, Library
   - Each card has icon + label + brief description
   - Minimal design — not competing with the recommended lesson card

5. Create /src/components/dashboard/DontKnowCTA.tsx:
   - "Don't know where to start?" button — only shown if user has no completed lessons and no analyses
   - Routes to: /learn/cfop/cfop-cross-1 if knows_how_to_solve = false, else /analysis if knows_how_to_solve = true

6. Assemble /src/app/(app)/dashboard/page.tsx:
   - Server component: fetch profile, most recent analysis, solve stats in parallel
   - Render: RecommendedLessonCard, QuickStatsBlock (if solves exist), QuickNavGrid, DontKnowCTA (if applicable)

7. Create /src/lib/tier.ts:
   - FREE_LIMITS = { analysesPerMonth: 3, chatMessagesPerAnalysis: 10, bookmarks: 20 }
   - canUploadAnalysis(supabase, userId): count analyses created this calendar month, compare to limit
   - canChat(supabase, analysisId, userId): count chat messages for this analysis, compare to limit
   - canBookmark(supabase, userId): count total bookmarks, compare to limit

8. Create /src/components/ui/UpsellModal.tsx:
   - Modal with title, description of what the user is missing, two CTAs: "Upgrade to Premium" (links to /settings#upgrade) and "Maybe Later"
   - Props: feature ('analysis' | 'chat' | 'bookmark')
   - Display different copy per feature

9. Wire tier checks:
   - In VideoUploader: call canUploadAnalysis before starting upload; if false, show UpsellModal
   - In ChatPanel: already returns 403 from API; render UpsellModal when 403 is received
   - In SaveToLibraryButton: call canBookmark before saving; if false, show UpsellModal

10. Create /src/app/(app)/settings/page.tsx:
    - Theme toggle (light/dark/system)
    - Timer preferences: inspection enabled (toggle), inspection audio (toggle), hold duration (slider: 200–500ms)
    - Store timer prefs in localStorage (not DB — device-specific)
    - Linked accounts section: Google (always linked, show email), WCA (show link/unlink)
    - Danger zone: "Delete Account" button (with two-step confirm) that calls supabase.auth.admin.deleteUser and cascades via DB

Wire up: visit the dashboard as a new user — should see recommendation and the CTA. Log 3 analyses as a free user — 4th upload should show upsell modal. Settings should persist across page loads.
```

---

### PROMPT 18 — Final Integration, Polish & QA Fixes

```
Continuing CubeCoach AI. All features are built and wired.

Your task is the final integration pass: connect any remaining loose ends, add loading/error states throughout, and prepare the app for handoff.

1. Global error boundary:
   - Create /src/app/error.tsx — catches unhandled errors in the app route group, shows a friendly "Something went wrong" message with a "Try Again" button
   - Create /src/app/(app)/error.tsx — same for authenticated routes

2. Global loading states:
   - Create /src/app/loading.tsx and /src/app/(app)/loading.tsx — simple centred spinner
   - Add Suspense boundaries in: dashboard (wrap stats fetch), analysis page (wrap report), learn track pages (wrap lesson list)

3. Toast notification system:
   - Install and configure a toast library (e.g., sonner)
   - Add toasts for: solve saved, import complete, lesson completed, badge earned (show badge name), XP awarded (show "+X XP"), bookmark saved/removed, analysis upload started

4. Empty states — add to every list/page that can be empty:
   - Timer: no sessions → "Create your first session to start timing"
   - Learn: no completed lessons → "Pick a track to begin" (already handled but verify)
   - Library: no bookmarks → handled in Step 15, verify copy is good
   - Analysis history: handled in Step 15, verify

5. Mobile responsiveness audit:
   - Sidebar should collapse to a bottom navigation bar on screens < 768px
   - Timer should be full-width and touch-friendly on mobile
   - Analysis upload should work with native file picker on mobile
   - All grid layouts should stack to single column on mobile

6. SEO & metadata:
   - Add metadata exports to each page: title (e.g., "Timer | CubeCoach AI"), description
   - Add a favicon (cube emoji as SVG or a simple icon)
   - Add /public/og-image.png (simple branded card for Open Graph)

7. Environment variable audit:
   - Confirm all env vars are documented in a .env.example file
   - Confirm GEMINI_API_KEY and ANTHROPIC_API_KEY are never exposed to the client (server-only usage)

8. Final wiring checks:
   - Confirm: new user → onboarding → dashboard → recommended lesson → complete lesson → XP + badge → profile shows badge
   - Confirm: upload video → analysis complete → chat → history shows the analysis
   - Confirm: timer → solve → PB → XP awarded → stats update
   - Confirm: cstimer import → solves appear in correct session → stats calculate correctly
   - Confirm: free user hits analysis limit → upsell modal → modal dismisses cleanly

9. README.md:
   - Write a developer README covering: local setup, env vars, Supabase setup steps (run migrations, enable Google auth, create storage bucket), running the dev server, and a brief architecture overview

This is the final step. The app should be fully functional, integrated, and ready for developer handoff or deployment to Vercel.
```

---

## Appendix: Dependency Summary

```
Core:
- next (14+)
- react, react-dom
- typescript
- tailwindcss

Supabase:
- @supabase/supabase-js
- @supabase/ssr

AI:
- @google/generative-ai (Gemini)
- Anthropic API accessed via fetch (no SDK needed for V1)

UI:
- lucide-react (icons)
- clsx (className utility)
- next-themes (dark/light mode)
- sonner (toasts)

Timer:
- scramble-utils or custom scramble generator

Utilities:
- No date library needed — use native Intl.DateTimeFormat
```

---

*Blueprint compiled April 2026. 18 prompts total across 6 phases. Each prompt is independently executable and leaves no orphaned code.*
