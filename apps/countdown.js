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
        case "test":
            module.exports.onSecond(new Date())
            break;
        default:
            sendMsgCmd(msgObj, cmsg(`子指令无效.`));
    }else{
        sendMsgCmd(msgObj,cmsg("该指令只可以在群聊中使用."));
    }
}
module.exports.onSecond=function(timeNow){
    timeNow.setHours(0,0,0,0);
    var tragetMap=new Map();
    appData.data.countdown.forEach(function(element){
        var daysLeft=(element.date-timeNow/1000)/86400;
        if(!tragetMap.get(element.group)){tragetMap.set(element.group,[])}
        tragetMap.get(element.group).push({name:element.name,days:daysLeft})
    })
    tragetMap.forEach(function(dayObjList,group){
        var msg="哈~早上好~今天是:";
        var dayForward=[];
        var dayNow=[];
        dayObjList.forEach(function(dayObj,index){
            if(dayObj.days>0){
                dayForward.push(dayObj)
            }else if(dayObj.days==0){
                dayNow.push(dayObj)
            }
        })
        var forwardMsg='';
        dayForward.forEach(function(dayObj,i){
            forwardMsg+=`距离${dayObj.name}还有${dayObj.days}天`;
            if(i<dayForward.length-1){
                forwardMsg+=",";
            }
        })
        var nowMsg='';
        dayNow.forEach(function(dayObj,i){
            nowMsg+=dayObj.name;
            if(i<dayNow.length-1){
                nowMsg+=",";
            }else{
                nowMsg+=",也是\r\n"
            }
        })
        msg+=nowMsg+forwardMsg+"的一天呢.";
        var msgObj={message_type:"group",group_id:group}
        sendMsgCmd(msgObj,cmsg(msg));
    })
}