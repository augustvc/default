var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    roomPathfinder.setPath(creep, creep.pos, new RoomPosition(32, 44, "W8N4"), 1);
    //roomPathfinder.setPath(creep, creep.pos, new RoomPosition(21, 3, "W8N4"));
}