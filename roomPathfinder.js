module.exports = {
    setPath: function(creep, posA, posB) {
        if(posA.roomName != posB.roomName) {
            console.log("posA and posB rooms differ!");
            return;
        }
    }
}

var findPath = function(creep, posA, posB) {
    var unusedCarry = Math.floor(creep.store.getFreeCapacity(RESOURCE_ENERGY) / 50);
    var weight = creep.body.length;
    weight -= unusedCarry;
    weight -= creep.getActiveBodyparts(MOVE);
    var movemint = creep.getActiveBodyparts(MOVE) * 2;

    //Roads: weight counts once. Plains: weight counts twice. Swamp: weight counts ten times.
    var roadTicks = Math.ceil(weight / movemint);
    var plainTicks = Math.ceil((2 * weight) / movemint);
    var swampTicks = Math.ceil((10 * weight) / movemint);
    
    console.log("Road ticks: " + roadTicks);
    console.log("Plain ticks: " + plainTicks);
    console.log("Swamp ticks: " + swampTicks);
    
    
    

    var nextNodes = {};
    nextNodes[Game.time] = posA;
    
    var expanded = new Set();

    var time = Game.time;
    return;
    while(Object.keys(nextNodes).length > 0) {
    }
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