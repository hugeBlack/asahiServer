var debug=false;
var debugToken="";
global.fixedMsg = {
    NoPrmission: "权限不足.",
    pleaseWait:"请稍后...",
    illegalFL:"检测到非法图片(FL)."
};
const fs = require('fs')
const ws = require("ws");
const readline = require('readline')
const apps ={ 
    remover:require('./apps/remover'),
    aqi:require('./apps/aqi'),
    countdown:require('./apps/countdown')
}
const general = require('./apps/general');
global.opList = []
global.appData={};
global.runtime=0;
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
fs.readFile("opList.json", function (error, data) {
    if(data){opList = JSON.parse(data.toString())}
    fs.readFile("appdata.json", function (error, data) {
        if(data){appData = JSON.parse(data.toString())}
        rl.question("Input accessToken:",function(ans){
            if(debug){
                console.log("Using debugToken, please make sure to remove it before release.")
                global.token=debugToken;
            }else{
                global.token=ans;
                process.stdout.write('\033[0f');
            }
            asahi(token);
        })
    })        
})
function asahi(token){
    console.log("Op List: "+opList);
    global.sock = new ws(`ws://127.0.0.1:6700?access_token=${token}`); 
    sock.on("open", function () {
        console.log("connect success !");
    });

    sock.on("error", function (err) {
        console.log("error: ", err);
        console.error("connect failed: Did you input the right accessToken? Or, did you start CQ?");
    });

    sock.on("close", function () {
        console.log("close");
        process.exit(1);
    });

    sock.on("message", function (data) {
        var msgObj = JSON.parse(data);
        if (msgObj.meta_event_type != "heartbeat") {
            if(debug){
                console.log(data);
            }else{
                if(msgObj.user_id&&msgObj.sender){
                    console.log(`${msgObj.user_id}(${msgObj.sender.nickname}) in ${msgObj.group_id} : ${msgObj.message}`);
                }
            }
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
                                    sendMsgCmd(msgObj, cmsg(newOp + "已经是管理员了."));
                                } else {
                                    opList.push(newOp);
                                    fs.writeFile("opList.json", JSON.stringify(opList), function (err) {
                                        if (!err) {
                                            sendMsgCmd(msgObj, cmsg(newOp + "被提升了."));
                                        } else {
                                            sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
                                        }
                                    });

                                }
                            } else {
                                sendMsgCmd(msgObj, cmsg("QQ号无效."));
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
                                    sendMsgCmd(msgObj, cmsg(newOp + "并不是不是管理员."));
                                } else {
                                    opList.splice(opList.indexOf(newOp), 1);
                                    fs.writeFile("opList.json", JSON.stringify(opList), function (err) {
                                        if (!err) {
                                            sendMsgCmd(msgObj, cmsg(newOp + "被降级了."));
                                        } else {
                                            sendMsgCmd(msgObj, cmsg("There's sth wrong with fs."));
                                        }
                                    });

                                }
                            } else {
                                sendMsgCmd(msgObj, cmsg("QQ号无效."));
                            }
                            //sendMsgCmd(msgObj,cmsg("passed"));
                        } else {
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "!!app":
                        appCmdHandler(cmdObj, msgObj);
                        break;
                    case "!!reload":
                        if (hasPermimsion(msgObj.user_id)) {
                            fs.readFile("appdata.json", function (error, data) {
                                appData = JSON.parse(data.toString());
                                sendMsgCmd(msgObj,cmsg("重新加载完成"));
                            })
                        }else{
                            sendMsgCmd(msgObj, cmsg(fixedMsg.NoPrmission));
                        }
                        break;
                    case "!!status":
                        var t=runtime
                        var day =Math.floor(t/86400);
                        t=t % 86400
                        var hour = Math.floor(t/3600);
                        t=t%3600;
                        var min = Math.floor(t/60);
                        var second = t%60;
                        sendMsgCmd(msgObj, cmsg(`Asahi已经运行了${day!=0?day+"天":""}${hour!=0?hour+"小时":""}${min!=0?min+"分钟":""}${second}秒.`));
                        break;
                    default:
                        sendMsgCmd(msgObj, cmsg("未知指令"));
                }
            } else {
                if(msgObj.message){appHandler(msgObj);}
            }
        }
    });

    function appCmdHandler(cmdObj, msgObj) {
        switch (cmdObj[1]) {
            case "remover":
                apps.remover.onCmd(cmdObj,msgObj);
                break;
            case "aqi":
                apps.aqi.onCmd(msgObj);
                break;
            case "countdown":
                apps.countdown.onCmd(msgObj,cmdObj);
                break;
            default:
                sendMsgCmd(msgObj, cmsg("未知app."));
        }
    }
    function appHandler(msgObj) {
        //remover
        if (appData.status.remover) {
            apps.remover.onMsg(msgObj);
        }
    }
    var timer=setInterval(
        function(){
            runtime++;
            var timeNow=new Date();
            if(appData.status.remover&& timeNow.getHours()==6&&timeNow.getMinutes()==30&&timeNow.getSeconds()==0){
                apps.countdown.onSecond(timeNow);
            }
        },1000)
    
}
