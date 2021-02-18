var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    roomPathfinder.setPath(creep, new RoomPosition(12, 7, creep.room.name), 0);
    //roomPathfinder.abortPath(creep);
}