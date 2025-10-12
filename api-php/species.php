<?php
/**
 * Species API Endpoint
 * GET /api-php/species.php - Get all species
 * GET /api-php/species.php?id=slug - Get single species
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cors.php';

handleCors();

try {
    $db = Database::getInstance();

    // Single species by slug
    if (isset($_GET['id'])) {
        $slug = $_GET['id'];

        $species = $db->fetchOne(
            "SELECT * FROM species WHERE slug = ? LIMIT 1",
            [$slug]
        );

        if (!$species) {
            errorResponse('Species not found', 404);
        }

        // Parse properties JSON
        if ($species['properties']) {
            $properties = json_decode($species['properties'], true) ?? [];
            // Merge properties into main object
            foreach ($properties as $key => $value) {
                $species[$key] = $value;
            }
        }
        unset($species['properties']);

        jsonResponse($species);
    }

    // All species
    $species = $db->fetchAll("SELECT * FROM species ORDER BY name ASC");

    // Parse properties for each species
    foreach ($species as &$s) {
        if ($s['properties']) {
            $properties = json_decode($s['properties'], true) ?? [];
            foreach ($properties as $key => $value) {
                $s[$key] = $value;
            }
        }
        unset($s['properties']);
    }

    jsonResponse($species);

} catch (Exception $e) {
    error_log("Species API error: " . $e->getMessage());
    errorResponse('Internal server error', 500);
}
