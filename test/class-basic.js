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

describe('class constructor', function() {
	var counter = 0;
	var A = new Class(function() {
		counter = counter + 1;
	});

	it('should run after define a class', function() {
		equal(counter, 1);
	});
});

describe('initialize method', function() {
	var counter = 0;
	var A = new Class(function() {
		this.initialize = function(self) {
			counter++;
		};
	});

	it('should not run after define a class', function() {
		equal(counter, 0);
	});

	it('should run after create instance', function() {
		new A();
		equal(counter, 1);
		new A();
		equal(counter, 2);
	});
});

describe('property', function() {
	var C = new Class({});
	var A = new Class(function(){
		this.a = property(function(self){
			return self.a;
		}, function(self, a) {
			self.a = a;
		});

		this.value = 1;

		this.m = function(self) {
			return self.value;
		};

		this.cm = classmethod(function(cls) {
			return cls.get('value');
		});

		this.sm = staticmethod(function() {
			return this.value;
		});

		this.cls = C;
	});

	A.b = 2;
	var a = new A();

	it('self.get(a) is undefined', function() {
		strictEqual(a.get('a'), undefined);
	});

	it('self.get(a) is 1 after set by a.set(a, 1)', function() {
		a.set('a', 1);
		equal(a.get('a'), 1);
	});

	it('self.get(a) is undefined after set by a.set(a)', function() {
		a.set('a');
		equal(a.get('a'), undefined);
	})

	it('can not set a property value without property(getter, setter)', function() {
		try {
			a.set('b');
			ok(false);
		} catch (e) {
		   ok(true);
		}
	});

	it('cls.get is ok, because A.b=2, so A.get(b) is 2', function() {
		equal(A.get('b'), 2);
	});

	it('A.get(b) should be 4 after A.set(b, 4)', function() {
		A.set('b', 4);
		equal(A.get('b'), 4);
	})

	// get a class memeber
	it('get a class member ok.', function() {
		strictEqual(a.get('cls'), C);
	});

	it('get a class member in class ok.', function() {
		strictEqual(A.get('cls'), C);
	});

	it('mutiple set ok.', function() {
		// mutiple
		a.set({
			'c': 1,
			'd': 1
		});
		ok(a.get('c') == 1 && a.get('d') == 1);
	});

	// method bind
	it('method called.', function() {
		equal(a.m(), 1);
	});

	it('method called.', function() {
		var m = a.get('m');
		equal(m(), 1);
	});

	it('custom bind method call ok.', function() {
		var m = a.get('m', {value: 2});
		equal(m(), 2);
	});

	it('classmethod called.', function() {
		equal(a.cm(), 1);
	});

	it('self bind classmethod called ok.', function() {
		var m = a.get('cm');
		equal(m(), 1);
	});

	it('custom bind classmethod call ok.', function() {
		// 创建一个新的类的实例用于绑定
		var m = a.get('cm', new (new Class({value: 2})));
		equal(m(), 2);
	});

	it('instancemethod called.', function() {
		equal(a.sm(), 1);
	});

	it('self bind instancemethod called ok.', function() {
		var m = a.get('sm');
		equal(m(), 1);
	});

	it('custome bind instancemethod call ok.', function() {
		var m = a.get('sm', {value: 2});
		equal(m(), 2);
	});

	it('no bind called ok.', function() {
		// 不绑定
		var m = a.get('m', false);
		strictEqual(m(), undefined);
	});
});
return;

describe('__getattr__/__setattr__', function() {

	var existsAttrCalled = 0;
	var unexistsAttrCalled = 0;
	var setCalled = 0;

	var A = new Class(function() {
		this.__getattr__ = function(self, name) {
			if (name == 'a') {
				existsAttrCalled++;
				return self.a;
			}
			if (name == 'b') {
				unexistsAttrCalled++;
				return 'b';
			}
		};
		this.__setattr__ = function(self, name, value) {
			setCalled++;
			Object.__setattr__(self, name, value);
		};
		this.a = 1;
	});

	var a = new A();

	it('get exists value ok.', function() {
		equal(a.get('a'), 1); // will not call
	});

	it('get not exists custome value ok.', function() {
		equal(a.get('b'), 'b'); // will call
	});
	
	it('get not exists value ok.', function() {
		equal(a.get('c'), undefined); // will call
	});
	
	it('ok', function() {
		a.set('a', 1); // will call
		equal(a.a, 1);

		a.set('b', 1); // will call
		equal(a.b, 1);
	});

	it('get an exists attr, __getattr__ will not called.', function() {
		equal(existsAttrCalled, 0);
	});

	it('get an unexists attr, __getattr__ will called.', function() {
		equal(unexistsAttrCalled, 1);
	});

	it('set an attr will always call __setattr__.', function() {
		equal(setCalled, 2);
	});

});

