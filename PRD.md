PRD — Star Wars–styled site + Firebase from ALIENS.json
1) Goal

Load ALIENS.json (array of species objects in your format) into Firestore and render a fast, searchable catalog with a clean Star-Wars vibe. Images referenced by imageUrl will be uploaded later; wire paths now.

2) Success criteria

Import accepts ALIENS.json with zero manual edits; gives a diff report on rejects.

Search/filter < 200ms after debounce on a mid-range laptop.

Lighthouse ≥ 90 across PWA metrics on Firebase Hosting.

Public read, admin-only write enforced by rules.

3) Users

Fans/players: quick lookup by name, homeworld, tags.

GMs/writers: filter by attributes, grab example names.

You (admin): import JSON, edit records, upload images later.

4) Data model (canonical)

Single object example matches your source:

{
  "id": 1,
  "name": "Bothan",
  "plural": "Bothans",
  "description": "Fur-covered information brokers whose SpyNet shapes galactic politics.",
  "personality": "Curious, manipulative, crafty, suspicious, loyal and brave.",
  "physicalDescription": "Short furred humanoids; fur ripples with emotion.",
  "homeworld": "Bothawui and colonies",
  "languages": {
    "native": "Bothese",
    "description": "Bothans speak, read, and write Bothese and Basic."
  },
  "exampleNames": ["Borsk Fey’lya","Karka Kre’fey","Koth Melan","Tav Breil’lya","Tereb Ab’lon"],
  "adventurers": "Often SpyNet operatives, soldiers, pilots, diplomats, explorers.",
  "imageUrl": "bothan.webp",
  "stats": {
    "attributeDice": "12D",
    "attributes": {
      "dexterity": {"min": "1D","max": "4D"},
      "knowledge": {"min": "2D","max": "4D"},
      "mechanical": {"min": "1D","max": "3D"},
      "perception": {"min": "3D","max": "5D"},
      "strength": {"min": "1D+2","max": "3D+2"},
      "technical": {"min": "2D","max": "4D+1"}
    },
    "move": "10/12",
    "size": "1.3-1.8 meters"
  },
  "specialAbilities": [{"name": "Special","description": "Enhanced"}],
  "storyFactors": [{"name": "Story","description": "O"}],
  "notes": "",
  "sources": ["Section 16: Bothan"]
}

Firestore layout

Collection: species

Doc ID: slug (kebab-case of name, unique; fallback slug-id on collisions)

Fields (stored as):

Core: name, plural, description, personality, physicalDescription, homeworld, adventurers, notes

languages.native, languages.description

exampleNames (array of strings)

stats.attributeDice (string)

stats.attributes.<attr>.min|max (strings like 1D+2)

stats.move (string like 10/12)

stats.size (string like 1.3-1.8 meters)

specialAbilities (array of {name, description})

storyFactors (array of {name, description})

sources (array of strings)

imageUrl (original filename), imagePath (aliens/<slug>.webp), hasImage (bool)

Computed: slug, searchName, searchTokens (name+homeworld+sources tokens), sortName, updatedAt (server time)

meta/config: schemaVersion, lastImportHash

Indexes

Single: searchName ASC

Single: searchTokens ARRAY_CONTAINS

Single: homeworld ASC

Composite: homeworld ASC + sortName ASC

Optional: sources ARRAY_CONTAINS + sortName ASC

5) Import pipeline

Admin UI → upload ALIENS.json (array). Dry-run validates all records; shows row-level errors (path, reason).

On commit:

Compute slug, searchTokens, sortName.

Batch upserts (≤500 per chunk).

Set imagePath from imageUrl if present (aliens/<derived-slug>.webp); mark hasImage=false until upload.

Write updatedAt with server timestamp.

Store lastImportHash to skip no-change reimports.

Validation (AJV or Zod)

Required: name, stats.attributeDice, stats.attributes, languages.native, languages.description, description

Pattern checks:

Dice: ^\d+D(\+\d)?$ (case-insensitive) for all min|max and attributeDice

stats.move: ^\d+(\/\d+)?$ (e.g., 10 or 10/12)

stats.size: tolerate strings; warn if not ^\d+(\.\d+)?-\d+(\.\d+)?\s*(m|meter|meters)$ (don’t fail)

Arrays: exampleNames, specialAbilities, storyFactors, sources default to [] if missing

Coerce: id to string (don’t rely on numeric IDs)

6) Image handling (later, wired now)

Storage: /aliens/<slug>.webp

Public read allowed when ready; write admin-only.

Admin editor: drag-drop → convert to WebP (client or Function) → set hasImage=true.

Placeholder: silhouette with initials if hasImage=false.

7) Functional requirements
Public

Home: hero panel, global search, featured species.

Catalog:

Debounced search (name/homeworld/sources tokens).

Filters: homeworld (typeahead), sources (multi), attribute presence (checkbox set like “Perception ≥ 3D min” is out-of-scope for v1).

Sort: A–Z, recently updated.

Infinite scroll or paged list.

Detail page /species/<slug>:

Image or placeholder.

Text sections: Description, Personality, Physical Description, Adventurers, Notes.

Languages block.

Stats table: attribute min/max as 1D+2–3D+2, plus attributeDice, move, size.

Special Abilities and Story Factors panels.

Example Names with copy buttons.

Sources list.

Admin

Email/password + MFA (Firebase Auth). Assign admin via custom claim.

