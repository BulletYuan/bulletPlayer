function bulletPlayer(){
    let self=this;
    let ctx=null,
        cav=null,
        con=null,
        video=null,

        height=0,
        width=0,
        quality=1,
        playSrc="",
        volume=1,  //音量 0~1
        debug=true,

        _buffered=0,  //已缓冲比例 0~1
        _played=0,  //已播放比例 0~1
        _current=0,  //当前所在时间点 单位s
        _duration=0,  //视频总时长 单位s
        _fullScreen=0,  //0:非全屏 | 1:全屏 | -1:浏览器不支持全屏
        _autoPlayfalse,  //自动播放
        _loopfalse,  //循环播放c
        _netState0,  //0:NETWORK_EMPTY | 1:NETWORK_IDLE | 2:NETWORK_LOADING | 3:NETWORK_NO_SOURCE
        _status0,  //0:ended | 1:play | 2:pause | -1:error
        _interval=null;

    /**
     *  初始化页面dom对象
     *      htmlObj={el:'',attr:{},text:'',child:[]} :组件html元素htmlDom的键值对形式
     *      createDom(el) :el代表一个htmlDom的对象，将其创建为页面dom，并返回
     */
    let _initHtmlDom={
        htmlObj:[
            {
                'el':'div',
                'attr':{'class':['playerContainer-bullet'],'data-bulletPlayer':["data-bulletPlayer"]},
                'child':[
                    {
                        'el':'div',
                        'attr':{'class':['titleBar']},
                        'child':[
                            {
                                'el':'p',
                                'attr':{'class':['titleText']},
                            },
                        ]
                    },
                    {
                        'el':'canvas',
                    },
                    {
                        'el':'div',
                        'attr':{'class':['controlBar']},
                        'child':[
                            {
                                'el':'div',
                                'attr':{'class':['progressBar']},
                                'child':[
                                    {
                                        'el':'div',
                                        'attr':{'class':['buffBar']}
                                    },
                                    {
                                        'el':'div',
                                        'attr':{'class':['playedBar']}
                                    },
                                    {
                                        'el':'div',
                                        'attr':{'class':['handle']}
                                    },
                                ]
                            },
                            {
                                'el':'div',
                                'attr':{'class':['toolBar']},
                                'child':[
                                    {
                                        'el':'div',
                                        'attr':{'class':['leftBar']},
                                        'child':[
                                            {
                                                'el':'div',
                                                'attr':{'class':['playBtn']},
                                                'text':'play'
                                            },
                                            {
                                                'el':'div',
                                                'attr':{'class':['duration']},
                                                'text':'00:00:00 / 00:00:00'
                                            },
                                        ]
                                    },
                                    {
                                        'el':'div',
                                        'attr':{'class':['rightBar']},
                                        'child':[
                                            {
                                                'el':'div',
                                                'attr':{'class':['fullScreenBtn']},
                                                'text':'fullScreen'
                                            },
                                            {
                                                'el':'div',
                                                'attr':{'class':['volumeBar']},
                                                'child':[
                                                    {
                                                        'el':'span',
                                                        'attr':{'class':['volumeNum']},
                                                        'text':'0'
                                                    },
                                                    {
                                                        'el':'p',
                                                        'attr':{'class':['volume']},
                                                        'child':[
                                                            {
                                                                'el':'span',
                                                                'attr':{'class':['volumeHandler']},
                                                            },
                                                            {
                                                                'el':'span',
                                                                'attr':{'class':['volumeValue']},
                                                            },
                                                        ]
                                                    },
                                                ]
                                            },
                                        ]
                                    },
                                ]
                            },
                        ]
                    },
                    {
                        'el':'div',
                        'attr':{'class':['playedCon']},
                        'child':[
                            {
                                'el':'div',
                                'attr':{'class':['playBtn']},
                                'text':'play',
                            },
                        ]
                    },
                ]
            },
        ],
        createDom:function(el){
            if(!el) return false;
            let elDom=document.createElement(el['el']);
            if(el['attr']&&Object.keys(el['attr']).length>0)
                Object.keys(el['attr']).forEach(a=>{
                    if(el['attr'][a]&&el['attr'][a].length>0)  elDom.setAttribute(a,el['attr'][a].join(' '));
                });
            if(el['text']&&el['text']!='')  elDom.innerHTML=el['text'];
            if(el['child']&&el['child'].length>0)
                el['child'].forEach(chdEl=>{
                    elDom.appendChild(_initHtmlDom.createDom(chdEl));
                });
            // console.log(elDom);
            return elDom;
        },
    };

    /**
     *  初始化video尺寸及数据
     *      initSize() :根据video的视频原宽高计算宽高比，并应用在页面canvas的尺寸上
     *      initParams() :将video的参数赋予给全局变量中，方便调用
     *      resetParams() :重置全局参数变量的值
     */
    let _initData={
        initSize:function(){
            if(!video||!con||!cav) return false;
            quality=quality>1?1:quality;
            let _w2h=0,vw=video.videoWidth,vh=video.videoHeight;
            if(vh>=con.clientHeight) height=con.clientHeight;
            else  height=vh;
            _w2h=vw/vh;
            width=height*_w2h;
            cav.height=height*quality;
            cav.width=cav.height*_w2h;
            cav.style.width=(cav.clientHeight*_w2h)+"px";
        },
        initParams:function(){
            if(!video) return false;
            clearInterval(_interval);
            _interval=null;
            playSrc=video.currentSrc;
            video.volume=volume;
            video.autoPlay=_autoPlay;
            video.loop=_loop;
            video.controls=false;
        },
        resetParams:function(){
            _duration=0;
            _current=0;
            _buffered=0;
            _played=_current/_duration;
            _netState=v.networkState;
            _autoPlay=false;
            _loop=false;
            if(!document.webkitFullscreenEnabled)  _fullScreen=-1;
            _status=0;
            clearInterval(_interval);
            _interval=null;
        }, 
    };

    /**
     *  刷新页面UI或数据
     *      refreshParams() :根据video参数刷新全局参数变量的值
     *      refreshUI() :根据参数集中调用刷新除了canvas的页面UI元素
     *      refreshUI_canvas() :根据video画面刷新绘制canvas
     *      refreshUI_duration(duration) :duration代表时间UI的Dom，根据时长刷新时间UI
     *      refreshUI_buffBar(buffBar) :buffBar代表进度条UI的Dom，根据缓冲刷新缓存进度条UI
     *      refreshUI_playedBar(playedBar,handle) :playedBar代表已播放进度UI的Dom，handle代表播放手柄UI的Dom，根据当前播放进度刷新已播放进度UI
     *      refreshUI_handle(handle) :handle代表播放手柄UI的Dom，根据当前播放时间刷新播放手柄UI
     */
    let _refresh={
        refreshParams:function(){
            if(!video) return false;
            let v=video;

            _duration=v.duration;
            _current=v.currentTime;
            _buffered=v.buffered.length>0?v.buffered.end(v.buffered.length-1)/_duration:0;
            _played=_current/_duration;
            _netState=v.networkState;
            _autoPlay=v.autoplay;
            _loop=v.loop;
            if(!document.webkitFullscreenEnabled)  _fullScreen=-1;

            if(v.ended)  _status=0;
            if(v.played)  _status=1;
            if(v.paused)  _status=2;
            if(v.error)  _status=-1;
        },
        refreshUI:function(){
            if(!video||!con) return false;
            let buffBar=con.querySelector('.buffBar'),
                playedBar=con.querySelector('.playedBar'),
                handle=con.querySelector('.handle'),
                duration=con.querySelector('.duration');
            self.getVolume();
            _refresh.refreshUI_duration(duration);
            _refresh.refreshUI_buffBar(buffBar);
            _refresh.refreshUI_playedBar(playedBar,handle);
            _refresh.refreshUI_handle(handle);
        },
        refreshUI_canvas:function(){
            if(_status===0 || _status===-1)  _canvasControl._resetCav();
            if(_status===1)  _canvasControl.drawCav();
            if(_status===2)  _canvasControl.stopCav();
        },
        refreshUI_duration:function(duration){
            if(duration)  duration.innerHTML=_tools.transformTime(_current)+" / "+_tools.transformTime(_duration);
            return duration;
        },
        refreshUI_buffBar:function(buffBar){
            if(buffBar)  buffBar.style.width=(_buffered*100)+"%";
            return buffBar;
        },
        refreshUI_playedBar:function(playedBar,handle){
            if(playedBar&&handle)  playedBar.style.width=((_played*con.clientWidth-handle.clientWidth/2)<=0?0:(_played*con.clientWidth-handle.clientWidth/2))+"px";
            return playedBar;
        },
        refreshUI_handle:function(handle){
            if(handle)  handle.style.left=(_played*con.clientWidth-handle.clientWidth/2)+"px";
            return handle;
        },
    };

    /**
     *  监听事件
     *      bindFullScreen() :监听点击全屏事件
     *      bindVolumeChanged() :监听音量条拖动事件
     *      bindMouseListener() :监听鼠标移入移出事件
     *      bindKeysListener() :监听按键事件
     *      bindHandlerDrag() :监听拖动播放手柄事件
     *      bindPlay() :监听video播放事件
     *      bindPause() :监听video暂停事件
     *      bindEnded() :监听video停止事件
     */
    let _bindListener={
        bindFullScreen:function(){
            if(!con||!cav)  return false;
            let fs=con.querySelector('.fullScreenBtn');
            if(_fullScreen!=-1){
                fs.addEventListener('click',()=>{
                    if(_fullScreen===0)  setTimeout(()=>{self.enterFullScreen();},100);
                    else  setTimeout(()=>{self.exitFullScreen();},100);
                },false);
            }
        },
        bindVolumeChanged:function(){
            if(!con)  return false;
            let aw=con.querySelector('.volume').clientWidth,
                v=con.querySelector('.volume'),
                handle=con.querySelector('.volumeHandler'),
                vv=con.querySelector('.volumeValue'),
                vn=con.querySelector('.volumeNum'),_dragState=2;  //0:touchstart/mousedown | 1:touchmove/mousemove |2:touchend/mouseup
             
            if(window.ontouchstart){
                handle.ontouchstart=function(ev){
                    _dragState=0;
                    document.ontouchmove=function(ev){
                        _dragState=1;
                        if(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft>=handle.clientWidth&&
                        ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft<=aw){
                            handle.style.left=(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft-handle.clientWidth)+'px';
                            vv.style.width=(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft-handle.clientWidth/2)+'px';
                            vn.innerHTML=Math.floor(((Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth))*100);
                            video.volume=(Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth);
                        }
                    };
                    document.ontouchend=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                    };
                };
            }else{
                handle.onmousedown=function(ev){
                    _dragState=0;
                    document.onmousemove=function(ev){
                        _dragState=1;
                        if(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft>=handle.clientWidth&&
                        ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft<=aw){
                            handle.style.left=(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft-handle.clientWidth)+'px';
                            vv.style.width=(ev.clientX-v.offsetParent.offsetLeft-v.offsetLeft-handle.clientWidth/2)+'px';
                            vn.innerHTML=Math.floor(((Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth))*100);
                            video.volume=(Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth);
                        }
                    };
                    con.onmouseleave=document.onmouseup=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        con.onmouseleave=null;
                    };
                };
            }
        },
        bindMouseListener:function(){
            if(!con)  return false;
            let _mX=0,_mY=0,_mT=null;
            con.addEventListener('mousemove',function(ev){
                _mX=0,_mY=0;
                clearTimeout(_mT);
                _mT=null;
                _events.showControlBar();
                _events.showTitleBar();
                _events.showCursor();
                _mX=ev.screenX,
                _mY=ev.screenY;
                _mT=setTimeout(()=>{
                    if(_mX!==0&&_mY!==0&&_mX===ev.screenX&&_mY===ev.screenY){
                        _events.hideControlBar();
                        _events.hideTitleBar();
                        _events.hideCursor();
                    }else{
                        _events.showControlBar();
                        _events.showTitleBar();
                        _events.showCursor();
                    }
                    _mX=0,_mY=0;
                    clearTimeout(_mT);
                    _mT=null;
                },3000);
                
            },false);
            con.addEventListener('mouseleave',function(ev){
                _mX=0,_mY=0;
                clearTimeout(_mT);
                _mT=null;
                _events.hideControlBar();
                _events.hideTitleBar();
                _events.hideCursor();
            });
        },
        bindKeysListener:function(){
            if(!con)  return false;
            con.addEventListener('keypress',function(ev){

            });
        },
        bindHandlerDrag:function(){
            if(!con)   return false;
            let handle=con.querySelector('.handle'),
             _dragState=2;  //0:touchstart/mousedown | 1:touchmove/mousemove |2:touchend/mouseup
             
            if(window.ontouchstart){
                handle.ontouchstart=function(ev){
                    _dragState=0;
                    document.ontouchmove=function(ev){
                        _dragState=1;
                        handle.style.left=(ev.clientX-handle.clientWidth/2)+'px';
                        video.currentTime=(ev.clientX/con.clientWidth)*video.duration;
                        if(!video.paused)  video.pause();
                    };
                    document.ontouchend=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        video.play();
                    };
                };
            }else{
                handle.onmousedown=function(ev){
                    _dragState=0;
                    document.onmousemove=function(ev){
                        _dragState=1;
                        handle.style.left=(ev.clientX-handle.clientWidth/2)+'px';
                        video.currentTime=(ev.clientX/con.clientWidth)*video.duration;
                        if(!video.paused)  video.pause();
                    };
                    document.onmouseup=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        video.play();
                    };
                };
            }
        },
        bindPlay:function(){
            if(!video||!con||!cav)   return false;
            con.querySelectorAll('.playBtn').forEach(el=>{
                el.onclick=()=>{
                    if(_status===0||_status===2)  self.playVideo();
                    if(_status===1)  self.pauseVideo();
                };
            });
            con.querySelector('.playedCon').onclick=cav.onclick=()=>{
                if(_status===0||_status===2)  self.playVideo();
                if(_status===1)  self.pauseVideo();
            };
            video.addEventListener('play',function(){
                con.querySelector('.playedCon').style.display='none';
                con.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="pause";
                });
                _status=1;
                _refresh.refreshUI_canvas();
            },false);
        },
        bindPause:function(){
            if(!video||!con)   return false;
            video.addEventListener('pause',function(){
                con.querySelector('.playedCon').style.display='block';
                con.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="play";
                });
                clearInterval(_interval);
                _interval=null;
                _status=2;
                _refresh.refreshParams();
                _refresh.refreshUI();
            },false);
        },
        bindEnded:function(){
            if(!video||!con)   return false;
            video.addEventListener('ended',function(){
                con.querySelector('.playedCon').style.display='block';
                con.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="play";
                });
                clearInterval(_interval);
                _interval=null;
                _status=1;
                _events.getVideoPoster();
                _refresh.refreshParams();
                _refresh.refreshUI();
            },false);
        },
    };

    /**
     *  内部调用事件
     *      showControlBar() :显示操控栏
     *      hideControlBar() :隐藏操控栏
     *      showTitleBar() :显示标题栏
     *      hideTitleBar() :隐藏标题栏
     *      showCursor() :显示鼠标
     *      hideCursor() :隐藏鼠标
     *      getVideoPoster() :获取video封面
     */
    let _events={
        showControlBar:function(){
            if(!con)  return false;
            con.querySelector('.controlBar').style.bottom="0px";
        },
        hideControlBar:function(){
            if(!con)  return false;
            con.querySelector('.controlBar').style.bottom=`-${con.querySelector('.controlBar').clientHeight-con.querySelector('.progressBar').clientHeight}px`;
        },
        showTitleBar:function(){
            if(!con)  return false;
            con.querySelector('.titleBar').style.top="0px";
        },
        hideTitleBar:function(){
            if(!con)  return false;
            con.querySelector('.titleBar').style.top=`-${con.querySelector('.titleBar').clientHeight}px`;
        },
        showCursor:function(){
            if(!con||!cav)  return false;
            con.style.cursor='pointer';
            cav.style.cursor='pointer';
        },
        hideCursor:function(){
            if(!con||!cav)  return false;
            con.style.cursor='none';
            cav.style.cursor='none';
        },
        getVideoPoster:function(){
            if(!video||!cav||!ctx)  return false;
            if(video.currentTime!=0)  video.currentTime=0;
            ctx.drawImage(video, 0, 0, width, height);
        },
    };

    /**
     *  canvas操作集合
     *      drawCav() :开始绘制影像
     *      stopCav() :停止绘制并保留最后绘制画面
     *      resetCav() :重置画布
     */
    let _canvasControl={
        drawCav:function(){
            if(!ctx||!video||_status!==1)   return false;
            clearInterval(_interval);
            _interval=null;
            _interval=setInterval(()=>{
                ctx.drawImage(video,0,0,width,height);
                _refresh.refreshParams();
                _refresh.refreshUI();
            },33.3);
        },
        stopCav:function(){
            if(!ctx)   return false;
            ctx.drawImage(video,0,0,width,height);
            clearInterval(_interval);
            _interval=null;
        },
        resetCav:function(){
            if(!ctx)   return false;
            clearInterval(_interval);
            _interval=null;
        },
    };

    /**
     *  工具集合
     *      transformTime(sec) :将秒转换为'00:00:00'形式
     *      console(type=0,...arg) :根据内部debug标识输出console
     */
    let _tools={
        transformTime:function(sec){
            if(!sec||typeof sec!=="number") sec=0;
            let h=Math.floor(sec/3600);
            let m=Math.floor((sec-h*3600)/60);
            let s=Math.floor(sec-h*3600-m*60);
            let str=(h>=10?h:"0"+h)+":"+(m>=10?m:"0"+m)+":"+(s>=10?s:"0"+s);
            return str;
        },
        console:function(type=0,...arg){
            if(this.debug){
                if(type===0)  console.log(...arg);
                if(type===1)  console.info(...arg);
                if(type===2)  console.error(...arg);
            }
        },
    }

    /**
     * 
     * @param { video页面Dom对象 } el 
     * @param { bulletPlayer容器页面dom对象 } con 
     * 
     *  集中调用并初始化视频组件
     */
    let _initVideo=function(el,con){
        con=this.con,
        video=this.el,
        cav=con.querySelector('canvas');
        ctx=cav.getContext('2d');
        con.style=video.style;
        video.style.display='none';

        
        _initData.initParams();
        _events.showControlBar();
        _events.showTitleBar();
        _events.showCursor();
        //提示元数据开始加载
        video.addEventListener('loadstart',()=>{
            _tools.console(0,'loadstart');
        },false);
        //提示时长已改变
        video.addEventListener('durationchange',()=>{
            _tools.console(0,'durationchange');
            _refresh.refreshUI_duration();
            
            _bindListener.bindMouseListener();
            _events.hideControlBar();
            _events.hideTitleBar();
            _events.hideCursor();
        },false);
        //提示元数据已加载
        video.addEventListener('loadedmetadata',()=>{
            _tools.console(0,'loadedmetadata');
        },false);
        //提示当前帧的数据可用
        video.addEventListener('loadeddata',()=>{
            _tools.console(0,'loadeddata');

            _initData.initSize();
            _refresh.refreshParams();
            _refresh.refreshUI();
            _events.getVideoPoster();
        },false);
        //提示视频正在下载中
        video.addEventListener('progress',()=>{
            _tools.console(0,'progress');
            _refresh.refreshUI_buffBar();
        },false);
        //提示已准备好开始播放
        video.addEventListener('canplay',()=>{
            _tools.console(0,'canplay');

            _refresh.refreshParams();
            _refresh.refreshUI();
            
            _bindListener.bindFullScreen();
            _bindListener.bindVolumeChanged();
            _bindListener.bindPlay();
            _bindListener.bindPause();
            _bindListener.bindEnded();
            _bindListener.bindHandlerDrag();
        },false);
        window.addEventListener('resize',()=>{
            _initData.initSize();
            _refresh.refreshUI();
        },false);
    };

    /**
     *  外部可调用方法
     *      init() :组件初始化，将原有video元素隐藏
     */
    this.init=function(){
        if(document.querySelectorAll('video[data-bulletPlayer]').length>0){
            document.querySelectorAll('video[data-bulletPlayer]').forEach(videoDom=>{
                _initHtmlDom.htmlObj.forEach(el=>{
                    videoDom.parentElement.insertBefore(_initHtmlDom.createDom(el),videoDom);
                });
            });
            setTimeout(()=>{
                let videoArr=document.querySelectorAll('video[data-bulletPlayer]'),
                containerArr=document.querySelectorAll('.playerContainer-bullet[data-bulletPlayer]');
                videoArr.forEach((el,i) => {
                    _initVideo(el,containerArr[i]);
                });
            },0);
        }else  return false;
    };
    this.playVideo=function(){
        if(!video) return false;
        video.play();
    };
    this.pauseVideo=function(){
        if(!video) return false;
        video.pause();
    };
    this.getVolume=function(){
        if(!video||!con) return false;
        volume=video.volume;
        let aw=con.querySelector('.volume').clientWidth,
            vh=con.querySelector('.volumeHandler'),
            vv=con.querySelector('.volumeValue'),
            vn=con.querySelector('.volumeNum');
        vh.style.left=(aw*volume-vh.clientWidth)+"px";
        vv.style.width=(aw*volume-vh.clientWidth/2)+"px";
        vn.innerHTML=volume*100;
        return volume;
    };
    this.setVolume=function(vol=1){
        if(!video||!con) return false;
        video.volume=vol;
        volume=vol;
        let aw=con.querySelector('.volume').clientWidth,
            vh=con.querySelector('.volumeHandler'),
            vv=con.querySelector('.volumeValue'),
            vn=con.querySelector('.volumeNum');
        vh.style.left=(aw*volume-vh.clientWidth)+"px";
        vv.style.width=(aw*volume-vh.clientWidth/2)+"px";
        vn.innerHTML=volume*100;
    };
    this.exitFullScreen=function(){
        if(!video||!con) return false;
        if(document.webkitFullscreenEnabled){
            _fullScreen=0;
            con.style.height='600px';
            _initData.initSize();
            _refresh.refreshUI();
        }
    };
    this.enterFullScreen=function(){
        if(!video) return false;
        if(document.webkitFullscreenEnabled){
            if(document.webkitCurrentFullScreenElement){
                document.webkitCurrentFullScreenElement.forEach(el=>{
                    if(el!=video)  el.webkitExitFullScreen();
                });
            }
            _fullScreen=1;
            con.style.height=window.innerHeight+'px';
            _initData.initSize();
            _refresh.refreshUI();
        }
    };

}