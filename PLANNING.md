# PLANNING — Star Wars d6 Species Catalog

## Vision

Build a fast, searchable Star Wars d6 species catalog with a clean Star Wars aesthetic that imports `ALIENS.json` (PRD.md:4) into Firestore, enforces public-read/admin-write security (PRD.md:14), and delivers sub-200ms search with ≥90 Lighthouse scores (PRD.md:10-12). The system will wire image paths now for later upload (PRD.md:140-149), provide admin-only JSON import with validation and diff reporting (PRD.md:108-123), and serve fans/GMs with instant species lookup by name, homeworld, or source tags (PRD.md:17-22). Milestones target a fully themed, accessible catalog with admin editor and image uploader in 8 days (PRD.md:369-378).

## Tech Stack

- **Frontend**: React 18.3.x + Vite 5.x + TypeScript 5.x (PRD.md:221)
- **Styling**: Tailwind CSS 3.x with custom Star Wars theme (PRD.md:223, PRD.md:209-217)
- **Backend**: Firebase SDK 10.x (Firestore, Auth, Storage, Hosting, Functions Node 20) (PRD.md:226)
- **Validation**: Zod 3.x for runtime schema validation (PRD.md:227, PRD.md:124-139)
- **CI/CD**: GitHub Actions with Firebase Deploy Action (PRD.md:229)
- **Testing**: Vitest (unit), Playwright (E2E), Lighthouse CI (performance) (PRD.md:361-367)
- **Fonts**: Pathway Gothic One (headings), Inter (body) via Google Fonts (PRD.md:211)
- **Icons**: Custom SVG attribute pips and Aurebesh-style accents (PRD.md:213-215)

## Components and Boundaries

### Public Frontend (`/src/pages/`)
- **Home** (`Home.tsx`): Hero panel, global search, featured species carousel (PRD.md:153)
- **Catalog** (`Catalog.tsx`): Debounced search, homeworld/sources filters, A–Z/recent sort, infinite scroll (PRD.md:155-163)
- **SpeciesDetail** (`SpeciesDetail.tsx`): Detail page at `/species/<slug>` with image/placeholder, stats table, abilities, example names with copy buttons (PRD.md:165-180)

### Shared UI Components (`/src/components/`)
- **SearchBar** (`SearchBar.tsx`): Tokenizes name/homeworld/sources, debounced input (PRD.md:345)
- **Filters** (`Filters.tsx`): Homeworld typeahead, sources multiselect checkboxes (PRD.md:347)
- **SpeciesCard** (`SpeciesCard.tsx`): Thumbnail card with name, homeworld, source chips, mini stats preview (PRD.md:349)
- **StatsTable** (`StatsTable.tsx`): Renders attribute min–max ranges (e.g., `1D+2–3D+2`), attributeDice, move, size (PRD.md:353, PRD.md:174-175)
- **AbilitiesPanel** (`AbilitiesPanel.tsx`): Displays specialAbilities and storyFactors arrays (PRD.md:176)
- **ImagePlaceholder** (`ImagePlaceholder.tsx`): Silhouette with initials when `hasImage=false` (PRD.md:148)

### Admin UI (`/src/admin/`)
- **JsonImportForm** (`JsonImportForm.tsx`): File upload, dry-run validation, commit with diff summary (PRD.md:355, PRD.md:110-112)
- **SpeciesEditor** (`SpeciesEditor.tsx`): Inline edit form with Zod validation, image uploader integration (PRD.md:357, PRD.md:182-183)
- **ImageUploader** (`ImageUploader.tsx`): Drag-drop → WebP conversion → Storage write → `hasImage=true` (PRD.md:357, PRD.md:146-147)
- **AdminLayout** (`AdminLayout.tsx`): Auth guard, navigation, audit log viewer (PRD.md:182-189)

### Firebase Backend
- **Firestore Collections** (PRD.md:62-94):
  - `species/<slug>`: Core species documents with computed fields (slug, searchName, searchTokens, sortName, updatedAt)
  - `meta/config`: Schema version, lastImportHash
  - `adminLogs/<doc>`: Audit trail (who, when, action, slug) (PRD.md:189)
- **Storage** (`/aliens/<slug>.webp`): Public-read images, admin-write only (PRD.md:142-147)
- **Security Rules** (PRD.md:231-269): Public read on species, admin-only write, isolated meta/adminLogs
- **Cloud Functions** (`/functions/`):
  - `importSpecies`: Server-side import with batch upserts (≤500 per chunk), slug/token computation (PRD.md:113-123)
  - `convertToWebP`: Optional server-side image conversion if not done client-side (PRD.md:146)

### API Layer (Optional) (`/functions/api/`)
- **GET /api/species**: Query endpoint with `?query=` and `&homeworld=` filters (PRD.md:192-194)
- **GET /api/species/:slug**: Single species detail endpoint (PRD.md:196)

