module.exports = {
    setPath: function(creep, posB, range) {
        var posA = creep.pos;
        if(creep.fatigue > 0 || creep.spawning) {
            return;
        }
        if(posA.roomName != posB.roomName) {
            console.log("posA and posB rooms differ!");
            return;
        }
        if(!creep.memory.path || creep.memory.path.length < 2) {
            creep.say("CALC");
            creep.memory.path = findPath(creep, posA, posB, range);
            var path = creep.memory.path;
            var roomName = posB.roomName;
            for(var pid = 0; pid < creep.memory.path.length - 1; pid++) {
                for(var tick = path[pid][1]; tick < path[pid+1][1]; tick++) {
                    Game.rooms[roomName].memory.occupied[tick][path[pid+1][2]] = null;
                }
                console.log("tile: " + path[pid]);
            }
        } else {
            creep.say("alreadypath");
        }
    },

    computeWalkable: function(roomName) {
        if(!Game.rooms[roomName]) {
            console.log("No vision of room " + roomName);
            return;
        }
        for(var x = 0; x < 50; x++) {
            for(var y = 0; y < 50; y++) {
                setWalkCosts(x, y, roomName);
            }
        }
    },

    abortPath: function(creep) {
        removePath(creep.memory.path, creep.room.name);
        creep.memory.path = [];
    },

    tick: function(tick) {
        //TODO: If a creep has no path for some reason, but the spot he is standing in is reserved for the current tick
        //move off the tile, to a non-reserved tile, to make space for other creeps.

        for(let roomName in Game.rooms) {
            if(!initialized.has(roomName)) {
                initialize(roomName);
            }
            if(Game.rooms[roomName].memory.occupied[tick-1]) {
                delete Game.rooms[roomName].memory.occupied[tick-1];
            }
            Game.rooms[roomName].memory.occupied[tick+300] = {};
        }
        
        for(var creepName in Game.creeps) {
            var creep = Game.creeps[creepName];
            if(creep.memory.path.length > 1) {
                if(creep.pos.x + 50*creep.pos.y != creep.memory.path[0][2]) {
                    creep.say("failed");
                    console.log(creep.name + " failed.. ");
                    removePath(creep.memory.path, creep.room.name);
                    creep.memory.path = [];
                    continue;
                }
                if(Game.time == creep.memory.path[0][1]) {
                    var mov = creep.memory.path.shift()[0];
                    creep.move(mov);
                    creep.say("yay");
                }
                else if(Game.time > creep.memory.path[0][1]) {
                    creep.say("OOPS");
                    removePath(creep.memory.path, creep.room.name);
                    creep.memory.path = [];
                }
            } else if(creep.memory.path.length < 1) {
                var roomName = creep.room.name;
                if((creep.pos.x + 50*creep.pos.y) in Game.rooms[roomName].memory.occupied[Game.time]) {
                    creep.say("unblock");
                    if(creep.fatigue == 0) {
                        var neighbours = getWalkableNeighbours(creep.pos.x, creep.pos.y, creep.pos.roomName);
                        for(var i = 0; i < neighbours.length; i+=3) {
                            var nbx = neighbours[i];
                            var nby = neighbours[i+1];
                            var nbc = neighbours[i + 2];

                            var duration = creep.memory.roadTicks;
                            if(nbc == 2) {
                                duration = creep.memory.plainTicks;
                            } else if(nbc == 3) {
                                duration = creep.memory.swampTicks;
                            }
                            var open = true;
                            for(var time = Game.time; time < Game.time + duration; time++) {
                                if((nbx + 50*nby) in Game.rooms[roomName].memory.occupied[time]) {
                                    open = false;
                                }
                            }
                            if(open) {
                                creep.move(getStep(creep.pos.x, creep.pos.y, nbx, nby));
                                break;
                            }
                        }
                    }
                    continue;
                }
            }
        }
    },

    processMovementCosts: function(creepName) {
        if(!Game.creeps[creepName]) {
            return;
        }
        var creep = Game.creeps[creepName];
        //Todo: Problems are boosted parts aren't processed, and creep.body.length may not be the base weight because of dead parts.
        var unusedCarry = Math.floor(creep.store.getFreeCapacity(RESOURCE_ENERGY) / 50);
        var weight = creep.body.length;
        weight -= unusedCarry;
        weight -= creep.getActiveBodyparts(MOVE);
        var movemint = creep.getActiveBodyparts(MOVE) * 2;

        //Roads: weight counts once. Plains: weight counts twice. Swamp: weight counts ten times.
        creep.memory.roadTicks = Math.max(1, Math.ceil(weight / movemint));
        creep.memory.plainTicks = Math.max(1, Math.ceil((2 * weight) / movemint));
        creep.memory.swampTicks = Math.max(1, Math.ceil((10 * weight) / movemint));
    }
}

