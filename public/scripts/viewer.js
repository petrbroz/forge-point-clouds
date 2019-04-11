window.addEventListener('DOMContentLoaded', function(ev) {
    const options = {
        env: 'AutodeskProduction',
        getAccessToken: function(callback) {
            fetch('/api/auth/token')
                .then((response) => response.json())
                .then((json) => {
                    const auth = json.access_token;
                    callback(auth.access_token, auth.expires_in);
                });
        }
    };

    let app = null;
    Autodesk.Viewing.Initializer(options, async function() {
        app = new Autodesk.Viewing.ViewingApplication('viewer');
        app.registerViewer(app.k3D, Autodesk.Viewing.Private.GuiViewer3D, { extensions: ['PointCloudExtension'] });
        const models = await listModels();
        if (models.length > 0) {
            const viewables = await loadModel(app, models[0].urn);
            if (viewables.length > 0) {
                await loadViewable(app, viewables[0]);
            }
        }
    });
});

/**
 * Makes request to /api/models to get list of models available for viewing.
 * @returns {Promise<object[]>} Promise that resolves into a list of JavaScript objects,
 * each containing a _urn_ (base64-encoded ID) of a specific model from Forge.
 */
function listModels() {
    return fetch('/api/models').then(resp => resp.json());
}

/**
 * Loads specific model and returns list of all its viewable items.
 * @param {ViewingApplication} app {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/viewingapplication|ViewingApplication}.
 * @param {string} urn Base64-encoded ID of model from Forge.
 * @returns {Promise<object[]>} Promise that resolves into a list of viewable items.
 */
function loadModel(app, urn) {
    return new Promise(function(resolve, reject) {
        function onSuccess() { resolve(app.bubble.search({ type: 'geometry' })); }
        function onFailure() { reject('Could not load document'); }
        app.loadDocument('urn:' + urn, onSuccess, onFailure);
    });
}

/**
 * Loads specific viewable into the viewer.
 * @param {ViewingApplication} app {@link https://forge.autodesk.com/en/docs/viewer/v6/reference/javascript/viewingapplication|ViewingApplication}.
 * @param {object} viewable JavaScript object representing a viewable item in Forge model.
 * @returns {Promise} Promise that is resolved when the viewable item is successfully loaded.
 */
function loadViewable(app, viewable) {
    return new Promise(function(resolve, reject) {
        function onSuccess() { resolve(); }
        function onFailure() { reject('Could not load viewable'); }
        app.selectItem(viewable.data, onSuccess, onFailure);
    });
}
