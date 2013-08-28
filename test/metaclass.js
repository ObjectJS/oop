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

describe('extend from type', function() {
	var newCalled = 0;
	var initCalled = 0;
	var MC = new Class(Type, {
		__new__: function(metaclass, name, base, dict) {
			newCalled++;
			var c = Type.__new__(metaclass, name, base, dict);
			return c;
		},
		initialize: function() {
			initCalled++;
		},
		m: function() {
			return this;
		}
	});

	var A = new Class({
		__metaclass__: MC
	});

	it('exists', function() {
		ok(A.m);
	});

	it('method called', function() {
		equal(newCalled, 1);
		equal(initCalled, 1);
	});

	it('passed cls with first argument', function() {
		strictEqual(A, A.m());
	});

});

describe('metaclass', function() {

	var MC = new Class(Type, {
		__new__: function(metaclass, name, base, dict) {
			dict.out = dict.num1 + dict.num2;
			return Type.__new__(metaclass, name, base, dict);
		},
		initialize: function(name, base, dict) {
			this.out2 = this.out + 1;
		},
		__setattr__: function(name, member) {
			return Type.prototype.__setattr__.call(this, name, member);
		}
	});

	var A = new Class({
		__metaclass__: MC,
		num1: 1,
		num2: 2,
		m: function(){}
	});

	var a = new A();

	it('__new__', function() {
		equal(a.out, 3);
	});

	it('initialize', function() {
		equal(A.out2, 4);
	});

});
