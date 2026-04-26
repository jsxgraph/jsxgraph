from JXGServerModule import JXGServerModule
import JXG

class JXGTestModule(JXGServerModule):

    def init(self, resp):
        s = '''
        function (x) {
            alert(x);
        };
        '''
        resp.addField('JXG.Math.Numerics', 'test', s)

        resp.addHandler(self.calcTest, 'function(data) { alert(data.y); }')
        return

    def calcTest(self, resp, x):
        resp.addData('y', 3*x)
        return
