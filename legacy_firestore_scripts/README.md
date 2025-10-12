# legacy_firestore_scripts/

## Purpose

This folder contains archived copies of scripts that interact with Firestore. These
are preserved for audit, ad-hoc maintenance, and for operators who intentionally
want to run old Firestore-writing workflows.

## Safety policy

- Scripts in this folder are considered legacy and are not part of the default
  development or CI flow.
- To intentionally run a script that writes to Firestore, first set the
  environment variable `EXPLICIT_FIRESTORE_ACK=1` and run the script from this
  folder. Example:

  ```bash
  EXPLICIT_FIRESTORE_ACK=1 node legacy_firestore_scripts/import-with-admin.js ./PATH/TO/FILE.json
  ```

- Keep your `GOOGLE_APPLICATION_CREDENTIALS` and other credentials secure. These
  scripts may assume different authentication mechanisms (Admin SDK, REST API keys).

- If you are uncertain, open an issue or consult the repository maintainer before running.

## Why archived

We migrated the canonical data store to MySQL and adapted the web app to read
from a local API. The original Firestore scripts are retained for reference and
for deliberate, manual use only.
This folder contains archived Firestore scripts that used to operate on the project's
Cloud Firestore. The main repository now uses a MySQL-backed canonical store and a
local API. These scripts are preserved for historical or emergency use only.

Policy:

- Files in this folder may still reference Firestore and the Admin SDK.
- Do NOT run these scripts against production Firestore unless you know what you
  are doing. Prefer the MySQL-based scripts in `scripts/*-to-mysql.js` where
  available.

To run a script from here intentionally, set:

EXPLICIT_FIRESTORE_ACK=1 GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node legacy_firestore_scripts/import-with-admin.js

Or run them inside an isolated environment with the Firestore emulator.

This folder was created automatically during the aggressive Firestore purge.