Importer: drag JSON → dry-run → commit with diff summary.

Inline editor with validation; image upload.

Audit log adminLogs (who, when, action, slug).

Read API (optional)

GET /api/species?query=bothan&homeworld=...

GET /api/species/:slug

8) Non-functional

Performance: prerender top routes; cache Firestore reads; lazy-load images.

Accessibility: semantic headings, labels, keyboard nav, strong focus states, alt text fallback.

Security: admin claim gates writes; Functions validate payloads; Storage write admin-only.

Privacy: no PII; opt-in analytics only.

9) Theme (SW-flavored, IP-safe)

Colors: matte charcoal bg, off-white text, subtle yellow accents.

Fonts: Pathway Gothic One (headings), Inter (body).

UI: thin “energy” borders, light bars for separators, small Aurebesh-style SVG accents (original).

Icons: custom pips for attributes.

No copyrighted logos or sounds.

10) Tech stack

Frontend: React + Vite (or Next.js if you want SSR)

Styles: Tailwind

Firebase: Hosting, Firestore, Storage, Auth, Functions (Node 20)

Types: TypeScript; validation: Zod or Ajv

CI/CD: GitHub Actions → firebase deploy

11) Firebase rules (v1)

Firestore

rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    match /species/{slug} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /meta/{doc} {
      allow read: if false;
      allow write: if isAdmin();
    }
    match /adminLogs/{doc} {
      allow read, write: if isAdmin();
    }
  }
}


Storage

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    match /aliens/{file} {
      allow read: if true;     // flip to public when images go live
      allow write: if isAdmin();
    }
  }
}

12) JSON Schema (AJV-ready, trimmed)
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name","description","languages","stats","stats","sources"],
    "properties": {
      "id": {"oneOf":[{"type":"integer"},{"type":"string"}]},
      "name": {"type":"string","minLength":1},
      "plural": {"type":"string"},
      "description": {"type":"string"},
      "personality": {"type":"string"},
      "physicalDescription": {"type":"string"},
      "homeworld": {"type":"string"},
      "languages": {
        "type":"object",
        "required":["native","description"],
        "properties":{
          "native":{"type":"string"},
          "description":{"type":"string"}
        }
      },
      "exampleNames": {"type":"array","items":{"type":"string"}, "default":[]},
      "adventurers": {"type":"string"},
      "imageUrl": {"type":"string"},
      "stats": {
        "type":"object",
        "required":["attributeDice","attributes"],
        "properties":{
          "attributeDice":{"type":"string","pattern":"^[0-9]+D(\\+[0-9])?$"},
          "attributes":{
            "type":"object",
            "properties":{
              "dexterity":{"$ref":"#/defs/attrRange"},
              "knowledge":{"$ref":"#/defs/attrRange"},
              "mechanical":{"$ref":"#/defs/attrRange"},
              "perception":{"$ref":"#/defs/attrRange"},
              "strength":{"$ref":"#/defs/attrRange"},
              "technical":{"$ref":"#/defs/attrRange"}
            }
          },
          "move":{"type":"string","pattern":"^[0-9]+(\\/[0-9]+)?$"},
          "size":{"type":"string"}
        }
      },
      "specialAbilities":{"type":"array","items":{"$ref":"#/defs/namedText"}, "default":[]},
      "storyFactors":{"type":"array","items":{"$ref":"#/defs/namedText"}, "default":[]},
      "notes":{"type":"string"},
      "sources":{"type":"array","items":{"type":"string"}, "minItems":1}
    }
  },
  "defs": {
    "attrRange":{
      "type":"object",
      "required":["min","max"],
      "properties":{
        "min":{"type":"string","pattern":"^[0-9]+D(\\+[0-9])?$"},
        "max":{"type":"string","pattern":"^[0-9]+D(\\+[0-9])?$"}
      }
    },
    "namedText":{
      "type":"object",
      "required":["name","description"],
      "properties":{
        "name":{"type":"string"},
        "description":{"type":"string"}
      }
    }
  }
}

13) UI components

SearchBar (tokenizes name/homeworld/sources)

Filters (homeworld typeahead, sources multiselect)

SpeciesCard (name, homeworld, chips for sources, mini stats)

SpeciesDetail (sections + abilities/factors + copy-names)

StatsTable (renders min–max ranges)

JsonImportForm (dry-run + commit, diff summary)

ImageUploader (converts to WebP and writes imagePath)

14) Testing

Unit: schema validation, slug creation, tokenization.

Integration: import → Firestore docs → UI renders/filters.

E2E (Playwright): search, filter, detail, admin auth, image upload.

Performance: Lighthouse CI in GitHub Actions.

15) Milestones

M0 (Day 1–2): Firebase proj, Hosting live, rules scaffold, schema + types.

M1 (Day 3–5): Importer (dry-run/commit), list/detail pages, indexes.

M2 (Day 6–7): Admin editor, image uploader wiring.

M3 (Day 8): Theming polish, a11y pass, docs.

16) Acceptance checklist

 Importer accepts ALIENS.json; rejects show row+path+reason.

 Catalog search finds “bothan” and filters by Bothawui.

 Detail page shows abilities, story factors, stats (move, size).

 Example names have copy buttons.

 Image placeholder appears when hasImage=false.

 Firestore/Storage writes blocked for non-admins.

 Direct route /species/bothan loads cleanly.