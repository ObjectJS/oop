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

describe('basic', function() {

	var A = new Class(function() {
		this.empty1 = null;
		this.empty2 = undefined;
		this.empty3 = '';
		this.number1 = 1;
		this.bool1 = true;
		this.bool2 = false;
	});
	var a = new A();

	it('empty member', function() {
		strictEqual(A.empty1, null);
		strictEqual(a.empty1, null);
		strictEqual(A.empty2, undefined);
		strictEqual(a.empty2, undefined);
		strictEqual(A.empty3, '');
		strictEqual(a.empty3, '');
	});

	it('number member', function() {
		strictEqual(A.number1, 1);
		strictEqual(a.number1, 1);
	});

	it('boolean member', function() {
		strictEqual(A.bool1, true);
		strictEqual(a.bool1, true);
		strictEqual(A.bool2, false);
		strictEqual(a.bool2, false);
	});

});

describe('initialize', function() {

	var initRuned = 0;

	var A = new Class({
		'initialize': function() {
			initRuned++;
		}
	});

	it('runed', function() {
		var a = new A();
		equal(initRuned, 1);
	});

});

describe('property', function() {

	var A = new Class(function() {

		this.a = property(function() {
			return Number(this._a || 0);
		}, function(value) {
			this._a = value;
		});

		this.b = property(function() {
			return 1;
		});

		this.c = property(null, function(value) {
			this._c = value;
		});
	});

	var a = new A();

	it('readable and writable with getter and setter', function() {
		strictEqual(a.a, 0);
		a.a = '2';
		strictEqual(a.a, 2);
	});

	it('throw error without setter when write', function() {
		assert.throws(function() {
			'use strict'
			a.b = 1;
		}, TypeError);
	});

	it('return undefined without getter when read', function() {
		'use strict'
		a.c = 1;
		strictEqual(a.c, undefined);
	});

	it('dynamic setter', function() {
		A.__setattr__('d', property(function() {return 1}));
		strictEqual(a.d, 1);
	});

});

describe('instancemethod', function() {

	var A = new Class({
		m: function() {
			return this;
		}
	});

	var a = new A();

	it('exists', function() {
		ok(!A.m);
		ok(a.m);
	});

	it('this', function() {
		strictEqual(a.m(), a);
	});
});

describe('staticmethod', function() {

	var A = new Class(function() {
		this.sm = staticmethod(function(value) {
			return value;
		});
	});

	var a = new A();

	it('exists', function() {
		ok(A.sm);
		ok(a.sm);
	});

	it('same function in class and instance', function() {
		strictEqual(A.sm, a.sm);
	});

	it('object call', function() {
		strictEqual(a.sm(1), 1);
	});

	it('class call', function() {
		strictEqual(A.sm(1), 1);
	});
});

describe('typeOf', function() {

	var A = new Class({});

	var a = new A();

	it('type', function() {
		equal(oop.typeOf(A), 'type');
	});

});