var removePath = function(path, roomName) {
    console.log("removing path");
    for(var pid = 0; pid < path.length - 1; pid++) {
        for(var tick = path[pid][1]; tick < path[pid+1][1]; tick++) {
            if(tick >= Game.time) {
                if(Game.rooms[roomName].memory.occupied[tick][path[pid+1][2]]) {
                    delete(Game.rooms[roomName].memory.occupied[tick][path[pid+1][2]]);
                }
            }
        }
    }
}

var initialized = new Set();

var initialize = function(roomName) {
    module.exports.computeWalkable(roomName);
    var room = Game.rooms[roomName];
    room.memory.occupied = {};
    for(var i = Game.time; i < Game.time + 300; i++) {
        room.memory.occupied[i] = {};
    }
    
    var creeps = room.find(FIND_MY_CREEPS);
    for(var creepName in creeps) {
        creeps[creepName].memory.path = [];
    }

    initialized.add(roomName);
}

var findPath = function(creep, posA, posB, range) {
    if(Math.max(Math.abs(posA.x - posB.x), Math.abs(posA.y - posB.y)) <= range) {
        return [];
    }

    var roomName = posA.roomName;
    if(!initialized.has(roomName)) {
        initialize(roomName);
    }

    //Roads: weight counts once. Plains: weight counts twice. Swamp: weight counts ten times.
    var roadTicks = creep.memory.roadTicks;
    var plainTicks = creep.memory.plainTicks;
    var swampTicks = creep.memory.swampTicks;
    
    var relativeTime = 0;
    var time = Game.time;

    /*Nextnodes is an array containing many arrays. One array per tick, so that we can
    expand nodes ordered on which tick we can get there. It has the x, y positions of each
    tile that can be reached, stored within the corresponding tick's array.*/
    var nextNodes = [];
    nextNodes[relativeTime] = [posA.x, posA.y];    
    
    var expanded = {};
    expanded[posA.x+50*posA.y] = [posA.x + 50*posA.y, -1];
        
    var maxTime = 300;
    for(var i = 1; i < maxTime; i++) {
        nextNodes[i] = [];
    }

    var loopsDone = 0;

    var goalX = posB.x;
    var goalY = posB.y;

    //TODO: ensure that a path can still be found if the goal node is occupied at the time of potential arrival.
    //the easiest method to probably do this is if any node is occupied when the creep would expand there,
    // just see at what time that node is free, and if it is possible to schedule standing still and waiting until it is free.

    while(Object.keys(nextNodes).length > 0 && ((time - Game.time) < (maxTime - creep.memory.swampTicks))) {
        var possiblePositions = nextNodes[relativeTime];

        for(var i = 0; i < possiblePositions.length; i+=2) {
            var x = possiblePositions[i];
            var y = possiblePositions[i+1];

            var rangeToGoal = Math.max(Math.abs(x - posB.x), Math.abs(y - posB.y));
            if(x == 10 && y == 8) {
                console.log(rangeToGoal);
                console.log(range);
            }

            if(rangeToGoal <= range) {
                var reversePath = [];
                var tile = x + 50*y;
                var posAnr = posA.x + 50*posA.y;
                while(tile != posAnr) {
                    reversePath.push(tile);
                    tile = expanded[tile][0];
                }
                reversePath.push(posAnr);

                var steps = [];
                for(var j = reversePath.length - 1; j >= 1; j--) {
                    var dir = getStep(reversePath[j]%50, Math.floor(reversePath[j]/50),
                    reversePath[j-1]%50, Math.floor(reversePath[j-1]/50));
                    
                    /*Dir is the direction that you'd move in when going from j to j-1.
                    We also add j's location to the steps so that we can check if the creep is in the correct position
                    whenever it tries to set a step.*/
                    steps.push([dir, Game.time + expanded[reversePath[j-1]][1], reversePath[j]]);
                }
                steps.push([0, time, x + 50*y]);
                console.log("Found a path to " + x + ", " + y + " with duration: " + (time - Game.time) + " after " + loopsDone + " loops.");

                return steps;
            }

            var neighbours = getWalkableNeighbours(x, y, roomName);
            for(var j = 0; j < neighbours.length; j+=3) {
                loopsDone++;

                var ticks = roadTicks;
                if(neighbours[j+2] == 2) {
                    ticks = plainTicks;
                } else if(neighbours[j + 2] == 3) {
                    ticks = swampTicks;
                }
                
                var neighbour = neighbours[j] + 50*neighbours[j+1];
                if(neighbour in expanded && (relativeTime + ticks >= expanded[neighbour][1])) {
                    continue;
                }

                var occupied = false;
                for(var tick = time; tick < time + ticks; tick++) {
                    //Check if this neighbour is open at "tick". If not, set occupied to true and break this loop.
                    if(neighbour in Game.rooms[roomName].memory.occupied[tick]) {
                        occupied = true;
                        break;
                    }
                }
                if(occupied) {
                    continue;
                }

                //Every node has as 2nd value in the array the ticknumber (which needs to be added to Game.time) at which 
                //the creep is supposed to arrive there.
                expanded[neighbour] = [x+50*y, relativeTime];

                nextNodes[relativeTime + ticks].push(neighbours[j]);
                nextNodes[relativeTime + ticks].push(neighbours[j+1]);
            }
        }

        delete(nextNodes[relativeTime]);
        time++;
        relativeTime++;
    }

    console.log("Couldn't find a path from " + String(posA) + " to " + String(posB) + " after " + loopsDone + " loops.");
    return [];
}

