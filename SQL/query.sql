-- SQLTools: ifastNet sv6

SELECT name, parent, isVariant
FROM starships
WHERE name LIKE '%X-wing%' OR parent LIKE '%X-wing%'
ORDER BY parent, isVariant DESC, name
LIMIT 10;