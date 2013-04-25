module('metaclass');
test('make sure metaclass is useful', function() {
	var metaclass = new Class(function() {
		this.__new__ = function(cls, name, base, dict) {
			ok(dict.initialize != null, 'initialize is still in dict');
			ok(true, '__new__ method in metaclass executed');
			// can change member in class
			dict.a = 2;
			// must call type.__new__ in this.__new__
			return type.__new__(cls, name, base, dict);
		};
		this.initialize = function(cls, name, base, dict) {
			ok(true, 'initialize method in metaclass executed');
		};
	});
	var A = new Class(function() {
		this.__metaclass__ = metaclass;
		//this initialize is executed when an instance is created...
		this.initialize = function(self) {
			ok(true, 'initialize method in Class(A) executed');
		};
		this.a = 1;
	});
	ok(true, 'class A created successfully');
	var B = new Class(A, function() {
		this.initialize = function(self) {
			ok(true, 'initialize method in Class(B) executed');
		};
	});
	ok(true, 'class B created successfully');

	var a = new A();
	equal(a.a, 2, 'a in parent(A) is metaclassed');
	var b = new B();
	equal(b.a, 2, 'a in sub(B) is metaclassed');
});

test('modify class members in metaclass', function() {
	var metaclass = new Class(function() {
		// __new__ is collecting members
		this.__new__ = function(cls, name, base, dict) {
			equal(Object.keys(dict).length, 3, '3 members in dict');
			ok('b' in dict, 'b is in dict');
			ok('c' in dict, 'c is in dict');
			ok('__metaclass__' in dict, '__metaclass__ is in dict');
			dict.a = 2;
			delete dict.b;
			dict.c = 2;
			return type.__new__(cls, name, base, dict);
		};
		// initialize is to modify cls and cls.property;
		this.initialize = function(cls, name, base, dict) {};
	});
	var A = new Class(function() {
		this.__metaclass__ = metaclass;
		this.b = 1;
		this.c = 1;
	});
	var a = new A();
	equal(a.a, 2, 'a is added by metaclass');
	equal(a.b, undefined, 'b is deleted by metaclass');
	equal(a.c, 2, 'c is modified by metaclass');
});

test('metaclass is not a class', function() {
	try {
		var A = new Class(function() {
			this.__metaclass__ = true;
		});
		var a = new A();
		ok(false, '__metaclass__ is not a class, which should cause error');
	} catch (e) {
		ok(true, '__metaclass__ is not a class, which should cause error : ' + e);
	}
	try {
		var A = new Class(function() {			
			this.__metaclass__ = function() {};
		});
		var a = new A();
		ok(false, '__metaclass__ is not a class, which should cause error');
	} catch (e) {
		ok(true, '__metaclass__ is not a class, which should cause error : ' + e);
	}
	try {
		var A = new Class(function() {
			this.__metaclass__ = function() {
				this.__new__ = function(){};
				this.initialize = function(){};
			};
		});
		var a = new A();
		ok(false, '__metaclass__ is not a class, which should cause error');
	} catch (e) {
		ok(true, '__metaclass__ is not a class, which should cause error : ' + e);
	}
});

test('metaclass is a class without __new__ or initialize', function() {
	//cls.__new__ = base.__new__; so without __new__ is still fine for metaclass;
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
	});
	metaclass.fda = 'a';
	try {
		var A = new Class(function() {
			this.__metaclass__ = metaclass;
		});
		var a = new A();
		ok(true, 'cls.__new__ = base.__new__; so without __new__ is still fine for metaclass');
	} catch (e) {
		ok(true, 'cls.__new__ = base.__new__; so without __new__ is still fine for metaclass: ' + e);
	}

	var metaclass2 = new Class(function() {
		this.__new__ = function(cls, name, base, dict) {};
	});
	try {
		var A = new Class(function() {
			this.__metaclass__ = metaclass2;
		});
		var a = new A();
		ok(false, '__metaclass__ is a class without initialize , which should cause error');
	} catch (e) {
		ok(true, '__metaclass__ is a class without initialize , which should cause error : ' + e);
	}
});

test('metaclass with empty __new__', function() {
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {};
	});
	try {
		var A = new Class(function() {
			this.__metaclass__ = metaclass;
		});
		var a = new A();
		ok(false, '__metaclass__ is a class with empty __new__ , which should not cause error');
	} catch (e) {
		ok(true, '__metaclass__ is a class with empty __new__ , which should not cause error : ' + e);
	}
});

