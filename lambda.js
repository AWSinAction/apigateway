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
    "ConditionExpression": "attribute_not_exists(uid)"
  };
  db.putItem(params, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed({"headers": {"uid": uid}});
    }
  });
};

exports.getUser = function(event, context) {
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

/*
if (input['task-add'] === true) {
  var tid = Date.now();
  var params = {
    "Item": {
      "uid": {
        "S": input['<uid>']
      },
      "tid": {
        "N": tid.toString()
      },
      "description": {
        "S": input['<description>']
      },
      "created": {
        "N": moment().format("YYYYMMDD")
      }
    },
    "TableName": "todo-task",
    "ConditionExpression": "attribute_not_exists(uid) and attribute_not_exists(tid)"
  };
  if (input['--dueat'] !== null) {
    params.Item.due = {
      "N": input['--dueat']
    };
  }
  if (input['<category>'] !== null) {
    params.Item.category = {
      "S": input['<category>']
    };
  }
  db.putItem(params, function(err) {
    if (err) {
      console.error('error', err);
    } else {
      console.log('task added with tid ' + tid);
    }
  });
} else if (input['task-rm'] === true) {
  var params = {
    "Key": {
      "uid": {
        "S": input['<uid>']
      },
      "tid": {
        "N": input['<tid>']
      }
    },
    "TableName": "todo-task"
  };
  db.deleteItem(params, function(err) {
    if (err) {
      console.error('error', err);
    } else {
      console.log('task removed with tid ' + input['<tid>']);
    }
  });
} else if (input['task-ls'] === true) {
  var params = {
    "KeyConditionExpression": "uid = :uid",
    "ExpressionAttributeValues": {
      ":uid": {
        "S": input['<uid>']
      }
    },
    "TableName": "todo-task",
    "Limit": input['--limit']
  };
  if (input['--next'] !== null) {
    params.KeyConditionExpression += ' AND tid > :next';
    params.ExpressionAttributeValues[':next'] = {
      "N": input['--next']
    };
  }
  if (input['--overdue'] === true) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--due'] === true) {
    params.FilterExpression = "due = :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--withoutdue'] === true) {
    params.FilterExpression = "attribute_not_exists(due)";
  } else if (input['--futuredue'] === true) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--dueafter'] !== null) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": input['--dueafter']};
  } else if (input['--duebefore'] !== null) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": input['--duebefore']};
  }
  if (input['<category>'] !== null) {
    if (params.FilterExpression === undefined) {
      params.FilterExpression = '';
    } else {
      params.FilterExpression += ' AND ';
    }
    params.FilterExpression += 'category = :category';
    params.ExpressionAttributeValues[':category'] = {
      "S": input['<category>']
    };
  }
  db.query(params, function(err, data) {
    if (err) {
      console.error('error', err);
    } else {
      console.log('tasks', data.Items.map(mapTaskItem));
      if (data.LastEvaluatedKey !== undefined) {
        console.log('more tasks available with --next=' + data.LastEvaluatedKey.tid.N);
      }
    }
  });
} else if (input['task-la'] === true) {
  var params = {
    "KeyConditionExpression": "category = :category",
    "ExpressionAttributeValues": {
      ":category": {
        "S": input['<category>']
      }
    },
    "TableName": "todo-task",
    "IndexName": "category-index",
    "Limit": input['--limit']
  };
  if (input['--next'] !== null) {
    params.KeyConditionExpression += ' AND tid > :next';
    params.ExpressionAttributeValues[':next'] = {
      "N": input['--next']
    };
  }
  if (input['--overdue'] === true) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--due'] === true) {
    params.FilterExpression = "due = :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--withoutdue'] === true) {
    params.FilterExpression = "attribute_not_exists(due)";
  } else if (input['--futuredue'] === true) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": moment().format("YYYYMMDD")};
  } else if (input['--dueafter'] !== null) {
    params.FilterExpression = "due > :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": input['--dueafter']};
  } else if (input['--duebefore'] !== null) {
    params.FilterExpression = "due < :yyyymmdd";
    params.ExpressionAttributeValues[':yyyymmdd'] = {"N": input['--duebefore']};
  }
  db.query(params, function(err, data) {
    if (err) {
      console.error('error', err);
    } else {
      console.log('tasks', data.Items.map(mapTaskItem));
      if (data.LastEvaluatedKey !== undefined) {
        console.log('more tasks available with --next=' + data.LastEvaluatedKey.tid.N);
      }
    }
  });
} else if (input['task-done'] === true) {
  var params = {
    "Key": {
      "uid": {
        "S": input['<uid>']
      },
      "tid": {
        "N": input['<tid>']
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
      console.error('error', err);
    } else {
      console.log('task completed with tid ' + input['<tid>']);
    }
  });
}
*/
