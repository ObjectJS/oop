module('type-class');

test('general', function() {
	var newCalled = 0;
	var initCalled = 0;

	var BM = new Class(Type, function() {
	});

	var BMM = new Class(BM, function() {
	});

	var M = new Class(Type, function() {
		this.__new__ = function(cls, name, base, dict) {
			newCalled++;
			ok(cls.get('a'), 'type-class member get.');
			dict.b = 1;
			return Type.__new__(cls, name, base, dict);
		};

		this.a = function(cls, value) {
			return value;
		};

		this.initialize = function(cls) {
			initCalled++;
		};

		this.__setattr__ = function(cls, name, member) {
		};

		this.__getattr__ = function(cls, name, member) {
		};
	});

	var A = new M(function() {
	});

	ok(BM.get('__new__'), 'default __new__ exists.');
	ok(BM.get('initialize'), 'default initialize exists.');
	ok(BMM.get('initialize'), 'default initialize exists in extend.');
	ok(M.get('__new__'), 'custom __new__ exists.');
	ok(M.get('initialize'), 'custom initialize exists.');
	equal(A.get('b'), 1, 'new a metaclass create a class.');
	equal(newCalled, 1, '__new__ in metaclass called.');
	equal(initCalled, 1, 'initialize in metaclass called.');
	ok(M.get('a'), 'get custom member in type-based class.');
	ok(A.get('a'), 'get metaclass\'s custom member in class.');
	equal(A.get('a')('ok'), 'ok', 'metaclass\'s custom method called in class return value ok.');
});

test('base', function() {
	baseNewCalled = 0;
	baseInitCalled = 0;

	var M = new Class(Type, function() {
		this.__new__ = function(cls, name, base, dict) {
			baseNewCalled++;
			return Type.__new__(cls, name, base, dict);
		};

		this.a = function(cls, value) {
			equal(value, 1, 'arguments ok.');
		};

		this.initialize = function(cls, name, base, dict) {
			cls.get('a')(1);
			cls.get('b')(1);
			baseInitCalled++;
		};
	});

	var MM = new Class(M, function() {
		this.b = function(cls, value) {
			equal(value, 1, 'arguments ok in extend.');
		};
	});

	var A = new Class(Object, function() {
		this.__metaclass__ = MM;
	});

	// 确保继承关系在metaclass中也有效
	equal(baseNewCalled, 1, '__new__ method in base called.');
	equal(baseInitCalled, 1, 'initialize method in base called.');
});

test('classmethod/staticmethod called in metaclass', function() {
	expect(7);
	var Meta = new Class(Type, function() {
		this.initialize = function(cls, name, base, dict) {
			cls.get('makeElements')(name, base, dict);
		};
		this.a = 1;
		this.b = {};
		this.c = function(self) {
			return 'c';
		};
		this.d = property(function(self) {
			return 'd';
		});
		this.e = new Class(function() {
			this.value = 1;
		});
		this.staticmethod = staticmethod(function() {
			ok(true, 'staticmethod called');
		});
		this.classmethod = classmethod(function(cls) {
			ok(true, 'classmethod called');
		});
		this.makeElements = function(cls, name, base, dict) {
			cls.get('staticmethod')();
			cls.get('classmethod')();
			equal(cls.get('d').__class__, property, 'property is ok in metaclass');
			equal(cls.get('c')(), 'c', 'instancemethod is ok in metaclass');
			equal(cls.get('a'), 1, 'simple member is ok in metaclass');
			equal(typeof cls.get('b'), 'object', 'simple object member is ok in metaclass');
			equal(typeof cls.get('e'), 'function', 'class member of metaclass');
		};
	});

	var Element = new Class(function() {
		this.__metaclass__ = Meta;
	});
});
