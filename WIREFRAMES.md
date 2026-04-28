# WIREFRAMES.md — TripTactician Screen Specifications

All 38 screens and states. Read alongside CLAUDE.md.
The 6 complex screens have ASCII layouts in CLAUDE.md — this file covers
everything else with structured component descriptions.

Reference these when building components. Every screen maps to a page or
component in the folder structure defined in CLAUDE.md.

---

## How to read this document

Each screen entry has:
- **Route** — the URL this screen lives at
- **Component** — the file that renders it
- **Layout** — how the screen is structured
- **Components used** — what to import
- **State** — what data is needed and where it comes from
- **Actions** — what the user can do and what happens

---

## Section 1 — Authentication (screens 1–4)

### Screen 1 — Login
**Route:** `/login`
**Component:** `pages/LoginPage.jsx`

**Layout:** centered card, max-width 400px, vertically centered on page.
No topbar. No sidebar. Just the card on a neutral background.

**Components used:** `ui/Card`, `ui/Input`, `ui/Button`

**Card contents (top to bottom):**
- Heading: "Welcome back" (18px 500)
- Subheading: "Sign in to your account" (muted 12px)
- Input: Email (`type="email"`, placeholder "you@email.com")
- Input: Password (`type="password"`, placeholder "••••••••")
- Forgot password link — right-aligned, 12px, color-info, navigates to `/forgot-password`
- Button: "Sign in" — full width, primary
- Footer text: "No account?" + link "Create one" → `/signup`

**State:** form state local. On success: store JWT in localStorage, redirect to `/`.

**Errors:**
- Invalid credentials → inline error below password field: "Email or password incorrect"
- Network error → banner at top of card: "Something went wrong. Try again."

---

### Screen 2 — Sign up
**Route:** `/signup`
**Component:** `pages/SignUpPage.jsx`

**Layout:** same centered card as Login.

**Card contents:**
- Heading: "Create account"
- Subheading: "Start planning your trip"
- Input: First name (`type="text"`, placeholder "Alex")
- Input: Email
- Input: Password (placeholder "Min 8 characters")
- Button: "Create account" — full width, primary
- Footer: "Already have an account?" + link "Sign in" → `/login`

**State:** form state local. On success: store JWT, redirect to `/`.

**Errors:**
- Email already in use → inline: "An account with this email already exists"
- Password too short → inline: "Password must be at least 8 characters"

**Note:** First name only. No last name. No phone. No date of birth.
Every extra field loses signups.

---

### Screen 3 — Forgot password
**Route:** `/forgot-password`
**Component:** `pages/ForgotPasswordPage.jsx`

**Layout:** same centered card.

**Card contents:**
- Heading: "Reset password"
- Subheading: "We'll send a reset link to your email."
- Input: Email
- Button: "Send reset link" — full width
- Link: "← Back to sign in" → `/login`, centered below button

