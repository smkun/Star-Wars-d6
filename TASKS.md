# TASKS — Star Wars d6 Species Catalog

## M0: Foundation (Days 1–2)

### Firebase Project Setup

- [x] Create Firebase project via console **Completed: 2025-10-02**
- [x] Enable Firestore, Authentication, Storage, Hosting, Functions **Completed: 2025-10-02**
- [x] Install Firebase CLI and authenticate **Completed: 2025-10-02**
- [x] Initialize Firebase config in project root **Completed: 2025-10-02**
- [x] Configure Firestore database in production mode **Completed: 2025-10-02**
- [ ] Configure Storage bucket with default settings **Completed:** — Blocked: default bucket not yet provisioned; run Storage Get Started in console

### Security Rules

- [x] Write Firestore security rules (species, meta, adminLogs) **Completed: 2025-10-02**
- [x] Write Storage security rules (aliens folder) **Completed: 2025-10-02**
- [x] Deploy Firestore rules to Firebase **Completed: 2025-10-02**
- [ ] Deploy Storage rules to Firebase **Completed:** — Blocked until default bucket exists
- [ ] Test public read access on species collection **Completed:** — Blocked: external network access disabled
- [ ] Test admin write enforcement with unauthenticated request **Completed:** — Blocked: external network access disabled

### Schema and Types

- [x] Convert AJV schema to Zod in `src/schemas/species.schema.ts` **Completed: 2025-10-02**
- [x] Define TypeScript interfaces in `src/types/species.types.ts` **Completed: 2025-10-02**
- [x] Add dice notation pattern validation (case-insensitive) **Completed: 2025-10-02**
- [x] Add move pattern validation (`^\d+(\/\d+)?$`) **Completed: 2025-10-02**
- [x] Add size pattern validation with warning tolerance **Completed: 2025-10-02**
- [x] Write unit tests for schema validation **Completed: 2025-10-02**
- [x] Validate sample records from ALIENS.json **Completed: 2025-10-02**

### Admin Claim Setup

- [x] Create `scripts/set-admin-claim.js` script **Completed: 2025-10-02**
- [x] Document admin setup in README.md **Completed: 2025-10-02**
- [ ] Test admin claim assignment via Firebase CLI **Completed:**

### Project Scaffolding

- [x] Initialize Vite + React + TypeScript project **Completed: 2025-10-02**
- [x] Install Tailwind CSS and configure **Completed: 2025-10-02**
- [x] Install Firebase SDK dependencies **Completed: 2025-10-02**
- [x] Install Zod validation library **Completed: 2025-10-02**
- [x] Configure TypeScript paths and aliases **Completed: 2025-10-02**
- [x] Create folder structure (pages, components, admin, utils) **Completed: 2025-10-02**
- [x] Configure environment variables (.env.example) **Completed: 2025-10-02**

### Firestore Indexes

- [x] Create `firestore.indexes.json` file **Completed: 2025-10-02**
- [x] Define single-field index: searchName ASC **Completed: 2025-10-02**
- [x] Define array-contains index: searchTokens **Completed: 2025-10-02**
- [x] Define single-field index: homeworld ASC **Completed: 2025-10-02**
- [x] Define composite index: homeworld ASC + sortName ASC **Completed: 2025-10-02**
- [ ] Deploy indexes to Firestore **Completed:**

---

## M1: Import and Display (Days 3–5)

### Utility Functions

- [x] Write slug generation function (kebab-case with collision handling) **Completed: 2025-10-02**
- [x] Write search tokenization function (name+homeworld+sources) **Completed: 2025-10-02**
- [x] Write sortName normalization function **Completed: 2025-10-02**
- [x] Write dice notation normalization (uppercase) **Completed: 2025-10-02**
- [x] Test slug collision handling with duplicates **Completed: 2025-10-02**
- [x] Test tokenization with special characters **Completed: 2025-10-02**

### Cloud Functions - Import

