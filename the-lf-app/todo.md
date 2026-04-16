# Cubewise — Project Checklist

---

## Phase 1 — Project Foundation

### 1A · Project Initialisation
- [ ] Scaffold Next.js 14 with TypeScript, Tailwind CSS, App Router, `src/` directory
- [ ] Install dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `clsx`, `next-themes`, `@google/generative-ai`, `sonner`
- [ ] Create `.env.local` with all placeholder keys (Supabase, Gemini, Anthropic)
- [ ] Create `.env.example` documenting all required environment variables
- [ ] Set up folder structure: `/app`, `/components`, `/lib`, `/types`, `/hooks`, `/utils`
- [ ] Create `/src/types/database.ts` placeholder
- [ ] Create `/src/lib/supabase/client.ts` (browser client)
- [ ] Create `/src/lib/supabase/server.ts` (server client with cookie handling)
- [ ] Confirm dev server starts with no errors

### 1B · Database Schema
- [ ] Create Supabase project and note URL + anon key
- [ ] Enable `uuid-ossp` extension in Supabase
- [ ] Write migration `001_initial_schema.sql` with all 8 tables
- [ ] `user_profiles` table
- [ ] `solve_sessions` table
- [ ] `solves` table
- [ ] `analyses` table
- [ ] `analysis_chats` table
- [ ] `bookmarks` table
- [ ] `badges` table
- [ ] `xp_events` table
- [ ] Write DB trigger: auto-insert `user_profiles` row on `auth.users` insert
- [ ] Enable Row Level Security on all tables
- [ ] Write RLS policies for every table
- [ ] Write SQL to create `solve-videos` Storage bucket (private)
- [ ] Run migration against Supabase project
- [ ] Generate TypeScript types (`supabase gen types typescript`) and paste into `database.ts`

### 1C · Authentication
- [ ] Enable Google OAuth provider in Supabase dashboard
- [ ] Create `/src/app/login/page.tsx` with Google sign-in button
- [ ] Create `/src/app/auth/callback/route.ts` (OAuth redirect handler)
- [ ] Create `/src/middleware.ts` (protect all routes, redirect logic)
- [ ] Create `/src/hooks/useUser.ts` (returns `{ user, profile, loading }`)
- [ ] Test: unauthenticated visit redirects to `/login`
- [ ] Test: after Google login, user lands on `/dashboard`

### 1D · Global Layout & Navigation
- [ ] Create root `layout.tsx` with `ThemeProvider`, font setup
- [ ] Create `Sidebar.tsx` with all 7 nav links + icons
- [ ] Create `ThemeToggle.tsx` (light/dark switch)
- [ ] Create `PageShell.tsx` wrapper component
- [ ] Create `(app)/layout.tsx` authenticated route group layout
- [ ] Create skeleton pages for all 7 routes (Dashboard, Learn, Timer, Analysis, Library, Profile, Settings)
- [ ] Test: all nav links work, active state reflects current route
- [ ] Test: dark mode toggle works on all pages

---

## Phase 2 — Onboarding & User Profile

### 2A · Profile Actions
- [ ] Write server action: `updateUserProfile(data)`
- [ ] Write server action: `getUserProfile()`

### 2B–2C · Onboarding Flow
- [ ] Define 4 questions in `/src/lib/onboarding-questions.ts`
- [ ] Create `OnboardingCard.tsx` component (full-screen, animated options)
- [ ] Create `/src/app/onboarding/page.tsx` (one question at a time, progress indicator)
- [ ] Add slide/fade animation between questions
- [ ] On completion: call `saveOnboardingAnswers()` server action
- [ ] Set `onboarding_complete = true` in `user_profiles`
- [ ] Redirect to `/dashboard` after onboarding
- [ ] Update middleware: redirect to `/onboarding` if `onboarding_complete = false`
- [ ] Add guard: skip onboarding if already complete
- [ ] Test: new user always hits onboarding before dashboard
- [ ] Test: returning user never sees onboarding again

