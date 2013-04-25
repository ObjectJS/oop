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

/**
 * propery 特性支持getter函数，用法：
 * obj.get(prop_name)
 * 会被放到 cls.prototype.get
 * @param name 需要获取的成员
 * @param bind 如果目标成员是个函数，则使用bind进行绑定后返回，非函数忽略此参数
 */
function getter(name, bind) {
	var value = Object.__getattribute__(this, name);
	if (bind !== false && Class.isMethod(value)) {
		bind = bind || this;
		return value.bind(bind);
	}
	return value;
};

/**
 * propery 特性支持getter函数，用法：
 * obj.set(prop_name, value)
 * 会被放到 cls.prototype.set
 */
function setter(prop, value) {
	if ('__setattr__' in this) {
		this.__setattr__(prop, value);
	} else {
		Object.__setattr__(this, prop, value);
	}
}

/**
 * 从类上获取成员
 * 会被放到cls.get
 * @param name 需要获取的成员
 * @param bind 如果目标成员是个函数，则使用bind进行绑定后返回，非函数忽略此参数，false则不绑定
 */
function membergetter(name, bind) {
	var member = Type.__getattribute__(this, name);
	if (bind !== false && Class.isMethod(member)) {
		bind = bind || this;
		return member.bind(bind);
	}
	return member;
};

/**
 * 判断是否存在成员
 * 会被放到cls.has
 */
function memberchecker(name) {
	if (name == '@mixins') name = '__mixins__';
	var proto = this.prototype;
	var properties = proto.__properties__;
	return (name in this || name in proto || (properties && name in properties));
};

/**
 * MyClass.set(name, value);
 * MyClass.set({name1: value1, name2: value2})
 * 会被放到 cls.set
 * 子类不会被覆盖
 */
function membersetter(name, member) {
	// 从metaclass中获得__setattr__
	if ('__metaclass__' in this) {
		Type.__getattribute__(this.__metaclass__, '__setattr__').call(this.__metaclass__, this, name, member);
	}
	// 未设置metaclass则默认为Type
	else {
		Type.__setattr__(this, name, member);
	}
}

/**
 * 对于支持defineProperty的浏览器，可考虑将此setter不设置任何动作
 */
function nativesetter(prop, value) {
	this[prop] = value;
};

/**
 * 获取一个类的子类
 * 会被放到 cls.__subclasses__
 */
function subclassesgetter() {
	return this.__subclassesarray__;
};

/**
 * 调用cls继承链中名字为name的成员
 */
function parent(cls, name, args) {
	if (!name) {
		throw new Error('can not get function name when this.parent called');
	}

	// 拥有此方法的代码书写的类
	var ownCls = cls;

	// parent应该调用“代码书写的方法所在的类的父同名方法”
	// 而不是方法调用者实例的类的父同名方法
	// 比如C继承于B继承于A，当C的实例调用从B继承来的某方法时，其中调用了this.parent，应该直接调用到A上的同名方法，而不是B的。
	// 因此，这里通过hasOwnProperty，从当前类开始，向上找到同名方法的原始定义类
	while (ownCls && !ownCls.prototype.hasOwnProperty(name)) {
		ownCls = ownCls.__base__;
	}

	var base = ownCls.__base__;
	var mixins = ownCls.__mixins__;
	var member, owner;

	// 先从base中找同名func
	if (base && base.get && base.has(name)) {
		owner = base;
		member = Type.__getattribute__(base, name);
	}
	// 再从mixins中找同名func
	else if (mixins && mixins.length && mixins.some(function(mixin) {
		owner = mixin;
		return mixin.has(name);
	})) {
		member = Type.__getattribute__(owner, name);
	}

	if (!member || typeof member != 'function') {
		throw new Error('no such method in parent : \'' + name + '\'');
	} else {
		return member.apply(owner, args);
	}
};

function renameCheck(func, prop, value) {
	if (prop === '__name__' && func[prop] && func[prop] !== value) {
		if (typeof console != 'undefined' && console.warn) {
			console.warn('请不要将同一个方法赋值给多个类成员：' + func[prop] + ' --> ' + value);
		}
	}
}

