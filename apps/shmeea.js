var http = require('http');
var subscribeList = []
module.exports.onCmd = function (msgObj, cmdObj) {
    switch (cmdObj[2]) {
        case "subscribe":
            subscribeList.push(msgObj);
            sendMsgCmd(msgObj, cmsg(`订阅成功`));
            break;
        case "unsubscribe":
            var succcess = false;
            try {
                subscribeList.forEach((value, index) => {
                    switch (msgObj.message_type) {
                        case "private":
                            if (value.sender.user_id == msgObj.sender.user_id) {
                                subscribeList.splice(index, 1);
                                sendMsgCmd(msgObj, cmsg(`取消订阅成功`));
                                succcess = true
                                throw "nmsl"
                            }
                            break;
                        case "group":
                            if (value.group_id == msgObj.group_id) {
                                subscribeList.splice(index, 1);
                                sendMsgCmd(msgObj, cmsg(`取消订阅成功`));
                                succcess = true;
                                throw "nmsl";
                            }
                            break;
                    }
                })
            } catch (e) { }
            if (!succcess) {
                sendMsgCmd(msgObj, cmsg(`取消订阅失败`));
            }
            break;
        case "lookup":
            check(true, msgObj);
            break;
        default:
            sendMsgCmd(msgObj, cmsg(`子指令无效.`));
    }
}
module.exports.onInterval = function () {
    check(false);
}
var today = 0;
var checked = false;
function check(forceCheck, msgObj) {
    var timeNow = new Date();
    if (today != timeNow.getDate()) {
        today = timeNow.getDate();
        checked = false;
    }
    var address = `http://202.121.151.68/page/24300/${timeNow.getFullYear()}${timeNow.getMonth()+1 > 10 ?(timeNow.getMonth()+1) : "0" + (timeNow.getMonth()+1)}${timeNow.getDate() > 10 ?timeNow.getDate() : "0" + timeNow.getDate()}`
    http.get(address, function (data) {
        var str = "";
        data.on("data", function (chunk) {
            str += chunk;
        })
        data.on("end", function () {
            if (str.indexOf("404") == -1) {
                if(forceCheck){
                    sendMsgCmd(msgObj, cmsg(`考试院有动静了！http://www.shmeea.edu.cn/page/24300`));
                }
                if(!checked){
                    subscribeList.forEach((value) => {
                    sendMsgCmd(value, cmsg(`考试院有动静了！http://www.shmeea.edu.cn/page/24300`));
                })
                }
                checked = true;
            } else {
                if (forceCheck) {
                    sendMsgCmd(msgObj, cmsg(`考试院还没什么动静.`));
                }
            }
        })
    }).on("error", (e) => {
        console.log(`获取数据失败: ${e.message}`)
    })
}