test('__new__ return something else', function() {
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			return type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(function() {
		this.__metaclass__ = metaclass;
	});
	ok(true, '__new__ return type.__new__(cls, name, base, dict); which should not cause error');

	try {
		var metaclass = new Class(function() {
			this.initialize = function(cls, name, base, dict) {};
			this.__new__ = function(cls, name, base, dict) {
				return null;
			};
		});
		var A = new Class(function() {
			this.__metaclass__ = metaclass;
		});
		ok(false, '__new__ return null should cause error');
	} catch (e){
		ok(true, '__new__ return null should cause error : ' + e);
	}

	try {
		var metaclass = new Class(function() {
			this.initialize = function(cls, name, base, dict) {};
			this.__new__ = function(cls, name, base, dict) {
				return 1;//or other non-class value
			};
		});
		var A = new Class(function() {
			this.__metaclass__ = metaclass;
		});
		var a = new A();
		ok(false, '__new__ return 1 or other non-class value, should not cause error');
	} catch (e){
		ok(true, '__new__ return 1 or other non-class value, should not cause error : ' + e);
	}
});


test('__metaclass__ in inherited classes', function() {
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			dict.a = 3;
			return type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(function(){
		this.__metaclass__ = metaclass;
	});
	var B = new Class(A, function() {
		this.a = 1;
	});
	var b = new B();
	equal(b.a, 3, '__metaclass__ inherited from parent class');
	var C = new Class(B, function() {
		this.a = 2;
	});
	var c = new C();
	equal(c.a, 3, '__metaclass__ inherited from parent\' parent class');

	QUnit.reset();
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			dict.a = 2;
			return type.__new__(cls, name, base, dict);
		};
	});
	var metaclass2 = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			dict.a = 3;
			return type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(function(){
		this.__metaclass__ = metaclass;
	});
	var B = new Class(A, function() {
		this.__metaclass__ = metaclass2;
		this.a = 1;
	});
	var b = new B();
	equal(b.a, 3, 'metaclass in sub class has the highest priority');

	var C = new Class(B, function() {
		this.a = 5;
	});
	var c = new C();
	equal(c.a, 3, 'metaclass in nearest parent has the higher priority');
	QUnit.reset();
});

test('__metaclass__ in mixined classes', function() {
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {};
		this.__new__ = function(cls, name, base, dict) {
			dict.a = 3;
			return type.__new__(cls, name, base, dict);
		};
	});
	var A = new Class(function(){
		this.__metaclass__ = metaclass;
	});
	var B = new Class(function() {
		Class.mixin(this, A);
		this.a = 1;
	});
	var b = new B();
	equal(b.a, 1, '__metaclass__ will not be mixined');
});

test('throw uncatched error in __metaclass__', function() {
	
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {
			throw 'error in __metaclass__.initialize';
		};
		this.__new__ = function(cls, name, base, dict) {
			return type.__new__(cls, name, base, dict);
		};
	});
	try {
		var A = new Class(function(){
			this.__metaclass__ = metaclass;
		});
		ok(false, 'error in __mataclass__ should be handled');
	} catch (e) {
		ok(true, 'error in __mataclass__ should be handled : ' + e);
	}

	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {
		};
		this.__new__ = function(cls, name, base, dict) {
			throw 'error in __metaclass__.__new__';
			return type.__new__(cls, name, base, dict);
		};
	});
	try {
		var A = new Class(function(){
			this.__metaclass__ = metaclass;
		});
		ok(false, 'error in __mataclass__ should be handled');
	} catch (e) {
		ok(true, 'error in __mataclass__ should be handled : ' + e);
	}

	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {
			throw 'error in __metaclass__.initialize';
		};
		this.__new__ = function(cls, name, base, dict) {
			throw 'error in __metaclass__.__new__';
			return type.__new__(cls, name, base, dict);
		};
	});
	try {
		var A = new Class(function(){
			this.__metaclass__ = metaclass;
		});
		ok(false, 'error in __mataclass__ should be handled');
	} catch (e) {
		ok(true, 'error in __mataclass__ should be handled : ' + e);
	}
});

test('metaclass is other non-false value, not function', function() {
	var trues = $UNIT_TEST_CONFIG.trues;
	for(var i=0,l=trues.length; i<l; i++) {
		try {
			new Class(function() {
				this.__metaclass__ = trues[i];
			});
		} catch (e) {
			ok(true, '__metaclass__ is ' + trues[i] + ', which should cause an error : ' + e);
		};
	}
});
