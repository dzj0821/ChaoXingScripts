/**
 * 超星尔雅全自动播放视频脚本V1.0.2
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
    course_num = $(".ncells").length;
    for(var i = 0; i < course_num; i++){
        sourse_list[i] = new Array();
        //获取那个绿色小点判断是否刷完
        if($($(".ncells")[i]).children("a").children().children(".blue").length == 1){
            sourse_list[i][0] = true;
        }
        else{
            if(jump_one_task && $($(".ncells")[i]).children("a").children().children(".orange01").text() == "1"){
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
            $("span[title='视频']").click();
            setTimeout(function(){
                if($("iframe").contents().find(".ans-job-finished").length != 0){
                    //这个视频刷过了，下一个
                    console.log("这个视频刷过了，跳过");
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
            console.log("这个章节没有视频，跳过");
            sourse_list[play_num][0] = true;
            play_next();
        }
    }, wait_time);
}

function play_media(){
    console.log("开始播放视频");
    if(media_muted){
        $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0].muted = true;
    }
    if(use_external_network){
        $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0].src = $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0].src.replace(internal_server_ip, "");
    }
    var interval = setInterval(function(){
        var player = $("iframe").contents().find("iframe").contents().find('video#video_html5_api')[0];
        if(player == undefined){
            return;
        }
        if(player.ended){
            sourse_list[play_num][0] = true;
            clearInterval(interval);
            play_next();
            return;
        }
        if(player.paused){
            if(use_external_network && player.src != player.src.replace(internal_server_ip, "")){
                player.src = player.src.replace(internal_server_ip, "");
            }
            player.play();
        }
    }, check_time);
}

get_course_list();
play_next();
