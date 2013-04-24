# JS OOP 库概要设计

## 目标

实现功能强大、适应场景广的JavaScript OOP库。

去除js中冗余、晦涩的噪音代码。

<blockquote>
How to do --> What to do
</blockquote>

* 隐藏 prototype；ß
* 隐藏不同引擎对js的不同处理；
* 名称一次定义，方便改名
* 不必写 var self = this;

## 特征

* 单继承
* 多mixin
* property
* 实例方法、类方法和静态方法
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

通过构造函数扩充this实现：

```
var MyClass = new Class(function() {

	// 这里的 this 指向class的构造成员
	this.member1 = 1;
	this.member2 = function() { };
	
});
```

### 原型成员风格

通过key-value object实现：

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
* 构造方法
* 实例方法
* 类方法
* 静态方法

### 普通属性

定义在类上的一个普通静态属性。

由于JS中区分传值引用与地址引用，普通的静态属性需要注意对象在类的创建过程中是*地址引用*的，也就是说没有自动帮你将这些对象成员自动拷贝一份到实例上。

如果需要为每个实例设置不同的初始化值，需要在构造函数中对已经产生的实例（self）进行赋值。或者使用property属性也可实现类似的功能。

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

### property属性

可以设置getter和setter方法的属性，通过 obj.get('propertyName') 获取属性值，obj.set('propertyName', propertyValue) 设置属性值。

在获取和设置的时，设置的getter和setter分别会被执行。

```
var MyClass = new Class(function() {

	// property属性
	this.prop = property(function(self) {
		// 这个函数是getter
		self._set('prop', self.__prop); // 确保通过 self.prop 也能获取到最新的值
		return self.__prop;
	}, function(self, value) {
		// 这个函数是setter
		self._set('prop', value); // 确保通过 self.prop 也能获取到最新的值
		self.__prop = value;
	});

});

var myClass = new MyClass();

myClass.set('prop', 'test');
console.log(myClass.get('prop')); // ==> test
console.log(myClass.prop); // ==> test
```

property属性是为了实现ECMA5 `Object.defineProperty`类似的功能设计的，因此，为保持对支持`Object.defineProperty`的兼容性，请使用`self._set('prop', value)`方法对实例上的同名属性进行赋值，而不是直接使用`self.prop = value`的形式。

### 实例方法

默认的方法，声明函数第一个参数是一个实例的引用，一般通过`self`关键字进行调用。

在实例上调用时，第一个参数默认为*调用实例*，只需传入第二个参数开始的参数；

```
var MyClass = new Class(function() {

    // instancemethod，实例方法。默认方法类型，第一个参数为方法调用者对象
    this.myInstanceMethod = function(self, arg1, arg2) {
		console.log(self);
    };
	
});

var myClass = new MyClass();

// 在实例上调用
myClass.myInstanceMethod(arg1, arg2); // ==> myClass
```

可以通过类的`get`方法获取到类的实例方法的类函数，实现同定义函数相同的传参调用。这种调用在继承的时候可以使用。

```
	// 直接调用MyClass的实例方法，实例对象{}(self)通过第一个参数传递进去。
	MyClass.get('myInstanceMethod')({}, arg1, arg2);
	
	var MyClass2 = new Class(MyClass, function() {
		this.initialize = function(self, arg1, arg2) {
			MyClass.get('initialize')(self, arg1, arg2);
		};
	});
```

### 类方法

通过classmethod方法包装后的函数成员会被作为类的类方法存在。声明函数第一个参数是一个类的引用，一般通过`cls`关键字进行调用。

类方法在类上和类的实例上均可调用。

在实例上调用时，第一个参数默认为*调用实例的构造类*，只需传入第二个参数开始的参数；

在类上调用时，第一个参数默认为*调用类*，只需传入第二个参数开始的参数。

```
var MyClass = new Class(function() {

	// classmethod，类方法。第一个参数为方法调用者的类
	this.myClassMethod = classmethod(function(cls, arg1, arg2) {
		console.log(cls);
	});
	
});

// 在类上调用
MyClass.myClassMethod(arg1, arg2); // ==> MyClass

var myClass = new MyClass();

// 在实例上调用
myClass.myClassMethod(arg1, arg2); // ==> MyClass
```

### 静态方法

通过staticmethod方法包装后的函数成员会被作为类的静态方法存在。声明函数不设置任何默认参数。

静态在类上和类的实例上均可调用。

在实例和在类上调用时，所有参数一对一的传递，不会有任何默认参数的传递。

```
var MyClass = new Class(function() {

	// staticmethod，静态方法。不传递任何默认参数
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

构造方法会在生成类实例（new）时被调用。

由于地址引用的原因，对每个实例独有的成员一般是在构造函数中进行创建。

```
var MyClass = new Class(function() {
	// 构造方法，在new的时候会执行
	this.initialize = function(self) {
		self.foo = 1;
		self.bar = {}; // 每个实例都会有一个不同的bar属性对象
		console.log('base class!');
	};
});
```

## 继承

单继承，通过new Class的第一个参数指定父类

在继承方法中不会自动调用父类同名方法，需要手工调用，调用方法有2种：

* 直接调用父类上的方法
* this.parent 调用父类_同名_方法

```
var MyClass2 = new Class(MyClass, function() {
	/**
	 * 覆盖了父类的同名方法
	 * @override
	 */
	this.initialize = function(self) {
		MyClass.get('initialize')(self); // 调用父类的同名方法
		// 或 this.parent(self); // this.parent指向父类同名方法

		console.log('inherit class!');
	}
});

var myClass2 = new MyClass2(); // ==> base class! inherit class!
```

## Mixin

通过mixin，可以将另外一个类的成员mix到本类中，与继承机制不同，可以同时mix多个类。

```
var MyClass = new Class(function() {
	this.__mixins__ = [Events]; // mixin 了 Events 这个类
});

var myClass = new MyClass();

myClass.addEvent('click', function() {}); // addEvent是从Events类中mixin进来的
```

原型成员风格写法：

```
var MyClass = new Class({
	'__mixins__': [Events]
});
```

### 修改类

一个创建好的类也可以重新修改：

```
// ...接以上代码...
MyClass.set('addEvent', function(self) {
	alert('changed!');
});

myClass.addEvent(); // ==> changed!
```

也可以扩展出新的成员：

```
MyClass.set('myNewCustomMethod', function() {
	alert('new method!');
});
```

对于classmethod和staticmethod，动态修改类会导致遍历继承树，对于已经存在的比较庞大的类树，将会有比较大的性能消耗。

## metaclass

使用metaclass提供了对类的创建过程的处理机制，metaclass是一个继成于Type的class，其中有两个特殊方法：

* `__new__` 类的创建过程
* `initialize` 类的产生过程

### 创建一个metaclass

`__new__`方法和`initialize`方法都接收四个参数：

1. 创建出来的类
2. 类的名称（目前永远为null，为了兼容python的api）
3. 此类的父类
4. 类的成员

`__new__`用于修改类的定义，在非常早期的时候修改类，`type.__new__`方法用于初始化一个类；
`initialize`用于对已经创建好的类进行修改。

```
	var MyMetaClass = new Class(Type, {
		__new__: function(cls, name, base, dict) {
			return Type.__new__(cls, name, base, dict);
		},
		initialize: function(cls, name, base, dict) {
			
		}
	});
```

###使用一个metaclass

```
var MyClass = new Class({
	this.__metaclass__ = MyMetaClass;	
});
```

`__metaclass__`成员也会继承，所有子类自动适用此metaclass
