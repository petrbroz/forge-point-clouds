const express = require('express');
const { AuthenticationClient } = require('autodesk-forge-tools');

let router = express.Router();
let auth = new AuthenticationClient(process.env.FORGE_CLIENT_ID, process.env.FORGE_CLIENT_SECRET);

router.get('/auth/token', async function(req, res, next) {
    try {
        const result = await auth.authenticate(['viewables:read']);
        res.json({ access_token: result });
    } catch(err) {
        next(err);
    }
});

router.get('/models', function(req, res) {
    const results = [
        { urn: process.env.MODEL_URN }
    ];
    res.json(results);
});

module.exports = router;
