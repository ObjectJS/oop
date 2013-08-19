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
		'initialize': function(self) {
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
		this.a = property(function(self) {
			return Number(self._a || 0);
		}, function(self, value) {
			self._a = value;
		});

		this.b = property(function(self) {
			return 1;
		});

		this.c = property(null, function(self, value) {
			self._c = value;
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

});

describe('instancemethod', function() {

	var A = new Class(function() {
		this.m = function(self) {
			return self;
		};
	});

	var a = new A();

	it('exists', function() {
		ok(A.m);
		ok(a.m);
	});

	it('different function between class and instance', function() {
		notEqual(A.m, a.m);
	});

	it('passed self with first argument in object call', function() {
		strictEqual(a, a.m());
	});

	it('class call', function() {
		var temp = {};
		strictEqual(temp, A.m(temp));
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

describe('classmethod', function() {

	function cm(cls) {
		return cls;
	}

	var A = new Class(function() {
		this.cm = classmethod(cm);
	});

	var a = new A();

	it('object call', function() {
		var cls = A.cm();
		equal(cls, A);
	});

	it('class call', function() {
		var cls = a.cm();
		equal(cls, A);
	});

	it('im_func', function() {
		strictEqual(A.cm.im_func, cm);
		strictEqual(a.cm.im_func, cm);
	});
});

describe('typeOf', function() {

	var A = new Class({
		sm: staticmethod(function() {

		}),
		cm: classmethod(function() {

		})
	});

	var a = new A();

	it('type', function() {
		equal(oop.typeOf(A), 'type');
	});

});