**On submit:** POST `/api/auth/forgot-password`. Always show success state
regardless of whether email exists (security — don't reveal account existence).

**Success state replaces form:**
- Icon: envelope (or ✓ in green circle)
- Text: "Check your email. If an account exists for [email], we've sent a reset link."
- Link: "Back to sign in"

---

### Screen 4 — Reset password
**Route:** `/reset-password/:token`
**Component:** `pages/ResetPasswordPage.jsx`

**On mount:** validate token via `GET /api/auth/validate-reset-token/:token`.
If invalid/expired → show error state immediately, don't render form.

**Layout:** same centered card.

**Card contents (valid token):**
- Heading: "New password"
- Subheading: "Choose a new password for your account."
- Input: New password
- Input: Confirm password
- Button: "Set new password" — full width

**Success state (separate small card below or replaces form):**
- Green circle ✓
- "Password updated"
- "You can now sign in with your new password."
- Button: "Go to sign in" → `/login`

**Error state (invalid/expired token):**
- Red circle ✕
- "This reset link has expired or is invalid."
- Button: "Request a new link" → `/forgot-password`

---

## Section 2 — Onboarding Partner A (screens 5–8)

### Screen 5 — Trip creation step 1: Basics
**Route:** `/trips/new` (step 1 of wizard)
**Component:** `onboarding/StepBasics.jsx` inside `onboarding/TripWizard.jsx`

**Layout:** centered card, max-width 480px. Progress bar at top (25%).

**Fields:**
- Trip name: text input, placeholder "e.g. Tokyo with Sam"
- Destination: text input with Google Places Autocomplete
  - On select: stores `{ name, placeId, coords, country, timezone }`
  - Placeholder: "Search city or country..."
- Dates: two date inputs side by side — "From" and "To"
  - Minimum date: today
  - "To" minimum: selected "From" date

**Validation before continue:**
- Destination must be selected from autocomplete (not just typed)
- Start date must be before end date
- Trip name optional — if empty, auto-generate as "{Destination} · {Month Year}"

**On continue:** save draft to `localStorage` (not yet to DB — save on step 3 submit).

---

### Screen 6 — Trip creation step 2: Partner A preferences
**Route:** `/trips/new` (step 2)
**Component:** `onboarding/StepPreferences.jsx`

**Layout:** same centered card. Progress bar 50%.

Uses `onboarding/PreferencesForm.jsx` — the shared form component used by
both Partner A (here) and Partner B (on their join screen).

**PreferencesForm fields:**

PACE — toggle row, single select, required:
- Options: "Relaxed" | "Moderate" | "Packed"
- Default: none selected (user must pick)

INTERESTS — chip grid, multi-select, min 1 required:
- Options: Food, Culture, Nature, Nightlife, Shopping, Adventure, Wellness
- Selected state: `bg-info` (blue tint), `color-info`, `border-info`
- Unselected: default border, color-secondary

MORNING PERSON — toggle row, single select, required:
- Options: "Yes — early starts ok" | "No — slow mornings"

HARD AVOIDS — text input, optional:
- Placeholder: `e.g. "no museums, no spicy food"`
- Max 200 characters
- Helper text below: "Separate with commas. We'll filter these out."

**On continue:** save preferences to `localStorage` draft.

---

### Screen 7 — Trip creation step 3: Invite partner
**Route:** `/trips/new` (step 3)
**Component:** `onboarding/StepInvite.jsx`

**Layout:** same centered card. Progress bar 75%.

**Fields:**
- Partner's name: text input, placeholder "First name"
- Partner's email: email input

**Buttons:**
- "Send invite →" — primary, full width
  On submit: POST trip to DB, POST invite, navigate to step 4
- Divider: "or"
- "Plan solo for now" — secondary/ghost, full width
  On click: POST trip to DB with `status: 'solo'`, navigate to `/trips/:id`

**Below buttons (11px muted centered):**
"You can invite them later from inside the trip."

**On "Send invite →":**
1. Create trip in DB with `status: 'pending_partner'`
2. Create invite in DB, send email
3. Navigate to StepWaiting

---

### Screen 8 — Waiting state
**Route:** `/trips/new` (step 4) or `/trips/:id` when `status === 'pending_partner'`
**Component:** `onboarding/StepWaiting.jsx`

**Layout:** centered card. Progress bar 100% (filled).

**Partner status section (card within card):**
```
[A avatar]  You (Alex)        ✓ Preferences set    ← green text
[S avatar]  Sam               Invite sent · waiting ← dashed avatar border
```
Avatar states:
- You: solid color avatar (av-a blue)
- Partner pending: dashed border avatar, tertiary text

**Trip summary card (below partner status):**
- Trip name · destination
- Dates · duration
- "Your preferences are locked in"

**Buttons:**
- "Resend invite" — secondary
- "Browse the app while you wait" — ghost, navigates to `/`

**Auto-redirect:** when trip `status` changes to `'active'` (poll every 5s or
use websocket if available), redirect to `/trips/:id` automatically.

---

## Section 3 — Onboarding Partner B (screens 9–12)

### Screen 9 — Invite landing
**Route:** `/invite/:token`
**Component:** `pages/InviteLandingPage.jsx`

**On mount:** GET `/api/invites/:token` to validate.

**Valid token — show join screen:**

Hero card (blue tinted):
- "Alex invited you to plan"
- Trip name in larger text (15px 500, color-info)
- Dates · duration

Below hero: sign up form (name, email, password) OR "Already have an account? Log in"

**Expired token (screen 34a):**
- ✕ in red circle
- "This invite has expired"
- "Ask Alex to send a new invite from inside the trip."
- Trip details shown (read-only, from invite doc)
- Button: "Create my own trip instead" → `/signup`
- Link: "Already have account? Sign in"

**Already used token (screen 34b):**
- ✓ in green circle
- "You're already on this trip"
- "Sign in to see the trip."
- Button: "Sign in to view trip →" → `/login?redirect=/trips/:id`

---

### Screen 10 — Partner B sign up / log in
Handled within `InviteLandingPage.jsx` — not a separate page.
After auth, `acceptInvite` is called automatically, then redirect to screen 11.

---

### Screen 11 — Partner B preferences
**Route:** handled within InviteLandingPage after auth
**Component:** `onboarding/PreferencesForm.jsx`

**Layout:** same centered card.

**Header (above form):**
- "What do you like, [B name]?" (15px 500)
- "Alex already set theirs. Now it's your turn." (muted 12px)

**Form:** identical PreferencesForm as Step 2.

**CTA button text:** "Build our trip →" (not "Continue →")

**On submit:**
- POST preferences to `/api/trips/:id/preferences`
- Server automatically triggers generation
- Navigate to screen 12 (GenerationLoader)

---

### Screen 12 — Generation loading state
**Route:** `/trips/:id` when `status === 'generating'`
**Component:** `generation/GenerationLoader.jsx`

**Layout:** centered, no topbar. Full page focus moment.

**Contents:**
- Icon: ✦ in blue circle (48px)
- Heading: "Building your trip" (14px 500)
- Subtext: "Finding real places that work for both of you..." (muted)
- Progress list (updates in real time via polling or SSE):
  ```
  ✓  Alex's preferences loaded
  ✓  Sam's preferences loaded
  →  Searching places in Tokyo...     ← active step: color-info
     Structuring your 7 days          ← upcoming: tertiary
  ```

**Implementation:**
Poll `GET /api/trips/:id/generate/status` every 2 seconds.
Server returns `{ status, step, message }`.
Steps: `retrieving_places` | `running_llm` | `saving` | `complete`
On `complete`: redirect to TripWorkspace.
On error: show error state (screen 32).

---

## Section 4 — Core workspace (screens 13–23)

### Screen 13 — Dashboard
**Route:** `/`
**Component:** `pages/DashboardPage.jsx`

**Layout:** full page. Topbar with "My trips" title + "+ New trip" button.
Trip cards in a vertical list (mobile) or 2-col grid (desktop, min 640px).

**Trip card anatomy:**
- Trip name (13px 500)
- Destination · dates · duration (muted 12px)
- Partner avatars (stacked, right-aligned)
  - Active partner: solid avatar
  - Pending partner: dashed border avatar
- Status badge(s):
  - `status: 'active'` + conflicts → "X conflicts" (conflict chip)
  - `status: 'active'` no conflicts → no badge
  - `status: 'pending_partner'` → "Waiting for [name]" (amber chip)
  - `status: 'solo'` → "Solo" (neutral chip) + "Invite a partner" CTA button
  - `status: 'archived'` → "Archived" (gray chip)

**Empty state (screen 29):**
- Icon: ✈ in gray circle (48px)
- Heading: "No trips yet"
- Subtext: "Create your first trip and invite your partner to start planning together."
- Button: "Plan your first trip →"

**"+ New trip" button:** navigates to `/trips/new`

---

### Screens 14–16 — Trip workspace
Fully specified in CLAUDE.md ASCII wireframes (screen 1 of 6).
Key points not in the ASCII:

**TripWorkspace.jsx is the shell only.** It renders:
- Topbar
- DayTabs
- DayPanel (left)
- TripMap (right, hidden on mobile)
- BookingSheet (conditionally, over everything)
- PlaceSearch (conditionally, slides in from right or bottom)
- TripSettings (conditionally, as overlay/sheet)
- Banner (conditionally, at top)

**Topbar contents (left to right):**
- Breadcrumb: "My trips ›" (link) + trip name (current)
- Trip name (14px 500)
- Date range (muted)
- Partner avatars — clicking opens TripSettings
- Conflict count badge (red chip, only if conflicts > 0)
- "Expenses ↗" button → navigates to `/trips/:id/expenses`
- "Settings" button → opens TripSettings overlay

**DayTabs:**
- Horizontally scrollable, no visible scrollbar (`scrollbar-width: none`)
- Each tab: "Day N" text, bottom border 2px active indicator
- Active: color-info + blue underline
- Conflict: color-danger + "⚠" suffix
- "+ Day" tab always last — clicking adds a new day

**Mobile behavior:**
- Map hidden, shown as separate tab in bottom nav
- Bottom nav: [Trip] [Map] [Search] [Settings]
- [Trip] → DayPanel
- [Map] → TripMap full height
- [Search] → PlaceSearch full screen
- [Settings] → TripSettings

---

### Screen 17 — Activity card states
Fully specified in CLAUDE.md ASCII wireframes (screen 2 of 6).

**ActivityList.jsx** wraps activity cards with `@dnd-kit/sortable`.
Drag is only enabled when `day.ordered === true`.
When unordered: no drag handles rendered, no numbering on pins.

**"+ Add activity" card** (always last in list):
- Dashed border, centered text "+" + "Add activity to this day"
- Clicking opens PlaceSearch filtered to this day

**DayOrderToggle** (below activity list):
- Two-segment toggle: "Ordered" | "Unordered"
- Default: Unordered
- On switch to Ordered: activities get sequential `order` values based on
  current list position. Map switches to numbered pins + route polyline.
- On switch to Unordered: `order` set to null for all activities in day.
  Map switches to dot pins, no route.

---

### Screen 18 — Activity card conflict state
Part of ActivityCard component. See CLAUDE.md ASCII.

**"Keep anyway" action:**
- PATCH `/api/trips/:id/activities/:actId` with `{ conflict: { overridden: true } }`
- Card loses red border and conflict chip
- Pin changes from red to blue
- Conflict badge count in topbar decrements

---

### Screen 19 — Activity card expanded state
Part of ActivityCard component. See CLAUDE.md ASCII.

**Triggered by:** tapping the card body (not the action buttons).
**Collapsed by:** tapping "✕ Close" or tapping outside.
Only one card can be expanded at a time in a day.

**Expanded photo:** full width, 120px height, same photo reference as thumbnail.
Rounded top corners only (`border-radius: 6px 6px 0 0`).

**Detail grid rows:**
- Opens: from opening_hours data
- Est. cost: from `estimatedCostPerPerson` formatted via `currency.js`
- For two: `estimatedCostPerPerson × 2`
- From hotel: distance in minutes walk/drive — compute from coords delta (rough estimate)

**"Maps ↗" action:** calls `getDirectionsUrl(activity)` from `utils/booking.js`.
Opens Google Maps or Apple Maps depending on platform.

---

### Screen 20 — Place search / browse panel
**Component:** `trip/PlaceSearch.jsx`

**Triggered from:** "+ Add activity" card, "Swap" button on activity card,
"Fill gaps ↗" button (shows pre-filtered results), mobile [Search] tab.

**Layout (desktop):** slides in from right as a panel over the map (not replacing it).
Width: 360px. Close button top right.
**Layout (mobile):** full screen sheet slides up from bottom.

**Breadcrumb:** "Tokyo with Sam › Day 1 › Find places"

**Search input:** always focused on open.
Placeholder: `Search or describe... e.g. "quiet café near temples"`

**Debounce:** 400ms on keystroke.
On submit or 1.5s pause: if input looks like natural language (more than 3 words,
contains adjectives), route to LLM extraction then Places search.
Otherwise, route directly to Places search with keyword.

**Filter chips (below search):**
Pre-populated from merged partner interests.
Each chip is a toggle. Multiple can be active.
"Open today" chip — filters by opening_hours for current day date.

**Results list:**
Each result card (PlaceSearchResult.jsx):
- Photo thumbnail (52×52, left)
- Name (12px 500)
- Category · price · rating · distance from hotel
- Match label (11px tertiary):
  - "Matches both preferences" (no special styling)
  - "Matches your interests" (no special styling)
  - "⚠ [Partner] avoids this" — conflict styling (red)
- "+ Add to Day [N]" button

On conflict result: card has red border, red match label.
"+ Add anyway" replaces "+ Add to Day N".

**"No results" state (screen 33):**
- "No places found"
- Explanation of what was searched
- "Clear filters" button resets filter chips

---

### Screen 21 — Place detail sheet
**Component:** `trip/PlaceDetail.jsx`

**Triggered from:** tapping a PlaceSearchResult card body (not the Add button).

**Layout (mobile):** bottom sheet, slides up over PlaceSearch.
**Layout (desktop):** right panel within PlaceSearch panel (replaces results).

**Contents:**
- Photo: full width, 140px height
- "✕" close button: top right, absolute positioned
- "Fullscreen map ↗" button: bottom right of photo, absolute positioned
  → opens FullscreenMap centered on this place
- Breadcrumb: "Day 1 › Find places › [Place Name]"
- Name (14px 500)
- Category · price · rating · hours (muted 12px)
- Match explanation card (secondary bg):
  - "Why this matches you: [reason from LLM or rule match]"
  - "Est. cost for two: [formatted]"
  - "Best time: [time_of_day recommendation]"
- Action buttons:
  - "+ Add to Day [N]" — primary, flex 1
  - "Maps ↗" — secondary, fixed width

**On "+ Add to Day N":**
POST `/api/trips/:id/activities` with place data.
Server runs conflict check. Returns activity with conflict state.
Close sheet, show new card in DayPanel.
If conflict: card appears with red border immediately.

---

### Screen 22 — Generation loading state
See Section 3, Screen 12 above.

---

### Screen 23 — Expense dashboard
Fully specified in CLAUDE.md ASCII wireframes (screen 6 of 6).

---

## Section 5 — Trip management (screens 24–26)

### Screen 24 — Trip settings
**Component:** `settings/TripSettings.jsx`

**Triggered from:** "Settings" button in TripWorkspace topbar.

**Layout (mobile):** full screen bottom sheet, slides up.
**Layout (desktop):** overlay panel, right-aligned, 400px wide, full height.
Topbar of panel: "Trip settings" + "✕ Close" button.

**Section: Trip details**
Each row: label (left) + current value (muted, right) + "Edit" button.
- Trip name → inline edit (input replaces value text on click)
- Destination → navigates to a destination picker (same as wizard step 1)
- Dates → inline date pickers
- Days → read-only (computed from dates)

On date change that results in fewer days than current itinerary:
→ show warning inline: "Removing 2 days will delete their activities."
→ Confirm / Cancel

On date change that results in more days:
→ show prompt: "You added 3 days. Regenerate to fill them or add activities manually."
→ Regenerate / Fill manually (screen: dates changed edge case)

**Section: Partners**
Each partner row (PartnerRow.jsx):
- Avatar + name (+ "(you)" suffix for current user)
- Role label (Owner / Partner)
- Status chip: "Preferences set" (green) or "Waiting" (amber) or "Expired" (red)
- "Remove" button on partner rows (not on own row) → confirm dialog

"+ Invite another partner" link at bottom of section.
For POC: max 1 partner (2 participants total). If already has partner,
hide this link.

**Section: Your preferences**
Two rows:
- "View your preferences" → opens PreferencesReadOnly (your own)
- "View [partner name]'s preferences" → opens PreferencesReadOnly (partner's)

**Danger zone section:**
- "Regenerate trip" → confirm dialog "This will rebuild your itinerary using your current preferences. Changes you've made will be lost." → Confirm / Cancel
- "Delete trip" → confirm dialog with trip name typed for confirmation (optional for POC — at minimum a confirm dialog)

---

### Screen 25 — Partner management
Handled within TripSettings.jsx (Partners section).
No separate screen.

---

### Screen 26 — Partner preferences (read-only)
**Component:** `settings/PreferencesReadOnly.jsx`

**Triggered from:** TripSettings "View preferences" links.

**Layout:** overlay panel or bottom sheet within TripSettings.
Topbar: "Sam's preferences" + "← Back" button.

**Contents:**
- Partner avatar + name + date preferences were set
- Preferences in a detail list:
  - Pace: value
  - Interests: comma-separated
  - Morning person: "Yes" or "No — slow mornings"
  - Hard avoids: quoted string or "None"
- Footer (11px tertiary centered): "Read only · [Name] can edit from their own account"

No edit controls. This view is purely informational.

---

## Section 6 — Booking surface (screens 27–28)

### Screen 27 — Hotel suggestions
Part of ExpenseDashboard. See screen 23 / CLAUDE.md ASCII screen 6.

**Hotel search (separate sub-screen):**
Route: `/trips/:id/expenses/hotels`
Triggered from: "Find hotels ↗" in expense dashboard.

Hotels fetched from Google Places (type: `lodging`) filtered by destination.
Results show total stay price (not per-night) because couples care about total.
Three results maximum for POC.
Each has: photo, name, star rating, district, Google rating, total price, "Book on Booking.com ↗".

Booking link = Booking.com search URL with destination + dates + affiliate ID:
`https://www.booking.com/searchresults.html?ss={destination}&checkin={date}&checkout={date}&group_adults=2&aid={BOOKING_AFFILIATE_ID}`

---

### Screen 28 — Activity booking sheet
Fully specified in CLAUDE.md ASCII wireframes (screen 5 of 6).

**Implementation:**
BookingSheet.jsx is rendered at TripWorkspace level (not inside ActivityCard).
ActivityCard "Book →" button calls `openBooking(activity)` from `useBooking` hook.
Hook sets `bookingActivity` state in TripWorkspace.
TripWorkspace renders `<BookingSheet activity={bookingActivity} />` conditionally.

Closing the sheet: tap outside, tap ✕, or swipe down (mobile).

---

## Section 7 — Empty + error states (screens 29–34)

### Screen 29 — Empty dashboard
See screen 13 (Dashboard) above — empty state section.

---

### Screen 30 — Empty day
**Component:** rendered inside `DayPanel.jsx` when `activities.length === 0`

**Layout:** replaces the activity list area. Dashed border container, centered content.

**Contents:**
- "Nothing planned yet" (12px tertiary)
- Two buttons side by side:
  - "Find places ↗" → opens PlaceSearch
  - "Fill day with AI ↗" → triggers fill-gaps with no existing activities,
    AI suggests 3 starting activities

---

### Screen 31 — Solo mode workspace
**Component:** TripWorkspace with `trip.status === 'solo'`

**Differences from normal workspace:**
- No partner avatar in topbar (just current user's avatar)
- No conflict detection (no partner preferences to conflict with)
- No conflict chips anywhere
- Map pins all blue (no red conflict pins)
- "+ Invite partner" button in topbar (highlighted, blue bg)
- Inline nudge card inside DayPanel (below first activity):

```
Nudge card (secondary bg):
💡 Planning solo?
   Invite a partner to unlock taste matching and conflict detection.
   [Invite partner →]
```

Nudge appears once per session. Dismissed by clicking ✕ or inviting.
Store dismissed state in localStorage.

**Dashboard card for solo trip:**
- Solo chip
- "No partner yet" text
- Full-width "Invite a partner to this trip" button (blue outline)

**Invite modal (from dashboard or workspace):**
Same fields as StepInvite (name + email).
Amber warning box:
"Once [name] sets their preferences, we'll regenerate the trip.
Your current itinerary will be updated — you can review before saving."
Buttons: "Send invite →" | "Cancel"

---

### Screen 32 — Generation failed state
**Component:** rendered inside GenerationLoader when status === 'error'

**Layout:** same centered card as GenerationLoader.

**Contents:**
- Heading: "Something went wrong"
- Subtext: "We couldn't build the trip. Your preferences are saved — try again."
- Two buttons side by side:
  - "Try again" → POST `/api/trips/:id/generate` again
  - "Start with empty trip" → sets status to 'active' with no activities,
    navigates to TripWorkspace (all days empty, user builds manually)

---

### Screen 33 — No results in place search
Part of PlaceSearch.jsx. See screen 20 above.

---

### Screen 34 — Invite expired / declined
Part of InviteLandingPage.jsx. See screen 9 above.

**Additional states handled in TripSettings (screen 34b):**

Partner row when invite expired:
- Dashed red border avatar
- "Expired" chip (red)
- Amber warning box in settings:
  "Sam's invite expired. The link was valid for 7 days.
   Send a new one or remove Sam from this trip."
- Buttons: "Resend invite →" | "Remove Sam" (danger color)

---

## Section 8 — Notifications + emails (screens 35–38)

### Screen 35 — Invite email
**Sender:** hello@triptactician.com
**Subject:** "[Owner name] invited you to plan a trip to [Destination]"

**Email body (plain, inline styles only — no external CSS):**
- Logo text: "TripTactician"
- Two avatars (A and B) with dashed line + ✈ between them (inline HTML)
- Trip name + dates in a light gray box
- Greeting: "Hi [B name],"
- Body: "Alex is planning a trip to [destination] and wants to plan it together.
  TripTactician builds a shared itinerary using both your preferences — so the
  trip actually works for both of you."
- "Set your preferences (takes about 2 minutes) and we'll build the trip."
- CTA button: "Join the trip →" (blue bg, white text, border-radius 8px)
- "What happens next" section (gray bg box):
  1. You set your travel preferences
  2. We build a [N]-day [destination] itinerary for both of you
  3. Both of you can edit, swap, and book
- Footer: "This link expires in 7 days. If you didn't expect this email, ignore it."
- Unsubscribe link

**Implementation:** built in `emailService.js` `buildInviteEmailHtml()`.
No external email template engine — pure string interpolation.

---

### Screen 36 — Trip ready email (sent to both partners)
**Subject (to owner):** "Your [Destination] trip is ready"
**Subject (to partner):** "Your [Destination] trip with [Owner] is ready"

**Email body differs slightly per recipient — see below.**

**Owner version:**
- Logo
- Trip name (large)
- "[N] activities · [X] conflicts to review"
- Stat row: "[15] Both enjoy | [3] Conflicts"
- Body: "Sam has set their preferences. We've built a [N]-day itinerary that
  works for both of you — with [X] activities flagged where your tastes differ.
  Review and decide together."
- CTA: "View your trip →"
- Footer: "Both you and Sam received this email."

**Partner version:**
- Same structure
- Body: "Thanks for setting your preferences. We've built a [N]-day [destination]
  itinerary based on what both you and [owner] want. There are [X] activities
  worth a conversation — take a look."
- "Conflicts" label replaced with "To discuss" (softer framing for newcomer)

---

### Screen 37 — In-app notification: partner joined
**Component:** `ui/Notification.jsx` inside NotificationCentre

**Trigger:** when B accepts invite and `partner_joined` notification is created.

**Notification text:** "[Partner name] joined [Trip name] and set their preferences."
**Timestamp:** "2 min ago"
**Action button:** "View trip →"

**Unread state:** light blue background (`#F8FBFF`), blue dot indicator left.
**Read state:** white background, no dot.

---

### Screen 38 — In-app notification: partner made changes
**Trigger:** when partner adds, removes, or reorders an activity.
Written to ChangeLog, Notification created.

**Notification text:** "[Partner] added [N] activities and removed [N] since
you last visited."

**Action button:** "See changes"

On "See changes": marks notification read, scrolls to first changed activity
in the workspace (highlight briefly with a blue ring animation).
Shows changes banner at top of workspace (inline banner component):

```
Banner (blue bg):
[S avatar] Sam added 2 activities and removed 1 since you last visited.
                                                          [See changes]
```

**Other notification types and their text:**

| Type | Text |
|------|------|
| trip_ready | "Your [destination] trip is ready. [N] things to sort out together." |
| invite_expiring | "[Partner]'s invite expires in 48 hours. [Resend]" |
| trip_starting | "[Trip name] starts in 3 days. All set?" |
| partner_left | "Sam left [Trip name]. Conflict flags have been cleared." |

---

## Inline workspace banners (not full screens)

These appear at the top of TripWorkspace as contextual banners.
`ui/Banner.jsx` — variant prop controls color and icon.

**Partner left (amber):**
```
⚠  Sam left this trip. Conflict flags have been cleared.
   [Re-invite]  [✕]
```
On dismiss (✕): hide banner, write to localStorage so it doesn't reappear.
On "Re-invite": opens invite modal.

**Partner made changes (blue):**
```
[S] Sam added 2 activities and removed 1 since you last visited.   [See changes]
```
Auto-shown when changelog has unseen entries.
Dismissed by clicking "See changes" or ✕.

**Trip dates in the past (red):**
```
📅 This trip was in March. Are you back? Move it to memories.
   [Archive]  [✕]
```
"Archive" sets `status: 'archived'`. Trip moves to bottom of dashboard.
Only shown if trip end date < today and status !== 'archived'.

---

## Component state summary

For quick reference — what state lives where.

### TripWorkspace.jsx (local useState)
```javascript
activeDay          // number — currently selected day tab
mapFullscreen      // boolean
selectedPin        // Activity | null — which map pin is tapped
searchOpen         // boolean — PlaceSearch panel visible
bookingActivity    // Activity | null — BookingSheet target
settingsOpen       // boolean — TripSettings overlay visible
```

### DayPanel.jsx (local useState)
```javascript
expandedActivityId // string | null — only one card expanded at a time
```

### PlaceSearch.jsx (local useState)
```javascript
query              // string — search input value
filters            // { categories: string[], openToday: boolean }
selectedPlace      // Place | null — PlaceDetail target
```

### TripWizard.jsx (local useState)
```javascript
step               // 1 | 2 | 3 | 4
draft              // { name, destination, startDate, endDate }
// preferences saved directly to server on step 3 submit
```

### All server state — React Query
See `constants/queryKeys.js` in CLAUDE.md.
Never duplicate server state in useState.
Never fetch in components — use hooks.

---

## Styling reference

All styling via Tailwind. No inline styles. No CSS files (except Tailwind base).

**Key color usage:**
- `bg-blue-50 border-blue-400 text-blue-700` — info / active states
- `bg-red-50 border-red-300 text-red-700` — conflict / danger states
- `bg-green-50 border-green-400 text-green-700` — success / "set" states
- `bg-amber-50 border-amber-300 text-amber-700` — warning / waiting states
- `bg-gray-50 border-gray-200 text-gray-500` — neutral / tertiary states

**Typography:**
- Page headings: `text-lg font-medium` (18px 500)
- Section headings: `text-base font-medium` (16px 500)
- Body: `text-sm` (14px)
- Card titles: `text-[13px] font-medium`
- Meta / supporting: `text-xs text-gray-500` (12px muted)
- Tiny labels: `text-[11px] text-gray-400` (11px tertiary)

**Spacing rhythm:**
- Between sections: `mb-4` (16px)
- Between cards: `mb-2` (8px)
- Card padding: `p-3` (12px) mobile, `p-4` (16px) desktop
- Page padding: `px-4 py-4` mobile, `px-6 py-6` desktop

**Border radius:**
- Cards: `rounded-lg` (12px)
- Inputs, chips, buttons: `rounded-md` (8px)
- Pills / badges: `rounded-full`
- Avatars: `rounded-full`

**Borders:**
- Default: `border border-gray-200` (0.5px equivalent via `border`)
- Emphasis: `border-gray-300`
- Conflict: `border-red-300`
- Active/info: `border-blue-400`

---

*This document covers all 38 screens defined in the TripTactician UX design phase.*
*Read alongside CLAUDE.md. Do not modify during the build phase without explicit instruction.*