### 2D · Profile Page & WCA Integration
- [ ] Create `/src/app/(app)/profile/page.tsx` with three tabs (Profile, Stats, Achievements)
- [ ] Profile tab: avatar, display name, email (read-only), editable method + goal
- [ ] "Save changes" button calls `updateUserProfile`
- [ ] WCA linking section: input + "Link" button
- [ ] Create `/src/app/api/wca/route.ts` (fetches WCA public API)
- [ ] Write `linkWCAProfile(wcaId)` server action
- [ ] Write `unlinkWCAProfile()` server action
- [ ] Stats tab: total solves, best single, best Ao5, best Ao12, total sessions, member since
- [ ] Test: WCA data displays after linking without page reload
- [ ] Test: unlinking clears WCA data

---

## Phase 3 — Timer

### 3A–3B · Timer Core & Scrambles
- [ ] Create `/src/utils/timer.ts` with `formatTime(ms)` function
- [ ] Create `useTimer.ts` hook (idle → holding → inspection → running → stopped state machine)
- [ ] Implement 300ms hold-to-start (spacebar + touch)
- [ ] Implement 15s inspection countdown with colour changes (yellow at 8s, red at 12s)
- [ ] Inspection audio cue option
- [ ] Create `TimerDisplay.tsx` (large monospace, colour-coded by phase)
- [ ] Create scramble generator in `/src/utils/scramble.ts` (valid WCA 3x3 scrambles)
- [ ] Create `ScrambleDisplay.tsx` with manual regenerate button
- [ ] Auto-generate new scramble after each solve
- [ ] Assemble `/src/app/(app)/timer/page.tsx`
- [ ] Test: timer responds to spacebar with no async lag
- [ ] Test: inspection countdown behaves correctly at boundary times

### 3C–3D · Sessions & Stats
- [ ] Create all server actions in `/src/lib/actions/timer.ts`: `getSessions`, `createSession`, `deleteSession`, `saveSolve`, `getSolves`, `deleteSolve`, `updateSolvePenalty`
- [ ] Create `SessionSelector.tsx` (dropdown, create, delete)
- [ ] Auto-create "Default Session" for users with no sessions
- [ ] Create `/src/utils/stats.ts`: `effectiveTime`, `calculateAo`, `calculateBest`
- [ ] Handle DNF edge cases in Ao calculation (WCA rules)
- [ ] Create `StatsBar.tsx` (Single, Ao5, Ao12, Ao50, Ao100, Best, Mean)
- [ ] Create `SolveList.tsx` (scrollable, with solve number, time, penalty badge, scramble)
- [ ] Wire timer stop → `saveSolve()` → refresh list + stats
- [ ] Test: Ao5 with 2+ DNFs shows as DNF
- [ ] Test: switching sessions updates list and stats correctly

### 3E–3F · cstimer Import & Solve Actions
- [ ] Create `/src/utils/cstimer-parser.ts` (handle all cstimer JSON formats + edge cases)
- [ ] Create `/src/lib/actions/import.ts` with `importFromCsTimer()` batch insert
- [ ] Create `ImportButton.tsx` (file picker, preview modal, success toast)
- [ ] Create `ConfirmDialog.tsx` reusable modal component
- [ ] Add solve actions: Delete, Mark DNF, Mark +2, Remove Penalty
- [ ] Optimistic UI updates on penalty change
- [ ] Stats recalculate after any solve modification
- [ ] Test: import a real cstimer JSON file, verify times and penalties match
- [ ] Test: deleting a DNF solve correctly updates Ao5

---

## Phase 4 — Learn Section

### 4A · Learn Page Structure
- [ ] Write migration `002_add_streak_columns.sql` (add `current_streak`, `longest_streak` to `user_profiles`)
- [ ] Define `Lesson` TypeScript type in `/src/types/index.ts`
- [ ] Create `TrackCard.tsx` (name, description, lesson count, progress bar)
- [ ] Create `/src/app/(app)/learn/page.tsx` with three track cards
- [ ] Progress reads from `user_profiles.completed_lessons`

### 4B · CFOP Track
- [ ] Define all CFOP lessons in `/src/lib/content/cfop.ts` (minimum 14 lessons across 5 phases)
- [ ] Use real YouTube URLs (J Perm, CubeSkills, SpeedCubeReview)
- [ ] Create `/src/app/(app)/learn/cfop/page.tsx` (grouped by phase, sequential unlock)
- [ ] Create `/src/app/(app)/learn/cfop/[lessonId]/page.tsx` (video embeds, tips, mark complete)
- [ ] Write `completeLesson(lessonId)` server action
- [ ] "Next Lesson →" button after marking complete
- [ ] Test: completing lesson 1 unlocks lesson 2
- [ ] Test: progress bar on /learn updates after completion

