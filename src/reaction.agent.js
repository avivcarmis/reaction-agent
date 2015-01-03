/**
 * Keypress Agent Module
 */
(function() {

        /**
         * @class KeypressAgent
         */
        
        /**
         * Constructs a new KeypressAgent object
         * @returns {KeypressAgent}
         */
        function KeypressAgent() {
                this.stack = [];
                var thisPtr = this;
                document.onkeydown = function(e) {
                        var layer = thisPtr.getActiveLayer();
                        if (layer === null) return;
                        var status = layer.callHandlerByKeyCode(e.keyCode);
                        return !status;
                };
        }
        
        /**
         * Creates a fresh KeypressLayer object to be the currently active layer, and returns it's usage key
         * @returns {Number}
         */
        KeypressAgent.prototype.createLayer = function() {
                var layer = new KeypressLayer();
                this.stack.push(layer);
                return layer.getKey();
        };

        /**
         * Receive a KeypressLayer usage key, keypress event keyCode and a function handler for the press event,
         * binds the keypress event to the handler in the KeypressLayer, and returns true upon success, or false if layer not found
         * @param {Number} key
         * @param {Number} keyCode
         * @param {Function} handler
         * @returns {Boolean}
         */
        KeypressAgent.prototype.addToLayer = function(key, keyCode, handler) {
                var layer = this.getLayer(key);
                if (layer === null) return false;
                layer.add(keyCode, handler);
                return true;
        };

        /**
         * Receive a KeypressLayer usage key and removed the matching layer. returns true upon success or false if layer was not found.
         * @param {Number} key
         * @returns {Boolean}
         */
        KeypressAgent.prototype.removeLayer = function(key) {
                var layerIndex = this.getLayerIndex(key);
                if (layerIndex == -1) return false;
                this.stack.splice(layerIndex, 1);
                return true;
        };

        /**
         * Returns the currently active KeypressLayer object or null if agent is empty
         * @returns {KeypressLayer}
         */
        KeypressAgent.prototype.getActiveLayer = function() {
                return this.stack.length == 0 ? null : this.stack[this.stack.length - 1];
        };

        /**
         * Receive a KeypressLayer usage key and returns the KeypressLayer object or null if not found
         * @param {Number} key
         * @returns {KeypressLayer}
         */
        KeypressAgent.prototype.getLayer = function(key) {
                var layerIndex = this.getLayerIndex(key);
                return layerIndex == -1 ? null : this.stack[layerIndex];
        };

        /**
         * Receive a KeypressLayer usage key and returns the KeypressLayer index in the agent stack, or -1 if not found
         * @param {Number} key
         * @returns {Number}
         */
        KeypressAgent.prototype.getLayerIndex = function(key) {
                for (var i = 0; i < this.stack.length; i++) {
                        var layer = this.stack[i];
                        if (layer.getKey() == key) return i;
                }
                return -1;
        };

        /**
         * If called, prints keyCode value to console on every keypress event
         */
        KeypressAgent.prototype.mapToConsole = function() {
                $(document).keyup(function(e) {
                        console.log(e.keyCode);
                });
        };
        
        /**
         * End of class KeypressAgent
         */

        /**
         * @class KeypressLayer
         */
        
        /**
         * Constructs a new Keypress Layer object
         * @returns {KeypressLayer}
         */
        function KeypressLayer() {
                this.key = KeypressLayer.freeKey++;
                this.data = {};
        }

        /**
         * @static
         * Holds the next free layer key
         */
        KeypressLayer.freeKey = 0;

        /**
         * Returns the layer key
         * @returns {Number}
         */
        KeypressLayer.prototype.getKey = function() {
                return this.key;
        };

        /**
         * Receive keyCode and a handler function and add them to layer
         * @param {Number} keyCode
         * @param {Function} handler
         * @returns {undefined}
         */
        KeypressLayer.prototype.add = function(keyCode, handler) {
                if (typeof handler !== "function") throw "Keypress Layer handler must be a function. Received value was " + typeof handler;
                this.data[keyCode] = handler;
        };

        /**
         * Call the handler with the given keyCode, returns true if handler found, false otherwise.
         * @param {Number} keyCode
         * @returns {Boolean}
         */
        KeypressLayer.prototype.callHandlerByKeyCode = function(keyCode) {
                var handler = this.data[keyCode];
                if (notDefined(handler)) return false;
                handler(keyCode);
                return true;
        };
        
        /**
         * End of class KeypressLayer
         */

        // export KeypressAgent instance
        window.KeypressAgent = new KeypressAgent();

})();

