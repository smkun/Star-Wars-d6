<?php
/**
 * Firebase Authentication Helper
 * Verifies Firebase ID tokens using Google's public keys
 */

class FirebaseAuth {
    private static $publicKeys = null;
    private static $publicKeysExpiry = 0;

    /**
     * Verify Firebase ID token
     * Returns user data if valid, false if invalid
     */
    public static function verifyToken($idToken) {
        if (!$idToken) {
            return false;
        }

        try {
            // Parse JWT token
            $parts = explode('.', $idToken);
            if (count($parts) !== 3) {
                return false;
            }

            $header = json_decode(base64_decode($parts[0]), true);
            $payload = json_decode(base64_decode($parts[1]), true);
            $signature = $parts[2];

            // Verify token hasn't expired
            if ($payload['exp'] < time()) {
                error_log("Token expired");
                return false;
            }

            // Verify project ID matches
            if ($payload['aud'] !== FIREBASE_PROJECT_ID) {
                error_log("Project ID mismatch");
                return false;
            }

            // Get public keys
            $keys = self::getPublicKeys();
            if (!isset($keys[$header['kid']])) {
                error_log("Key ID not found");
                return false;
            }

            // Verify signature
            $key = $keys[$header['kid']];
            $verified = openssl_verify(
                $parts[0] . '.' . $parts[1],
                base64_decode(strtr($signature, '-_', '+/')),
                $key,
                OPENSSL_ALGO_SHA256
            );

            if ($verified !== 1) {
                error_log("Signature verification failed");
                return false;
            }

            // Return user data
            return [
                'uid' => $payload['user_id'] ?? $payload['sub'],
                'email' => $payload['email'] ?? null,
                'email_verified' => $payload['email_verified'] ?? false,
                'admin' => $payload['admin'] ?? false,
                'claims' => $payload
            ];

        } catch (Exception $e) {
            error_log("Token verification error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get Firebase public keys (cached)
     */
    private static function getPublicKeys() {
        // Return cached keys if still valid
        if (self::$publicKeys && self::$publicKeysExpiry > time()) {
            return self::$publicKeys;
        }

        // Fetch new keys
        $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
        $response = file_get_contents($url);

        if (!$response) {
            throw new Exception("Failed to fetch Firebase public keys");
        }

        $keys = json_decode($response, true);

        // Cache keys for 1 hour
        self::$publicKeys = $keys;
        self::$publicKeysExpiry = time() + 3600;

        return $keys;
    }

    /**
     * Get user from Authorization header
     */
    public static function getUserFromRequest() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return false;
        }

        $token = $matches[1];
        return self::verifyToken($token);
    }

    /**
     * Require authentication (throw 401 if not authenticated)
     */
    public static function requireAuth() {
        $user = self::getUserFromRequest();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'unauthorized']);
            exit;
        }
        return $user;
    }

    /**
     * Require admin authentication
     */
    public static function requireAdmin() {
        $user = self::requireAuth();
        if (!$user['admin']) {
            http_response_code(403);
            echo json_encode(['error' => 'admin_required']);
            exit;
        }
        return $user;
    }
}
