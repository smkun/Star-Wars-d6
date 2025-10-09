This folder contains generated SQL to create tables and insert starship data into the
MySQL/Postgres-compatible schema used by the gamers_d6Holochron database.

Files:

- schema.sql — CREATE TABLE statements for starships and category tables
- import_starships.js — Node script that reads the import-ready JSON and emits INSERT statements
- starfighters.sql, transports.sql, capital.sql — generated INSERT files (created by running the script)

Usage:

1. Review and edit `schema.sql` to match your SQL dialect (MySQL vs Postgres). The schema is intentionally conservative.
2. Run the importer to produce per-category SQL files:

```bash
# from repository root
node dev/sql/import_starships.js
```

3. Apply schema and inserts to your DB (adjust commands for mysql/psql):

```bash
# Example: using mysql CLI
mysql -u <user> -p gamers_d6Holochron < dev/sql/schema.sql
mysql -u <user> -p gamers_d6Holochron < dev/sql/starfighters.sql
mysql -u <user> -p gamers_d6Holochron < dev/sql/transports.sql
mysql -u <user> -p gamers_d6Holochron < dev/sql/capital.sql
```

Notes:

- The importer serializes nested objects (sensors, weapons, sources) as JSON strings in the table.
- Primary keys use the `slug` field (generated from name) to keep imports idempotent.

MySQL runner (optional):

If you prefer to run imports from Node instead of the mysql CLI, there's a small runner script `run_mysql_import.js` that reads the generated files and executes them against a MySQL database using a connection URL provided in the `MYSQL_URL` environment variable.

Example (dry-run):

```bash
MYSQL_URL="mysql://user:pass@host:3306/gamers_d6Holochron" node dev/sql/run_mysql_import.js --dry-run
```

To actually apply the SQL:

```bash
MYSQL_URL="mysql://user:pass@host:3306/gamers_d6Holochron" node dev/sql/run_mysql_import.js
```

The runner executes statements split by semicolons; it's intentionally simple for these generated files. Review `dev/sql/*.sql` before running against production.