/**
 * DOM Agent Module
 */
(function() {
        
        /**
         * @class DOMAgent
         */
        
        /**
         * Constructs a new DOM Agent object
         * @returns {DOMAgent}
         */
        function DOMAgent() {
                this.freeHandlerKey = 0;
                this.initialized = false;
                this.handlerDescriptors = [];
        }
        
        /**
         * Receive a string css selector and a handler function and binds the handler to be run on a new appearance of selector in the DOM.
         * Returns the usage key of the handler descriptor created, to remove the handler if needed.
         * @param {String} selector
         * @param {Function} handler
         * @returns {Number}
         */
        DOMAgent.prototype.add = function(selector, handler) {
                this.init();
                var handlerDescriptor = new DOMAgentHandlerDescriptor(selector, handler);
                this.handlerDescriptors.push(handlerDescriptor);
                $(function() {
                        $(selector).each(function() {
                                handlerDescriptor.execute(this);
                        });
                });
                return handlerDescriptor.getKey();
        };
        
        /**
         * Receive a usage key of a handler descriptor and remove it from the Agent.
         * Returns true upon success or false on failure.
         * @param {Number} key
         * @returns {Boolean}
         */
        DOMAgent.prototype.remove = function(key) {
                var descriptorIndex = this.getDescriptorIndexByKey(key);
                if (descriptorIndex == -1) return false;
                this.handlerDescriptors.splice(descriptorIndex, 1);
                return true;
        };
        
        /**
         * Receive a descriptor usage key and returns the descriptor position in the Agent array, or -1 if not found.
         * @param {Number} key
         * @returns {Number}
         */
        DOMAgent.prototype.getDescriptorIndexByKey = function(key) {
                for (var i = 0; i < this.handlerDescriptors.length; i++) {
                        var descriptor = this.handlerDescriptors[i];
                        if (descriptor.getKey() == key) return i;
                }
                return -1;
        };
        
        /**
         * Initializes the service, overrides all jquery methods to ensure notify on dom change.
         * @returns {undefined}
         */
        DOMAgent.prototype.init = function() {
                if (this.initialized) return;
                this.initialized = true;
                var self = this;
                for (var jqMethodIndex = 0; jqMethodIndex < DOMAgent.jqueryDOMMethodDescriptors.length; jqMethodIndex++) {
                        var methodDescriptor = DOMAgent.jqueryDOMMethodDescriptors[jqMethodIndex];
                        (function(methodName, wrapperGetter) {
                                var originalMethod = $.fn[methodName];
                                $.fn[methodName] = function() {
                                        var source = this;
                                        var parameter = $(arguments[0]);
                                        var changeWrapper = wrapperGetter(source, parameter);
                                        var returnValue = originalMethod.apply(source, arguments);
                                        self.trigger(changeWrapper);
                                        return returnValue;
                                };
                        })(methodDescriptor.name, methodDescriptor.wrapper);
                }
        };
        
        /**
         * Receive a jQuery element object, triggers a 'domagentchange' event and look for registered new selector elements to be handled in the DOM.
         * @param {jQuery} element
         * @returns {undefined}
         */
        DOMAgent.prototype.trigger = function(element) {
                element.trigger('domagentchange');
                for (var i = 0; i < this.handlerDescriptors.length; i++) {
                        var descriptor = this.handlerDescriptors[i];
                        var descriptorSelector = descriptor.getSelector();
                        var descriptorKey = descriptor.getKey();
                        var dataKeyIndicator = "domagent-" + descriptorKey;
                        element.find(descriptorSelector).each(function() {
                                if (isDefined($(this).data(dataKeyIndicator))) return;
                                $(this).data(dataKeyIndicator, true);
                                descriptor.execute(this);
                        });
                }
        }
        
        /**
         * @static
         * A list of jQuery DOM change method descriptors containing the name of each method,
         * and a function to receive the source element of a jquery DOM change method call and it's
         * first parameter, and retreive the neerest element to contain all the DOM that changed as a result from the call.
         * e.g. if we call $('.example1').appendTo('.example2')
         * the value of $('.example1') would be the source,
         * the value of $('.example2') would be the parameter,
         * and the 'smallest' element to contain the DOM changed will be $('.example2').parent()
         */
        DOMAgent.jqueryDOMMethodDescriptors = [
                {name: 'after',             wrapper: function(source, parameter) {return source.parent()}},
                {name: 'append',            wrapper: function(source, parameter) {return source}},
                {name: 'appendTo',          wrapper: function(source, parameter) {return parameter}},
                {name: 'before',            wrapper: function(source, parameter) {return source.parent()}},
                {name: 'detach',            wrapper: function(source, parameter) {return source.parent()}},
                {name: 'empty',             wrapper: function(source, parameter) {return source}},
                {name: 'html',              wrapper: function(source, parameter) {return source}},
                {name: 'insertAfter',       wrapper: function(source, parameter) {return parameter.parent()}},
                {name: 'insertBefore',      wrapper: function(source, parameter) {return parameter.parent()}},
                {name: 'prepend',           wrapper: function(source, parameter) {return source}},
                {name: 'prependTo',         wrapper: function(source, parameter) {return parameter}},
                {name: 'remove',            wrapper: function(source, parameter) {return source.parent()}},
                {name: 'replaceAll',        wrapper: function(source, parameter) {return parameter.parent()}},
                {name: 'replaceWith',       wrapper: function(source, parameter) {return source.parent()}},
                {name: 'text',              wrapper: function(source, parameter) {return source}},
                {name: 'unwrap',            wrapper: function(source, parameter) {return source.parent().parent()}},
                {name: 'wrap',              wrapper: function(source, parameter) {return source.parent()}},
                {name: 'wrapAll',           wrapper: function(source, parameter) {return source.parent()}},
                {name: 'wrapInner',         wrapper: function(source, parameter) {return source}},
        ];
        
        /**
         * End of class DOMAgent
         */
        
        /**
         * @class DOMAgentHandlerDescriptor
         */

        /**
         * Receive a string css selector and a function handler and constructs a new DOMAgentHandlerDescriptor object
         * @param {String} selector
         * @param {Function} handler
         * @returns {DOMAgentHandlerDescriptor}
         */
        function DOMAgentHandlerDescriptor(selector, handler) {
                this.key = DOMAgentHandlerDescriptor.freeKey++;
                this.selector = selector;
                this.handler = handler;
        }

        /**
         * @static
         * Holds the next free descriptor key
         */
        DOMAgentHandlerDescriptor.freeKey = 0;
        
        /**
         * Returns the descriptor key
         * @returns {Number}
         */
        DOMAgentHandlerDescriptor.prototype.getKey = function() {
                return this.key;
        };
        
        /**
         * Returns the descriptor string
         * @returns {String}
         */
        DOMAgentHandlerDescriptor.prototype.getSelector = function() {
                return this.selector;
        };
        
        /**
         * Receive a DOM element object and apply the handler function with the the element as the scope.
         * @param {Element Object} element
         * @returns {undefined}
         */
        DOMAgentHandlerDescriptor.prototype.execute = function(element) {
                this.handler.call(element);
        };
        
        /**
         * End of class DOMAgentHandlerDescriptor
         */

        // export KeypressAgent instance
        window.DOMAgent = new DOMAgent();
        
})();

