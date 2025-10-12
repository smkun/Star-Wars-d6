<?php
/**
 * Database Configuration
 * Copy to config.local.php and update with your iFastNet credentials
 */

// Database connection settings
define('DB_HOST', '31.22.4.44');
define('DB_PORT', 3306);
define('DB_NAME', 'gamers_d6Holochron');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('DB_CHARSET', 'utf8mb4');

// Firebase Admin SDK settings (for authentication)
define('FIREBASE_PROJECT_ID', 'star-wars-d6-species');
define('FIREBASE_SERVICE_ACCOUNT_JSON', '/path/to/firebase-admin-key.json');

// CORS settings
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://yourdomain.ifastnet.com',
    'https://your-custom-domain.com'
]);

// Environment
define('ENVIRONMENT', 'production'); // 'development' or 'production'
define('DEBUG', ENVIRONMENT === 'development');

// Load local overrides if exists
if (file_exists(__DIR__ . '/config.local.php')) {
    require_once __DIR__ . '/config.local.php';
}
