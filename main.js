var roomPathfinder = require("roomPathfinder");
var builder = require("builder");
var solo = require("solo");

module.exports.loop = function() {
    //roomPathfinder.computeWalkable("W8N4");
    
    if(Object.keys(Game.creeps).length < 1) { 
        Game.spawns.Spawn1.spawnCreep([MOVE, WORK], Game.time, { memory: { role: "solo", path: [] }});
    }
    
    for(let name in Memory.creeps) {
        if(Game.creeps[name]) {
            var creep = Game.creeps[name];
            if(creep.memory.role == "builder") {
                builder.run(creep);
            }
            if(creep.memory.role == "solo") {
                solo.run(creep);
            }
        } else {
            delete(Memory.creeps[name]);
        }
    }

    roomPathfinder.tick(Game.time);
}