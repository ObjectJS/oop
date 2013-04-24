module('class-usage');

test('new class', function() {
	try {
		var A = new Class();
		ok(false, 'empty class is ok');
	} catch (e) {
		ok(true, 'empty class is ok : ' + e);
	}
});

test('extend from non-class value', function() {
	var values = $UNIT_TEST_CONFIG.testEdges;
	for(var prop in values) {
		try {
			new Class(values[prop], function() {});
			if ( typeof values[prop] != 'object' && typeof values[prop] != 'function') {
				ok(false, 'extend from ' + prop + ' should be considered');
			}
		} catch (e) {
		}
		try {
			new Class(values[prop]);
			if ( typeof values[prop] != 'object' && typeof values[prop] != 'function') {
				ok(false, 'extend from ' + prop + ', no constructor, should be considered');
			}
		} catch (e) {
		}
	}
	try {
		var A = new Class(A, function() {});
		ok(false, 'extend from self should be considered');
	} catch (e) {
	}
});

test('extend Array/String', function() {
	var A = new Class(Array, function() {});
	var a = new A();
	equal(a.length, 0, 'empty array sub class');
	ok(a.indexOf != undefined, 'Array methods inherited by A');
	equal(a.indexOf.call([1,2,3], 2), 1, 'indexOf in a is ok');
	ok(a.concat!= undefined, 'Array methods inherited by A');

	var B = new Class(String, function() {});
	var b = new B();
	try {
		// b.length causes error : TypeError: String.prototype.toString called on incompatible Object
		// in firefox 3.6.25
		equal(b.length, 0, 'empty string sub class');
	} catch (e){}
	ok(b.trim != undefined, 'String methods inherited by B');
	if(b.trim != undefined) {
		equal(b.trim.call('  123   '), '123', 'trim method in b is ok');
	}
});