describe('__getattr__/__setattr__ in class', function() {
	var setattrCalled = 0;
	var M = new Class(Type, function() {
		this.__setattr__ = function(self, name, value) {
			setattrCalled++;
			Type.__setattr__(self, name, value);
		};
		this.initialize = function(cls) {
			// 这里的set就会触发__setattr__了
			cls.set('test2', 1);
		};
	});

	var A = new Class(function() {
		this.__metaclass__ = M;
	});

	var AA = new M(function() {
	});

	it('value setted', function() {
		A.set('test', 1);
		equal(A.get('test'), 1);
	});

	it('setattr called times ok.', function() {
		// 在类的创建过程中是不会调用自定义的__setattr__的，在initialize中手工调用了2此，因此只调用3次
		equal(setattrCalled, 3)
	});
});

describe('set to null/0/""/undefined/NaN', function() {
	var A = new Class(function() {});

	it('set to null, get null', function() {
		A.set('a', null);
		equal(A.get('a'), null);
	});

	it('set to 0, get 0', function() {
		A.set('b', 0);
		equal(A.get('b'), 0);
	});
	
	it('set to "", get ""', function() {
		A.set('c', "");
		equal(A.get('c'), "");
	});
	
	it('set to undefined, get undefined', function() {
		A.set('c', undefined);
		equal(A.get('c'), undefined);
	});
	
	it('set to NaN, get NaN', function() {
		A.set('c', NaN);
		ok(isNaN(A.get('c')));
	});
});

//set special property: __mixins__/__metaclass__/__new__/__this__/__base__
describe('set special property : __mixins__', function() {
	var mixin = new Class(function() {
		this.mixin_by_mixin = function() {
			return 1;
		}
	});
	var A = new Class(function(){
		Class.mixin(this, mixin);
	});

	var a = new A();

	A.set('__mixins__', 'mixin');

	it('__mixins__ can not be set as string', function() {
		notEqual(A.get('__mixins__'), undefined);
	});

	it('new A() won\'t raises error after __mixins__ is setted to string.', function() {
		try {
			var b = new A();
			ok(true);
		} catch (e) {
			ok(false);
		}
	});
});

describe('set special property : __metaclass__', function() {
	var meta = new Class(Type, function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			return Type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(function(){
		this.__metaclass__ = meta;
	});

	A.set('__metaclass__', 'string');

	it('__metaclass__ is changed if set to string', function() {
		equal(A.get('__metaclass__'), undefined);
	});

	it('B inherited from A is ok after __metaclass__ is setted to string', function() {
		try {
			var B = new Class(A, function() {});
			ok(true);
		} catch (e) {
			ok(false);
		}
	});

});

describe('set special property : __new__', function() {
	var A = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			return Type.__new__(cls, name, base, dict);
		};
	});
	A.set('__new__', 'string');

	it('__new__ is not changed if set to string', function() {
		notEqual(A.get('__new__'), undefined);
	});

	it('new A() is ok after __new__ is setted to string.', function() {
		try {
			var B = new Class(function() {
				this.__metaclass__ = A;
			});
			ok(true);
		} catch (e) {
			ok(false);
		}
	});
});

describe('set special property : __this__', function() {
	var A = new Class(function(){
		this.a = classmethod(function(cls) {
			return cls._name;
		});
	});

	A._name = 1;
	var B = new Class(A, function() {
		this.a = classmethod(function(cls) {
			return this.parent();
		});
	});

	it('__this__ is not changed if set to string', function() {
		B.set('__this__', 'string');
		notEqual(B.get('__this__'), 'string');
	});

	B._name = 1;

	it('B.a() won\'t raises error after set __this__ to string.', function() {
		try {
			equal(A.a(), 1);
			equal(B.a(), 1);
			ok(true);
		} catch (e) {
			ok(false);
		}
	});

});