### 4C · Roux Track
- [ ] Define all Roux lessons in `/src/lib/content/roux.ts`
- [ ] Create `/src/app/(app)/learn/roux/page.tsx`
- [ ] Create `/src/app/(app)/learn/roux/[lessonId]/page.tsx`

### 4D · Competition Prep Track
- [ ] Define all Comp Prep lessons in `/src/lib/content/comp-prep.ts`
- [ ] Create `/src/app/(app)/learn/comp-prep/page.tsx` (all lessons freely accessible, no lock)
- [ ] Create `/src/app/(app)/learn/comp-prep/[lessonId]/page.tsx`

### 4E · Save to Library (Stub)
- [ ] Write bookmark server actions in `/src/lib/actions/bookmarks.ts`: `saveBookmark`, `removeBookmark`, `getUserBookmarks`, `isBookmarked`
- [ ] Create `SaveToLibraryButton.tsx` (filled/outline toggle, optimistic UI)
- [ ] Add `SaveToLibraryButton` to every video embed across all lesson detail pages
- [ ] Test: saving same video twice doesn't create duplicate

---

## Phase 5 — AI Video Analysis

### 5A · Storage Setup
- [ ] Confirm `solve-videos` bucket exists with private access
- [ ] Write RLS policy: users can only access their own folder (`{userId}/...`)
- [ ] Confirm `analyses` table migration is applied

### 5B · Upload UI
- [ ] Create `/src/app/(app)/analysis/page.tsx` with method selector (pre-filled from profile)
- [ ] Create `VideoUploader.tsx` (drag-and-drop + file picker)
- [ ] Client-side validation: file type check
- [ ] Client-side validation: file size ≤ 200MB
- [ ] Client-side validation: video duration ≤ 120s using `HTMLVideoElement`
- [ ] Show upload progress bar during upload
- [ ] On complete: call `createAnalysis()`, redirect to `/analysis/{id}`
- [ ] Test: file over 2 minutes shows error before upload starts
- [ ] Test: wrong file type shows specific error message

### 5C · Gemini Integration
- [ ] Create `/src/app/api/analysis/create/route.ts`
- [ ] Authenticate request (verify ownership of analysis row)
- [ ] Update status to `processing`
- [ ] Download video from Supabase Storage as Buffer
- [ ] Upload to Gemini File API, wait for ACTIVE state
- [ ] Send structured analysis prompt (CFOP or Roux variant)
- [ ] Parse and validate JSON response (strip markdown fences)
- [ ] Store result in `analyses.report`, set status to `complete`
- [ ] Handle failures: set status to `failed`, log error
- [ ] Create `/src/app/api/analysis/[id]/route.ts` (GET, poll status)
- [ ] Test: full analysis completes for a real CFOP solve video
- [ ] Test: failed analysis sets status correctly, doesn't crash

### 5D · Analysis Report UI
- [ ] Create `/src/app/(app)/analysis/[id]/page.tsx` (poll every 3s while pending/processing)
- [ ] Loading skeleton state with "Analysing your solve..." message
- [ ] Failed state with "Try Again" button
- [ ] Create `AnalysisSummaryCard.tsx` (summary, top 3 priorities, estimated time)
- [ ] Create `PhaseBreakdown.tsx` (collapsible accordion per phase)
- [ ] Each phase: name, timestamp, algorithm identified, observations, recommendation
- [ ] Create `RecommendedLessons.tsx` (maps lesson IDs to lesson cards)
- [ ] Test: all phases render for both CFOP and Roux analyses
- [ ] Test: recommended lessons link to correct lesson pages

### 5E · Claude Chat
- [ ] Create `/src/app/api/analysis/[id]/chat/route.ts`
- [ ] Inject analysis report as system context
- [ ] Load + include full chat history in each request
- [ ] Free tier check: block at 10 messages, return 403 with `chat_limit_reached`
- [ ] Save user + assistant messages to `analysis_chats`
- [ ] Create `ChatPanel.tsx` (collapsible, message list, input, loading dots)
- [ ] Optimistic user message display
- [ ] Show upsell message on 403 response
- [ ] Load existing chat history on page mount
- [ ] Add `ChatPanel` to analysis report page
- [ ] Test: chat references specific data from the analysis report
- [ ] Test: chat history persists after page reload

