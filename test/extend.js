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

describe('instancemethod with extend', function() {
	var Base = new Class(function() {
		this.m = function() {
			return this;
		};
		this.m2 = function() {
			return arguments;
		}
	});

	var A = new Class(Base, function() {
	});

	var AA = new Class(A, function() {
	});

	var a = new A();
	var aa = new AA();

	it('this', function() {
		strictEqual(a, a.m());
		strictEqual(aa, aa.m());
	});

	it('arguments', function() {
		strictEqual(0, a.m2().length);
		strictEqual('a', aa.m2('a')[0]);
	});

});


describe('parent in instancemethod', function() {

	var Base = new Class({
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

describe('private member', function() {
	var A = new Class({
		__a: 1,
		__m: function() {
			this.__a = 2;
		},
		__sm: staticmethod(function(value) {
			return value;
		})
	});
	var B = new Class(A, {
	});
	var a = new A();
	var b = new B();

	it('accessors in base', function() {
		strictEqual(A.__a, 1);
		strictEqual(a.__a, 1);
		ok(a.__m);
		strictEqual(a.__sm(1), 1);
	});

	it('accessors in extended', function() {
		strictEqual(B.__a, undefined);
		strictEqual(b.__a, undefined);
		strictEqual(b.__m, undefined);
		strictEqual(B.__sm, undefined);
		strictEqual(b.__sm, undefined);
	});

	it('set', function() {
		a.__m();
		strictEqual(a.__a, 2);
	});

});
