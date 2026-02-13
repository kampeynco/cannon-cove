# 🧠 Brainstorm: Cannon Cove — Implementation Approach

## Context

**Cannon Cove** is a pirate-themed artillery game inspired by QBasic Gorillas — two pirate ships face off across a treacherous cove, firing cannonballs with adjustable angle and power, affected by wind and ocean waves. The full concept includes cross-platform deployment (Web + iOS + Android), Supabase backend, AdMob monetization, and RevenueCat IAP.

**The question:** What's the best approach to build the first playable version?

---

## Option A: Full-Stack First (Parallel Build)

Build the entire stack simultaneously — game engine, Supabase backend, Capacitor shell, and monetization in one pass.

✅ **Pros:**
- Everything wired together from day one
- Auth + leaderboards available at launch
- Single integration phase

❌ **Cons:**
- Highest upfront complexity — many moving parts before anything is playable
- Debugging is harder when game logic, auth, DB, and native shells are all half-built
- Risk of "integration hell" — nothing works until everything works
- Long time to first playable demo (4–6 weeks)

📊 **Effort:** High
⏱️ **Time to First Playable:** 4–6 weeks

---

## Option B: Game-First, Layer Up (Recommended ✅)

Build the core web game to completion first (canvas rendering, physics, AI, game loop), then layer on backend services (Supabase), then wrap with Capacitor, then monetize.

✅ **Pros:**
- **Playable demo within 1–2 weeks** — fast feedback loop, shareable immediately
- Each layer is independently testable before integration
- Matches the existing Gorillas codebase pattern — port the game logic first
- Natural milestones: web demo → authenticated → leaderboards → mobile → monetized
- YouTube tutorial series follows naturally from the build order

❌ **Cons:**
- Some refactoring needed when adding auth (wrapping game state with user sessions)
- Capacitor mobile testing comes later — platform-specific bugs surface late
- Temporary placeholder UI for menus/leaderboards

📊 **Effort:** Medium (spread across clear phases)
⏱️ **Time to First Playable:** 1–2 weeks

---

## Option C: Mobile-First (Capacitor Shell → Game Inside)

Set up the Capacitor project scaffold first (iOS + Android), then build the game inside the native shell from the start.

✅ **Pros:**
- Mobile viewport and touch controls are considered from the start
- No responsive retrofit needed later
- Can test haptics, splash screen, and native feel early

❌ **Cons:**
- Slower iteration cycle — native build + deploy to simulator for every change
- Xcode + Android Studio setup overhead before writing any game code
- Harder to share progress (no URL to send someone)
- Doesn't leverage the web-first architecture advantage

📊 **Effort:** Medium-High
⏱️ **Time to First Playable:** 3–4 weeks

---

## Option D: Minimum Viable Duel (Extreme MVP)

Build only the single-player duel mode with zero backend — local-only, no auth, no saves, no leaderboards. Just the canvas game in a single `index.html`.

✅ **Pros:**
- **Fastest possible demo** — could be playable in days
- Maximum focus on the core loop (the fun part)
- Perfect for a "Show HN" or Product Hunt teaser
- Easy to fork and hack on

❌ **Cons:**
- No persistence — close the tab, lose everything
- No monetization path
- Missing key differentiators (power-ups, multi-hit HP, dynamic sky)
- Significant rework needed to add structure for backend and mobile later

📊 **Effort:** Low
⏱️ **Time to First Playable:** 3–5 days

---

## 💡 Recommendation

**Option B: Game-First, Layer Up** — because it balances speed-to-playable with architectural soundness.

### Why Option B Wins

| Factor | Option A | **Option B** | Option C | Option D |
|--------|----------|-------------|----------|----------|
| Time to playable | 4–6 wks | **1–2 wks** | 3–4 wks | 3–5 days |
| Integration risk | High | **Low** | Medium | None |
| Shareability | Late | **Early** | Late | Immediate |
| Architecture quality | Good | **Good** | Good | Poor |
| Marketing readiness | Late | **Phased** | Late | Premature |
| Tutorial series fit | Poor | **Perfect** | Poor | Limited |

### Proposed Build Order (Option B)

```
Phase 1: Core Game Engine (Weeks 1–2)
  ├── Canvas rendering (ocean, ships, sky, projectiles)
  ├── Physics (gravity + wind + wave offset)
  ├── Input (angle/power controls, touch + mouse)
  ├── AI opponent (Monte Carlo + wave prediction)
  ├── Game modes (Duel, Crew Battle, Ghost Fleet)
  └── Visual polish (damage states, VFX, dynamic sky)

Phase 2: Supabase Backend (Week 3)
  ├── Auth (anonymous + OAuth)
  ├── Database schema (players, matches, leaderboard)
  ├── RLS policies
  ├── Cloud saves
  └── Edge Functions (anti-cheat, rewards)

Phase 3: Mobile Wrap (Week 4)
  ├── Capacitor project setup
  ├── Touch control optimization
  ├── Haptic feedback
  ├── Splash screen + app icon
  └── Platform testing (iOS + Android simulators)

Phase 4: Monetization (Week 5)
  ├── AdMob (rewarded video, interstitials)
  ├── RevenueCat IAP (ship skins, cannon effects)
  ├── Stripe web payments
  └── "Remove Ads" purchase flow

Phase 5: Launch Prep (Week 6)
  ├── App store assets + submissions
  ├── Product Hunt listing
  ├── YouTube tutorial series kickoff
  └── Community Discord setup
```

---

## Key Technical Decisions to Make

| Decision | Trade-off | Recommendation |
|----------|-----------|----------------|
| **Build tooling** | Vite (fast dev + tree shaking) vs. no bundler (simpler, like original) | **Vite** — minimal config, HMR for fast iteration, clean Capacitor integration |
| **Audio approach** | Web Audio API (full control) vs. Howler.js (simpler API) | **Howler.js** — handles browser autoplay quirks, mobile audio locking, format fallbacks |
| **Sprite approach** | Procedural canvas draws (like Gorillas) vs. PNG sprite sheets | **Procedural first** — keeps the "vanilla JS" angle, add sprite option for skins later |
| **State management** | Single object (like original) vs. finite state machine | **FSM** — cleaner turn management, easier to add power-ups and multiplayer later |
| **Testing** | Manual only vs. canvas snapshot tests | **Canvas snapshots + unit tests for physics** — physics bugs are invisible without tests |

---

*What direction would you like to explore? Ready to proceed to `/plan` for detailed task breakdown?*
