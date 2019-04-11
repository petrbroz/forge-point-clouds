const express = require('express');
const { AuthenticationClient } = require('autodesk-forge-tools');

let router = express.Router();
let auth = new AuthenticationClient(process.env.FORGE_CLIENT_ID, process.env.FORGE_CLIENT_SECRET);

// GET /api/auth/token
// Generates a 2-legged token that can be used by the viewer when loading models from Forge.
router.get('/auth/token', async function(req, res, next) {
    try {
        const result = await auth.authenticate(['viewables:read']);
        res.json({ access_token: result });
    } catch(err) {
        next(err);
    }
});

// GET /api/models
// Returns list of objects describing Forge models, with each object containing the model's URN.
// Currently the list is hard-coded to a single URN provided in an env. variable.
router.get('/models', function(req, res) {
    const results = [
        { urn: process.env.MODEL_URN }
    ];
    res.json(results);
});

module.exports = router;
