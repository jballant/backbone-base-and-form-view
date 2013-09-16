// This is the backbone example todo app recreated or 
// or mostly recreated with Backbone.FormView. 

/*jslint todo:true */ // haha, silly jslint
/*global Backbone, jQuery, _, localStorage */
(function ($, Backbone, _, window) {
    "use strict";
    var
        // --------------------------------
        // Todo Model

        Todo = Backbone.Model.extend({
            defaults: {
                'title': '',
                'done' : false
            }
        }),

        // --------------------------------
        // Todo Collection

        Todos = Backbone.Collection.extend({
            // Use the Todo Model as your constructor
            model: Todo,

            // Method that calculates remaining uncompleted todo list items
            // that have a non-empty title
            remaining: function () {
                return this.filter(function (todo) {
                    return (todo.get('title') && !todo.get('done'));
                });
            },

            // Returns a list of todo models where done is true
            done: function () {
                return this.where({ done: true });
            },

            // Saves the json to localStorage (works like it normally would to a service)
            save: function () {
                var jsonStr = JSON.stringify(this.toJSON());
                localStorage.setItem('todos', jsonStr);
                return this;
            },

            // Gets any saved todos from local storage (works like fetch 
            // would from a service.)
            fetch: function () {
                var jsonStr = localStorage.getItem('todos'),
                    models;
                if (jsonStr) {
                    models = JSON.parse(jsonStr);
                    if (models && models.length) {
                        this.reset(models);
                    }
                }
                return this;
            }
        }),

        // --------------------------------
        // Todo TextField SubView

        // An extension of FieldView that watches the 'done' attribute
        // on the model and will convert the editable text input to a
        // read only div with a mark-done class when done is 'true'
        TodoTextFieldView =  Backbone.fields.FieldView.extend({
            // Sets the placeholder attribute on the text input
            placeholder: 'empty todo...',

            // Make this a large bootstrap input
            inputClass: 'input-xxlarge',

            render: function () {
                TodoTextFieldView.__super__.render.call(this);
                if (this.model.get('done')) {
                    this.markDone();
                }
                return this;
            },

            // Change the text of the view to be a read only div with the mark done class
            markDone: function () {
                return this.$el.addClass('mark-done').html(this.getModelVal());
            },

            // Test if this model should be marked done, other wise make sure it isn't 
            // displayed as a done view.
            testMarkDone: function () {
                if (this.model.get('done') && this.getModelVal()) {
                    this.markDone();
                } else {
                    this.$el.removeClass('mark-done');
                    this.render();
                }
            },

            // Test if the view should be display as marked done
            viewEvents: {
                'change:done model': 'testMarkDone'
            }
        }),

        // --------------------------------
        // TodoStatsView

        // Calculates the number done and the number remaining
        // todos and passes these values to a template.
        TodosStatsView = Backbone.BaseView.extend({
            template: _.template($('#todos-stats-template').html()),
            render: function () {
                this.$el.html(this.template({
                    done: this.collection.done().length,
                    remaining: this.collection.remaining().length
                }));
                return this;
            },
            viewEvents: {
                'change collection' : 'render',
                'add collection' : 'render',
                'remove collection' : 'render'
            }
        }),

        // The main view, an extension of CollectionFormView
        // with some custom methods, mainly to add the stats
        // subview and the functionality clear completed todo
        TodosView = Backbone.CollectionFormView.extend({
            // Grab the main template for the todo application
            templateSrc: $('#todo-list-template').html(),

            // Set options to be passed to each row instance
            rowOptions: {
                className : 'form-row form-inline',
                template: _.template($('#todo-list-row-template').html()),
                events: {
                    // Add an event to each row for the delete buttons,
                    // and trigger an event to tell an ancestor view to 
                    // delete the instance that it was triggered from.
                    // The view instance will automatically be passed as
                    // an argument.
                    'click .delete' : function () {
                        this.triggerBubble('deleteTodo');
                    }
                }
            },

            // Define the schema for the fields of each row
            rowSchema: {
                // Define a checkbox that will get assigned to the 'done'
                // model attribute
                done: {
                    type: 'Checkbox'
                },
                // Define a TodoTextFieldView field that will be assigned
                // the 'title' model attribute
                title: {
                    type: TodoTextFieldView
                }
            },

            // Define the DOM events
            events: {
                // When the user presses enter, add a row
                'keypress .form-field-title:last input' : function (e) {
                    var keyCode = e.keyCode || e.which;
                    // If the user pressed enter
                    if (keyCode === 13) {
                        this.addRow();
                        // Get the last row viewEvents, then get the title field, then have jQuery
                        // find the input and trigger a focus event.
                        _.last(this.subs.get('row')).subs.get('title').$('input').trigger('focus');
                    }
                },
                // If the clear-complteted button is clicked, run the clearCompleted function
                'click #clear-completed': 'clearCompleted',
                // If they click the add button, add a new todo
                'click .add' : function () {
                    this.addRow();
                }
            },

            // Define the backbone events
            viewEvents: {
                // On a deleteTodo Backbone event on the view, run the deleteTodo method
                'deleteTodo' : 'deleteTodo'
            },

            initialize: function () {
                // Call the parent prototype initialize
                TodosView.__super__.initialize.call(this);
                // Add the stats subView
                this.subs.add('stats', new TodosStatsView({ collection : this.collection }), true);
                // On change or remove events for the collection, save the collection
                this.collection.on('change remove', this.collection.save);
            },

            render: function () {
                // Call the parent render method
                TodosView.__super__.render.call(this);
                // Render and append the stats subview
                this.$('.stats-wrapper').html(this.subs.get('stats').render().el);
                return this;
            },

            clearCompleted:  function () {
                // Call the deleteTodo method on each todo row subview that has a model
                // with a 'done' attribute that equals true
                _.each(this.collection.done(), this.deleteTodo, this);
                return this;
            },

            deleteTodo: function (todoRowView) {
                this.deleteRow(todoRowView);
                // If there are no rows left, then add a blank one
                if (!this.subs.get('row').length) {
                    this.addRow();
                }
            }
        });

    // Attach some vars to global scope
    _.extend(window, { Todos : Todos, Todo : Todo, TodosView : TodosView });

}(jQuery, Backbone, _, this));