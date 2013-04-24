module('mixin-basic');
//mixin empty
test('mixin empty', function() {
	try {new Class(function(){Class.mixin(this,null)});} catch(e) {ok(false, 'null should be considered');}
	try {new Class(function(){Class.mixin(this,undefined)});} catch(e) {ok(false, 'undefined should be considered');}
	try {new Class(function(){Class.mixin(this,false)});} catch(e) {ok(false, 'false should be considered');}
	try {new Class(function(){Class.mixin(this,{})});} catch(e) {ok(false, '{} should be considered');}
	try {new Class(function(){Class.mixin(this,0)});} catch(e) {ok(false, '0 should be considered');}
	try {new Class(function(){Class.mixin(this,NaN)});} catch(e) {ok(false, 'NaN should be considered');}
	try {new Class(function(){Class.mixin(this,[])});} catch(e) {ok(false, '[] should be considered');}
	try {new Class(function(){Class.mixin(this,'')});} catch(e) {ok(false, '"" should be considered');}
});

//mixin not/empty obj
test('mixin not/empty object', function() {
	try {new Class(function(){Class.mixin(this,'1')});} catch(e) {ok(false, 'string should be considered');}
	try {new Class(function(){Class.mixin(this,1)});} catch(e) {ok(false, 'number should be considered');}
	try {new Class(function(){Class.mixin(this,true)});} catch(e) {ok(false, 'boolean should be considered');}
	try {new Class(function(){Class.mixin(this,function(){
	})});} catch(e) {ok(false, 'empty function should be considered');}
});
//mixin document/window/location...
test('mixin document/window/location', function() {
	try {new Class(function(){Class.mixin(this,window)});} catch(e) {ok(false, 'window should be considered');}
	try {new Class(function(){Class.mixin(this,document)});} catch(e) {ok(false, 'document should be considered');}
	try {new Class(function(){Class.mixin(this,location)});} catch(e) {ok(false, 'location should be considered');}
});
//mixin generic objects, such as String, Array, Date, RegExp
test('mixin with String/Array/Date/RegExp', function() {
	try {new Class(function(){Class.mixin(this,String)});} catch(e) {ok(false, 'String should be considered : ' + e);}
	try {new Class(function(){Class.mixin(this,'string')});} catch(e) {ok(false, '"string" should be considered');}
	try {new Class(function(){Class.mixin(this,Array)});} catch(e) {ok(false, 'Array should be considered : ' + e);}
	try {new Class(function(){Class.mixin(this,[1,2])});} catch(e) {ok(false, '[1,2] should be considered');}
	//try {new Class(function(){Class.mixin(this,Date)});} catch(e) {ok(false, 'Date should be considered');}
	//try {new Class(function(){Class.mixin(this,new Date)});} catch(e) {ok(false, 'new Date should be considered');}
	try {new Class(function(){Class.mixin(this,RegExp)});} catch(e) {ok(false, 'RegExp should be considered');}
	try {new Class(function(){Class.mixin(this,/test/g)});} catch(e) {ok(false, '/test/g should be considered');}
});

//mixin normal obj
test('mixin normal obj', function() {
	try {new Class(function(){Class.mixin(this,{a:1})});} catch(e) {ok(false, '{a:1} should be considered');}
});
//mixin self
test('mixin self', function() {
	try {new Class(function(){Class.mixin(this,this)});} 
		catch(e) {ok(false, 'Class.mixin(this,this) should be considered');}
});

//mixin object
test('mixin object.js', function() {
	try {new Class(function(){Class.mixin(this,object)});} 
		catch(e) {ok(false, 'Class.mixin(this,object) should be considered');}
	try {new Class(function(){Class.mixin(this,Class)});} 
		catch(e) {ok(false, 'Class.mixin(this,Class) should be considered');}
});

test('mixin at the outside of class', function() {
	var A = new Class(function(){});
	var mixin = new Class(function() {
		this.a = 1;
	});
	Class.mixin(A, mixin);
	var a = new A();
	// mixin can only used inside an class
	// equal(a.a, 1, 'mixin outside class is successful(Class.mixin just put mixin into __mixins__)');
});
