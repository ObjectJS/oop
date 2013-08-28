var assert = require('assert');
var oop = require('../lib/oop.js');
var Class = oop.Class;
var Type = oop.Type;
var property = oop.property;
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
		m: function() {
			return this.a1;
		},
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

});

describe('dynamic class mixin', function() {

	var M = new Class({});

	M.set('a', 1);

	var A = new Class({
		__mixins__: [M]
	});

	M.set('b', 1);

	var a = new A();

	it('before mixin', function() {
		equal(1, a.a);
	});

	it('after mixin', function() {
		strictEqual(undefined, a.b);
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

describe('extend mixin', function() {

	var M = new Class({
		m: function() {
			return this;
		}
	});

	var A = new Class({
		__mixins__: [M]
	});

	var B = new Class(A, {
	});

	var b = new B();

	it('parent', function() {
		strictEqual(b, b.m());
	});

});

describe('mixin native class', function() {
	var M = function() {

	};

	M.prototype.m = function(value) {
		return value;
	};

	var A = new Class({
		__mixins__: [M]
	});

	var a = new A();

	it('mixed', function() {
		equal(a.m('a'), 'a');
	});

});