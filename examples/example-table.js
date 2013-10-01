/*global Backbone, _, console */
"use strict";
// The TableView is a BaseView that's self explanatory. 
// It has subViews which represent rows in the table, as
// well as a heading row view singleton.
var TableView = Backbone.BaseView.extend({
    tagName: 'table',
    template: _.template('<thead></thead><tbody></tbody>'),
    subViewConfig: {
        row : {
            construct: 'RowView',
            location: 'tbody' // Rows are appended to tbody selector within the table
        },
        headingRow: {
            construct: 'HeadingRowView',
            location: 'thead',
            singleton: true // We only need one heading row, so we make it a singleton
        }
    },
    initialize: function () {
        this.subs.add('headingRow', {
            cols: ['First Name', 'Last Name', 'Actions']
        });
        // Add a row sub-view for each model in the collection
        this.collection.each(function (rowModel) {
            this.subs.add('row', { model: rowModel });
        }, this);
    },
    render: function () {
        this.$el.html(this.template());
        // Render all subviews and append them to their locations
        // clear the locations of any existing elems before appending
        this.subs.renderAppend({ clearLocations: true });
        return this;
    },
    // viewEvents are setup in the BaseView and work like the standard 'events' object
    // but for backbone events. So for example, the key 'change model' would listen
    // to the change event on the model property of the view. The context would be the view
    viewEvents: {
        'submit' : function (arg) {
            console.log('User clicked submit on a row cell. ' +
                'The event bubbled up to the table view with this message: ' + arg);
        }
    }
});

var HeadingRowView = Backbone.BaseView.extend({
    tagName: 'tr',
    subViewConfig: {
        headingCol: { construct: 'HeadingCellView' }
    },
    initialize: function () {
        _.each(this.options.cols, function (colLabel) {
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
});

var HeadingCellView = Backbone.BaseView.extend({
    tagName: 'th',
    render: function () {
        this.$el.html(this.options.label);
        return this;
    }
});

var RowView = Backbone.BaseView.extend({
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
    initialize: function () {
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
});

var CellView = Backbone.BaseView.extend({
    tagName: 'td',
    render: function () {
        this.$el.html(this.model.get(this.options.modelField));
        return this;
    }
});

var ActionsView = Backbone.BaseView.extend({
    tagName: 'td',
    template: _.template('<button class="btn submit">Submit</button>'),
    render: function () {
        this.$el.html(this.template());
        return this;
    },
    events: {
        'click .submit' : function () {
            this.triggerBubble('submit', ['Hello, this person\'s name is ' +
                this.model.get('firstName') +
                ' ' + this.model.get('lastName')]);
        }
    }
});