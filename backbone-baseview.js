//     Backbone.BaseView 0.6.0

//     (c) 2014 James Ballantine, 1stdibs.com Inc.
//     Backbone.BaseView may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/1stdibs/backbone-base-and-form-view

/*global Backbone, window, jQuery, _, exports, module, require */
(function (root) {
    "use strict";

    var Backbone = root.Backbone,
        _ = root._;

    if (typeof module !== 'undefined') {
        _ = require('underscore');
        root = root || {};
        root.Backbone = Backbone = require('Backbone');
        module.exports = Backbone;
    }

    var
        // Finds globally dot noted namespaced objects from a string
        _stringToObj = function (str) {
            var arr = str.split('.'),
                obj = root[arr.shift()];

            while (arr.length && obj) {
                obj = obj[arr.shift()];
            }
            return obj;
        },
        slice = Array.prototype.slice,
        View = Backbone.View,
        BaseView,
        /**
         * Local constructor intended for use by {@link Backbone.BaseView}. Creates an object specifically
         * for manipulating subviews. Is created automatically by the BaseView instance and accessed through the
         * '.subs' property of the the instance.
         * @constructor SubViewManager
         * @class SubViewManager
         * @type {SubViewManager}
         * @param {object} subViewCfg An object with a configuration to add for subviews (see addConfig(map))
         * @param {Backbone.BaseView} parent The parent BaseView instance
         * @param [options]
         */
        SubViewManager = function (subViewCfg, parent, options) {
            this.config = {}; // Refers to configuration (construct, options)
            this.clear(true);
            this.parent = parent; // Should refer to parent BaseView instance

            // Set the options
            this.options = options || {};
            // Auto initialize a subview when config added
            this.autoInitSingletons = !!this.options.autoInitSingletons;
            // If true, then new subview configs and types will default to being singletons
            this.defaultToSingletons = this.options.defaultToSingletons;
            // Allow dot notation in 'get' method (if your config keys have dots, then set this to false)
            this.dotNotation = (this.options.dotNotation !== undefined) ? this.options.dotNotation : true;

            if (subViewCfg) {
                this.addConfig(subViewCfg);
            }
        };

    SubViewManager.prototype = {
       /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @class SubViewManager
         * @type {SubViewManager}
         * @method add
         * @param {Object} map
         *      An object with key's to refer to subViews and values that
         *      are View instances, options to pass to the constructor, or
         *      an array of either the previous two to add multiple subViews.
         *      If you pass options or an array of options, the SubViewManager
         *      will look for a configuration matching the key for these options
         *      and will initialize subviews based on the config, passing options
         *      to the constructor.
         * @param {Boolean} [singleton]
         *      True if the instances mapped to the keys should be singletons.
         *      If you pass options, the singleton param will be ignored.
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subViews with. Should match
         *      a key in the subView configuration. If not, a configuration
         *      will be set up with default values based on the instance
         *      passed.
         * @param {Backbone.View[]|object[]} arr
         *      An array of View instances or options. Instances will be
         *      appropriately associated with the key, options will be
         *      used to instantiate a subView based on the configuration
         *      matching the key
         * @param {Boolean} [singleton]
         *      True if the added views should be singletons
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {Backbone.View[]} arr
         *      An array of View instances. These will not be accessible
         *      by a type or key
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subView with
         * @param {Backbone.View} instance
         *      A View instance
         * @param {Object} [singleton]
         *      If you want the view matching this key to be a singleton
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {String} name
         *      A string key to refer to the subView with. Without an instance
         *      as the second param, this variant requires that a configuration
         *      to have been specified matching the 'name' with a constructor to
         *      initialize.
         * @param {Object} [options]
         *      An object that will be passed as the options parameter to the
         *      view on initialization.
         * @return {SubViewManager}
         */
        /**
         * Adds a subView or subViews to the View's list of subViews. Calling
         * function must provide instances of views or configurations.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method add
         * @param {Backbone.View} instance
         *      A Backbone.View instance to add as the subview
         * @return {SubViewManager}
         */
        add: function (name, instance, singleton) {
            var arr = (_.isArray(name)) ? name : (_.isArray(instance)) ? instance : undefined, // If its a simple array of subviews or configs
                map = (!arr && _.isObject(name) && name instanceof View === false) ? name : undefined, // If its a mapping of subviews
                viewOptions = (!arr && instance instanceof View === false) ? instance : undefined,
                key,
                i,
                len;

            if (map) {
                singleton = (typeof instance === 'boolean') ? instance : undefined;
                for (key in map) {
                    if (map.hasOwnProperty(key)) {
                        map[key] = (_.isArray(map[key])) ? map[key] : [map[key]];
                        len = map[key].length;
                        if (len && map[key][0] instanceof View) {
                            this._addInstance(key, map[key], singleton);
                        } else {
                            i = -1;
                            while (++i < len) {
                                this._init(key, map[key][i], singleton);
                            }
                        }
                    }
                }
                return this;
            }

            instance = (name instanceof View) ? name : instance;
            name = (typeof name === 'string' || typeof name === "number") ? name : undefined;
            singleton = (typeof singleton === 'boolean') ? singleton :
                    (!name && typeof instance === 'boolean') ? instance : undefined;

            if (viewOptions) {
                this._init(name, viewOptions, singleton);
                return this;
            }

            if (arr && (len = arr.length)) {
                if (arr[0] instanceof View) {
                    this._addInstance(name, arr, singleton);
                } else {
                    i = -1;
                    while (++i < len) {
                        this._init(name, arr[i], singleton);
                    }
                }

                return this;
            }

            if (instance) {
                this._addInstance(name, instance, singleton);
            } else if (name) {
                this._init(name, singleton);
            }
            return this;
        },
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @class
         * @method addConfig
         * @param {String} name
         *      The name or type that you would like use to refer to subViews
         *      created with this config
         * @param {String|Function} construct
         *      The constructor function for this subView. If its a string, the
         *      string must resolve to a global name-spaced function in dot notation.
         *      (e.g. 'Backbone.imageUpload.View')
         * @param {String} [options]
         *      The options or base options you would like to pass to the constructor
         *      whenever it is initialized.
         * @param {String|HTMLElement} [location]
         *      If you want to be able to automatically place a subView's DOM element
         *      somewhere in the parent view, pass a selector or DOM element or $ instance
         *      here that can be used by jquery as a wrapper to append the subView $el
         * @param {Boolean} [singleton]
         *      If you want this view to be a singleton subView. A singleton subView
         *      will only allow one instance of it to be created.
         * @return {SubViewManager}
         */
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method addConfig
         * @param {Object} map
         *      A object of key names/types to config objects, so you can add multiple configs
         * @example
         * // A config object should have the following format:
         *      {
         *          construct:  // Constructor function or string version (i.e. "Backbone.BaseView")
         *          options:    // Any options you want to pass to the initialize function
         *          singleton:  // if the object should be configured as a singleton or not
         *          location:   // A string or jQuery instance in the parent view element. Or
         *                      // a function that returns one of these. The subview el will 
         *                      // be appended to that location
         *      }
         * @return {SubViewManager}
         */
        /**
         * Add an configuration for a subview to the SubViewManager.
         * It can be instantiated later with the add function.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @method addConfig
         * @param {String} name
         *      The name or type that you would like use to refer to subViews
         *      created with this config
         * @param {Object} config
         *      The configuration object (uses the format described above)
         * @return {SubViewManager}
         */
        addConfig : function (name, config) {
            var map = (_.isObject(name) && !_.isArray(name)) ? name : false;
            if (map) {
                _.each(map, this._addConfig, this);
                return this;
            }

            return this._addConfig(config, name);
        },
        /**
         * Render all Subviews.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {object} [options]
         *      [options.appendTo] A selector, HTMLElement, or $ instance to append the subViews to
         *      [options.useLocation] 
         *          True if you want to append the subviews to the locations in their config if they 
         *          have one.
         *      [options.clearLocations]
         *          True if you want to use empty on the configured locations
         * @param {Boolean} [clearLocations]
         *      True if you want to remove all subView elements from the DOM before rendering
         *
         * @return {SubViewManager}
         */
        render: function (options) {
            options = options || {};
            var location = options.appendTo || options.useLocation;
            return this._render(this.subViews, location, options.clearLocations);
        },
        /**
         * Renders subviews and appends them to their 'locations' if they have one.
         * If you pass a appendTo param, views are appended to that location instead.
         * This is just a shortcut version of renderAppend({})
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {string|HTMLElement|$} [appendTo]
         *        Location to append the rendered subiews to
         * @param {object} [options] Other options (clearLocations)
         * @return {SubViewManager}
         */
        renderAppend: function (appendTo, options) {
            options = options || {};
            if (_.isObject(appendTo) && appendTo instanceof Backbone.$ === false && !_.isElement(appendTo)) {
                options = appendTo;
                appendTo = options.appendTo;
            }
            return this._render(this.subViews, appendTo || true, options.clearLocations);
        },
        /**
         * Render a subView specified by a key (from their configuration key). The key will
         * retrieve subViews by looking for a type and then looking for singletons or
         * specific instance using the Model/View cid
         * 
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * 
         * @param {String|Backbone.Model|Backbone.View} key
         *      A key, type, View/Model cid, Model, or View to refer to a specific subView
         *      or subViews. For example, passing the view cid 'view4' will render only
         *      the view with that cid, and passing the type 'creatorNames' will render
         *      views matching the type 'creatorNames'.
         * @param {Boolean|String|HTMLElement} [useLocation]
         *      True if you want to use the subView's configuration 'location' to place the
         *      element the subView elems automatically. You can also pass a selector or
         *      DOM element that all subviews matched by the 'key' will be appended to
         *
         * @return {SubViewManager}
         */
        renderByKey: function (key, options) {
            var subViews = this.getByType(key) || this.get(key);
            if (!_.isArray(subViews)) { subViews = [subViews]; }
            options = options || {};
            return this._render(subViews, options.appendTo || options.useLocation, options.clearLocations);
        },
        /**
         * Returns a new SubViewManager instance with filtered list of subviews.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {string|Backbone.View[]|function} key
         *      The key or type used to refer to a subview or subviews, or a list
         *      of subViews with a type found in this SubViewManager config, or a function
         *      that will iterate over the subviews and return true if a subview
         *      should be included in the filtered SubViewManager instance.
         * @return {SubViewManager}
         */
        filteredSubs: function (key) {
            var i = -1, len, subViews,
                subMgr = new SubViewManager(null, this.parent, this.options);
            subMgr.config = this.config;
            subViews = (_.isArray(key)) ? key : (_.isFunction(key)) ? this.filter(key) : this.getByType(key);
            len = subViews.length;
            while (++i < len) {
                subMgr.add(subViews[i]._subviewtype, subViews[i]);
            }
            return subMgr;
        },
        /**
         * Iterate through every subView, calling a function or invoking a method on
         * each of them. If a subView has it's own subViews, then it will recursively
         * iterate over those as well. The context is switched to the subView calling
         * the function/method.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String|Function} func 
         *        A string name of a method to call in the subviews or a function that
         *        will be called for each view
         * @param {Array} [args] An array of arguments to pass to the method/function
         * @return {SubViewManager}
         */
        descend: function (func, args) {
            var isFunc = _.isFunction(func),
                desc = function (subViews) {
                    var i = -1, len = subViews.length, subView, _func;
                    while (++i < len) {
                        subView = subViews[i];
                        _func = isFunc ? func : subView[func];
                        if (_func) {
                            if (args) { _func.apply(subView, args);
                                } else { _func.call(subViews[i]); }
                        }
                        if (subView.subViews && subView.subViews.length) {
                            desc(subView.subViews);
                        }
                    }
                };
            desc(this.subViews);
            return this;
        },
        /**
         * Clears all subViews and subView data off of the SubViewManager instance
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Boolean} [preserveElems] If true, view $els are left on the DOM
         * @param {Boolean} [clearConfigs] If true, resets the subView configs as well
         * @return {SubViewManager}
         */
        clear: function (preserveElems, clearConfigs) {
            if (!preserveElems) {
                this.removeElems();
            }
            this.subViews = [];
            if (this.parent && this.parent.subViews) {
                this.parent.subViews = this.subViews;
            }
            this._subViewsByType = {};
            this._subViewSingletons = {};
            this._subViewsByCid = {};
            this._subViewsByModelCid = {};
            if (clearConfigs) {
                this.config = {};
            }
            return this;
        },
        /**
         * Remove a subView
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String|Backbone.View|Backbone.Model} key
         * @param {Boolean} [preserveElems] If true, the View's element will not be removed from the DOM
         * @return {SubViewManager}
         */
        remove: function (key, preserveElems) {
            var subViews = (key && (typeof key === "string" || key.cid)) ? this.get(key) : key,
                len;
            if (!subViews) { return this; }
            if (!_.isArray(subViews)) {
                subViews = [subViews];
            }
            len = subViews ? subViews.length : 0;
            if (!preserveElems) {
                this.removeElems(subViews);
            }
            if (len) {
                this.trigger('remove', subViews);
            }
            while (subViews && subViews.length) {
                this._remove(subViews.shift());
            }
            return this;
        },
        /**
         * Removes all subView '.el' element from the dom, or if passed a
         * list of subViews, removes only the elements in those.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Backbone.View[]} subViews
         * @return {SubViewManager}
         */
        removeElems: function (subViews) {
            subViews = subViews || this.subViews;

            var i = -1,
                len = subViews.length;
            while (++i < len) {
                subViews[i].remove();
            }
            return this;
        },
        /**
         * Shortcut method to invoke jQuery's detach function
         * on each of the '.$el' elements for each of the 
         * subviews, or if an array of subViews is passed,
         * on each of those. Useful if you want to re-render
         * a parent view and want to prevent subviews from
         * losing their events and other data that is removed
         * when jQuery 'remove' is called on that element.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Backbone.View[]} subViews
         * @return {SubViewManager}
         */
        detachElems: function (subViews) {
            subViews = subViews || this.subViews;

            var i = -1,
                len = subViews.length;
            while (++i < len) {
                subViews[i].$el.detach();
            }
            return this;
        },
        /**
         * Get a subView instance or an array if multiple instances
         * match your key.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {Object|String} [key]
         *      The key to a subView singleton, the view's cid
         *      the associated model cid, the associated model itself,
         *      or the associated view itself. If your key is a
         *      string, you can use
         * @return {Backbone.View|Backbone.View[]}
         */
        get : function (key) {
            if (key.cid) {
                return this._subViewsByCid[key.cid] || this._subViewsByModelCid[key.cid];
            }
            if (key.indexOf('.') > -1 && this.dotNotation) {
                var segs = key.split('.'), view = this.parent;
                while (segs.length && view) { view = view.subs.get(segs.shift()); }
                return view;
            }

            return this._subViewSingletons[key] || this._subViewsByCid[key] ||
                this._subViewsByModelCid[key] || this._subViewsByType[key];
        },
        /**
         * Returns all views that match a type key, guarantees an array.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param {String} type
         * @return {Backbone.View[]}
         */
        getByType : function (type) {
            if (this._subViewsByType[type]) {
                return this._subViewsByType[type];
            }
            return (this._subViewSingletons[type]) ? [this._subViewSingletons[type]] : [];
        },
        /**
         * Get the subviews type or key
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param subview
         * @return {String|Number}
         */
        getSubViewType : function (subview) {
            subview = (subview instanceof View === true) ? subview : this.get(subview);
            return subview._subviewtype;
        },
        /**
         * Get the subview at a specific index, based on the order
         * that the subViews were added or a custom sorted order.
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @param  {Number} index The index of the sub view
         * @return {Backbone.View}
         */
        at: function (index) {
            return this.subViews[index];
        },
        /**
         * Clears the html in all locations specified in the subview configs
         * @memberOf SubViewManager#
         * @type {SubViewManager}
         * @return {SubViewManager}
         */
        clearLocations : function (type) {
            var confs = type ? _.pick(this.config, type) : this.config;
            _.each(confs, function (config) {
                this.parent.$(config.location).html('');
            }, this);
            return this;
        },
        _render : function (subViews, place, clearLocations) {
            var $appendTo,
                i = -1,
                len = subViews.length,
                location,
                $locations = {};
            if (place !== true) {
                $appendTo = place;
            }
            if (clearLocations) {
                this.clearLocations();
            }

            while (++i < len) {
                subViews[i].render();
                if ($appendTo) {
                    subViews[i].$el.appendTo((typeof $appendTo === 'string') ? this.parent.$($appendTo).first() : $appendTo);
                } else if (place && (location = this.config[this.getSubViewType(subViews[i])].location)) {
                    if (typeof location === 'string') {
                        if (!$locations[location]) {
                            $locations[location] = this.parent.$(location).first();
                        }
                        location = $locations[location];
                    } else if (typeof location === 'function') {
                        location = location.call(subViews[i]);
                        if (!(location instanceof Backbone.$)) { throw new Error('location function must return instance of jQuery'); }
                    }
                    location.append(subViews[i].$el);
                }
            }
            return this;
        },
        _addInstance : function (key, subViews, singleton) {
            var i = -1, len, self = this;

            key = key || '_svid_' + _.size(this.config);

            if (self._subViewSingletons[key]) { return self; }

            if (!_.isArray(subViews)) {
                subViews = [subViews];
            }

            len = subViews.length;

            if (!self.config[key] && subViews[0].constructor) {
                self.config[key] = {
                    options : subViews[0].options || {},
                    construct : subViews[0].constructor,
                    singleton : singleton
                };
            }

            singleton = (singleton === undefined) ? self.config[key].singleton : singleton;

            while (++i < len) {
                self._setInst(key, subViews[i], singleton);
            }
            return self;
        },
        _addConfig : function (config, name) {
            this.config[name] = config;
            if (this.autoInitSingletons && config.singleton) {
                return this._init(name);
            }
            return this;
        },
        _remove : function (subView, silent) {
            var i = -1,
                len = this.subViews.length,
                key = this.getSubViewType(subView),
                typeList = this.getByType(key);

            while (++i < len) {
                if (this.subViews[i].cid === subView.cid) {
                    this.subViews.splice(i, 1);
                    break;
                }
            }
            len = typeList ? typeList.length : 0;
            if (!this._subViewSingletons[key] && len) {
                for (i = 0; i < len; i++) {
                    if (typeList[i].cid === subView.cid) {
                        typeList.splice(i, 1);
                        break;
                    }
                }
            }

            delete this._subViewsByCid[subView.cid];
            if (subView.model && subView.model.cid && this._subViewsByModelCid[subView.model.cid]) {
                delete this._subViewsByModelCid[subView.model.cid];
            }

            if (this._subViewSingletons[key]) {
                delete this._subViewSingletons[key];
            }
            if (!silent) {
                return this.trigger('remove:' + key, subView);
            }
        },
        _setInst: function (key, instance, singleton, silent) {
            var modCid = (instance.model) ? instance.model.cid : null,
                viewsByModel = this._subViewsByModelCid;

            this.subViews.push(instance);
            this._subViewsByCid[instance.cid] = instance;
            if (!instance.parentView) { instance.parentView = this.parent; }
            instance._subviewtype = key;
            if (modCid) {
                if (viewsByModel[modCid]) {
                    if (!_.isArray(viewsByModel[modCid])) { viewsByModel[modCid] = [viewsByModel[modCid]]; }
                    viewsByModel[modCid].push(instance);
                } else {
                    this._subViewsByModelCid[modCid] = instance;
                }
            }

            singleton = (typeof singleton === 'boolean') ? singleton : this.defaultToSingletons;
            if (singleton) {
                this._subViewSingletons[key] = instance;
            } else {
                if (!this._subViewsByType[key]) { this._subViewsByType[key] = []; }
                this._subViewsByType[key].push(instance);
            }
            if (!silent) {
                return this.trigger('add', instance).trigger('add:' + key, instance);
            }
            return this;
        },
        _init: function (key, options, singleton) {
            var instance,
                config = this.config[key],
                Construct = (config && config.construct) ? config.construct : null;

            options = _.extend({}, config.options || {}, options || {});

            if (this._subViewSingletons[key]) {
                return this;
            }

            Construct = (typeof Construct === 'string') ? _stringToObj(Construct) : Construct;
            if (!Construct) {
                console.error('Construct for key "' + key + '" was not found', config ? config.construct : '');
            }
            instance = new Construct(options, this.parent);
            this._setInst(key, instance, (singleton !== undefined) ? singleton : config.singleton);
            return this;
        }
    };

    // Add underscore methods to SubViewManager (e.g. myView.subs.each(function (subView) { console.log(subView.cid); });)
    _.each(['each', 'map', 'initial', 'rest', 'last', 'first', 'find', 'filter', 'sortBy',
        'groupBy', 'where', 'findWhere', 'some', 'every', 'invoke', 'contains', 'max', 'min',
        'size', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'reject'], function (funcName) {
        /**
         * Partial applications of underscore (or lodash if you use that instead) functions 
         * of the same name (operates on the subViews array).
         * List of available underscore methods:
         * 'each', 'map', 'initial', 'rest', 'last', 'first', 'find', 'filter', 'sortBy',
         * 'groupBy', 'where', 'findWhere', 'some', 'every', 'invoke', 'contains', 'max', 'min',
         * 'size', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'reject'
         * @method underscore_methods
         * @memberOf SubViewManager#
         * @see http://underscorejs.org
         * @example
         * myBaseView.subs.each(function (subView) {
         *     console.log('A subView of myBaseView', subView);
         * });
         * @example
         * var view = myBaseView.subs.findWhere({ collection : testCollection });
         * view.collection === test.collection // returns true
         */
        SubViewManager.prototype[funcName] = function () {
            return _[funcName].apply(this, [this.subViews].concat(slice.call(arguments)));
        };
    });

    // Add Backbone.Events functionality to SubView manager instances
    _.extend(SubViewManager.prototype, Backbone.Events);

    // =====================================================
    // Backbone.BaseView

    /**
     * Adds some additional functionality to Backbone Views. Namely,
     * in the form of subView management. Access info and methods
     * to manipulate the '.subs' property.
     * @constructor Backbone.BaseView
     * @augments {Backbone.View}
     * @class Backbone.BaseView
     * @property subViews {Backbone.View[]} - Reference array of subViews generated by the '.subs' {@link SubViewManager}
     * @property subs {SubViewManager} - object specifically for manipulating subviews
     * @property subViewConfig      - A config map that can be automatically passed to the SubViewManager
     * @property autoInitSubViews   - any subviews that are singletons will be autoinitilized if true
     * @property singletonSubViews  - If subviews should default to being singletons when created
     * @property parentView         - if this is a subView of another dibLibs.BaseView, this will be a ref to that view instance
     */
    BaseView = View.extend({
        subViews: null,
        subs: null,
        // SubView Configuration Object
        // <key> : {
        //      construct: // Constructor function or string version (i.e. "Backbone.BaseView")
        //      options: // Any options you want to pass to the initialize function
        //      singleton: // if the object should be configured as a singleton or not
        //      location: // Useful for automatically placing the subviews element in it's parent
        //  }
        subViewConfig: null,
        // Any subviews that are singletons will be auto initialized if the below is true
        autoInitSubViews: false,
        // True if your subviews should default to singleton or not
        singletonSubViews: false,
        // If this is a subView of another Backbone.BaseView, this will be a ref to that view instance
        parentView: null,
        // Add events that will not bubble events up app the view's ancestor tree
        _stopPropogation: false,
        constructor: function (options, parentView) {
            var subViewCfg = (options && options.subViewConfig) ?
                    _.result(options, 'subViewConfig') : _.result(this, 'subViewConfig');
            // Assign a parentView if second param is a Backbone View
            this.parentView = (parentView instanceof View) ? parentView : null;
            this.subs = new SubViewManager(null, this, {
                autoInitSingletons: this.autoInitSubViews,
                defaultToSingletons: this.singletonSubViews
            });
            if (subViewCfg) {
                this.subs.addConfig(subViewCfg);
            }
            this.subViews = this.subs.subViews;
            BaseView.__super__.constructor.call(this, options);
            // To maintain parity with how Backbone handles the 'events'
            // property on a view, we will overwrite the 'viewEvents'
            // property on the prototype with options.viewEvents if it
            // exists
            this.viewEvents = options && options.viewEvents ? options.viewEvents : this.viewEvents;
            if (this.viewEvents) {
                this.bindViewEvents();
            }
        },
        /**
         * Place the view DOM element ('.el') in a specified location. By
         * default it is appended to the location.
         * @memberOf Backbone.BaseView#
         * @param {jQuery} $location jQuery DOM element
         * @param {boolean} [replace] 
         *        True if you want to replace existing html
         *        of the location with this view
         * @return {Backbone.BaseView}
         */
        place: function ($location, replace) {
            if (typeof $location === "string") {
                var $parent = (this.parentView) ? this.parentView.$el : Backbone.$('body');
                $location = $parent.find($location);
            }

            if (replace) {
                $location.html(this.el);
                return this;
            }
            $location.append(this.el);
            return this;
        },
        /**
         * Stops the current event from propagating up or down the 
         * ancestor tree of BaseView instances. Resets immediately
         * after stopping the event, and has to be callled every 
         * time you want an event to be stopped.
         * @memberOf Backbone.BaseView#
         * @return {Backbone.BaseView}
         */
        stopEvent: function () {
            this._stopPropogation = true;
            return this;
        },
        /**
         * Like Backbone.trigger, except that this will not only use trigger
         * on the instance this method is invoked on, but also the instance's
         * 'parentView', and the parentView's parentView, and so on.
         * Additional arguments beyond the event name will be passed
         * as arguments to the event handler functions. The view that
         * originated the bubbling event will automatically be tacked
         * on to the end of the arguments, so you can access it if needed.
         * @memberOf Backbone.BaseView#
         * @param {String} event The name of the event
         * @param {...Mixed} [arg] Argument be passed to event callbacks
         * @return {Backbone.BaseView}
         */
        triggerBubble: function (event) {
            var args = slice.call(arguments, 1),
                anscestor;
            args.unshift(event);
            args.push(this);
            anscestor = this;
            while (anscestor) {
                anscestor.trigger.apply(anscestor, args);
                if (anscestor._stopPropogation) {
                    anscestor._stopPropogation = false;
                    return this;
                }
                anscestor = anscestor.parentView;
            }
            return this;
        },
        /**
         * Triggers an event that will trigger on each of the instances
         * subViews, and then if a subView has subViews, will trigger the
         * event on that subViews' subViews, and so on. If a subView
         * calls stopEvent and passes the event name, then the event
         * will not trigger on that subViews' subViews. Arguments
         * work in the same manner as they do with triggerBubble.
         * @memberOf Backbone.BaseView#
         * @param {String} event The event name
         * @param {...Mixed} [arg] Argument be passed to event callbacks
         * @return {Backbone.BaseView}
         */
        triggerDescend: function (event) {
            var args = slice.call(arguments, 1),
                _trigger = function (subViews) {
                    var i = -1,
                        len = subViews.length,
                        subSubs,
                        descend;
                    while (++i < len) {
                        descend = true;
                        subViews[i].trigger.apply(subViews[i], args);
                        if (subViews[i]._stopPropogation) {
                            subViews[i]._stopPropogation = false;
                            descend = false;
                        }
                        subSubs = subViews[i].subViews;
                        if (descend && subSubs && subSubs.length) {
                            _trigger(subSubs);
                        }
                    }
                };
            args.unshift(event);
            args.push(this);
            _trigger([this]);
            return this;
        },
        /**
         * Get the first ancestor that matches a type.
         * @memberOf Backbone.BaseView#
         * @param {String} type 
         *        The subView 'type' the ancestor should match. The
         *        first ancestor with this type will be returned
         * @return {null|Backbone.View}
         */
        findAncestor: function (type) {
            var ancestor = this;
            while (ancestor.parentView) {
                ancestor = ancestor.parentView;
                if (ancestor && type && type === ancestor._subviewtype) {
                    return ancestor;
                }
            }
            return null;
        },
        /**
         * Return the subview type if this view a subview and was a assigned a
         * type.
         * @memberOf Backbone.BaseView#
         * @return {string|number} The subview type
         */
        getSubViewType: function () {
            return this._subviewtype;
        },
        /**
         * Returns the top of the subView hierarchy.
         * @memberOf Backbone.BaseView#
         * @return {Backbone.View}
         */
        getTopView : function () {
            var ancestor = this;
            while (ancestor.parentView) {
                ancestor = ancestor.parentView;
            }
            return ancestor;
        },
        /**
         * Returns true if this view has no ancestors
         * @memberOf Backbone.BaseView#
         * @return {boolean}
         */
        isTopView : function () {
            return !this.parentView;
        },
        /**
         * Like delegateEvents, except that instead of events being bound to el, the
         * events are backbone events bound to the view object itself. You can create
         * a 'viewEvents' object literal property on a View's prototype, and when it's
         * instantiated, the view will listen for events on a Backone object based on
         * the key.
         *
         * For example { 'change model': 'render' } would listen for a 'change'
         * event on the view's model property and then call view's render method.
         * If you only specify an event name and leave the property out of the key,
         * then the event will be bound to the view instance directly. For example,
         * { 'submit' : 'render' } would call the render method of the view when
         * a 'submit' event occurs on the view.
         * @memberOf Backbone.BaseView#
         * return {Backbone.BaseView}
         */
        bindViewEvents: function (events) {
            events = events || _.result(this, 'viewEvents');
            _.each(events, function (func, event) {
                var segs = event.split(' '),
                    listenTo = (segs.length > 1) ? this[segs[1]] : this;
                func = _.isFunction(func) ? func : this[func];
                if (listenTo) {
                    this.stopListening(listenTo, segs[0], func);
                    this.listenTo(listenTo, segs[0], func);
                }
            }, this);
            return this;
        }

    });

    Backbone.BaseView = BaseView;

}(this));