- [x] Initialize Functions directory with Node 20 runtime **Completed: 2025-10-02**
- [x] Install Functions dependencies (firebase-admin, zod) **Completed: 2025-10-02**
- [x] Implement `importSpecies` callable function **Completed: 2025-10-02**
- [x] Add schema validation in Function **Completed: 2025-10-02**
- [x] Implement batch upsert logic (≤500 per chunk) **Completed: 2025-10-02**
- [x] Compute slug, searchTokens, sortName in Function **Completed: 2025-10-02**
- [x] Set imagePath and hasImage fields **Completed: 2025-10-02**
- [x] Add updatedAt server timestamp **Completed: 2025-10-02**
- [ ] Store lastImportHash in meta/config **Completed:**
- [ ] Deploy Functions to Firebase **Completed:**
- [ ] Test import with sample ALIENS.json **Completed:**

### Admin UI - Import Form

- [ ] Create `JsonImportForm.tsx` component **Completed:**
- [ ] Add file upload input with drag-drop support **Completed:**
- [ ] Implement client-side Zod validation **Completed:**
- [ ] Display row-level errors (path, reason) **Completed:**
- [ ] Implement dry-run preview with diff report **Completed:**
- [ ] Add commit button calling importSpecies Function **Completed:**
- [ ] Show success/failure toast notifications **Completed:**
- [ ] Test import with valid and invalid JSON **Completed:**

### Public Pages - List

- [x] Create `Catalog.tsx` page component **Completed: 2025-10-02**
- [x] Implement Firestore query for species collection **Completed: 2025-10-02**
- [ ] Add real-time listener for species updates **Completed:**
- [ ] Implement infinite scroll or pagination **Completed:**
- [ ] Display loading skeleton while fetching **Completed:**
- [ ] Handle empty state when no species found **Completed:**

### Shared Components - Card

- [x] Create `SpeciesCard.tsx` component **Completed: 2025-10-02**
- [x] Display species name and homeworld **Completed: 2025-10-02**
- [x] Render source chips (tags) **Completed: 2025-10-02**
- [x] Show mini stats preview (attributeDice, move) **Completed: 2025-10-02**
- [x] Add click handler to navigate to detail page **Completed: 2025-10-02**
- [x] Style with Star Wars theme (borders, colors) **Completed: 2025-10-02**

### Public Pages - Detail

- [ ] Create `SpeciesDetail.tsx` page component **Completed:**
- [ ] Fetch species document by slug from route param **Completed:**
- [ ] Display image or placeholder based on hasImage **Completed:**
- [ ] Render description sections (personality, physical, adventurers) **Completed:**
- [ ] Display languages block **Completed:**
- [x] Create `StatsTable.tsx` component **Completed: 2025-10-02**
- [x] Render attribute min–max ranges in table **Completed: 2025-10-02**
- [x] Display attributeDice, move, size in stats **Completed: 2025-10-02**
- [x] Create `AbilitiesPanel.tsx` component **Completed: 2025-10-02**
- [x] Render specialAbilities array **Completed: 2025-10-02**
- [x] Render storyFactors array **Completed: 2025-10-02**
- [ ] Display exampleNames with copy buttons **Completed:**
- [ ] Display sources list **Completed:**
- [ ] Handle 404 when slug not found **Completed:**

---

## M2: Admin Editor and Images (Days 6–7)

### Authentication