## External Services and Data Flow

### Authentication Flow
1. User accesses admin routes → Firebase Auth email/password + MFA (PRD.md:182)
2. Custom claim `admin=true` set manually via Firebase CLI/Functions (PRD.md:238-240)
3. Auth state checked in `AdminLayout.tsx` → redirect to login if unauthenticated
4. Token refreshed automatically by Firebase SDK

### Import Data Flow
1. Admin uploads `ALIENS.json` via `JsonImportForm.tsx` (PRD.md:110)
2. Client validates entire array with Zod schema (PRD.md:124-139), displays row-level errors
3. Dry-run shows diff report (new/updated/rejected records with path+reason) (PRD.md:111)
4. On commit, calls `importSpecies` Cloud Function with validated data
5. Function computes slug (kebab-case name, fallback `slug-id` on collision) (PRD.md:66), searchTokens (name+homeworld+sources tokens) (PRD.md:92), sortName (normalized for A–Z) (PRD.md:93)
6. Batch writes to Firestore `species/<slug>` with `updatedAt` server timestamp (PRD.md:116-120)
7. Sets `imagePath=aliens/<slug>.webp` if `imageUrl` present, `hasImage=false` until upload (PRD.md:118)
8. Stores `lastImportHash` in `meta/config` to skip no-change reimports (PRD.md:122)

### Search and Display Flow
1. User enters query in `SearchBar.tsx` → debounced (200ms) (PRD.md:10, PRD.md:158)
2. Firestore query uses `searchTokens ARRAY_CONTAINS` index for name/homeworld/sources (PRD.md:100)
3. Optional filters apply `homeworld ASC` and composite `homeworld ASC + sortName ASC` indexes (PRD.md:102-104)
4. Results mapped to `SpeciesCard.tsx` components in `Catalog.tsx` with infinite scroll
5. Click card → navigate to `/species/<slug>` → `SpeciesDetail.tsx` fetches doc by slug
6. If `hasImage=true`, load from Storage `aliens/<slug>.webp`; else show `ImagePlaceholder.tsx` (PRD.md:148)

### Image Upload Flow
1. Admin drags image in `SpeciesEditor.tsx` → `ImageUploader.tsx` component
2. Client converts to WebP using browser Canvas API or calls `convertToWebP` Function (PRD.md:146)
3. Upload to Storage `/aliens/<slug>.webp` with admin-only write rule (PRD.md:264-267)
4. On success, update Firestore doc `hasImage=true`, `imagePath=aliens/<slug>.webp`
5. Audit log written to `adminLogs/<uid>-<timestamp>` (PRD.md:189)

## Architectural Decisions

### 1. Firestore Over REST API for Client Queries
**Rationale**: Real-time listeners, offline caching, and security rules eliminate need for custom backend API. Optional REST endpoints (`/api/species`) provided for external integrations (PRD.md:192-196) but not required for primary UI.

### 2. Client-Side Validation with Zod, Server-Side Enforcement
**Rationale**: Immediate user feedback with Zod schemas in `JsonImportForm.tsx` (PRD.md:124), while Cloud Functions re-validate to prevent malicious payloads bypassing client (PRD.md:203). Shared TypeScript types ensure consistency.

### 3. Slug-Based Document IDs Over Auto-Generated
**Rationale**: Human-readable URLs (`/species/bothan` not `/species/fG7kL9`), predictable paths for images (`aliens/bothan.webp`), and easy collision handling with fallback `slug-id` suffix (PRD.md:66). Improves SEO and debugging.

### 4. Computed Search Tokens Over Full-Text Search
**Rationale**: Firestore lacks native full-text search; tokenizing name+homeworld+sources into `searchTokens` array enables `ARRAY_CONTAINS` queries (PRD.md:92, PRD.md:100) without external services (Algolia/Meilisearch). Sufficient for v1 scope; can migrate later if needed.

### 5. Image Path Wiring Now, Upload Later
**Rationale**: Enables import pipeline to set `imagePath` and `hasImage=false` immediately (PRD.md:118), unblocking catalog launch while admin uploads images asynchronously (PRD.md:140-149). Placeholder UX (`ImagePlaceholder.tsx`) prevents broken UI.

### 6. Vite Over Next.js for SSR Simplicity
**Rationale**: Firestore Hosting supports prerendering top routes without Next.js complexity (PRD.md:199, PRD.md:221). Vite's faster builds and simpler config suit single-page app with client-side Firebase SDK. Can migrate to Next.js if SSR/SSG becomes critical.

### 7. Tailwind Custom Theme Over CSS-in-JS
**Rationale**: Star Wars theme (charcoal bg, yellow accents, Pathway Gothic) defined in `tailwind.config.js` (PRD.md:209-212) enables design tokens across components without runtime CSS overhead. Custom utility classes for "energy borders" and pip icons (PRD.md:213-215).

