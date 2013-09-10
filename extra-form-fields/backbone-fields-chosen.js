//     (c) 2013 James Ballantine, 1stdibs.com Inc.
//     Backbone.BaseView may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

/*global Backbone, jQuery, _ */
(function ($, Backbone, window) {
    "use strict";

    // ====================================================
    // ChosenListView

    /**
     * Like Backbone.FormSelectView, except that it creates a chosen select instead.
     * Requires jQuery Chosen plugin (http://harvesthq.github.io/chosen/)
     *
     * -- options inherited from Backbone.fields.FieldView --
     * @param options.fieldName
     * @param [options.templateSrc]
     * @param [options.template]
     * @param [options.templateVars]
     * @param [options.inputId]
     * @param [options.inputClass]
     * @param [options.twoWay]
     *
     * --- options for Backbone.fields.ChosenListView ----
     * @param options.possibleVals
     *      An object with the set of possible choices to display to the user. Each key will be
     *      what is set in the model when the user selects an option, and each value is what
     *      will be used as the option text to display to the user.
     * @param [options.multiple] Boolean if the the chosen should be a multi chosen or not
     * @param [options.placeholder] String text to display when nothing is selected
     */
    Backbone.fields.ChosenListView = Backbone.fields.SelectListView.extend({
        type: 'chzn-list',
        renderInput: function () {
            var $select,
                i = 0,
                placeholder = this.placeholder,
                mult = this.multiple,
                retry = function () {
                    if ($select.data('chosen')) { return; }
                    if ($('body').find($select.get(0)).length) {
                        $select.chosen();
                    } else if (i < 40) {
                        i++;
                        window.setTimeout(retry, 150);
                    }
                };

            if (mult) { this.placeholder = null; }
            Backbone.fields.ChosenListView.__super__.renderInput.call(this);
            $select = this.$('select');
            if (mult) {  $select.attr('multiple', 'multiple'); }
            if (placeholder) { $select.attr('data-placeholder', placeholder); }
            retry();
            return this;
        }
    });

    Backbone.FormView.addFieldAlias('Chosen', Backbone.fields.ChosenListView);

}(jQuery, Backbone, this));