var getStep = function(x1, y1, x2, y2) {
    if(x2 < x1) {
        //left
        if(y2 < y1) {
            return TOP_LEFT;
        } else if(y2 == y1) {
            return LEFT;
        }
        return BOTTOM_LEFT;
    } else if(x2 == x1) {
        //middle
        if(y2 < y1) {
            return TOP;
        } else if(y2 == y1) {
            return 0;
        }
        return BOTTOM;
    }
    //right    
    if(y2 < y1) {
        return TOP_RIGHT;
    } else if(y2 == y1) {
        return RIGHT;
    }
    return BOTTOM_RIGHT;
}

var getWalkableNeighbours = function(posx, posy, roomName) {
    var neighbours = [];

    for(var x = posx - 1; x <= posx + 1; x++) {
        for(var y = posy - 1; y <= posy + 1; y++) {
            if(x == posx && y == posy) {
                continue;
            }
            var cost = getWalkCost(x, y, roomName);
            if(cost != 0) {
                neighbours.push(x);
                neighbours.push(y);
                neighbours.push(cost);
            }
        }
    }
    return neighbours;
}

var getWalkCost = function(x, y, roomName) {
    return Game.rooms[roomName].memory[x+50*y];
}

var setWalkCosts = function(x, y, roomName) {
    var objects = new RoomPosition(x, y, roomName).look();
    var walkable = true;
    var road = false;
    var swamp = false;
    for(var i = 0; i < objects.length; i++) {
        var object = objects[i];
        if(object.type == "terrain") {
            if(object.terrain == "wall") {
                walkable = false;
            } else if(object.terrain == "swamp") {
                swamp = true;
            }
        }
        else if(object.type == "structure") {
            switch(object.structure.structureType) {
                case STRUCTURE_ROAD:
                    road = true;
                    break;
                case STRUCTURE_RAMPART:
                    break;
                default:
                    Game.rooms[roomName].memory[x+50*y] = 0;
                    return;
            }
        }
    }
    var outOfBounds = x < 1 || x >= 49 || y < 1 || y >= 49;
    var result = 0; // 0 is unwalkable
    if ((!outOfBounds) && (walkable || road)) {
        if(road) {
            result = 1; // 1 = road
        } else if(swamp) {
            result = 3; // 3 = swamp
        } else {
            result = 2; // 2 = plains
        }
    }
    Game.rooms[roomName].memory[x+50*y] = result;
}