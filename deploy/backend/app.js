// @ts-nocheck
/* eslint-env node */
// Passenger entry point wrapper for iFastNet hosting
// Loads the actual Express server from api/run-local-server.js
//
// iFastNet's Passenger server expects an app.js file in the root directory
// of the Node.js application. This wrapper delegates to the actual server.
//
// Deployment path: /home/gamers/nodejs/star-wars-api/app.js
//
// Note: This is a CommonJS module (uses require). The IDE may show
// "require is not defined" but this is a false positive - Node.js will
// run this file correctly in CommonJS mode (package.json has no "type": "module").

// Load .env file BEFORE starting the server
// This ensures environment variables are available when Passenger starts the app
require('dotenv').config({ path: __dirname + '/.env' });

require('./api/run-local-server.js');
