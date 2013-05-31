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
		m1: 1
	});

	var M2 = new Class({
		m2: 2
	});

	var A = new Class(function() {
		this.__mixins__ = [M1, M2];
	});

	var a = new A();

	it('', function() {
	});

});