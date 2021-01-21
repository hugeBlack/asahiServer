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
            if (item == element) throw new error(i);
        });
    } catch (e) {
        return i.message;
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