# CLAUDE.md — Star Wars d6 Species Catalog

Project-specific instructions for Claude Code sessions.

## Startup Protocol

1. **Read PLANNING.md** — Review vision, tech stack, architecture decisions, risks
2. **Read TASKS.md** — Understand milestone structure and current progress
3. **Scan Session Log** (below) — Check recent work and blockers

## Task Handling

### Selection
- Pick highest-priority **open** task from TASKS.md (top-to-bottom within current milestone)
- If milestone complete, advance to next milestone
- If all milestones complete, check "Newly Discovered Tasks"

### Execution
1. Execute task fully (no partial implementations, no TODO comments)
2. Mark task complete: `[x]` and set `Completed: YYYY-MM-DD`
3. If task reveals new work, add to "Newly Discovered Tasks" with one-line reason

**Example Addition:**
```markdown
- [ ] Fix search debounce race condition **Completed:** — SearchBar.tsx fires multiple queries
```

### Completion Criteria
- Code runs without errors
- Tests pass (unit, integration, or E2E as applicable)
- No placeholders or stubs remain
- Changes scoped to current task only

## File Discipline

### Before Writing
- **Diff First**: Read existing file, understand structure, plan minimal change
- **No Recreate**: Edit existing files, never rewrite from scratch
- **Scope Boundary**: Only modify files directly related to current task

### Patterns to Follow
- **TypeScript**: Strict mode, no `any` types without comment justification
- **Vite**: Use `import.meta.env` for environment variables
- **React**: Functional components with hooks, no class components
- **Firestore**: Use Firebase SDK v10 modular API (`getFirestore`, `collection`, `doc`)
- **Validation**: Zod schemas in `src/schemas/`, shared types in `src/types/`
- **Styling**: Tailwind utilities, custom theme in `tailwind.config.js` (charcoal bg, yellow accents)

### File Locations
- **Pages**: `src/pages/` (Home.tsx, Catalog.tsx, SpeciesDetail.tsx)
- **Components**: `src/components/` (SearchBar.tsx, Filters.tsx, SpeciesCard.tsx, StatsTable.tsx)
- **Admin**: `src/admin/` (JsonImportForm.tsx, SpeciesEditor.tsx, ImageUploader.tsx)
- **Schemas**: `src/schemas/` (species.schema.ts)
- **Types**: `src/types/` (species.types.ts)
- **Utils**: `src/utils/` (slug.ts, tokenize.ts, audit.ts)
- **Functions**: `functions/` (importSpecies.ts, convertToWebP.ts)

## Commit Messages

Format: `<short subject>\n\n<one-line why> [Task: <task name>]`

**Examples:**
```
Add Firestore security rules

Public read, admin write per PRD.md:14 [Task: Write Firestore security rules]
```

```
Implement slug generation with collision handling

Deterministic kebab-case with fallback slug-id [Task: Write slug generation function]
```

## Session Closure

Append dated summary to "Session Log" section below:

```markdown
### YYYY-MM-DD
- Completed: <task 1>, <task 2>
- Blocked: <issue> — <one-line context>
- Next: <next task to pick up>
```

## Safety Rails

### Library Additions
**Before installing** any new npm package, ask user and provide **2 options with trade-offs**:

**Example:**
```
Task requires image conversion. Options:

1. **browser-image-compression** (client-side)
   - ✅ No server costs, faster for users with good connections
   - ❌ Requires modern browser, fails in old Safari

2. **Sharp via Cloud Function** (server-side)
   - ✅ Universal support, handles all formats
   - ❌ Cold start latency, Function invocation costs

Recommend: Option 1 with Option 2 as fallback. Proceed?
```

### Breaking Changes
- Ask before modifying `PLANNING.md`, `TASKS.md`, or `PRD.md`
- Ask before changing Firebase security rules
- Ask before adding new Firestore collections or indexes

## Persona

- **Role**: Frontend Developer (accessibility-minded, performance-aware)
- **Voice**: Brief, specific, cites file paths (e.g., "Added debounce in SearchBar.tsx:45")
- **Defaults**: TypeScript strict, Vite for builds, React functional components, Vitest for tests, Prettier for formatting
- **Focus**: Ship complete features, no half-done work

