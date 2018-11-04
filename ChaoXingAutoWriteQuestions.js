// ==UserScript==
// @name         ChaoXingAutoWriteQuestions
// @namespace    dzj0821
// @version      1.0
// @description  超星尔雅全自动查题写题脚本
// @author       dzj0821
// @match        *://*.chaoxing.com/mycourse/studentstudy*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @url          https://github.com/dzj0821/ChaoXingAutoPlayVideo
// @require      https://code.jquery.com/jquery-latest.js
// ==/UserScript==

/**
 * 超星尔雅全自动查题写题脚本V.0.0
 * 版权声明及脚本更新见：https://github.com/dzj0821/ChaoXingAutoPlayVideo
 * 功能：全自动答题，答案从https://www.zhengjie.com 搜索得出，正确率很高，自动答下一章题目
 * 注意：由于需要跨域访问其他网站搜索答案，所以需要GM_xmlhttpRequest权限，警告时选择允许域名即可。
 * 初次使用时：请根据自身情况调整配置信息内容
 * 使用说明：在油猴菜单点 开始自动答题 即可。
 */
//配置信息开始，使用按需修改
//每隔多少毫秒答一次题（最少5分钟）
var check_time = 5 * 60 * 1000;
//页面跳转时多少毫秒后继续执行脚本（页面完全加载的时间，设置过小脚本会出错）
var wait_time = 3000;
//每道题查询间隔多少毫秒，过低可能会查询异常
var search_wait_time = 1000;
//指定从第几章开始刷（从0开始）
var play_num = 0;
//是否只检查任务数为1的章节
var only_check_one_task = true;
//配置信息结束

var course_num = 0;
var sourse_list = new Array();
function get_course_list(){
    course_num = $(".ncells").length;
    for(var i = 0; i < course_num; i++){
        sourse_list[i] = new Array();
        //获取那个绿色小点判断是否刷完
        if($($(".ncells")[i]).children("a").children().children(".blue").length == 1){
            sourse_list[i][0] = true;
        }
        else{
            if(only_check_one_task && $($(".ncells")[i]).children("a").children().children(".orange01").text() != "1"){
                sourse_list[i][0] = true;
            }
            else{
                sourse_list[i][0] = false;
            }
        }
        sourse_list[i][1] = $($(".ncells")[i]).children("a")[0];
    }
}

function find_next(){
    for(var i = play_num; i <= course_num; i++){
        if(i == course_num){
            return false;
        }
        if(!sourse_list[i][0]){
            play_num = i;
            return true;
        }
        
    }
}

function write_next(){
    if(!find_next()){
        alert("所有课程都刷完了！");
        return;
    }
    console.log("检查第" + play_num +"个章节");
    sourse_list[play_num][1].click();
    setTimeout(function(){
        //寻找在不在其他标签页下
        if($("span[title='章节测验']").length != 0){
            $("span[title='章节测验']").click();
            setTimeout(function(){
                if($("iframe").contents().find(".ans-job-finished").length != 0){
                    //这个视频刷过了，下一个
                    console.log("这个题目刷过了，跳过");
                    sourse_list[play_num][0] = true;
                    write_next();
                }
                else{
                    write_questions();
                }
            }, wait_time);
        }
        else{
            //就是没有，下一个
            console.log("这个章节没有视频，跳过");
            sourse_list[play_num][0] = true;
            write_next();
        }
    }, wait_time);
}

