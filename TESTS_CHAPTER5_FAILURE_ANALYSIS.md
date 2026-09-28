# Why the Playwright tests in `tests-chapter5` do not pass

**Scope:** analysis only — no application or test code was modified.
**Test run:** `npx playwright test --reporter=list` inside `tests-chapter5/`
**Result:** `16 tests → 7 passed, 9 failed` (every failure times out after 10 s).

---

## 1. Executive summary

The infrastructure is **not** the problem. The in-memory MongoDB, the test backend
(`_resetDatabase`, seeding, auth), the Vite dev server and the browser all work — proven by
the 7 tests that pass (front page, books page, and the five "not logged in" negative checks).

All 9 failures are caused by the **frontend markup not matching what the tests locate**, in two
layers:

1. **Blocking layer (the error you actually see in the run):** form inputs have no label
   association, so `page.getByLabel('username')` never resolves → every test that logs in dies
   in `loginWith()` at `tests/helper.js:99`.
2. **Latent layer (still hidden behind the first error):** even if labels were fixed, 9 tests
   would keep failing because of wrong/missing button and heading text, a `react-select`
   dropdown instead of a native `<select>`, a hardcoded password and a missing error message,
   plus a Playwright strict-mode collision on the `books` button.

In other words: fixing the labels alone moves the suite from *9 failures* to *9 failures with
different messages*.

---

## 2. Test-run evidence (what the runner actually reports)

```
✘ login succeeds with correct credentials            → locator.fill: waiting for getByLabel('username')
✘ login fails with wrong password                    → locator.fill: waiting for getByLabel('username')
✘ a new book can be added                            → beforeEach: getByLabel('username')
✘ author birth year can be updated                   → beforeEach: getByLabel('username')
✘ genre filter buttons are shown                     → beforeEach: getByLabel('username')
✘ filtering by genre works                           → beforeEach: getByLabel('username')
✘ all genres button shows all books                  → beforeEach: getByLabel('username')
✘ recommendations shows books in favorite genre      → beforeEach: getByLabel('username')
✘ new book appears in genre filtered view            → beforeEach: getByLabel('username')
```

The page snapshot Playwright saved (`test-results/.../error-context.md`) shows the problem
plainly — the words "username"/"password" are **bare text nodes**, not labels:

```yaml
- generic [ref=e10]:
    - generic [ref=e11]:
      - text: username          <-- text, not a <label>
      - textbox [ref=e12]       <-- input with no label / aria-label / for=
    - generic [ref=e13]:
      - text: password
      - textbox [ref=e14]
    - button "login" [ref=e15]
```

`getByLabel()` only matches `<label>` (wrapping or `for=`), `aria-label` and
`aria-labelledby` — never a sibling text node. Hence the timeout.

---

## 3. Root cause #1 — inputs are not labelled (blocks 9 of 9 failures)

| Where | Problem |
|---|---|
| `library-frontend/src/components/LoginForm.jsx:39-54` | `username` and `password` are plain text inside a `<div>` next to the `<input>`s; there are no `<label>` elements at all |
| `library-frontend/src/components/NewBook.jsx:63-93` | same pattern for `title`, `author`, `published` and the genre input |

Affected test code:

- `tests-chapter5/tests/helper.js:99-101` — `loginWith()` → `getByLabel('username')`,
  `getByLabel('password')`
- `tests-chapter5/tests/helper.js:107-112` — `createBook()` → `getByLabel('title')`,
  `getByLabel('author')`, `getByLabel('published')`, `getByLabel('genre')`

`loginWith()` is called by:

- `library.spec.js:61` (`login succeeds with correct credentials`)
- `library.spec.js:74` (`login fails with wrong password`)
- `library.spec.js:82` — the `beforeEach` of the whole `When logged in` block → the 7 tests
  nested inside it

That is exactly the 9 failures.

---

## 4. Root cause #2 — latent failures (would appear right after fixing #1)

Everything below was verified against the **running application** with a temporary diagnostic
spec kept outside the repository (nothing in the project was edited), plus a synthetic check of
Playwright's locator semantics.

### 4.1 The `recommend` button does not exist — the app renders `favorite books`

- Test: `library.spec.js:65-67` expects `getByRole('button', { name: 'recommend' })` to be
  visible after login; `library.spec.js:151` clicks it.
- App: `library-frontend/src/App.jsx:36` renders `<button …>favorite books</button>`.
- Measured on the live app: `getByRole('button', { name: 'recommend' }).count() === 0`,
  `…{ name: 'favorite books' }.count() === 1`.

