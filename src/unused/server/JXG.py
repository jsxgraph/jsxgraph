import json
import inspect

class Request(object):

    def __init__(self, action, id, data):
        self._action = action
        self._id = id
        self._data = data

    def getValue(self, item, default = 'empty'):
        if item == 'action':
            return self._action
        elif item == 'id':
            return self._id
        else:
            return json.loads(self._data)[item]

    def getList(self, item):
        return self._data.getlist(item)


class Response(object):

    def __init__(self, _id):
        self._id = _id
        self._type = 'response'
        self._data = {}
        self._fields = []
        self._handler = []

    def error(self, msg):
        self._type = 'error'
        self._message = msg

    def dump(self):
        if self._type == 'error':
            # drop all the data and methods, just output the error
            return json.dumps({                                 \
                                'type'    : 'error',            \
                                'id'      : self._id,           \
                                'message' : self._message       \
                              })
        else:
            return json.dumps({                                 \
                                'type'    : 'response',         \
                                'id'      : self._id,           \
                                'fields'  : self._fields,       \
                                'handler' : self._handler,      \
                                'data'    : self._data          \
                              })

    def addField(self, namespace, name, value):
        self._fields.append({                                   \
                              'namespace' : namespace,          \
                              'name'      : name,               \
                              'value'     : value               \
                            })

    def addData(self, name, value):
        self._data[name] = value

    def addHandler(self, function, callback):
        params = [];
        args = inspect.getargspec(function);
        for i in range(0, len(args.args)):
            if (args.args[i] != 'resp') and (args.args[i] != 'self'):
                params.append(args.args[i])

        self._handler.append({                                  \
                               'name'       : function.__name__,\
                               'callback'   : callback,         \
                               'parameters' : params            \
                             })