- [x] Configure Firebase Auth email/password provider **Completed: 2025-10-11**
- [x] Enable Google OAuth provider **Completed: 2025-10-11**
- [x] Create login page component (Login.tsx) **Completed: 2025-10-11**
- [x] Create registration page component (Register.tsx) **Completed: 2025-10-11**
- [x] Implement login form with error handling **Completed: 2025-10-11**
- [x] Add auth state listener in ProtectedRoute **Completed: 2025-10-11**
- [x] Create `ProtectedRoute.tsx` with auth guard **Completed: 2025-10-11**
- [x] Redirect to login if unauthenticated **Completed: 2025-10-11**
- [x] Test login flow with admin account **Completed: 2025-10-11**
- [x] Set up Firebase Admin SDK with service account **Completed: 2025-10-11**
- [x] Set admin custom claim for scottkunian@gmail.com **Completed: 2025-10-11**
- [x] Add /users API endpoint (admin-only) **Completed: 2025-10-11**
- [x] Add character ownership filtering by user_id **Completed: 2025-10-11**
- [x] Add admin "Show all" toggle to view all characters **Completed: 2025-10-11**
- [x] Add character reassignment dropdown with user list **Completed: 2025-10-11**
- [x] Add Sign Out button with correct BASE_URL redirect **Completed: 2025-10-11**
- [ ] Enable MFA (TOTP) in Firebase console **Completed:**

### Admin UI - Species Editor

- [ ] Create `SpeciesEditor.tsx` component **Completed:**
- [ ] Load species document for editing **Completed:**
- [ ] Create form fields for all species properties **Completed:**
- [ ] Implement inline Zod validation **Completed:**
- [ ] Add save button calling Firestore update **Completed:**
- [ ] Display validation errors inline **Completed:**
- [ ] Show success notification on save **Completed:**
- [ ] Test editing existing species **Completed:**

### Image Upload - Client

- [ ] Create `ImageUploader.tsx` component **Completed:**
- [ ] Add drag-drop zone for image files **Completed:**
- [ ] Validate file type (image only) **Completed:**
- [ ] Implement client-side WebP conversion (Canvas API) **Completed:**
- [ ] Upload converted image to Storage /aliens/<slug>.webp **Completed:**
- [ ] Update Firestore hasImage=true on success **Completed:**
- [ ] Display upload progress bar **Completed:**
- [ ] Handle upload errors with retry **Completed:**
- [ ] Test upload with PNG, JPG, WebP files **Completed:**

### Image Upload - Placeholder

- [ ] Create `ImagePlaceholder.tsx` component **Completed:**
- [ ] Generate silhouette SVG with species initials **Completed:**
- [ ] Style placeholder with Star Wars theme **Completed:**
- [ ] Use placeholder when hasImage=false **Completed:**

### Cloud Functions - Image Conversion (Optional)

- [ ] Implement `convertToWebP` HTTPS function **Completed:**
- [ ] Add Sharp library for server-side conversion **Completed:**
- [ ] Accept image upload and return WebP blob **Completed:**
- [ ] Deploy Function to Firebase **Completed:**
- [ ] Test fallback when Canvas API unavailable **Completed:**

### Audit Logging

- [ ] Create audit log write function in utils **Completed:**
- [ ] Write log on species create/update **Completed:**
- [ ] Write log on image upload **Completed:**
- [ ] Store adminLogs with uid, timestamp, action, slug **Completed:**
- [ ] Create admin audit log viewer component **Completed:**
- [ ] Test log entries appear in Firestore **Completed:**

---

## M3: Polish and Launch (Day 8)

### Search and Filters

- [x] Create `SearchBar.tsx` component **Completed: 2025-10-02**
- [x] Implement debounced input (200ms) **Completed: 2025-10-02**
- [ ] Query Firestore with searchTokens ARRAY_CONTAINS **Completed:**
- [ ] Display search results in Catalog **Completed:**
- [ ] Test search performance (<200ms after debounce) **Completed:**
- [ ] Create `Filters.tsx` component **Completed:**
- [ ] Add homeworld typeahead filter **Completed:**
- [ ] Add sources multiselect checkboxes **Completed:**
- [ ] Combine filters with search query **Completed:**
- [ ] Test filter combinations **Completed:**

### Sorting

- [ ] Add sort dropdown (A–Z, Recently Updated) **Completed:**
- [ ] Implement A–Z sort with sortName field **Completed:**
- [ ] Implement Recently Updated sort with updatedAt **Completed:**
- [ ] Test sort options in Catalog **Completed:**