### 8. GitHub Actions CI/CD Over Manual Deploy
**Rationale**: Automated `firebase deploy` on main branch push (PRD.md:229) ensures Lighthouse CI runs (PRD.md:367), rules/indexes sync, and prevents config drift. Secrets stored in GitHub Actions, not local `.env`.

## Open Questions and Risks

### Open Questions
1. **WebP Conversion Location**: Should image conversion happen client-side (browser Canvas API) or server-side (`convertToWebP` Function)? Client-side reduces Function costs but requires modern browser; server-side is universal but slower.
   - **Next Step**: Prototype client-side conversion in `ImageUploader.tsx` with fallback to Function for unsupported browsers.

2. **Firestore Index Creation**: Will composite indexes (`homeworld ASC + sortName ASC`) auto-trigger or require manual `firestore.indexes.json`?
   - **Next Step**: Test first query in dev environment; if auto-prompt appears, capture indexes to `firestore.indexes.json` for CI/CD.

3. **Search Debounce Timing**: Is 200ms debounce (PRD.md:10) optimal for "mid-range laptop" or should it be tuned based on actual Firestore latency?
   - **Next Step**: Measure P95 Firestore read latency in dev; adjust debounce if reads consistently < 100ms.

4. **Admin MFA Setup**: Firebase Auth MFA requires phone or TOTP; which should be enforced for admin accounts?
   - **Next Step**: Review Firebase Auth MFA docs; recommend TOTP (Google Authenticator) for ease of setup without SMS costs.

5. **Attribute Filter v1 Scope**: PRD marks "Perception ≥ 3D min" filters as out-of-scope (PRD.md:159); should we wire filter UI for future or defer entirely?
   - **Next Step**: Defer UI; add Firestore index note in docs for post-v1 implementation.

### Risks

1. **Risk**: ALIENS.json may contain malformed dice notation (e.g., `2d+1` lowercase, `3D+` missing digit) that fails Zod pattern `^[0-9]+D(\\+[0-9])?$` (PRD.md:131, PRD.md:301).
   - **Impact**: High — import fails, blocking launch.
   - **Mitigation**: Add case-insensitive pattern match in Zod, normalize to uppercase during import. Validate sample `ALIENS.json` early (M0).

2. **Risk**: Firestore free tier (50K reads/day) may be exceeded if catalog goes viral, causing billing surprises.
   - **Impact**: Medium — unexpected costs or service degradation.
   - **Mitigation**: Enable Firebase budget alerts at $10, $50, $100. Cache Firestore reads in IndexedDB (Vite PWA plugin) for offline repeat visits. Monitor usage in M3.

3. **Risk**: Search performance < 200ms target (PRD.md:10) if `searchTokens` arrays grow large or indexes are slow.
   - **Impact**: High — fails success criteria.
   - **Mitigation**: Load test with full ALIENS.json dataset in M1; profile Firestore query latency. If slow, reduce token granularity or add Algolia integration.

4. **Risk**: Slug collisions (e.g., "Human" and "Human (Corellian)") may produce duplicate `slug-id` suffixes if ID source is unreliable.
   - **Impact**: Medium — overwrites or import failures.
   - **Mitigation**: Deterministic slug function: `kebab(name) + (collision ? '-' + first-id : '')`. Write unit tests in M0.

5. **Risk**: Lighthouse PWA score < 90 (PRD.md:12) due to missing service worker or large image bundle.
   - **Impact**: High — fails success criteria.
   - **Mitigation**: Enable Vite PWA plugin with offline cache strategy. Lazy-load images with native `loading="lazy"` and WebP format. Run Lighthouse CI in M2; fix issues before M3.

6. **Risk**: Star Wars theme "energy borders" and pip icons may look amateurish if not designed carefully.
   - **Impact**: Low — UX polish, not functionality.
   - **Mitigation**: Use CSS `box-shadow` for subtle glow, SVG `<line>` for thin borders. Reference existing SW fan sites for inspiration. Design review in M3.

7. **Risk**: Admin custom claim setup undocumented in PRD; may be missed during deployment.
   - **Impact**: Medium — admin cannot log in.
   - **Mitigation**: Add setup script `scripts/set-admin-claim.js` callable via `firebase functions:shell`. Document in `README.md` M0.

8. **Risk**: JSON Schema uses AJV format (PRD.md:271-341) but stack specifies Zod (PRD.md:227); conversion required.
   - **Impact**: Low — one-time schema translation.
   - **Mitigation**: Convert AJV schema to Zod in `src/schemas/species.schema.ts` during M0. Keep AJV schema as reference in `docs/`.

---

**Next Steps**: Initialize Firebase project (M0), create `firestore.rules`, `storage.rules`, Zod schema, and `scripts/set-admin-claim.js`. Validate ALIENS.json sample against schema to surface dice notation issues early.
