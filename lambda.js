var todo = require("./todo.js");

exports.handler = function(event, context) {
  todo[event.fun](event, context);
};