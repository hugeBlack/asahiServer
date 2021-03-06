var fs = require('fs')
global.sendMsgCmd = function (msgObj, msg, t) {
    if (t) {
        switch (t) {
            case "p":
                issue("send_private_msg", { user_id: msgObj.sender.user_id, message: msg });
                break;
            case "g":
                issue("send_group_msg", { group_id: msgObj.group_id, message: msg });
        }
        return;
    }
    switch (msgObj.message_type) {
        case "private":
            issue("send_private_msg", { user_id: msgObj.sender.user_id, message: msg });
            break;
        case "group":
            issue("send_group_msg", { group_id: msgObj.group_id, message: msg });
    }
}
global.cmsg = function (msg) {
    return "Asahi > " + msg;
}
global.inList = function (list, item) {
    try {
        list.forEach(function(element,i){
            if (item == element) throw new i;
        });
    } catch (e) {
        return e;
    }
    return false;
}
global.hasPermimsion = function (userId) {
    return inList(opList, userId);
}
global.issue = function (command, args) {
    sock.send(JSON.stringify({
        action: command,
        params: args
    }
    ))
}
global.saveAppdata=function(){
    fs.writeFile("appData.json", JSON.stringify(appData), function (err) {
        if (err) {
            sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
        }
    });
}
global.errorlog=function(log){
    issue("send_private_msg", { user_id: opList[0], message: "Asahi > "+log });
}

global.readCqMsg=function(cqMsg){
    var msgList=cqMsg.split(/,/g);
    var first = true
    var returnObj={type:msgList[0].substring(4),data:new Map()};
    for(d in msgList){
        if(first){
            first=false;
            continue;
        }
        a=msgList[d].split(/=/g);
        returnObj.data.set(a[0],d==msgList.length-1?a[1].substring(0,a[1].length-1):a[1]);
    }
    return returnObj;
}