const PointsPerResponse = 10000;

function deserializeQuery(srcBuff) {
    const id = srcBuff.readUInt32LE(0),
        x1 = srcBuff.readFloatLE(4),
        y1 = srcBuff.readFloatLE(8),
        z1 = srcBuff.readFloatLE(12),
        x2 = srcBuff.readFloatLE(16),
        y2 = srcBuff.readFloatLE(20),
        z2 = srcBuff.readFloatLE(24);
    return {
        id,
        min: { x: x1, y: y1, z: z1 },
        max: { x: x2, y: y2, z: z2 }
    };
}

function serializeResponse(id, points, dstBuff) {
    let offset = 0;
    dstBuff.writeUInt32LE(id, offset); offset += 4;
    dstBuff.writeUInt32LE(points.length, offset); offset += 4;
    for (const point of points) {
        dstBuff.writeFloatLE(point.x, offset); offset += 4;
        dstBuff.writeFloatLE(point.y, offset); offset += 4;
        dstBuff.writeFloatLE(point.z, offset); offset += 4;
    }
    return offset;
}

module.exports = function(connection) {
    const tmpPoints = new Array(PointsPerResponse);
    for (let i = 0; i < PointsPerResponse; i++) tmpPoints[i] = { x: 0, y: 0, z: 0 };
    const tmpBuff = Buffer.alloc(4 + 4 + PointsPerResponse * 3 * 4);

    connection.on('message', function(buff) {
        const query = deserializeQuery(buff);
        console.log('Server received query', query);
        for (const point of tmpPoints) {
            point.x = query.min.x + Math.random() * (query.max.x - query.min.x);
            point.y = query.min.y + Math.random() * (query.max.y - query.min.y);
            //point.z = query.min.z + Math.random() * (query.max.z - query.min.z);
            point.z = query.min.z + (query.max.z - query.min.z) * 0.5 * (1 + Math.cos(0.1 * point.x) * Math.sin(0.1 * point.y));
        }
        tmpBuff.fill(0);
        serializeResponse(query.id, tmpPoints, tmpBuff);
        connection.send(tmpBuff);
        console.log('Server responded to query', query.id);
    })
};
