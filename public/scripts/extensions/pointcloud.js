const PointSize = 0.1;

class PointCloudExtension extends Autodesk.Viewing.Extension {
    load() {
        this.points = this._generatePointCloud(1000000);
        //this.points.scale.set(100.0, 100.0, 100.0);
        this.viewer.impl.createOverlayScene('pointclouds');
        this.viewer.impl.addOverlay('pointclouds', this.points);

        this.client = new PointCloudStreamClient('ws://localhost:3001');
        this.client.connect()
            .then(() => {
                console.log('Point cloud client connected');
                this.startStreaming();
            })
            .catch((err) => {
                console.error('Point cloud client could not connect', err);
            });
        return true;
    }

    unload() {
        return true;
    }

    startStreaming() {
        let counter = 0;
        setInterval(() => {
            const x = counter % 20;
            const y = Math.floor((counter % 400) / 20);
            const bbox = {
                min: { x: (x - 10) * 10, y: (y - 10) * 10, z: 0 },
                max: { x: (x - 9) * 10, y: (y - 9) * 10, z: 10 }
            };
            const offset = (counter % 100) * 10000;
            this.client.query(bbox, (data) => {
                console.log('Point cloud client received data', data);
                this._updatePointCloud(data, offset);
                this.viewer.impl.invalidate(true, true, true);
            });
            counter = counter + 1;
        }, 500);
    }

    _generatePointCloud(numPoints) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(numPoints * 3);
        positions.fill(0.0);
        const colors = new Float32Array(numPoints * 3);
        colors.fill(1.0);
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingBox();
        geometry.isPoints = true; // This flag will force Forge Viewer to render the geometry as gl.POINTS
        // https://github.com/mrdoob/three.js/blob/r71/src/materials/PointCloudMaterial.js
        const material = new THREE.PointCloudMaterial({ size: PointSize, vertexColors: THREE.VertexColors });
        // https://github.com/mrdoob/three.js/blob/r71/src/objects/PointCloud.js
        return new THREE.PointCloud(geometry, material);
    }

    _updatePointCloud(data, offset = 0) {
        const geometry = this.points.geometry;
        const positionAttr = geometry.attributes.position;
        positionAttr.array.set(data, offset * 3);
        positionAttr.needsUpdate = true;
        geometry.computeBoundingBox();
    }
}

class PointCloudStreamClient {
    constructor(url) {
        this.url = url;
        this.connection = null;
        this.counter = 0;
        this.callbacks = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.connection = new WebSocket(this.url);
            this.connection.binaryType = 'arraybuffer';
            this.connection.onopen = function(ev) {
                console.log('Client connection open');
                resolve(ev);
            };
            this.connection.onclose = function(ev) {
                console.log('Client connection closed');
            };
            this.connection.onerror = function(ev) {
                console.log('Client connection error');
                reject(ev);
            };
            this.connection.onmessage = (ev) => {
                console.log('Client received message', ev.data);
                this._recv(ev.data);
            };
        });
    }

    query(bbox, callback) {
        const queryId = this.counter++;
        this._send(queryId, bbox);
        this.callbacks.set(queryId, callback);
    }

    _send(queryId, bbox) {
        const buff = new ArrayBuffer(7 * 4);
        const uints = new Uint32Array(buff);
        uints[0] = queryId;
        const floats = new Float32Array(buff, 4, 6);
        floats[0] = bbox.min.x;
        floats[1] = bbox.min.y;
        floats[2] = bbox.min.z;
        floats[3] = bbox.max.x;
        floats[4] = bbox.max.y;
        floats[5] = bbox.max.z;
        // Send a query ID (uint32) followed by bounding box min x/y/z and max x/y/z (all floats)
        this.connection.send(buff);
    }

    _recv(buff) {
        const uints = new Uint32Array(buff, 0, 2);
        const queryId = uints[0];
        const count = uints[1];
        if (this.callbacks.has(queryId)) {
            const callback = this.callbacks.get(queryId);
            callback(new Float32Array(buff, 8, count));
            this.callbacks.delete(queryId);
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PointCloudExtension', PointCloudExtension);