### Theming

- [ ] Configure Tailwind theme (charcoal, off-white, yellow) **Completed:**
- [ ] Add Pathway Gothic One font via Google Fonts **Completed:**
- [ ] Add Inter font via Google Fonts **Completed:**
- [ ] Create custom utility classes for "energy borders" **Completed:**
- [ ] Design custom attribute pip SVG icons **Completed:**
- [ ] Create Aurebesh-style SVG accents **Completed:**
- [ ] Apply theme to all components **Completed:**
- [ ] Review visual consistency across pages **Completed:**

### Accessibility

- [ ] Add semantic HTML headings (h1, h2, h3) **Completed:**
- [ ] Label all form inputs with aria-label or label element **Completed:**
- [ ] Ensure keyboard navigation works on all interactive elements **Completed:**
- [ ] Add strong focus states (visible outlines) **Completed:**
- [ ] Add alt text to images or aria-label to placeholders **Completed:**
- [ ] Test with screen reader (NVDA or VoiceOver) **Completed:**
- [ ] Fix any a11y issues found **Completed:**

### Performance Optimization

- [ ] Enable Vite PWA plugin with offline cache **Completed:**

## New: Characters Feature (local dev)

- [ ] Sanitize workspace secrets (`.vscode/settings.json`, `.env`) and rotate DB password **Priority:** High

### Security Cleanup (2025-10-12)

- [x] Removed committed Firebase service-account JSON from reachable history and force-pushed cleaned `master` to remote. **Completed: 2025-10-12**
- [x] Migrated `deploy/frontend/**` and `web/public/**` assets to Git LFS and updated `.gitattributes`. **Completed: 2025-10-12**
- [ ] Rotate exposed credentials in GCP and update CI/servers (owner: repo admin). **Priority:** High
- [ ] Finish `CharactersList`/`CharacterDetail`/`CharacterPrint` styling and accessibility checks **Priority:** Medium
- [ ] Remove dev-mode fallbacks and local-sample files before production build **Priority:** Medium
- [ ] Add E2E tests for Characters CRUD and print flow (dev-mode toggle gated) **Priority:** Medium
- [ ] Add service worker for offline support **Completed:**
- [ ] Implement lazy loading for images (loading="lazy") **Completed:**
- [ ] Add IndexedDB caching for Firestore reads **Completed:**
- [ ] Prerender top routes (Home, Catalog) **Completed:**
- [ ] Optimize bundle size (code splitting) **Completed:**
- [ ] Test performance on mid-range laptop **Completed:**

### Testing

- [ ] Write unit tests for slug generation **Completed:**
- [ ] Write unit tests for tokenization **Completed:**
- [ ] Write unit tests for schema validation **Completed:**
- [ ] Write integration test for import → Firestore → UI **Completed:**
- [ ] Write E2E test for search flow (Playwright) **Completed:**
- [ ] Write E2E test for filter flow (Playwright) **Completed:**
- [ ] Write E2E test for detail page load (Playwright) **Completed:**
- [ ] Write E2E test for admin auth (Playwright) **Completed:**
- [ ] Write E2E test for image upload (Playwright) **Completed:**
- [ ] Run all tests and fix failures **Completed:**

### CI/CD

- [ ] Create GitHub Actions workflow file **Completed:**
- [ ] Add Firebase deploy step on main push **Completed:**
- [ ] Add Lighthouse CI step **Completed:**
- [ ] Configure Firebase secrets in GitHub **Completed:**
- [ ] Test workflow with dummy commit **Completed:**
- [ ] Fix any CI failures **Completed:**

### Documentation

- [ ] Write README.md with setup instructions **Completed:**
- [ ] Document admin claim setup process **Completed:**
- [ ] Document environment variables **Completed:**
- [ ] Document deployment process **Completed:**
- [ ] Document testing commands **Completed:**
- [ ] Add architecture diagram (optional) **Completed:**

### Launch Checklist

