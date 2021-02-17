module.exports.run = function(creep) {
    var unusedCarry = Math.floor(creep.store.getFreeCapacity(RESOURCE_ENERGY) / 50);
    creep.say(unusedCarry);

    if (creep.memory.storing && creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
        creep.memory.storing = false;
    }
    else if (!creep.memory.storing && creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
        creep.memory.storing = true;
    }
    
    if(creep.memory.storing) {
        var target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            
        if(target){ 
            if(creep.build(target) == ERR_NOT_IN_RANGE){
                creep.moveTo(target);
                creep.say("mov");
            }
            return;
        }
    } else {
        var src = creep.room.find(FIND_SOURCES);
        if(creep.harvest(src[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(src[0]);
        }
    }
}