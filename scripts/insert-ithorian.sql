-- scripts/insert-ithorian.sql
-- Inserts a single sample Ithorian character for user scottkunian@gmail.com
-- Usage (pick one):
-- 1) In VS Code with SQLTools: open this file, select a connection, then
--    right-click -> SQLTools: Execute Query (or use the Command Palette)
-- 2) From a shell with mysql client:
--    mysql -h host -u user -p'pass' dbname < scripts/insert-ithorian.sql
-- 3) Or copy/paste the INSERT block below into your SQL client connected to the target DB.

-- IMPORTANT: This file does not contain credentials. Use your SQLTools saved connection
-- or a secure shell command to run it locally.

INSERT INTO characters (id, user_id, name, species_slug, data)
VALUES (
  UUID(),
  'scottkunian@gmail.com',
  'Ithorian Rebel Saboteur',
  'ithorian',
  JSON_OBJECT(
    'notes', 'Imported sample character from Source Data/Characters/Ithorian Rebel Sabateur.pdf',
    'attributes', JSON_OBJECT('STR','2D','DEX','2D','PER','2D','KNO','2D')
  )
);

-- Verification: show the most recent characters for that user
SELECT id, user_id, name, species_slug, created_at
FROM characters
WHERE user_id = 'scottkunian@gmail.com'
ORDER BY created_at DESC
LIMIT 10;