## Puppeteer / Headless Chrome smoke test

This repository now includes a small smoke script to verify `puppeteer` is usable by automated runners (for example, Claude Code or CI):

- Run the smoke test (uses the bundled Chromium by default):

```bash
npm run smoke:puppeteer
```

- If your environment already has Chrome/Chromium installed and you want to avoid launching the bundled Chromium (or avoid installing system deps), point the script at it:

```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser npm run smoke:puppeteer
```

- If launching fails with missing shared libraries (e.g. libxkbcommon.so.0), install the system packages for your distro. Example for Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
	libexpat1 libfontconfig1 libgcc-s1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
	libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
	libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libxkbcommon0 \
	lsb-release wget
```

Or for Fedora/RHEL:

```bash
sudo dnf install -y libX11 libXcomposite libXcursor libXdamage libXrandr libXtst alsa-lib \
	atk cairo cups-libs dbus-glib expat fontconfig freetype glibc glib2 gtk3 nss pango \
	xorg-x11-fonts-75dpi xorg-x11-fonts-Type1 libxkbcommon
```

If you'd like, I can add these commands into a distro-detection script or create a short README entry under `docs/` for CI-runner setup.

## Newly Discovered Tasks

- [ ] Create Firebase Storage bucket once billing active **Completed:** — Storage API requires billing before bucket provisioning
- [ ] Upgrade Firebase project to Blaze plan **Completed:** — Required to deploy Cloud Functions (billing change cannot be automated)

### Firebase Configuration Files

- [x] Create firebase.json with Hosting, Firestore, Functions, Storage config **Completed: 2025-10-02** — Required for Firebase CLI deployment
- [x] Create scripts/setup-firebase.md with step-by-step guide **Completed: 2025-10-02** — Manual setup instructions for Firebase console
- [x] Update README.md with Firebase setup section **Completed: 2025-10-02** — Developer onboarding documentation

### Tailwind Configuration

- [x] Create tailwind.config.js with Star Wars theme colors **Completed: 2025-10-02** — Charcoal bg, yellow accents per PRD.md:209-212
- [x] Add Tailwind directives to web/src/index.css **Completed: 2025-10-02** — Base, components, utilities layers
- [x] Create postcss.config.js for Tailwind processing **Completed: 2025-10-02** — PostCSS with autoprefixer
- [x] Import Pathway Gothic One and Inter fonts **Completed: 2025-10-02** — Google Fonts via CSS @import

### Schema Implementation

- [x] Create web/src/schemas/species.schema.ts with Zod schemas **Completed: 2025-10-02** — All validation patterns from PRD
- [x] Add comprehensive unit tests for schema validation **Completed: 2025-10-02** — 15 test cases covering edge cases
- [x] Configure TypeScript path aliases in tsconfig and vite.config **Completed: 2025-10-02** — @/ paths for cleaner imports

### M1 Utility Functions

- [x] Create api/src/utils/slug.ts with collision handling **Completed: 2025-10-02** — Deterministic kebab-case with ID fallback
- [x] Create api/src/utils/tokenize.ts for search **Completed: 2025-10-02** — Combines name+homeworld+sources tokens
- [x] Create api/src/utils/normalize.ts for sorting **Completed: 2025-10-02** — Removes articles, normalizes dice
- [x] Create api/src/utils/audit.ts for logging **Completed: 2025-10-02** — Admin action audit entries
- [x] Add unit tests for all utility functions **Completed: 2025-10-02** — Full coverage with edge cases

### M1 Cloud Functions

- [x] Create api/src/functions/importSpecies.ts **Completed: 2025-10-02** — Callable function with auth/admin checks
- [x] Implement batch upsert with 500-doc chunking **Completed: 2025-10-02** — Firestore batch write limits
- [x] Add computed fields generation (slug, tokens, sort) **Completed: 2025-10-02** — Uses utility functions
- [x] Add audit logging for import operations **Completed: 2025-10-02** — Tracks import metrics in adminLogs
- [x] Create web/src/utils/firebase.ts **Completed: 2025-10-02** — Firebase client SDK initialization

### M1 UI Components

- [x] Create web/src/components/SpeciesCard.tsx **Completed: 2025-10-02** — Thumbnail with name, homeworld, sources, mini stats
- [x] Create web/src/components/StatsTable.tsx **Completed: 2025-10-02** — Attribute ranges, dice, move, size display
- [x] Create web/src/components/AbilitiesPanel.tsx **Completed: 2025-10-02** — Special abilities and story factors
- [x] Create web/src/components/ImagePlaceholder.tsx **Completed: 2025-10-02** — Silhouette with initials, grid pattern
- [x] Create web/src/components/SearchBar.tsx **Completed: 2025-10-02** — Debounced search with 200ms delay

### Performance Tuning

- [ ] Profile Firestore query latency in production **Completed:**
- [ ] Optimize searchTokens array size if queries slow **Completed:**
- [ ] Add Algolia integration if Firestore search insufficient **Completed:**

### Error Handling

- [ ] Add global error boundary component **Completed:**
- [ ] Implement retry logic for failed Firestore writes **Completed:**
- [ ] Add offline detection and user notification **Completed:**

### Mobile Responsiveness

- [ ] Test catalog layout on mobile devices **Completed:**
- [ ] Adjust filter UI for small screens **Completed:**
- [ ] Ensure touch targets meet a11y standards (≥44px) **Completed:**

### SEO Optimization

- [ ] Add meta tags for Open Graph **Completed:**
- [ ] Add structured data for species (schema.org) **Completed:**
- [ ] Configure sitemap generation **Completed:**

### Budget Alerts

- [ ] Enable Firebase budget alerts ($10, $50, $100) **Completed:**
- [ ] Monitor Firestore read/write usage weekly **Completed:**

### Future Enhancements (Post-v1)

- [ ] Implement attribute range filters (e.g., Perception ≥ 3D) **Completed:**
- [ ] Add species comparison tool **Completed:**
- [ ] Add user favorites (localStorage or Firestore) **Completed:**
- [ ] Add dark mode toggle **Completed:**

---

## Next 5 Tasks to Run

1. **[COMPLETED: 2025-10-11]** ~~Authentication System~~ — **Status**: ✅ Email/password and Google OAuth working, protected routes, admin features, character ownership, Sign Out button all functional

2. **Update CharacterNew.tsx to auto-assign user_id** — **Status**: Pending. Character creation needs to automatically set user_id from auth.currentUser.uid when creating new characters

3. **[COMPLETED: 2025-10-13]** ~~Document Firebase Admin SDK production setup~~ — **Status**: ✅ Created comprehensive deployment documentation with firebase-admin 12.7.0 upgrade guide, iFastNet deployment instructions, and WASM fix verification

4. **Add loading states to character list** — **Status**: Pending. Add loading spinner for initial character fetch and during character reassignment operations

5. **Add character creation flow with auth** — **Status**: Pending. Ensure new characters are automatically assigned to the logged-in user's UID

6. **Clean up duplicate background processes** — **Status**: Pending. Multiple MySQL API and Vite dev servers running in background. Need process cleanup and documentation of proper startup/shutdown workflow.

7. **Test complete user journey** — Verify catalog → search → filter → detail page flow with all data displaying correctly

8. **Deploy updated React Router .htaccess** — **Status**: Pending. Upload new rewrite rules that route `/d6StarWars/*` paths back to `index.html` and proxy `/d6StarWars/api/*` requests to the Node backend.

9. **[COMPLETED: 2025-10-13]** ~~Deploy firebase-admin 12.7.0 to production~~ — **Status**: ✅ Successfully deployed firebase-admin 12.7.0 to iFastNet with 1GB virtual memory. WASM errors resolved. Site running in production. Lightweight deployment package (304 KB) with npm install on server. See `deploy/backend-light/` for deployment files.
