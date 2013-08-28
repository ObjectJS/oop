var oop = require('./oop');

function instancemethod(func) {
	return {
		__class__ : arguments.callee,
		__func__: func
	}
};

instancemethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	var func = member.__func__;
	var im_self;

	function _instancemethod() {
		var args = Array.prototype.slice.call(arguments, 0);
		im_self = this;
		args.unshift(im_self);
		return func.apply(this.__class__.__helper__, args);
	};

	func.__name__ = name;
	_instancemethod.im_func = func;
	cls[name] = func;
	proto[name] = _instancemethod;
};

function classmethod(func) {
	return {
		__class__ : arguments.callee,
		__func__ : func
	};
};

classmethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	var func = member.__func__;
	function _classmethod() {
		var im_self;
		var args = Array.prototype.slice.call(arguments, 0);
		// 在class上调用
		if (typeof this == 'function') {
			im_self = this;
		}
		// 在instance上调用
		else {
			im_self = this.__class__;
		}
		args.unshift(im_self);
		return func.apply(im_self.__helper__, args);
	}
	func.__name__ = name;
	_classmethod.im_func = func;
	cls[name] = proto[name] = _classmethod;
};

var PyType = new Class(oop.Type, {
	__defaultmethodtype__: instancemethod
});

exports.PyType = PyType;