/**
 * 返回一个绑定了self的instancemethod
 * 若self为false，则返回一个未绑定的方法
 * 若self为undefined，则动态采用this为self
 * 若self为true，则动态采用this为cls
 */
function instancemethod(func, self) {
	// 区分两种方法，用typeof为function判定并不严谨，function也可能是一个实例
	var _instancemethod;
	var im_self;

	// 意味着不绑定，传参时需要手工传im_self进去
	if (self === false) {
		_instancemethod = function(self) {
			// TODO 检测self是否是正确的类型
			return this.prototype[func.__name__].im_func.apply(this.__this__, arguments);
		}
	}
	// 绑定self，若为undefined，则在运行时使用this
	else {
		_instancemethod = function() {
			var args = [].slice.call(arguments, 0);
			// 绑定class
			if (self === true) {
				// 在class上调用
				if (typeof this == 'function') {
					im_self = this;
				}
				// 在instance上调用
				else {
					im_self = this.__class__;
				}
			} else {
				im_self = this;
			}
			args.unshift(im_self);
			return func.apply(this.__this__, args);
		};
	}
	_instancemethod.im_self = self;
	_instancemethod.__class__ = arguments.callee;
	_instancemethod.im_func = func;
	_instancemethod.__setattr__ = function(prop, value) {
		renameCheck(func, prop, value);
		this[prop] = value;
	}; // 检测的是im_func的name
	return _instancemethod;
};

function staticmethod(func) {
	return {
		__class__: arguments.callee,
		im_func: func,
		__setattr__: function(prop, value) {
			renameCheck(this, prop, value);
			this[prop] = value;
		}
	};
};

function classmethod(func, isinstance) {
	var obj = {
		__class__ : arguments.callee,
		im_func : func,
		__setattr__: function(prop, value) {
			renameCheck(this, prop, value);
			this[prop] = value;
		}
	};
	return obj;
};

function property(fget, fset) {
	var p = {};
	p.__class__ = arguments.callee;
	p.__setattr__ = function(prop, value) {
		renameCheck(this, prop, value);
		this[prop] = value;
	}
	p.fget = fget;
	p.fset = fset;
	return p;
};

membersetter = overloadsetter(membersetter);
setter = overloadsetter(setter);

/**
 * 从一个object上获取成员
 */
Object.__getattribute__ = function(obj, name) {
	var property = obj.__properties__[name];
	// property
	if (property) {
		if (property.fget) {
			return property.fget.call(obj.__this__, obj);
		}
		else {
			throw new Error('get not allowed property ' + name);
		}
	}
	// 已存在此成员
	else if (name in obj) {
		return obj[name];
	}
	// 调用getattr
	else if (obj.__getattr__) {
		return obj.__getattr__.call(obj, name);
	}
	// 无此成员，返回
	else {
		return undefined;
	}
};

/**
 * 设置一个对象的成员
 */
Object.__setattr__ = function(obj, prop, value) {
	var property = null;
	if (obj.__properties__) {
		property = obj.__properties__[prop];
	}
	// 此prop不是property，直接赋值即可。
	if (!property) {
		obj[prop] = value;
	}
	// 有fset
	else if (property.fset) {
		property.fset.call(obj.__this__, obj, value);
	}
	// 未设置fset，不允许set
	else {
		throw 'set not allowed property ' + prop;
	}
};

// 获取父类的实例，用于 cls.prototype = new parent
Object.__new__ = function(cls) {
	if (cls === Array || cls === String) return new cls;
	cls.__prototyping__ = true;
	var instance = new cls();
	delete cls.__prototyping__;
	return instance;
};

/**
 * 小写type为兼容处理
 * @class
 */
function Type() {
};

Type.__class__ = Type;

/**
 * 创建一个类的核心过程
 */
