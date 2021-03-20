module.exports.onCmd= function(msgObj,cmdObj){
    var c = 0;
    if(cmdObj[2]){
        if(isNaN(c)){
            c = parseInt(cmdObj[2])-1;
        }else{
            for(img in flashImgList){
                if(flashImgList[img]==cmdObj[2]){
                    c=img;
                }else{
                    c=-1
                }
            }
        }
        
    }
    if(c<=4 && c>=0 && flashImgList[c]){
        sendMsgCmd(msgObj, cmsg(`闪照:${flashImgList[c]}:\r\n[CQ:image,file=${flashImgList[c]}]`));
    }else{
        sendMsgCmd(msgObj, cmsg("图片索引无效."));
    }
}

module.exports.onMsg= function(msgObj){
    var msgObj= readCqMsg(msgObj.message)
    if(msgObj.type=="image"&&msgObj.data.get("type")=="flash"){
        sendMsgCmd(msgObj, cmsg(`索引:${msgObj.data.get("file")}`));
        addNew(msgObj.data.get("file"));
    }
}

var flashImgList=[];
function addNew(img){
    if(flashImgList.length>5){
        flashImgList.splice(0,1);
    }
    flashImgList=[img].concat(flashImgList);
}