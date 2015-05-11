/*jslint node:true */
/*global spyon, beforeeach, describe, expect, it */
"use strict";

var jQuery = window.jQuery;
var $ = jQuery;
var Backbone = require('backbone');
Backbone.$ = jQuery;

var _ = require('underscore');
Backbone = require('../../backbone-formview');
var vdomCreateElement = require('virtual-dom/create-element');
var virtualFormView = require('../../virtual-formview');
var formViewDom = Backbone.formViewDom;

describe('VirtualFormView', function () {
    describe('Overriding element functions', function () {
        describe('createElement', function () {
            var el;
            beforeEach(function () {
                el = formViewDom.createElement('div', {
                    'class': 'foo',
                    id: 'foo-id'
                });
            });
            it('should override Backbone.formViewDom.createElement and create a VirtualNode', function () {
                expect(el.tagName).toBe('DIV');
            });
            it('should resolve attrs param to actual element attributes when resolved to an element', function () {
                var $el = $(vdomCreateElement(el));
                expect($el.attr('class')).toBe('foo');
                expect($el.attr('id')).toBe('foo-id');
            });
        });
        describe('appendElement', function () {
            var parent, child;
            beforeEach(function () {
                parent = formViewDom.createElement('div', { id: 'test-appendElement-parent' });
                child = formViewDom.createElement('p', { className: 'test-appendElement-child' });
                formViewDom.appendElement(child, 'test child text');
                formViewDom.appendElement(parent, child);
            });
            it('should append the child to the children array of the virtual node', function () {
                expect(parent.children[0]).toBe(child);
            });
            it('should become a child element when the virtual-dom is resolved', function () {
                var $parent = $(vdomCreateElement(parent));
                expect(_.isElement($parent.get(0))).toBe(true);
                expect($parent.children().length).toBe(1);
                var $child = $parent.children('p');
                expect($child.length).toBe(1);
                expect($child.hasClass('test-appendElement-child'));
                expect($child.text()).toBe('test child text');
            });
        });
        describe('setElementAttrs', function () {
            var el;
            beforeEach(function () {
                el = formViewDom.createElement('input');
                formViewDom.setElementAttrs(el, {
                    'class': 'test-class',
                    value: 'test-value',
                    type: 'text'
                });
            });
            it('should set properties on the virtual element', function () {
                expect(el.properties.className).toBe('test-class');
                expect(el.properties.value).toBe('test-value');
                expect(el.properties.type).toBe('text');
            });
            it('should resolve to actual dom attributes when real element is created', function () {
                var $el = $(vdomCreateElement(el));
                expect($el.attr('class')).toBe('test-class');
                expect($el.attr('type')).toBe('text');
                expect($el.is('input')).toBe(true);
                expect($el.val()).toBe('test-value');
            });
        });
        describe('setElementValue', function () {
            it('should set the value property on the virtual el and resolve to the elements value on the real element', function () {
                var el = formViewDom.createElement('input');
                formViewDom.setInputElementValue(el, 123);
                expect(el.properties.value).toBe('123');
                expect($(vdomCreateElement(el)).val()).toBe('123');
            });
        });
        describe('setElementText', function () {
            it('should set the text value of the element', function () {
                var el = formViewDom.createElement('div', { 'class':  'foo' });
                formViewDom.appendElement(el, formViewDom.createElement('p', {'class': 'bar'}));
                formViewDom.setElementText(el, 'some text');
                expect($(vdomCreateElement(el)).text()).toBe('some text');
            });
        });
    });
});