Fails: **login succeeds with correct credentials**, **recommendations shows books in favorite genre**.

> Side note: the negative test `recommend button is not shown when not logged in`
> (`library.spec.js:38`) passes *vacuously* — the button is missing for logged-out **and**
> logged-in users. Its positive counterpart is what exposes the bug.

### 4.2 Wrong password actually logs the user in (hardcoded password + no error UI)

Two independent defects, either one fatal for `login fails with wrong password`
(`library.spec.js:73-77`):

1. **`library-frontend/src/components/LoginForm.jsx:22`** — the mutation ignores what the user
   typed and always sends `password: "secret"`. Measured live: after entering
   `definitely-wrong` the app logged in successfully (`logout` button appeared, nav switched to
   the logged-in set of buttons).
2. **There is no error handling at all** in `LoginForm` — no `onError`, no error state, no
   message element. Even a genuine backend rejection is never rendered, so
   `expect(page.getByText(/login failed/i)).toBeVisible()` can never succeed.
   Measured live: `getByText(/login failed/i).count() === 0` and
   `getByText(/wrong credentials/i).count() === 0` after a failed login.
3. *(Consistency detail)* the backend error text is `"wrong credentials"`
   (`library-backend/resolvers.js:134`), which does not contain "login failed", so the frontend
   must render its own message matching `/login failed/i`.

Fails: **login fails with wrong password**.

### 4.3 Strict-mode collision on the `books` navigation button

- Tests click `page.getByRole('button', { name: 'books' }).click()` while logged in
  (`library.spec.js:94, 115, 129, 140, 170`).
- Playwright's `name` option is **case-insensitive substring matching by default**, so it
  matches both `books` and `favorite books`.
- Measured live:

```
strict mode violation: getByRole('button', { name: 'books' }) resolved to 2 elements:
  1) <button>books</button>
  2) <button>favorite books</button>
```

This is a *symptom of 4.1*: renaming `favorite books` → `recommend` (which the tests require
anyway) also removes the collision.

Fails: **a new book can be added**, **genre filter buttons are shown**, **filtering by genre
works**, **all genres button shows all books**, **new book appears in genre filtered view**
(for those that reach this line).

### 4.4 The birth-year form is a `react-select` dropdown, not a native `<select>`

- Test: `library.spec.js:105` → `page.locator('select[name="name"]').selectOption('Martin Fowler')`.
- App: `library-frontend/src/components/BirthYearForm.jsx:31-37` uses
  `<Select>` from `react-select` (v5), which renders `div.css-… / input#react-select-3-input`.
- Measured live: `page.locator('select[name="name"]').count() === 0`
  (`[id^="react-select"]` count = 3).

Two further problems in the same test (`library.spec.js:99-111`):

3. **`getByLabel('born')` = 0** — `BirthYearForm.jsx:39-47` puts the word `born` as plain text
   before the `<input>`, not inside a `<label>`.
4. **Heading text mismatch** — the test asserts
   `getByRole('heading', { name: 'Set birthyear' })` (one word), the app renders
   `<h3>Set birth year</h3>` (`BirthYearForm.jsx:28`). Measured: `count === 0` for
   `'Set birthyear'`, `count === 1` for `'Set birth year'` and for `/set birth ?year/i`
   (the *negative* assertion at `library.spec.js:56` uses the regex and therefore passes).

Fails: **author birth year can be updated**.

### 4.5 The books page never shows any "in genre" text

- Test: `library.spec.js:132` → `expect(page.getByText('in genre')).toBeVisible()` after
  picking a genre.
- App: `library-frontend/src/components/Books.jsx:29` only renders `<h2>books</h2>`; selecting a
  genre changes the query but produces no indication of the active genre.
- Measured live: `getByText('in genre').count() === 0` both before and after filtering
  (filtering itself works — the rows were correctly reduced to the 3 refactoring books).

Fails: **filtering by genre works** (in addition to 4.3).

### 4.6 The recommendations page has the wrong heading and no exact `refactoring` text

- Tests: `library.spec.js:154-157` expect
  - heading `recommendations`
  - text `books in your favorite genre`
  - text `refactoring` **exactly**
- App: `library-frontend/src/components/FavoriteBooks.jsx:44` renders
  `<h2>books in your favorite genre: {favoriteGenre}</h2>`.
- Measured live:
  - `getByRole('heading', { name: 'recommendations' }).count() === 0`
  - `getByText('books in your favorite genre').count() === 1` ✔ (this assertion alone passes)
  - `getByText('refactoring', { exact: true }).count() === 0` — the whole heading is a single
    element whose text is `books in your favorite genre: refactoring`, so an *exact* match for
    `refactoring` finds nothing.

