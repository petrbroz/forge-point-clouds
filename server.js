const path = require('path');
const express = require('express');

const PORT = process.env.PORT || 3000;
const { FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, MODEL_URN } = process.env;
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET || !MODEL_URN) {
    console.warn('Some of the following env. variables are missing: FORGE_CLIENT_ID, FORGE_CLIENT_SECRET, MODEL_URN');
    return;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', require('./routes/api'));
app.listen(PORT || 3000, function() { console.log(`HTTP server listening on port ${PORT}`); });