describe('set special property : __base__', function() {
	var A = new Class(function(){
		this.a = function(self) {
			return 1;
		}
	});
	var B = new Class(A, function(){
		this.a = function(self) {
			return this.parent();
		}
	});

	B.set('__base__', 'string');

	it('__base__ is not changed if set to string', function() {
		notEqual(B.get('__base__'), 'string');
	});

	it('xxx.parent() is ok, after __base__ is setted to string', function() {
		var b = new B();
		try {
			equal(b.a(), 1);
		} catch (e) {
			ok(false);	
		}
	});
});

describe('set special property : @mixins', function() {
	var mixin = new Class(function() {
		this.mixin_by_mixin = function() {
			return 1;
		}
	});
	var A = new Class(function(){
		Class.mixin(this, mixin);
	});

	A.set('@mixins', 'mixin');

	it('set @mixins, but only can get by __mixins__, not convenient', function() {
		notEqual(A.get('@mixins'), 'mixin');
	});

	it('new A() is ok after @mixins is setted to string', function() {
		try {
			var b = new A();
			ok(true);
		} catch (e) {
			ok(false);
		}
	});

});

//set instancemethod/classmethod/staticmethod/property
//set, then check Class/Class.prototype/instance.prototype
//set is different in class and instance(cls.set/instance.set/cls.get/instance.get);
//set B extended from A, whether A.set will cause changes of B?
describe('overwrite class members, by set', function() {
	var A = new Class(function(){
		this.a = 1;
		this.a1 = 1;
		this.a2 = 1;
		this.a3 = 1;
		this.a4 = 1;
		this.b = function(self) { return 1; };
		this.b1 = function(self) { return 1; };
		this.b2 = function(self) { return 1; };
		this.b3 = function(self) { return 1; };
		this.b4 = function(self) { return 1; };
		this.c = staticmethod(function() { return 1; });
		this.c1 = staticmethod(function() { return 1; });
		this.c2 = staticmethod(function() { return 1; });
		this.c3 = staticmethod(function() { return 1; });
		this.c4 = staticmethod(function() { return 1; });
		this.d = classmethod(function(cls) { return 1; });
		this.d1 = classmethod(function(cls) { return 1; });
		this.d2 = classmethod(function(cls) { return 1; });
		this.d3 = classmethod(function(cls) { return 1; });
		this.d4 = classmethod(function(cls) { return 1; });
		this.e = property(function(self) { return 1; });
		this.e1 = property(function(self) { return 1; });
		this.e2 = property(function(self) { return 1; });
		this.e3 = property(function(self) { return 1; });
		this.e4 = property(function(self) { return 1; });
	});

	var a = new A();

	it('property e is ok before overwrite, after overwrite, it will be deleted', function() {
		equal(a.get('e'), 1);
	});

	//if member is not a property, then it can not be overwrited by non-property member, especially in inheritance;
	A.set('a', 2);
	A.set('a1', function() { return 2});
	A.set('a2', staticmethod(function() { return 2}));
	A.set('a3', classmethod(function(cls) { return 2}));
	A.set('a4', property(function(self) { return 2}));
	A.set('b', 2);
	A.set('b1', function() { return 2});
	A.set('b2', staticmethod(function() { return 2}));
	A.set('b3', classmethod(function(cls) { return 2}));
	A.set('b4', property(function(self) { return 2}));
	A.set('c', 2);
	A.set('c1', function() { return 2});
	A.set('c2', staticmethod(function() { return 2}));
	A.set('c3', classmethod(function(cls) { return 2}));
	A.set('c4', property(function(self) { return 2}));
	A.set('d', 2);
	A.set('d1', function() { return 2});
	A.set('d2', staticmethod(function() { return 2}));
	A.set('d3', classmethod(function(cls) { return 2}));
	A.set('d4', property(function(self) { return 2}));
	A.set('e', 2);
	A.set('e1', function() { return 2});
	A.set('e2', staticmethod(function() { return 2}));
	A.set('e3', classmethod(function(cls) { return 2}));
	A.set('e4', property(function(self) { return 2}));

	var a = new A();

	it('overwrite, from attribute to attribute', function() {
		equal(a.a, 2);
	});

	it('overwrite, from instancemethod to attribute', function() {
		equal(a.b, 2);
	});

	it('overwrite, from staticmethod to attribute', function() {
		equal(a.c, 2);
	});

	it('overwrite, from classmethod to attribute', function() {
		equal(a.d, 2);
	});

	it('overwrite, from property to attribute', function() {
		equal(a.e, 2);
	});

	it('overwrite, from attribute to instancemethod', function() {
		equal(a.a1(), 2);
	});

	it('overwrite, from instancemethod to instancemethod', function() {
		equal(a.b1(), 2);
	});

	it('overwrite, from staticmethod to instancemethod', function() {
		equal(a.c1(), 2);
	});

	it('overwrite from classmethod to instancemethod, changed the behavior of d1', function() {
		try {
			A.d1();
			ok(false);
		} catch (e) {
			ok(true);
		}
	});

	it('overwrite, from property to instancemethod', function() {
		equal(a.e1(), 2);
	});

	it('overwrite, from attribute to staticmethod', function() {
		equal(a.a2(), 2);
	});

	it('overwrite, from instancemethod to staticmethod', function() {
		equal(a.b2(), 2);
	});

	it('overwrite, from staticmethod to staticmethod', function() {
		equal(a.c2(), 2);
	});

	it('overwrite, from classmethod to staticmethod', function() {
		equal(A.d2(), 2);
	});

	it('overwrite, from property to staticmethod', function() {
		equal(a.e2(), 2);
	});

	it('overwrite from attribute to classmethod, changed the behavior of a3', function() {
		try {
			a.a3();
		} catch (e) {
			ok(true);
		}
	});

	it('overwrite from instancemethod to classmethod, changed the behavior of b3', function() {
		try {
			equal(a.b3(), 2);
		} catch (e) {
			ok(false);
		}
	});

	it('overwrite from staticmethod to classmethod, changed the behavior of c3', function() {
		try {
			equal(a.c3(), 2);
		} catch (e) {
			ok(false);
		}
	});

	it('overwrite, from classmethod to classmethod', function() {
		equal(A.d3(), 2);
	});

	it('overwrite from property to classmethod, changed the behavior of e3', function() {
		try {
			equal(a.e3(), 2);
		} catch (e) {
			ok(false);
		}
	});

	it('overwrite from instancemethod to property, changed the behavior of b4', function() {
		try {
			a.b4();
		} catch (e) {
			ok(true);
		}
	});

	it('overwrite from staticmethod to property, changed the behavior of c4', function() {
		try {
			a.c4();
		} catch (e) {
			ok(true);
		}
	});

	it('overwrite from classmethod to property, changed the behavior of d4', function() {
		try {
			A.d4();
		} catch (e) {
			ok(true);
		}	
	});

	it('overwrite, from property to property', function() {
		equal(a.get('e4'), 2);
	});
});