/**
 * Scroll Agent Module
 */
(function() {

        /**
         * @class ScrollAgent
         */
        
        /**
         * Constructs a new ScrollAgent object
         * @returns {ScrollAgent}
         */
        function ScrollAgent() {
                this.breakpoints = [];
                this.current = 0;
                this.initialized = false;
        }

        /**
         * Initializes the breakpoint service
         * @returns {undefined}
         */
        ScrollAgent.prototype.init = function() {
                if (this.initialized) return;
                this.initialized = true;
                var self = this;
                $(window).scroll(function() {
                        var newCurrent = self.calcBreakpointIndex($(window).scrollTop());
                        if (self.current == newCurrent) return;
                        self.current = newCurrent;
                        self.breakpoints[self.current].handler();
                });
                $(window).resize(this.sort);
        };

        /**
         * Initializes the event service
         * @returns {undefined}
         */
        ScrollAgent.prototype.activateEvents = function() {
                this.top = $(window).scrollTop();
                var self = this;
                $(window).scroll(function() {
                        var currentTop = $(window).scrollTop();
                        if (currentTop > self.top) {
                                $(document).trigger('scrolldown');
                        }
                        else {
                                $(document).trigger('scrollup');
                        }
                        self.top = currentTop;
                });
        };

        /**
         * Preforms a binary search on the breakpoints array to find the most smallest breakpoint in the current window top,
         * Returns the index of this breakpoint.
         * @param {Number} currentTop
         * @param {Number} rangeLeft
         * @param {Number} rangeRight
         * @returns {Number}
         */
        ScrollAgent.prototype.calcBreakpointIndex = function(currentTop, rangeLeft, rangeRight) {
                if (notDefined(rangeLeft)) rangeLeft = 0;
                if (notDefined(rangeRight)) rangeRight = this.breakpoints.length;
                if (rangeRight - rangeLeft <= 1) return rangeLeft == this.breakpoints.length ? this.breakpoints.length - 1 : rangeLeft;
                var middle = Math.floor(((rangeRight - rangeLeft) / 2) + rangeLeft);
                var bpValue = this.breakpoints[middle].getValue();
                if (bpValue > currentTop) return this.calcBreakpointIndex(currentTop, rangeLeft, middle);
                else return this.calcBreakpointIndex(currentTop, middle, rangeRight);
        };

        /**
         * Receive a test, function handler to be executed for the breakpoint, and an optional offset from the test value,
         * and creates a new breakpoint, meaning when the tested value + offset it reached with window scroll top, the handler is executed.
         * The test value can be received as a Number, representing a certain scroll top value, a function returning a value for dynamic
         * calculations, or as a string selector, js element object or jquery object to for auto dynamic calculation of the element top position.
         * Returns a breakpoint usage key to able removal of the breakpoint from the Agent.
         * @param {Mixed} test
         * @param {Function} handler
         * @param {Number} [offset]
         * @returns {Number}
         */
        ScrollAgent.prototype.add = function(test, handler, offset) {
                this.init();
                var breakpointObject = new ScrollAgentBreakPoint(test, handler, offset);
                this.breakpoints.push(breakpointObject);
                this.sort();
                return breakpointObject.getKey();
        };

        /**
         * Receive a breakpoint usage key and removes the matching breakpoint from the Agent. Returns true on success, or false if breakpoint was not found.
         * @param {Number} key
         * @returns {Boolean}
         */
        ScrollAgent.prototype.remove = function(key) {
                var breakpointIndex = this.getBreakpointIndexByKey(key);
                if (breakpointIndex == -1) return false;
                this.handlerDescriptors.splice(breakpointIndex, 1);
                return true;
        };

        /**
         * Sorts the breakpoint array by the value of each breakpoint to able a binary search on window scroll event.
         * Updates the Agent current pointer if needed.
         * @returns {undefined}
         */
        ScrollAgent.prototype.sort = function() {
                var currentBreakpointKey = this.breakpoints[this.current].getKey();
                this.breakpoints.sort(function(a, b) {
                        return a.getValue() - b.getValue();
                });
                if (currentBreakpointKey == this.breakpoints[this.current].getKey()) return;
                var currentIndex = this.getBreakpointIndexByKey(currentBreakpointKey);
                this.current = currentIndex == -1 ? 0 : currentIndex;
        };

        /**
         * Receive a breakpoint usage key, returns the breakpoint index in the Agent breakpoint array, or -1 if not found.
         * @param {Number} key
         * @returns {Number}
         */
        ScrollAgent.prototype.getBreakpointIndexByKey = function(key) {
                for (var i = 0; i < this.breakpoints.length; i++) {
                        if (this.breakpoints[i].getKey() == key) return i;
                }
                return -1;
        };
        
        /**
         * End of class ScrollAgent
         */

        /**
         * @class ScrollAgentBreakPoint
         */

        /**
         * Constructs a new ScrollAgentBreakPoint object.
         * @param {Mixed} test
         * @param {Function} handler
         * @param {Number} [offset]
         * @returns {ScrollAgentBreakPoint}
         */
        function ScrollAgentBreakPoint(test, handler, offset) {
                this.key = ScrollAgentBreakPoint.nextFreeKey++;
                this.offset = offset || 0;
                this.handler = handler;
                this.test = ScrollAgentBreakPoint.buildTestFunction(test);
        }

        /**
         * Returns the breakpoint usage key
         * @returns {Number}
         */
        ScrollAgentBreakPoint.prototype.getKey = function() {
                return this.key;
        };

        /**
         * Calculates and returns the breakpoint value.
         * @returns {Number}
         */
        ScrollAgentBreakPoint.prototype.getValue = function() {
                return this.test() + this.offset;
        };

        /**
         * @static
         * Holds the index of the next free usage key
         */
        ScrollAgentBreakPoint.nextFreeKey = 0;

        /**
         * Receive a test value, i.e.:
         * The test value can be received as a Number, representing a certain scroll top value, a function returning a value for dynamic
         * calculations, or as a string selector, js element object or jquery object to for auto dynamic calculation of the element top position.
         * Returns test function to return the breakpoint value.
         * @param {Mixed} test
         * @returns {Function}
         */
        ScrollAgentBreakPoint.buildTestFunction = function(test) {
                if (typeof test == "function") return test;
                if (typeof test == "number") return function() {
                        return test;
                };
                return function() {
                        return $(test).offset().top;
                };
        };
        
        /**
         * End of class ScrollAgentBreakPoint
         */

        // export ScrollAgent instance
        window.ScrollAgent = new ScrollAgent();
        
})();

