# EazyCart – Copilot Instructions

## Project Overview
EazyCart is a multi-vendor e-commerce platform built with **Next.js 15 App Router**, **React 19**, **Tailwind CSS 4**, **Clerk** (auth), **Prisma + Neon PostgreSQL** (data), **Redux Toolkit** (client state), **Stripe** (payments), **ImageKit** (CDN), **OpenAI** (AI product listing), and **Inngest** (background jobs).

## Route Group Architecture
The `app/` directory uses three route groups with distinct layouts and access levels:

| Group | Path | Purpose | Auth |
|-------|------|---------|------|
| `(public)` | `/`, `/shop`, `/cart`, `/orders`, etc. | Customer-facing storefront | Optional (Clerk) |
| `store` | `/store/*` | Vendor dashboard | Approved seller only |
| `admin` | `/admin/*` | Platform admin panel | Admin email only |

## Authentication & Authorization
- **Clerk** handles all auth. The global `middleware.ts` runs `clerkMiddleware()` on every route.
- Protected API routes call `getAuth(request)` to get `userId`, then pass it to custom middleware:
  - `middlewares/authSeller.js` — checks DB for an `approved` store; returns `storeId` or `false`
  - `middlewares/authAdmin.js` — checks if the user's Clerk email is in `ADMIN_EMAIL` env var (comma-separated list)
- Client-to-API auth uses Clerk JWT: `const token = await getToken(); axios({ headers: { Authorization: \`Bearer \${token}\` } })`

## User Sync via Inngest
Users are **not** created directly — Clerk webhook events are handled by Inngest functions in `inngest/functions.js`:
- `clerk/user.created` → `prisma.user.create`
- `clerk/user.updated` → `prisma.user.update`
- `clerk/user.deleted` → `prisma.user.delete`

Do not create/update `User` records in API routes; rely on this sync pipeline.

## Database (Prisma + Neon)
- Prisma client in `lib/prisma.js` uses `@prisma/adapter-neon` for edge compatibility.
- `DATABASE_URL` for pooled queries, `DIRECT_URL` for migrations.
- **Build step runs `prisma generate`**: `"build": "prisma generate && next build"` — always run `prisma generate` after schema changes.
- Cart is stored as a `Json` field on the `User` model, not a relation.

## Redux State Management
Four slices in `lib/features/`: `cart`, `product`, `address`, `rating`.  
The `(public)/layout.jsx` bootstraps all slices on mount/user-change:
```js
dispatch(fetchProducts({}));         // always
dispatch(fetchCart({ getToken }));   // on user login
dispatch(uploadCart({ getToken }));  // on every cartItems change (1s debounce)
```
`StoreProvider.js` wraps the app in a ref-stable Redux `Provider` (client component).

## API Route Conventions
- All routes are in `app/api/` as `route.js` files using Next.js Route Handlers.
- Pattern for protected seller routes:
  ```js
  const { userId } = getAuth(request);
  const storeId = await authSeller(userId);
  if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ```
- Product listings always filter out inactive stores (`product.store.isActive`) after fetching.

## Key Environment Variables
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled connection string |
| `DIRECT_URL` | Neon direct connection (migrations) |
| `ADMIN_EMAIL` | Comma-separated admin emails |
| `OPENAI_MODEL` | OpenAI model name (e.g. `gpt-4o`) |

## Developer Workflows
```bash
npm run dev       # Next.js dev with Turbopack
npm run build     # prisma generate + next build
npx prisma migrate dev   # create & apply a migration
npx prisma studio        # GUI to inspect DB
```
- `next.config.mjs` has `images.unoptimized: true` — use regular `<img>` or ImageKit URLs freely.
- Inngest dev server must run separately for background functions to fire locally.