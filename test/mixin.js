var assert = require('assert');
var oop = require('../lib/oop.js');
var Class = oop.Class;
var Type = oop.Type;
var property = oop.property;
var classmethod = oop.classmethod;
var staticmethod = oop.staticmethod;
var equal = assert.equal;
var notEqual = assert.notEqual;
var strictEqual = assert.strictEqual;
var ok = assert.ok;

describe('mixin', function() {

	var M1 = new Class({
		a1: 1,
		p1: property(function() {
			return 1;
		}),
		m: function(self) {
			return self.a1;
		},
		cm: classmethod(function(cls, value) {
			return value;
		}),
		sm: staticmethod(function(value) {
			return value;
		})
	});

	var A = new Class(function() {
		this.__mixins__ = [M1];
	});

	var a = new A();

	it('member mixed', function() {
		equal(a.a1, 1);
	});

	it('property mixed', function() {
		equal(a.p1, 1);
	});

	it('instancemethod mixed', function() {
		equal(a.m(), 1);
	});

	it('staticmethod mixed', function() {
		equal(a.sm(1), 1);
	});

	it('classmethod mixed', function() {
		equal(a.cm(1), 1);
	});

});

describe('multiple mixin', function() {
	var M1 = new Class({
		a: 1
	});

	var M2 = new Class({
		a: 2
	});

	var A = new Class({
		__mixins__ : [M1, M2]
	});

	var a = new A();

	it('won\'t override', function() {
		equal(a.a, 1);
	});

});