KISSY.add(function() {

var exports = {};

// 无法通过 Object.defineProperty 判断是否支持，IE8 有此方法，但无法设置普通对象
var supportDefineProperty = true;
try {
	Object.defineProperty({}, 'a', {value: 1});
} catch(e) {
	supportDefineProperty = false;
}

if (!Object.keys) {
	Object.keys = function(o) {
		var result = [];
		if (o === undefined || o === null) {
			return result;
		}

		// 在Safari 5.0.2(7533.18.5)中，在这里用for in遍历parent会将prototype属性遍历出来，导致原型被指向一个错误的对象
		// 经过试验，在Safari下，仅仅通过 obj.prototype.xxx = xxx 这样的方式就会导致 prototype 变成自定义属性，会被 for in 出来
		// 而其他浏览器仅仅是在重新指向prototype时，类似 obj.prototype = {} 这样的写法才会出现这个情况
		// 因此，在使用时一定要注意
		for (var name in o) {
			if (o.hasOwnProperty(name)) {
				result.push(name);
			}
		}

		return result; 
	};
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(fn, bind) {
		for (var i = 0; i < this.length; i++) {
			fn.call(bind, this[i], i, this);
		}
	};
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(str) {
		for (var i = 0; i < this.length; i++) {
			if (str === this[i]) {
				return i;
			}
		}
		return -1;
	};
}

if (!Function.prototype.bind) {
	Function.prototype.bind = function(object) {
		var method = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
		};
	};
}

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
function overloadsetter(usePlural) {
	var func;
	function setter(a, b) {
		if (a === null) return this;
		if (usePlural || typeof a != 'string') {
			for (var k in a) func.call(this, k, a[k]);
		} else {
			func.call(this, a, b);
		}
		return this;
	};

	if (typeof usePlural == 'function') {
		func = usePlural;
		usePlural = false;
	}

	if (func) {
		return setter;
	} else {
		return function(f) {
			func = f;
			return setter;
		}
	}
};

var getter = supportDefineProperty? function(name) {
	return this[name];
} : function(name) {
	return this['__' + name + '_get']();
};

var setter = supportDefineProperty? function(name, value) {
	return this[name] = value;
} : function(name, value) {
	return this['__' + name + '_set'](value);
}

function instancemethod(func) {
	return {
		__class__: arguments.callee,
		__func__: func
	};
}

instancemethod.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	member.__func__.__name__ = name;
	proto[name] = member.__func__;
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
	var proto = cls.prototype;
	member.enumerable = true;
	var type = cls.__metaclass__.prototype.__defaultmethodtype__;
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
	proto.__properties__[name] = member;
	if (supportDefineProperty) {
		Object.defineProperty(proto, name, member);
	}
};

function nontypemember() {}