/**
 * Validation Agent
 */
(function($) {
        
        /**
         * Constructs a new validation object
         * @param {Object} element
         * @param {Mixed} test
         * @param {Function} success
         * @param {Function} fail
         * @param {Object} [settings]
         * @returns {Validation}
         */
        function Validation(element, test, success, fail, settings) {
                this.element = element;
                this.test = test;
                this.success = success;
                this.fail = fail;
                this.settings = $.extend({}, Validation.defaults, settings);
                this.run = true;
                this.init();
        }
        
        /**
         * Binds handlers to keypress and blue events
         * @returns {undefined}
         */
        Validation.prototype.init = function() {
                var self = this;
                if (this.settings.validateType) {
                        if (!self.run) return;
                        $(this).keypress(function(e) {
                                var value = this.value + String.fromCharCode(e.keyCode);
                                var isValid = self.test(value);
                                if (isValid) {
                                        self.success();
                                        return true;
                                }
                                else {
                                        self.fail();
                                        return false;
                                }
                        });
                }
                if (this.settings.validateBlur) {
                        if (!self.run) return;
                        $(this).blur(function() {
                                var isValid = self.test(this.value);
                                if (isValid) self.success();
                                else self.fail();
                        });
                }
        };
        
        /**
         * Pauses the agent activity
         * @returns {undefined}
         */
        Validation.prototype.pause = function() {
                this.run = false;
        };
        
        /**
         * Resumes the agent activity
         * @returns {undefined}
         */
        Validation.prototype.resume = function() {
                this.run = true;
        };
        
        /**
         * @static
         * Default settings
         */
        Validation.defaults = {
                validateBlur: true,
                validateType: true
        };
        
        /**
         * Either receive a string command - "pause" to pause the validation activity, or "resume" to resume it,
         * or, a test function or regexp to validate the element value, a success and fail callbacks, and an optional
         * settings object and constructs a new validation object.
         * @param {Mixed} tester
         * @param {Function} success
         * @param {Function} fail
         * @param {Object} [settings]
         * @returns {jQuery}
         */
        $.fn.validation = function(tester, success, fail, settings) {
                if (typeof tester == "string") { // command
                        var validationObjects = [];
                        this.each(function() {
                                var object = $(this).data("validationObject");
                                if (notDefined(object)) throw "Reaction Agent Error: validation object corrupted or not found";
                                validationObjects.push(object);
                        });
                        if (tester == "pause") {
                                for (var i = 0; i < validationObjects.length; i++) validationObjects[i].pause();
                        }
                        else if (tester == "resume") {
                                for (var i = 0; i < validationObjects.length; i++) validationObjects[i].resume();
                        }
                        else throw "Reaction Agent Error: command " + tester + " is illigal";
                        return this;
                }
                if (typeof tester != "function" && notDefined(tester.test)) throw "Reaction Agent Error: Illigal tester supplied to jquery validation method";
                if (typeof tester == "function") {
                        var test = tester;
                }
                else {
                        var test = function(value) {
                                return tester.test(value);
                        };
                }
                return this.each(function() {
                        $(this).data("validationObject", new Validation($(this), test, success, fail, settings));
                });
        };
        
})(jQuery);