Type.__new__ = function(metaclass, name, base, dict) {
	var cls = function() {
		// 通过Object.__new__获取一个空实例
		if (cls.__prototyping__) return this;

		// new OneMetaClass
		// __constructs__是Type才有的，继承于object的类没有
		if (cls.__constructs__) {
			return cls.__constructs__(arguments);
		}
		// new OneClass
		else {
			this.__class__ = cls;
			Class.initMixins(cls, this);
			var value = this.initialize? this.initialize.apply(this, arguments) : null;
			return value;
		}
	};

	/*
	 * 初始化成员
	 * 注意这里从base获取成员的时候，base有可能是object系的，也有可能是Type系的
	 */
	cls.__subclassesarray__ = [];
	cls.__subclasses__ = subclassesgetter;
	// 存储此类上的classmethod和staticmethod的名字，方便继承时赋值
	cls.__classbasedmethods__ = [];
	// cls.__mixin__ 为兼容
	cls.set = cls.__mixin__ = membersetter;
	cls.get = membergetter;
	cls.has = memberchecker;
	// 只有__metaclass__和__class__是指向metaclass的，其他成员都是从base继承而来。
	cls.__metaclass__ = metaclass;
	cls.__class__ = metaclass;
	// 从base继承而来
	cls.__new__ = base.__new__;
	cls.__dict__ = dict;

	// 继承于Type的类才有__constructs__
	cls.__constructs__ = base.__constructs__ || null;

	// 将base上的classmethod、staticmethod成员放到cls上
	// Object和Type上没有任何classmethod、staticmethod，无需处理
	if (base !== Object && base !== Type) {
		;(base.__classbasedmethods__ || []).forEach(function(name) {
			cls[name] = base[name];
			cls.__classbasedmethods__.push(name);
		});
	}

	cls.__constructing__ = true;

	/*
	 * 实现继承
	 */
	cls.prototype = Object.__new__(base);
	cls.prototype.constructor = cls;
	// Array / String 没有 subclass，需要先判断一下是否存在 subclassesarray
	if (base.__subclassesarray__) base.__subclassesarray__.push(cls);

	/*
	 * 实现property
	 */
	var proto = cls.prototype;
	// 有可能已经继承了base的__properties__了
	var baseProperties = proto.__properties__ || {};
	proto.__properties__ = extend({}, baseProperties);

	/*
	 * 同时设置cls和其prototype上的成员
	 */
	//if (base === Type) {
		//Type.__setattr__(cls, 'initialize', Type.__getattribute__(base, 'initialize'));
	//}
	Type.__setattr__(cls, '__setattr__', Type.__getattribute__(base, '__setattr__'));
	Type.__setattr__(cls, '__base__', base);
	// 支持 this.parent 调用父级同名方法
	Type.__setattr__(cls, '__this__', {
		base: base,
		parent: function() {
			// 一定是在继承者函数中调用，因此调用时一定有 __name__ 属性
			return parent(cls, arguments.callee.caller.__name__, arguments);
		}
	});

	// 正常来讲，cls是有metaclass的实例，即 OneClass = new MetaClass，class上面应该有metaclass的成员
	// 但由于js的语言特性，是无法真正的“new”出一个function的（继承于Function没用），其没有原型链
	// 因此只能考虑通过遍历将metaclass中的成员赋值到cls上，影响性能，且此类需求只在metaclass的制作过程中有，并没太大必要，比如：
	// var M = new Class(Type, {
	//   a: function() {},
	//   __new__(cls) {}, // 这个cls是M，可以通过get获取到a
	//   initialize(cls) {} // 这个cls就是生成的cls了，此是无法通过get获取到a，而python是可以的
	// });
	// 另外一个考虑，通过修改membergetter使一个class会去其metaclass中寻找成员。
	// 下面的代码是用遍历的方法使其支持的代码
	//Class.keys(metaclass).forEach(function(name) {
		//cls[name] = function() {
			//var args = Array.prototype.slice.call(arguments, 0);
			//args.unshift(cls);
			//return metaclass.prototype[name].im_func.apply(cls, args);
		//};
	//});

	/*
	 * Dict
	 */
	for (var k in dict) {
		Type.__setattr__(cls, k, dict[k]);
	}

	/*
	 * Mixin
	 */
	var mixins = cls.__mixins__;
	if (mixins) {
		mixins.forEach(function(mixin) {
			Class.keys(mixin).forEach(function(name) {
				if (cls.has(name)) return; // 不要覆盖自定义的
				var member = Type.__getattribute__(mixin, name);
				Type.__setattr__(cls, name, member);
			});
		});
	}

	/*
	 * 默认成员，若之前有定义也强制覆盖掉
	 */
	cls.prototype.get = getter;
	cls.prototype.set = setter;
	cls.prototype._set = nativesetter;

	delete cls.__constructing__;

	Object.keys(proto.__properties__).forEach(function(name) {
		var property = proto.__properties__[name];
		Object.defineProperty(proto, name, {
			get: prototype.fget,
			set: prototype.fset
		});
	});

	return cls;
};

