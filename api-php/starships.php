<?php
/**
 * Starships API Endpoint
 * GET /api-php/starships.php - Get all starships
 * GET /api-php/starships.php?id=slug - Get single starship
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cors.php';

handleCors();

try {
    $db = Database::getInstance();

    // Single starship by slug
    if (isset($_GET['id'])) {
        $slug = $_GET['id'];

        $starship = $db->fetchOne(
            "SELECT * FROM starships WHERE slug = ? LIMIT 1",
            [$slug]
        );

        if (!$starship) {
            errorResponse('Starship not found', 404);
        }

        // Parse JSON fields
        if ($starship['weapons_json']) {
            $starship['weapons'] = json_decode($starship['weapons_json'], true) ?? [];
        } else {
            $starship['weapons'] = [];
        }

        if ($starship['sensors_json']) {
            $starship['sensors'] = json_decode($starship['sensors_json'], true) ?? null;
        }

        if ($starship['sources_json']) {
            $starship['sources'] = json_decode($starship['sources_json'], true) ?? [];
        } else {
            $starship['sources'] = [];
        }

        // Remove raw JSON fields from response
        unset($starship['weapons_json']);
        unset($starship['weapons_raw']);
        unset($starship['sensors_json']);
        unset($starship['sensors_raw']);
        unset($starship['sources_json']);
        unset($starship['sources_raw']);

        jsonResponse($starship);
    }

    // All starships
    $category = $_GET['category'] ?? null;

    $sql = "SELECT
                slug as id,
                slug,
                name,
                craft,
                affiliation,
                type,
                category,
                scale,
                length,
                crew,
                hyperdrive,
                maneuverability,
                space,
                hull,
                shields,
                weapons_json,
                imageUrl,
                imageFilename,
                parent,
                isVariant
            FROM starships";

    $params = [];

    if ($category) {
        $sql .= " WHERE category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY name ASC";

    $starships = $db->fetchAll($sql, $params);

    // Parse weapons JSON for each starship
    foreach ($starships as &$ship) {
        if ($ship['weapons_json']) {
            $ship['weapons'] = json_decode($ship['weapons_json'], true) ?? [];
        } else {
            $ship['weapons'] = [];
        }
        unset($ship['weapons_json']);

        // Convert isVariant to boolean
        $ship['isVariant'] = (bool)$ship['isVariant'];
    }

    jsonResponse($starships);

} catch (Exception $e) {
    error_log("Starships API error: " . $e->getMessage());
    errorResponse('Internal server error', 500);
}
