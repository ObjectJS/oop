var constructing;
function extend(obj, properties, ov) {
	var filter = null;
	if (typeof ov == 'function') {
		filter = ov;
	} else if (ov === true || typeof ov === 'undefined') {
		filter = function(prop, dest, src) {
			return true;
		};
	} else {
		filter = function(prop, dest, src) {
			return !(prop in dest);
		};
	}

	for (var property in properties) {
		if (filter(property, obj, properties)) {
			obj[property] = properties[property];
		}
	}
	if (properties && properties.hasOwnProperty('call') && filter(obj, properties, 'call')) {
		obj.call = properties.call;
	}

	return obj;
}

// 仿照 mootools 的overloadsetter
// 返回一个 key/value 这种形式的function参数的包装，使其支持{key1: value1, key2: value2} 这种传参形式
function overloadsetter(func, usePlural) {
	return function(a, b) {
		if (a === null) return this;
		if (usePlural || typeof a != 'string') {
			for (var k in a) func.call(this, k, a[k]);
		} else {
			func.call(this, a, b);
		}
		return this;
	};
};

function instancemethod(func) {
	var im_self;

	function _instancemethod() {
		var args = Array.prototype.slice.call(arguments, 0);
		im_self = this;
		args.unshift(im_self);
		return func.apply(this.__class__.__this__, args);
	};
	_instancemethod.im_func = func;
	_instancemethod.__class__ = arguments.callee;

	return _instancemethod;
};

instancemethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	cls[name] = member; // TODO
	proto[name] = instancemethod(member);
	member.__name__ = name;
};

function classmethod(func) {
	return {
		__class__ : arguments.callee,
		__func__ : func
	};
};

classmethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
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
		return member.__func__.apply(im_self.__this__, args);
	}
	_classmethod.im_func = member.__func__;
	cls[name] = proto[name] = _classmethod;
};

function staticmethod(func) {
	return {
		__class__: arguments.callee,
		__func__: func
	};
}

staticmethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	cls[name] = proto[name] = member.__func__;
};

function property(fget, fset) {
	return {
		__class__: arguments.callee,
		fget: fget,
		fset: fset
	}
}

property.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	var describer = {
		enumerable: true
	};
	if (member.fget) {
		describer.get = function() {
			return member.fget(this);
		}
	}
	if (member.fset) {
		describer.set = function(value) {
			return member.fset(this, value);
		}
	}
	Object.defineProperty(proto, name, describer);
};

function parent() {
	// 拥有此方法的代码书写的类
	var ownCls = this.cls;
	var name = arguments.callee.caller.__name__;

	// parent应该调用“代码书写的方法所在的类的父同名方法”
	// 而不是方法调用者实例的类的父同名方法
	// 比如C继承于B继承于A，当C的实例调用从B继承来的某方法时，其中调用了this.parent，应该直接调用到A上的同名方法，而不是B的。
	// 因此，这里通过hasOwnProperty，从当前类开始，向上找到同名方法的原始定义类
	while (ownCls && !ownCls.prototype.hasOwnProperty(name)) {
		ownCls = ownCls.__base__;
	}

	var base = ownCls.__base__;
	var member, owner;

	return base[name].apply(base, arguments);
}

// TODO
Object.prototype.set = function(name, value) {
	Type.__setattr__(this, name, value);
};

Object.__new__ = function(cls) {
	return Object.create(cls.prototype);
};

function Type() {

}

Type.setTo = function(cls, name, member) {
	cls[name] = cls.prototype[name] = member;
};

Type.initialize = function() {

};

Type.__class__ = Type;

Type.__new__ = function(metaclass, name, base, dict) {
	var cls = function() {
		this.__class__ = cls;
		var value = this.initialize? this.initialize.apply(this, arguments) : null;
		return value;
	};

	constructing = true;

	var proto = Object.__new__(base);
	cls.prototype = proto;
	cls.prototype.constructor = cls;
	cls.__proto__ = Object.create(base);
	cls.__base__ = base;
	cls.__dict__ = dict;
	cls.__this__ = {
		cls: cls,
		base: base,
		parent: parent
	};

	(dict.__mixins__ || []).reverse().forEach(function(mixin) {
		var chain = [mixin];
		var base = mixin;
		while ((base = base.__base__)) {
			chain.unshift(base);
		}
		chain.forEach(function(one) {
			if (one.__dict__) {
				Object.keys(one.__dict__).forEach(function(k) {
					Type.__setattr__(cls, k, one.__dict__[k]);
				});
			}
		});
	});

	Object.keys(dict).forEach(function(k) {
		Type.__setattr__(cls, k, dict[k]);
	});

	constructing = false;

	return cls;
};

Type.__setattr__ = function(cls, name, member) {
	var proto = cls.prototype;

	if (!constructing) {
		cls.__dict__[name] = member;
	}

	// 有可能为空，比如 this.test = null 或 this.test = undefined 这种写法;
	if (member == null) {
		proto[name] = member;
	}
	// 先判断最常出现的instancemethod
	// this.a = function() {}
	else if (typeof member == 'function' && member.__class__ === undefined) {
		instancemethod.setTo(cls, name, member);
	}
	// property/classmethod/staticmethod
	else if (member.__class__) {
		member.__class__.setTo(cls, name, member.im_func || member);
	}
	// this.a = someObject
	else {
		cls[name] = proto[name] = member;
	}
};

function Class() {
	var args = arguments;
	var length = args.length;
	if (length < 1) throw new Error('bad arguments');

	// name
	var name = null;

	// base
	var base = length > 1? args[0] : Object;
	if (typeof base != 'function' && typeof base != 'object') {
		throw new Error('base is not function or object');
	}

	// dict
	var dict = args[length - 1], factory;
	if (typeof dict != 'function' && typeof dict != 'object') {
		throw new Error('constructor is not function or object');
	}
	if (dict instanceof Function) {
		factory = dict;
		dict = {};
		factory.call(dict);
	}

	var metaclass = dict.__metaclass__ || base.__metaclass__ || Type;

	// 创建&初始化
	var cls = metaclass.__new__(metaclass, name, base, dict);

	if (!cls || typeof cls != 'function') {
		throw new Error('__new__ method should return cls');
	}

	metaclass.initialize.call(metaclass, cls, name, base, dict);
	return cls;
}

exports.Class = Class;
exports.Type = Type;
exports.classmethod = classmethod;
exports.staticmethod = staticmethod;
exports.property = property;