# OOP.JS

## 介绍

功能强大、适应场景广的JavaScript OOP库。

去除js中冗余、晦涩的噪音代码。

<blockquote>
How to do --> What to do
</blockquote>

* 名称一次定义，支持调用父类同名方法；
* 广泛应用描述器模式；
* 强大的 metaclass 功能。

### 适用平台

* nodejs
* 浏览器 _开发中_
* KISSY 已发布至 [kissy gallery](http://gallery.kissyui.com/oui/0.1/guide/index.html)

### 安装及使用

#### nodejs

```
npm install oop.js
```

```
var oop = require('oop.js');
oop.install(); // 输出 Class/property/staticmethod 成员到 global

var MyClass = new Class({
	a: property(…),
	c: staticmethod(…)
});
```

#### kissy

```
KISS.use('gallery/oop/0.1/index', function(S, oop) {
	oop.install();

	var MyClass = new Class({
		a: property(...),
		c: staticmethod(...)
	});
});
```

## 特征

* 单继承
* 多mixin
* property
* 实例方法和静态方法
* metaclass

## 修饰器

在此OOP库中，大量使用了修饰器模式。

修饰器是一个函数，用于包装另一个函数，这种包装的首要目的是透明的修改或增强被包装对象的行为。但在定义后，函数对象本身就被传递给修饰器函数，修饰器函数返回一个新函数替代原始的函数。

可以使用多个修饰器，装饰器将按照出现的先后顺序应用。

修饰器也可以接受参数，返回在调用时使用函数作为参数的函数。

在其他语言中，修饰器一般通过`@`进行调用。由于语法限制，在js中使用函数调用形式进行调用。

在Python中：

```
class A(object):
  @classmethod
  @mydecorator('a', 'b')
  def myMethod():
    pass
```

在js中：

```
var A = new Class(Object, function() {
  this.myMethod = classmethod(mydecorator('a', 'b')(function() {
  }));
});
```

Mootools的`Function.prototype.overloadSetter`就是一个典型的修饰器应用。

## 创建一个类

### 构造函数风格

通过构造函数扩充 `this` 实现：

```
var MyClass = new Class(function() {

	// 这里的 this 指向类的构造成员
	this.member1 = 1;
	this.member2 = function() { };
	
});
```

### 原型成员风格

通过 key-value object 实现：

```
var MyClass = new Class({
	member1 : 1,
	member2: function() { }
});
```

## 成员类型

有几种常用成员类型：

* 普通属性
* property属性
* 实例方法
* 静态方法
* 构造方法

### 普通属性

定义在类上的一个普通静态属性。

由于JS中区分传值引用与地址引用，普通的静态属性需要注意对象在类的创建过程中是*地址引用*的，也就是说没有自动帮你将这些对象成员自动拷贝一份到实例上。

如果需要为每个实例设置不同的初始化值，需要在构造函数中对已经产生的实例进行赋值。或者使用property属性也可实现类似的功能。

```
var MyClass = new Class(function() {
	// 普通属性
	this.field = 1;
	this.field2 = {foo:1, bar:2};
});

var myClass = new MyClass();
var myClass2 = new MyClass();

// field2为地址引用，所有实例公用一个
myClass.field2.foo = 11;

console.log(myClass2.field2.foo); // ==> 11
```

### property 属性

可以设置 getter 和 setter 方法的属性，通过 obj.get('propertyName') 获取属性值，obj.set('propertyName', propertyValue) 设置属性值。


```
var MyClass = new Class(function() {

	// property属性
	this.prop = property(function() {
		// 这个函数是getter
		return this.__prop;
	}, function(value) {
		// 这个函数是setter
		this.__prop = value;
	});

});

var myClass = new MyClass();

myClass.set('prop', 'test');
console.log(myClass.get('prop')); // ==> test
console.log(myClass.prop); // ==> test
```

### 实例方法

```
var MyClass = new Class(function() {

    // instancemethod，实例方法，默认方法类型。
    this.myInstanceMethod = function(arg1, arg2) {
		console.log(this);
    };
	
});

var myClass = new MyClass();

myClass.myInstanceMethod(arg1, arg2); // ==> myClass
```

### 静态方法

通过 `staticmethod` 方法包装后的函数成员会被作为类的静态方法存在。

静态在类上和类的实例上均可调用。

在实例和在类上调用时，所有参数一对一的传递。

```
var MyClass = new Class(function() {

	// staticmethod，静态方法。
	this.myStaticMethod = staticmethod(function(arg1, arg2) {
	});
	
});

// 在类上调用
MyClass.myStaticMethod(arg1, arg2);

var myClass = new MyClass();

// 在实例上调用
myClass.myStaticMethod(arg1, arg2);
```

### 构造方法

构造方法是一个特殊的实例方法，其会在生成类实例（new）时被调用。

由于地址引用的原因，对每个实例独有的成员一般是在构造函数中进行创建。

```
var MyClass = new Class(function() {
	// 构造方法，在new的时候会执行
	this.initialize = function() {
		var self = this;
		self.foo = 1;
		self.bar = {}; // 每个实例都会有一个不同的bar属性对象
		console.log('base class!');
	};
});
```

## 继承

单继承，通过new Class的第一个参数指定父类

在继承方法中不会自动调用父类同名方法，需要手工调用：

* 直接调用父类上的方法
* `oop.parent` 调用父类_同名_方法
* `oop.parent.bind(arguments.callee)` 返回的函数可以在闭包内调用父类同名方法

```
var MyClass2 = new Class(MyClass, function() {
	/**
	 * 覆盖了父类的同名方法
	 * @override
	 */
	this.initialize = function() {
		var self = this;
		MyClass.prototype.initialize.apply(this, arguments); // 调用父类的同名方法
		// 或 oop.parent(self); // this.parent指向父类同名方法
		// 可以在闭包内调用的 parent
		var parent = oop.parent.bind(arguments.callee);
		;(function() {
			parent(self);
		});
		console.log('inherit class!');
	}
});

var myClass2 = new MyClass2(); // ==> base class! inherit class!
```

### 继承原生类

oop.js 可以把任意非 oop.js 维护的类作为基类使用。

```
var MyArray = new Class(Array, {
	load: function() {
		this.push(1);
	}
});

var arr = new MyArray();

arr.load();

arr.length // ==> 1

```

## Mixin

通过 mixin，可以将另外一个类的成员 mix 到本类中，与继承机制不同，可以同时 mix 多个类。

```
var MyClass = new Class({
	'__mixins__': [Events] // mixin 了 Events 这个类
});

var myClass = new MyClass();

myClass.addEvent('click', function() {}); // addEvent是从Events类中mixin进来的
```

## 动态特性

一个创建好的类也可以重新修改：

```
// ...接以上代码...
MyClass.__setattr__('addEvent', function(self) {
	alert('changed!');
});

myClass.addEvent(); // ==> changed!
```

也可以扩展出新的成员：

```
MyClass.__setattr__('myNewCustomMethod', function() {
	alert('new method!');
});
```

修改、扩展后，继成于此类的类上的同名成员也会变化；而mixin了此类的其他类上的方法则不会变化。

## metaclass

使用 metaclass 提供了对类的创建过程的处理机制

### 效果

使用metaclass可以为上层库实现很多十分智能的特性，我们看以下代码：


```

var MyComponent = new Class(Component, function() {

	this.onclick = function(event) {
		console.log('onclick');
	};
	
	this._show = function() {
		console.log('show1');
	};
	
	this.loadData = function(api, callback) {
		callback();
	};

});

var my = new MyComponent();
my.fireEvent('click'); // onclick
my.addEvent('show', function(event) {
	console.log('show2');
	event.preventDefault();
});
my.show(); // show2
my.loadData('http://xxx').then(...);

```

以上代码来自基于 oop.js 开发的 ui 组件库 oui 的真实应用。

* 使用一个下划线开头的方法在调用时自动触发同名事件；
* 使用`on`开头的方法会自动注册为事件；
* 使用`load`开头的方法自动套用 promise；

作为对比，我们看一下没有 metaclass 的 oop.js 需要写的代码：

```
var MyComponent = new Class(Component, function() {
	
	this.initialize = function() {
		this.addEvent('click', function(event) {
			console.log('onclick')
		});
	};

	this.show = function() {
		console.log('show1');
		this.fireEvent('show');
	};

	this.loadData = function(api) {
		var deferred = promise.defer();
		deferred.resolve();
		return deferred.promise;
	};
});
```

### Type

metaclass 是一个继成于 `Type` 的类

在 JavaScript 中，对象（Object）和函数（Function）就像是鸡和蛋的关系，函数也是一个对象，new一个函数产生一个新的对象。

但是，`Function`这个特殊的对象却缺少了继承的能力，`Function`在 js 中是一个一级继承类（仅仅继承于Object），`Function`的子类不再具有`Function`的特性，其实例无法被调用，看下面的例子：

```
var func1 = new Function();
func1(); // 可以调用

var MyFunc = function() {};
MyFunc.prototype = Object.create(Function.prototype);
var func2 = new MyFunc();
func2(); // 无法调用！
```

在 oop.js 中，将 `Function` 的特性进行了扩展，使其拥有了继承的能力，这就是`Type`。所有的类都继成于`Object`，所有的类都是`Type`的实例。

### 创建一个metaclass

继承于`Type`的类有两个特殊的方法：

* `__new__` 是一个静态方法，在类的构造阶段，非常早期的时候调用，可以用于修改类的定义，需要返回构造好的类，默认返回 `Type.prototype.__new__.call(metaclass, name, base, dict)`
* `initialize` 是一个实例方法，其 `this` 指向创建好的类，可以用于对已经创建好的类进行修改，在将类确定前的最后一次调用，没有返回值。

```
	var MyMetaClass = new Class(Type, {
		__new__: function(metaclass, name, base, dict) {
			return Type.prototype.__new__.call(metaclass, name, base, dict);
		},
		initialize: function(name, base, dict) {
			// 这里的 this 为创建出来的类
		}
	});
```

###使用一个metaclass

```
var MyClass = new Class({
	__metaclass__ : MyMetaClass
});
```

或者（开发中）

```
var MyClass2 = new MyMetaClass();
```

`__metaclass__` 成员也会继承，所有子类自动适用此 metaclass

## AOP（开发中）

```
oop.before;
oop.after;
oop.around;
```

## 常用 Decorators

### fireevent

```
var MyClass = new Class({
	load: fireevent(function(event) {
	
	});
});

var obj = new MyClass();
obj.on('load', funciton() {

);
obj.load();

```

### deferred
```
var MyClass = new Class({
	load: deferred(function(callback) {
		callback();
	});
});

var obj = new MyClass();
obj.load().then();

```


## TODO

* 与loader结合，使得类可以获得自己的名字