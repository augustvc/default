var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    roomPathfinder.setPath(creep, new RoomPosition(14, 10, creep.room.name), 0);
    //roomPathfinder.abortPath(creep);
}