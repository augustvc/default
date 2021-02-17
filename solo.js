var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    creep.moveTo(new RoomPosition(1, 14, "W8N4"));
    roomPathfinder.setPath(creep, creep.pos, new RoomPosition(48, 6, "W8N4"));
    //roomPathfinder.setPath(creep, creep.pos, new RoomPosition(21, 3, "W8N4"));
}