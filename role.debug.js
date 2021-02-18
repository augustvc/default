var roomPathfinder = require("roomPathfinder");

module.exports.run = function(creep) {
    roomPathfinder.setPath(creep, new RoomPosition(18, 10, creep.room.name), 0);
}