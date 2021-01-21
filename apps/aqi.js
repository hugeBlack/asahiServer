var xml2js = require('xml2js');
var http = require('http');
var xmlParser = new xml2js.Parser({ explicitArray: false });
module.exports.onCmd = function (msgObj) {
    sendMsgCmd(msgObj, cmsg(fixedMsg.pleaseWait));
    http.get("http://www.stateair.net/web/post/1/4a.xml", function (data) {
        var str = "";
        data.on("data", function (chunk) {
            str += chunk;//监听数据响应，拼接数据片段
        })
        data.on("end", function () {
            xmlParser.parseString(str.toString(), function (error, aqiObj) {
                var aqiValue = aqiObj.chart.dataset[1].set[23].$.value;
                sendMsgCmd(msgObj, cmsg(`完成! 最新的${aqiObj.chart.datetime.$.latestvalue}的AQI是${aqiValue},也就是${AQIMeanings(aqiValue)}. 数据来源于美国驻上海总领事馆.`));
                function AQIMeanings(aqiValue) {
                    if (aqiValue <= 50) { return "一级（优）" }
                    if (aqiValue <= 100) { return "二级（良）" }
                    if (aqiValue <= 150) { return "三级（轻度污染）" }
                    if (aqiValue <= 200) { return "四级（中度污染）" }
                    if (aqiValue <= 300) { return "五级（重度污染）" }
                    return "六级（严重污染）";
                }
            })


        })
    })
}