/**
 * jQuery Extensions
 */
(function($) {
        
        /**
         * Receive a string selector, returns whether or not the element has an ancestor with given selector.
         * @param {String} parentSelector
         * @returns {Boolean}
         */
        $.fn.hasAncestor = function(parentSelector) {
                return this.is(parentSelector) || $(parentSelector).find(this).length > 0;
        };

        /**
         * Returns the current element width.
         * @param {Boolean} [padding]
         * @param {Boolean} [border]
         * @param {Boolean} [margin]
         * @returns {Number}
         */
        $.fn.getWidth = function(padding, border, margin) {
                return getDimension(this, 'width', padding, border, margin);
        };
        
        /**
         * Returns the current element height.
         * @param {Boolean} [padding]
         * @param {Boolean} [border]
         * @param {Boolean} [margin]
         * @returns {Number}
         */
        $.fn.getHeight = function(padding, border, margin) {
                return getDimension(this, 'height', padding, border, margin);
        };

        /**
         * Receive a function callback, then make sure the element is visible, then runs the callback, then returns the element to it's original state.
         * @param {Function} callback
         * @returns {jQuery}
         */
        $.fn.showAndTest = function(callback) {
                var element = this.eq(0), currentParent = element;
                var hiddenParents = [];
                while (!element.is(":visible") && !currentParent.is("body") && currentParent.length > 0) {
                        if (currentParent.css("display") == "none" || currentParent.css("visibility") == "hidden") {
                                hiddenParents.push({element: currentParent, css: currentParent.getCSSRestorer("display", "visibility", "overflow"), classes: currentParent.attr("class")});
                                currentParent.show().css({visibility: "visible", overflow: "visible"}).removeClass("hidden-xs hidden-sm hidden-md hidden-lg");
                        }
                        currentParent = currentParent.parent();
                }
                callback.apply(element.get(0));
                for (var i = 0; i < hiddenParents.length; i++) hiddenParents[i].element.css(hiddenParents[i].css).attr("class", hiddenParents[i].classes);
                return this;
        };
        
        /**
         * Receive a variadic number of string arguments, each stating a css property name,
         * return an object to apply with jquery .css method to restore the element to it's original state.
         * @returns {Object}
         */
        $.fn.getCSSRestorer = function() {
                var style = this.attr("style") || "";
                var restoreObject = {};
                for (var i = 0; i < arguments.length; i++) restoreObject[arguments[i]] = style.indexOf(arguments[i]) == -1 ? "" : this.css(arguments[i]);
                return restoreObject;
        };
        
        /**
         * Receive a jQuery object, dimension name ("width"\"height"), and boolean padding border and margin,
         * calculates and returns the element dimension.
         * @param {Object} jqElement
         * @param {String} dimension
         * @param {Boolean} [padding]
         * @param {Boolean} [border]
         * @param {Boolean} [margin]
         * @returns {Number}
         */
        function getDimension(jqElement, dimension, padding, border, margin) {
                if (dimension != "width" && dimension != "height") throw "Reaction Agent Error: getDimension received an illigal dimension " + dimension;
                var result = 0;
                if (jqElement.length > 0) jqElement.eq(0).showAndTest(function() {
                        if (padding) {
                                if (border) {
                                        if (margin) {
                                                result = $(this)["outer" + dimension.ucfirst()](true);
                                        }
                                        else {
                                                result = $(this)["outer" + dimension.ucfirst()](false);
                                        }
                                }
                                else {
                                        result = $(this)["inner" + dimension.ucfirst()]();
                                }
                        }
                        else {
                                result = $(this)[dimension]();
                        }
                });
                return result;
        }

})(jQuery);

