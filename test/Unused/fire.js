/**
 *
 * fire.js 0.1
 *
 * (c) 2012 Michael Gerhaeuser
 *
 * fire.js is free software; You can redistribute it and/or
 * modify it under the terms of the MIT license. You should have
 * received a copy of the MIT license along with fire.js. If not,
 * see https://www.opensource.org/licenses/MIT
 */

var fire = (function (window, document, undefined) {
    var _ = {
            isArray: function (v) {
                return v && typeof v === "object" && "splice" in v && "join" in v;
            },

            merge: function (obj1, obj2) {
                var r = obj1 || {},
                    i,
                    j;

                for (i in obj2) {
                    if (obj2.hasOwnProperty(i)) {
                        if (_.isArray(obj2[i])) {
                            r[i] = [];
                            for (j = 0; j < obj2[i].length; j++) {
                                if (_.isArray(obj2[i][j]) || typeof obj2[i][j] === "object") {
                                    r[i][j] = _.merge(r[i][j], obj2[i][j]);
                                } else {
                                    r[i][j] = obj2[i][j];
                                }
                            }
                        } else if (typeof obj2[i] === "object") {
                            r[i] = _.merge(r[i] || {}, obj2[i]);
                        } else {
                            r[i] = obj2[i];
                        }
                    }
                }

                return r;
            }
        },
        pub = {
            event: function (element, event, patch) {
                var evt;

                if (document.createEventObject) {
                    // IE
                    evt = document.createEventObject();
                    evt = _.merge(evt, patch);

                    return element.fireEvent("on" + event, evt);
                } else {
                    // non-IE
                    evt = document.createEvent("HTMLEvents");
                    evt.initEvent(event, true, true);
                    evt = _.merge(evt, patch);

                    return !element.dispatchEvent(evt);
                }
            }
        };

    // we are running test cases
    if (typeof TestCase !== "undefined") {
        pub._ = _;
    }

    return pub;
})(window, document);
