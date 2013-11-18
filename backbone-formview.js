//     Backbone.FormView 0.3

//     (c) 2013 James Ballantine, 1stdibs.com Inc.
//     Backbone.FormView may be freely distributed under the MIT license.
//     For all details and documentation:
//     https://github.com/1stdibs/backbone-base-and-form-view

/*global Backbone, jQuery, _, window */
(function ($, Backbone, _) {
    "use strict";

    if (!Backbone || !Backbone.BaseView) {
        throw new Error('Backbone and Backbone.BaseView required');
    }

    var
        // Local copies
        Model = Backbone.Model,
        Collection = Backbone.Collection,
        each = _.each,
        extend = _.extend,
        defaults = _.defaults,
        clone = _.clone,
        isUndefined = _.isUndefined,
        isFunction = _.isFunction,
        isArray = _.isArray,
        result = _.result,

        // Form Disable Mixin -- added to FormView prototype's
        // in order to allow disabling and enabling fields.
        formViewDisableMixin = {
            /**
             * Disables the form by invoking the disable method
             * on all fields that implement it. If a field doesn't
             * implement this method, it will not be disabled.
             * @memberOf dibsLibs.FormView#
             * @returns {dibsLibs.FormView}
             */
            disable: function () {
                this.subs.each(function (field) {
                    if (isFunction(field.disable)) { field.disable(); }
                });
                return this;
            },
            /**
             * The reverse of disable, naturally. Invokes enable method
             * on all fields and field sets.
             * @memberOf dibsLibs.FormView#
             * @returns {dibsLibs.FormView}
             */
            enable: function () {
                this.subs.each(function (field) {
                    if (isFunction(field.enable)) { field.enable(); }
                });
                return this;
            }
        },

        /**
         * Used by the FieldSet and CollectionFieldSet function
         * @return {string} A prefix for a field name/id
         */
        getFieldPrefix = function () {
            var prefPref = (this.parentView && this.parentView.getFieldPrefix) ? this.parentView.getFieldPrefix() : '';
            return prefPref + this.fieldSetName + '-';
        },

        // ------------------------
        // Local utility functions

        // Utility function to help find submodels and sub collections in _setupSubViewConfig
        strTo = function (string, obj, instOf) {
            if (string instanceof instOf) {
                return string;
            }
            if (string === true && obj instanceof instOf) {
                return obj;
            }
            if (!obj) { return null; }
            obj = obj.get(string);
            if (obj instanceof instOf) {
                return obj;
            }
            return null;
        },
        // Utility function used by FormView to determine what model the options object should use.
        // Looks to see if options.model is already a Backbone Model, but if its a string, tries to find
        // sub model of the parent model. If that doesn't work, uses the parent model. If the options
        // doesn't specify a model to use, then we do the same thing with the schema key (the field key)
        getSubModel = function (optionModel, key, model) {
            return optionModel ? (strTo(optionModel, model, Model) || model) : strTo(key, model, Model) || model;
        },
        // Similar to getSubModel except for collections and does not pass the parent collection if no option
        // collection is specified and the schema key cannot locate a sub collection, then null is returned
        getSubCollection = function (optionCollection, key, model, collection) {
            if (optionCollection) {
                return strTo(optionCollection, model, Collection) || collection;
            }
            return strTo(key, model, Collection) || null;
        };


    // ======================================================================================
    // FORM VIEW
    // ======================================================================================

    /**
     * An extension of {@link Backbone.BaseView} that lets you set up a form easily by making 
     * subviews automatically using a 'schema' and defining a framework to let you create elaborate 
     * forms with less code. You can define a schema by extending this view and specifying a 'schema'
     * prototype property, or by passing a 'schema' option when you initialize the view.
     * @constructor Backbone.FormView
     * @class Backbone.FormView
     * @extends Backbone.BaseView
     *
     * @property {Object} [options] - Options that you can pass to init or add as properties on extended view
     * @property {String} [options.templateSrc]
     *      An underscore formatted template string. In order for the FormViews render
     *      method to work, the template requires a data-fields attribute to be set
     *      on an element in the template. This element will serve as a wrapper
     *      for all the subViews that will be generated on render.
     * @property {String} [options.template] an underscore template function
     * @property {Object} [options.schema] 
     *           Schema to use to create form fields automatically on render (or initialization
     *           if setupOnInit is true)
     * @property {Boolean} [options.setupOnInit]
     *      The schema will be used to set up all subView (the fields) instances by
     *      default when the FormView's render method is invoked, but unless setupOnInit
     *      is true, and instead the instances are created when initialize is called. If
     *      this is false, you can still setup the subViews anytime by invoking the
     *      setupFields method.
     * @property {String[]} [options.fieldOrder]
     *      Should represent the order that you want the fields to be rendered in,
     *      otherwise they will be rendered in the order they appear in the schema.
     *      Each index should match a key defined in your schema.
     * @property {Object} [options.templateVars]
     *      an object of variables that will be passed to the template
     * @property {Boolean} [options.autoUpdateModel]
     *      The FormView is designed to work with nested model and collection
     *      paradigms seen in frameworks like BackboneRelational. Some of
     *      these frameworks will recreate models and collections when the top
     *      level model syncs with the server or the user sets a new model
     *      on the property manually, so passing 'true' here will have the
     *      form view try to automatically change the model properties of
     *      the fields and fieldsets to use the correct model based on 
     *      the top level form model.
     * @property {Boolean} [options.twoWay] 
     *      If the fields support it (which the default fields do), then when
     *      a model is updated, and not by the field, then the field will
     *      automatically re-render the input to display the updated value
     *      to the user.
     *
     * @example
     * // schema object that can be a property on the view or an option passed to the form
     * schema : {
     *      // The schema key
     *      fieldname: {
     *         type: 'Text',
     *
     *         // The options object is passed to the Field View on init.
     *         // Some options are added automatically.
     *         options: {
     *             // If you don't specify a model, the parent's model (ie the form views model)
     *             // will be passed automatically, or if a submodel is found that matches
     *             // 'fieldname', that will be retrieved automatically
     *             model: subModelName
     *
     *             // Works in a similar way as the model property does, except that if
     *             // no collection string/instance is provided, and no sub collection
     *             // matching 'fieldname' attached to the parent model, then no collection
     *             // will be attached to the subView
     *             collection: subCollectionName
     *
     *             // if the 'type' is view that is an instance FormView (e.g. FieldSet)
     *             // then you can pass a schema as an option and then the formView will
     *             // recursively setup the schema for that FormView fieldset as well
     *             schema: {
     *                 // Fieldset fields
     *             }
     *
     *             ... // Other options you would like to pass to the type upon init
     *         }
     *     },
     *     ... // Other field schemas
     * }
     * 
     */
    Backbone.FormView = Backbone.BaseView.extend({
        tagName: 'form',
        className: 'form-horizontal',
        fieldAlias: {
            'Text' : 'Backbone.fields.FieldView',
            'RadioList' : 'Backbone.fields.RadioListView',
            'CheckList' : 'Backbone.fields.CheckListView',
            'Select' : 'Backbone.fields.SelectListView',
            'FieldSet' : 'Backbone.FieldSetView',
            'Checkbox' : 'Backbone.fields.CheckBoxView',
            'CollectionField' : 'Backbone.CollectionFieldSetView'
        },
        templateSrc: '<div data-fields=""></div>',
        fieldsWrapper: '[data-fields]:first',
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            var schema = options.schema || this.schema,
                setUpOnInit = !isUndefined(options.setupOnInit) ? options.setupOnInit : this.setupOnInit;
            this.subs.autoInitSingletons = true;
            extend(this, {
                templateSrc : options.templateSrc || this.templateSrc,
                templateVars : defaults(options.templateVars || this.templateVars || {}, { label: options.label }),
                setupOnInit : options.setupOnInit || this.setupOnInit,
                validateOnSet : (!isUndefined(options.validateOnSet)) ? options.validateOnSet : this.validateOnSet,
                twoWay: (!isUndefined(options.twoWay)) ? options.twoWay : this.twoWay,
                autoUpdateModel: (!isUndefined(options.autoUpdateModel)) ? options.autoUpdateModel : this.autoUpdateModel
            });
            this.template = options.template || _.template(this.templateSrc);
            this.subViewConfig = options.subViewConfig || null;
            if (schema) {
                this.setSchema(schema);
                if (setUpOnInit) { this.setupFields(); }
            }
            if (this.autoUpdateModel) {
                this._setupAutoUpdate();
            }
        },
        /**
         * Set a new schema for the form.
         * @memberOf Backbone.FormView#
         * @param {Object} schema
         * @return {Backbone.FormView}
         */
        setSchema: function (schema) {
            this.schema = schema || this.schema;
            return this;
        },
        /**
         * Creates the subViewConfig property, derived from the
         * form's schema. The subViewConfig is like the schema
         * but fleshed out for the baseView's subView manager.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        setupFields: function () {
            this.subViewConfig = this._setupSubViewConfig(result(this, 'schema'));
            this.subs.addConfig(this.subViewConfig);
            return this;
        },
        /**
         * If your form is not automatically setting model
         * properties when the user exits a field, you can
         * use this method to set the values on the model
         * from the inputs all at once.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        setModelAttrs: function () {
            this.subs.invoke('setModelAttrs');
            return this;
        },
        /**
         * Get the wrapper for the field subView elements
         * @memberOf Backbone.FormView#
         * @return {$} 
         */
        getFieldsWrapper: function () {
            var $wrapper = this.$(this.fieldsWrapper);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * If your subviews (aka the fields) set in the schema aren't setup yet, then this method
         * does that. Regardless, this method renders the shell template, and then renders all
         * subViews. If your template has an element with data-fields defined, the fields will be
         * appended to that. Otherwise they will be directly appended to the template.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        render : function () {
            var order = this.options.fieldOrder || this.fieldOrder;

            if (!this.subViewConfig) {
                this.setupFields();
            }
            this.$el.html(this.template(this.templateVars));

            if (order && order.length) {
                order = order.slice(0);
                while (order.length) {
                    this.subs.renderByKey(order.shift(), { useLocation: true });
                }
            } else {
                this.subs.renderAppend();
            }
            return this;
        },
        /**
         * Loops through each field and fieldset in the form and makes sure that
         * they have the correct model based on the top level model. Only necessary
         * if Form utitlizes a nested model paradigm and something might cause
         * the field models to not be correct (ie if a nested model was changed but
         * a field that should that nested model is using one that is out of date).
         * NOTE: Events are not copied when you use this method. It is strongly
         * recommended that if you need your subview models to be switched out
         * that you reinstantiate the FormView, because that is the best way to 
         * functionality remains.
         * @memberOf Backbone.FormView#
         * @return {Backbone.FormView}
         */
        resetModels: function () {
            var subModel, newModel, collection, key, schemaOptions, hasChanged,
                i = 0,
                subViews = this.subViews,
                subsByMod,
                len = subViews.length;
            for (i; i < len; i++) {
                hasChanged = false;
                key = this.subs.getSubViewType(subViews[i]);
                schemaOptions = this.schema[key].options || {};
                subModel = subViews[i].model;
                newModel = getSubModel(schemaOptions.model, key, this.model);
                if (subModel && newModel && newModel.cid !== subModel.cid) {
                    subViews[i].model = newModel;
                    subsByMod = this.subs._subViewsByModelCid;
                    if (subsByMod[newModel.cid]) {
                        if (isArray(subsByMod[newModel.cid])) { subsByMod[newModel.cid].push(subViews[i]);
                            } else { subsByMod[newModel.cid] = [subsByMod[newModel.cid], subViews[i]];  }
                    } else { subsByMod[newModel.cid] = subViews[i]; }
                    hasChanged = true;
                }
                collection = getSubCollection(schemaOptions.collection, key, this.model, this.collection);
                if (collection && subViews[i].collection instanceof Collection && subViews[i].collection !== collection) {
                    subViews[i].collection = collection;
                    hasChanged = true;
                }
                if (hasChanged && subViews[i] instanceof Backbone.BaseView) { subViews[i].bindViewEvents(); }
                if (subViews[i] instanceof Backbone.FormView) { subViews[i]._resetModels(); }
            }
            return this;
        },
        _setupSubViewConfig: function (baseSchema, model, collection) {
            var options,
                collec,
                schema,
                self = this,
                subViewConfig = {};

            model = model || this.model;
            collection = collection || this.collection;

            each(baseSchema, function (origSchema, key) {
                schema = subViewConfig[key] = clone(origSchema);
                schema.options = (isFunction(origSchema.options)) ? origSchema.options.call(this) : clone(origSchema.options || {});
                options = schema.options = schema.options || {};
                schema.singleton = (schema.singleton === undefined) ? true : schema.singleton;
                schema.construct = self.fieldAlias[schema.type || schema.construct] || schema.type || schema.construct;
                schema.location = schema.location || self.fieldsWrapper;
                options.model = getSubModel(options.model, key, model);
                if (this.validateOnSet) { options.setOpts = defaults(options.setOpts || {}, { validate: true }); }
                if (this.twoWay) { options.twoWay = (!isUndefined(options.twoWay)) ? options.twoWay : this.twoWay; }
                collec = getSubCollection(options.collection, key, model, collection);
                if (collec) { options.collection = collec; }
                if (options.schema) {
                    options.subViewConfig = self._setupSubViewConfig(options.schema, options.model);
                }
                options.schemaKey = key;
            }, this);
            return subViewConfig;
        },
        _setupAutoUpdate: function () {
            this.model.on('change', function (changedAttrs) {
                each(changedAttrs, function (value) {
                    if (value instanceof Model) { this.resetModels(); }
                }, this);
            }, this);
            return this;
        }
    }, {
        /**
         * Add a Field Alias to the list of field aliases. For example
         * You have a view constructor DateFieldView and you want to 
         * make it easy to put that field in a schema, you can use this
         * static function to add an allias 'Date' for that constructor
         * @memberOf Backbone.FormView
         * @param {String} alias     Name of the alias
         * @param {String|Function} construct Constructor used for the field
         */
        addFieldAlias: function (alias, construct) {
            var aliases = {}, currAliases = Backbone.FormView.prototype.fieldAlias;
            if (construct) {
                aliases[alias] = construct;
            } else { aliases = alias; }
            defaults(currAliases, aliases);
        }
    });

    // Add disable/enable functionality
    extend(Backbone.FormView.prototype, formViewDisableMixin);

    // ====================================================
    // CollectionFormView

    // CollectionFormRowView - used by CollectionFormView for each row
    Backbone.CollectionFormRowView = Backbone.FormView.extend({
        className: 'form-field-row controls-row',
        tagName: 'div',
        getFieldPrefix: function () {
            var parentPref = '';
            if (this.parentView && this.parentView.getFieldPrefix) {
                parentPref = this.parentView.getFieldPrefix(this) || '';
            }
            return parentPref + this.options.index  + '-';
        }
    });


    /**
     * Similar to Backbone.FormView, except that this form view will iterate
     * over a collection and will produce a row for each model in the collection.
     * Each field in your schema will get a subView for each model in the collection.
     * @constructor Backbone.CollectionFormView
     * @extends Backbone.BaseView
     * @class Backbone.CollectionFormView
     * @property {Backbone.Collection} collection A Backbone.Collection used to create rows
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.templateSrc] 
     *        The string used as a basis for an underscore template
     * @property {object} [options.rowOptions]
     *        Options to pass to each row when they are initialized
     * @property {object} [options.rowSchema]
     *        The form schema to use for each row
     * @property {object} [options.rowConfig] 
     *        Instead of using the rowOptions and rowSchema option,
     *        you can define a rowConfig object which works like a BaseView
     *        {@link SubViewManager} config. Here you can define a constructor
     *        as well to use for the row views, in addition to the schema and 
     *        options.
     * @property {object} [options.templateVars] 
     *        Object to use for template variables for the template that
     *        wraps each of the collection form rows. To pass a template
     *        that is used for each row, use rowOptions.templateSrc
     * @property {boolean} [options.setupOnInit]
     *        True will initialize the row views for each model in the 
     *        collection. False means the view will wait until render 
     *        or setupRows is called.
     * 
     */
    Backbone.CollectionFormView = Backbone.BaseView.extend({
        tagName: 'form',
        className: 'form',
        rowTemplateSrc: '',
        rowWrapper : '[data-rows]:first',
        rowConfig: {
            singleton: false,
            construct: Backbone.CollectionFormRowView
        },
        initialize: function (options) {
            this.options = defaults(options || {}, this.options);
            this.templateSrc = !isUndefined(this.options.templateSrc) ? this.options.templateSrc : this.templateSrc;
            this.template = this.options.template || this.template || _.template(this.templateSrc || '');
            this.setupOnInit = !isUndefined(this.options.setupOnInit) ? this.options.setupOnInit : this.setupOnInit;
            this.rowOptions = this.options.rowOptions || this.rowOptions;
            this.templateVars = defaults(this.options.templateVars || {}, { label: this.options.label });
            if (this.options.rowConfig) {
                this.rowConfig = this.options.rowConfig;
                this.rowConfig = result(this, 'rowConfig');
            } else {
                var rowOpts = extend({}, result(this, 'rowOptions'), {
                    schema : this.options.rowSchema || this.rowSchema ||
                        ((this.rowConfig && this.rowConfig.options) ? this.rowConfig.options.schema : null)
                });
                this.rowConfig.options = rowOpts;
            }
            this.subs.addConfig('row', this.rowConfig);
            if (this.setupOnInit) {
                this.setupRows();
            }
        },
        /**
         * Set the schema used for each row.
         * @memberOf Backbone.CollectionFormView#
         * @param {object} [schema]
         * @return {Backbone.CollectionFormView}
         */
        setRowSchema: function (schema) {
            if (!this.rowConfig.options) { this.rowConfig.options = {}; }
            this.rowConfig.options.schema = schema || this.options.rowSchema || this.rowSchema;
            return this;
        },
        /**
         * Like Backbone.FormView.render, except that each a subView will be rendered
         * for each field in the schema and for each model in the collection.
         * Each model in the collection will have a 'row' associated with it,
         * and each row will contain each of the fields in the schema.
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        render: function () {
            this.$el.html(this.template(this.templateVars));
            if (!this.subs.get('row') || !this.subs.get('row').length) {
                this.setupRows();
            }
            this.subs.renderByKey('row', { appendTo: this.getRowWrapper() });
            return this;
        },
        /**
         * Get the wrapper element that the rows will be appended to
         * @memberOf Backbone.CollectionFormView#
         * @return {$} 
         */
        getRowWrapper: function () {
            var $wrapper = this.$(this.rowWrapper);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * Add a row or row to the CollectionFormView. If you do not
         * pass a model, one will be created from the collection.model
         * property constructor. The model(s) will then be tied
         * to the new row(s).
         * @memberOf Backbone.CollectionFormView#
         * @param  {Backbone.Model|Backbone.Model[]} 
         *         [models] A model or array of models to add rows for.
         * @return {Backbone.CollectionFormView}
         */
        addRow: function (models) {
            var added;
            models = models || new this.collection.model();
            if (!isArray(models)) {
                models = [models];
            }
            added = this.collection.add(models);
            // Backbone 1.0.0 does not return the added models,
            // so we will not set the models var to the return val
            if (!(added instanceof Backbone.Collection)) {
                models = added;
            }
            each(models, function (model) {
                this._addRow(model).subs.last().render().$el
                    .appendTo(this.getRowWrapper());
            }, this);
            return this;
        },
        /**
         * Removes a row or rows from the CollectionFormView and 
         * corresponding collection.
         * @memberOf Backbone.CollectionFormView#
         * @param  {Backbone.Model|Backbone.View|Backbone.View[]|Backbone.Model[]} obj
         *         Used to find models in the collection and views in the subViewManager
         *         and remove them.
         * @return {Backbone.CollectionFormView}
         */
        deleteRow : function (obj) {
            var model = (obj instanceof Model) ? obj : null,
                view = (!model && obj instanceof Backbone.View) ? obj : null,
                arr = (!model && !view && isArray(obj)) ? obj : null;

            if (arr) {
                each(arr, this.deleteRow, this);
                return this;
            }

            if (!view) {
                view = this.subs.get(model);
            } else if (!model) {
                model = view.model;
            }

            this.subs.remove(view);
            this.collection.remove(model);
            return this;
        },
        /**
         * Shortcut method to remove all rows and then
         * set them up again, render them, and place
         * them in the row wrapper
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        reset: function () {
            this.setupRows().subs.renderByKey('row', { appendTo: this.getRowWrapper() });
        },
        /**
         * When you are ready to set up your rows (ie initialize
         * each Row view instance based on the collection
         * @memberOf Backbone.CollectionFormView#
         * @return {Backbone.CollectionFormView}
         */
        setupRows: function () {
            this.subs.remove('row');
            this.collection.each(this._addRow, this);
            return this;
        },
        _addRow: function (model) {
            var row = this.subs
                    .add('row', this._getRowOptions(model))
                    .last();
            row.setSchema(this.rowSchema).setupFields();
            return this;
        },
        _getRowOptions: function (model) {
            return { model: model, index: this.subViews.length };
        }
    });

    // Add disable/enable functionality
    extend(Backbone.CollectionFormView.prototype, formViewDisableMixin);

    // =====================================================================
    // FIELD SUBVIEWS
    // =====================================================================

    // Below are field sub views that are used for common form
    // field types (e.g. text input, radio button, dropdown list)

    // ===================================================
    // Field Template

    Backbone.formTemplates = Backbone.formTemplates || {};

    // This is shell form template used for most of the standard form fields.
    // You can easily substitute your own by doing the following after loading
    // this file: Backbone.formTemplates.Field = $('#template-id').html();
    // Note that it uses bootstrap.css classes by default.
    Backbone.formTemplates.Field =
        '<% if (obj.label) { %><label class="control-label" ' +
            '<% if (obj.inputId) { %> for="<%= obj.inputId %>" <% } %> >' +
            '<%= obj.label %></label><% } %>' +
            '<div class="controls" data-input="">' +
            '</div>' +
            '<div class="controls">' +
            '<div class="text-error" data-error=""></div>' +
            '<% if (obj.help) { %><span class="help-block"><%= obj.help %></span><% } %>' +
            '</div>';

    Backbone.fields = Backbone.fields || {};

    // ===================================================
    // fields.FieldView

    /**
     * The base form field type, can be used to create a basic text input/textarea
     * Form field. By default it automatically set's the value of the form field
     * on the model when the blur event occurs. Use 'Text' alias in schema
     * to create fields with this contsructor.
     * 
     * @constructor Backbone.fields.FieldView
     * @extends Backbone.BaseView
     * @class Backbone.fields.FieldView
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] 
     *           The attribute on the model that this field is linked to. If not provided, this
     *           will default to the schemaKey.
     * @property {boolean} [options.addId] 
     *           Add an id to the input element. This is taken from the inputId property or autoGenerated
     *           based on the schemaKey of this field.
     * @property {string} [options.elementType] 'input' or 'textarea' (Defaults to 'input')
     * @property {string} [options.templateSrc] String underscore template source
     * @property {function} [options.template] Underscore template function (not used if templateSrc is defined)
     * @property {object} [options.templateVars] Variables to pass to the template on render
     * @property {string} [options.inputId] The id of the field to use (if undefined, one is created automatically)
     * @property {string} [options.inputClass] The class attribute you would like to set on the field input
     * @property {object} [options.inputAttrs] Object with attributes to set on the input element
     * @property {object} [options.setOpts] Options you would like to pass when model.set is called (e.g. silent, validate)
     * @property {string} [options.placeholder] Placeholder text for the input
     * @property {boolean} [options.twoWay]
     *      If you would like this field to re-render the input when model is updated by something other
     *      than this view, in addition to the normal behavior of the view updating the model
     */
    Backbone.fields.FieldView = Backbone.BaseView.extend({
        tagName: 'div',
        classDefaults: 'control-group form-field',
        inputPrefix: 'field-input-',
        fieldPrefix: 'form-field-',
        template: _.template(Backbone.formTemplates.Field),
        addId: true,
        elementType: 'input',
        inputWrapper: '[data-input]:first',
        events: function () {
            var events = {};
            events['blur ' + this.elementType] = 'setModelAttrs';
            return events;
        },
        initialize: function (options) {
            options = this.options = defaults(options || {}, this.options);
            extend(this, {
                templateVars : options.templateVars || this.templateVars || {},
                fieldName : options.fieldName || options.schemaKey,
                elementType : options.elementType || this.elementType,
                templateSrc : !isUndefined(options.templateSrc) ? options.templateSrc : this.templateSrc,
                template : options.template || this.template,
                setOpts : defaults(options.setOpts || {}, this.setOpts),
                twoWay : !isUndefined(options.twoWay) ? options.twoWay : this.twoWay,
                inputAttrs: options.inputAttrs || this.inputAttrs,
                placeholder: options.placeholder || this.placeholder,
                inputClass: options.inputClass || this.inputClass,
                addId: !isUndefined(options.addId) ? options.addId : this.addId
            });
            extend(this.templateVars, {
                inputId : this.addId ? this._getInputId() : false,
                help : options.help,
                fieldName : this.fieldName,
                label : options.label
            });
            this.template = this.templateSrc ? _.template(this.templateSrc) : this.template;
            // Add a class name based on the field name if a custom class name wasn't specified
            if (!options.className || !this.className) {
                this.$el.addClass(this.fieldPrefix + this.fieldName);
            }
            this.$el.addClass(this.classDefaults).attr('data-field', '');

            // If the twoWay option is true, then setup the events to make the field/model-attribute changes twoWay
            if (this.twoWay && this.setupTwoWay) {  this.setupTwoWay(); }
        },
        /**
         * Sets up two way updating. The view updates the model by default, and this
         * function will update the view on a model change (unless it was done by the view)
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        setupTwoWay: function () {
            this.listenTo(this.model, 'change:' + this.fieldName, function () {
                if (!this._viewChangedModel) { this.renderInput(); }
                this._viewChangedModel = false;
            });
            return this;
        },
        /**
         * Return an object of attributes as they should appear in the model
         * @memberOf Backbone.fields.FieldView#
         * @return {Object}
         */
        getAttrs: function () {
            var attrs = {};
            attrs[this.fieldName] = this.getValue();
            return attrs;
        },
        /**
         * This method should get the value or values of the form
         * field and then set that value/values on the model
         * in the corresponding attribute(s)/field name(s). If
         * there is a setOpts object on the fieldView instance,
         * then use that as the options passed to Backbone.Model's
         * 'set' method.
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        setModelAttrs: function () {
            this._viewChangedModel = true;
            if (!this.model.set(this.getAttrs(), this.setOpts)) { this._viewChangedModel = false; }
            return this;
        },
        /**
         * Get the value of the form field.
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getValue: function () {
            return $.trim(this.$(this.elementType).val());
        },
        /**
         * Gets the value of the field as it appears in the model
         * @memberOf Backbone.fields.FieldView#
         * @return {String|Boolean|Array|Number|Object}
         */
        getModelVal: function () {
            return this.model.get(this.fieldName);
        },
        /**
         * Renders the basic shell template for the form field and then
         * creates the input or textarea element, which gets appended
         * to the elem in the shell template found through the
         * {@link Backbone.fields.FieldView#getInputWrapper} method
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        render: function () {
            return this.renderWrapper().renderInput();
        },
        /**
         * Renders the wrapper that contains the field input
         * @param {object} [vars] Variables to pass to wrapper template
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        renderWrapper: function (vars) {
            this.$el.html(this.template(vars || this.templateVars));
            return this;
        },
        /**
         * Renders the field input and places it in the wrapper in
         * the element with the 'data-input' attribute
         * @memberOf Backbone.fields.FieldView#
         * @return {Backbone.fields.FieldView}
         */
        renderInput: function () {
            var $input,
                id = this.templateVars.inputId,
                attrs =  this.addId ? { id : id, name: id } : {},
                modelVal = this.getModelVal();
            $input = $('<' + this.elementType + '>');
            if (this.elementType === 'input') { attrs.type = 'text'; }
            if (this.placeholder) { attrs.placeholder = this.placeholder; }
            $input.attr(defaults(attrs, this.inputAttrs));
            if (this.inputClass) { $input.addClass(this.inputClass); }
            this.getInputWrapper().html($input);
            if (modelVal) { $input.val(modelVal); }
            return this;
        },
        /**
         * Get the element that wraps the input. Looks for element
         * with data-input attribute. If not found, it will return this.$el
         * @memberOf Backbone.fields.FieldView#
         * @return {$}
         */
        getInputWrapper: function () {
            var $wrapper = this.$(this.inputWrapper);
            if (!$wrapper.length) {
                return this.$el;
            }
            return $wrapper.first();
        },
        /**
         * Disable the input if not already disabled
         * @memberOf dibsLibs.FormFieldView#
         * @returns {dibsLibs.FormFieldView}
         */
        disable: function () {
            var $input = this.$(this.elementType);
            if (!this.isDisabled && !$input.attr('disabled')) {
                $input.attr('disabled', true);
                this.isDisabled = true;
            }
            return this;
        },
        /**
         * Enable the input if disabled by the 'disable' method
         * @memberOf dibsLibs.FormFieldView#
         * @returns {dibsLibs.FormFieldView}
         */
        enable: function () {
            if (this.isDisabled) {
                this.$(this.elementType).removeAttr('disabled');
                this.isDisabled = false;
            }
            return this;
        },
        _getInputId : function () {
            return this.options.inputId || this.inputId ||
                this.inputPrefix + this._getParentPrefix() + this.fieldName;
        },
        /**
         * If the parent FormView/FieldSetView defines a 'getFieldPrefix'
         * function, it can be used to construct the input id, name
         * attribute, and class attributes
         * @return {string}
         * @private
         */
        _getParentPrefix: function () {
            if (this.parentView && this.parentView.getFieldPrefix) {
                return this.parentView.getFieldPrefix(this) || '';
            }
            return '';
        }
    });

    // ====================================================
    // FormRadioListView

    /**
     * Like Backbone.fields.FieldView, except it creates a list of radio buttons. Designed to
     * work with model fields that have only one value out of a fixed set of values. Use
     * 'RadioList' alias in form schema to create a field with this constructor.
     *
     * @augments {Backbone.fields.FieldView}
     * @constructor Backbone.fields.RadioListView
     * @class Backbone.fields.RadioListView
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object} [options.inputAttrs] inherited from Backbone.fields.FieldView
     * @property {object|function} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Each key will be
     *      what is set in the model when the user selects the radio, and each value is what
     *      will be used as the label text to display to the user.
     *
     */
    Backbone.fields.RadioListView = Backbone.fields.FieldView.extend({
        tagName: 'div',
        events : {
            'click input:radio' : 'setModelAttrs'
        },
        type: 'radio-list',
        initialize: function (options) {
            options = options || {};
            this.possibleVals = options.possibleVals || this.possibleVals || {};
            Backbone.fields.RadioListView.__super__.initialize.call(this, options);
        },
        /**
         * Get the value of the radio list. Looks for a checked radio input
         * and gets the value attribue of that input.
         * @memberOf Backbone.fields.RadioListView#
         * @return {string}
         */
        getValue: function () {
            return this.$(this.elementType + ':checked').val();
        },
        /**
         * Renders the radio inputs and appends them to the input wrapper.
         * @memberOf Backbone.fields.RadioListView#
         * @return {Backbone.fields.RadioListView}
         */
        renderInput: function () {
            var possibleVals = result(this, 'possibleVals'),
                key,
                i = 0,
                self = this,
                id = this.templateVars.inputId,
                modelVal = this.getModelVal(),
                $inputWrapper = this.getInputWrapper().empty(),
                renderCheckbox = function (val, isChecked) {
                    var $listItem, $label,
                        attributes = { type: 'radio', value: key };
                    if (self.addId) { extend(attributes, { name: id, id: (id + '-' + i) }); }
                    if (isChecked) { attributes.checked = 'checked'; }
                    $listItem = $('<input>').attr(defaults(attributes, self.inputAttrs));
                    if (self.inputClass) { $listItem.addClass(self.inputClass); }
                    $label = $('<label>').attr('class', 'radio');
                    $label.append($listItem).append(val);
                    return $label;
                };

            for (key in possibleVals) {
                if (possibleVals.hasOwnProperty(key)) {
                    if (!isNaN(Number(key))) { key = Number(key); }
                    $inputWrapper.append(renderCheckbox(possibleVals[key], (modelVal + '' === '' + key)));
                    i++;
                }
            }
            return this;
        }
    });

    // ====================================================
    // SelectListView

    /**
     * Like Backbone.fields.RadioListView, except that it creates a select drop down. Designed to
     * work with model fields that have one or several values out of a fixed set of values.
     * If you allow multi-select, the value will be an array. For single selects, the value
     * will be whatever the value of that one option is. Use type alias 'Select' to create
     * in the form schema to create a field with the select type.
     *
     * @constructor Backbone.fields.SelectListView
     * @augments {Backbone.fields.RadioListView}
     * @class Backbone.fields.SelectListView
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.RadioListView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.RadioListView
     * @property {function} [options.template] inherited from Backbone.fields.RadioListView
     * @property {object} [options.templateVars] inherited from Backbone.fields.RadioListView
     * @property {string} [options.inputId] inherited from Backbone.fields.RadioListView
     * @property {string} [options.inputClass] inherited from Backbone.fields.RadioListView
     * @property {boolean} [options.inputAttrs] inherited from Backbone.fields.RadioListView
     * @property {object} [options.twoWay] inherited from Backbone.fields.RadioListView
     * @property {string} [options.placeholder] 
     *           Placeholder text for the select. If the user selects this value, the
     *           model will be set to a blank string.
     * @property {Boolean} [options.multiple] If select should have multiple attribute or not
     * @property {object|string[]} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Each key will be
     *      what is set in the model when the user selects the option, and each value is what
     *      will be used as the label text to display to the user. You can create optgroups by
     *      making a value a nested object of with the same format. You can also just pass an
     *      array of values. These values will serve as the display value and the value that
     *      is set on the model.
     *
     */
    Backbone.fields.SelectListView = Backbone.fields.RadioListView.extend({
        type: 'select-list',
        elementType: 'select',
        events : function () {
            var events = {};
            events['change ' + this.elementType] = 'setModelAttrs';
            return events;
        },
        initialize: function (options) {
            options = options || {};
            this.multiple = !isUndefined(options.multiple) ? options.multiple : this.multiple;
            Backbone.fields.SelectListView.__super__.initialize.call(this, options);
        },
        getValue: function () {
            return this.$(this.elementType).val();
        },
        /**
         * Renders the select element and the options
         * @memberOf Backbone.fields.SelectListView#
         * @return {Backbone.fields.SelectListView}
         */
        renderInput: function () {
            var possibleVals = result(this, 'possibleVals'),
                modelVals = this.getModelVal(),
                id = this.templateVars.inputId,
                $select = $('<' + this.elementType + '>')
                    .attr(defaults((this.addId ? { id: id, name: id } : {}), this.inputAttrs));

            this.getInputWrapper().html($select);
            if (this.multiple) { $select.attr('multiple', 'multiple'); }
            if (this.inputClass) { $select.addClass(this.inputClass); }
            if (this.placeholder) {
                $select.append('<option value="">' + this.placeholder + '</option>');
            }
            return this._renderInput($select, possibleVals, modelVals);
        },
        _renderInput: function ($wrapper, vals, selectedVals) {
            var key, val, $optgroup, $option,
                toStr = function (num) { return '' + num; },
                isArr = isArray(vals);
            selectedVals = _.map((isArray(selectedVals) ? selectedVals : [selectedVals]), toStr);
            for (key in vals) {
                if (vals.hasOwnProperty(key)) {
                    val = vals[key];
                    if (_.isObject(val)) {
                        $optgroup = $('<optgroup label="' + key + '"></optgroup>').appendTo($wrapper);
                        this._renderInput($optgroup, vals[key], selectedVals);
                    } else {
                        $option = $('<option>').text(vals[key]);
                        if (!isArr) {
                            val = key;
                            $option.attr('value', key);
                        }
                        if (_.indexOf(selectedVals, toStr(val)) !== -1) {
                            $option.attr('selected', 'selected');
                        }
                        $option.appendTo($wrapper);
                    }
                }
            }
            return this;
        }
    });


    // ====================================================
    // FormCheckListView

    /**
     * Like Backbone.FormSelectView, but instead of a select, it's a list of checkboxes.
     * Additionally, instead of setting one value on the model, each checkbox represents
     * one attribute on the model assigned to it. Each of these attributes should expect
     * a boolean or one of a set of 2 possible values. You can set what these values 
     * are using the 'checkedVal' and 'unCheckedVal' options. Use the 'CheckList' alias
     * in your schema to create these views.
     * @constructor Backbone.fields.CheckListView
     * @augments {Backbone.fields.FieldView}
     * @class Backbone.fields.CheckListView
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object|function} [options.possibleVals]
     *      An object with the set of possible choices to display to the user. Unlike the other
     *      list views, the key should be what field the choice corresponds to on the model.
     * @property [options.checkedVal] - the value to set on the model when a checkbox is checked
     * @property [options.unCheckedVal] - the value to set on the model when a checkbox is unchecked
     */
    Backbone.fields.CheckListView = Backbone.fields.FieldView.extend({
        tagName: 'div',
        type: 'check-list',
        checkedVal: true,
        unCheckedVal: false,
        events : function () {
            var events = {};
            events['click ' + this.elementType] = 'setModelAttrs';
            return events;
        },
        initialize: function (options) {
            options = options || {};
            this.possibleVals = options.possibleVals || this.possibleVals || {};
            this.checkedVal = options.checkedVal || this.checkedVal;
            this.unCheckedVal = options.unCheckedVal || this.unCheckedVal;
            Backbone.fields.CheckListView.__super__.initialize.call(this, options);
        },
        setupTwoWay: function () {
            each(result(this, 'possibleVals'), function (val, key) {
                this.listenTo(this.model, 'change:' + key, function () {
                    if (!this._viewChangedModel) { this.renderInput(); }
                    this._viewChangedModel = false;
                });
            }, this);
        },
        setModelAttrs: function (e) {
            var val = {},
                $target = $(e.target),
                key = $target.val();
            val[key] = ($target.is(':checked')) ? this.checkedVal : this.unCheckedVal;
            this.model.set(val, this.setOpts);
        },
        renderInput: function () {
            var key, attributes,
                possibleVals = result(this, 'possibleVals'),
                i = 0,
                id = this.templateVars.inputId,
                self = this,
                $inputWrapper = this.getInputWrapper().empty(),
                renderCheckbox = function (key, val, isChecked) {
                    var $listItem, $label;
                    attributes = { type: 'checkbox', value: key};
                    if (self.addId) { extend(attributes, { name: id, id: (id + '-' + i) }); }
                    if (isChecked) { attributes.checked = 'checked'; }
                    $listItem = $('<input>').attr(defaults(attributes, self.inputAttrs));
                    if (self.inputClass) { $listItem.addClass(self.inputClass); }
                    $label = $('<label>').attr('class', 'checkbox');
                    return $label.append($listItem).append(val);
                };

            for (key in possibleVals) {
                if (possibleVals.hasOwnProperty(key)) {
                    $inputWrapper.append(renderCheckbox(key, possibleVals[key], (self.model.get(key) === self.checkedVal)));
                    i++;
                }
            }
            return this;
        }
    });

    // ====================================================
    // FormCheckBoxView

    /**
     * Creates a single checkbox that corresponds to one attribute in the model
     * @constructor Backbone.fields.CheckBoxView
     * @class Backbone.fields.CheckBoxView
     * @augments {Backbone.fields.FieldView}
     * @property {object} [options] 
     *           Options that can either be set as properties on directly on the view or
     *           passed in an object to the constructor.
     * @property {string} [options.fieldName] inherited from Backbone.fields.FieldView
     * @property {string} [options.templateSrc] inherited from Backbone.fields.FieldView
     * @property {function} [options.template] inherited from Backbone.fields.FieldView
     * @property {object} [options.templateVars] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputId] inherited from Backbone.fields.FieldView
     * @property {string} [options.inputClass] inherited from Backbone.fields.FieldView
     * @property {boolean} [options.twoWay] inherited from Backbone.fields.FieldView
     * @property {object} [options.addId] inherited from Backbone.fields.FieldView
     * @property {string} [options.displayText] 
     *           Templates can have a label and/or display text for checkboxes. Display text is
     *           intended for longer desciptions of the textbox's purpose.
     * @property [options.checkedVal] - the value to set on the model when a checkbox is checked
     * @property [options.unCheckedVal] - the value to set on the model when a checkbox is unchecked
     */
    Backbone.fields.CheckBoxView = Backbone.fields.FieldView.extend({
        checkedVal: true,
        unCheckedVal: false,
        events: function () {
            var events = {};
            events['click ' + this.elementType] = 'setModelAttrs';
            return events;
        },
        initialize: function (options) {
            options = options || {};
            this.checkedVal = options.checkedVal || this.checkedVal;
            this.unCheckedVal = options.unCheckedVal || this.unCheckedVal;
            this.displayText = options.displayText || this.displayText;
            Backbone.fields.CheckListView.__super__.initialize.call(this, options);
        },
        getValue: function () {
            if (this.$('input:checkbox').prop('checked')) {
                return this.checkedVal;
            }
            return this.unCheckedVal;
        },
        renderInput: function () {
            var $label = $('<label>').attr('class', 'checkbox'),
                $input = $('<input>').attr({ type: 'checkbox', value: this.checkedVal }),
                id = this.templateVars.inputId,
                modelVal = this.getModelVal();

            if (this.addId) { $input.attr({ id: id, name: id }); }
            if (modelVal === this.checkedVal) {
                $input.attr('checked', 'checked');
            }
            $label.append($input);
            if (this.displayText) {
                $label.append(this.displayText);
            }
            this.getInputWrapper().html($label);
            if (this.inputClass) { $input.addClass(this.inputClass); }

            return this;
        }
    });

    // ====================================================
    // FieldSet View

    /**
     * Essentially a subform, an extension of {@link Backbone.FormView} 
     * but simply uses a 'fieldset' tag instead. Can be used an a FormView's
     * schema to group fields. FieldSets also default to setup their 
     * fields on initialization so that that the top level FormView only 
     * has to call setupFields once.
     * @constructor Backbone.FieldSetView
     * @extends {Backbone.FormView}
     * @class Backbone.FieldSetView
     * @property {Object} [options] 
     *     Options that you can pass to init or add as properties on extended view
     * @property {String} [options.templateSrc] Inherited from Backbone.FormView
     * @property {String} [options.template] Inherited from Backbone.FormView
     * @property {Object} [options.schema] Inherited from Backbone.FormView
     * @property {Boolean} [options.setupOnInit] Inherited from Backbone.FormView
     * @property {String[]} [options.fieldOrder] Inherited from Backbone.FormView
     * @property {Object} [options.templateVars] Inherited from Backbone.FormView
     * @property {Boolean} [options.autoUpdateModel] Inherited from Backbone.FormView
     * @property {Boolean} [options.twoWay] Inherited from Backbone.FormView
     */
    Backbone.FieldSetView = Backbone.FormView.extend({
        tagName: 'div',
        setupOnInit: true,
        className: '',
        initialize: function (options) {
            options = options || {};
            this.fieldSetName = options.fieldSetName || this.fieldSetName || options.schemaKey;
            Backbone.FieldSetView.__super__.initialize.call(this, options);
            this.$el.addClass(this.className || ('fieldset fieldset-' + this.fieldSetName));
        },
        /**
         * Returns a prefix that the fieldset fields can use to create
         * their unique names and ids
         * @memberOf Backbone.FieldSetView#
         * @return {string}
         */
        getFieldPrefix: getFieldPrefix,
        templateSrc: '<% if(obj && obj.label) { %><label class="fieldset-label">' +
            '<strong><%= obj.label %></strong></label><% } %><fieldset data-fields=""></fieldset>'
    });

    /**
     * Like a FieldSet view, except that it's linked to a collection and will add subviews for
     * each model in the collection based on the 'schema' option provided
     * @constructor Backbone.CollectionFieldSetView
     * @extends {Backbone.CollectionFormView}
     * @class Backbone.CollectionFieldSetView
     */
    Backbone.CollectionFieldSetView = Backbone.CollectionFormView.extend({
        tagName: 'div',
        templateSrc: '<% if(obj && obj.label) { %><p><strong><%= obj.label %></strong></p><% } %>' +
            '<fieldset class="fieldset" data-rows=""></fieldset>',
        setupOnInit: true,
        className: '',
        initialize: function (options) {
            options = options || {};
            this.fieldSetName = options.fieldSetName || this.fieldSetName || options.schemaKey;
            Backbone.CollectionFieldSetView.__super__.initialize.call(this, options);
            this.$el.addClass(this.className || ('fieldset fieldset-' + this.fieldSetName));
            return this;
        },
        /**
         * Returns a prefix that the fieldset fields can use to create
         * their unique names and ids
         * @memberOf Backbone.CollectionFieldSetView#
         * @return {string}
         */
        getFieldPrefix: getFieldPrefix
    });

}(jQuery, Backbone, _, this));