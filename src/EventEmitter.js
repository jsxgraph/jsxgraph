/* 
    Copyright 2012
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with JSXGraph.  If not, see <http://www.gnu.org/licenses/>.
*/

/** 
 * @fileoverview In this file the EventEmitter interface is defined.
 */

/**
 * @namespace
 */
JXG.EventEmitter = {
    /**
     * Holds the registered event handlers.
     * @name JXG.EventEmitter#eventHandlers
     * @type Object
     */
    eventHandlers: {},
    
    /**
     * Triggers all event handlers of this element for a given event.
     * @name JXG.EventEmitter#triggerEventHandlers
     * @function
     * @param {Array} event
     * @returns Reference to the object.
     */
    triggerEventHandlers: function (event) {
        var i, h, args = null,
            j, evt, evtH, len1, len2;

/*
        if (!JXG.isArray(event)) {
            event = [event];
        }
*/
        len1 = event.length;
        for (j = 0; j < len1; j++) {
            evtH = this.eventHandlers[event[j]]; 
            /*
            evt = event[j];
            if (JXG.isArray(this.eventHandlers[evt])) {
                len2 = this.eventHandlers[evt].length;
                for (i = 0; i < len2; i++) {
                    h = this.eventHandlers[evt][i];
                    h.handler.apply(h.context, args);
                }
            }
            */
            if (JXG.isArray(evtH)) {
                len2 = evtH.length;
                for (i = 0; i < len2; i++) {
                    h = evtH[i];
                    if (args===null) {
                        args = Array.prototype.slice.call(arguments, 1);
                    }
                    h.handler.apply(h.context, args);
                }
            }

        }
        
        return this;
    },

    /**
     * Register a new event handler. For a list of possible events see documentation of the elements and objects implementing
     * the {@link EventEmitter} interface.
     * @name JXG.EventEmitter#on
     * @function
     * @param {String} event
     * @param {Function} handler
     * @param {Object} [context] The context the handler will be called in, default is the element itself.
     * @returns Reference to the object.
     */
    on: function (event, handler, context) {
        if (!JXG.isArray(this.eventHandlers[event])) {
            this.eventHandlers[event] = [];
        }

        context = JXG.def(context, this);

        this.eventHandlers[event].push({
            handler: handler,
            context: context
        });
        
        return this;
    },

    /**
     * Unregister an event handler.
     * @name JXG.EventEmitter#off
     * @function
     * @param {String} event
     * @param {Function} handler
     * @returns Reference to the object.
     */
    off: function (event, handler) {
        var i;

        if (!event || !JXG.isArray(this.eventHandlers[event])) {
            return this;
        }

        if (handler) {
            i = JXG.indexOf(this.eventHandlers[event], handler, 'handler');
            if (i > -1) {
                this.eventHandlers[event].splice(i, 1);
            }
        } else {
            this.eventHandlers[event].length = 0;
        }
        
        return this;
    },

    /**
     * @description Implements the functionality from this interface in the given object. All objects getting their event handling
     * capabilities from this method should document it by adding the <tt>on, off, triggerEventHandlers</tt> via the
     * borrows tag as methods to their documentation: <pre>@borrows JXG.EventEmitter#on as this.on</pre>
     * @name JXG.EventEmitter#eventify
     * @function
     * @param {Object} o
     */
    eventify: function (o) {
        o.eventHandlers = {};
        o.on = this.on;
        o.off = this.off;
        o.triggerEventHandlers = this.triggerEventHandlers;
    }
};