describe('set after class instance is created', function() {
	var A = new Class(function() {
		this.a = 1;
		this.b = function(self){return 1;};
		this.c = staticmethod(function(){return 1;});
		this.d = classmethod(function(cls){return 1;});
		this.e = property(function(self){return 1;});
	});
	var a = new A();

	it('e is an property, get(e) ok', function() {
		equal(a.get('e'), 1);
	});

	it('A.set changed the behavior of a.get(e), even after instance is created', function() {
		A.set('e', 2);
		try {
			a.get('e');
		} catch (e) {
			ok(true);
		}
	});
});

return;
describe('set after extended by many classes', function() {
	var A = new Class(function() {
		this.e = property(function(self){return 1;});
	});
	//assume: in one place
	A.set('e', 1);
	var B = new Class(A, function() {});

	//assume: in another place
	var C = new Class(A, function() {});
	var c = new C();
	try {
		equal(c.get('e'), 1, 'c.get(e) is ok after A.set(e, 1)');
	} catch (e) {
		ok(true, 'A.set(e) changed the behavior of C');
	}
	A._name = 'A';	
	B._name = 'B';
	C._name = 'C';
	A.set('e', 1);
	equal(c.e, 1, 'subclass instance attribute changed after parent class called A.set(xxx,value)');
	var b = new B();
	equal(b.e, 1, 'subclass attribute changed after A.set(xxx,value)');
	A.set('f', {prop:1});
	equal(c.f.prop, 1, 'subclass instance attribute changed after parent class called A.set(xxx,{prop:1})');
	var b = new B();
	equal(b.f.prop, 1, 'subclass attribute changed after A.set(xxx,{prop:1})');

	A.set('d', classmethod(function(cls) {
		return cls._name;
	}));
	equal(A.d(), 'A', 'parent A set classmethod d, A.d() should be ok');
	try {
		equal(B.d(), 'B', 'parent A set classmethod d, subclass B inherited, B.d() should be ok');
	} catch (e) {
		ok(false, 'parent A set classmethod d, subclass B inherited, B.d() should be ok');
	}
	try {
		equal(C.d(), 'C', 'parent A set classmethod d, subclass C inherited, C.d() should be ok');
	} catch (e) {
		ok(false, 'parent A set classmethod d, subclass C inherited, C.d() should be ok');
	}

	A.set('g', staticmethod(function() {
		return 1;
	}));
	equal(A.g(), 1, 'parent A set staticmethod g, A.g() should be ok');
	try {
		equal(B.g(), 1, 'parent A set staticmethod g, subclass B inherited, staticmethod B.g() should be ok');
	} catch (e) {
		ok(false, 'parent A set staticmethod g, subclass B inherited, B.g() should be ok');
	}
	try {
		equal(C.g(), 1, 'parent A set staticmethod g, subclass C inherited, C.g() should be ok');
	} catch (e) {
		ok(false, 'parent A set staticmethod g, subclass C inherited, C.g() should be ok');
	}
});