// Utilities

        /**
         * Receive any variable, return true if its value is not defined, false otherwise.
         * @param {Mixed} variable
         * @returns {Boolean}
         */
        function notDefined(variable) {
                return typeof variable === "undefined";
        }

        /**
         * Receive any variable, return true if its value is defined, false otherwise.
         * @param {Mixed} variable
         * @returns {Boolean}
         */
        function isDefined(variable) {
                return !notDefined(variable);
        }
        
        /**
         * Receive a string message, returns a function that prints the message to browser console.
         * @param {String} msg
         * @returns {Function}
         */
        function consoleTest(msg) {
                return function() {
                        console.log(msg);
                };
        }
        
        /**
         * Receive a string message, returns a function that alerts the message.
         * @param {String} msg
         * @returns {Function}
         */
        function alertTest(msg) {
                return function() {
                        alert(msg);
                };
        }
        
        /**
         * Retrieves a parameter value for the caller function by given settings.
         * typeOrTest can either be a function that receives the param and returns true if it is the requested param or false otherwise,
         * or a string stating the parameter type (e.g. "string", "function" etc...).
         * defaultValue is the value to return in case the parameter was not found in parameter list.
         * min\max index can set a range of parameters to look in. e.g. if we want to look all arguments from the second to the last,
         * we can call extractParam with minIndex = 1 and not to set maxIndex.
         * @param {Mixed} typeOrTest
         * @param {Mixed} defaultValue
         * @param {Number} [minIndex]
         * @param {Number} [maxIndex]
         * @returns {Mixed}
         */
        function extractParam(typeOrTest, defaultValue, minIndex, maxIndex) {
                var agrumentList = arguments.callee.caller.arguments;
                if (typeof typeOrTest == "string") {
                        var test = function(x) {
                                return typeof x == typeOrTest;
                        };
                }
                else var test = typeOrTest;
                if (notDefined(minIndex)) minIndex = 0;
                if (notDefined(maxIndex)) maxIndex = agrumentList.length - 1;
                for (var i = minIndex; i <= maxIndex; i++) if (test(agrumentList[i])) return agrumentList[i];
                return defaultValue;
        }
        
        /**
         * Binds a handler function to run on document.ready, window.load and window.resize events.
         * @param {Function} handler
         * @returns {undefined}
         */
        function responsiveBind(handler) {
                $(handler);
                $(window).load(handler).resize(handler);
        }
        
// Normalize

        if (notDefined(console)) {
                var console = {
                        log: function() {}
                };
        }