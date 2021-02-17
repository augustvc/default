var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    roomPathfinder.setPath(creep, creep.pos, new RoomPosition(16, 4, creep.room.name), 1);
    //roomPathfinder.setPath(creep, creep.pos, new RoomPosition(21, 3, "W8N4"));
}