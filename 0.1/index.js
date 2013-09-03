/**
 * @fileoverview 
 * @author goto100<yiyu.ljw@taobao.com>
 * @module oop
 **/
KISSY.add(function (S, Node,Base) {
    var EMPTY = '';
    var $ = Node.all;
    /**
     * 
     * @class Oop
     * @constructor
     * @extends Base
     */
    function Oop(comConfig) {
        var self = this;
        //调用父类构造函数
        Oop.superclass.constructor.call(self, comConfig);
    }
    S.extend(Oop, Base, /** @lends Oop.prototype*/{

    }, {ATTRS : /** @lends Oop*/{

    }});
    return Oop;
}, {requires:['node', 'base']});



