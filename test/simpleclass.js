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

describe('basic', function() {
	var A = new Class({
		__metaclass__: Function,
		m: function() {
			return this;
		}
	});

	var a = new A();

	it('this', function() {
		strictEqual(a.m(), a);
	});
});