describe('instancemethod', function() {
	customBinderMethodCalled = 0;

	var A = new Class(function() {
		this.a = function(self) {
			ok(self != this, 'self != this in instancemethod, self is the instance, "this" is an simple Object{base, parent}');
			try {
				this.parent();
				ok(false, 'if there is no parent method, this.parent() should not cause an error ');
			} catch (e) {
				ok(true, 'if there is no parent method, this.parent() should not cause an error : ' + e);
			}
			return 1;
		};
		this.b = function(self, value) {
			return arguments;
		};
	});

	var B = new Class(function() {
		this.b = function(self, value) {
			customBinderMethodCalled++;
			return arguments;
		};
	});

	ok(typeof instancemethod == 'undefined', 'instancemethod is not public');

	var a = new A();
	ok(a.a.__class__ != null, 'the __class__ of instancemethod is not null, actually it is instancemethod');
	equal(a.a(), 1, 'instancemethod return correct value');	
	equal(A.a, undefined, 'instancemethod can not be retrieved by Class A.a');

	// A.get('a')获取到一个绑定的方法
	notEqual(A.get('b'), a.b, 'A.b != a.b.');
	A.tt = 1;
	// 传递绑定，为默认
	var arg1 = {a:1};
	var arg2 = 1;
	var result = A.get('b', A)(arg1, arg2);
	equal(result[0], arg1, 'set default bind method return value ok.');

	// cls.get 却绑定一个对象，由于没有prototype，会报错
	try {
		var result = A.get('b', {})(arg1, arg2);
		ok(false, 'cls.get bind a object throw a error.')
	} catch(e) {
		ok(true, 'cls.get bind a object throw a error.')
	}

	// cls.get 不绑定
	try {
		var result = A.get('b', false)(arg1, arg2);
		ok(false, 'cls.get bind a object throw a error.')
	} catch(e) {
		ok(true, 'cls.get no bind throw a error.')
	}

	var result = A.get('b', B)(arg1, arg2);
	equal(customBinderMethodCalled, 1, 'set custom bind method called ok.');
	equal(result[0], arg1, 'set custom bind method return value ok.');

});

describe('classmethod', function() {
	equal(classmethod(function(){}).__class__, classmethod, 'the __class__ of method wrapped by classmethod, is classmethod');
	var A = new Class(function() {
		this.a = classmethod(function(cls) {
			return 1;
		});
		this.getName = classmethod(function(cls) {
			return cls._name;
		});
	});
	A._name = 'A';
	equal(A.a(), 1, 'classmethod return correct value');
	equal(A.getName(), 'A', 'classmethod return correct class attribute');
	var a = new A();
	try {
		equal(a.a(), 1, 'a is classmethod, instance.a is ok');
	} catch (e) {
		ok(false, 'classmethod can not be retrieved by instance a.a : ' + e);
	}
});

