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

function setProto(from, to) {
	from.__proto__ = to;
}

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
	var describer = {
		__class__: arguments.callee,
		fget: fget,
		fset: fset
	};
	return describer;
}

property.setTo = function(cls, name, member) {
	member.enumerable = true;
	var type = cls.__metaclass__.__defaultmethodtype__;
	if (member.fget) {
		type.setTo(cls, '__' + name + '_get', type(member.fget));
		member.get = function() {
			return this['__' + name + '_get']();
		};
	}
	if (member.fset) {
		type.setTo(cls, '__' + name + '_set', type(member.fset));
		member.set = function(value) {
			return this['__' + name + '_set'](value);
		};
	}
	cls.prototype.__properties__[name] = member;
	Object.defineProperty(cls.prototype, name, member);
};

function typeOf(obj) {
	if (instanceOf(obj.__metaclass__, Type)) {
		return 'type';
	} else {
		return typeof obj;
	}
}

function instanceOf(obj, func) {
	if (typeof func != 'function') {
		throw new Error('bad arguments.');
	}

	var cls;

	// 查询一个func的constructor，js中的function是没有原型继承的，只能通过递归查询。
	// 一般来说就是Type
	if (typeof obj == 'function') {
		// 遍历实例的创建者继承链，找是否与func相同
		cls = obj.__class__;
		if (cls) {
			do {
				if (cls === func) return true;
			} while (cls = cls.__base__);
		}
	}
	// 查询普通对象的constructor，可直接使用instanceof
	else {
		return obj instanceof func;
	}
	return false;

}

function parent(self) {
	var ownCls = this.cls || self.__class__; // 拥有此方法的代码书写的类
	var name = arguments.callee.caller.__name__; // 方法名字
	var base, member; // 最后要执行的类和方法

	if (!name) throw new Error('parent call error');

	// parent应该调用“代码书写的方法所在的类的父同名方法”
	// 而不是方法调用者实例的类的父同名方法
	// 比如C继承于B继承于A，当C的实例调用从B继承来的某方法时，其中调用了this.parent，应该直接调用到A上的同名方法，而不是B的。
	// 因此，这里通过hasOwnProperty，从当前类开始，向上找到同名方法的原始定义类
	while (ownCls && !ownCls.prototype.hasOwnProperty(name)) {
		ownCls = ownCls.__base__;
	}

	base = ownCls.__base__;
	if (!base) throw new Error('base class not found in parent call');

	var inProto = false;
	if (base[name]) {
		member = base[name];
	} else if (base.prototype[name]) {
		member = base.prototype[name];
		inProto = true;
	}

	if (!member || !member.apply) throw new Error('method not found in parent call');

	if (inProto) {
		return member.apply(self, Array.prototype.slice.call(arguments, 1));
	} else {
		return member.apply(base, arguments);
	}
}

function Type() {

}

Type.__class__ = Type;

Type.initialize = function() {
};

Type.setTo = function(cls, name, member) {
	cls[name] = cls.prototype[name] = member;
};

Type.__new__ = function(metaclass, name, base, dict) {
	var cls = function() {
		this.__class__ = cls;
		var value = this.initialize? this.initialize.apply(this, arguments) : null;
		return value;
	};

	var proto = Object.__new__(base);
	cls.prototype = proto;
	cls.prototype.constructor = cls;
	cls.prototype.__properties__ = {};

	var tmp = Object.create(base);
	Object.keys(metaclass.prototype).forEach(function(key) {
		if (tmp[key] == undefined) tmp[key] = metaclass.prototype[key];
	});
	setProto(cls, tmp);

	cls.__base__ = base;
	cls.__class__ = metaclass;
	cls.__metaclass__ = metaclass;
	cls.__dict__ = {};
	cls.__helper__ = {
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
			var dict, proto;
			if (one.__dict__) {
				dict = one.__dict__;
 			} else {
 				dict = {};
 				proto = one.prototype;
 				Object.keys(proto).forEach(function(key) {
 					if (typeOf(proto[key]) == 'function') {
 						dict[key] = staticmethod(proto[key]);
 					} else {
 						dict[key] = proto[key];
 					}
 				});
 			}
			Object.keys(dict).forEach(function(k) {
				metaclass.__setattr__(cls, k, dict[k]);
			});
		});
	});

	Object.keys(dict).forEach(function(k) {
		metaclass.__setattr__(cls, k, dict[k]);
	});

	delete dict;

	return cls;
};

Type.__defaultmethodtype__ = instancemethod;

Type.__setattr__ = function(cls, name, member) {
	var proto = cls.prototype;
	var memberType;

	// 动态添加的成员也可以在dict上找到
	cls.__dict__[name] = member;

	if (member) {
		if (!member.__class__ && typeof member == 'function') {
			member = this.__defaultmethodtype__(member);
		}
		memberType = member.__class__;
	}

	if (memberType) {
		memberType.setTo(cls, name, member);
	} else {
		cls[name] = proto[name] = member;
	}
};

Type.prototype.set = function(name, value) {
	Type.__setattr__(this, name, value);
};

Object.__new__ = function(cls) {
	return Object.create(cls.prototype);
};

setProto(Object, Type.prototype);

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

function simpleinstancemethod(func) {
	return {
		__class__: arguments.callee,
		__func__: func
	};
}

simpleinstancemethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	member.__func__.__name__ = name;
	proto[name] = member.__func__;
};

var SimpleType = new Class(Type, {
	__defaultmethodtype__ : simpleinstancemethod
});

exports.Class = Class;
exports.Type = Type;
exports.classmethod = classmethod;
exports.staticmethod = staticmethod;
exports.property = property;
exports.parent = parent;
exports.instanceOf = instanceOf;
exports.typeOf = typeOf;
exports.SimpleType = SimpleType;
exports.install = function(target) {
	if (!target) target = global;
	['Class', 'Type', 'classmethod', 'staticmethod', 'property'].forEach(function(name) {
		target[name] = exports[name];
	})
};