### 5F · Analysis History
- [ ] Create `/src/app/(app)/analysis/history/page.tsx`
- [ ] Create `AnalysisCard.tsx` (date, method badge, status badge, summary preview)
- [ ] Empty state for no analyses
- [ ] Add "View History" link to `/analysis` page
- [ ] Test: all past analyses appear, clicking navigates to report

---

## Phase 6 — Gamification, Library & Final Wiring

### 6A · XP & Level System
- [ ] Create `/src/utils/levels.ts`: `getLevel`, `getXpForNextLevel`, `getLevelProgress`
- [ ] Define XP threshold array (levels 1–10+)
- [ ] Create `/src/lib/xp.ts`: `awardXP()` function (insert event + update profile xp + recalculate level)
- [ ] Define `XP_AMOUNTS` constants object

### 6B · Badge System & Triggers
- [ ] Create `/src/lib/badges.ts`: `BADGE_DEFINITIONS` array + `checkAndAwardBadge()` (idempotent)
- [ ] Wire XP to `saveOnboardingAnswers` → 50 XP + "First Steps" badge
- [ ] Wire XP to `saveSolve` → 2 XP per solve
- [ ] Wire PB detection to `saveSolve` → compare against stored best, award PB XP + badge
- [ ] Wire streak detection to `saveSolve` → check date diff, award at 3 and 7 days
- [ ] Wire XP to `createAnalysis` complete → 100 XP first time, 30 XP thereafter + "Under the Lens" badge
- [ ] Wire XP to `completeLesson` → 25 XP + check for "Method Master" badge
- [ ] Wire XP to `saveBookmark` → 5 XP
- [ ] Wire XP to `linkWCAProfile` → 50 XP + badge
- [ ] Test: log a solve, verify XP increments in `user_profiles`
- [ ] Test: earning a badge twice doesn't create duplicate row

### 6C · Achievements UI
- [ ] Create Achievements tab in `/src/app/(app)/profile/` (or sub-page)
- [ ] Create `BadgeGrid.tsx` (earned = full colour + date, unearned = greyed)
- [ ] Create `XPProgressBar.tsx` (level, progress bar, XP to next level)
- [ ] Recent XP events list (last 10 entries from `xp_events`)
- [ ] Update Sidebar XP indicator to show real level + XP from `useUser()`
- [ ] Test: completing a lesson shows badge as earned on achievements page

### 6D · Library Page
- [ ] Create `/src/app/(app)/library/page.tsx`
- [ ] Fetch and render user bookmarks as `BookmarkCard` grid
- [ ] Create `BookmarkCard.tsx` (YouTube thumbnail, title, source, topic tag, method tag, remove button)
- [ ] Extract YouTube video ID from URL for thumbnail
- [ ] Filter bar: method filter + topic filter (client-side, no extra API call)
- [ ] Empty state
- [ ] Remove bookmark with confirm dialog
- [ ] Test: save video from lesson, appears in library; remove it, disappears

### 6E · Dashboard (Final)
- [ ] Create `/src/lib/recommendations.ts`: `getRecommendedLesson()` logic
- [ ] Create `RecommendedLessonCard.tsx` (lesson title, track badge, reason, CTA button)
- [ ] Create `QuickStatsBlock.tsx` (Ao5, Ao12, total solves, days active — hidden if no solves)
- [ ] Create `QuickNavGrid.tsx` (Timer, Analysis, Learn, Library shortcuts)
- [ ] Create `DontKnowCTA.tsx` (routes based on `knows_how_to_solve` flag)
- [ ] Assemble `/src/app/(app)/dashboard/page.tsx` with all components
- [ ] Fetch profile + recent analysis + stats in parallel (server component)
- [ ] Make `/dashboard` the root redirect after auth
- [ ] Test: new user sees recommendation and CTA
- [ ] Test: user with solves sees QuickStatsBlock

