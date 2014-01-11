Backbone BaseView and FormView
=======================================

TLDR
----

**Backbone.BaseView** - Organize your views into components (subviews) to decouple them and promote more standard and maintainable code.

**Backbone.FormView** - Extends Backbone.BaseView and allows you to define and generate Backbone-ized forms more easily with less code while keeping the decoupled benefits of the BaseView.

Introduction
------------

### Backbone.BaseView 
Adds some additional functionality on top of [Backbone's](http://backbonejs.org) native View constructor, and most of this is around *subview* management and managing a hierarchy of views. This can be useful for things like having a view for a collection and then subviews for each model in the collection, but also for a structure where you have nested models and collections within the model you are building a view for. It adds some useful methods in relation to the interaction between parent views and subviews.

**Why??** 

'Sub-Views' are a concept used often in Backbone without an official way to actually manage them. Backbone is nice enough to let you do pretty much whatever you want, but as a result it doesn't really provide that many structures to help you deal with a more complicated application -- it lets you decide what you want to do. Backbone.BaseView adds the SubViewManager component to standardize a little bit what can often end up being a wild west in terms of what people are doing deal with all the moving pieces inside their views.

**Example scenario**: Say you want to make a table view based on a collection and it's models. You can make a TableView, then RowView sub views for it's rows, and then CellView sub views for each column cell in the RowView instance. (See [our basic implementation](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-table.html) as an example.)

This allows you to focus only on the functionality of the ColView and it's UI in isolation of the TableView. With Backbone.BaseView, any BaseView can publish events that 'bubble' up or 'descend' down the hierarchy of views, not to mention a set of other functions to help you standardize how your views instantiate each other and communicate with one another.

This means you can write some nice semantic code like this:

 ```tableView.subs.add('row', { model: new RowModel(); });```

```tableView.subs.triggerDescend('collapseDetails'); // Triggers an event on all subviews and their subviews```

This allows you to write views that can be used in many contexts. In a table scenario, you can have a table cell trigger an event that bubbles up to notify the row when an event should affect the entire row, and then the row view can handle this accordingly, without having to write unique logic to 

### Backbone.FormView
Adds functionality on top of *Backbone.BaseView* to create a framework for generating forms very quickly and standardizing some aspects of this to make augmenting a form is easier for other coders. This is somewhat inspired by [backbone-forms](https://github.com/powmedia/backbone-forms) but has a different style and approach to how you can build forms and extend the functionality.

**Why??**

If you make a lot of Forms with just vanilla Backbone, it's very easy to write a lot of very similar code. You write a template for the form, then write a view that renders the form, then event handlers to take UI form changes and set associated values on the view's model.

Worse, a lot of code could be better standardized but often isn't when people write with vanilla Backbone, not through an issue with Backbone but out of fast development needs superseding organization. A lot of that repetitiveness / unintentional obscurity can be taken away using a Backbone.FormView, not to mention less confusing. A javascript schema object can be used to build the form, and this schema is formatted in a way that is very readable and pretty concise.

### Project Page with 'Class' documentation:
[Go to the project page](http://1stdibs.github.io/backbone-base-and-form-view/)

Getting Started
---------------

### Dependencies
[jQuery](http://jquery.com)

[Underscore](http://underscorejs.org) OR [Lo-Dash](http://lodash.com)

[Backbone](http://backbonejs.org)

### Standard Installation

[Download the source code from Github](https://github.com/1stdibs/backbone-base-and-form-view)

**BaseView** - If you just want to use Backbone.BaseView, first load it on your page after Backbone.

**FormView** - To use Backbone.FormView, load Backbone.BaseView after Backbone, and then load Backbone.FormView

### NPM Installation

Install it through npm simply by running the command ```npm install backbone-base-and-form-view```. If you use [browserify](https://github.com/substack/node-browserify), you can load these modules like this: 

```var Backbone = require('backbone-base-and-view'); // loads Backbone for you and re-exports it```

Using Backbone.BaseView
-----------------------

You can use Backbone.BaseView like a normal Backbone.View, however, you get some additional functionality in the form of *subviews*. A subview is a view that is nested in the '.subViews' array in a BaseView instance, and typically would have it's '.el' HTMLelement inside the BaseViews '.el' HTMLelement. 

Backbone.BaseView lets you interact with them through the SubViewManager instance stored in the 'subs' property of the BaseView instance. 

A subview should get rendered when the parent BaseView is rendered, but the subview can be rendered without rendering the parent view. Subviews have a proptery '.parentView' that stores a reference to it's parent view.

### Adding a Subview

To add a subview is through using the SubViewManager's ('.subs') 'add' method. There are several ways you can use this method.

* **Adding an instance directly**

        var MySubView = Backbone.BaseView.extend();
        var MyView = Backbone.BaseView.extend({
               initialize: function () {
                  this.subs.add(new MySubView());
               }
            });
        var testView = new MyView();
        console.log(testView.subViews); // Logs an array with one MySubview instance

This is probably fine if you never need to refer to this sub view by a type. If you provide a string as the first parameter, this serves as a key to refer to the subview by. This would look like ``this.subs.add('mySubView', new MySubView())``. You can continue adding subviews on the same type string (they would be grouped in an array).

* **Adding a config first**, and then instantiating from that config. A config tells the SubViewManager some standard information about the subview type.

        var MySubView = Backbone.BaseView.extend();
        var MyView = Backbone.Base.extend({
             initialize: function () {
                var myModel = new Backbone.Model();
                this.subs.addConfig('mySubView', {
                     construct: 'MySubView',
                     singleton: true,
                     location: '.mysub-wrapper'
                     options: {
                          // 'default' options to pass to the sub view on init
                     }
                });
                this.subs.add('mySubView', {
                     model: myModel // Extra options to add on top of the default options
                });
            }
        });

The config above has several properties that are important to know:

   * construct : This tells the SubViewManager what constructor function to use when creating the view 
   * singleton : This tells the SubViewManager that you only want one instance of this type allowed for this SubViewManager. Once it's instantiated, other instances will not be added to that type.
   * location : When you render the subviews, the SubViewManager makes it easier to place them by allowing you to specify in a config where a subview of this type should be appended to. This can be a jQuery selector, a 
   jQuery object, or a function that will be invoked after rendering the subview that returns an instance
   of jQuery.
   * options : A default set of options to pass to the constructor. When you instantiate this object later with 'add' you can add additional options.

With the example above, you could have also added a 'subViewConfig' property to the MyView definition at the top, which in this example would be an object with one key value pair, with the key being 'mySubView' (the name of the sub view type you want to define) and the value being the config object for that type.

### Getting a Sub View

Now that you have created a subview, you might want to actually use it some point later on, and you need a way to get it. To get a view you can use:

    testView.subs.get('mySubView'); // Returns array of MySubView instances

This would return an array, because Backbone.BaseView allows you to add multiple views on a single key. If you want to add a view and ensure that only one of this kind of subview can exist on that key, that's referred to as a *singleton*. To specify that a view is a singleton when you add it, pass true as the second param like this ``this.subs.add('mySubView', new MySubView(), true);``.

Now that you have a singleton view, you can always get it easily by calling:

    var testSubView = testView.subs.get('mySubView'); // Returns instance of MySubView

The '.get' method, will try to find a single instance first using the 'key' provided before returning an array. If the key passed to get doesn't match a singleton, you will get an array of results.

**Getting a sub view via a model** - If you pass a model to a subview when it's instantiated as an option, the sub view manager makes it possible to retrieve the view using the model. This could be done as follows:

    var testModel = new Backbone.Model();
    testView.subs.add('anotherSubView', new MySubView({ 
        model: testModel
    }));

    testView.subs.get(testModel);
    // Returns sub view instance if only one view uses that model, or 
    // an array of sub views if you have multiple subviews using that model

**Underscore methods to access subViews** - The 'subs' SubViewManager includes curried underscore methods to access or modify subViews. These are: 'each', 'find', 'filter', 'sortBy', 'groupBy', 'where', 'findWhere', 'some', 'every', and 'invoke'. Example usage: ```this.subs.where({ collection: myCollection }); // Returns array of subview instances```.

### Rendering Sub Views

1. You can get the sub view instances and render them individually:

        testView.subs.get('mySubView').render();

2. You can render sub views all at once and append them in their order to a specified selector or element

        testView.subs.renderAppend('.subviews-wrapper');

3. If you specified a location in the subview type's config, then any subviews of that type  will be automatically appended to that location if you use the 'renderAppend' method:

         testView.subs.addConfig('typeB', {
             construct: 'TypeBView',
             location: '.type-b-wrapper'
         });
         testView.subs
             .add('typeB', {
                 model: model1
             })
             .add('typeB', {
                 model: model2
             })
             .renderAppend(); 
         // the SubViewManager looks in the testView.el element for an element that maches
         // the selector '.type-b-wrapper' and appends the typeB instances to that wrapper

**NOTE:** Because renderAppend by sub views are appended to the locations you provide, you may need to clear out the base view's html first. The ```Backbone.BaseView``` adds a shortcut 'clear' method to help with this. Additionally, you can pass the 'clearLocations' option to the render methods to clear all locations specified in configurations first: ```testView.subs.renderAppend({ clearLocations: true });```.

### Features

Okay, well, now that you have this taken care of, a Base View has a few interesting features involving sub view interactions, some of which I will outline here:

1. Accessing the subViews parent:

        testSubView.parentView; // Instance of MyView

 *Note that you cannot access the '.parentView' property in the initialize method if you instantiate a sub view before it's added to the base view's SubViewManager.*

2. Triggering an event that bubbles up to the parent view, and then that parent's parent view, and so on:

        testSubView.triggerBubble('myEvent');

Like Backbone.Events.trigger, the first argument passed to triggerBubble should be a string to represent the name of the event. Subsequent arguments are passed to event handler callbacks. The first argument passed to an event handler with triggerBubble (and triggerDescend) will always be the view instance that triggered the event. Custom arguments are the 2nd parameter onward. Listen with the 'on' / 'listenTo' / 'once' and 'listenToOnce' methods, like you would normally do with Backbone.Events objects.

3. Triggering an event that descends down through all subViews, and if those subViews also have subViews, it will trigger the event on those as well, and so on:

        testView.triggerDescend('myOtherEvent');

 Arguments and callbacks work in the same fashion as they do with triggerBubble.

4. Getting the top view of a sub view heirarchy (i.e. the view that doesn't have a parentView of it's own):

        testSubView.getTopView();

5. Getting an ancestor view that matches a specific type of subview key:

        testSubView.getAncestor('typeB');

6. If you extend the BaseView and define a 'viewEvents' property on the prototype, the BaseView will bind function to events based on the object key. For example:

        myView = Backbone.BaseView.extend({
            viewEvents: {
               'change model': 'render',
               'add subs': function () { console.log('a sub view was added!'); }
            }
        });

 In the example above, the instance of myView will listen to the model for a 'change' event, and will call render when the event occurs. The key is split on the space where the left side is the event name, and the right side is a Backbone object property on the view. We are also listening to the subs object for the 'add' event and logging to the console when it is fired.  

7. You can access an array of all subViews attached to a BaseView instance at any time with the '.subViews' property. *It is recommended that you do not push directly to this array to avoid issues where you cannot use some functionality of the SubViewManager, use the 'add' method instead*.

BaseView Example - A Table
--------------------------
[Click here for an example](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-table.html) for a very *very* simple table app that uses Backbone.BaseView. Considering that it doesn't do much of anything, the number of Views defined is obviously overkill, but it does illustrate a bunch of concepts that you could use when creating a much more sophisticated app.


**For more information on Backbone.BaseView** you can consult the inline documentation in the source code.

-----------------------


Using Backbone.FormView
-----------------------
Backbone.FormView adds additional functionality by creating standardized fields and allowing you to specify a *schema*, which is really a subViewConfig with some of the work being done automatically for you. You can define a *schema* as an option. The schema tells the form view how to assemble the Form when it's rendered.

        var myModel = new Backbone.Model();
        var myForm = new Backbone.FormView({
            model: myModel,
            schema: {
               firstName: {
                  type: 'Text',
                  options: {
                    label: 'First Name',
                    templateSrc: $('#my-text-field-template').html();
                  }
               }
            }
        });
        $('body').html(myForm.render().el); 
        // Render the form and place it on the page. The form will have a <form> element
        // which contains a field '<div>' wrapper which contains a text <input>

If you do choose to extend the FormView, you can also define schema as a pseudoclass property.

### FormView Schema
The schema property of the options object has one field defined in the example above, 'firstName'. The schema tells the FormView that the firstName field should be of type 'Text', and that it should be have the label 'First Name'. Each field is actually a sub view, and the FormView basically automatically sorts some things out for you:

1. The *schema* property 'type' is actually an alias of 'construct' (you can use either), and the value 'Text' is an alias of 'Backbone.FormFieldView'. The Backbone.FormView prototype has several built in aliases for field types: 'Text', 'Checkbox', 'Checklist', 'Select', 'Chosen', 'RadioList', 'FieldSet', 'CollectionField'. More on these types will be discussed later.
  
 If you want to use a custom sub view constructor, you can easily just use that as the value of type. For example, if you created a custom field View constructor called 'App.MyField', you can just use that as the type value. *Note* that if you use a string value as type it will have to be a dot notation object that can be found on the global scope.

2. The *options* property is really just some custom options that we want to pass to the 'Text' constructor, just like the options paramater passed to Backbone.View instances. More details on each field are discussed later. This makes it really easy to write a custom field because it is just a Backbone.View (preferably a BaseView but not required) and the options will be what you specify here and what are automatically set by the FormView and passed to the initialize function of the custom View.

### FormView Options
The FormView constructor allows certain options for each field type so that you don't necessarily need to extend to customize the form the way you want to. These are some of the options you can pass the constructor or set on an extended View's prototype:

1. *model* - *Required*. Backbone.Model This is the model that the form will set attributes on. The form field sub-views will automatically be passed a reference to this model to their constructor, so that the fields can manage setting the values of their inputs on the appropriate attribute of the model. If the schema key (in the example this is 'firstName') matches a nested model, the sub views will be passed that nested model instead. This is useful if you use a framework like [backbone-relational](http://backbonerelational.org/), [backbone-associations](https://github.com/dhruvaray/backbone-associations) or [backbone-deep-model](https://github.com/powmedia/backbone-deep-model).
2. *collection* - Collections will not be passed to subViews unless the schema defines a collection option for the field. If the value of collection is true, then the sub-view instantiated from the field schema will be passed a the parent view's collection property.
3. *templateSrc* - String. An underscore template string that can be used with the underscore _.template function. This serves as the shell template that the subviews/fields are appended to. The render function looks for an element with a *data-fields* attribute and appends the sub-views to that. The FormView default fields have a default template (with [bootstrap](http://getbootstrap.com/) classes), which you can use if you want or easily repace with this variable.
4. *templateVars* - Object. Variables to pass to the template when it is rendered
5. *setupOnInit* - Boolean. If true, the FormView will create all sub view instances from the schema in the initialize function.

### Saving a Form
Saving a form is simply matter of saving the model. One way this can be achieved is simply using a templateSrc with a submit button, and then attaching an event to that button that saves the model when the user clicks it.

### Basic Fields
The FormView comes with a set of Field subViews that you can use to create forms without having to define any of your own. They are outlined below:

#### Text (alias of Backbone.fields.FieldView)
Creates a field 'text' type input or textarea, wrapped in a shell template. Sets the associated model attribute with the value of the input/textarea on focusout.

Example schema definition:

     description: {
         type: 'Text',
         options : {
             label: 'Item description',
             placeholder: 'Enter the description of your item...',
             elementType: 'textarea'
             templateSrc: $('my-description-template').html()
         }
     }

**Options**:

1. *templateSrc* - String. The source for an underscore template to append the input to. If a data-input attribute on the element is specified, then that will directly wrap the input. Otherwise the input will be appeneded directly to the view's '.el' element.
2. *label* - String. The text you would like to display in the <label> element that is included in part of the template.
3. *elementType* - String. Should be one of 'input' or 'textarea'.
4. *placeholder* -  String. The placeholder attribute of the input or textarea element.
5. *fieldName* - String. The attribute on the model that you want to set on the focus out event. If left out, this field will default to the schema key (in the example this is 'description').
6. *inputId* - String. The id attribute of the input element you would like to use. This is created automatically from the schema key if it's not provided. It is also used as the name.
7. *templateVars* - Object. Custom variables you would like to pass to the underscore template function
8. Input Attrs - Object. If there are other attributes on the input/form element(s) that are not set by the above, then you can specify them with this option.

#### RadioList (alias of Backbone.fields.RadioListView)
Like the Text field, except the input is actually just a set of radio buttons. A RadioList field should be associated with a model attribute that expects a single value out of a fixed set of values.

Example schema definition:

     gender: {
         type: 'RadioList',
         options : {
             label: 'Gender',
             possibleVals: {
                M: 'Male',
                F: 'Female'
             }
         }
     }

**Options**:

Inherited from Text - *templateSrc*, *label*, *fieldName*, *inputId*, *templateVars*.

1. *possibleVals* - Object|Array|Function. Should be an object literal or array (or a function that returns one of those) with the choices you would like to have a radio button for. The object keys will be the values that are saved on the model attribute. The values are the display text for each option. If you use an array, the value and the display text will be the values in the array.

#### Select (alias of Backbone.fields.SelectListView)
Like the RadioList field, except instead of a set of radio buttons, it's displays a select dropdown. Also has the ability to allow multiple select.

Example schema definition:

     country: {
         type: 'Select',
         options : {
             label: 'Country',
             placeholder: 'Select your country...
             possibleVals: {
                USA: 'United States',
                MX: 'Mexico',
                CN: 'Canada'
             }
         }
     }

**Options**:

Inherited from Text - *templateSrc*, *label*, *placeholder*, *fieldName*, *inputId*, *templateVars*.

1. *possibleVals* - Object|Function. Should be an object literal (or a function that returns one) with the options you would like to have in the select. The keys will be the values that are saved on the model attribute. The values are the display text for each option. Note, the select allows you to create optgroups by nesting possible values as follows:

        possibleVals: {
           'Fiction' : {
              ya: 'Young Adult',
              hf: 'Historical Fiction'
           }
           'Non-Fiction: {
              his: 'History',
              sci: 'Scientific'
           }
        }

#### CheckList (alias of Backbone.fields.CheckListView)
Like the RadioList field, except with checkboxes instead of radio buttons. A CheckList field should have an associated field for each checkbox, as each can be either 'on' or 'off'.

Example schema definition:

     characteristics: {
         type: 'RadioList',
         options : {
             label: 'Characteristics',
             checkedVal: 'Yes',
             unCheckedVal: 'No',
             possibleVals: {
                fluf: 'Fluffy',
                slk: 'Sleek',
                elg: 'Elegant'
             }
         }
     }

**Options**:

Inherited from Text - *templateSrc*, *label*, *fieldName*, *inputId*, *templateVars*.

1. *possibleVals* - Object|Function. Should be an object literal with the choices you would like to have a checkbox for. The keys will be the values that are saved on the model attribute. The values are the display text label for each checkbox.
1. *checkedVal* - Mixed. the value to set on the model when a checkbox is checked for a particular possibleVal. So if the user selected the checkbox with the value 'fluf', and the checkedVal is ```true```, then the 'fluf' attribute on the model will be set to ```true```.
1. *unCheckedVal* - Mixed. the value to set on the model when a checkbox is unchecked.

#### CheckBox (alias of Backbone.fields.CheckBoxView)
Just a simple checkbox in a shell template, associated with an attribute on the model that can have only two values.

Example schema definition:

     email: {
         type: 'Checkbox',
         options : {
             displayText: 'Would you like to receive email updates from us?',
             checkedVal: 'Yes',
             unCheckedVal: 'No',
         }
     }

**Options**:

Inherited from Text - *templateSrc*, *label*, *fieldName*, *inputId*, *templateVars*.

1. *checkedVal* - Mixed. the value set on the model when the users checks the checkbox. In the example above, the 'email' property of the the checkbox would be set to string 'Yes' .
1. *unCheckedVal* - Mixed. the value to set on the model when a checkbox is unchecked.
1. *displayText* - String. Helpful text to display on the right of the checkbox. You can also use a label, but labels display on the left side in the default template.

Backbone.CollectionFormView
---------------------------
A variant of Backbone.FormView that works in a very similar manner, except that instead of rendering one subView for each field defined in the schema, a 'row' or 'fieldset' will be rendered for each model in the collection passed to the Backbone.CollectionFormView. 

Effectively, this renders a modified FormView for each model in the collection, and adds some methods to make it easier to modify the collection form like 'addRow', 'deleteRow', and 'reset'.

What this means is that each field in schema will have a subview created for each model in the collection, and will be grouped into by a wrapper element that possesses a 'data-row' attribute.


Extending the FormView and FormFields
-------------------------------------
Backbone.FormView and the field views are designed to be extended, like Backbone.BaseView or any Backbone.View. Here are some ways you can extend the Backbone.FormView and form view fields.

### Overriding the default templates

It's likely that you would want to use your own templates most of the time. First you need to define the template you want to use.Backbone.FormView instances append the field elements to the ```fieldsWrapper``` property by defualt. This property is a jQuery selector that looks for the the first element with a 'data-fields' attribute. Note that you can override this property in your extension if you wish. Most of the time, it's easiest just to create a template with this element:

        <script type="text/template" id="my-form-template">
          <div data-fields=""></div>
        </script>

Backbone.fields.FieldView (aka the 'Text' field) instances render a template that serves to wrap the actual input element for the purposes of adding formatting, help text, labels, etc. When you define a custom template, by default, you would create a blank element with a 'data-input' attribute, which tells the field instance to put the input there when it renders. 

        <script type="text/template" id="my-field-template">
          <div data-input=""></div>
          <p class="help-text"><%= obj.help %></p>
        </script>

Notice that you can obviously still use the template variables normally used on render. You can always add more variables using the ```templateVars``` property for both the FormView and the field views.

Now we can define our extensions:

        // Define an extended FormView with a custom template
        var MyFormView = Backbone.FormView.extend({
          template: _.template($('#my-form-template').html())
        });
        // Define an extended FieldView with a custom template
        var MyFieldView = Backbone.FormView.extend({
          label: 'Default label for MyField fields',
          template: _.template($('#my-field-template').html())
        });

        // Add an alias for your field so you don't have to 
        // refer to the constructor directly
        MyFormView.addFieldAlias('MyField', MyFieldView);

And now you are free to use your extension

        new MyFormView({
          model: new Backbone.Model(),
          schema: {
            name: {
              type: 'MyField'
            }
          }
        });

### Overriding how and when model attributes are set

Backbone.FormView field views, by default, uses 'blur' events for Text fields, 'change' events for SelectList fields, and 'click' events for CheckList, Checkbox, and RadioList fields. When these events occur, the field calls ```setModelAttrs```. If you just want to tweak the value that is set on the model, you can probably just override the ```getValue``` method (note that CheckList doesn't use this method). The ```getValue``` method simply returns the value for the model field that you want to set, which should be the current value of the input. 

Lets say you want to make a number text field, an extension of the Text field where values are converted to a number when set on the model:

          var NumberFieldView = Backbone.fields.FieldView.extend({
            // Intended to be the same as the default implementation, so
            // we call the super method, and then run it through parse float
            getValue: function () {
              return parseFloat(MyFieldView.__super__.getValue.call(this));
            }
          });
          Backbone.FormView.addFieldAlias('NumberField', NumberFieldView);

See? That was easy. Another way to extend model-setting functionality is by overriding the events. Let's say you want attributes to be set only after a keypress, all you have to do is this:

          var KeyPressTextFieldView = Backbone.fields.FieldView.extend({
            events: {
              'keypress input' : 'setModelAttrs'
            }
          });
          Backbone.FormView.addfieldAlias('KeyPressText', KeyPressTextFieldView);

You could write a custom function and use ```_.debounce``` if you want to wait till the user stops typing to set the attributes. If you want to preserve the original 'blur' event functionality, then you just need to add another event for 'blur' that calls ```setModelAttrs```.

Example FormView Demos
----------------------

All of these form's are pretty bare-bones -- just to illustrate the concepts in a simple manner.

* [Example simple form](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-simple-form.html)

* [Example collection form](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-collection-form.html)

* [Example advanced form](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-advanced-form.html)

* [Example Todo App (FormView Version)](http://1stdibs.github.io/backbone-base-and-form-view/examples/example-todo-formview.html)
