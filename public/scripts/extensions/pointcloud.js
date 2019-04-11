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
                resolve();
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
                const uints = new Uint32Array(ev.data);
                const queryId = uints[0];
                if (this.callbacks.has(queryId)) {
                    const callback = this.callbacks.get(queryId);
                    callback(new Float32Array(ev.data, 4));
                    this.callbacks.delete(queryId);
                }
            };
        });
    }

    query(bbox) {
        const queryId = this.counter++;
        const buff = new ArrayBuffer(7 * 4);
        const uints = new Uint32Array(buff);
        uints[0] = queryId;
        const floats = new Float32Array(buff);
        floats[1] = bbox.min.x;
        floats[2] = bbox.min.y;
        floats[3] = bbox.min.z;
        floats[4] = bbox.max.x;
        floats[5] = bbox.max.y;
        floats[6] = bbox.max.z;
        // Send a query ID (uint32) followed by bounding box min x/y/z and max x/y/z (float32s)
        this.connection.send(buff);
        return new Promise((resolve, reject) => {
            this.callbacks.set(queryId, function(data) {
                resolve(data);
            });
        });
    }
}

const PointSize = 0.1;

class PointCloudExtension extends Autodesk.Viewing.Extension {
    load() {
        this.points = this._generatePointCloud(1000, 1000);
        this.points.scale.set(50.0, 50.0, 50.0);
        this.viewer.impl.createOverlayScene('pointclouds');
        this.viewer.impl.addOverlay('pointclouds', this.points);
        return true;
    }

    unload() {
        return true;
    }

    _generatePointCloudGeometry(width, length) {
        let geometry = new THREE.BufferGeometry();
        let numPoints = width * length;
        let positions = new Float32Array(numPoints * 3);
        let colors = new Float32Array(numPoints * 3);
        let color = new THREE.Color();
        let k = 0;
        for (var i = 0; i < width; i++) {
            for (var j = 0; j < length; j++) {
                const u = i / width;
                const v = j / length;
                positions[3 * k] = u - 0.5;
                positions[3 * k + 1] = v - 0.5;
                positions[3 * k + 2] = (Math.cos(u * Math.PI * 8) + Math.sin(v * Math.PI * 8)) / 20;
                color.setHSL(u, v, 0.5);
                colors[3 * k] = color.r;
                colors[3 * k + 1] = color.g;
                colors[3 * k + 2] = color.b;
                k++;
            }
        }
        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeBoundingBox();
        geometry.isPoints = true; // This flag will force Forge Viewer to render the geometry as gl.POINTS
        return geometry;
    }

    _generatePointCloud(width, length) {
        const geometry = this._generatePointCloudGeometry(width, length);
        const material = new THREE.PointCloudMaterial({ size: PointSize, vertexColors: THREE.VertexColors });
        return new THREE.PointCloud(geometry, material);
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('PointCloudExtension', PointCloudExtension);
