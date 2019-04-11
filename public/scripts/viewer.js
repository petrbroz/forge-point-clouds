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

function listModels() {
    return fetch('/api/models').then(resp => resp.json());
}

function loadModel(app, urn) {
    return new Promise(function(resolve, reject) {
        function onSuccess() { resolve(app.bubble.search({ type: 'geometry' })); }
        function onFailure() { reject('Could not load document'); }
        app.loadDocument('urn:' + urn, onSuccess, onFailure);
    });
}

function loadViewable(app, viewable) {
    return new Promise(function(resolve, reject) {
        function onSuccess() { resolve(); }
        function onFailure() { reject('Could not load viewable'); }
        app.selectItem(viewable.data, onSuccess, onFailure);
    });
}
