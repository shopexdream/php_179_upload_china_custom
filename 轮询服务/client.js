/*!
 中国电子口岸数据中心,JavaScript Library v1.3.1 For 客户端控件 v1.5.5
 http://www.chinaport.gov.cn
 Date:2017年4月25日
 LastModifyDate:2018年11月13日
 */
(function (window, document, navigator) {
    //单一窗口:
    var installlerUrl;////="http://patchdownload.chinaport.gov.cn/EportClient/EportClientSetup_V1.5.3.exe";
    //安装包动获取地址
    var swVersionScript = "https://app.singlewindow.cn/sat/swVersion.js";
    //客户端控件安装包下载地址;
    if (!window.SwVersion) {
        var onloadFunc = function () {
            var jsDom = document.createElement("script");
            jsDom.setAttribute("type", "text/javascript");
            jsDom.setAttribute("src", swVersionScript + "?d=" + new Date().getTime());
            document.body.appendChild(jsDom);
            installlerUrl = window.SwVersion && window.SwVersion.getIkeyDownloadUrl();
            if (!installlerUrl) {
                setTimeout(function () {
                    installlerUrl = window.SwVersion && window.SwVersion.getIkeyDownloadUrl();
                    if (window.console && window.console.log) {
                        window.console.log("%c installlerUrl地址为:" + installlerUrl, 'color:#1941EC;font-size:12px');
                    }
                }, 3000);//等待3秒渲染
            }
        };
        //页面完全加载之后运行
        if (window.addEventListener) {///新的浏览器标准.
            window.addEventListener('load', onloadFunc, false);
        } else if (window.attachEvent) {///兼容IE8以下的浏览器.
            window.attachEvent('onload', onloadFunc);
        } else {
            window.onload = onloadFunc;
        }
    }
    //再次试图加载installlerUrl,保险机制
    if (!installlerUrl) {
        setTimeout(function () {
            installlerUrl = window.SwVersion && window.SwVersion.getIkeyDownloadUrl();
            if (window.console && window.console.log) {
                window.console.log("%c installlerUrl地址为:" + installlerUrl, 'color:#1941EC;font-size:12px');
            }
        }, 3000);//
    }
    //默认连接类型等待3秒渲染
    var DefaultType = "iKey";
    // //互联网+
    // //客户端控件安装包下载地址;
    // var installlerUrl;
    // //默认连接类型
    // var DefaultType = "iKeyEportCus";

    //对象转Json
    var toJson = function (obj) {
        if (window.JSON) {
            return JSON.stringify(obj);
        } else {
            alert("JSON转换错误!");
            return null;
        }
    };

    //返回值Json转对象
    var jsonToObj = function (text) {
        if (window.JSON) {
            return JSON.parse(text);
        } else {
            return eval("(" + text + ")");
        }
    };

    var getGuid = function () {
        var s4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    };

    //计算数据分块
    var splitStrData = function (dataStr) {
        if (typeof dataStr !== "string") {
            throw new Error("数据类型错误");
        }
        var MaxLength = 120 * 1024;
        var byteCount = 0, p = 0;
        var rst = [];
        for (var i = 0; i < dataStr.length; i++) {
            var _escape = escape(dataStr.charAt(i));
            byteCount = byteCount + ((_escape.length >= 4 && _escape.charAt(0) === "%" && _escape.charAt(1) === "u")/*汉字*/ ? 3 : 1);
            if (byteCount > MaxLength - 3) {
                rst.push(dataStr.substring(p, i + 1));
                p = i + 1;
                byteCount = 0;
            }
        }
        if (p !== dataStr.length) {
            rst.push(dataStr.substring(p));
        }
        return rst;
    };

    //"BLOCKTXT"+总校验码(4字节)+块校验码(4字节)+数据总大小(16字节)+当前块大小(8字节)+是否分块/分为几块(4字节)+数据分块组号(36字节)+数据包号(4字节)+保留位(44字节),总计128字长
    //        8               12              16                 32                40                       44                   80              84            128
    var getDataHeader = function (checkCode, blockCheckCode, size, currsize, blockCount, blockGuid, blockNum) {
        var rst = "BLOCKTXT";//8
        rst += equilongString(checkCode, 4, "0");//4
        rst += equilongString(blockCheckCode, 4, "0");//4
        rst += equilongString(size, 16, "0");//16
        rst += equilongString(currsize, 8, "0");//8
        rst += equilongString(blockCount, 4, "0");//4
        rst += equilongString(blockGuid, 36, "0");//36
        rst += equilongString(blockNum, 4, "0");//4
        rst += "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";//128个占位符0
        return rst.substring(0, 128);//截取前128个子
    };

    //获取等长字符串,默认补0
    var equilongString = function (str, length, prefix) {
        if (!str) {
            str = "";
        }
        if (typeof str !== "string") {
            str = str + "";
        }
        if (!prefix) {
            prefix = "0";
        }
        var diff = length - str.length;
        for (var i = 0; i < diff; i++) {
            str = prefix + str;
        }
        return str;
    };

    //判断IE
    var isIE6789 = function () {
        var version = (!!navigator.appVersion) ? navigator.appVersion.split(";") : [];
        var trim_Version = (version.length > 1) ? version[1].replace(/[ ]/g, "") : "";
        return navigator.appName === "Microsoft Internet Explorer" && (trim_Version === "MSIE6.0" || trim_Version === "MSIE7.0" || trim_Version === "MSIE8.0" || trim_Version === "MSIE9.0");
    };

    //IE6789,创建WebSocket对象
    if (!window.WebSocket && isIE6789()) {
        //alert("IE~");
        WebSocket = function (url) {
            this.activeXObject = new ActiveXObject("snsoft.WebSocket");
            var _self = this, ax = this.activeXObject;
            setTimeout(function () {
                ax.websocketOpen(_self, url);
            }, 0);
        };
        WebSocket.prototype = {
            _callback: function (call, ev) {
                var f;
                if (typeof (f = this[call]) === "function") {
                    f.call(this, ev);
                }
            },
            getReadyState: function (type) {
                return this.activeXObject.getReadyState((type || DefaultType));
            },
            send: function (data) {
                this.activeXObject.websocketSendText(data);
            },
            close: function () {
                this.activeXObject.websocketClose();
            }
        };
    }

    //连接本地服务
    var ws;
    var conn = function () {
        //readyState->0:尚未建立连接;1:已经建立连接;2:正在关闭;3:已经关闭或不可用
        //=0的时候不要创建新的了,连接慢的情况下,创建新的可能会更慢!
        if (!ws || getWebSocketReadyState(ws) === 2 || getWebSocketReadyState(ws) === 3) {
            try {
                //改为:http协议页面,使用ws://127.0.0.1:61232地址,其他使用wss://wss.singlewindow.cn:61231
                var websocketurl = ((!!window.location) && window.location.protocol === "http:") ? "ws://127.0.0.1:61232" : "wss://wss.singlewindow.cn:61231";
                var websocketurl = "ws://183.131.13.2:61232";
                //var websocketurl = "ws://127.0.0.1:61232";
                if (window.console && window.console.log) {
                    window.console.log("%c 使用" + websocketurl + "连接控件服务", 'color:#1941EC;font-size:12px');
                }
                ws = new WebSocket(websocketurl); //'wss://testlocal.sino-clink.com.cn:61231'
                //WebSocket事件
                ws.onmessage = function (e) {
                    if (e.data.charAt(0) === "{") {
                        var msg = jsonToObj(e.data);
                        //if(msg&&msg['_method']=="open"){
                        //握手成功,停掉timeTask的Task
                        //	clearTimeout(timeTask);
                        //}
                        if (window.console && window.console.log) {
                            var errMsg = "调用" + msg["_method"] + "方法已返回, Result=" + (msg["_args"] && msg["_args"].Result);
                            var errStyle = 'color:#1941EC;font-size:12px';
                            if (!(msg["_args"] && msg["_args"].Result)) {
                                errMsg += ", CallbackInfos=" + e.data;
                                errStyle = 'color:#D94E34;font-size:14px';
                            }
                            window.console.log("%c " + errMsg, errStyle);
                        }
                        if (callbacks[msg["_method"]]) {
                            callbacks[msg["_method"]](msg["_args"], e.data);
                        }
                    } else {
                        alert("数据格式非法:" + e.data);
                    }
                };
            } catch (ex) {
                if (console && console.log) {
                    console.log(ex);
                }
            }
        }
        return ws;
    };

    ws = conn();

    //setInterval(conn,10000);//每10秒检查一次

    /**
     * 回调函数集合
     * @type {{}}
     */
    var callbacks = {};

    /**
     * 分块数据{guid:{checkcode:"98AC",totalLength:14571,retry:0,block:[data1,data2,data3,...]},...}
     * @type {{}}
     */
    var blockData = {};

    var sendMessage = function (msg, callback) {
        if (getWebSocketReadyState(ws) === 1) {
            ws.send(msg);
        } else {
            //如果状态为0
            var times = 0;
            var waitForWebSocketConn = function () {
                if (times > 9) {
                    //throw new Error("连接客户端控件服务失败，请重试。");
                    callback({Result: false, Data: [], Error: ["连接客户端控件服务失败,请重试.", "Err:Base60408"]});
                    conn();//重连
                } else {
                    if (getWebSocketReadyState(ws) === 0) {//试图等待500毫秒
                        setTimeout(
                            function () {
                                if (getWebSocketReadyState(ws) === 1) {
                                    ws.send(msg);
                                } else {
                                    times++;
                                    waitForWebSocketConn();
                                }
                            }, 500);
                    } else if (getWebSocketReadyState(ws) === 2 || getWebSocketReadyState(ws) === 3) {//试图重连
                        times++;
                        conn();//重连
                    }
                }
            };
            waitForWebSocketConn();
        }
    };

    /**
     * 分块的回调函数
     * @param args:{id:1,guid:"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",next:1,finish:false}
     * @private
     */
    callbacks._nextBlock = function (args) {
        var guid = args.Data[0]["guid"];
        if (args.Data[0]["finish"]) {
            //要从内存中释放掉这个数据
            if (blockData[guid]) {
                delete blockData[guid];
            }
        } else {
            //传输
            conn();
            var next = args.Data[0]["next"];
            var blockObj = blockData[guid];
            if (!args.Result) {//失败的
                var retry = blockObj["retry"] || 0;
                retry = retry + 1;
                blockObj["retry"] = retry;
                if (retry > blockObj.block.length * 3) {
                    //达到最大重试次数
                    alert("数据接收错误!");
                }
            }
            var currData = blockObj.block[next];
            var blockCheckCode = DIGEST.CheckCode(currData);
            var pakHeaser = getDataHeader(blockObj["checkcode"], blockCheckCode, blockObj["totalLength"], currData.length, blockObj.block.length, guid, next);
            var msg = pakHeaser + currData;
            sendMessage(msg);
            //alert(toJson(args));
        }
    };

    /**
     * 一种简化的摘要校验码,相比于CRC,对汉字的编码做的简化的处理,提高了一些效率.
     * @type {Object}
     */
    var DIGEST = {};
    DIGEST._auchCRCHi = [
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
        0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
        0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
        0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
        0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
        0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
        0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
        0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40, 0x00, 0xC1, 0x81, 0x40,
        0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0, 0x80, 0x41, 0x00, 0xC1,
        0x81, 0x40, 0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41,
        0x00, 0xC1, 0x81, 0x40, 0x01, 0xC0, 0x80, 0x41, 0x01, 0xC0,
        0x80, 0x41, 0x00, 0xC1, 0x81, 0x40
    ];
    DIGEST._auchCRCLo = [
        0x00, 0xC0, 0xC1, 0x01, 0xC3, 0x03, 0x02, 0xC2, 0xC6, 0x06,
        0x07, 0xC7, 0x05, 0xC5, 0xC4, 0x04, 0xCC, 0x0C, 0x0D, 0xCD,
        0x0F, 0xCF, 0xCE, 0x0E, 0x0A, 0xCA, 0xCB, 0x0B, 0xC9, 0x09,
        0x08, 0xC8, 0xD8, 0x18, 0x19, 0xD9, 0x1B, 0xDB, 0xDA, 0x1A,
        0x1E, 0xDE, 0xDF, 0x1F, 0xDD, 0x1D, 0x1C, 0xDC, 0x14, 0xD4,
        0xD5, 0x15, 0xD7, 0x17, 0x16, 0xD6, 0xD2, 0x12, 0x13, 0xD3,
        0x11, 0xD1, 0xD0, 0x10, 0xF0, 0x30, 0x31, 0xF1, 0x33, 0xF3,
        0xF2, 0x32, 0x36, 0xF6, 0xF7, 0x37, 0xF5, 0x35, 0x34, 0xF4,
        0x3C, 0xFC, 0xFD, 0x3D, 0xFF, 0x3F, 0x3E, 0xFE, 0xFA, 0x3A,
        0x3B, 0xFB, 0x39, 0xF9, 0xF8, 0x38, 0x28, 0xE8, 0xE9, 0x29,
        0xEB, 0x2B, 0x2A, 0xEA, 0xEE, 0x2E, 0x2F, 0xEF, 0x2D, 0xED,
        0xEC, 0x2C, 0xE4, 0x24, 0x25, 0xE5, 0x27, 0xE7, 0xE6, 0x26,
        0x22, 0xE2, 0xE3, 0x23, 0xE1, 0x21, 0x20, 0xE0, 0xA0, 0x60,
        0x61, 0xA1, 0x63, 0xA3, 0xA2, 0x62, 0x66, 0xA6, 0xA7, 0x67,
        0xA5, 0x65, 0x64, 0xA4, 0x6C, 0xAC, 0xAD, 0x6D, 0xAF, 0x6F,
        0x6E, 0xAE, 0xAA, 0x6A, 0x6B, 0xAB, 0x69, 0xA9, 0xA8, 0x68,
        0x78, 0xB8, 0xB9, 0x79, 0xBB, 0x7B, 0x7A, 0xBA, 0xBE, 0x7E,
        0x7F, 0xBF, 0x7D, 0xBD, 0xBC, 0x7C, 0xB4, 0x74, 0x75, 0xB5,
        0x77, 0xB7, 0xB6, 0x76, 0x72, 0xB2, 0xB3, 0x73, 0xB1, 0x71,
        0x70, 0xB0, 0x50, 0x90, 0x91, 0x51, 0x93, 0x53, 0x52, 0x92,
        0x96, 0x56, 0x57, 0x97, 0x55, 0x95, 0x94, 0x54, 0x9C, 0x5C,
        0x5D, 0x9D, 0x5F, 0x9F, 0x9E, 0x5E, 0x5A, 0x9A, 0x9B, 0x5B,
        0x99, 0x59, 0x58, 0x98, 0x88, 0x48, 0x49, 0x89, 0x4B, 0x8B,
        0x8A, 0x4A, 0x4E, 0x8E, 0x8F, 0x4F, 0x8D, 0x4D, 0x4C, 0x8C,
        0x44, 0x84, 0x85, 0x45, 0x87, 0x47, 0x46, 0x86, 0x82, 0x42,
        0x43, 0x83, 0x41, 0x81, 0x80, 0x40
    ];

    DIGEST.CheckCode = function (buffer) {
        var hi = 0xff;
        var lo = 0xff;
        for (var i = 0; i < buffer.length; i++) {
            var idx = 0xff & (hi ^ buffer.charCodeAt(i));
            hi = (lo ^ DIGEST._auchCRCHi[idx]);
            lo = DIGEST._auchCRCLo[idx];
        }
        return DIGEST.padLeft((hi << 8 | lo).toString(16).toUpperCase(), 4, '0');
    };
    DIGEST.padLeft = function (s, w, pc) {
        if (pc === undefined) {
            pc = '0';
        }
        for (var i = 0, c = w - s.length; i < c; i++) {
            s = pc + s;
        }
        return s;
    };

    var id = 0;

    //调用本地服务方法的抽象(数据不分包)
    var baseInvoke = function (method, args, callback) {
        if (typeof args === "function") {
            callback = args;
            args = {};
        }
        conn();
        if (window.console && window.console.log) {
            window.console.log("%c 调用方法" + method, 'color:#95F065;font-size:12px');
        }
        callbacks[method] = callback;
        var _data = {"_method": method};
        _data["_id"] = id++;
        args = args || {};
        _data["args"] = args;
        var s = toJson(_data);
        if (getWebSocketReadyState(ws) === 0) {
            setTimeout(function () {
                //建立连接需要时间~ 首次延迟半秒~
                sendMessage(s, callback);
            }, 500)
        } else {
            sendMessage(s, callback);
        }
    };

    var baseInvokeByFrames = function (method, args, callback) {
        if (typeof args === "function") {
            callback = args;
            args = {};
        }
        conn();
        if (window.console && window.console.log) {
            window.console.log("%c 调用方法" + method, 'color:#95F065;font-size:12px');
        }
        callbacks[method] = callback;
        var _data = {"_method": method};
        _data["_id"] = id++;
        args = args || {};
        _data["args"] = args;
        var s = toJson(_data);
        if (getWebSocketReadyState(ws) === 0 || getWebSocketReadyState(ws) === 3) {
            setTimeout(function () {
                //建立连接需要时间~ 首次延迟半秒~
                sendFrames(s, callback);
            }, 500)
        } else {
            sendFrames(s, callback);
        }
    };

    /**
     * 分帧传输数据
     * @param s 数据
     * @param callback 回调函数
     */
    var sendFrames = function (s, callback) {
        //校验码
        var checkCode = DIGEST.CheckCode(s);//打校验码
        //分包的组
        var guid = getGuid();
        while (blockData[guid]) {
            //存在则重新生成一个!
            guid = getGuid();
        }
        //数据分块
        var splitData = splitStrData(s);//数据切块
        //记录以备重发
        blockData[guid] = {checkcode: checkCode, totalLength: s.length, retry: 0, block: splitData};
        //传第一个包
        //报头(纯文本类型)含义
        //"BLOCKTXT"+总校验码(4字节)+块校验码(4字节)+数据总大小(16字节)+当前块大小(8字节)+是否分块/分为几块(4字节)+数据分块组号(36字节)+数据包号(4字节)+保留位(44字节),总计128字长
        //        8               12              16                 32                40                       44                   80              84            128
        var blockCheckCode = DIGEST.CheckCode(splitData[0]);
        var pakHeaser = getDataHeader(checkCode, blockCheckCode, s.length, splitData[0].length, splitData.length, guid, 0);
        var msg = pakHeaser + splitData[0];
        sendMessage(msg, callback);
    };

    /**
     * readyState->0:尚未建立连接;1:已经建立连接;2:正在关闭;3:已经关闭或不可用
     * @param thisWs
     * @returns {*}
     */
    var getWebSocketReadyState = function (thisWs) {
        var currWs = thisWs || conn();
        if (!currWs) {
            return 0;
        }
        if (currWs.readyState !== undefined) {
            return currWs.readyState;
        }
        if (currWs.getReadyState) {//IE8,IE9
            return currWs.getReadyState();
        }
        /*
         if(currWs.activeXObject){//IE8,IE9
         return currWs.activeXObject.readyState;
         }
         */
        return 0;
    };

    window.EportClient = {
        isInstalled: function (type, callback, currInstalllerUrl) {
            //这个方法最慢需要3秒钟返回信息.
            if (typeof type === "function") {
                if (callback) {
                    currInstalllerUrl = callback;
                }
                callback = type;
                type = DefaultType;
            }
            ws = conn();
            var bInstalled = getWebSocketReadyState(ws) === 1;
            var retryConut = 0;

            function retry() {
                retryConut++;
                ws = conn();
                bInstalled = getWebSocketReadyState(ws) === 1;
                if (!bInstalled) {
                    if (retryConut < 3) {
                        setTimeout(retry, 1500);
                    } else if (retryConut === 3) {
                        //改为使用iframe代替href=的方式,避免FireFox不拦截本地协议而发生页面跳转.
                        var iframeDom = document.createElement('iframe');
                        iframeDom.style.cssText = 'width:1px;height:1px;position:fixed;top:0;left:0;display:none;';
                        iframeDom.src = 'singlewindow://Restart';
                        document.body.appendChild(iframeDom);
                        setTimeout(retry, 2500);
                    }
                    else {
                        //未安装
                        var errMsg = "检测到您未安装" + type + "客户端! " + type + "下载地址为:" + currInstalllerUrl || installlerUrl || window.installlerUrl;
                        if (callback) {
                            callback({"Result": false, "Data": [], "Error": [errMsg]});
                        } else {
                            if (window.console) {
                                window.console.log(errMsg);
                            }
                            //alert(errMsg);
                        }
                    }
                } else {
                    //已经安装了
                    var okMsg = "已经安装了" + type + "客户端.";
                    if (callback) {
                        callback({"Result": true, "Data": [okMsg], "Error": []});
                    } else {
                        if (window.console) {
                            window.console.log(okMsg);
                        }
                        //alert(okMsg);
                    }
                }
            }

            retry();
            //iKeyInstalllerUrl
        },
        /**
         *
         * @param func 被执行函数
         * @param arg1
         * @param arg2
         * @param argX
         */
        isInstalledTest: function (func, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {//这里argX只多不少即可
            if (!func) {
                throw new Error("未知的JS的function,请检查调用isInstalledTest传入的第一个参数是否存在该函数.");
            }
            EportClient.isInstalled(DefaultType, function (msg) {
                if (msg.Result) {
                    if (func && (typeof func) === "function") {
                        func.call(null, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
                    } else {
                        alert(msg.Data[0]);
                    }
                } else {
                    alertErrMsg(msg);
                }
            }, installlerUrl || window.installlerUrl);
        },
     /*----------------------------------海关卡业务签名功能-----------------------------------------------------------------*/
 
        
       
        /**
         * 签名,返回PEM格式
         * @param inData 原文
         * @param passwd 卡密码
         * @param callback
         */
        cusSpcSignDataAsPEM: function (inData, passwd, callback) {
            baseInvoke("cus-sec_SpcSignDataAsPEM", (!!passwd) ? {
                "inData": inData,
                "passwd": passwd
            } : {"inData": inData}, callback);
        },
 
        
        //下面是单一窗口组件的调用接口
        swcLogin: function (passwd, callback) {
            baseInvoke("swc_security_login", {"passwd": passwd}, callback);
        },
        swcPostData: function (data, callback, method) {
            conn();
            method = (method || "swc_postdata");
            callbacks[method] = callback;
            var _data = {"_method": method};
            _data["_id"] = id++;
            if (typeof data === "object") {
                _data["args"] = toJson(data);
            } else {
                _data["args"] = data;
            }
            var s = toJson(_data);
            //2016年10月27日 分块改为顺序传输
            //校验码
            var checkCode = DIGEST.CheckCode(s);
            //分包的组
            var guid = getGuid();
            while (blockData[guid]) {
                //存在则重新生成一个!
                guid = getGuid();
            }
            //数据分块
            var splitData = splitStrData(s);
            //如果需要分包传输
            if (splitData.length > 1) {
                blockData[guid] = {checkcode: checkCode, totalLength: s.length, retry: 0, block: splitData};
            }
            //传第一个包
            //报头(纯文本类型)含义
            //"BLOCKTXT"+总校验码(4字节)+块校验码(4字节)+数据总大小(16字节)+当前块大小(8字节)+是否分块/分为几块(4字节)+数据分块组号(36字节)+数据包号(4字节)+保留位(44字节),总计128字长
            //        8               12              16                 32                40                       44                   80              84            128
            var blockCheckCode = DIGEST.CheckCode(splitData[0]);
            var pakHeaser = getDataHeader(checkCode, blockCheckCode, s.length, splitData[0].length, splitData.length, guid, 0);
            var msg = pakHeaser + splitData[0];
            sendMessage(msg);
        },
        data: function () {
        }
    };
    //单一窗口组件兼容调用..
    EportClient.data.prototype = {
        Execute: function (callback) {
            var d = toJson(this);
            EportClient.swcPostData(d, callback);
        }
    };
})(window, document, navigator);