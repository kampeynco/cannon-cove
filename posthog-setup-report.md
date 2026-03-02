<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into **Cannon Cove**, a browser-based pirate artillery game. A new `src/posthog.js` module was created to send events to PostHog via the HTTP Capture API (using `fetch` with Vite environment variables). Ten distinct events were instrumented across two files — `src/game.js` (game lifecycle, player actions, UI interactions) and `src/supabase.js` (authentication and user identification). Users are identified with their Supabase UUID on every auth state refresh, and anonymous IDs are persisted in `localStorage` to stitch pre-login sessions together.

| Event Name | Description | File |
|---|---|---|
| `game started` | Fired when a new game round begins; captures `game_mode` and `is_authenticated` | `src/game.js` |
| `shot fired` | Fired each time a player launches a cannonball; captures `angle`, `power`, `wind`, `round`, `game_mode`, `player_index` | `src/game.js` |
| `match completed` | Fired at the end of every match; captures `player_won`, `winner_name`, `rounds`, `accuracy_pct`, `duration_seconds`, `game_mode`, `opponent_type` | `src/game.js` |
| `sign in attempted` | Fired when a player clicks Google or email sign-in; captures `method` | `src/game.js` |
| `user signed in` | Fired after a user successfully authenticates (non-anonymous); captures `provider` and `has_name`. Also calls `identifyUser()` to link the PostHog person to the Supabase UUID | `src/supabase.js` |
| `matchmaking started` | Fired when a player enters the High Seas matchmaking queue | `src/game.js` |
| `match found` | Fired when two online players are paired; captures `match_id`, `opponent_name`, `is_player1` | `src/game.js` |
| `power up collected` | Fired when a player hits a crate and collects a power-up; captures `effect_name`, `player_index`, `game_mode`, `round` | `src/game.js` |
| `profile updated` | Fired after a user saves their captain name and optional avatar; captures `captain_name_set`, `avatar_uploaded` | `src/game.js` |
| `leaderboard viewed` | Fired when a player opens the leaderboard screen | `src/game.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- 📊 **Dashboard — Analytics basics**: [https://us.posthog.com/project/328649/dashboard/1321513](https://us.posthog.com/project/328649/dashboard/1321513)
- 📈 **Daily Games Started vs Matches Completed**: [https://us.posthog.com/project/328649/insights/gOOB36ue](https://us.posthog.com/project/328649/insights/gOOB36ue)
- 🔻 **Sign-up Conversion Funnel** (Game Started → Sign In Attempted → Signed In): [https://us.posthog.com/project/328649/insights/nptzSfTT](https://us.posthog.com/project/328649/insights/nptzSfTT)
- 🎮 **Game Mode Popularity** (Duel vs High Seas vs Crew Battle vs Ghost Fleet): [https://us.posthog.com/project/328649/insights/NX565Djc](https://us.posthog.com/project/328649/insights/NX565Djc)
- 🌊 **Online Matchmaking Success Rate** (Matchmaking Started vs Match Found): [https://us.posthog.com/project/328649/insights/efkunKHO](https://us.posthog.com/project/328649/insights/efkunKHO)
- ⚔️ **Gameplay Engagement: Shots, Power-ups & Leaderboard**: [https://us.posthog.com/project/328649/insights/QAIeBTso](https://us.posthog.com/project/328649/insights/QAIeBTso)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