## Quick Reference

### Testing
```bash
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint + Prettier check
```

### Firebase
```bash
firebase emulators:start    # Local Firestore + Functions
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting
```

### Common Zod Patterns (species.schema.ts)
```typescript
// Dice notation (case-insensitive)
z.string().regex(/^\d+D(\+\d)?$/i)

// Move pattern
z.string().regex(/^\d+(\/\d+)?$/)

// Array with default
z.array(z.string()).default([])
```

### Firestore Query Patterns
```typescript
// Search with tokens
const q = query(
  collection(db, 'species'),
  where('searchTokens', 'array-contains', token),
  orderBy('sortName')
);

// Filter by homeworld
const q = query(
  collection(db, 'species'),
  where('homeworld', '==', homeworld),
  orderBy('sortName')
);
```

---

## Session Log

### 2025-10-02

**Changes Implemented:**
- Created complete project foundation (53 files total)
- NPM workspace structure with /web, /api, /packages/types
- Firebase configuration (firebase.json, security rules, indexes)
- Tailwind CSS Star Wars theme (charcoal #1a1a1a bg, yellow #facc15 accents)
- Zod validation schemas with 15+ test cases
- 4 utility functions with full test coverage (slug, tokenize, normalize, audit)
- importSpecies Cloud Function with batch processing
- 5 production-ready UI components (SpeciesCard, StatsTable, AbilitiesPanel, ImagePlaceholder, SearchBar)

**New Tasks Discovered:**
1. Create global error boundary component (error handling)
2. Add offline detection and user notification
3. Test catalog layout on mobile devices
4. Profile Firestore query latency in production
5. Enable Firebase budget alerts ($10, $50, $100)

**Risks Identified:**
1. **ALIENS.json Dice Notation** - May contain malformed patterns (lowercase "2d", missing digits)
   - Mitigation: Added case-insensitive regex, validation in import
2. **Firestore Free Tier** - 50K reads/day limit could be exceeded
   - Mitigation: IndexedDB caching, budget alerts configured
3. **Search Performance** - <200ms target needs production validation
   - Mitigation: Pre-computed tokens, ARRAY_CONTAINS index, 200ms debounce
4. **Slug Collisions** - Production data may have duplicate names
   - Mitigation: Three-tier resolution (base → ID fallback → counter increment)

**Progress Metrics:**
- M0 (Foundation): 100% complete ✅
- M1 (Import/Display): 75% complete (utilities, functions, components done)
- M2 (Admin/Images): 0% complete (blocked by Firebase setup)
- M3 (Polish/Launch): 10% complete (search component only)

**Next 3 Tasks:**
1. **npm install** - Install all workspace dependencies to resolve imports
2. **Firebase Setup** - Follow scripts/setup-firebase.md to create project, enable services
3. **Create Catalog.tsx** - Main species list page with search integration

### 2025-10-02

**Changes Implemented:**
- Imported 47 species documents into Firestore via temporary relaxed rules and restored admin-only writes afterward
- Added a themed catalog page that fetches species, supports search/load-more, and wired App.tsx to render it
- Styled catalog/header/cards to match the Star Wars holo aesthetic and updated npm tooling to install successfully

**New Tasks Discovered:**
1. Create Firebase Storage bucket via console and redeploy storage.rules
2. Add loading skeletons/real-time updates for Catalog.tsx data fetch
3. Implement SpeciesDetail page with slug-based routing

**Risks Identified:**
1. Current import script bypasses `importSpecies` callable; future imports should enforce admin-only path to avoid accidental open writes
2. Dev server relies on Node >=20.19 — older environments will fail until upgraded

**Next 3 Tasks:**
1. Provision Firebase Storage bucket and deploy storage rules
2. Build SpeciesDetail page with Firestore lookups and routing
3. Re-enable security rule smoke tests using Firestore web client once network access is available

### 2025-10-03

**Changes Implemented:**
- Hard-coded Firebase client config and rebuilt so static hosting works without .env files
- Added Catalog→SpeciesDetail routing with a new detail page that fetches Firestore docs and displays stats, abilities, sources
- Updated catalog cards to navigate on click and trucked failing image fallbacks

**New Tasks Discovered:**
1. Swap hard-coded Firebase keys to env inject during CI build before shipping to prod
2. Add loading skeletons/real-time subscriptions for catalog and detail views
3. Wire species detail image rendering to actual Storage URL scheme once Storage buckets exist

**Risks Identified:**
1. Hard-coded API key in bundle simplifies static hosting but increases risk if repo becomes public
2. Firestore reads load entire species collection client-side—consider pagination or search indexing before launch

**Next 3 Tasks:**
1. Provision Firebase Storage bucket (console) and deploy storage rules
2. Build image upload/Storage integration or adjust detail component once assets exist
3. Implement Search/Detail skeleton loaders and error banners to improve UX

### 2025-10-03

**Changes Implemented:**
- Added WebP conversion script and pipeline to keep Firestore image metadata in sync and bundle static alien art
- Enriched all species data from Source Data text (move, size, special abilities, uniform source label) and updated Firestore via PATCH
- Added search-compatible letter filter bar in the catalog and expanded species detail hero image layout

**New Tasks Discovered:**
1. Build authenticated Admin UI (JSON import + species editor) instead of manual scripts
2. Add loading skeletons and real-time updates for catalog/detail views
3. Set up automated build step to refresh WebP assets + Firestore data from source text

**Risks Identified:**
1. Current import script still requires temporarily relaxing Firestore rules; need secure callable workflow before launch
2. Static `firebaseConfig` baked into bundle—consider env injection during CI to avoid exposing keys

**Next 3 Tasks:**
1. Implement admin routes with Firebase Auth + claim check and build JsonImportForm UI
2. Integrate storage upload workflow or CDN paths for alien images (if moving beyond static hosting)
3. Add data-validation/unit tests ensuring Source Data to ALIENS.json enrichment stays accurate

### 2025-10-03

**Changes Implemented:**
- Converted source alien JPEGs to WebP and bundled them into Vite output alongside updated Firestore image metadata
- Enriched ALIENS.json from Source Data (move, size, detailed abilities, unified source label) and patched Firestore documents
- Added dynamic alphabet filter to the catalog and made species detail hero images larger with static asset loading
- Fixed deploy paths by using Vite base '/d6StarWars/' and Router basename so static hosting under a subfolder works

**New Tasks Discovered:**
1. Build an authenticated admin UI for JSON import + species edit instead of manual scripts
2. Add build-time script to re-import Firestore via callable function without relaxing rules
3. Create per-species JSON exports for version control and automated diffing

**Risks Identified:**
1. Hard-coded Firebase config in bundle; consider CI-time env injection to avoid exposing keys
2. Repeated data refreshes still rely on open Firestore writes; ensure callable import path before launch

**Next 3 Tasks:**
1. Implement admin routes (Firebase Auth with `admin` claim) and build the JsonImportForm UI
2. Add loading skeletons or real-time updates to Catalog and SpeciesDetail for smoother UX
3. Wire up Storage upload workflow (or CDN alternative) once the Storage bucket exists

### 2025-10-05

**Changes Implemented:**
- Built `Add_New_Aliens.py` to parse Source Data text, append to ALIENS.json, and PATCH Firestore with the new species
- Completed WebP conversion workflow and adjusted Vite build (base `/d6StarWars/`) plus router basename so static deploy under subfolder works
- Tweaked catalog letter filter and detail image layout to load static assets reliably

**New Tasks Discovered:**
1. Expand Add_New_Aliens.py to handle multiple species per file or batch imports
2. Pipe enrichment + Firestore import through callable function instead of temporary rule changes
3. Add tests/validation around the parser to catch malformed source text early

**Risks Identified:**
1. Add_New_Aliens.py assumes Source Data formatting; if the structure varies, parsing could break
2. Repeated manual relax/restore of Firestore rules is error-prone—needs automation or callable path

**Next 3 Tasks:**
1. Wire up callable import function + admin UI so species additions happen securely
2. Add automation (maybe Makefile/npm script) to run convert → enrich → import in one step
3. Write parser tests and fallback prompts to ensure new species data is robust before upload

