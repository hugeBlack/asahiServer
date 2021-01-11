const { error } = require('console');
const fixedMsg = {
    NoPrmission: "Permission denied."
};
var fs = require('fs')
var ws = require("ws");
var opList = []
var appData={};
var previousPics=[];
fs.readFile("opList.json", function (error, data) {
    opList = JSON.parse(data.toString())
    fs.readFile("appdata.json", function (error, data) {
        appData = JSON.parse(data.toString())
        fs.readFile("token.json", function (error, data) {
            xpzs(data.toString());
        })
    })
})

function xpzs(token){
    console.log(opList);
    // url ws://127.0.0.1:6700
    var sock = new ws(`ws://127.0.0.1:6700?access_token=${token}`);
    sock.on("open", function () {
        console.log("connect success !!!!");
        //issue("send_private_msg",{user_id:2910255499,message:"1919810"});
    });

    sock.on("error", function (err) {
        console.log("error: ", err);
    });

    sock.on("close", function () {
        console.log("close");
    });

    sock.on("message", function (data) {
        var msgObj = JSON.parse(data);
        if (msgObj.meta_event_type != "heartbeat") {
            console.log(data);
            if (msgObj.message && msgObj.message.substr(0, 2) == "!!") {
                var cmdObj = msgObj.message.split(" ");
                switch (cmdObj[0]) {
                    case "!!echo":
                        sendMsgCmd(msgObj, cmsg(cmdObj[1]));
                        break;
                    case "!!op":
                        if (hasPermimsion(msgObj.user_id)) {
                            var newOp = parseInt(cmdObj[1])
                            if (newOp + "" == cmdObj[1]) {
                                if (hasPermimsion(newOp)) {
                                    sendMsgCmd(msgObj, cmsg(newOp + " has already been an operator."));
                                } else {
                                    opList.push(newOp);
                                    fs.writeFile("opList.json", JSON.stringify(opList), function (err) {
                                        if (!err) {
                                            sendMsgCmd(msgObj, cmsg(newOp + " has been promoted."));
                                        } else {
                                            sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
                                        }
                                    });

                                }
                            } else {
                                sendMsgCmd(msgObj, cmsg("User_id invalid."));
                            }
                            //sendMsgCmd(msgObj,cmsg("passed"));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "!!deop":
                        if (hasPermimsion(msgObj.user_id)) {
                            var newOp = parseInt(cmdObj[1])
                            if (newOp + "" == cmdObj[1]) {
                                if (!hasPermimsion(newOp)) {
                                    sendMsgCmd(msgObj, cmsg(newOp + " is not an operator."));
                                } else {
                                    opList.splice(opList.indexOf(newOp), 1);
                                    fs.writeFile("opList.json", JSON.stringify(opList), function (err) {
                                        if (!err) {
                                            sendMsgCmd(msgObj, cmsg(newOp + " has been deomoted."));
                                        } else {
                                            sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
                                        }
                                    });

                                }
                            } else {
                                sendMsgCmd(msgObj, cmsg("User_id invalid."));
                            }
                            //sendMsgCmd(msgObj,cmsg("passed"));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "!!app":
                        appCmdHandler(cmdObj, msgObj);
                        break;
                    default:
                        sendMsgCmd(msgObj, cmsg("Unknow command"));
                }
            } else {
                if(msgObj.message){appHandler(msgObj);}
            }
        }
    });
    function issue(command, args) {
        sock.send(JSON.stringify({
            action: command,
            params: args
        }
        ))
    }
    function sendMsgCmd(msgObj, msg,t) {
        if(t){
            switch(t) {
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
    function cmsg(msg) {
        return "Asahi > " + msg;
    }
    function inList(list, item) {
        try {
            list.forEach(element => {
                if (item == element) throw new error(true);
            });
        } catch (e) {
            return true;
        }
        return false;
    }
    function hasPermimsion(userId) {
        return inList(opList, userId);
    }

    function appCmdHandler(cmdObj, msgObj) {
        switch (cmdObj[1]) {
            case "remover":
                switch (cmdObj[2]) {
                    case "enable":
                        if (hasPermimsion(msgObj.user_id)) {
                            appData.status.remover = true;
                            saveAppdata();
                            sendMsgCmd(msgObj, cmsg("remover enabled."));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "disable":
                        if (hasPermimsion(msgObj.user_id)) {
                            appData.status.remover = false;
                            saveAppdata();
                            sendMsgCmd(msgObj, cmsg("remover disabled."));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "list":
                        if (hasPermimsion(msgObj.user_id)) {
                            sendMsgCmd(msgObj, cmsg(JSON.stringify(appData.data.remover.forbidlist)));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                        case "add":
                            if (hasPermimsion(msgObj.user_id)) {
                                if(cmdObj[3] && cmdObj[3]!=""){
                                    appData.data.remover.forbidlist.push(cmdObj[3]);
                                    saveAppdata();
                                    sendMsgCmd(msgObj, cmsg("Added pic "+cmdObj[3]+" to forbid list."));
                                }else{
                                    sendMsgCmd(msgObj, cmsg("Invalid pic name."));
                                }
                            } else {
                                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                            }
                            break;
                    case "remove":
                        if (hasPermimsion(msgObj.user_id)) {
                            if (cmdObj[3] && cmdObj[3] != "") {
                                if(inList(appData.data.remover.forbidlist,cmdObj[3])){
                                    appData.data.remover.forbidlist.splice(appData.data.remover.forbidlist.indexOf(cmdObj[3]),1);
                                    saveAppdata();
                                    sendMsgCmd(msgObj, cmsg("Removed pic " + cmdObj[3] + " from forbid list."));
                                }else{
                                    sendMsgCmd(msgObj, cmsg("Pic name has already been off the forbid list."));
                                }
                            }else{
                                sendMsgCmd(msgObj, cmsg("Invalid pic name."));
                            }
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                        case "get":
                            if(msgObj.message_type=="private"){
                                sendMsgCmd(msgObj, cmsg("previous 10 recorded pictures:"));
                                previousPics.forEach(function (picName) {
                                    sendMsgCmd(msgObj, `${picName}\r\n[CQ:image,file=${picName}.image]`);
                                })
                            }else{
                                sendMsgCmd(msgObj, cmsg("This subcommand can be used in private chat only."));
                            }
                        break;
                    default:
                        sendMsgCmd(msgObj, cmsg("Unknow app subcommand."));
                }
                break;
            default:
                sendMsgCmd(msgObj, cmsg("Unknow app."));
        }
    }
    function appHandler(msgObj) {
        //remover
        if (appData.status.remover) {
            var rawMsgArr = msgObj.message.split(",");
            if (rawMsgArr[0] == "[CQ:image") {
                var picName=(rawMsgArr[1].split("=")[1]).split(".")[0];
                if (appData.data.remover.forbidlist.indexOf(picName) != -1) {
                    sendMsgCmd(msgObj, cmsg("Illegal picture detected."));
                    issue("delete_msg",{message_id:msgObj.message_id})
                }
                if(previousPics.length>=10){
                    var t=previousPics;
                    previousPics=[picName];
                    previousPics.concat(t.splice(0,9));
                }else{
                    previousPics.push(picName);
                }
            }
        }
    }
    function saveAppdata(){
        fs.writeFile("appData.json", JSON.stringify(appData), function (err) {
            if (err) {
                sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
            }
        });
    }
}
