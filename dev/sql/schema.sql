-- Schema for gamers_d6Holochron starships
-- Adjust types/limits to match your SQL server (MySQL/Postgres)

CREATE TABLE IF NOT EXISTS starships (
  slug VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  craft TEXT,
  affiliation TEXT,
  type TEXT,
  category VARCHAR(50),
  scale TEXT,
  length TEXT,
  skill TEXT,
  crew TEXT,
  crewSkill TEXT,
  passengers TEXT,
  cargoCapacity TEXT,
  consumables TEXT,
  cost TEXT,
  hyperdrive TEXT,
  navComputer TEXT,
  maneuverability TEXT,
  space TEXT,
  atmosphere TEXT,
  hull TEXT,
  shields TEXT,
  sensors JSON,
  weapons JSON,
  description TEXT,
  imageFilename TEXT,
  imageUrl TEXT,
  notes TEXT,
  sources JSON,
  pageId INTEGER,
  revisionId INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional category-specific views for convenience
CREATE VIEW IF NOT EXISTS starfighters AS
  SELECT * FROM starships WHERE category = 'starfighter';

CREATE VIEW IF NOT EXISTS spaceTransports AS
  SELECT * FROM starships WHERE category = 'transport';

CREATE VIEW IF NOT EXISTS capitalShips AS
  SELECT * FROM starships WHERE category = 'capital';
