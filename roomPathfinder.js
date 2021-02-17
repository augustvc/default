module.exports = {
    setPath: function(creep, posA, posB) {
        if(posA.roomName != posB.roomName) {
            console.log("posA and posB rooms differ!");
            return;
        }
        findPath(creep, posA, posB);
    },

    computeWalkable: function(roomName) {
        if(!Game.rooms[roomName]) {
            console.log("No vision of room " + roomName);
            return;
        }
        for(var x = 0; x < 50; x++) {
            for(var y = 0; y < 50; y++) {
                setWalkable(x, y, roomName);
            }
        }
    },

    tick: function(tick) {
        for(let roomName in Game.rooms) {
            if(!initialized.has(roomName)) {
                initialize(roomName);
            }
            if(Game.rooms[roomName].memory.occupied[tick]) {
                delete Game.rooms[roomName].memory.occupied[tick];
            }
            Game.rooms[roomName].memory.occupied[tick+300] = {};
        }
    }
}

var initialized = new Set();

var initialize = function(roomName) {
    module.exports.computeWalkable(roomName);
    Game.rooms[roomName].memory.occupied = {};
    for(var i = Game.time; i < Game.time + 300; i++) {
        Game.rooms[roomName].memory.occupied[i] = {};
    }
    
    initialized.add(roomName);
}

var findPath = function(creep, posA, posB) {
    var roomName = posA.roomName;
    if(!initialized.has(roomName)) {
        initialize(roomName);
    }

    //Todo: Problems are boosted parts aren't processed, and creep.body.length may not be the base weight because of dead parts.
    var unusedCarry = Math.floor(creep.store.getFreeCapacity(RESOURCE_ENERGY) / 50);
    var weight = creep.body.length;
    weight -= unusedCarry;
    weight -= creep.getActiveBodyparts(MOVE);
    var movemint = creep.getActiveBodyparts(MOVE) * 2;

    //Roads: weight counts once. Plains: weight counts twice. Swamp: weight counts ten times.
    var roadTicks = Math.ceil(weight / movemint);
    var plainTicks = Math.ceil((2 * weight) / movemint);
    var swampTicks = Math.ceil((10 * weight) / movemint);

    var relativeTime = 0;

    var nextNodes = [];
    nextNodes[relativeTime] = [posA.x, posA.y];
    
    var expanded = {};

    var time = Game.time;

    var maxTime = 300;
    for(var i = 1; i < maxTime; i++) {
        nextNodes[i] = [];
    }

    var loopsDone = 0;

    var goalX = posB.x;
    var goalY = posB.y;

    while(Object.keys(nextNodes).length > 0 && (time - Game.time) < maxTime) {
        var possiblePositions = nextNodes[relativeTime];

        for(var i = 0; i < possiblePositions.length; i+=2) {
            var x = possiblePositions[i];
            var y = possiblePositions[i+1];

            if(x == posB.x && y == posB.y) {
                console.log("Found a path with duration: " + (time - Game.time));
                console.log("Loops done: " + loopsDone);
                
                var reversePath = [];
                var tile = posB.x + 50*posB.y;
                var posAnr = posA.x + 50*posA.y;
                while(tile != posAnr) {
                    reversePath.push(tile);
                    tile = expanded[tile][0];
                }
                for(var j = reversePath.length - 1; j >= 0; j--) {
                    console.log("Step: " + reversePath[j]%50 + ", " + (Math.floor(reversePath[j]/50)));
                }
                return;
            }

            var neighbours = getWalkableNeighbours(x, y, roomName);
            for(var j = 0; j < neighbours.length; j+=2) {
                loopsDone++;
                var ticks = 1; //Todo: Adapt this based on what terrain the creep would have to walk on.

                var neighbour = neighbours[j] + 50*neighbours[j+1];
                if(neighbour in expanded && (relativeTime + ticks >= expanded[neighbour][1])) {
                    continue;
                }

                var occupied = false;
                for(var tick = time + 1; tick <= time + ticks; tick++) {
                    //Check if this neighbour is open at "tick". If not, set occupied to true and break this loop.
                    if(neighbour in Game.rooms[roomName].memory.occupied[tick]) {
                        occupied = true;
                        break;
                    }
                }
                if(occupied) {
                    continue;
                }

                expanded[neighbour] = [x+50*y, relativeTime+ticks];

                nextNodes[relativeTime + ticks].push(neighbours[j]);
                nextNodes[relativeTime + ticks].push(neighbours[j+1]);
            }
        }

        delete(nextNodes[relativeTime]);
        time++;
        relativeTime++;
    }

    console.log("Couldn't find a path from " + String(posA) + " to " + String(posB));
}

var getWalkableNeighbours = function(posx, posy, roomName) {
    var neighbours = [];

    for(var x = posx - 1; x <= posx + 1; x++) {
        for(var y = posy - 1; y <= posy + 1; y++) {
            if(x == posx && y == posy) {
                continue;
            }
            if(isWalkable(x, y, roomName)) {
                neighbours.push(x);
                neighbours.push(y);
            }
        }
    }
    return neighbours;
}

var isWalkable = function(x, y, roomName) {
    return Game.rooms[roomName].memory[x+50*y];
}

var setWalkable = function(x, y, roomName) {
    var objects = new RoomPosition(x, y, roomName).look();
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
    var outOfBounds = x < 1 || x >= 49 || y < 1 || y >= 49;
    var result = (!outOfBounds) && (walkable || road);
    Game.rooms[roomName].memory[x+50*y] = result;
}