Fails: **recommendations shows books in favorite genre** (it never even reaches here — the
click on the missing `recommend` button at `library.spec.js:151` times out first).

---

## 5. Per-test breakdown

| # | Test | Result | Cause(s) |
|---|------|--------|----------|
| 1 | front page shows authors by default | ✅ pass | — |
| 2 | books page shows all books | ✅ pass | — |
| 3 | login button is shown when not logged in | ✅ pass | — |
| 4 | add book button is not shown when not logged in | ✅ pass | — |
| 5 | recommend button is not shown when not logged in | ✅ pass | vacuously true — button missing for everyone (§4.1) |
| 6 | logout button is not shown when not logged in | ✅ pass | — |
| 7 | set birthyear form is not shown when not logged in | ✅ pass | vacuously true — heading text differs (§4.4) |
| 8 | login succeeds with correct credentials | ❌ fail | **(primary)** unlabelled login inputs §3 → then **(latent)** no `recommend` button §4.1 |
| 9 | login fails with wrong password | ❌ fail | **(primary)** §3 → then **(latent)** hardcoded password + no error UI + backend wording §4.2 |
| 10 | a new book can be added | ❌ fail | **(primary)** §3 (`beforeEach`) → **(latent)** unlabelled new-book inputs §3 + strict `books` collision §4.3 |
| 11 | author birth year can be updated | ❌ fail | **(primary)** §3 → **(latent)** heading `Set birth year`≠`Set birthyear`, no `select[name=name]`, unlabelled `born` §4.4 |
| 12 | genre filter buttons are shown | ❌ fail | **(primary)** §3 → **(latent)** strict `books` collision §4.3 |
| 13 | filtering by genre works | ❌ fail | **(primary)** §3 → **(latent)** §4.3 + missing `in genre` text §4.5 |
| 14 | all genres button shows all books | ❌ fail | **(primary)** §3 → **(latent)** §4.3 |
| 15 | recommendations shows books in favorite genre | ❌ fail | **(primary)** §3 → **(latent)** §4.1 + §4.6 |
| 16 | new book appears in genre filtered view | ❌ fail | **(primary)** §3 → **(latent)** §3 + §4.3 |

---

## 6. What is *not* broken (verified)

- **Backend / database:** `setup/start-test-backend.js` boots `mongodb-memory-server`, spawns
  `library-backend` with `NODE_ENV=test`, `MONGODB_URI`, `JWT_SECRET` on port 4000. The
  `_resetDatabase` guard (`library-backend/resolvers.js:149-152`) is satisfied, seeding and
  token-authenticated `addBook`/`editAuthor` mutations all work (tests 1 and 2 depend on them
  and pass).
- **Frontend dev server:** `npm run dev` in `library-frontend` starts on 5173 and the page loads
  (the 7 passing tests prove it).
- **Playwright config:** both `webServer` entries come up inside the 30 s budget; `baseURL`,
  project and worker settings are fine.
- **Data-dependent assertions** (author names, book titles, genre buttons, `all genres`,
  `Test Book`/`Test Author` appearing after creation) were re-checked manually with label-free
  locators and all behave as the tests expect.

---

## 7. Fix direction (not applied — for a later change)

Application side, in dependency order:

1. Wrap the text of every form field in a real `<label>` (or add `aria-label`) in
   `LoginForm.jsx` and `NewBook.jsx`, and give `BirthYearForm`'s number input a label — this is
   the single change that unblocks 9 tests and reveals the rest.
2. Rename the nav button `favorite books` → `recommend` in `App.jsx:36` (fixes §4.1 *and* the
   strict-mode collision §4.3).
3. `LoginForm.jsx`: send the state `password` instead of the hardcoded `"secret"`, add
   `onError`/error state and render a message containing `login failed`.
4. `Books.jsx`: render an active-genre indicator containing `in genre` (e.g.
   `books in genre: <genre>`).
5. `FavoriteBooks.jsx`: heading `recommendations`, plus a standalone exact `refactoring`
   element (e.g. `<p>books in your favorite genre</p>` + `<p>{favoriteGenre}</p>`).
6. `BirthYearForm.jsx`: heading `Set birthyear`, replace `react-select` with
   `<select name="name">`, label the `born` input.

No changes were made to `tests-chapter5`, `library-frontend` or `library-backend` while
producing this analysis; all diagnostics were run from temporary files outside the repository.