describe('staticmethod', function() {
	equal(staticmethod(function(){}).__class__, staticmethod, 'the __class__ of method wrapped by staticmethod, is staticmethod');
	var A = new Class(function() {
		this.a = staticmethod(function() {
			return 1;
		});
	});
	var a = new A();
	equal(A.a(), 1, 'staticmethod can be retrieved by Class A.a');
	equal(a.a(), 1, 'staticmethod can be retrieved by instance a.a');
});

describe('property', function() {
	equal(property(function(){}).__class__, property, 'the __class__ of method wrapped by property, is property');
	var A = new Class(function() {
		this.initialize = function(self) {
			self._a = 1;
		};
		this.a = property(function(self) {
			return self._a;
		}, function(self, a) {
			self._a = a;
		});
	});
	var a = new A();
	equal(a.get('a'), 1, 'property initialized successfully');
	a.set('a', 2);
	equal(a.get('a'), 2, 'property get and set successfully');
});

describe('class member in class', function() {

	var A = new Class({});
	var B = new Class(object, {});
	var C = new Class(B, {});

	var D = new Class(Type, {});
	var E = new Class(D, {});
	var F = new E(D, {});
	var G = new F({});

	var H = new D({});
	var I = new Class({
		__metaclass__: E
	});

	var Test = new Class({
		A: A,
		B: B,
		C: C,
		D: D,
		E: E,
		F: F,
		G: G,
		H: H,
		I: I
	});
	var test = new Test();
	ok(Test.A, 'general class in class.');
	ok(Test.B, 'object-based class in class.');
	ok(Test.C, 'extended class in class.');
	ok(Test.D, 'type-based class in class.');
	ok(Test.E, 'extended type-based class in class.');
	ok(Test.F, 'type-based class created by new metaclass in class.');
	ok(Test.G, 'class created by new type-based metaclass in class.');
	ok(Test.H, 'class created by new metaclass in class.');
	ok(Test.I, 'class created by __metaclass__ in class.');
	ok(test.A, 'general class in instance.');
	ok(test.B, 'object-based class in instance.');
	ok(test.C, 'extended class in instance.');
	ok(test.D, 'type-based class in instance.');
	ok(test.E, 'extended type-based class in instance.');
	ok(test.F, 'type-based class created by new metaclass in instance.');
	ok(test.G, 'class created by new type-based metaclass in instance.');
	ok(test.H, 'class created by new metaclass in instance.');
	ok(test.I, 'class created by __metaclass__ in instance.');
});

//set : name/constructor/prototype...
describe('name/constructor/prototype as member of class', function() {
	//this.name == ...
	//A.set('name', fdafda);
	var A = new Class(function() {});
	A.set('name', 'A');
	// name is controlled by browser, can not be set;
	//equal(A.get('name'), 'A', 'name should be ok..');
});

describe('new Class, parent is Array/String', function() {
	var SubArray = new Class(Array, function() {
		this.a = 1;
		this.initialize = function(self) {
			self.b = 1;
		};
		this.method = function(self) {
			return 1;
		};
	});
	var SubString = new Class(String, function() {
		this.a = 1;
		this.initialize = function(self) {
			self.b = 1;
		};
		this.method = function(self) {
			return 1;
		};
	});

	var array = new SubArray();
	equal(array.a, 1, 'property in SubArray is ok');
	equal(array.b, 1, 'property in SubArray instance is ok');
	array.push(1);
	array.push(2);
	equal(array.indexOf(2), 1, 'SubArray.indexOf is ok');
	equal(array.length, 2, 'SubArray.length is ok');
	equal(array.method(), 1, 'SubArray.method is ok');
	var string = new SubString();
	equal(string.a, 1, 'property in SubString is ok');
	equal(string.b, 1, 'property in SubString instance is ok');
	equal(string.method(), 1, 'SubString.method is ok');
	notEqual(string.charAt, undefined, 'SubString.charAt is not undefined');
	equal(string.charAt.call('1235', 1), 2, 'charAt is usable');
	try {
		// error in Firefox...
		equal(string.length, 0, 'string.length is ok');
	} catch (e) {
	}
});