### 6F · Tier Gating & Settings
- [ ] Create `/src/lib/tier.ts`: `canUploadAnalysis`, `canChat`, `canBookmark`
- [ ] Create `UpsellModal.tsx` (feature-specific copy, "Upgrade" CTA, "Maybe Later")
- [ ] Wire `canUploadAnalysis` to upload flow: show modal if limit reached
- [ ] Wire upsell to chat panel: render modal on 403
- [ ] Wire `canBookmark` to `SaveToLibraryButton`: show modal if limit reached
- [ ] Create `/src/app/(app)/settings/page.tsx`:
  - [ ] Theme toggle (light/dark/system)
  - [ ] Timer prefs: inspection toggle, audio toggle, hold duration slider
  - [ ] Store timer prefs in `localStorage`
  - [ ] Linked accounts display (Google email, WCA link/unlink)
  - [ ] Danger zone: delete account (two-step confirm)
- [ ] Test: free user uploading 4th analysis sees upsell modal
- [ ] Test: settings persist across page reload

---

## Phase 7 — Polish & Handoff

### Error Handling
- [ ] Create `/src/app/error.tsx` global error boundary
- [ ] Create `/src/app/(app)/error.tsx` authenticated error boundary
- [ ] Add loading skeletons to: Dashboard, Analysis page, Learn track pages

### Loading States
- [ ] Create `/src/app/loading.tsx` and `/src/app/(app)/loading.tsx` (centred spinner)
- [ ] Add Suspense boundaries around all async data fetches

### Toasts
- [ ] Configure `sonner` in root layout
- [ ] Add toast: solve saved
- [ ] Add toast: cstimer import complete (X sessions, Y solves)
- [ ] Add toast: lesson completed
- [ ] Add toast: badge earned (show badge name)
- [ ] Add toast: XP awarded (+X XP)
- [ ] Add toast: bookmark saved / removed
- [ ] Add toast: analysis upload started

### Empty States
- [ ] Timer: no sessions
- [ ] Learn: no completed lessons (verify)
- [ ] Library: no bookmarks (verify)
- [ ] Analysis history: no analyses (verify)
- [ ] Profile stats tab: no solves yet

### Mobile Responsiveness
- [ ] Sidebar collapses to bottom nav on screens < 768px
- [ ] Timer is full-width and touch-friendly
- [ ] Video upload works with native file picker on mobile
- [ ] All grids stack to single column on mobile
- [ ] Analysis accordion works on touch

### SEO & Metadata
- [ ] Add `metadata` export to every page (title, description)
- [ ] Add favicon (SVG cube icon or emoji-based)
- [ ] Add `/public/og-image.png` for Open Graph sharing
- [ ] Add `robots.txt` and `sitemap.xml` (public pages only)

### Final Integration Tests
- [ ] New user → onboarding → dashboard → recommended lesson → complete → XP + badge → profile shows badge
- [ ] Upload video → analysis complete → chat → history shows analysis
- [ ] Timer → solve → PB → XP awarded → stats update
- [ ] cstimer import → solves appear in correct session → stats correct
- [ ] Free user hits analysis limit → upsell modal → dismisses cleanly
- [ ] Dark mode renders correctly on every page
- [ ] Google sign-out works and redirects to login

### Documentation
- [ ] Write `README.md` covering: local setup, env vars, Supabase setup steps (run migrations, enable Google auth, create storage bucket), running dev server, architecture overview
- [ ] Comment all non-obvious utility functions
- [ ] Add JSDoc to all server actions

---

## Deployment Checklist

- [ ] Set all environment variables in Vercel project settings
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Update Supabase Google OAuth redirect URLs to production domain
- [ ] Update Supabase Auth allowed redirect URLs
- [ ] Run all migrations against production Supabase project
- [ ] Verify Supabase Storage bucket policies in production
- [ ] Set Gemini API key usage limits in Google Cloud console
- [ ] Deploy to Vercel, run smoke test on production URL
- [ ] Test Google login end-to-end on production
- [ ] Test video upload + analysis on production
- [ ] Monitor first 24h for errors in Vercel logs

---

## V2 Backlog (Do Not Build in V1)

- [ ] Additional WCA events (2x2, 4x4, OH, BLD)
- [ ] Precise fingertrick analysis (requires Modal + custom CV model)
- [ ] Social leaderboards and solve sharing
- [ ] Mobile app (React Native or PWA)
- [ ] AI-generated daily training plans
- [ ] Stripe payment integration for Premium and Lifetime tiers
- [ ] Roux-specific timer stats (move count, ETM)
- [ ] Seasonal challenges and XP leaderboards
- [ ] Admin dashboard for content management
