module('prototype-basic');

test('prototype inherit in javascript', function() {
	var A = function(){};
	A.prototype.func = function() {
		return 1;
	};
	A.prototype.value = 1;

	var B = function(){};
	B.prototype = new A();
	var b = new B();
	equal(b.func(), 1, 'func is inherited from prototype of A');
	equal(b.value, 1, 'value is inherited from prototype of A');
});

test('see what is in Class, Class.prototype, instance.prototype', function() {
	var metaclass = new Class(function() {
		this.initialize = function(cls, name, base, dict) {}
		this.__new__ = function(cls, name, base, dict) {
			ok(true, 'initialize is still in dict');
			return type.__new__(cls, name, base, dict);
		}
	});
	var __mixined__ = new Class(function() {
		this.mixined_by_at_mixins = function(self) {};
	});
	var mixined = new Class(function() {
		this.mixined_by_Class_mixin = function(self){};
	});
	var A = new Class(function() {
		Class.mixin(this, mixined);
		// overwrite Class.mixin
		this['@mixins'] = [__mixined__];

		this.__metaclass__ = metaclass; 
		this.initialize = function(self) {
			self._a = 1;
		};

		this.a = 1;
		this.b = null;
		this.c = function(self) {return 1;};
		this.d = classmethod(function(cls) {return 1;});
		this.e = staticmethod(function() {return 1;});
		this.f = property(function(self){return self.__f;}, function(self, v){self.__f = v});
	});
	
	//['@mixins'] must be array, otherwise forEach will cause an error
	//where is initialize???
	ok('initialize' in A, 'initialize method is in class members (for metaclass useness)');
	ok('d' in A, 'classmethod is in class members');
	ok('e' in A, 'staticmethod is in class members');
	var membersOfClass = [
		"__subclassesarray__", 
		"__subclasses__", 
		"__mixins__", 
		"__mixin__", 
		"__base__", 
		"__this__", 
		"__new__", 
		"__metaclass__", 
		"__dict__",
		"get", 
		"set" 
	];
	for(var i=0,l=membersOfClass.length; i<l; i++) {
		ok(membersOfClass[i] in A, membersOfClass[i] + ' is in class members');
	}

	equal(A.__mixins__.length, 1, 'has mixined two elements, one by Class.mixin, another by @mixins');
	equal(A.__subclassesarray__.length, 0, 'A has no subclasses');
	//ok(false, '__subclasses__ is confused, __getsubclasses__ is better');
	equal(A.set, A.__mixin__, 'set is equals to __mixin__');

	var AP = A.prototype;
	var memebersOfClassPrototype = [
		"constructor", 
		"__properties__", 
		"__base__", 
		"__this__",
	   	"initialize",
		"mixined_by_at_mixins", 
		"get", 
		"set", 
		"_set"
	];
	for(var i=0,l=memebersOfClassPrototype.length; i<l; i++) {
		ok(memebersOfClassPrototype[i] in AP, memebersOfClassPrototype[i] + ' is in class prototype');
	}
	ok('a' in AP, 'value a is in A.prototype');
	ok('b' in AP, 'null b is in A.prototype');
	ok('c' in AP, 'instancemethod c is in A.prototype');
	ok('d' in AP, 'classmethod d is in A.prototype');
	ok('e' in AP, 'staticmethod e is in A.prototype');

	ok(('f' in AP) && AP['f'] === undefined, 'A.prototype contains f, which is undefined');
	//ok(!('f' in AP), 'property f is not directly in A.prototype');
	ok('f' in AP.__properties__, 'property f is in A.prototype.__properties__');
	equal(typeof AP.__properties__['f'], 'object', 'member in __properties__ is object');
	ok('fget' in AP.__properties__['f'], 'fget is in property f');
	ok('fset' in AP.__properties__['f'], 'fset is in property f');

	var a = new A();
	for(var i=0,l=memebersOfClassPrototype.length; i<l; i++) {
		ok(memebersOfClassPrototype[i] in a, memebersOfClassPrototype[i] + ' is in instance of A');
	}

	['a', 'b', 'c', 'd', 'e'].forEach(function(el) {
		ok(el in a, el + ' is in instance of A');
		if(typeof a[el] == 'function') {
			try {
				a[el]();
				ok(true, el + ' is executed successfully in a');
			} catch (e) {
				ok(false, el + ' is executed successfully in a');
			}
		}
	});
	ok(true, 'only classmethod can not be executed successfully in a');

	equal(A.d(), 1, 'classmethod should be called by class A, A.d() for example');

	equal(a.get('f'), undefined, 'property f is undefined, because self.__f is undefined');
	a.set('f', 1);
	equal(a.get('f'), 1, 'property f is 1 now');
	equal(a.__f, a.get('f'), '__f is setted/getted by property f');
	equal(a.__class__, A, 'a.__class__ is reference of A');
	equal(a.__this__.base, Object, 'a.__this__.base is reference of object, because A did not inherit any Class');
	ok(a.__this__.parent != null, 'a.__this__.parent is not null');
});
