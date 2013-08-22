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

describe('property', function() {

	var A = new Class(function() {

		this.__metaclass__ = oop.SimpleType;

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

});

describe('simpleinstancemethod', function() {
	var A = new Class({
		__metaclass__: oop.SimpleType,
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

describe('extend', function() {

	var A = new Class({
		__metaclass__: oop.SimpleType,
		a: 1
	});

	var B = new Class(A, {
		b: 1
	});

	var b = new B();

	it('member', function() {
		equal(b.a, 1);
		equal(b.b, 1);
	});
});

describe('simpleinstancemethod with extend', function() {
	var Base = new Class(function() {
		this.__metaclass__ = oop.SimpleType;
		this.m = function() {
			return this;
		};
	});

	var A = new Class(Base, function() {
	});

	var AA = new Class(A, function() {
	});

	var a = new A();
	var aa = new AA();

	it('', function() {
		strictEqual(a, a.m());
		strictEqual(aa, aa.m());
	});

});

describe('parent in simpleinstancemethod', function() {

	var Base = new Class({
		__metaclass__: oop.SimpleType,
		m: function() {
			return 1;
		},
		m3: true
	});

	var A = new Class(Base, {
		m: function() {
			return oop.parent(this) + 1;
		},
		m2: function() {
			return this.__class__.__base__.prototype.m.apply(this, arguments) + 1;
		},
		m3: function() {
			return oop.parent();
		},
		m4: function() {
			return oop.parent();
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

	it('call parent with __base__', function() {
		equal(a.m2(), 2);
	});

	it('no parent method', function() {
		assert.throws(function() {
			a.m3();
		});
		assert.throws(function() {
			a.m4();
		});
	});

});
