/*global Backbone, jQuery, _, describe, it, expect, spyOn, waitsFor, beforeEach */
(function (root, $, Backbone, _) {
    "use strict";

    describe('Backbone.BaseView', function () {
        var testData = [{
                firstName: 'Joe',
                lastName: 'Shmoe',
                registered: true
            }, {
                firstName: 'Sara',
                lastName: 'Shmara',
                registered: true
            }, {
                firstName: 'Harry',
                lastName: 'Shmarry',
                registered: false
            }],

            testCollection = new Backbone.Collection(testData),

            testView,

            toString = Object.prototype.toString,

            RowView = Backbone.BaseView.extend(),

            TableView = Backbone.BaseView.extend({
                tagName: 'table',
                template: _.template('<thead></thead><tbody></tbody>'),
                subViewConfig: {
                    row : {
                        construct: 'RowView',
                        location: 'tbody'
                    },
                    headingRow: {
                        construct: 'HeadingRowView',
                        location: 'thead',
                        singleton: true
                    }
                },
                setup: function () {
                    this.subs.add('headingRow', {
                        cols: ['First Name', 'Last Name', 'Actions']
                    });
                    this.collection.each(function (rowModel) {
                        this.subs.add('row', { model: rowModel });
                    }, this);
                    return this;
                },
                render: function () {
                    this.$el.html(this.template());
                    return this;
                },
                renderSubs: function () {
                    this.subs.renderAppend({ clearLocations: true });
                    return this;
                },
                viewEvents: {
                    'submit' : function (arg, view) {
                        this.wasSubmitted = true;
                        this.submissionArg = arg;
                        this.submissionView = view;
                    }
                }
            }),

            HeadingRowView = Backbone.BaseView.extend({
                tagName: 'tr',
                subViewConfig: {
                    headingCol: { construct: 'HeadingCellView' }
                },
                initialize: function (options) {
                    this.options = options || {};
                    this.cols = options.cols;
                    _.each(this.cols, function (colLabel) {
                        this.subs.add('headingCol', { label: colLabel });
                    }, this);
                },
                render: function () {
                    this.$el.empty();
                    // Render the sub-views and append them directly to 
                    // this.$el
                    this.subs.renderAppend(this.$el);
                    return this;
                }
            }),

            HeadingCellView = Backbone.BaseView.extend({
                tagName: 'th',
                initialize: function (options) {
                    this.options = options || {};
                    this.label = options.label;
                },
                render: function () {
                    this.$el.html(this.label);
                    return this;
                }
            }),

            RowView = Backbone.BaseView.extend({
                tagName: 'tr',
                subViewConfig: {
                    firstName :  {
                        construct: 'CellView',
                        singleton: true,
                        options: {
                            modelField: 'firstName'
                        }
                    },
                    lastName : {
                        construct : 'CellView',
                        singleton: true,
                        options: {
                            modelField: 'lastName'
                        }
                    },
                    actions : {
                        construct: 'ActionsView',
                        singleton: true
                    }
                },
                initialize: function (options) {
                    this.options = options || {};
                    var opts = { model : this.model };
                    this.subs.add({
                        firstName : opts,
                        lastName: opts,
                        actions : opts
                    });
                },
                render: function () {
                    this.subs.renderAppend(this.$el);
                    return this;
                }
            }),

            CellView = Backbone.BaseView.extend({
                tagName: 'td',
                initialize: function (options) {
                    this.options = options || {};
                    this.modelField = options.modelField;
                },
                render: function () {
                    this.$el.html(this.model.get(this.modelField));
                    return this;
                }
            }),

            ActionsView = Backbone.BaseView.extend({
                tagName: 'td',
                template: _.template('<button class="btn submit">Submit</button>'),
                initialize: function (options) {
                    this.options = options;
                },
                render: function () {
                    this.$el.html(this.template());
                    return this;
                },
                events: {
                    'click .submit' : function () {
                        this.triggerBubble('submit', [this.model.get('firstName'), this.model.get('lastName')]);
                    }
                }
            });

        _.extend(root, {
            TableView : TableView,
            CellView : CellView,
            RowView : RowView,
            HeadingRowView: HeadingRowView,
            HeadingCellView: HeadingCellView,
            ActionsView : ActionsView
        });

        beforeEach(function () {
            testView = new TableView({
                collection : testCollection
            });
        });

        it('should create a subview manager', function () {
            expect(testView.subs).toBeDefined();
            expect(typeof testView.subs.get).toBe('function');
            expect(typeof testView.subs.renderByKey).toBe('function');
            expect(typeof testView.subs.filteredSubs).toBe('function');
            expect(toString.call(testView.subs.subViews)).toBe('[object Array]');
        });

        describe('SubViewManager', function () {

            describe('Adding and Retrieving SubViews', function () {

                var data = {
                        firstName: 'Jeff',
                        lastName: 'Schmeff',
                        registered: false
                    },
                    model = new Backbone.Model(data);

                it('should allow you to add subviews for prededfined non-singleton types', function () {

                    var beforeLength = testView.subs.subViews.length;

                    testView.subs.add('row', {
                        model: model
                    });

                    expect(testView.subs.subViews.length).toBeGreaterThan(beforeLength);
                    expect(testView.subs.last().model.cid).toEqual(model.cid);
                });

                it('should return an array when asking for non-singleton types', function () {
                    testView.subs.add('row', {
                        model: model
                    });
                    expect(toString.call(testView.subs.get('row'))).toBe('[object Array]');
                });

                it('should allow you to only add one prededfined singleton subview', function () {
                    var headingRow = testView.subs.get('headingRow');
                    expect(headingRow).toBeUndefined();
                    testView.subs.add('headingRow', {
                        testFlag: 'First Addition'
                    });
                    testView.subs.add('headingRow', {
                        testFlag: 'Second Addition'
                    });
                    expect(testView.subs.last().options.testFlag).toBe('First Addition');
                });

                it('should return an instance when asking for a singleton', function () {
                    testView.subs.add('headingRow', {
                        testFlag: 'First Addition'
                    });
                    testView.subs.add('headingRow', {
                        testFlag: 'Second Addition'
                    });
                    expect(testView.subs.get('headingRow') instanceof HeadingRowView).toBe(true);
                    expect(testView.subs.get('headingRow').options.testFlag).toBe('First Addition');
                });

                it('should allow you to dynamically add a subview of a type that hasn\'t been defined yet', function () {
                    var view = new Backbone.View({
                            model: model
                        }),
                        beforeLen = testView.subs.subViews.length;
                    testView.subs.add('testNotPredefinedType', view);
                    expect(testView.subs.last().cid).toBe(view.cid);
                    expect(testView.subs.subViews.length).toBeGreaterThan(beforeLen);
                });

                it('should allow you to dynamically add a singleton subview that hasn\'t been defined yet', function () {
                    var view = new Backbone.View({
                            model: model
                        }),
                        beforeLen = testView.subs.subViews.length;
                    testView.subs.add('testNotPredefinedType', view, true);
                    expect(testView.subs.last().cid).toBe(view.cid);
                    expect(testView.subs.subViews.length).toBeGreaterThan(beforeLen);
                    expect(testView.subs.get('testNotPredefinedType').cid).toBe(view.cid);
                });

                it('should allow you add an array of instances as a particular type of subviews', function () {
                    var model1 = testCollection.at(0),
                        model2 = testCollection.at(1),
                        view1 = new RowView({
                            model: model1
                        }),
                        view2 = new RowView({
                            model: model2
                        });

                    testView.subs.add('row', [{
                        model: model1
                    }, {
                        model: model2
                    }]);
                    expect(testView.subs.get('row').length).toBe(2);
                    expect(testView.subs.get('row')[0].model.cid).toBe(model1.cid);
                    expect(testView.subs.get('row')[1].model.cid).toBe(model2.cid);

                    testView.subs.add('row', [view1, view2]);
                    expect(testView.subs.get('row').length).toBe(4);
                    expect(testView.subs.last().cid).toBe(view2.cid);
                    expect(testView.subs.get('row')[2].cid).toBe(view1.cid);
                });

                it('should allow you to add subviews by passing an object literal map', function () {
                    var testName = 'Test Name of Heading Row';
                    testView.subs.add({
                        headingRow: {
                            testFlag: testName
                        },
                        row: [{
                            model: testCollection.at(0)
                        }, {
                            model: testCollection.at(1)
                        }]
                    });
                    expect(testView.subs.get('headingRow').options.testFlag).toBe(testName);
                    expect(testView.subs.get('row').length).toBe(2);
                    expect(testView.subs.get('row')[0].model.cid).toBe(testCollection.at(0).cid);
                    expect(testView.subs.get('row')[1].model.cid).toBe(testCollection.at(1).cid);
                });

                it('should allow you to add a config for a subview type before adding it', function () {
                    testView.subs.addConfig('testTypeA', {
                        construct: 'ActionsView',
                        options: { testOpt: 'A' }
                    }).addConfig({
                        testTypeB : {
                            construct: 'Backbone.View',
                            singleton: true
                        }
                    });
                    testView.subs
                        .add('testTypeA', { foo: 'bar' })
                        .add('testTypeA', { foo: 'baz' })
                        .add('testTypeA', { testOpt: 'B' });
                    expect(testView.subs.get('testTypeA').length).toBe(3);
                    expect(testView.subs.get('testTypeA')[0].options.testOpt).toBe('A');
                    expect(testView.subs.get('testTypeA')[1].options.testOpt).toBe('A');
                    expect(testView.subs.get('testTypeA')[0].options.foo).toBe('bar');
                    expect(testView.subs.get('testTypeA')[1].options.foo).toBe('baz');
                    expect(testView.subs.get('testTypeA')[2].options.testOpt).toBe('B');
                    testView.subs.add('testTypeB');
                    expect(testView.subs.get('testTypeB') instanceof Backbone.View).toBeTruthy();
                });

                it('should allow switching the default state of subviews types to being singletons', function () {
                    testView.subs.defaultToSingletons = true;
                    var view1 = new Backbone.View(),
                        view2 = new Backbone.View();
                    view1.name = 'A';
                    view2.name = 'B';
                    testView.subs.add('testType', view1);
                    expect(testView.subs.get('testType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('testType', view2);
                    expect(testView.subs.get('testType').name).toBe('A');
                    testView.subs.addConfig({
                        anotherTestType : {
                            construct: Backbone.View
                        },
                        yetAnotherTestType : {
                            construct: Backbone.View,
                            singleton: false
                        }
                    });
                    testView.subs.add('anotherTestType');
                    expect(testView.subs.get('anotherTestType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('anotherTestType', new Backbone.View(), false);
                    expect(testView.subs.get('anotherTestType') instanceof Backbone.View).toBe(true);
                    testView.subs.add('yetAnotherTestType');
                    expect(toString.call(testView.subs.get('yetAnotherTestType'))).toBe('[object Array]');
                });

                it('should automatically create singleton instances from config if "autoInitSingletons" option is true', function () {
                    TableView.prototype.autoInitSubViews = true;
                    var tableView = new TableView({
                        collection: testCollection
                    });
                    expect(tableView.subs.get('headingRow') instanceof HeadingRowView).toBe(true);
                    expect(tableView.subs.get('row')).toBeUndefined();
                    TableView.prototype.autoInitSubViews = false;
                });

                it('should allow retrieval of subviews by the model, if the view had a model when added', function () {
                    var testModel = new Backbone.Model(),
                        testTypeView = new Backbone.View({
                            model: testModel
                        });
                    testView.subs.add('row', {
                        model : testModel
                    });
                    expect(testView.subs.get(testModel)).toBeDefined();
                    expect(testView.subs.get(testModel) instanceof RowView).toBe(true);
                    testView.subs.add('testType', testTypeView, true);
                    expect(toString.call(testView.subs.get(testModel))).toBe('[object Array]');
                    expect(testView.subs.get(testModel).length).toBe(2);
                    expect(testView.subs.get(testModel)[1].cid).toBe(testTypeView.cid);
                });
            });

            describe('Removing Subviews', function () {

                beforeEach(function () {
                    testView.subs.addConfig('testType', {
                        construct: 'Backbone.View',
                        singleton: false
                    });
                    testView.subs.addConfig('testTypeSingle', {
                        construct: 'Backbone.View',
                        singleton: true
                    });
                    testView.subs.add('testType').add('testType').add('testTypeSingle');
                });

                it('should allow removing subviews by a particular type', function () {
                    testView.subs.remove('testType');
                    expect(testView.subs.get('testType').length).toBeFalsy();
                    testView.subs.remove('testTypeSingle');
                    expect(testView.subs.get('testTypeSingle')).toBeUndefined();
                });

                it('should call the Backbone.View remove method to remove from the dom', function () {
                    var aView = new Backbone.View();
                    spyOn(aView, 'remove');
                    testView.subs.add('anotherTestType', aView);
                    testView.subs.remove('anotherTestType');
                    expect(aView.remove).toHaveBeenCalled();
                });

                it('should allow using a \'clear\' method to remove all subviews at once', function () {
                    var sub1 = testView.subs.at(1);
                    spyOn(sub1, 'remove');
                    testView.subs.clear();
                    expect(sub1.remove).toHaveBeenCalled();
                    expect(testView.subs.subViews.length).toEqual(0);
                    expect(testView.subs.get('testType')).toBeFalsy();
                    expect(testView.subs.get('testTypeSingle')).toBeFalsy();
                });
            });

            describe('Rendering subviews', function () {

                beforeEach(function () {
                    testView.setup().render();
                });

                it('should invoke \'render\' method on all subviews when the SubViewManager "render" method is called without arguments', function () {
                    spyOn(testView.subs.subViews[0], 'render');
                    spyOn(testView.subs.subViews[1], 'render');
                    spyOn(testView.subs.subViews[2], 'render');

                    testView.subs.render();
                    expect(testView.subs.subViews[0].render).toHaveBeenCalled();
                    expect(testView.subs.subViews[1].render).toHaveBeenCalled();
                    expect(testView.subs.subViews[2].render).toHaveBeenCalled();
                });

                it('should append subview "el" elements to their type\'s configured location if "renderAppend" is called without arguments', function () {
                    var headbeforeLen = testView.$('thead').children().length,
                        bodyBeforeLen = testView.$('tbody').children().length;
                    testView.subs.renderAppend();
                    expect(testView.$('thead').children().length).toBeGreaterThan(headbeforeLen);
                    expect(testView.$('thead').children().length).toBe(1);
                    expect(testView.$('tbody').children().length).toBeGreaterThan(bodyBeforeLen);
                    expect(testView.$('tbody').children().length).toBe(testView.collection.length);
                });
            });
        });

    });
}(this, jQuery, Backbone, _));