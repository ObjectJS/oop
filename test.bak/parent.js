module('parent');

test('common usage of parent method', function() {
	expect(2);
	var A = new Class(function() {
		this.a = function(self) {
			ok(true, 'parent method is called');
		}
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			ok(true, 'call parent method');
			this.parent();
		}
	});
	var b = new B();
	b.a();
});

test('has no parent method', function(){
	// parent不存在此方法的情况
	var A = new Class(function() {});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(false, 'has no parent method, should be considerd');
	} catch (e) {
		ok(true, 'has no parent method, should be considerd : ' + e);
	}

	// parent不是function的情况
	var A = new Class(function() {
		this.a = null;
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(false, 'parent is null, should be considerd');
	} catch (e) {
		ok(true, 'parent is null, should be considerd : ' + e);
	} 

	// parent不是function的情况
	var A = new Class(function() {
		this.a = 1;//true/false/''/other value
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(false, 'parent is not function, should be considerd');
	} catch (e) {
		ok(true, 'parent is not function, should be considerd : ' + e);
	} 
});
//parent throw error
test('parent throw error', function() {
	var A = new Class(function() {
		this.a = function(self) {
			throw 'error in parent';
		}
	});
	var B = new Class(A, function() {
		this.a = function(self) {
			this.parent();
		}
	});
	var b = new B();
	try {
		b.a();
		ok(false, 'parent throw error, should be considerd');
	} catch (e) {
		ok(true, 'parent throw error, should be considerd : ' + e);
	} 
});

//initialize parent
test('parent method is intialize', function() {
	var globalValue = 0;
	var A = new Class(function() {
		this.initialize = function(self) {
			equal(globalValue, 1, 'step2 : intialize in parent');
			globalValue++;
			self.a = 1;
		}
	});
	var B = new Class(A, function() {
		this.initialize = function(self) {
			equal(globalValue, 0, 'step1 : initialize in sub class');
			globalValue++;
			this.parent(self);
		}
	}); 
	var b = new B();
	equal(globalValue, 2, 'step3 : after create class successfully');
	equal(b.a, 1, 'sub.a is setted by parent.intialize');
});

//parent is instancemethod//dtaticmethod/classmethod
test('parent method is instancemethod/staticmethod/classmethod/property - 1', function() {
	var A = new Class(function() {
		this.a = staticmethod(function() {
			ok(true, 'staticmethod is called by xxx.parent()');
		});
		this.b = classmethod(function(cls) {
			ok(true, 'classmethod is called by xxx.parent()');
		});
		this.c = function(self) {
			ok(true, 'instancemethod is called by xxx.parent()');
		};
		this.d = property(function(self){
			}, function(self, a){
			}
		);
	});
	var B = new Class(A, function() {
		this.a = function() {
			this.parent();
		};
		this.b = function(self) {
			this.parent();
		};
		this.c = function(self) {
			this.parent();
		};
		this.d = function(self) {
			this.parent();
		};
	});
	var b = new B();
	b.a();
	b.b(); //can call classmethod of parent class by instance of sub class ??? 
	b.c();
	try {
		b.d();
		ok(false, 'property in parent can not be called by sub.parent');
	} catch (e) {
		ok(true, 'property in parent can not be called by sub.parent : ' + e);
	}
});

// sub method is instancemethod/staticmethod/classmethod/property
test('parent method is instancemethod/staticmethod/classmethod/property - 2', function() {
	var A = new Class(function() {
		this.a = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is instancemethod');
		};
		this.b = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is classmethod');
		};
		this.c = function(self) {
			ok(true, 'instancemethod called by xxx.parent, which is staticmethod');
		};
		this.d = function(self) {
			ok(false, 'instancemethod d should not be called by sub class, whose d is property');
		};	
		this.e = property(function(self) {
			return 1;
		});
	});
	var B = new Class(A, function() {
		this.a = function() {
			this.parent();
		};
		this.b = classmethod(function(cls) {
			this.parent();
		});
		this.c = staticmethod(function() {
			ok(true, 'staticmethod of sub class is called successfully');
			// can not call parent in staticmethod, should use B.get('c')();
			//this.parent();
		});
		this.d = property(function(self){
				ok(true, 'before xxx.parent called in property');
				this.parent();
				ok(true, 'after xxx.parent called in property');
				return 1;
			}, function(self, a){
			}
		);
		this.e = property(function(self) {
			return this.parent();
		});
	});
	var b = new B();
	b.a();
	B.b();
	try {
		b.c();
		ok(true, 'parent method called in staticmethod, which should be considered');
	} catch (e) {
		ok(false, 'parent method called in staticmethod, which should be considered : ' + e);
	}
	try {
		b.d();
	} catch (e) {
		ok(true, 'parent instancemethod should be deleted, if it is set to property in sub');
	}
	try {
		b.get('d');
		ok(false, 'property setter/getter can call xxx.parent too');
	} catch (e) {
		ok(true, 'property setter/getter can call xxx.parent too : ' + e);
	}
	try {
		equal(b.get('e'), 1, 'property can be called by b.e()/b.e(value), and parent also can be used');
	} catch (e) {
		ok(true, 'property can be called by b.e()/b.e(value), and parent also can be used : ' + e);
	}
});

