'use strict';

const todo = require('./todo.js');

module.exports.getUsers = (event, context, cb) => todo.getUsers(event, cb);

