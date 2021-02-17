module.exports = {
    setPath: function(creep, posA, posB) {
        if(posA.roomName != posB.roomName) {
            console.log("posA and posB rooms differ!");
            return;
        }
    }

}

var findPath = function(posA, posB) {

}

var getWalkableNeighbours = function(pos) {
    var neighbours = [];
    for(var x = pos.x - 1; x <= pos.x + 1; x++) {
        for(var y = pos.y - 1; y <= pos.y + 1; y++) {
            if(x == pos.x && y == pos.y) {
                continue;
            }
            if(x < 1 || x >= 49 || y < 1 || y >= 49) {
                continue;
            }
            var roomPos = new RoomPosition(x, y, pos.roomName);
            if(isWalkable(roomPos)) {
                neighbours.add(roomPos);
            }
        }
    }
}

var isWalkable = function(pos) {
    var objects = pos.look();
    var walkable = true;
    var road = false;
    for(var i = 0; i < objects.length; i++) {
        var object = objects[i];
        if(object.type == "terrain" && object.terrain == "wall") {
            walkable = false;
        }
        else if(object.type == "structure") {
            switch(object.structure.structureType) {
                case STRUCTURE_ROAD:
                    road = true;
                    break;
                case STRUCTURE_RAMPART:
                    break;
                default:
                    return false;
            }
        }
    }
    return walkable || road;
}