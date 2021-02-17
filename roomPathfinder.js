module.exports = {
    setPath: function(creep, posA, posB, range) {
        if(creep.fatigue > 0 || creep.spawning) {
            return;
        }
        if(posA.roomName != posB.roomName) {
            console.log("posA and posB rooms differ!");
            return;
        }
        if(!creep.memory.path || creep.memory.path.length < 1) {
            creep.say("CALC");
            creep.memory.path = findPath(creep, posA, posB, range);
            for(var pid in creep.memory.path) {
                //TODO: SET NODE TO OCCUPIED (at the correct time)
            }
        } else {
            creep.say("PATHFULL");
        }
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
            Game.rooms[roomName].memory.occupied[tick+1500] = {};
        }

        for(let creepName in Game.creeps) {
            var creep = Game.creeps[creepName];
            if(creep.memory.path.length > 0) {
                //TODO: ADD SOME CHECK TO SEE IF THE CREEP IS CURRENTLY IN THE RIGHT SPOT ON THE PATH
                //AKA he didn't fail a move without knowing so!
                if(creep.pos.x + 50*creep.pos.y != creep.memory.path[0][2]) {
                    creep.say("failed");
                    console.log("Failed.. ");
                    console.log("pos: " + creep.pos.x + 50*creep.pos.y);
                    console.log("mempos: " + creep.memory.path[0][2]);
                    creep.memory.path = [];
                    continue;
                }
                if(Game.time == creep.memory.path[0][1]) {
                    var mov = creep.memory.path.shift()[0];
                    creep.move(mov);
                }
                else if(Game.time > creep.memory.path[0][1]) {
                    console.log("removing path");
                    creep.say("OOPS");
                    creep.memory.path = [];
                }
            }
        }
    }
}

var initialized = new Set();

var initialize = function(roomName) {
    module.exports.computeWalkable(roomName);
    Game.rooms[roomName].memory.occupied = {};
    for(var i = Game.time; i < Game.time + 1500; i++) {
        Game.rooms[roomName].memory.occupied[i] = {};
    }
    
    initialized.add(roomName);
}

var findPath = function(creep, posA, posB, range) {
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
    var time = Game.time;

    /*Nextnodes is an array containing many arrays. One array per tick, so that we can
    expand nodes ordered on which tick we can get there. It has the x, y positions of each
    tile that can be reached, stored within the corresponding tick's array.*/
    var nextNodes = [];
    nextNodes[relativeTime] = [posA.x, posA.y];
    
    //TODO: Right now we pretend everything costs 1, so it is impossible to find slower paths
    //But I wonder if it is possible with different costs to get suboptimal results if just finding a node blocks
    //it from being found by other tiles. Maybe if the added cost of visiting that node from a neighbour is considered to be
    //equal to the terrain cost on itself, rather than the neighbour's terrain cost, it would all be OK?
    //If that is so, all we'd need to worry about is not immediately finish once we get in range of the goal position. Because the last step may be overpriced!

    var expanded = {};
    expanded[posA.x+50*posA.y] = [posA.x + 50*posA.y, -1];
        
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

            var rangeToGoal = Math.max(Math.abs(x - posB.x), Math.abs(y - posB.y));

            if(rangeToGoal <= range) {
                console.log("Found a path with duration: " + (time - Game.time));
                
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

                return steps;
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

    console.log("Couldn't find a path from " + String(posA) + " to " + String(posB));
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