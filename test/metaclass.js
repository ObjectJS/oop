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

describe('extend from type', function() {
	var MC = new Class(Type, {
		__new__: function(metaclass, name, base, dict) {
			var c = Type.__new__(metaclass, name, base, dict);
			return c;
		},
		m: function(cls) {
			return cls;
		}
	});

	var A = new Class({
		__metaclass__: MC
	});

	it('exists', function() {
		ok(A.m);
	});

	it('passed cls with first argument', function() {
		strictEqual(A, A.m());
	});

});

describe('metaclass', function() {
	return;

	var MC = new Class(Type, {
		__new__: function(metaclass, name, base, dict) {
			dict.out = dict.num1 + dict.num2;
			return Type.__new__(metaclass, name, base, dict);
		},
		initialize: function(cls, name, base, dict) {
			cls.out2 = cls.out + 1;
		}
	});

	var A = new Class({
		__metaclass__: MC,
		num1: 1,
		num2: 2
	});

	var a = new A();

	it('__new__', function() {
		equal(a.out, 3);
	});

	it('initialize', function() {
		equal(A.out2, 4);
	});

});
