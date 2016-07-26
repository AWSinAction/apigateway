'use strict';

const todo = require('./todo.js');

function cbw(cb) {
  return function(err, res) {
    if (err) {
      cb(err);
    } else {
      if (typeof res === 'object' && res.hasOwnProperty('body')) {
        cb(null, res.body);
      } else {
        cb(null, {});
      }
    }
  };
}

module.exports.getUsers = (event, context, cb) => todo.getUsers({
  parameters: {
    limit: event.query.limit,
    next: event.query.next
  }
}, cbw(cb));

module.exports.postUser = (event, context, cb) => todo.postUser({
  body: event.body
}, cbw(cb));

module.exports.getUser = (event, context, cb) => todo.getUser({
  parameters: {
    userId: event.path.userId
  }
}, cbw(cb));

module.exports.deleteUser = (event, context, cb) => todo.deleteUser({
  parameters: {
    userId: event.path.userId
  }
}, cbw(cb));

module.exports.getTasks = (event, context, cb) => todo.getTasks({
  parameters: {
    userId: event.path.userId,
    limit: event.query.limit,
    next: event.query.next,
    overdue: event.query.overdue,
    due: event.query.due,
    withoutdue: event.query.withoutdue,
    futuredue: event.query.futuredue,
    dueafter: event.query.dueafter,
    duebefore: event.query.duebefore,
    category: event.query.category
  }
}, cbw(cb));

module.exports.postTask = (event, context, cb) => todo.postTask({
  parameters: {
    userId: event.path.userId
  },
  body: event.body
}, cbw(cb));

module.exports.putTask = (event, context, cb) => todo.putTask({
  parameters: {
    userId: event.path.userId,
    taskId: event.path.taskId
  }
}, cbw(cb));

module.exports.deleteTask = (event, context, cb) => todo.deleteTask({
  parameters: {
    userId: event.path.userId,
    taskId: event.path.taskId
  }
}, cbw(cb));

module.exports.getTasksByCategory = (event, context, cb) => todo.getTasksByCategory({
  parameters: {
    category: event.path.category,

    limit: event.query.limit,
    next: event.query.next,
    overdue: event.query.overdue,
    due: event.query.due,
    withoutdue: event.query.withoutdue,
    futuredue: event.query.futuredue,
    dueafter: event.query.dueafter,
    duebefore: event.query.duebefore
  }
}, cbw(cb));