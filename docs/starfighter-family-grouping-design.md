# Starfighter Family Grouping - Design Specification

## Overview
Design specification for implementing family-based grouping for the starfighters catalog, allowing users to browse fighters by their base model family (X-Wing, Y-Wing, TIE Fighter, etc.) and view all variants in an organized hierarchy.

## Current State Analysis

### Data Inventory
- **Total Starfighters**: 209 in import-ready file
- **d6holocron Source**: 184 unique pages identified
- **Existing Variant Structure**: Partially implemented with `parent`, `variantOf`, and `isVariant` fields

### Current Schema (starship.schema.ts)
```typescript
{
  parent: z.string().optional(),        // Base model name (e.g., "TIE Fighter")
  variantOf: z.string().optional(),     // Full parent page name
  isVariant: z.boolean().default(false) // True if variant
}
```

### Current Family Structures

#### ✅ Well-Structured Families
1. **TIE Fighter Family** (33 variants)
   - Parent: "TIE Fighter"
   - Variants: TIE/sa Bomber, TIE Interceptor, TIE/D Defender, TIE Advanced, etc.
   - Status: ✅ Correctly structured

2. **X-Wing Family** (14 variants)
   - Parent: "'''X-Wing'''" (has wiki markup)
   - Variants: T-65A, T-65B, T-65XJ3, T-70, etc.
   - Status: ⚠️ Parent name needs cleanup (remove ''' markup)

#### ❌ Missing Family Structures
- Y-Wing family (not yet in data)
- B-Wing family (not yet in data)
- Z-95 Headhunter family (single entry, no variants)
- E-Wing family (not yet in data)
- A-Wing family (single entry, no variants)

## Design Goals

### User Experience
1. **Browse by Family**: Users can filter/group fighters by family (X-Wing, TIE, Y-Wing, etc.)
2. **Visual Hierarchy**: Clear parent → variant relationship display
3. **Expandable Groups**: Collapsible family sections showing variant count
4. **Sort Options**:
   - By family name (alphabetical)
   - By era (if we add era metadata)
   - By affiliation (Rebel, Imperial, etc.)

### Technical Requirements
1. **Data Completeness**: Fetch all missing starfighters from d6holocron
2. **Clean Schema**: Standardize family naming conventions
3. **Efficient Queries**: Support filtering by family in database
4. **Backwards Compatibility**: Don't break existing single-ship entries

## Enhanced Schema Design

### Proposed Schema Changes

```typescript
export const starshipSchema = z.object({
  // ... existing fields ...

  // Enhanced family grouping fields
  family: z.string().optional(),           // Standardized family name: "X-Wing", "TIE Fighter", "Y-Wing"
  familySlug: z.string().optional(),       // URL-safe slug: "x-wing", "tie-fighter", "y-wing"
  parent: z.string().optional(),           // Human-readable parent name (cleaned)
  parentSlug: z.string().optional(),       // Parent document slug for linking
  variantOf: z.string().optional(),        // Original wiki page name (preserved for reference)
  isVariant: z.boolean().default(false),   // True if this is a variant
  variantDesignation: z.string().optional(), // Model designation: "T-65A", "TIE/sa", etc.

  // Additional metadata for grouping
  affiliation: z.string().optional(),      // Already exists
  era: z.enum(['old-republic', 'clone-wars', 'galactic-civil-war', 'new-republic', 'new-jedi-order']).optional(),
  manufacturer: z.string().optional(),     // Extract from 'craft' field
});
```

### Family Naming Standards

| Wiki Pattern | Standardized Family | Family Slug |
|--------------|-------------------|-------------|
| "X-Wing Starfighters" page | "X-Wing" | "x-wing" |
| "Y-Wing Starfighters" page | "Y-Wing" | "y-wing" |
| "TIE Fighter" variants | "TIE Fighter" | "tie-fighter" |
| "B-wing" page | "B-Wing" | "b-wing" |
| "Z-95 Headhunter" page | "Z-95 Headhunter" | "z-95-headhunter" |
| Individual ships | null | null |

### Data Migration Strategy

1. **Clean Existing Data**
   ```javascript
   // Remove wiki markup from parent names
   parent: "'''X-Wing'''" → "X-Wing"

   // Generate family fields from parent
   if (parent) {
     family = parent
     familySlug = slugify(parent)
   }
   ```

2. **Extract Variant Designations**
   ```javascript
   // X-Wing family
   "Incom T-65A X-Wing" → variantDesignation: "T-65A"

   // TIE family
   "TIE/sa Bomber" → variantDesignation: "TIE/sa"
   "TIE Interceptor" → variantDesignation: "Interceptor"
   ```

3. **Assign Era and Manufacturer**
   ```javascript
   // From affiliation and timeline knowledge
   affiliation: "Rebel Alliance" → era: "galactic-civil-war"

   // From craft field
   craft: "Incom T-65A X-Wing" → manufacturer: "Incom"
   craft: "Sienar Fleet Systems TIE/sa" → manufacturer: "Sienar Fleet Systems"
   ```

## Database Schema

### MySQL Implementation

```sql
-- Add new columns to starships table
ALTER TABLE starships ADD COLUMN family VARCHAR(100);
ALTER TABLE starships ADD COLUMN family_slug VARCHAR(100);
ALTER TABLE starships ADD COLUMN parent_slug VARCHAR(100);
ALTER TABLE starships ADD COLUMN variant_designation VARCHAR(50);
ALTER TABLE starships ADD COLUMN era VARCHAR(50);
ALTER TABLE starships ADD COLUMN manufacturer VARCHAR(200);

-- Add indexes for efficient family queries
CREATE INDEX idx_starships_family ON starships(family);
CREATE INDEX idx_starships_family_slug ON starships(family_slug);
CREATE INDEX idx_starships_parent_slug ON starships(parent_slug);

-- Update existing records
UPDATE starships
SET family = REPLACE(REPLACE(parent, "'''", ""), "'''", ""),
    family_slug = LOWER(REGEXP_REPLACE(REPLACE(REPLACE(parent, "'''", ""), "'''", ""), '[^a-zA-Z0-9]+', '-'))
WHERE parent IS NOT NULL AND parent != '';
```

## UI Component Design

### StarfightersPage.tsx Structure

```
┌─ Header ────────────────────────────────────────┐
│ Starfighters Database                           │
│ [Search] [Filter: All Families ▼] [Sort ▼]     │
└─────────────────────────────────────────────────┘

┌─ Family: X-Wing (14 variants) ─────────────── ▼ ┐
│ ┌─ Base Model ────────────────────────────────┐ │
│ │ X-Wing Starfighter                          │ │
│ │ [Incom] Rebel Alliance | Stats preview      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─ Variants ──────────────────────────────────┐ │
│ │ [T-65A] X-Wing  [T-65B] X-Wing  [T-70] ...  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─ Family: TIE Fighter (33 variants) ─────────── ▼ ┐
│ ┌─ Base Model ────────────────────────────────┐ │
│ │ TIE Starfighter                             │ │
│ │ [Sienar] Imperial Navy | Stats preview      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─ Variants ──────────────────────────────────┐ │
│ │ [TIE/sa] Bomber  [TIE/in] Interceptor  ...  │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─ Standalone Fighters ──────────────────────────┐
│ Individual ships without variants               │
│ [Card] [Card] [Card] [Card]                     │
└─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
StarfightersPage
├── SearchBar (with family filter)
├── FamilyGroupList
│   ├── FamilyGroup (X-Wing)
│   │   ├── BaseShipCard
│   │   └── VariantGrid
│   │       └── VariantCard[]
│   ├── FamilyGroup (TIE Fighter)
│   │   ├── BaseShipCard
│   │   └── VariantGrid
│   │       └── VariantCard[]
│   └── ...
└── StandaloneShipsGrid
    └── StarshipCard[]
```

## API Design

### New API Endpoints

```typescript
// Get all families with variant counts
GET /api/starfighters/families
Response: {
  families: [
    {
      name: "X-Wing",
      slug: "x-wing",
      variantCount: 14,
      baseShip: { name, slug, imageUrl, stats... }
    },
    ...
  ]
}

// Get all ships in a family
GET /api/starfighters/family/:familySlug
Response: {
  family: "X-Wing",
  baseShip: { ... },
  variants: [
    { name: "T-65A X-Wing", variantDesignation: "T-65A", ... },
    ...
  ]
}

// Existing endpoint enhanced with family filter
GET /api/starfighters?family=x-wing&category=starfighter
```

### MySQL Query Examples

```sql
-- Get all families with counts
SELECT
  family,
  family_slug,
  COUNT(*) as variant_count,
  MIN(CASE WHEN is_variant = FALSE THEN name END) as base_ship_name
FROM starships
WHERE family IS NOT NULL
GROUP BY family, family_slug
ORDER BY family;

-- Get family with all variants
SELECT *
FROM starships
WHERE family_slug = 'x-wing'
ORDER BY
  CASE WHEN is_variant = FALSE THEN 0 ELSE 1 END,
  variant_designation;

-- Search within a family
SELECT *
FROM starships
WHERE family_slug = 'tie-fighter'
  AND (name LIKE '%bomber%' OR description LIKE '%bomber%')
ORDER BY name;
```

## Implementation Plan

### Phase 1: Data Cleanup & Enhancement (Priority: HIGH)
- [ ] Create migration script to clean existing data
  - Remove wiki markup from parent names
  - Generate family and familySlug fields
  - Extract variant designations
  - Populate manufacturer from craft field
- [ ] Update MySQL schema with new columns
- [ ] Run migration on existing 209 starfighters
- [ ] Validate data integrity

### Phase 2: Missing Data Import (Priority: HIGH)
- [ ] Enhance fetch-starships-variants.js to extract family metadata
- [ ] Fetch missing families from d6holocron:
  - Y-Wing Starfighters page
  - B-Wing Starfighters page
  - E-Wing Starfighters page
  - Z-95 Headhunter variants (if any)
- [ ] Import ~50-75 missing fighters
- [ ] Verify all major families are complete

### Phase 3: API Implementation (Priority: MEDIUM)
- [ ] Add family columns to MySQL starships table
- [ ] Update api/src/server.ts with family endpoints
- [ ] Add family filtering to existing GET /starfighters
- [ ] Create GET /starfighters/families endpoint
- [ ] Create GET /starfighters/family/:slug endpoint
- [ ] Test API responses

### Phase 4: UI Components (Priority: MEDIUM)
- [ ] Create FamilyGroup.tsx component
- [ ] Create VariantCard.tsx component (compact version)
- [ ] Build StarfightersPage.tsx with family grouping
- [ ] Add family filter dropdown to SearchBar
- [ ] Implement expand/collapse for family groups
- [ ] Add routing for family pages (/starfighters/family/x-wing)

### Phase 5: Polish & Testing (Priority: LOW)
- [ ] Add loading skeletons for family groups
- [ ] Implement smooth expand/collapse animations
- [ ] Add variant count badges
- [ ] Test with all major families
- [ ] Mobile responsive testing
- [ ] Performance optimization for large families

## Success Criteria

### Data Completeness
- [x] All starfighters from d6holocron scraped (184 identified)
- [ ] All major families have complete variants (X-Wing, Y-Wing, B-Wing, TIE, Z-95, E-Wing)
- [ ] Family metadata populated for 100% of variant ships
- [ ] No orphaned variants (all variants have valid parent)

### User Experience
- [ ] Users can filter by family in <1 second
- [ ] Family groups expand/collapse smoothly
- [ ] Variant count visible before expanding
- [ ] Mobile-friendly collapsible groups
- [ ] Search works within families

### Technical Quality
- [ ] Database queries execute in <200ms
- [ ] Family indexes improve query performance
- [ ] API responses are properly cached
- [ ] Schema validation passes for all ships
- [ ] No breaking changes to existing functionality

## Open Questions

1. **Era Assignment**: Should we manually assign eras or extract from sources?
   - **Recommendation**: Manual assignment using affiliation + timeline knowledge

2. **Manufacturer Extraction**: How to handle multi-manufacturer ships?
   - **Recommendation**: Primary manufacturer only, store full craft in separate field

3. **Family Icons**: Should each family have a representative icon?
   - **Recommendation**: Use base model image as family icon

4. **Variant Sorting**: How to sort variants within a family?
   - **Recommendation**: Chronological by designation (T-65A, T-65B, T-65C...)

5. **Single-Ship Families**: Show ships without variants separately or as 1-ship families?
   - **Recommendation**: Separate "Standalone Fighters" section

6. **Uglies Grouping**: Should hybrid fighters (TIE-Y Ugly) be in multiple families?
   - **Recommendation**: Single primary family based on main hull, mention hybrid in description

## Risk Assessment

### High Risk
- **Data Migration Errors**: Incorrect family assignment breaks grouping
  - *Mitigation*: Dry-run validation, manual review of family mappings

### Medium Risk
- **Incomplete Wiki Data**: Some families may not have wiki pages with variants
  - *Mitigation*: Fallback to individual ship pages, manual variant discovery

### Low Risk
- **Performance with Large Families**: TIE family (33 variants) may load slowly
  - *Mitigation*: Lazy loading, variant pagination within families

## References

- d6holocron Starfighters page: http://d6holocron.com/wiki/index.php/Starfighters
- Current schema: /web/src/schemas/starship.schema.ts
- Session notes: CLAUDE.md 2025-10-07 to 2025-10-09
- Import script: /scripts/fetch-starships-variants.js
- Existing data: /Source Data/d6holocron/starships/starfighters-variants-import-ready.json
