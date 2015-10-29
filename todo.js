var moment = require('moment');
var uuid = require('node-uuid');
var AWS = require('aws-sdk');
var db = new AWS.DynamoDB();

function getValue(attribute, type) {
  if (attribute === undefined) {
    return null;
  }
  return attribute[type];
}

function mapTaskItem(item) {
  return {
    "tid": item.tid.N,
    "description": item.description.S,
    "created": item.created.N,
    "due": getValue(item.due, 'N'),
    "category": getValue(item.category, 'S'),
    "completed": getValue(item.completed, 'N')
  };
}

function mapUserItem(item) {
  return {
    "uid": item.uid.S,
    "email": item.email.S,
    "phone": item.phone.S
  };
}

exports.getUsers = function(event, context) {
  console.log("getUsers", JSON.stringify(event));
  var params = {
    "TableName": "todo-user",
    "Limit": event.parameters.limit || 10
  };
  if (event.parameters.next) {
    params.ExclusiveStartKey = {
      "uid": {
        "S": event.parameters.next
      }
    };
  }
  db.scan(params, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      var res = {
        "body": data.Items.map(mapUserItem)
      };
      if (data.LastEvaluatedKey !== undefined) {
        res.headers = {"next": data.LastEvaluatedKey.uid.S};
      }
      context.succeed(res);
    }
  });
};

exports.postUser = function(event, context) {
  console.log("postUser", JSON.stringify(event));
  var uid = uuid.v4();
  var params = {
    "Item": {
      "uid": {
        "S": uid
      },
      "email": {
        "S": event.body.email
      },
      "phone": {
        "S": event.body.phone
      }
    },
    "TableName": "todo-user",
    "ConditionExpression": "attribute_not_exists(uid)",
    "ReturnValues": 'ALL_NEW'
  };
  db.putItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed({"headers": {"uid": uid}, "body": mapUserItem(data.Item)});
    }
  });
};

exports.getUser = function(event, context) {
  console.log("getUser", JSON.stringify(event));
  var params = {
    "Key": {
      "uid": {
        "S": event.parameters.userId
      }
    },
    "TableName": "todo-user"
  };
  db.getItem(params, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      if (data.Item) {
        context.succeed({"body": mapUserItem(data.Item)});
      } else {
        context.fail(new Error('not found'));
      }
    }
  });
};

exports.deleteUser = function(event, context) {
  console.log("deleteUser", JSON.stringify(event));
  var params = {
    "Key": {
      "uid": {
        "S": event.parameters.userId
      }
    },
    "TableName": "todo-user"
  };
  db.deleteItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed();
    }
  });
};

exports.postTask = function(event, context) {
  console.log("postTask", JSON.stringify(event));
  var tid = Date.now();
  var params = {
    "Item": {
      "uid": {
        "S": event.parameters.userId
      },
      "tid": {
        "N": tid.toString()
      },
      "description": {
        "S": event.body.description
      },
      "created": {
        "N": moment().format("YYYYMMDD")
      }
    },
    "TableName": "todo-task",
    "ConditionExpression": "attribute_not_exists(uid) and attribute_not_exists(tid)",
    "ReturnValues": 'ALL_NEW'
  };
  if (event.body.dueat) {
    params.Item.due = {
      "N": event.body.dueat
    };
  }
  if (event.body.category) {
    params.Item.category = {
      "S": event.body.category
    };
  }
  db.putItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed({"headers": {"uid": event.parameters.userId, "tid": tid}, "body": mapUserItem(data.Item)});
    }
  });
};

exports.getTasks = function(event, context) {
  console.log("getTasks", JSON.stringify(event));
  var params = {
    "KeyConditionExpression": "uid = :uid",
    "ExpressionAttributeValues": {
      ":uid": {
        "S": event.parameters.userId
      }
    },
    "TableName": "todo-task",
    "Limit": event.parameters.limit || 10
  };
  if (event.parameters.next) {
    params.KeyConditionExpression += ' AND tid > :next';
    params.ExpressionAttributeValues[':next'] = {
      "N": event.parameters.next
    };
  }
  if (event.parameters.overdue) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.due) {
    params.FilterExpression = "due = :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.withoutdue) {
    params.FilterExpression = "attribute_not_exists(due)";
  } else if (event.parameters.futuredue) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.dueafter) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": event.parameters.dueafter};
  } else if (event.parameters.duebefore) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": event.parameters.duebefore};
  }
  if (event.parameters.category) {
    if (params.FilterExpression === undefined) {
      params.FilterExpression = '';
    } else {
      params.FilterExpression += ' AND ';
    }
    params.FilterExpression += 'category = :category';
    params.ExpressionAttributeValues[':category'] = {
      "S": event.parameters.category
    };
  }
  db.query(params, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      var res = {
        "body": data.Items.map(mapTaskItem)
      };
      if (data.LastEvaluatedKey !== undefined) {
        res.headers = {"next": data.LastEvaluatedKey.tid.N};
      }
      context.succeed(res);
    }
  });
};

exports.deleteTask = function(event, context) {
  console.log("deleteTask", JSON.stringify(event));
  var params = {
    "Key": {
      "uid": {
        "S": event.parameters.userId
      },
      "tid": {
        "N": event.parameters.taskId
      }
    },
    "TableName": "todo-task"
  };
  db.deleteItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed();
    }
  });
};

exports.putTask = function(event, context) {
  console.log("putTask", JSON.stringify(event));
  var params = {
    "Key": {
      "uid": {
        "S": event.parameters.userId
      },
      "tid": {
        "N": event.parameters.taskId
      }
    },
    "UpdateExpression": "SET completed = :yyyymmdd",
    "ExpressionAttributeValues": {
      ":yyyymmdd": {
        "N": moment().format("YYYYMMDD")
      }
    },
    "TableName": "todo-task"
  };
  db.updateItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed();
    }
  });
};

exports.getTasksByCategory = function(event, context) {
  console.log("getTasksByCategory", JSON.stringify(event));
  var params = {
    "KeyConditionExpression": "category = :category",
    "ExpressionAttributeValues": {
      ":category": {
        "S": event.parameters.category
      }
    },
    "TableName": "todo-task",
    "IndexName": "category-index",
    "Limit": event.parameters.limit || 10
  };
  if (event.parameters.next) {
    params.KeyConditionExpression += ' AND tid > :next';
    params.ExpressionAttributeValues[':next'] = {
      "N": event.parameters.next
    };
  }
  if (event.parameters.overdue) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.due) {
    params.FilterExpression = "due = :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.withoutdue) {
    params.FilterExpression = "attribute_not_exists(due)";
  } else if (event.parameters.futuredue) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (event.parameters.dueafter) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": event.parameters.dueafter};
  } else if (event.parameters.duebefore) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": event.parameters.duebefore};
  }
  db.query(params, function(err, data) {
    if (err) {
      context.fail(err);
    } else {
      var res = {
        "body": data.Items.map(mapTaskItem)
      };
      if (data.LastEvaluatedKey !== undefined) {
        res.headers = {"next": data.LastEvaluatedKey.tid.N};
      }
      context.succeed(res);
    }
  });
};
