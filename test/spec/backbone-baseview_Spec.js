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
                },
                render: function () {
                    this.$el.html(this.template());
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
                    // stub
                    expect(true).toBe(true);
                });
            });
        });

    });
}(this, jQuery, Backbone, _));