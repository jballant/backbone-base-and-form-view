/*global Backbone, jQuery, _, describe, it, expect, spyOn, waitsFor, beforeEach */
(function (root, $, Backbone, _) {
    "use strict";

    describe('Backbone.FormView', function () {
        var testForm,
            testModel,
            testCollection,
            testSchema = {
                foo : {
                    type: 'Text',
                    options : {
                        label: 'Foo',
                        elementType: 'textarea'
                    }
                },
                bar : {
                    type: 'RadioList',
                    options: {
                        label: 'Bar',
                        collection: true,
                        possibleVals: {
                            a : 'Option A',
                            b : 'Option B'
                        }
                    }
                },
                baz : {
                    type: 'FieldSet',
                    options : {
                        schema: {
                            bazFoo : {
                                type : 'Text'
                            }
                        }
                    }
                }
            };
        beforeEach(function () {
            testModel = new Backbone.Model({ foo : 'test foo val' });
            testCollection = new Backbone.Collection([new Backbone.Model({ bla : 'test blah val' })]);
            testForm = new Backbone.FormView({
                model: testModel,
                collection: testCollection,
                schema: testSchema
            });
        });

        describe('FormView', function () {

            it('should allow you to set a schema with "setSchema" method', function () {
                var schema = {
                    test : {
                        type : 'Text',
                        options : { label : 'Test setSchema' }
                    }
                };
                testForm.setSchema(schema);
                expect(testForm.schema).toEqual(schema);
            });

            describe('"setupFields" method', function () {

                beforeEach(function () {
                    testForm.setupFields();
                });

                it('should create a subViewConfig from the schema with defaults and resolve an alias to a string constructor', function () {
                    expect(testForm.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.foo).toBeDefined();
                    expect(testForm.subViewConfig.foo.construct).toBeDefined();
                    expect(testForm.subViewConfig.foo.singleton).toBe(true);
                    expect(testForm.subViewConfig.foo.location).toBe(testForm.fieldsWrapper);
                });

                it('should setup defaults in the subViewConfig', function () {
                    expect(testForm.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.foo).toBeDefined();
                    expect(testForm.subViewConfig.foo.singleton).toBe(true);
                    expect(testForm.subViewConfig.foo.location).toBe(testForm.fieldsWrapper);
                });

                it('should recursively setup Fieldset schemas as well', function () {
                    expect(testForm.subViewConfig.baz.options.subViewConfig).toBeDefined();
                    expect(testForm.subViewConfig.baz.options.subViewConfig.bazFoo).toBeDefined();
                    expect(testForm.subViewConfig.baz.options.subViewConfig.bazFoo.construct).toBeDefined();
                });

                it('should initialize singleton fields', function () {
                    expect(testForm.subs.get('foo') instanceof Backbone.fields.FieldView).toBe(true);
                    expect(testForm.subs.get('bar') instanceof Backbone.fields.RadioListView).toBe(true);
                    expect(testForm.subs.get('baz') instanceof Backbone.FieldSetView).toBe(true);
                    expect(testForm.subs.get('baz').subs.get('bazFoo') instanceof Backbone.fields.FieldView).toBe(true);
                });

                it('should allow user to override singleton and location in schema for a field', function () {
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo: {
                            type: 'Text',
                            singleton: false,
                            location : '.test-location',
                            options: { label: 'Test Overrides' }
                        }
                    });
                    testForm.setupFields().subs.add('foo');
                    expect(Object.prototype.toString.call(testForm.subs.get('foo'))).toBe('[object Array]');
                    expect(testForm.subViewConfig.foo.location).toBe('.test-location');
                });

                it('should automatically set the form\'s model as an option for the fields in the subViewConfig', function () {
                    expect(testForm.subViewConfig.foo.options.model.cid).toBe(testModel.cid);
                    expect(testForm.subs.get('bar').model.cid).toBe(testModel.cid);
                });

                it('should set the form\'s collection on the field if the schema defines an option for collection as true', function () {
                    expect(testForm.subViewConfig.foo.options.collection).toBeUndefined();
                    expect(testForm.subs.get('foo').collection).toBeUndefined();
                    expect(testForm.subViewConfig.bar.options.collection.cid).toBe(testCollection.cid);
                    expect(testForm.subs.get('bar').collection.cid).toBe(testCollection.cid);
                });

                it('should pass a submodel if a schema option val for model is a string that matches a submodel on the form\'s model', function () {
                    var submodel = new Backbone.Model({ test: 'Testing sub model' });
                    testModel.set('testSubModel', submodel);
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo : {
                            type: 'Text',
                            options: { model: 'testSubModel' }
                        }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('foo').model.cid).toBe(submodel.cid);
                    expect(testForm.subs.get('foo').model.get('test')).toBe(submodel.get('test'));
                });

                it('should pass a submodel if the schema key matches a submodel on the form model', function () {
                    var submodel = new Backbone.Model({ test: 'Testing sub model' });
                    testModel.set('testSubModel', submodel);
                    testForm.subs.clear();
                    testForm.setSchema({
                        testSubModel : { type: 'Text' }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('testSubModel').model.cid).toBe(submodel.cid);
                    expect(testForm.subs.get('testSubModel').model.get('test')).toBe(submodel.get('test'));
                });

                it('should pass a subcollection if a schema option val for collection is a string that matches a collection on the form model', function () {
                    var subcoll = new Backbone.Collection([{ test: 'Testing sub model' }]);
                    testModel.set('testSubColl', subcoll);
                    testForm.subs.clear();
                    testForm.setSchema({
                        foo : {
                            type: 'Text',
                            options: { collection: 'testSubColl' }
                        }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('foo').collection.first().get('test')).toBe(subcoll.first().get('test'));
                });

                it('should pass a subcollection if the schema key matches a subcollection on the form model', function () {
                    var subcoll = new Backbone.Collection([{ test: 'Testing sub collection' }]);
                    testModel.set('testSubColl', subcoll);
                    testForm.subs.clear();
                    testForm.setSchema({
                        testSubColl : { type: 'Text' }
                    });
                    testForm.setupFields();
                    expect(testForm.subs.get('testSubColl').collection.first().get('test')).toBe(subcoll.first().get('test'));
                });

            });

            describe('Options', function () {

                describe('setupOnInit', function () {
                    it('should call setupFields on FormView initialization', function () {
                        var orig = Backbone.FormView.prototype.setupFields, form;
                        spyOn(Backbone.FormView.prototype, 'setupFields');
                        form = new Backbone.FormView({
                            schema: testSchema,
                            setupOnInit: true
                        });
                        expect(form.setupFields).toHaveBeenCalled();
                        Backbone.FormView.prototype.setupFields = orig;
                    });
                });

                describe('validateOnSet', function () {
                    it('should pass a true setOpts option value for validate to fields', function () {
                        var form = new Backbone.FormView({
                            validateOnSet: true,
                            schema: testSchema,
                            model: testModel
                        });
                        form.setupFields();
                        expect(form.subViewConfig.foo.options.setOpts.validate).toBe(true);
                        expect(form.subViewConfig.bar.options.setOpts.validate).toBe(true);
                        expect(form.subViewConfig.baz.options.subViewConfig.bazFoo.options.setOpts.validate).toBe(true);
                    });
                });

                describe('twoWay', function () {
                    it('should pass twoWay option on to field subview config options', function () {
                        var form = new Backbone.FormView({
                            twoWay: true,
                            schema: testSchema,
                            model: testModel,
                            label: 'Test Field'
                        });
                        form.setupFields();
                        expect(form.subViewConfig.foo.options.twoWay).toBe(true);
                        expect(form.subViewConfig.bar.options.twoWay).toBe(true);
                        expect(form.subViewConfig.baz.options.subViewConfig.bazFoo.options.twoWay).toBe(true);
                    });
                });

            });

            describe('"render" method', function () {

                it('should call setupFields if it has not been called yet', function () {
                    spyOn(testForm, 'setupFields');
                    testForm.render();
                    expect(testForm.setupFields).toHaveBeenCalled();
                });

                it('should render and append all fields to the fieldsWrapper when custom locations aren\'t specified', function () {
                    testForm.render();
                    expect(testForm.getFieldsWrapper().children().length).toBe(testForm.subs.subViews.length);
                    expect(testForm.subs.get('foo').$el.parent().is(testForm.getFieldsWrapper())).toBe(true);
                    expect(testForm.subs.get('baz').$el.parent().is(testForm.getFieldsWrapper())).toBe(true);
                });

                it('should render fields in a specific order if fieldOrder form option is specified', function () {
                    testForm.options.fieldOrder = ['baz', 'foo', 'bar'];
                    testForm.render();
                    expect(testForm.subs.get('baz').$el.index()).toBe(0);
                    expect(testForm.subs.get('foo').$el.index()).toBe(1);
                    expect(testForm.subs.get('bar').$el.index()).toBe(2);
                });

            });

        });

        describe('FieldView', function () {
            var testField, testOpts;
            beforeEach(function () {
                testOpts = {
                    schemaKey: 'testField',
                    model: testModel
                };
                testField = new Backbone.fields.FieldView(testOpts);
            });

            describe('Options', function () {
                describe('fieldName', function () {
                    it('should default to schemaKey option if provided', function () {
                        expect(testField.fieldName).toBe(testField.options.schemaKey);
                    });
                });
                describe('twoWay', function () {
                    it('should invoke "setupTwoWay" method', function () {
                        var view, oldSetupTwoWay = Backbone.fields.FieldView.prototype.setupTwoWay;
                        spyOn(Backbone.fields.FieldView.prototype, 'setupTwoWay');
                        testOpts.twoWay = true;
                        view = new Backbone.fields.FieldView(testOpts);
                        expect(view.setupTwoWay).toHaveBeenCalled();
                        Backbone.fields.FieldView.prototype.setupTwoWay = oldSetupTwoWay;
                    });
                });
            });
        });

    });

}(this, jQuery, Backbone, _));