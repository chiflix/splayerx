const { app, splayerx } = require('electron');

const electronVersion = app.getVersion();
const actualHash = splayerx.getVersionHash().trim();

process.stdout.write(`${electronVersion} ${actualHash}`);
process.exit(0);
