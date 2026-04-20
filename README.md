# Communities Simulator — Well of Wishes Integration

A local simulator for testing the **community-linking integration** with [Well of Wishes (WoW / באר המשאלות)](https://wellofwishes.example.com).

This is **not** WoW itself. It is a mock community platform that behaves like an external system integrating with WoW — letting you test the full link initiation flow end-to-end without touching production.

---

## What it does

- Manages a list of fake community users
- Triggers the WoW `POST /api/community-links/initiate` endpoint with proper HMAC-SHA256 signing
- Shows the returned `link_url` so you can open it in a browser
- Tracks all handshake attempts with full signing diagnostics
- Lets you intentionally test error scenarios (invalid signature, replay, expired timestamp)
- Provides a debug panel for environment health and canonical JSON inspection

---

## Prerequisites

- **Node.js 18+**
- `npm` (or `pnpm`/`yarn` — adjust commands accordingly)
- A running WoW backend (or a mock server) to receive the requests

---

## Setup

### 1. Clone / open the project

```bash
cd CommunitiesSimulator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Base URL of the WoW API — no trailing slash
WOW_BASE_URL=https://api.wellofwishes.example.com

# Client key issued to your community by WoW
COMMUNITY_LINK_CLIENT_KEY=your_client_key_here

# Shared secret for HMAC-SHA256 signing — never expose this client-side
COMMUNITY_LINK_SHARED_SECRET=your_shared_secret_here

# Optional: default server ID pre-filled when creating users
DEFAULT_SERVER_ID=community-server-1
```

> **Security:** `COMMUNITY_LINK_SHARED_SECRET` is only read server-side. It is never sent to the browser.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored as JSON files in the `data/` directory (auto-created, git-ignored).

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Summary stats and recent attempts |
| Users | `/users` | Manage fake community users, trigger linking |
| Attempts | `/attempts` | Full audit trail with filtering and CSV export |
| Debug | `/debug` | Env health, signing preview, error scenario tests |

---

## Testing a successful link flow

1. Go to **Users**
2. Click **Link to WoW** on any user
3. The result modal shows:
   - HTTP status code
   - Canonical body used for signing
   - HMAC-SHA256 signature
   - Full WoW response
4. If WoW returns a `link_url`, click **Open WoW Link** — it opens in a new tab
5. WoW handles login and completion on its own
6. The user's local status updates to `opened_link`

---

## Testing error scenarios

Go to **Debug** → **Error Scenario Tests** and select a user.

| Test | What it does | Expected WoW error |
|------|--------------|--------------------|
| Invalid Signature | Sends a zeroed-out signature | `INVALID_SIGNATURE` |
| Reused Nonce | Reuses the most recent nonce | `NONCE_ALREADY_USED` |
| Expired Timestamp | Sends timestamp 1 hour in the past | `EXPIRED_REQUEST` |

All debug attempts are recorded in the Attempts log.

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users` | List all users (seeds on first call) |
| `POST` | `/api/users` | Create a user |
| `PATCH` | `/api/users/:id` | Update a user |
| `DELETE` | `/api/users/:id` | Delete a user |
| `POST` | `/api/users/:id` | Duplicate a user |
| `POST` | `/api/link/initiate` | Initiate WoW link for a user |
| `POST` | `/api/link/opened` | Mark link URL as opened |
| `GET` | `/api/attempts` | List attempts (filterable) |
| `GET` | `/api/attempts/:id` | Single attempt detail |
| `GET` | `/api/attempts/export` | CSV export |
| `GET` | `/api/debug/env` | Environment health + signing preview |
| `POST` | `/api/debug/initiate-invalid-signature` | Debug: broken signature |
| `POST` | `/api/debug/initiate-reused-nonce` | Debug: replay nonce |
| `POST` | `/api/debug/initiate-expired-request` | Debug: expired timestamp |
| `POST` | `/api/seed/reset` | Reset all data and re-seed |

---

## Signing

All signing happens server-side in [`lib/wow/signing.ts`](lib/wow/signing.ts).

```
message = timestamp + "\n" + nonce + "\n" + canonicalBody
canonicalBody = JSON with keys sorted alphabetically, no whitespace
signature = HMAC-SHA256(sharedSecret, message) as lowercase hex
```

Headers sent to WoW:
- `Content-Type: application/json`
- `X-Community-Key`
- `X-Timestamp`
- `X-Nonce`
- `X-Signature`

---

## Data storage

Local JSON files in `data/`:
- `data/users.json` — community users
- `data/attempts.json` — link attempt history

Reset at any time via **Debug → Reset & Re-seed Data** or by deleting the files.

---

## Limitations

- No real-time status callback from WoW — link completion (the user logging in on the WoW side) is not reflected here. The simulator marks the user as `opened_link` when you click the link, and `assumed_linked` if WoW returns `ALREADY_LINKED`.
- No pagination on large attempt lists.
- JSON file storage is not safe for concurrent writes — fine for a single developer testing locally.
- The `data/` directory is created relative to `process.cwd()` — always run the dev server from the project root.

---

## Project structure

```
lib/
  types.ts                   Shared TypeScript types
  utils.ts                   Date/status helpers
  wow/
    signing.ts               HMAC-SHA256 signing logic
    client.ts                WoW API client wrapper
  storage/
    db.ts                    JSON file read/write
    users.ts                 User CRUD + seed
    attempts.ts              Attempt CRUD
app/
  page.tsx                   Dashboard
  users/page.tsx             Users management
  attempts/page.tsx          Attempt history
  debug/page.tsx             Debug panel
  api/...                    API routes
components/
  layout/                    Sidebar + Header
  ui/                        Badge, Modal, CodeBlock
  attempts/                  AttemptDetailView
data/                        Auto-created JSON storage (git-ignored)
```
