module.exports.onCmd=function(msgObj,cmdObj){
    if(msgObj.message_type=="group")
    switch(cmdObj[2]){
        case "add":
            if(cmdObj[4]&&cmdObj[3]&&cmdObj[4]!=""&&cmdObj[3]!=""){
                if(!appData.data.countdown){appData.data.countdown=[]}
                var targetTime=new Date();
                var date = cmdObj[4].split("/");
                try{
                    targetTime.setFullYear(date[0],date[1]-1,date[2]);
                    targetTime.setHours(0,0,0,0);
                }catch(e){
                    sendMsgCmd(msgObj,cmsg("日期格式错误,请使用YYYY/MM/DD."));
                    return;
                }
                var dateObj={name:cmdObj[3],date:parseInt(targetTime/1000),group:msgObj.group_id}
                if(inList(appData.data.countdown,dateObj)){
                    sendMsgCmd(msgObj,cmsg(`该目标日已存在.`));
                    return;
                }
                appData.data.countdown.push(dateObj)
                saveAppdata();
                sendMsgCmd(msgObj,cmsg(`已移添加目标日 ${cmdObj[3]}.`));
            }
            break;
        case "remove":
            var i =false;
            try{
                appData.data.countdown.forEach(function(element,index) {
                    if(element.name==cmdObj[3] && element.group==msgObj.group_id){throw index}
                });
            }catch(e){
                i=e;
            }
            if(i!==false){
                appData.data.countdown.splice(i,1);
                sendMsgCmd(msgObj,cmsg(`已移除目标日 ${cmdObj[3]}.`));
                saveAppdata();
            }else{
                sendMsgCmd(msgObj, cmsg(`目标日 ${cmdObj[3]} 不存在.`));
            }
            break;
        case "list":
            var i = inList(appData.data.countdown, cmdObj[3])
            if (i) {
                appData.data.countdown.splice(i, 1);
                sendMsgCmd(msgObj, cmsg(`已移除目标日 ${cmdObj[3]}.`));
                saveAppdata();
            }
            break;
        default:
            sendMsgCmd(msgObj, cmsg(`子指令无效.`));
    }else{
        sendMsgCmd(msgObj,cmsg("该指令只可以在群聊中使用."));
    }
}
module.exports.onSecond=function(timeNow){
    timeNow.setHours(0,0,0,0);
    appData.data.countdown.forEach(function(element){
        var daysLeft=(element.date-timeNow/1000)/86400;
        var msgObj={message_type:"group",group_id:element.group}
        if(daysLeft>0){
            sendMsgCmd(msgObj, cmsg(`哈~早上好~今天是距离${element.name}还有${daysLeft}天的一天呢.`));
        }
    })
}