/**
 * 设置属性到类
 */
Type.__setattr__ = function(cls, name, member) {
	if (name == '@mixins') name = '__mixins__';

	var proto = cls.prototype;
	var properties = proto.__properties__;
	var subs = cls.__subclassesarray__;
	var constructing = cls.__constructing__;

	if (['__mixins__', '__new__', '__this__', '__base__'].indexOf(name) != -1) {
		if (!member || (typeof member != 'object' && typeof member != 'function')) {
			return;
		}
	}
	
	// 类构建完毕后才进行set，需要先删除之前的成员
	delete cls[name];
	delete proto[name];
	delete properties[name];

	// 这里的member指向new Class参数的书写的对象/函数
	if (['__new__', '__metaclass__', '__mixins__'].indexOf(name) != -1) {
		if (member && (typeof member == 'object' || typeof member == 'function')) {
			cls[name] = member;
		}
	}
	// 
	else if (['__this__', '__base__'].indexOf(name) != -1) {
		cls[name] = proto[name] = member;
	}
	// 有可能为空，比如 this.test = null 或 this.test = undefined 这种写法;
	else if (member == null) {
		proto[name] = member;
	}
	// 先判断最常出现的instancemethod
	// this.a = function() {}
	else if (member.__class__ === undefined && typeof member == 'function') {
		proto[name] = instancemethod(member);
		proto[name].__setattr__('__name__', name);
		// 这样赋值__name__，确保__name__都是被赋值在开发者所书写的那个function上，能够通过arguments.callee.__name__获取到。
		member.__name__ = name;
		// 初始化方法放在cls上，metaclass会从cls上进行调用
		if (name == 'initialize') {
			cls[name] = instancemethod(member, false);
		}
	}
	// this.a = property(function fget() {}, function fset() {})
	else if (member.__class__ === property) {
		member.__setattr__('__name__', name);
		properties[name] = member;
		// 当prototype覆盖instancemethod/classmethod/staticmethod时，需要去除prototype上的属性
		proto[name] = undefined;
	}
	// 在继承的时候，有可能直接把instancemethod传进来，比如__setattr__
	else if (member.__class__ === instancemethod) {
		// 重新绑定
		proto[name] = instancemethod(member.im_func);
		// 绑定了cls的instancemethod，意味着是一个classmethod
		if (member.im_self == true) {
			cls[name] = member;
		}
	}
	// this.a = classmethod(function() {})
	else if (member.__class__ === classmethod) {
		member.__setattr__('__name__', name);
		member.im_func.__name__ = name;
		// classmethod，都绑定其class
		cls[name] = proto[name] = instancemethod(member.im_func, true);
		cls.__classbasedmethods__.push(name);
	}
	// this.a = staticmethod(function() {})
	else if (member.__class__ === staticmethod) {
		member.__setattr__('__name__', name);
		member.im_func.__name__ = name;
		cls[name] = proto[name] = member.im_func;
		cls.__classbasedmethods__.push(name);
	}
	// this.a = new Class({})
	else if (Class.instanceOf(member, Type)) {
		cls[name] = proto[name] = member;
	}
	// this.a = someObject
	else {
		proto[name] = member;
	}

	// 所有子类cls上加入
	// 在constructing时肯定没有子类，做个标记直接返回
	if (!constructing && name in cls && subs) {
		subs.forEach(function(sub) {
			// !(name in sub) 与 !name in sub 得到的结果不一样
			if (!(name in sub)) {
				Type.__setattr__(sub, name, member);
			}
		});
	}
};

