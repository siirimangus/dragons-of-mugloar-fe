# Dragons of Mugloar: frontend

A React web app for playing [Dragons of Mugloar](https://dragonsofmugloar.com/) in the browser. You start a game, read the message board, pick the ads you want to solve, buy items in the shop and watch your score, gold and lives. The goal is to pass **1000 points**.

On top of the basics it has tools that help you decide: every ad shows its odds, expected value and risk, trap ads are detected and flagged, the board can be sorted, and an advisor panel suggests the next move with a one-click button.

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
- [Credits](#credits)

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

1. **Start screen.** Read the two rules and press **Start new game**.
2. **Game screen.** The header shows score, gold, lives, level and turn. The message board lists the ads; the shop, the advisor and the activity log sit beside it. The activity log keeps every turn of the game, newest first, and scrolls once it gets long.
3. **Solve** an ad or **buy** an item. Every action takes one turn and the board refreshes afterwards. While a request is running, every action button is disabled.
4. **Summary screen.** The game ends when you run out of lives or press **End game** (it asks for confirmation). You see the final score, solved and failed counts, gold spent, turns and items bought, and can play again.

Lives are not capped by the API itself, but the app caps how many healing potions you can buy in a game (see [Decision tools](#decision-tools)), so a dragon can still run out for good: the game does not necessarily go on until you choose to end it.

On screens narrower than about 800px the layout becomes one column with Board, Shop and Activity tabs. The advisor stays at the top of the Board tab, and the last result stays visible on every tab.

## Decision tools

The difficulty labels on ads ("Sure thing", "Risky", ...) are turned into numbers, and everything else is computed from them while rendering (nothing derived is stored in state). Each ad is described exactly once per board by `arrangeBoard`, which sorts and attaches the insight in one pass. The measured constants are in `src/domain/tuning.ts` (calibrated on the live API in the backend project, 40 games, Nov 2026, with the sample behind each number).

| Tool          | How it works                                                                                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Odds          | Looked up from the label, for example Piece of cake 94%, Gamble 51%, Playing with fire 23%, Impossible 0%. An unknown label counts as 30%.                                                                                 |
| Value         | `odds x reward - (1 - odds) x 150`, where 150 is what losing a life is worth in gold. The card shows the total; an info button beside it opens the breakdown, expected gain against risk cost, with this ad's own numbers. |
| Risk badge    | Low from 85% odds, medium from 55%, high below that. Shown as text as well as colour.                                                                                                                                      |
| Trap detector | An ad whose message matches `/super\s+awesome/i` is a trap: huge reward, top label, but it costs a life. Shown on the board with a warning, and needs "Solve anyway" plus a confirmation.                                  |
| Sort          | Value (default), reward, risk (lowest first) or expiry (soonest first). Ties keep the API order.                                                                                                                           |
| Advisor       | One suggestion, evaluated in order: heal, buy the next upgrade, solve the best safe ad, wait with a potion, fall back to the least bad ad, or, with nothing else left, solve a trap.                                       |

The advisor's rules in detail:

1. **Heal:** 2 or fewer lives and at least 50 gold: buy a healing potion, as long as the potion limit (see below) has not been reached.
2. **Upgrade:** the next upgrade in a fixed cost-effective order (`cs, gas, wax, tricks, wingpot, ch, rf, iron, mtrix, wingpotmax`) that has not been bought, if at least 50 gold is left afterwards. This is where the score comes from: upgrades roughly double the rewards the board offers (they do **not** improve your odds, see below). Unlike potions, upgrades have no purchase limit of their own; there are only ten of them and each is useful once, which is a limit in itself.
3. **Solve:** the best non-trap ad whose value is at least 0. That ad also gets a "Recommended" badge.
4. **Wait:** with no safe ad, or only bad ones, a potion buys a fresh board and a spare life, as long as the limit allows it. It is worth buying whenever it is affordable, with no gold held back: turns are free and gold has no use outside the shop. (The backend measured this at about +400 points a game against keeping a reserve.)
5. **Fallback:** with no potion available, the least bad safe ad, with a warning.
6. **Last resort:** when only traps are left and no potion is available, solve a trap. It almost certainly costs a life, but the turn only advances when you act, so nothing else refreshes the board; standing still would freeze the game. The advisor asks for confirmation first. "No move available" is therefore only reached on a genuinely empty board.

**The potion limit.** A healing potion is cheap relative to typical gold income and heals at any life total, so without a cap a player could keep a full life bar forever and never need to risk a worse ad. At most 10 can be bought in a game (`MAX_POTIONS` in `src/domain/tuning.ts`); the Shop's "Healing" group is labelled with the cap ("Healing (max 10 lives)"), and its Buy button disables with a "limit reached" note once it is spent. Upgrades are not capped this way. Past the limit the advisor falls straight to solving the best available ad, bad ones included, which is the point: a long game eventually has to take on real risk.

## Architecture

```text
src/
  main.tsx, App.tsx     mount; App shows the start, game or summary screen by game phase
  screens/              StartScreen/, GameScreen/, SummaryScreen/
  components/           GameHeader/, AdBoard/, AdCard/, AdFilters/, Shop/, ShopItem/,
                        Advisor/, ActivityLog/, ErrorBanner/, Logo/, Illustration/ (artwork)
  state/                game-reducer.ts, game-context.ts, GameProvider.tsx, use-game-actions.ts
  domain/               types, tuning, odds, value, traps, board, advisor, shop (pure TypeScript)
  api/                  dragons-api.ts (interface), http-dragons-api.ts, schemas.ts (zod),
                        decode.ts, decode-ads.ts, retry.ts, errors.ts
  utils/                format.ts: number formatting shared by components and the advisor
  assets/               logo.png and three parchment pictures (artwork, see Credits)
  styles/               tokens.css, global.css (shared; each component keeps its own styles)
public/                 favicon.png (served as is at the site root)
test/                   domain, api, state, components, screens, integration, support, fixtures
```

Each component and screen is a folder named after it, holding `index.tsx` and its CSS Module, for example `components/GameHeader/index.tsx` and `components/GameHeader/GameHeader.module.css`. Imports stay short (`from '../components/GameHeader'`) because the folder resolves to its `index.tsx`.

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
npm test                # 29 files, 268 tests
npm run test:coverage   # thresholds: 90% lines/functions/statements, 80% branches
```

Latest run: 96.9% statements, 93.6% branches, 97.2% functions, 98.9% lines.

| Layer       | What is covered                                                                                                                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain      | Odds, value, risk boundaries, trap detection, sorting and every advisor branch, mostly table-driven.                                                                                                                                      |
| API         | zod schemas against fixtures recorded from the real API, strict Base64 and ROT13 decoding (including the ad id), retry and backoff, the HTTP client with a stub `fetch`.                                                                  |
| State       | Every reducer action, immutability, the full log kept newest first, and the async actions against the fake API.                                                                                                                           |
| Components  | Cards, board sorting, shop affordability (including gold exactly equal to the cost), advisor, error banner, focus handling in confirmations.                                                                                              |
| Integration | The whole app rendered against an in-memory fake API and played the way a user would: start, solve, buy, trap confirmation, game over, errors and retry, an expired game, duplicate ad ids, and "everything locked while a request runs". |

Tests never call the real API. The fixtures in `test/fixtures` are real responses copied from the backend project; the ROT13 one is synthetic (see below).

The automated tests cannot prove that the screens look and behave right in a real browser. To check that against the live API, run `npm run dev` and play until the score passes 1000, watching for: readable and solvable encrypted ads (they start appearing around turn 15), a Retry banner when the network is switched off mid-game, the tabs below 800px, and keyboard focus after solving and buying.

## Live API facts the app handles

These were verified against the live API in the backend project and shaped the design:

- **No state endpoint.** Score, gold, lives and turn are only reported in the responses to start, solve and buy, so the reducer is the single source of truth for the header.
- **Encrypted ads.** After roughly turn 15, ads arrive with `encrypted: 1` (Base64) or `2` (ROT13) and the message, difficulty label and `adId` encoded. Solving with the encoded id answers HTTP 400; the decoded id works. `api/` decodes everything before the app sees it.
- **Trap ads.** Messages like "Steal super awesome diamond pot from ..." pay 340 to 450 gold, carry top labels and cost a life.
- **Harder ads pay more, not less.** Measured over 650 live ads (40 fresh games plus a run to level 7), reward rises as the label gets worse: at level 0 "Sure thing" averages 25 gold and "Playing with fire" 43, a Pearson correlation of -0.17 between success chance and reward (-0.19 at level 4 to 7). The board is not handing out easy money; it is the 150-gold life price that makes the safe ad win almost every time. On those same boards the top-value ad is labelled low-risk on 94% of them, which is why the choice can feel made for you. Only once upgrades inflate the rewards (a Gamble at 260 gold against a Sure thing at 40) does the risky side start winning, and the breakdown behind each card's info button exists so that moment is visible.
- **Upgrades scale rewards, not odds.** Dragon level does not change the success rate of a label: the backend compared two 20-game calibration runs, one fully upgraded and one at level 0 throughout, and every one of the ten labels matched within noise. What level changes is the reward on offer, which roughly doubles. Because `reward` is read from each ad as the API sends it, the value calculation picks this up with no level term of its own.
- **`highScore` is always 0.** Both `/game/start` and `/solve` return the field, but it stayed 0 across every game sampled, even with the score at 214. It is not read, and it is not in `Session`.
- **Late boards can be all traps.** Any action that advances the turn refreshes the board; a healing potion is the cheapest one, which is why the advisor can recommend "waiting" by buying one.
- **Every call advances the turn**, including purchases and failed purchases.
- **Lives are not capped**, and healing potions work at full health. The app imposes its own limit on how many can be bought (see [Decision tools](#decision-tools)), since the API itself never stops you.
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
- **The last-result banner is boxed only once there is a result.** The live region has to stay mounted for announcements to be reliable, so before the first action it renders as an empty paragraph with no border or padding, rather than an empty box sitting at the top of the screen.
- **The value breakdown is a CSS-only tooltip.** Its trigger is a real `<button>`, so it is keyboard-reachable, and the panel is tied to it with `aria-describedby`, which a screen reader announces on focus whether or not the panel is visible (it is hidden with `opacity`, which keeps it in the accessibility tree, not `display: none`, which would not). Showing it is pure `:hover`/`:focus-within` with no state, so unlike the confirmations it cannot be dismissed with Escape: moving the pointer or focus away is what closes it. Accepted for a small secondary explanation that obscures nothing.
- **The game screen is flexbox, not grid.** A hidden flex item leaves no gap behind it, while a grid's named row keeps its gap even with nothing in it. That difference is why the narrow tab layout, which hides three of its four panels at a time, stacks its gaps correctly now.
- **Focus management.** Opening a confirmation (end game, solve a trap, or follow advice that costs a life) moves focus to the safe choice, closing it returns focus to the button that opened it, and Escape cancels. The advisor's confirmation is tied to the ad it was opened for, so advice that changes underneath it cancels rather than carrying over to a different target. Moving between the game and summary screens focuses the screen heading. These are the only `useEffect`s in the app.
- **Buy buttons and Solve buttons** keep their short visible text; Solve buttons point at the ad's message with `aria-describedby` so a screen reader can tell them apart, and Buy buttons carry the item name in `aria-label`.
- **Unavailable cards are not faded.** Fading with `opacity` pushes the text below the 4.5:1 contrast ratio, so unavailable ads use a dashed border and a muted background instead.
- **Artwork goes in named slots.** `Illustration` renders a picture for a slot (start hero, empty board, summary) from one table, so screens say where artwork goes and not which file it is. The start screen shows the "Missing Zelda" poster under the logo, an empty message board shows the "Royal Request of Escort" parchment, and the summary screen shows the dragon-in-the-barn sketch. Adding a slot means adding one entry to the table (the compiler requires it). The images are kept in the repo (`src/assets/`) and imported by the component, so Vite fingerprints them and the app does not depend on another site being online.

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
- **The life price is a constant, not a model.** `LIFE_VALUE` is 150 gold for the whole game, although a life actually costs 50 gold to replace while a potion is affordable and is priceless on the last one. The backend measured 150 as the better score at live reward scale, so it stays; a situational price would make `Value` less of a restatement of the difficulty label, at some cost in score.
- **Out of scope for this version:** the player's own learned odds, score charts, an autopilot button, routing, translations, deployment and further artwork.

## Credits

The images and the favicon are artwork from the Dragons of Mugloar game. They are not original to this project.

- **"Missing Zelda" poster** (`src/assets/zelda-on-paper.webp`), shown on the start screen, from `https://dragonsofmugloar.com/assets/zeldaOnPaper.png`. The original is a 1567 x 1427 PNG of 1.5 MB; the copy here is resized to 1200 px wide and converted to WebP (about 270 KB, transparency kept). Its alt text repeats the words written on the poster.
- **"Royal Request of Escort" parchment** (`src/assets/ambassador-on-paper.webp`), shown when the message board is empty, from `https://dragonsofmugloar.com/assets/ambassadorOnPaper.png`. The original is a 2100 x 1500 PNG of 1.4 MB; the copy here is resized to 800 px wide (it is shown small) and converted to WebP (about 93 KB, transparency kept). Its alt text repeats the words written on the parchment.
- **Dragon sketch** (`src/assets/dragon-in-barn.webp`), shown on the summary screen, from `https://dragonsofmugloar.com/assets/dragonInBarnOnPaper.png`. The original is a 2100 x 1500 PNG of 5.2 MB; the copy here is resized to 1200 px wide and converted to WebP (about 220 KB, transparency kept).
- **Title logo** (`src/assets/logo.png`), from `https://dragonsofmugloar.com/assets/logo.png`, used unchanged (1200 x 195, 57 KB). It is the `h1` on both the start screen and the game screen's header, with "Dragons of Mugloar" as its alt text.
- **Favicon** (`public/favicon.png`), from `https://dragonsofmugloar.com/assets/favicon.png`, used unchanged (64 x 64, 9.5 KB) and linked from `index.html`.
