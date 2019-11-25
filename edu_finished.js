// ==UserScript==
// @name        完成学习 - gzmtr.cc
// @namespace   Violentmonkey Scripts
// @match       http://edu.gzmtr.cc/*
// @grant       none
// @version     1.0
// @author      -
// @description 2019/11/22 下午10:11:01
// // @webRequest [{"selector":"http://*.gzmtr.cc/web/script/ocs/*","action":"cancel"}]
// ==/UserScript==

// _self.sewise_player.duration()

unsafeWindow.trainProjectDetailController = (function(){
	pageview = {
		"pageName":"pc-page-trainProject",
		"className":"trainProjectDetail",
		"trainProjectId":GetQueryString("trainProjectId"),
		"coursewareList":[],
        "projectMust":null,
        "projectSelect":null,
        "sewise_player":null,
        "limitRecords":true //限制添加学习记录请求次数
	}
	var _ocsServer = null;
    var _examServer = null;
    var _voteServer = null;
    function initSize(box) { //重置高度
        $(box || '.scroll-box').niceScroll().resize();
    };

	/*
	*加载数据
	*/
	pageview.loadData = function(){
		var _self = pageview;
        logUtil.logMethodCalled("loadData" ,_self.className);
		_self.loadTrainProjectDetail();

	}

	/*
	*加载详情数据
	*/
	pageview.loadTrainProjectDetail = function(){
		var _self = pageview;
        logUtil.logMethodCalled("loadTrainProjectDetail" ,_self.className);
		_self.loadProjectDetailData();//加载详情数据
        _self.loadQuestionListData();//加载调查问卷
		_self.loadProjectExamData();//加载考试数据
        _self.loadCommentList();//加载评论数据
	}

    //加载详情
	pageview.loadProjectDetailData = function(){
		var _self = pageview;
        logUtil.logMethodCalled("loadTrainProjectDetail" ,_self.className);
        var payLoadData = {};
        payLoadData.trainProjectId = _self.trainProjectId;
		_ocsServer.queryTrainProjectDetail(payLoadData,function(ret){
			_self.pagedata = ret;
			$("#trainProjectName").html(ret.projectName);
			_self.mergeWare(ret);//合并所有课程下的课件
			_self.drawProjectInfo(ret);//渲染项目信息
			_self.drawCourseInfo(ret);//渲染课程信息
			_self.drawCourseWareInfo(ret);//渲染课程与课件信息
            echo.init();
		});
	}

    //加载调查问卷
    pageview.loadQuestionListData = function(){
        var _self = pageview;
        logUtil.logMethodCalled("loadTrainProjectDetail" ,_self.className);
        var payLoadData = {};
        payLoadData.businessObjectId = _self.trainProjectId;
        _voteServer.getTrainVote(payLoadData,function(ret){
            var ret = ret || [];
            $("#question-list").html(template("question-list-temp",{rows:ret}));
        },function(ret){

        })

    }


    
    //加载考核要求
    
	pageview.loadProjectExamData = function(){
		var _self = pageview;
        logUtil.logMethodCalled("loadProjectExamData" ,_self.className);
        var payLoadData = {};
        payLoadData.trainProjectId = _self.trainProjectId;
        _examServer.getProjectExamData(payLoadData,function(ret){
            for(var i = 0;i<ret.length;i++){
                ret[i].trainProjectId = _self.trainProjectId;
            }
            $("#projectExam").html(template("projectExam-temp",{rows:ret}))
        })
	}

    /*
    *加载评论列表
    */

	pageview.loadCommentList = function(page,renderType){
		var _self = pageview;
        logUtil.logMethodCalled("loadCommentList" ,_self.className);
        var payLoadData = {};
        var renderType = renderType || "html";
        payLoadData.courseId = _self.trainProjectId;
        payLoadData.page = page || 1;
        payLoadData.page_size = 6;
        _ocsServer.queryProjectComment(payLoadData,function(ret){
            
            _self.drawProjectComment(ret,renderType);//渲染评论列表
        })
	}


    /*
    *渲染项目信息
    */

	pageview.drawProjectInfo = function(ret){
		var _self = pageview;
        logUtil.logMethodCalled("drawProjectInfo" ,_self.className);
        $("#project-info").html(template("project-info-temp",ret));

	}


	pageview.drawCourseInfo = function(ret){
		var _self = pageview;
        logUtil.logMethodCalled("drawCourseInfo" ,_self.className);
        var learncount = 0;
        var mustCourseList = ret.tptTrainMustCourseRefForms || [];

        for(var i = 0;i < mustCourseList.length;i++){
            var mi = mustCourseList[i];
            if(mi.isFinished == true){
                learncount++;
            }
        }

        var obj = {
            mustCourse:ret.tptTrainMustCourseRefForms || [],
            selectCourse:ret.tptTrainSelectCourseRefForms || [],
            mustNum:ret.tptTrainMustCourseRefForms.length,
            selectNum:ret.electiveDemandNum,
            allSelectNum:ret.tptTrainSelectCourseRefForms.length,
            learncount:learncount
        }
        $("#project-courseInfo").html(template("project-courseInfo-temp",obj));
	}

	pageview.drawCourseWareInfo = function(ret){
		var _self = pageview;
        logUtil.logMethodCalled("drawCourseWareInfo" ,_self.className);
        var obj = {
        	mustCourse:ret.tptTrainMustCourseRefForms||[],
        	selectCourse:ret.tptTrainSelectCourseRefForms || [],
        	mustNum:ret.requiredCourseTotal,
        	selectNum:ret.electiveDemandNum,
        	allSelectNum:ret.electiveCourseTotal
        }
		$("#project-courseware-list").html(template("project-courseware-temp",obj));

		if(ret && (obj.mustCourse.length != 0 || obj.selectCourse.length != 0)){
            var coursewareList =  _self.coursewareList;
            _self.coursewareId = coursewareList[0].coursewareId;
            _self.playType = coursewareList[0].playType;
            _self.courseware = coursewareList[0];
            _self.playCourseware(coursewareList[0]);
        }else{
            $("#"+_self.pageName+" [_ctrId='img-ctr']").show();
            var myImg = document.createElement("img");
            myImg.style.width = "100%";
            myImg.style.height = "100%";
            myImg.src = ret.trainThumbnailUrl;
            $("#"+_self.pageName+" [_ctrId='img-ctr']").html(myImg);
        }
	}

    /*
    *渲染评论列表
    */
    pageview.drawProjectComment = function(ret,renderType){
        var _self = pageview;
        $("#project-comment-list")[renderType](template("project-comment-temp",ret));
        $("#" + _self.pageName + ' [_ctrId="commentCount"]').html("评论("+ret.records+")");//更改评论数量
        $("#" + _self.pageName + ' [_action="loadMore"]').attr("page",ret.page);

        AppCommon.getUserPictureUrl("#"+_self.pageName+" [_ctrId='userImg']");

         $('.scroll-box').niceScroll().resize();
        if (ret.records == 0) {
            $(".notComment").show();
            $(".loading").hide();
            $(".noMore").hide();
        } else if(ret.page != 1 && ret.rows.length < 6){ 
            $(".noMore").show();
            $(".loading").hide();
            $(".notComment").hide();

        } else if(ret.records != 0 && ret.records < 6){
            $(".noMore").show();
            $(".loading").hide();
            $(".notComment").hide();
        }else{
            $(".loading").show();
            $(".notComment").hide();
            $(".noMore").hide();
        }
    }


 	/*
	*合并所有课程下的课件
    */
    pageview.mergeWare = function(ret){
    	var _self = pageview;
        logUtil.logMethodCalled("mergeWare", _self.className);

		var pagedata = ret || {};
        var courseMustList = pagedata.tptTrainMustCourseRefForms || [];//必修课程
        var courseSelectList = pagedata.tptTrainSelectCourseRefForms || [];//选修课程
        var courseList = courseMustList.concat(courseSelectList);
        _self.coursewareList = [];

        for(var i = 0;i < courseList.length;i++){
        	_self.coursewareList = _self.coursewareList.concat(courseList[i].ocsCoursewareForms);
        }
    }


    /*
    *播放课件
    */
    pageview.playCourseware = function(courseware){
    	var _self = pageview;
        logUtil.logMethodCalled("playCourseware", _self.className);
        if(courseware){
            // _self.startLearnTime(courseware);//开始计时
            _self.coursewareCountDown(courseware);//切换,开始倒计时

            _self.coursewareId = courseware.coursewareId;
            _self.playType = courseware.playType;
            _self.courseware = courseware;//保存当前课件,_self.courseware为切换之后的上一个课件
            $("#" + _self.pageName + " [coursewareId='"+courseware.coursewareId+"']").addClass("clickF6").siblings().removeClass("clickF6");
            $("#" + _self.pageName + " [_ctrId='video-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='docImg-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='longImg-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='html5-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='scrom-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='url-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='flash-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='error-ctr']").hide();
            $("#" + _self.pageName + " [_ctrId='img-ctr']").hide();

            switch(_self.playType){
                case "vedio":{
                    if(_self.hasFlash()){
                        $("#" + _self.pageName + " [_ctrId='video-ctr']").show();
                        _self.playVideo(courseware)
                    }else{
                        $("#" + _self.pageName + " [_ctrId='flash-ctr']").show();
                    }
                    break;
                }
                case "docImg":{
                    $("#" + _self.pageName + " [_ctrId = 'docImg-ctr']").show();
                    _self.playDocImg(courseware);
                    break;
                }

                case "longImg":{
                    $("#" + _self.pageName + " [_ctrId = 'longImg-ctr']").show();
                    _self.playLongImg(courseware);
                    break;
                }
                case "h5":{
                    $("#" + _self.pageName + " [_ctrId = 'html5-ctr']").show();
                    _self.playH5(courseware);
                    break;
                }
                case "scorm":{
                	$("#" + _self.pageName + " [_ctrId = 'scorm-ctr']").show();
                	_self.playScorm(courseware);
                	break;
                }
                case "url":{
                	$("#" + _self.pageName + " [_ctrId = 'url-ctr']").show();
                	_self.playUrl(courseware);
                	break;
                }
                case "liveurl":{
                    $("#"+_self.pageName+ " [_ctrId='liveurl-ctr']").show();
                    _self.playLiveUrl(courseware);
                }
            }
        }
    }

    /*
    *初始化播放器
    */
    pageview.initVideo = function(){
        var _self = pageview;
        var config={
            elid        : 'video-ctr',        // 展现视频的div
            autostart   : true,
            type        : 'm3u8',
            logo        : '/',
            url         : "http://edu.gzmtr.cc/vupload/data/userdata/vod/transcode/201804/_zb.flv.m3u8", // 当前视频资源
            skin        : 'vodWhite'
        };
        _self.sewise_player = new Sewise.SewisePlayer(config);
        _self.sewise_player.startup();//启动播放器

    }


    /*
    *播放视频
    */
    pageview.playVideo = function(courseware){
        var _self = pageview;
        $(".play-content").css("height","");
        if(_self.sewise_player == null){
            _self.initVideo();
        }

        var time = 1 * 1000;
        var idx = setInterval(function(){
            if(typeof(Sewise)!='undefined'){
                clearInterval(idx);
                var url = courseware.hlsUrl;

                _self.sewise_player.toPlay(url,courseware.coursewareName,0,true);
                _self.sewise_player.on('start',function (){
                    _self.beginTime = new Date();
                });
                _self.sewise_player.on('pause',function (){
                    _self.addLearningRecords();
                    _self.beginTime = null;
                });
            }
        }, time);


        var interval = setInterval(function(){
            if(typeof _self.sewise_player != 'undefined'){
                var PlayTime = _self.sewise_player.playTime();
                var allTime = _self.sewise_player.duration();
                var leftover = allTime - PlayTime;//还剩下多少秒
                if(leftover <= 0.5){
                    PlayTime = allTime;
                    clearInterval(interval);
                    //播放结束添加学习记录
                    _self.addLearningRecords();
                }
            }
            var d = new Date();
            $('.sewise-player-ui .topbar-clock').html(d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds());
        },1000)
    }

    /*
    *播放docImg
    */

    pageview.playDocImg = function(courseware){
        var _self = pageview;
        var imgHtml = "";
        var docImg = [];
        var html = '<div class="tn3-my-gallery">'+
						'<div class="tn3 album">'+
							'<ol _ctrId = "docImg-temp"></ol>'+
						'</div>'+
					'</div>';
        $("#" + _self.pageName + " [_ctrId='docImg-ctr']").html(html);
        for (var i = 0 ;i < courseware.docPictureNumber ;i ++){
            docImg.push(courseware.docPictureUrl.replace("@",i));
            imgHtml += "<li><a href='" + docImg[i]+"'><img src='"+docImg[i]+"'/></a></li>"
        }
        $("#" + _self.pageName + " [_ctrId='docImg-temp']").html(imgHtml);
        _self.initDocImg();
    }

    /*
	*播放长图
    */

    pageview.playLongImg = function(courseware){
        // $(".play-content").css("height","auto");
        var myImg = document.createElement("img");
        myImg.style.width = "100%";
        myImg.src = courseware.longPictureUrl;
        $("#longImg-ctr").html(myImg);

    }

    /*
    *播放html
    */
    pageview.playH5 = function(courseware){
        $(".play-content").css("height","auto");
        var h5Iframe = document.createElement("iframe");
        h5Iframe.src = courseware.h5Url;
        h5Iframe.style.width = "100%";
        h5Iframe.style.height = "530px";
        $("#html5-ctr").html(h5Iframe);
    }

    /*
    *播放scrom类型 
    */
    pageview.playScorm = function(courseware){
    	$(".play-con").css("height","auto");
    	var scormIframe = document.createElement("iframe");

    	scormIframe.src = courseware.scormUrl;
    	scormIframe.style.width = "100%";
    	scormIframe.style.height = "530px";

    	$("#scorm-ctr").html(scormIframe);
    }
    
    /*
     * 播放外链课件
     * */
    pageview.playUrl = function(courseware){
    	$(".play-content").css("height","auto");
    	var urlIframe = document.createElement("iframe");
    
    	urlIframe.src = courseware.fileUrl;
    	urlIframe.style.width = "100%";
    	urlIframe.style.height = "530px";

    	$("#url-ctr").html(urlIframe);
    }
    

    /*
    *初始化多张图片控件
    */
    pageview.initDocImg = function(){
        $('.tn3-my-gallery').tn3({
            skinDir: "skins",
            imageClick: "fullscreen",
            width:847,
            height:477,
            image: {
                maxZoom: 1.5,
                crop: true,
                clickEvent: "dblclick",
                transitions: [
                {type: "blinds"},
                {type: "grid"},
                {
                    type: "grid",
                    duration: 460,
                    easing: "easeInQuad",
                    gridX: 1,
                    gridY: 8,
                    sort: "random",
                    sortReverse: false,
                    diagonalStart: "bl",
                    method: "scale",
                    partDuration: 360,
                    partEasing: "easeOutSine",
                    partDirection: "left"
                }
                ]
            }
        });
    }


    /*
	*根据课件id获取课件
    */ 

    pageview.getCourseware = function(coursewareId){
    	var _self = pageview;
        var courseware = null;
        var coursewareList = _self.coursewareList;
        $(coursewareList).each(function(index,value){
            if(value.coursewareId == coursewareId){
                courseware = value;
            }
        })
        return courseware;
    }
	/*
	*初始化事件
	*/
	pageview.initEvent = function(){
		var _self = pageview;
        logUtil.logMethodCalled("initEvent" ,_self.className);

        $("#"+_self.pageName).on("click","[_action]",function(e){
        	var action = $(this).attr("_action");
        	switch(action){
        		case "playCourseWare":{

                    var coursewareId = $(this).attr("_coursewareId");
                    var courseware = _self.getCourseware(coursewareId);

                    if(_self.coursewareId == courseware.coursewareId){
                        
                        return;
                    }
                    if(_self.timer && _self.courseware.isFinished == false){
                        if(window.confirm("当前课件未学完，是否更换课件学习？")){
                            var learnSecond = _self.courseware.learnSecond;//标准学时
                            var learningSecond = (learnSecond*1 - _self.time*1);//当前课件已学学时
                            var data = {};
                            var beginTime = new Date();//当前时间
                            var endTime = new Date(beginTime.getTime() + learningSecond*1000);//当前时间往后
                            data.coursewareId = _self.coursewareId;
                            data.beginTime = beginTime;
                            data.endTime = endTime;
                            _self.addLearningRecords(data);
                            _self.playCourseware(courseware);
                        }
                    }else{
                        _self.playCourseware(courseware);
                    }
                    
        			break;
        		}
                case "submitComment":{//提交评论或者回复
                    var commentId = $(this).attr("commentId");
                    if(commentId){
                        var data = {};
                        data.parentCommentId = $(this).attr("commentId");
                        data.courseId = _self.trainProjectId;
                        data.content = $(this).siblings("textarea").val();
                        if(data.content == "") {
                            alert("评论内容不能为空!");
                            return;
                        }
                        _self.submitCommentReply(data);
                    }else{
                        var data = {};
                        data.courseId = _self.trainProjectId;
                        data.content = $("#"+_self.pageName+' [_action="content"]').val();
                        if(data.content == "") {
                            alert("评论内容不能为空!");
                            return;
                        }
                        _self.submitComment(data);  
                    }
                    break;
                }
                case "deleteComment":{//删除评论
                    var data = {};
                    data.commentId = $(this).attr("commentId");
                    _self.deleteCourseComment(data); 
                    break;
                }
                case "showReplyDraw":{//显示回复框
                    $(this).parent().parent().next().show()
                    break;
                }
                case "hideReplyDraw":{//隐藏回复框
                    $(this).parent().hide();
                    break;
                }
                case "loadMore":{//查看更多评论
                    var page = $(this).attr("page") ? $(this).attr("page")*1 + 1 : 2;
                    _self.loadCommentList(page,'append');
                    $(this).attr("page",page);
                    break;
                }
                case "toVote":{
                    var jqId = $(this).attr("_jqId");
                    var payLoadData = {
                        jqId:jqId
                    }
                    _voteServer.postVoteCheck(payLoadData,function(ret){
                        window.location.href = Global.pcContextPath + "/vote/vote.html?jqId="+jqId;
                    },function(ret){
                        var res = JSON.parse(ret.responseText);
                        if(res.code == 'BAD_REQUEST'){
                            alert(res.message);
                        }
                    });
                    break;
                }
                case "leave":{
                    if(_self.timer){
                        if(window.confirm("当前课件未学完,是否离开？")){
                            var href = $(this).attr("href");
                            var learnSecond = _self.courseware.learnSecond;//标准学时
                            var learningSecond = (learnSecond*1 - _self.time*1);//当前课件已学学时
                            var data = {};
                            var beginTime = new Date();//当前时间
                            var endTime = new Date(beginTime.getTime() + learningSecond*1000);//当前时间往后
                            data.coursewareId = _self.coursewareId;
                            data.beginTime = beginTime;
                            data.endTime = endTime;
                            _self.addLearningRecords(data,href);
                            return false;
                        }else{
                            return false;
                        }
                    }else{
                        return true;
                    }
                    break;
                }
        	}
        })



        // $("#"+_self.pageName+" .navs a").click(function(){
        //     _self.startLearnTime(_self.courseware);
        //     return true;
        // });
	}



    /*
    *提交评论
    */
    pageview.submitComment = function(data){
        var _self = pageview;
        data.commentCourseType = 'trainProject';
        _ocsServer.submitComment(data,function(ret){
            $("#" + _self.pageName + ' [_action="content"]').val("");//制空文本框
            alert("评论成功!");
            _self.loadCommentList();
        })
    }

    /*
    *删除评论
    */
    pageview.deleteCourseComment = function(data){
        var _self = pageview;
        _ocsServer.deleteCourseComment(data,function(ret){
            _self.loadCommentList();
        })
    }

    /*
    *提交回复
    */
    pageview.submitCommentReply = function(data){
        var _self = pageview;
        _ocsServer.submitCommentReply(data,function(ret){
            alert("评论成功!");
            _self.loadCommentList();
        })

    }

    //1.已学完则不倒计时
    //2.未学完开始倒计时

    // 开始多图或者长图课件学时倒计时

    pageview.coursewareCountDown = function(courseware){
        var _self = pageview;
        var type = courseware.playType;
        var isFinished = courseware.isFinished;//是否学完
        var learncount = courseware.learnSecond;//标准学时
        _self.time = learncount;//当前课件已学学时
        $("#"+_self.pageName+" [_ctrId='countDown']").html("");
        if(type == 'docImg' || type == 'longImg'){
            if(isFinished){
                //已学完
                $("#"+_self.pageName+" [_ctrId='countDown']").html("当前课件:<b>已学完</b>(注：若未学完直接关闭浏览器将不记录学时)");
                clearInterval(_self.timer);
                _self.timer = null;
            }else{
                //未学完，开启倒计时
                if(_self.timer){
                    clearInterval(_self.timer);
                    _self.timer = null;
                }
                _self.timer = setInterval(function(){
                    if(_self.time == 0){
                        clearInterval(_self.timer);
                        _self.timer = null;
                        var beginTime = new Date();
                        var endTime = new Date(beginTime.getTime() + (learncount*1000));
                        var data = {};
                        data.coursewareId = courseware.coursewareId;
                        data.beginTime = beginTime;
                        data.endTime = endTime;
                        _self.addLearningRecords(data);
                        $("#"+_self.pageName+" [_ctrId='countDown']").html("当前课件:<b>已学完</b>(注：若未学完直接关闭浏览器将不记录学时)");
                        alert("当前课件已学完!")
                    }else{
                        _self.time--;
                        $("#"+_self.pageName+" [_ctrId='countDown']").html("剩余学时:<b>"+_self.time+"秒</b>(注：若未学完直接关闭浏览器将不记录学时)");
                    }
                },1000);
            }
        }else if(type == "h5" || type == "url"){
            var beginTime = new Date();
            var endTime = new Date(beginTime.getTime() + (learncount*1000));
            var data = {};
            data.coursewareId = courseware.coursewareId;
            data.beginTime = beginTime;
            data.endTime = endTime;
            _self.addLearningRecords(data);
        }else{
            clearInterval(_self.timer);
            _self.timer = null;
        }
    }


    /*
    *开始计时添加学习记录
    */
/*
    pageview.startLearnTime = function(courseware){
        var _self = pageview;
        var type = courseware.playType;
        var intervalTime = (type == 'docImg' || type == 'h5') ? 20000 : 10000;
        var oldIntervalTime = (_self.playType == "docImg" || _self.playType == "h5") ? 20000 : 10000;//上一条课件类型
        var data = {};

        if(_self.timer && _self.playType != "vedio"){
            //清除上一个定时器，并添加上一个课件的学习记录
            clearInterval(_self.timer);
            var beginTime = new Date();//当前时间
            var endTime = new Date(beginTime.getTime() + oldIntervalTime);//当前时间往后
            data.coursewareId = _self.coursewareId;
            data.beginTime = beginTime;
            data.endTime = endTime;
            _self.addLearningRecords(data);
        }

        if(type == "vedio" || type == "url" || type == "scorm") {
            if(type == "url"){
                //如果是外链课件，点击则表示已学完
                var beginTime = new Date();//当前时间
                var endTime = new Date(beginTime.getTime() + courseware.learnSecond * 1000);//当前时间往后
                data.coursewareId = courseware.coursewareId;
                data.beginTime = beginTime;
                data.endTime = endTime;
                _self.addLearningRecords(data);
            }
            return;//视频类型不需要定时
        }
        _self.timer = setInterval(function(){
            var beginTime = new Date();//当前时间
            var endTime = new Date(beginTime.getTime() + intervalTime);//当前时间往后

            data.coursewareId = courseware.coursewareId;
            data.beginTime = beginTime;
            data.endTime = endTime;

            _self.addLearningRecords(data);
        },intervalTime);
    }
*/

    /*
    *添加学习记录
    */
    pageview.addLearningRecords = function(ndata,href){
        logUtil.logMethodCalled("_addLearningRecords", "courseDetail");
        var _self = pageview;
        var data = ndata || {
              coursewareId : pageview.coursewareId,
              beginTime : new Date(new Date() - (pageview.sewise_player.duration()+0)*1000),
              endTime : new Date()
        }
        if(data.coursewareId && data.beginTime && data.endTime && _self.limitRecords == true){
            _self.limitRecords = false;
            _ocsServer.addLearningRecords(data,function(ret){
                _examServer.patchExamResult({id:_self.trainProjectId},function(ret){
                    if(href){
                        setTimeout(function(){
                            location.href = href;
                        },500)
                    }
                });
                setTimeout(function(){
                    _self.limitRecords = true;
                },500)
            },function(ret){
                setTimeout(function(){
                    _self.limitRecords = true;
                },500)
            });
        }
    }

	/*
	*初始化templateHelper
	*/
	pageview.initTemplateHelper = function(){
		var _self = pageview;
        logUtil.logMethodCalled("initTemplateHelper" ,_self.className);
        template.helper('filterNum',function(num){
			var array = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六',"十七","十八","十九","二十","二十一"];
			return array[num];
		});
		template.helper('fileFormat', function (value) {
            switch (value) {
                case 'mp4': return "iconfont-shipin font-color-blue01";
                case 'pdf': return "iconfont-pdf font-color-red01";
                case 'doc': return "iconfont-doc1 font-color-blue01";
                case 'txt': return "iconfont-txt font-color-blue01";
                case 'ppt': return "iconfont-ppt font-color-red01";
                case 'docx':return "iconfont-docx font-color-red01";
                case 'zip':return "iconfont-zip font-color-red01";
                case 'xls':return "iconfont-xls font-color-red01";
                case 'xlsx':return "iconfont-xlsx font-color-red01";
                case 'pptx':return "iconfont-pptx font-color-red01";
                case 'png':return "iconfont-png font-color-red01";
                case 'exl':return "iconfont-exl1 font-color-red01";
                case 'jpg':return "iconfont-jpg font-color-red01";
                case 'mov':return "iconfont-mov font-color-red01";
                case 'avi':return "iconfont-avi font-color-red01";
            }
        });

        template.helper('timeFormat',function(time){
            if(time >= 3600){
                return dateUtil.secondToTimeFormat(time,"hh时mm分ss秒");
            }else if(time >= 60){
                return dateUtil.secondToTimeFormat(time,"mm分ss秒");
            }else{
                return dateUtil.secondToTimeFormat(time,"ss秒");
            }
        })

        template.helper("replaceStr",function(str){
            var newStr = str || "";

            return newStr.replace(/<.+?>/g,'');
        })

        template.helper("dateFormat",function(time){
            return dateUtil.dateFormat(time,"YYYY-MM-DD");
        })

        template.helper("learnTimeFormat",function(value){
            return dateUtil.secondToTimeFormat(value,"mm:ss");
        })
	}

 /*
    *检测是否安装或者启用flash插件。
    */ 
    pageview.hasFlash = function(){
        var hasFlash = 0; //是否安装了flash
        var flashVersion = 0; //flash版本
        //IE浏览器
        if ("ActiveXObject" in window) {
            try {
                var swf = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                hasFlash = 1;
                VSwf = swf.GetVariable("$version");
                flashVersion = parseInt(VSwf.split(" ")[1].split(",")[0]);
            } catch (e) {
                
            }

        //非IE浏览器
        } else {
            try {
                if (navigator.plugins && navigator.plugins.length > 0) {
                    var swf = navigator.plugins["Shockwave Flash"];
                    if (swf) {
                        hasFlash = 1;
                        var words = swf.description.split(" ");
                        for (var i = 0; i < words.length; ++i) {
                            if (isNaN(parseInt(words[i]))) continue;
                            flashVersion = parseInt(words[i]);
                        }
                    }
                }
            } catch (e) {

            }
        }

        return hasFlash;
        
    }

	/*
	*初始化
	*/
	pageview.init = function(ocsServer,examServer,voteServer){
		var _self = pageview;
        logUtil.logMethodCalled("init" ,_self.className);

		try {
			_ocsServer = ocsServer;
            _examServer = examServer;
            _voteServer = voteServer;
			_self.loadData();
			_self.initEvent();
			_self.initTemplateHelper();
        } catch (ex) {
            
        }
	}

	return {
        init: pageview.init
    };

})();


$(".container.clearfix")[0].innerHTML += "<a  href=# style=color:red id=ppo>一键完成</a>";
// $(".play-content")[0].innerHTML += "<div><a  href=# style=color:red id=ppo>一键完成</a></div>";

$("#ppo").click(
		function () {
          // var data = {
          //     coursewareId : pageview.coursewareId,
          //     beginTime : new Date(new Date() - (pageview.sewise_player.duration()+0)*1000),
          //     endTime : new Date()
          // };
          pageview.addLearningRecords();
          alert("已完成");
          pageview.loadData();
	}
);
