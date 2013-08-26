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

	var A = new Class({
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

describe('private member', function() {
	var A = new Class({
		__a: 1,
		__m: function() {}
	});
	var B = new Class(A, {
	});
	var a = new A();
	var b = new B();

	it('accessors in Base', function() {
		strictEqual(A.__a, 1);
		strictEqual(a.__a, 1);
		ok(A.__m);
		ok(a.__m);
	});

	it('accessors in extended', function() {
		strictEqual(B.__a, undefined);
		strictEqual(B.__m, undefined);
		strictEqual(b.__a, undefined);
		strictEqual(b.__m, undefined);
	})

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
		},
		m3: true
	});

	var A = new Class(Base, {
		m: function(self) {
			return this.parent(self) + 1;
		},
		m2: function(self) {
			return this.base.m(self) + 1;
		},
		m3: function(self) {
			return this.parent();
		},
		m4: function(self) {
			return this.parent();
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

	it('no parent method', function() {
		assert.throws(function() {
			a.m3();
		});
		assert.throws(function() {
			a.m4();
		});
	});

});

describe('parent in classmethod', function() {
	var Base = new Class({
		cm: classmethod(function(cls) {
			return 1;
		})
	});

	var A = new Class(Base, {
		cm: classmethod(function(cls) {
			return this.parent() + 1;
		}),
		cm2: classmethod(function(cls) {
			return this.base.cm() + 1;
		})
	});

	var AA = new Class(A, function() {
	});

	var a = new A();
	var aa = new AA();

	it('call parent with this.parent', function() {
		equal(a.cm(), 2);
	});

	it('call parent with this.parent in 2-level extend', function() {
		equal(aa.cm(), 2);
	});

	it('call parent with this.base', function() {
		equal(a.cm2(), 2);
	});
});

describe('extend native class', function() {

	var A = function() {

	}

	A.prototype.a = function() {
		return 'a'
	};

	var B = new Class(A, {

	});

	var b = new B();

	it('method inherited', function() {
		equal(b.a(), 'a');
	});
});