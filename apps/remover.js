var previousPics=[];
var lastMsg=new Map();
var http = require('http');
module.exports.onCmd = function (cmdObj, msgObj) {
    switch (cmdObj[2]) {
        case "enable":
            if (hasPermimsion(msgObj.user_id)) {
                appData.status.remover = true;
                saveAppdata();
                sendMsgCmd(msgObj, cmsg("remover已启用."));
            } else {
                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
            }
            break;
        case "disable":
            if (hasPermimsion(msgObj.user_id)) {
                appData.status.remover = false;
                saveAppdata();
                sendMsgCmd(msgObj, cmsg("remover已禁用."));
            } else {
                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
            }
            break;
        case "list":
            if (hasPermimsion(msgObj.user_id)) {
                sendMsgCmd(msgObj, cmsg(`Asahi正在监视以下${appData.data.remover.forbidlist.length}个图片:`+JSON.stringify(appData.data.remover.forbidlist)));
            } else {
                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
            }
            break;
        case "add":
            if (hasPermimsion(msgObj.user_id)) {
                if (cmdObj[3] && cmdObj[3] != "") {
                    if(!inList(appData.data.remover.forbidlist,cmdObj[3])){
                        appData.data.remover.forbidlist.push(cmdObj[3]);
                        saveAppdata();
                        sendMsgCmd(msgObj, cmsg("已将图片" + cmdObj[3] + "加入屏蔽列表."));
                        previousPics.forEach(function (pic) {
                            if (cmdObj[3] == pic.name) {
                                sendMsgCmd(msgObj, cmsg(fixedMsg.illegalFL));
                                issue("delete_msg", { message_id: pic.id })
                            }
                        })
                    }else{
                        sendMsgCmd(msgObj, cmsg("这张图片已经在屏蔽列表中了."));
                    }
                    
                }else if(!cmdObj[3] && lastMsg.get(msgObj.user_id) && Date.parse(new Date())/1000-lastMsg.get(msgObj.user_id).time<=60){
                    http.get(`http://127.0.0.1:5700/get_forward_msg?access_token=${token}&message_id=${lastMsg.get(msgObj.user_id).id}`, function (data) {
                        var str = "";
                        data.on("data", function (chunk) {
                            str += chunk;//监听数据响应，拼接数据片段
                        })
                        data.on("end", function () {
                            var forwardObj=JSON.parse(str);
                            if(forwardObj.retcode==0){
                                forwardObj.data.messages.forEach(function(submsgObj){
                                    var rawMsgArr = submsgObj.content.split(",");
                                    if (rawMsgArr[0] == "[CQ:image") {
                                        var picName = (rawMsgArr[1].split("=")[1]).split(".")[0];
                                        if(!inList(appData.data.remover.forbidlist,picName)){
                                            appData.data.remover.forbidlist.push(picName);
                                            sendMsgCmd(msgObj, cmsg("将图片" + picName + "加入屏蔽列表."));
                                            previousPics.forEach(function (pic) {
                                                if (cmdObj[3] == pic.name) {
                                                    sendMsgCmd(msgObj, cmsg(fixedMsg.illegalFL));
                                                    issue("delete_msg", { message_id: pic.id })
                                                }
                                            })
                                            
                                        }
                                    }
                                })
                                saveAppdata();
                            }
                            
                        })
                    })
                }else{
                    sendMsgCmd(msgObj, cmsg("图片名无效或无一分钟内合并转发消息."));
                }
            } else {
                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
            }
            break;
        case "remove":
            if (hasPermimsion(msgObj.user_id)) {
                if (cmdObj[3] && cmdObj[3] != "") {
                    if (inList(appData.data.remover.forbidlist, cmdObj[3])) {
                        appData.data.remover.forbidlist.splice(appData.data.remover.forbidlist.indexOf(cmdObj[3]), 1);
                        saveAppdata();
                        sendMsgCmd(msgObj, cmsg("已将图片" + cmdObj[3] + "移出屏蔽列表."));
                    } else {
                        sendMsgCmd(msgObj, cmsg("该图片并不在屏蔽列表中."));
                    }
                } else {
                    sendMsgCmd(msgObj, cmsg("图片名无效."));
                }
            } else {
                sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
            }
            break;
        case "get":
            if (msgObj.message_type == "private") {
                sendMsgCmd(msgObj, cmsg("最近15张记录到的图片:"));
                previousPics.forEach(function (pic) {
                    sendMsgCmd(msgObj, `${pic.name}\r\n[CQ:image,file=${pic.name}.image]`);
                })
            } else {
                sendMsgCmd(msgObj, cmsg("该子指令只能在私聊时使用."));
            }
            break;
        default:
            sendMsgCmd(msgObj, cmsg("未知子指令."));
    }
}
module.exports.onMsg = function (msgObj) {
    var rawMsgArr = msgObj.message.split(",");
    if (rawMsgArr[0] == "[CQ:image") {
        var picName = (rawMsgArr[1].split("=")[1]).split(".")[0];
        var picUrl = (rawMsgArr[2].split("=")[1]);
        if (appData.data.remover.forbidlist.indexOf(picName) != -1) {
            sendMsgCmd(msgObj, cmsg(fixedMsg.illegalFL));
            issue("delete_msg", { message_id: msgObj.message_id })
        } else {
            var reg = new RegExp('/', "g")
            var req=http.get("http://127.0.0.1:5000/fr/" + picUrl.replace(reg, "!"), function (data) {
                var str = "";
                data.on("data", function (chunk) {
                    str += chunk;//监听数据响应，拼接数据片段
                })
                data.on("end", function () {
                    if (str == "true") {
                        sendMsgCmd(msgObj, cmsg("检测到非法图片(FR)."));
                        issue("delete_msg", { message_id: msgObj.message_id })
                        appData.data.remover.forbidlist.push(picName);
                        saveAppdata();
                    }
                })
            })
            req.on("error",function(e){
                    errorlog(e)
            })
        }
        if (previousPics.length >= 15) {
            var t = previousPics;
            previousPics = [{ name: picName, id: msgObj.message_id }];
            previousPics.concat(t.splice(0, 9));
        } else {
            previousPics.push({ name: picName, id: msgObj.message_id });
        }
    } else if (rawMsgArr[0] == "[CQ:forward" && msgObj.message_type == "private") {
        var forwardId = (rawMsgArr[1].split("=")[1]).split("]")[0];
        lastMsg.set(msgObj.user_id, { id: forwardId, time: msgObj.time })
        console.warn(forwardId)
    }
}