nontypemember.setTo = function(cls, name, member) {
	var proto = cls.prototype;
	cls[name] = proto[name] = member;
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

function makePrivate(proto, name) {
	if (!supportDefineProperty) return;

	var member;
	if (name.indexOf('__') == 0 && name.lastIndexOf('__') != name.length - 2) {
		member = proto[name];
		Object.defineProperty(proto, name, {
			get: function() {
				if (this.constructor.prototype.hasOwnProperty(name)) {
					return member;
				}
			},
			set: function(value) {
				member = value;
			}
		});
	}
}

function parent(obj) {
	var func, found = [];
    var args = Array.prototype.slice.call(arguments, 1);

    // parent = oop.parent.bind(arguments.callee)
    if (typeof this == 'function' && this.__name__) {
    	func = this;
    }
    // oop.parent(self, 1, 2, 3);
    else {
    	try {
    		func = arguments.callee.caller;
    	} catch(e) {
    		throw new Error('can\'t use parent in strict mode');
    	}
        while (func && found.indexOf(func) == -1 && !func.__name__) {
        	found.push(func);
        	func = func.caller;
        }
    }

    var ownCls = obj.__class__; // 拥有此方法的代码书写的类
    var name = func.__name__; // 方法名字
    var baseProto, member; // 最后要执行的类和方法

    if (!name) throw new Error('parent call error');

    // parent应该调用“代码书写的方法所在的类的父同名方法”
    // 而不是方法调用者实例的类的父同名方法
    // 比如C继承于B继承于A，当C的实例调用从B继承来的某方法时，其中调用了this.parent，应该直接调用到A上的同名方法，而不是B的。
    // 因此，这里通过hasOwnProperty，从当前类开始，向上找到同名方法的原始定义类
    while (ownCls && !(ownCls.prototype[name] == func && ownCls.prototype.hasOwnProperty(name))) {
        ownCls = ownCls.__base__;
    }

    baseProto = ownCls.__base__.prototype;
    if (!baseProto) throw new Error('base class not found in parent call');

    member = baseProto[name];
    if (!member || !member.apply) throw new Error('method not found in parent call');

    return member.apply(obj, args);
}

function Type() {

}

Type.__class__ = Type;

Type.setTo = function(cls, name, member) {
	cls[name] = cls.prototype[name] = member;
};

Type.__new__ = function(metaclass, name, base, dict) {
	var cls = function() {
		if (prototyping) return;
		this.__class__ = cls;
		var value = this.initialize? this.initialize.apply(this, arguments) : null;
		return value;
	};

	var proto = Object.__new__(base);
	cls.prototype = proto;
	cls.prototype.constructor = cls;
	cls.prototype.__properties__ = {};

	for (var key in metaclass.prototype) {
		cls[key] = metaclass.prototype[key];
	}
	// Object.keys(metaclass.prototype).forEach(function(key) {
	// 	cls[key] = metaclass.prototype[key];
	// });
	// cls.__proto__ = Object.create(base);
	Object.keys(base).forEach(function(key) {
		// private
		if (key.indexOf('__') == 0 && key.lastIndexOf('__') != key.length - 2) {
			return
		}
		cls[key] = base[key];
	});

	cls.__base__ = base;
	cls.__class__ = metaclass;
	cls.__metaclass__ = metaclass;
	cls.__dict__ = {};

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
				metaclass.prototype.__setattr__.call(cls, k, dict[k]);
			});
		});
	});

	Object.keys(dict).forEach(function(k) {
		metaclass.prototype.__setattr__.call(cls, k, dict[k]);
	});

	cls.prototype.get = getter; 
	cls.prototype.set = setter;

	delete dict;

	return cls;
};

Type.prototype.initialize = function() {
};

Type.prototype.__setattr__ = function(name, member) {
	var cls = this;
	var proto = cls.prototype;
	var memberType;

	// 动态添加的成员也可以在dict上找到
	cls.__dict__[name] = member;

	if (name == '__new__') {
		member = staticmethod(member);
	}

	if (member != undefined) {
		if (!member.__class__ && typeof member == 'function') {
			member = cls.__metaclass__.prototype.__defaultmethodtype__(member);
		}
		memberType = member.__class__ || nontypemember;
	} else {
		memberType = nontypemember;
	}

	memberType.setTo(cls, name, member);

	makePrivate(proto, name);
};

Type.prototype.__defaultmethodtype__ = instancemethod;

var prototyping = false;
Object.__new__ = function(cls) {
	if (Object.create) {
		return Object.create(cls.prototype);
	} else {
		prototyping = true;
		var p = new cls;
		prototyping = false;
		return p;
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

	metaclass.prototype.initialize.call(cls, name, base, dict);

	return cls;
}

exports.Class = Class;
exports.Type = Type;
exports.staticmethod = staticmethod;
exports.property = property;
exports.parent = parent;
exports.instanceOf = instanceOf;
exports.typeOf = typeOf;
exports.install = function(target) {
	if (!target) target = global;
	['Class', 'Type', 'classmethod', 'staticmethod', 'property'].forEach(function(name) {
		target[name] = exports[name];
	})
};

return exports;

})
