# Dragons of Mugloar: frontend

A React web app for playing [Dragons of Mugloar](https://dragonsofmugloar.com/) in the browser. You start a game, read the message board, pick the ads you want to solve, buy items in the shop and watch your score, gold and lives. The goal is to pass **1000 points**.

On top of the basics it has tools that help you decide: every ad shows its odds, expected value and risk, trap ads are detected and hidden, the board can be sorted and filtered, and an advisor panel suggests the next move with a one-click button.

This is the frontend half of an assignment. The backend half, a bot that plays the same game on its own, lives in a separate project (`dragons-of-mugloar-be`) and is where the live API facts used here were measured.

## Contents

- [Quick start](#quick-start)
- [Playing the game](#playing-the-game)
- [Decision tools](#decision-tools)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Testing](#testing)
- [Live API facts the app handles](#live-api-facts-the-app-handles)
- [Workarounds and non-obvious decisions](#workarounds-and-non-obvious-decisions)
- [Accessibility](#accessibility)
- [Known limitations](#known-limitations)

## Quick start

Requires Node 24 (`.nvmrc` is included).

```bash
nvm use            # picks Node 24
npm install
npm run dev        # http://localhost:5173
```

| Command                 | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Vite dev server with hot reload                             |
| `npm run build`         | Type-checks, then builds to `dist/`                         |
| `npm run preview`       | Serves the production build locally                         |
| `npm test`              | Runs all tests once (Vitest)                                |
| `npm run test:watch`    | Runs tests in watch mode                                    |
| `npm run test:coverage` | Runs tests with coverage and enforces the thresholds        |
| `npm run lint`          | ESLint                                                      |
| `npm run typecheck`     | `tsc --noEmit`                                              |
| `npm run format`        | Prettier, writes changes (`format:check` only reports them) |

The app talks to `https://dragonsofmugloar.com/api/v2` directly from the browser; the API allows cross-origin requests, so there is no proxy and no server of our own. To point it somewhere else, set `VITE_API_BASE_URL` (an empty value falls back to the default).

## Playing the game

1. **Start screen.** Read the three rules and press **Start new game**.
2. **Game screen.** The header shows score, gold, lives, level and turn, plus a progress bar toward 1000 points. The message board lists the ads; the shop, the advisor and the activity log sit beside it.
3. **Solve** an ad or **buy** an item. Every action takes one turn and the board refreshes afterwards. While a request is running, every action button is disabled.
4. **Summary screen.** The game ends when you run out of lives or press **End game** (it asks for confirmation). You see the final score, whether the goal was reached, solved and failed counts, gold spent, turns and items bought, and can play again.

Lives are not capped by the API, so a strong dragon never dies by itself. Reaching 1000 points does not stop the game; the goal bar just says "Goal reached!" and you keep playing until you end it.

On screens narrower than about 800px the layout becomes one column with Board, Shop and Activity tabs. The advisor stays at the top of the Board tab, and the last result stays visible on every tab.

## Decision tools

The difficulty labels on ads ("Sure thing", "Risky", ...) are turned into numbers, and everything else is computed from them while rendering (nothing derived is stored in state). All constants are in `src/domain/tuning.ts`; they were measured on the live API in the backend project.

| Tool          | How it works                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Odds          | Looked up from the label, for example Piece of cake 94%, Gamble 55%, Playing with fire 26%, Impossible 0%. An unknown label counts as 30%.                                                        |
| Value         | `odds x reward - (1 - odds) x 150`, where 150 is what losing a life is worth in gold.                                                                                                             |
| Risk badge    | Low from 85% odds, medium from 55%, high below that. Shown as text as well as colour.                                                                                                             |
| Trap detector | An ad whose message matches `/super\s+awesome/i` is a trap: huge reward, top label, but it costs a life. Traps are hidden by default, shown with a warning when you ask, and need "Solve anyway". |
| Sort          | Value (default), reward, risk (lowest first) or expiry (soonest first). Ties keep the API order.                                                                                                  |
| Advisor       | One suggestion, evaluated in order: heal, buy the next upgrade, solve the best safe ad, wait with a potion, or fall back to the least bad ad. It never recommends a trap.                         |

The advisor's rules in detail:

1. **Heal:** 2 or fewer lives and at least 50 gold: buy a healing potion.
2. **Upgrade:** the next upgrade in a fixed cost-effective order (`cs, gas, wax, tricks, wingpot, ch, rf, iron, mtrix, wingpotmax`) that has not been bought, if at least 50 gold is left afterwards.
3. **Solve:** the best non-trap ad whose value is at least 0. That ad also gets a "Recommended" badge.
4. **Wait:** with no safe ad, or only bad ones, a potion buys a fresh board (and a spare life) if enough gold stays in reserve.
5. **Fallback:** with no gold to wait, the least bad safe ad with a warning, or "No safe move" when only traps remain.

## Architecture

```text
src/
  main.tsx, App.tsx     mount; App shows the start, game or summary screen by game phase
  screens/              StartScreen, GameScreen, SummaryScreen
  components/           Hud, GoalBar, AdBoard, AdCard, AdFilters, Shop, ShopItem,
                        Advisor, ActivityLog, ErrorBanner, Illustration (placeholder slots)
  state/                game-reducer.ts, game-context.ts, GameProvider.tsx, use-game-actions.ts
  domain/               types, tuning, odds, value, traps, sort, advisor, shop (pure TypeScript)
  api/                  dragons-api.ts (interface), http-dragons-api.ts, schemas.ts (zod),
                        decode.ts, decode-ads.ts, retry.ts, errors.ts
  utils/                format.ts: number formatting shared by components and the advisor
  styles/               tokens.css, global.css  (each component also has a *.module.css)
test/                   domain, api, state, components, screens, integration, support, fixtures
```

Rules the code follows:

- **Dependencies point one way:** screens, then components, then state, then domain and api. `domain/` is the bottom layer: it may use `utils/` (small pure helpers), and ESLint forbids it from using React, `fetch`, `window`, or importing from `api/`, `state/`, `components/` or `screens/`.
- **`domain/` is pure TypeScript.** Odds, value, risk, trap detection, sorting and the advisor are plain functions that are tested without rendering anything.
- **`api/` is the only place that knows about the wire format.** It validates every response with zod, decodes encrypted ads, retries failures, and hands the app clean typed objects. No other code knows that encryption exists.
- **The API is injected.** `GameProvider` receives a `DragonsApi` implementation as a prop: the HTTP client in `main.tsx`, an in-memory fake in tests.
- **State is one `useReducer`** exposed through two contexts (state and actions). Components never dispatch directly; they call actions such as `solveAd` or `buyItem`.
- **No `useEffect` for loading data.** Async work runs in click handlers inside `startTransition`, which also provides the `isPending` flag that disables the buttons. The only effects in the app move keyboard focus.
- **Navigation follows the game phase** (`idle`, `playing`, `finished`). There is no router and no URL state.

One user action flows like this: a click calls an action, the action runs in a transition, calls the API, dispatches the result (`solved` or `purchased`), then re-fetches the board (and the shop after a purchase). When lives reach 0 the phase becomes `finished`. A failure dispatches `failed` with the action to retry and leaves the board on screen.

## Tech stack

| Area         | Choice                                                                                |
| ------------ | ------------------------------------------------------------------------------------- |
| UI           | React 19.3.1 (`useReducer`, Context, `useTransition`)                                 |
| Build        | Vite 8 with `@vitejs/plugin-react`                                                    |
| Language     | TypeScript 6.0.3, `strict` plus `noUncheckedIndexedAccess` and `verbatimModuleSyntax` |
| Validation   | zod 4 for every API response                                                          |
| Styling      | Plain CSS Modules and design tokens (`tokens.css`); no CSS framework                  |
| Tests        | Vitest 5, React Testing Library, user-event, jsdom, `@vitest/coverage-v8`             |
| Lint, format | ESLint 10 (typescript-eslint, react-hooks), Prettier                                  |
| Runtime      | Node 24 for tooling; all versions are pinned exactly in `package.json`                |

Why these: React's built-in state and transitions are enough for a single-screen, turn-based game, so there is no state library or data-fetching library. CSS Modules keep styles local without adding a dependency. zod gives runtime proof that API responses have the shape the code assumes.

## Testing

```bash
npm test                # 29 files, 251 tests
npm run test:coverage   # thresholds: 90% lines/functions/statements, 80% branches
```

Latest run: 96.8% statements, 93.3% branches, 97.2% functions, 98.9% lines.

| Layer       | What is covered                                                                                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain      | Odds, value, risk boundaries, trap detection, sorting and every advisor branch, mostly table-driven.                                                                                                                                            |
| API         | zod schemas against fixtures recorded from the real API, strict Base64 and ROT13 decoding (including the ad id), retry and backoff, the HTTP client with a stub `fetch`.                                                                        |
| State       | Every reducer action, immutability, log cap and order, and the async actions against the fake API.                                                                                                                                              |
| Components  | Cards, board sorting and filtering, shop affordability (including gold exactly equal to the cost), advisor, error banner, focus handling in confirmations.                                                                                      |
| Integration | The whole app rendered against an in-memory fake API and played the way a user would: start, solve, buy, trap confirmation, goal, game over, errors and retry, an expired game, duplicate ad ids, and "everything locked while a request runs". |

Tests never call the real API. The fixtures in `test/fixtures` are real responses copied from the backend project; the ROT13 one is synthetic (see below).

The automated tests cannot prove that the screens look and behave right in a real browser. To check that against the live API, run `npm run dev` and play until the score passes 1000, watching for: readable and solvable encrypted ads (they start appearing around turn 15), a Retry banner when the network is switched off mid-game, the tabs below 800px, and keyboard focus after solving and buying.

## Live API facts the app handles

These were verified against the live API in the backend project and shaped the design:

- **No state endpoint.** Score, gold, lives and turn are only reported in the responses to start, solve and buy, so the reducer is the single source of truth for the header.
- **Encrypted ads.** After roughly turn 15, ads arrive with `encrypted: 1` (Base64) or `2` (ROT13) and the message, difficulty label and `adId` encoded. Solving with the encoded id answers HTTP 400; the decoded id works. `api/` decodes everything before the app sees it.
- **Trap ads.** Messages like "Steal super awesome diamond pot from ..." pay 340 to 450 gold, carry top labels and cost a life.
- **Late boards can be all traps.** Any action that advances the turn refreshes the board; a healing potion is the cheapest one, which is why the advisor can recommend "waiting" by buying one.
- **Every call advances the turn**, including purchases and failed purchases.
- **Lives are not capped**, and healing potions work at full health.
- **Types differ from the docs.** `reward` is a number although the docs say string (a numeric string is accepted too), and `shoppingSuccess` may arrive as a boolean or a string.
- **Games expire** on the server: an old game id answers 404, so resuming a game after a reload is not supported.
- **CORS is open** (`access-control-allow-origin: *`), so the browser can call the API directly.

## Workarounds and non-obvious decisions

Things that were done differently from the obvious route, and why.

**Tooling**

- **TypeScript is pinned to 6.0.3, not the newer 7.x.** `typescript-eslint` 8.72.1 only supports TypeScript `>=4.8.4 <6.1.0`, so 7.x could not be linted. Revisit when typescript-eslint supports it.
- **Lockfile registry.** `npm install` on a company machine records an internal proxy host in every `resolved` URL of `package-lock.json`, which breaks `npm ci` for anyone outside that network. The lockfile was rewritten to `registry.npmjs.org`; if you regenerate it, check that no internal host sneaked back in (`grep resolved package-lock.json | sort -u`).

**API client**

- **Strict Base64.** The browser's `atob` is lenient (it ignores whitespace and missing padding). The decoder re-encodes its result with `btoa` and requires an exact match, so malformed input is rejected instead of silently decoded, and UTF-8 is decoded with `fatal: true`.
- **The ad id is decoded too.** The API's encoded id is rejected on solve, so the decoded id is stored as `adId`.
- **An ad that cannot be decoded is dropped** from the board; the rest still works. A response with the wrong shape is a failure and never reaches state.
- **ROT13 is implemented but never seen live.** It exists by analogy with `encrypted: 1`, and its fixture is synthetic (`messages-encrypted-2.synthetic.json`).
- **Timeouts are detected by error name.** A timed-out request rejects with a `DOMException` named `TimeoutError`; under jsdom a `DOMException` is not `instanceof Error`, so the client checks `name === 'TimeoutError'` instead.
- **Retries can double-apply a write.** Network errors, timeouts, 408, 429 and 5xx are retried with exponential backoff (5 attempts, 500 ms base, 10 s per attempt), also for solve and buy, because the API has no idempotency keys. A solve whose response was lost gets a 400 on the repeat and is shown as unavailable; a repeated buy may cost one extra purchase. In that case the header can also show stale numbers until the next response arrives, because there is no endpoint to re-read the state.

**State and UI**

- **Duplicate ad ids happen.** The live API can return two ads with the same id in one response (one of the recorded fixtures does). Cards are keyed by `adId:position-in-the-original-list` so React stays happy and the keys do not change when you re-sort. Both copies highlight together, which is truthful because the API addresses ads by id only.
- **Pending state instead of cancellation.** There is no request cancellation. Instead every control that starts, ends, resets or retries something is disabled while `isPending` is true, including the error banner's buttons, so a late response can never land in a newer game. The reducer itself does not check which game a result belongs to.
- **A solve that ends the game** leaves the board status alone; the board is not refreshed once lives hit 0, and the summary screen takes over.
- **A rejected solve** (HTTP 400) marks the ad unavailable for the turn, refetches the board and logs "That message could not be solved (it may have expired or already been taken)", worded as unknown because the server only says the request was refused.
- **Repeated results are still announced.** The last-result line is a live region whose text is re-created for every result, so two identical results in a row ("You bought Healing potion." twice) are both read out. It stays visible outside the tab panels on narrow screens.
- **Focus management.** Opening a confirmation (end game, solve a trap) moves focus to the safe choice, closing it returns focus to the button that opened it, and Escape cancels. Moving between the game and summary screens focuses the screen heading. These are the only `useEffect`s in the app.
- **Buy buttons and Solve buttons** keep their short visible text; Solve buttons point at the ad's message with `aria-describedby` so a screen reader can tell them apart, and Buy buttons carry the item name in `aria-label`.
- **Unavailable cards are not faded.** Fading with `opacity` pushes the text below the 4.5:1 contrast ratio, so unavailable ads use a dashed border and a muted background instead.
- **Illustrations are placeholders.** `Illustration` renders named slots (start hero, empty board, summary, ad icon) so artwork can be added later without touching any logic.

**Testing**

- **Fixtures are loaded through `fs`.** `new URL('../fixtures/x', import.meta.url)` resolves to `/test/fixtures/x` under the jsdom environment and fails, so `loadFixture` reads from `import.meta.dirname`.
- **React 19 links pending async transitions.** A transition that never finishes keeps later ones from settling, which made one failing test cascade into unrelated ones. The fake API tracks every held request (`hold()`), and a global `afterEach` calls `releaseAllInstances()` so a failing test cannot leak one.
- **Waiting for pending state.** `isPending` commits asynchronously, and a disabled button silently swallows a click. Tests therefore wait with `waitFor`/`findBy` before asserting disabled or enabled states and use a small `clickWhenEnabled` helper. Async utility timeouts are 5 s and the test timeout 15 s so the suite stays stable when the machine is busy (it was checked with 8 parallel runs).
- **The fake API does not encrypt.** It works with already-decoded ads; encryption and the encoded-id path are covered by the HTTP client tests and the recorded fixtures.

## Accessibility

- Semantic markup: one `h1` per screen, a `main` landmark, labelled sections, lists for ads and the log, and a `dl` for stats.
- Everything is operable with the keyboard, with a visible `:focus-visible` ring.
- Colour is never the only signal: risk, trap, recommended, suggested and unavailable states all have text. Colour pairs were checked against WCAG AA (4.5:1) for text.
- The last result is announced through a live region; errors use `role="alert"`.
- `prefers-reduced-motion` is respected.

## Known limitations

- **No resume.** Reloading the page loses the game (and games expire on the server anyway).
- **Late results are guarded by the UI only,** not by the reducer, as described above.
- **The board's error state is not shown.** If a refresh fails and you dismiss the banner, the old ads stay on screen with no hint that they may be out of date until your next action.
- **Keyboard focus** is not restored after Solve, Buy or Retry: the pressed button is disabled while the request runs and the card may disappear, so focus can fall back to the page. Play still works, but it is tedious.
- **An identical error shown twice** by two different failing actions, without dismissing in between, is not announced the second time.
- **The reputation endpoint** (`/investigate/reputation`) is not used.
- **Out of scope for this version:** the player's own learned odds, score charts, an autopilot button, routing, translations, deployment and real artwork.