test('property in sub class should overwrite same name member in parent', function() {
	var A = new Class(function() {
		this.a = 1;
		this.b = {a:1};
		this.c = function(self){
			ok(false, 'instancemethod c should be overwrited by property c in sub class');
		}
		this.d = classmethod(function(cls) {
			ok(false, 'classmethod d should be overwrited by property d in sub class');
		});
		this.e = staticmethod(function() {
			ok(false, 'staticmethod e should be overwrited by property e in sub class');
		});
	});

	var B = new Class(A, function() {
		this.a = property(function(self){});
		this.b = property(function(self){});
		this.c = property(function(self){});
		this.d = property(function(self){});
		this.e = property(function(self){});
	});

	var b = new B();
	notEqual(b.a, 1, 'should not get b.a, because b.a should be overwrited');
	equal(b.b, undefined, 'should not get b.b, because b.b should be overwrited');
	raises(function() {
		b.c();
	}, 'can not call b.c(), b.c should be overwrited');
	raises(function() {
		b.d();
	}, 'can not call b.d(), b.d should be overwrited');
	raises(function() {
		b.e();
	}, 'can not call b.e(), b.e should be overwrited');
});

//the order of parent method execution
test('order of parent', function() {
	var counter = 0;
	var A = new Class(function() {
		this.a = function() {
			counter ++;
			equal(counter, 2, 'parent called in C');
		}
	});
	var B = new Class(A, function() {
		this.a = function() {
			equal(counter, 1, 'before parent called in B(A->B->C)');
			this.parent();
			equal(counter, 2, 'after parent called in B(A->B->C)');
			counter++;
		}
	});
	var C = new Class(B, function() {
		this.a = function() {
			equal(counter, 0, 'before parent called in C(A->B->C)');
			counter ++;
			this.parent();
			equal(counter, 3, 'after parent called in C(A->B->C)');
		}
	});
	var c = new C();
	c.a();
});

// parent的调用顺序为先找base，再顺序找mixins
test('parent with mixin', function() {
	var A = new Class({
		m: function(self) {
			return 'A'
		}
	});

	var B = new Class({
		m: function(self) {
			return 'B'
		}
	});

	var C = new Class({
		__mixins__: [A, B],
		m: function(self) {
			var result = this.parent(self);
			equal(result, 'A', 'called the first method in mixins.')
		}
	});

	var c = new C();
	c.m();
});

test('parent class has initialize, but sub does not', function() {
	var counter = 0;
	var A = new Class(function() {
		this.initialize = function() {
			counter ++;
			equal(counter, 1, 'parent called in C');
		}
	});
	var B = new Class(A, function() {
		this.initialize = function() {
			equal(counter, 0, 'before parent called in B, before');
			this.parent();
			counter++;
			equal(counter, 2, 'after parent called in B, after');
		}
	});
	var C = new Class(B, function() {});
	var c = new C();
});
