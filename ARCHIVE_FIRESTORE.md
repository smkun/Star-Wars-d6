# ARCHIVE: Firestore workflows

This repository has been migrated to use a hosted MySQL database (gamers_d6Holochron) as the canonical data store. The web application now reads species and starship data from a local MySQL-backed API during development and from the production API in deployment.

This document archives the previous Firestore-based workflows and lists remaining files that reference Firestore. If you need to re-enable Firestore-based imports or scripts, follow the "Re-enable Firestore" section.

Files referencing Firestore (non-exhaustive):

- scripts/\*.js (import-with-admin.js, seed-emulator.js, seed-full-emulator.js, update-image-urls.js, update-firestore-direct.js, sync-image-urls.js, import-from-holocron.js, replace-all-starships.js, patch-starships.js, etc.)
- scripts/\*.py (Add_New_Aliens.py, import_species_firehose.py, import_species_firehose.py)
- packages/types/src/firestore.types.ts and compiled outputs in packages/types/dist/
- PRD.md, TASKS.md, README.md, CLAUDE.md (documentation references)
- web/dist/\* (build artifacts bundling Firebase SDK)

Recommended actions before deleting legacy Firestore scripts:

1. Create a git branch (recommended):

   git checkout -b remove-firestore-legacy

2. Backup or tag the current commit:

   git tag before-firestore-purge

3. If you want to keep a runnable archive of Firestore scripts, move them to a dedicated folder `legacy_firestone_scripts/` and update READMEs to point to it.

Re-enable Firestore (if absolutely necessary):

- Ensure Firebase project and credentials are available.
- Restore `FIRESTORE_EMULATOR_HOST` or `GOOGLE_APPLICATION_CREDENTIALS` environment variables as required by each script.
- Run scripts from the `legacy_firestone_scripts/` area to avoid accidents.

Notes:

- The default development flow now uses the local MySQL API. Do not run legacy scripts against production Firestore unless you intend to modify production data.
- This document is generated automatically as part of the aggressive Firestore purge. Edit as needed.
