## 兼容node平台

要兼容node平台，基本上需要重构oop：

1. node可以设置__proto__，这样就解决了需要同步类方法和静态方法的问题，实现真正的类继承；
2. node有Object.defineProperty，可以省掉不少property相关的代码；
3. 但是node没有__noSuchMethod__之类的方法，因此就失去了 __getattr__ 的支持。