function write_questions(){
    console.log("开始刷题");
    var questions_frame = $("iframe").contents().find("iframe").contents().find("iframe").contents();
    var questions_id = new Array();
    var questions_types = new Array();
    var form_array = questions_frame.find('form').serializeArray();
    //获取所有题目id和类型
    for(var i = 0; i < form_array.length; i++){
        if(form_array[i].name.indexOf("answertype") != -1){
            questions_id[questions_id.length] = form_array[i].name.replace("type", "");
            questions_types[questions_types.length] = form_array[i].value;
        }
    }
    //获取所有题目标题
    var question_text = new Array();
    var temp = questions_frame.find("i.fl").parent().children('div');
    for(var i = 0; i < temp.length; i++){
        question_text[i] = $(temp[i]).text();
    }
    //验证一下
    if(questions_types.length != question_text.length){
        alert("存在未检测到的题目，可能是有题型未录入，请联系作者！");
        throw new Error("存在未检测到的题目，可能是有题型未录入，请联系作者！");
    }
    //获取所有题目选项
    var questions_options = new Array();
    for(var i = 0; i < questions_types.length; i++){
        questions_options[i] = new Array();
        var temp = questions_frame.find("input[name='" + questions_id[i] +"']");
        switch(questions_types[i]){
            //单选
            case "0":
                for(var j = 0; j < temp.length; j++){
                    questions_options[i][j] = new Array();
                    //button存input按钮方便后面点击
                    questions_options[i][j]['button'] = $(temp[j]);
                    //text存选项文字，格式如A. 选项1
                    questions_options[i][j]['text'] = $(temp[j]).val() + ". " + $(temp.parent().parent().children("a")[j]).text();
                }
                break;
            //对错
            case "3":
                questions_options[i][0] = new Array();
                questions_options[i][0]['button'] = $(temp[0]);
                questions_options[i][0]['text'] = "√";
                questions_options[i][1] = new Array();
                questions_options[i][1]['button'] = $(temp[1]);
                questions_options[i][1]['text'] = "×";
                break;
            default:
                alert("存在无法识别的题型，请联系作者！");
                throw new Error("存在无法识别的题型，请联系作者！");
        }
    }
    //针对每个题目获取答案
    for(var i = 0; i < question_text.length; i++){
        setTimeout(function(j){
            GM_xmlhttpRequest({
                method: "GET",
                url : "http://www.zhengjie.com/s?type=question&q=" + question_text[j],
                onload : function (response) {
                   var search_html = $(response.responseText);
                   var answer_list = search_html.find("li.resource.question");
                   if(answer_list.length == 0){
                       console.log("未查询到结果，可能出现异常");
                       return;
                   }

                   GM_xmlhttpRequest({
                    method: "GET",
                    url : "http://www.zhengjie.com/" + $(answer_list.children("a")[0]).attr("href"),
                    onload : function (response) {
                        var answer_html = $(response.responseText);
                        var result = $(answer_html.find(".resource.answer").find(".resource_content.long").children()[1]).text();
                        console.log(result);
                        var result_index = 0;
                        var result_sim = 0;
                        //找到相似度最高的
                        for(var k = 0; k < questions_options[j].length; k++){
                            var sim = string_same(questions_options[j][k]['text'], result);
                            if(result_sim < sim){
                                result_sim = sim;
                                result_index = k;
                            }
                        }
                        questions_options[j][result_index]['button'].click();
                    }
                });
              }
           });
        }, i * search_wait_time, i);
    }
    //等待查询结束再执行
    setTimeout(function(){
        if(form_array.length + question_text.length != questions_frame.find('form').serializeArray().length){
            alert("未知原因题目未答完！");
            throw new Error("未知原因题目未答完！");
        }
        var temp = questions_frame.find("span[title]");
        for(var q = 0; q < temp.length; q++){
            var temp_elm = $(temp[q]);
            if(temp_elm.text() == "提交作业"){
                temp_elm.click();
                setTimeout(function(){
                    if($("AlertCon02").length != 0 || questions_frame.find("#confirmSubWin").css("display") != "block"){
                        alert("疑似出现验证码，脚本停止运行！请尝试调高check_time数值");
                        throw new Error("疑似出现验证码，脚本停止运行！请尝试调高check_time数值");
                    }
                    questions_frame.find("a[onclick='form1submit();']").click();
                    setTimeout(function(){
                        sourse_list[play_num][0] = true;
                        write_next();
                    }, check_time);
                }, wait_time);
                return;
            }
        }
    }, i * search_wait_time + wait_time);
}

function string_same(str1, str2){
    //计算两个字符串的长度。  
    var len1 = str1.length,
        len2 = str2.length,
        dif = [],//建立上面说的数组，比字符长度大一个空间
        temp,i,j,a;
    //赋初值，步骤B
    for (a = 0; a <= len1; a++) {
        dif[a] = [];
        dif[a][0] = a;
    }
    for (a = 0; a <= len2; a++) {
        dif[0][a] = a;
    }
    //计算两个字符是否一样，计算左上的值
    //var temp;
    for (i = 1; i <= len1; i++) {
        for (j = 1; j <= len2; j++) {
            if (str1[i - 1] == str2[j - 1]) {
                temp = 0;
            } else {
                temp = 1;
            }
            dif[i][j] = Math.min(dif[i - 1][j - 1] + temp,dif[i][j - 1] + 1,dif[i - 1][j] + 1);
        }
    }
    //console.log("差异步骤：" + dif[len1][len2]);
    //计算相似度
    //var similarity = 1 - dif[len1][len2] / Math.max(str1.length, str2.length);
    return 1 - dif[len1][len2] / Math.max(len1, len2);
}



function start(){
    get_course_list();
    write_next();
}

GM_registerMenuCommand("开始自动答题", start, null);