/**
 * 删除类成员
 */
Type.__delattr__ = function(cls, name) {
	delete cls[name];
	delete cls.prototype[name];
	delete cls.prototype.__properties__[name];
};

/**
 * 从类上获取成员
 */
Type.__getattribute__ = function(cls, name) {
	if (name == '@mixins') {
		name = '__mixins__';
	}
	var proto = cls.prototype;
	var properties = proto.__properties__;
	var metaclass = cls.__metaclass__;
	var member;

	// 直接在自己身上找
	if (name in cls) {
		member = cls[name];
	}

	// 找property
	else if (properties && properties[name] !== undefined) {
		member = properties[name];
	}

	// 找到instancemethod
	else if (proto[name] && proto[name].__class__ == instancemethod) {
		// 对于instancemethod，需要返回重新bind的方法
		// 为保证每次都能取到相同的成员，保存在cls[name]上，下次直接就在cls上找到了
		cls[name] = member = instancemethod(proto[name].im_func, false);
	}

	// 去其metaclass中找
	// Type也要找，可以找到initialize
	else if (metaclass && (member = Type.__getattribute__(metaclass, name)) !== undefined) {
		// 将metaclass上的成员重新包装后放到cls上，需要把cls当成一个instance
		if (member.__class__ === instancemethod) {
			// 这里把cls当成一个instance了（metaclass的instance）
			// 重新绑定
			member = instancemethod(member.im_func, true);
		}
		cls[name] = member;
	}

	// 找到普通成员
	else {
		member = proto[name];
	}

	return member;
};

/**
 * new Class 或 new OneMetaClass 的入口调用函数
 * 此方法只放在Type上，可用于判断一个类是Object系的还是Type系的
 * Object要用的时候用Type.__constructs__.call(Object, arguments)调用即可
 */
Type.__constructs__ = function(args) {
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

	var metaclass;
	// new Class()，用class生成一个Object
	if (this === Object) {
		metaclass = dict.__metaclass__ || base.__metaclass__ || Type;
	}
	// new OneMetaClass，用this生成一个class
	else {
		metaclass = this;
	}

	// 创建&初始化
	var cls = metaclass.__new__(metaclass, name, base, dict);

	if (!cls || typeof cls != 'function') {
		throw new Error('__new__ method should return cls');
	}
	Type.__getattribute__(metaclass, 'initialize').call(metaclass, cls, name, base, dict);
	return cls;
};

Type.initialize = function() {
};

Object.__class__ = Type;

/**
 * 类的定义
 * @namespace Class
 */
function Class() {
	// 通过Object调用__constructs__，获取metaclass的途径不同
	return Type.__constructs__.call(Object, arguments);
};

/**
 * mixin时调用mixin的initialize方法，保证其中的初始化成员能够被执行
 */
Class.initMixins = function(cls, instance) {
	if (!cls) {
		return;
	}
	// 初始化父类的mixin
	if (cls.__base__) {
		Class.initMixins(cls.__base__, instance);
	}
	var mixins = cls.__mixins__;
	if (mixins) {
		// 这里必须是instance.__this__，因为initialize.call调用中已经设置了this指向的是instance
		instance.__this__.mixining = true;
		for (var i = 0, l = mixins.length, mixin; i < l; i++) {
			mixin = mixins[i];
			if (mixin.prototype && typeof mixin.prototype.initialize == 'function') {
				mixin.prototype.initialize.call(instance);
			}
		}
		delete instance.__this__.mixining;
	}
	
};

/**
 * 在new Class的callback中mixin
 * var MyClass = new Class(function() {
 *	Class.mixin(this, AnotherClass);
 * })
 */