test('A complete Class', function() {
	var mixin = new Class(function() {
		this.mixined = function() { return 1; };
		this.same = function(self) {return 'mixined'};
	});
	var Parent = new Class(function() {
		this.extended = function() { return 1; };
		this.same = function(self) {return 'Parent'};
	});
	var metaclass = new Class(type, function() {
		this.initialize = function(cls, name, base, dict) {
			cls.metaclassed = function(self) {
				return 1;
			};
		};
		this.__new__ = function(cls, name, base, dict) {
			return type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(Parent, function() {
		this.__metaclass__ = metaclass;
		Class.mixin(this, mixin);
		this.initialize = function(self) {self._a = 1;};
		this.a = 1;
		this.b = function(self) { return 1; };
		this.c = staticmethod(function() { return 1; });
		this.d = classmethod(function(cls) { return 1; });
		this.e = property(function(self) { return self._a; }, function(self, v) {self._a = v;});
		this.same = function(self) {return 'A'};
	});
	A.set('f', 1);

	var a = new A();
	equal(a.a, 1, 'attribute is ok');
	equal(a.b(), 1, 'instancemethod is ok');
	equal(a.c(), 1, 'staticmethod is ok');
	equal(A.d(), 1, 'classmethod is ok');
	equal(a.get('e'), 1, 'property getter is ok');
	a.set('e', 2);
	equal(a.get('e'), 2, 'property setter is ok');
	equal(A.get('f'), 1, 'property set after Class construction is ok');
	equal(a.mixined(), 1, 'mixined method is ok');
	equal(a.extended(), 1, 'extended method is ok');
	equal(A.metaclassed(), 1, 'metaclassed method is ok');
	equal(a.same(), 'A', 'class member has the highest priority');
});

test('extend class', function() {
	var A = new Class(function() {
		this.a = function() {return 'a';}
	}); 
	A._name = 'A';
	var B = new Class(A, function() {
		this.b = function() {return 'b';}
	});
	B._name = 'B';

	b = new B();

	A.set({
		prop : {foo:1},
		method: function() {
			return 'method';
		},
		staticMethod : staticmethod(function() {
			return 'staticmethod';
		}),
		classMethod : classmethod(function(cls) {
			return cls._name;
		})
	});
	b.prop.bar = 2;

	equal(b.prop.foo, 1, 'property');
	equal(b.prop.bar, 2, 'property');
	equal(b.a(), 'a', 'method from parent');
	equal(b.b(), 'b', 'method from son');
	equal(b.method(), 'method', 'method is setted by A.method');
	equal(A.classMethod(), 'A', 'A.classMethod called successfully');
	try {
		B.classMethod();
		ok(true, 'class method should be inheritted from parent class');
	} catch (e) {
		ok(false, 'class method should be inheritted from parent class : ' + e);
	}
	equal(A.staticMethod(), 'staticmethod', 'staticmethod called by A.staticMethod');
	try {
		B.staticMethod()
	   	ok(true, 'static method should be inheritted from parent class');
	} catch (e) {
	   ok(false, 'static method should be inheritted from parent class : ' + e);
	}
});

test('staticmethod/classmethod extend', function() {
	var A = new Class(function() {
		this.a = classmethod(function() {
			return 1;
		});

		this.b = staticmethod(function() {
			return 2;
		});
	});
	A._name = 'A';
	A.c = function() {
		return 3;
	};

	var B = new Class(A, function() {
	});
	B._name = 'B';

	A.set('d', classmethod(function() {
		return 4;
	}));
	A.set('e', staticmethod(function() {
		return 5;
	}));

	var C = new Class(B, function() {
	});
	C._name = 'C';

	// 一级继承
	equal(B.a(), 1, 'classmethod extended.');
	equal(B.b(), 2, 'staticmethod extended.');
	ok(B.c == undefined, 'none-maintain method not extended.');
	equal(B.d(), 4, 'classmethod extended.');
	equal(B.e(), 5, 'staticmethod extended.');

	// 两级继承
	equal(C.a(), 1, 'classmethod extended.');
	equal(C.b(), 2, 'staticmethod extended.');
	equal(C.d(), 4, 'classmethod extended.');
	equal(C.e(), 5, 'staticmethod extended.');
});

test('do not overwrite exists member in subclass', function() {
	var A = new Class(function() {
		this.a = 1;
		this.b = property(function(self) {
			return 1;
		});
	});
	var B = new Class(A, function() {
		this.a = undefined;
		this.b = undefined;
	});
	var b = new B();
	ok('a' in b, 'a should be in b');
	equal(b.a, undefined, 'a in subclass is undefined, should not be overwrited');
	equal(b.b, undefined, 'b in subclass is undefined, should not be overwrited');
});

test('reference members in class - Array', function() {
	var array = [];
	var A = new Class(function() {
		this.add = function(self) {
			array.push(1);
		};
	});
	var B = new Class(A, function() {});
	var a = new A();
	var b = new B();
	a.add();
	b.add();
	equal(array.length, 2, 'method reference global object');

	var A = new Class(function() {
		// class member, ok
		this.a = [];
	});
	var B = new Class(A, function() {});
	var a = new A();
	var b = new B();
	a.a.push(1);
	equal(b.a.length, 1, 'a is class member array, when modified in parent class, member in subclass should also be modified');
	var b = new B();
	equal(b.a.length, 1, 'new an instance of B, array length should be 1');
	
	var A = new Class(function() {
		this.a = [];
	});
	var B = new Class(A, function() {});
	var b = new B();
	b.a.push(1);
	equal(b.a.length, 1, 'b.a.push(1), by instance of subclass, b.a.length should be 1');
	var a = new A();
	equal(a.a.length, 1, 'b.a.push(1), a.a.length should be 1');
});

test('reference members in class - Object', function() {
	var A = new Class(function() {
		this.a = {};
	});
	var B = new Class(A, function() {});
	var a = new A();
	var b = new B();
	a.a.prop = 1;
	equal(b.a.prop, 1, 'a is class member object, when modified in parent class, member in subclass should not be modified');
	var b = new B();
	equal(b.a.prop, 1, 'a is class member object, new an instance of B, b.a.prop should be 1');
	
	var A = new Class(function() {
		this.a = {};
	});
	var B = new Class(A, function() {});
	var b = new B();
	b.a.prop = 1;
	equal(b.a.prop, 1, 'b.a.prop = 1, by instance of subclass, b.a.prop should be 1');
	var a = new A();
	equal(a.a.prop, 1, 'instance of A, a.a.prop should be 1');
});

test('closure in Class', function() {
	var Test = new Class(function() {
		a = {};
		this.initialize = function(self) {
			self.a = a;
		}
		this.add = function(self, name, value) {
			self.a[name] = value;    
		}
	});
	var t1 = new Test();
	t1.add('ok', 'ok');
	var t2 = new Test();
	t2.add('ok2', 'ok2');
	equal(t1.a.ok, 'ok', 't1 add ok, so t1.a.ok is ok');
	equal(t2.a.ok, 'ok', 't2 did not add ok, but share same closure with t1, so t2.a.ok should be ok');
	equal(t1.a.ok2, 'ok2', 't1 did not add ok2, but share same closure with t1, so t1.a.ok2 should be ok2');
	equal(t2.a.ok2, 'ok2', 't2 add ok2, so t2.a.ok2 is ok2');
});

test('speed test', function() {
	return; // costs time, do this test seperately;
	var st = new Date().getTime();
	var proto = {};
	for (var i = 0; i < 10000; i++) {
		proto['m' + i] = classmethod(function(self){}.bind(i));
	}
	var MyClass = new Class(proto);
	var time = new Date().getTime() - st;
	ok(time < 100, 'total time(10000 times) is less than 100ms : ' + time + 'ms');
});

test('duplicate assignment', function() {
	// backup console.warn
	if (typeof console == 'undefined') {
		console = {};
		console.warn = function() {};
	}
	var old = console.warn;

	console.warn = function() {
		ok(true, arguments[0]);
	};
	var A = new Class(function() {
		this.a = function(self) {};
		this.b = this.a;

		this.c = classmethod(function(cls) {});
		this.d = this.c;

		this.e = staticmethod(function() {});
		this.f = this.e;

		this.g = property(function(self) {});
		this.h = this.g;
	});
	
	// recover
	console.warn = old;
});
