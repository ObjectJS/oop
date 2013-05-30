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

describe('extend', function() {

	var Base = new Class({
		a: 1
	});

	var A = new Class(Base, {
		b: 1
	});

	var a = new A();

	it('member', function() {
		equal(a.a, 1);
		equal(a.b, 1);
	});

});

describe('instancemethod with extend', function() {
	var Base = new Class(function() {
		this.m = function(self) {
			return self;
		};
	});

	var A = new Class(Base, function() {
	});

	var AA = new Class(A, function() {
	});

	var a = new A();
	var aa = new AA();

	it('pass self with first argument in oeject call', function() {
		strictEqual(a, a.m());
		strictEqual(aa, aa.m());
	});

});

describe('parent in instancemethod', function() {

	var Base = new Class({
		m: function(self) {
			return 1;
		}
	});

	var A = new Class(Base, {
		m: function(self) {
			return this.parent(self) + 1;
		},
		m2: function(self) {
			return this.base.m(self) + 1;
		}
	});

	var AA = new Class(A, function() {
	});

	var a = new A();
	var aa = new AA();

	it('call parent with this.parent', function() {
		equal(a.m(), 2);
	});

	it('call parent with this.parent in 2-level extend', function() {
		equal(aa.m(), 2);
	});

	it('call parent with this.base', function() {
		equal(a.m2(), 2);
	});

});