Class.mixin = function(dict, cls) {
	if (!dict || typeof dict != 'object') {
		return;
	}
	if (cls === Array) {
		cls = ArrayClass;
	} else if (cls === String) {
		cls = StringClass;
	}
	dict.__mixins__ = dict.__mixins__ || [];
	dict.__mixins__.push(cls);
};

/**
 * 是否存在property
 */
Class.hasProperty = function(obj, name) {
	return (obj && obj.__properties__) ? (name in obj.__properties__) : false;
};

/**
 * 是否存在类成员
 */
Class.hasMember = function(cls, name) {
	if (!cls) return false;
	if (name in cls.prototype) return true;
	return false;
};

/**
 * 是否是方法
 */
Class.isMethod = function(member) {
	if (typeof member == 'function') {
		if (!member.__class__
				|| member.__class__ == instancemethod
				|| member.__class__ == staticmethod
				|| member.__class__ == classmethod
		   ) {
			return true;
		}
	}
	return false;
};

/**
 * 所有properties
 */
Class.getPropertyNames = function(obj) {
	return (obj && obj.__properties__) ? Object.keys(obj.__properties__) : [];
};

/**
 * 将host注射进class，使其self指向host
 * @param cls 被注射的class
 * @param host 注射进去的对象
 * @param args 构造的参数
 * @param filter 过滤器，实现选择性注射
 */
Class.inject = function(cls, host, args, filter) {
	if (typeof cls != 'function') {
		throw new Error('bad arguments.');
	};
	var argsLen = arguments.length;
	if (argsLen === 2) {
		args = [];
		filter = true;
	} else if (argsLen === 3) {
		if (Array.isArray(args)) {
			args = args || [];
			filter = true;
		} else {
			filter = args;
			args = [];
		}
	}

	host.__class__ = cls;
	host.__properties__ = cls.prototype.__properties__;
	var p = Object.__new__(cls);
	extend(host, p, filter);
	Class.initMixins(cls, host);
	if (typeof cls.prototype.initialize == 'function') {
		cls.prototype.initialize.apply(host, args);
	}
};

/**
 * 判断成员是否是一个type类型的
 */
Class.instanceOf = function(obj, func) {
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
};

/**
 * 获取一个class的继承链
 */
Class.getChain = function(cls) {
	if (!cls) {
		return [];
	}
	var result = [cls];
	while (cls.__base__) {
		result.push(cls.__base__);
		cls = cls.__base__;
	}
	return result;
};

/**
 * 将一个类的所有子类形成平面数组返回
 * 会在Class.mixin中用到
 */
Class.getAllSubClasses = function(cls) {
	if (!cls || !cls.__subclassesarray__) {
		return [];
	}
	var array = cls.__subclassesarray__;
	var queue = [].concat(array), ele = queue.shift(), subs;
	while (ele != null) {
		subs = ele.__subclassesarray__;
		if (subs != null) {
			queue = queue.concat(subs);
			array = array.concat(subs);
		}
		ele = queue.shift();
	}
	return array;
};

/**
 * 遍历一个类成员
 * 获取类成员通过cls.get(name)
 */
Class.keys = function(cls) {
	if (!cls || !cls.prototype) {
		return [];
	}
	var keys = [];
	// 找到全部的，不仅仅是 hasOwnProperty 的，因此不能用Object.keys代替
	for (var prop in cls.prototype) {
    	keys.push(prop);
    }
	
	keys = keys.filter(function(name) {
		// 这3个需要过滤掉，是为了支持property加入的内置成员
		// initialize也需要过滤，当mixin多个class的时候，initialize默认为最后一个，这种行为没意义
		return !(name.indexOf('__') == 0 && name.slice(-2) == '__') && !(['get', 'set', '_set', 'initialize', 'constructor'].indexOf(name) != -1);
	});
	return keys;
};

exports.Class = Class;
exports.Type = Type;
exports.staticmethod = staticmethod;
exports.classmethod = classmethod;
exports.property = property;
