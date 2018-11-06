/**
 * 超星尔雅全自动播放视频脚本V1.0.3
 * 版权声明及脚本更新见：https://github.com/dzj0821/ChaoXingAutoPlayVideo
 * 功能：全自动后台播放视频（暂不支持一个页面多个视频的情况），自动跳过答题，自动跳过章节测验（只是跳过，还需要手动回答）
 * 初次使用时：请根据自身情况调整配置信息内容
 * 使用方法：在非IE浏览器上按F12打开控制台（Console），将此脚本所有内容粘贴上去按回车即可。
 */
//配置信息开始，使用按需修改
//播放公网视频（非校园网设置），如需要播放校园网视频将true改成false
var use_external_network = true;
//视频是否静音
var media_muted = true;
//每隔多少毫秒检查一次播放状态
var check_time = 1000;
//页面跳转时多少毫秒后继续执行脚本（页面完全加载的时间，设置过小脚本出出错）
var wait_time = 3000;
//指定从第几个视频开始刷（从0开始）
var play_num = 0;
//如果一个页面剩余任务数为1，是否跳过（比如只剩章节测验没做），开启后可减少无意义页面跳转次数，但可能漏看视频
var jump_one_task = true;
//校园网超星服务器域名IP（如：127.0.0.1/）
var internal_server_ip = "127.0.0.1/"
//配置信息结束

var course_num = 0;
var sourse_list = new Array();
function get_course_list(){
    var pattern = /https?:\/\/\S+?.chaoxing.com\/mycourse\/studentstudy\S+?/
    var url = window.location.href; 
    if(!pattern.test(url)){
        alert("运行网页地址格式有误！");
        throw new Error("运行网页地址格式有误！");
    }
    course_num = $(".ncells").length;
    if(course_num == 0){
        alert("无法获取课程列表！");
        throw new Error("无法获取课程列表！");
    }
    for(var i = 0; i < course_num; i++){
        sourse_list[i] = new Array();
        //获取那个绿色小点判断是否刷完
        if($($(".ncells")[i]).children("a").children().children(".blue").length == 1){
            sourse_list[i][0] = true;
            console.log("第" + i + "个章节的状态为：已完成")
        }
        else{
            var task_num = $($(".ncells")[i]).children("a").children().children(".orange01").text();
            if(jump_one_task && task_num == "1"){
                sourse_list[i][0] = true;
                console.log("第" + i + "个章节的任务数为：1， 但因为开启了jump_one_task选项被跳过了");
            }
            else{
                console.log("第" + i + "个章节的任务数为：" + task_num + "，等待播放");
                sourse_list[i][0] = false;
            }
        }
        //保存a标签，方便后续点击
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

function play_next(){
    if(!find_next()){
        alert("所有课程都刷完了！");
        return;
    }
    console.log("检查第" + play_num +"个章节");
    sourse_list[play_num][1].click();
    setTimeout(function(){
        //寻找在不在其他标签页下
        if($("span[title='视频']").length != 0){
            console.log("找到视频标签页，模拟点击...");
            $("span[title='视频']").click();
            setTimeout(function(){
                if($("iframe").contents().find(".ans-job-finished").length != 0){
                    //这个视频刷过了，下一个
                    console.log("检测到任务完成标记，跳过");
                    sourse_list[play_num][0] = true;
                    play_next();
                }
                else{
                    play_media();
                }
            }, wait_time);
        }
        else{
            //就是没有，下一个
            console.log("未找到视频标签页，跳过");
            sourse_list[play_num][0] = true;
            play_next();
        }
    }, wait_time);
}

function play_media(){
    console.log("开始播放视频");
    var player = $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0];
    if(player == undefined){
        alert("脚本未获取到H5播放器，可能是因为您的课程暂未使用新版播放器...");
        throw new Error("脚本未获取到H5播放器，可能是因为您的课程暂未使用新版播放器...");
    }
    if(media_muted){
        console.log("由于开启了media_muted选项，视频被设置为静音状态");
        player.muted = true;
    }
    if(use_external_network){
        console.log("由于开启了use_external_network选项，视频url被替换为公网url");
        player.src = player.src.replace(internal_server_ip, "");
        var ip_pattern = /(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)\.(25[0-5]|2[0-4]\d|[0-1]\d{2}|[1-9]?\d)/
        if(ip_pattern.test(player.src)){
            console.warn("视频url似乎并仍然为内网url，可能是因为internal_server_ip选项配置错误？如果脚本正常运行请忽略此警告，如果无法播放视频请将internal_server_ip选项配置为下面地址的ip部分：" + player.src);
        }
    }
    //不使用回调函数而使用interval，防止被超星尔雅检测
    var interval = setInterval(function(){
        var player = $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0];
        if(player.ended){
            console.log("检测到视频播放结束");
            sourse_list[play_num][0] = true;
            clearInterval(interval);
            play_next();
            return;
        }
        if(player.paused){
            console.log("检测到视频暂停了，继续播放");
            //有时第一次替换地址不生效，如果地址不对再次替换
            if(use_external_network && player.src != player.src.replace(internal_server_ip, "")){
                player.src = player.src.replace(internal_server_ip, "");
            }
            player.play();
        }
    }, check_time);
}

//执行脚本
get_course_list();
play_next();
