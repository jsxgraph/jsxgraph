#!/usr/bin/env python

# ZIP compression
import zlib
# Base64 en-/decoding
import base64
# CGI variables handling
import cgi

import JXG
import inspect


# Base plugin
from JXGServerModule import JXGServerModule

def print_httpheader():
    print("""\
Content-Type: text/plain\n
""")


def default_action(req, resp):
    action = req.getvalue('action', 'empty')
    resp.error("action \"" + action + "\" is undefined")
    return resp.dump()
    
def import_module(plugin, resp):
    try:
        __import__(plugin, None, None, [''])

        tp = JXGServerModule.__subclasses__()
        if len(tp) == 0:
            resp.error("error loading module \"" + plugin + "\"")
            return tp
        tp = tp[0]()

        if not tp.isJXGServerModule:
            resp.error("not a jxg server module: \"" + plugin + "\"")
            return tp
    except Exception as e:
        resp.error("error loading jxg server module: \"" + plugin + "\": " + e.__str__())
        return

    return tp

def load_module(req, resp):
    plugin = req.getValue("module", "none")
    tp = import_module(plugin, resp)

    if resp._type != 'error':
        tp.init(resp)
    return resp.dump()

def exec_module(req, resp):
    handler = req.getValue('handler', 'none')
    module = req.getValue('module', 'none')

    m = import_module(module, resp)
    if resp._type == 'error':
        return resp.dump()

    method = getattr(m, handler)
    params = ()
    args = inspect.getargspec(method)
    for i in range(0, len(args.args)):
        if args.args[i] == 'self':
            pass
        elif args.args[i] == 'resp':
            params += (resp, )
        else:
            params += (req.getValue(args.args[i]), )

    method(*params)

    return resp.dump()

# Get Data from post/get parameters
form = cgi.FieldStorage();

action = form.getfirst('action', 'empty')
id = form.getfirst('id', 'none')
data = base64.b64decode(form.getfirst('dataJSON', ''))

actions_map = {                         \
                 'load': load_module,   \
                 'exec': exec_module    \
              }
ret = actions_map.get(action, default_action)(JXG.Request(action, id, data), JXG.Response(id))

print_httpheader()

print(base64.b64encode(zlib.compress(ret, 9)))

