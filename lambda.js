var todo = require("./todo.js");

exports.handler = function(event, context, cb) {
  todo[event.fun](event, cb);
};
