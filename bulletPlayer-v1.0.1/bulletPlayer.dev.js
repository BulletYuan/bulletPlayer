function bulletPlayer(obj){
    let SELF=this;
    let CTX=null,
        CAV=null,
        CON=null,
        VIDEO=null,

        HEIGHT=0,
        WIDTH=0,
        QUALITY=1,
        PLAYSRC="",
        VOLUME=1,  //音量 0~1
        DEBUG=true,
        TITLE="",

        _BUFFERED=0,  //已缓冲比例 0~1
        _PLAYED=0,  //已播放比例 0~1
        _CURRENT=0,  //当前所在时间点 单位s
        _DURATION=0,  //视频总时长 单位s
        _FULLSCREEN=0,  //0:非全屏 | 1:全屏 | -1:浏览器不支持全屏
        _AUTOPLAY=false,  //自动播放
        _LOOP=false,  //循环播放c
        _NETSTATE=0,  //0:NETWORK_EMPTY | 1:NETWORK_IDLE | 2:NETWORK_LOADING | 3:NETWORK_NO_SOURCE
        _STATUS=0,  //0:ended | 1:play | 2:pause | -1:error
        _INTERVAL=null;
    if(!obj||JSON.stringify(obj).indexOf('{')!==0)  obj={};
    TITLE=obj['title']||"";

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
                                'text':TITLE
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
            if(!VIDEO||!CON||!CAV) return false;
            QUALITY=QUALITY>1?1:QUALITY;
            let _w2h=0,vw=VIDEO.videoWidth,vh=VIDEO.videoHeight;
            if(vh>=CON.clientHeight) HEIGHT=CON.clientHeight;
            else  HEIGHT=vh;
            _w2h=vw/vh;
            WIDTH=HEIGHT*_w2h;
            CAV.height=HEIGHT*QUALITY;
            CAV.width=CAV.height*_w2h;
            CAV.style.width=(CAV.clientHeight*_w2h)+"px";
        },
        initParams:function(){
            if(!VIDEO) return false;
            clearInterval(_INTERVAL);
            _INTERVAL=null;
            PLAYSRC=VIDEO.currentSrc;
            VIDEO.volume=VOLUME;
            VIDEO.autoPlay=_AUTOPLAY;
            VIDEO.loop=_LOOP;
            VIDEO.controls=false;
        },
        resetParams:function(){
            _DURATION=0;
            _CURRENT=0;
            _BUFFERED=0;
            _PLAYED=_CURRENT/_DURATION;
            _NETSTATE=v.networkState;
            _AUTOPLAY=false;
            _LOOP=false;
            if(!document.webkitFullscreenEnabled)  _FULLSCREEN=-1;
            _STATUS=0;
            clearInterval(_INTERVAL);
            _INTERVAL=null;
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
            if(!VIDEO) return false;
            let v=VIDEO;

            _DURATION=v.duration;
            _CURRENT=v.currentTime;
            _BUFFERED=v.buffered.length>0?v.buffered.end(v.buffered.length-1)/_DURATION:0;
            _PLAYED=_CURRENT/_DURATION;
            _NETSTATE=v.networkState;
            _AUTOPLAY=v.autoplay;
            _LOOP=v.loop;
            if(!document.webkitFullscreenEnabled)  _FULLSCREEN=-1;

            if(v.ended)  _STATUS=0;
            if(v.played)  _STATUS=1;
            if(v.paused)  _STATUS=2;
            if(v.error)  _STATUS=-1;
        },
        refreshUI:function(){
            if(!VIDEO||!CON) return false;
            let buffBar=CON.querySelector('.buffBar'),
                playedBar=CON.querySelector('.playedBar'),
                handle=CON.querySelector('.handle'),
                duration=CON.querySelector('.duration');
            SELF.getVolume();
            _refresh.refreshUI_duration(duration);
            _refresh.refreshUI_buffBar(buffBar);
            _refresh.refreshUI_playedBar(playedBar,handle);
            _refresh.refreshUI_handle(handle);
        },
        refreshUI_canvas:function(){
            if(_STATUS===0 || _STATUS===-1)  _canvasControl._resetCav();
            if(_STATUS===1)  _canvasControl.drawCav();
            if(_STATUS===2)  _canvasControl.stopCav();
            _refresh.refreshUI();
        },
        refreshUI_duration:function(duration){
            if(duration)  duration.innerHTML=_tools.transformTime(_CURRENT)+" / "+_tools.transformTime(_DURATION);
            return duration;
        },
        refreshUI_buffBar:function(buffBar){
            if(buffBar)  buffBar.style.width=(_BUFFERED*100)+"%";
            return buffBar;
        },
        refreshUI_playedBar:function(playedBar,handle){
            if(playedBar&&handle)  playedBar.style.width=((_PLAYED*CON.clientWidth-handle.clientWidth/2)<=0?0:(_PLAYED*CON.clientWidth-handle.clientWidth/2))+"px";
            return playedBar;
        },
        refreshUI_handle:function(handle){
            if(handle)  handle.style.left=(_PLAYED*CON.clientWidth-handle.clientWidth/2)+"px";
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
            if(!CON||!CAV)  return false;
            let fs=CON.querySelector('.fullScreenBtn');
            if(_FULLSCREEN!=-1){
                fs.addEventListener('click',()=>{
                    if(_FULLSCREEN===0)  setTimeout(()=>{SELF.enterFullScreen();},100);
                    else  setTimeout(()=>{SELF.exitFullScreen();},100);
                },false);
            }
        },
        bindVolumeChanged:function(){
            if(!CON)  return false;
            let aw=CON.querySelector('.volume').clientWidth,
                v=CON.querySelector('.volume'),
                handle=CON.querySelector('.volumeHandler'),
                vv=CON.querySelector('.volumeValue'),
                vn=CON.querySelector('.volumeNum'),_dragState=2;  //0:touchstart/mousedown | 1:touchmove/mousemove |2:touchend/mouseup
             
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
                            VIDEO.volume=(Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth);
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
                            VIDEO.volume=(Number(vv.style.width.split('px')[0])-handle.clientWidth/2)/(aw-handle.clientWidth);
                        }
                    };
                    CON.onmouseleave=document.onmouseup=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        CON.onmouseleave=null;
                    };
                };
            }
        },
        bindMouseListener:function(){
            if(!CON)  return false;
            let _mX=0,_mY=0,_mT=null;
            CON.addEventListener('mousemove',function(ev){
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
            CON.addEventListener('mouseleave',function(ev){
                _mX=0,_mY=0;
                clearTimeout(_mT);
                _mT=null;
                _events.hideControlBar();
                _events.hideTitleBar();
                _events.hideCursor();
            });
        },
        bindKeysListener:function(){
            if(!CON)  return false;
            CON.addEventListener('keypress',function(ev){

            });
        },
        bindHandlerDrag:function(){
            if(!CON)   return false;
            let handle=CON.querySelector('.handle'),
             _dragState=2;  //0:touchstart/mousedown | 1:touchmove/mousemove |2:touchend/mouseup
             
            if(window.ontouchstart){
                handle.ontouchstart=function(ev){
                    _dragState=0;
                    document.ontouchmove=function(ev){
                        _dragState=1;
                        handle.style.left=(ev.clientX-handle.clientWidth/2)+'px';
                        VIDEO.currentTime=(ev.clientX/CON.clientWidth)*VIDEO.duration;
                        if(!VIDEO.paused)  VIDEO.pause();
                    };
                    document.ontouchend=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        VIDEO.play();
                    };
                };
            }else{
                handle.onmousedown=function(ev){
                    _dragState=0;
                    document.onmousemove=function(ev){
                        _dragState=1;
                        handle.style.left=(ev.clientX-handle.clientWidth/2)+'px';
                        VIDEO.currentTime=(ev.clientX/CON.clientWidth)*VIDEO.duration;
                        if(!VIDEO.paused)  VIDEO.pause();
                    };
                    document.onmouseup=function(){
                        _dragState=2;
                        document.onmousemove=null;
                        document.onmouseup=null;
                        VIDEO.play();
                    };
                };
            }
        },
        bindPlay:function(){
            if(!VIDEO||!CON||!CAV)   return false;
            CON.querySelectorAll('.playBtn').forEach(el=>{
                el.onclick=()=>{
                    if(_STATUS===0||_STATUS===2)  SELF.playVideo();
                    if(_STATUS===1)  SELF.pauseVideo();
                };
            });
            CON.querySelector('.playedCon').onclick=CAV.onclick=()=>{
                if(_STATUS===0||_STATUS===2)  SELF.playVideo();
                if(_STATUS===1)  SELF.pauseVideo();
            };
            VIDEO.addEventListener('play',function(){
                CON.querySelector('.playedCon').style.display='none';
                CON.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="pause";
                });
                _STATUS=1;
                _refresh.refreshUI_canvas();
            },false);
        },
        bindPause:function(){
            if(!VIDEO||!CON)   return false;
            VIDEO.addEventListener('pause',function(){
                CON.querySelector('.playedCon').style.display='block';
                CON.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="play";
                });
                clearInterval(_INTERVAL);
                _INTERVAL=null;
                _STATUS=2;
                _refresh.refreshParams();
                _refresh.refreshUI();
            },false);
        },
        bindEnded:function(){
            if(!VIDEO||!CON)   return false;
            VIDEO.addEventListener('ended',function(){
                CON.querySelector('.playedCon').style.display='block';
                CON.querySelectorAll('.playBtn').forEach(el=>{
                    el.innerHTML="play";
                });
                clearInterval(_INTERVAL);
                _INTERVAL=null;
                _STATUS=1;
                _events.getVideoPoster();
                _refresh.refreshParams();
                _refresh.refreshUI();
            },false);
        },
    };

    /**
     *  内部调用事件
     *      showLoading() :显示加载信息
     *      hideLoading() :隐藏加载信息
     *      showControlBar() :显示操控栏
     *      hideControlBar() :隐藏操控栏
     *      showTitleBar() :显示标题栏
     *      hideTitleBar() :隐藏标题栏
     *      showCursor() :显示鼠标
     *      hideCursor() :隐藏鼠标
     *      getVideoPoster() :获取video封面
     */
    let _events={
        showLoading:function(){
            CON.querySelector('.playedCon').style.display='block';
            CON.querySelectorAll('.playBtn').forEach(el=>{
                el.innerHTML="loading";
            });
        },
        hideLoading:function(){
            if(CON.querySelector('.playedCon').style.display=="block") CON.querySelector('.playedCon').style.display='block';
            CON.querySelectorAll('.playBtn').forEach(el=>{
                el.innerHTML="play";
            });
        },
        showControlBar:function(){
            if(!CON)  return false;
            CON.querySelector('.controlBar').style.bottom="0px";
        },
        hideControlBar:function(){
            if(!CON)  return false;
            CON.querySelector('.controlBar').style.bottom=`-${CON.querySelector('.controlBar').clientHeight-CON.querySelector('.progressBar').clientHeight}px`;
        },
        showTitleBar:function(){
            if(!CON)  return false;
            CON.querySelector('.titleBar').style.top="0px";
        },
        hideTitleBar:function(){
            if(!CON)  return false;
            CON.querySelector('.titleBar').style.top=`-${CON.querySelector('.titleBar').clientHeight}px`;
        },
        showCursor:function(){
            if(!CON||!CAV)  return false;
            CON.style.cursor='pointer';
            CAV.style.cursor='pointer';
        },
        hideCursor:function(){
            if(!CON||!CAV)  return false;
            CON.style.cursor='none';
            CAV.style.cursor='none';
        },
        getVideoPoster:function(){
            if(!VIDEO||!CAV||!CTX)  return false;
            if(VIDEO.currentTime!=0)  VIDEO.currentTime=0;
            setTimeout(()=>{CTX.drawImage(VIDEO, 0, 0, WIDTH, HEIGHT);},0);
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
            if(!CTX||!VIDEO||_STATUS!==1)   return false;
            clearInterval(_INTERVAL);
            _INTERVAL=null;
            _INTERVAL=setInterval(()=>{
                CTX.drawImage(VIDEO,0,0,WIDTH,HEIGHT);
                _refresh.refreshParams();
                _refresh.refreshUI();
            },33.3);
        },
        stopCav:function(){
            if(!CTX)   return false;
            CTX.drawImage(VIDEO,0,0,WIDTH,HEIGHT);
            clearInterval(_INTERVAL);
            _INTERVAL=null;
        },
        resetCav:function(){
            if(!CTX)   return false;
            clearInterval(_INTERVAL);
            _INTERVAL=null;
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
            if(DEBUG){
                if(type===0)  console.log('bulletPlayer',...arg);
                if(type===1)  console.info('bulletPlayer',...arg);
                if(type===2)  console.error('bulletPlayer',...arg);
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
    let _initVideo=function(v,c){
        CON=c,
        VIDEO=v,
        CAV=CON.querySelector('canvas');
        CTX=CAV.getContext('2d');
        CON.style=VIDEO.style;
        VIDEO.style.display='none';

        
        _events.showLoading();
        _initData.initParams();
        _events.showControlBar();
        _events.showTitleBar();
        _events.showCursor();
        //提示元数据开始加载
        VIDEO.addEventListener('loadstart',()=>{
            _tools.console(0,'loadstart');
        },false);
        //提示时长已改变
        VIDEO.addEventListener('durationchange',()=>{
            _tools.console(0,'durationchange');
            _refresh.refreshUI_duration();
            
            _bindListener.bindMouseListener();
            _events.hideControlBar();
            _events.hideTitleBar();
            _events.hideCursor();
        },false);
        //提示元数据已加载
        VIDEO.addEventListener('loadedmetadata',()=>{
            _tools.console(0,'loadedmetadata');
        },false);
        //提示当前帧的数据可用
        VIDEO.addEventListener('loadeddata',()=>{
            _tools.console(0,'loadeddata');

            _initData.initSize();
            _refresh.refreshParams();
            _refresh.refreshUI();
            _events.getVideoPoster();
        },false);
        //提示视频正在下载中
        VIDEO.addEventListener('progress',()=>{
            _tools.console(0,'progress');
            _refresh.refreshUI_buffBar();
        },false);
        //提示已准备好开始播放
        VIDEO.addEventListener('canplay',()=>{
            _tools.console(0,'canplay');
            _events.hideLoading();

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
            _events.getVideoPoster();
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
        if(!VIDEO) return false;
        VIDEO.play();
    };
    this.pauseVideo=function(){
        if(!VIDEO) return false;
        VIDEO.pause();
    };
    this.getVolume=function(){
        if(!VIDEO||!CON) return false;
        VOLUME=VIDEO.volume;
        let aw=CON.querySelector('.volume').clientWidth,
            vh=CON.querySelector('.volumeHandler'),
            vv=CON.querySelector('.volumeValue'),
            vn=CON.querySelector('.volumeNum');
        vh.style.left=(aw*VOLUME-vh.clientWidth)+"px";
        vv.style.width=(aw*VOLUME-vh.clientWidth/2)+"px";
        vn.innerHTML=VOLUME*100;
        return VOLUME;
    };
    this.setVolume=function(vol=1){
        if(!VIDEO||!CON) return false;
        VIDEO.volume=vol;
        VOLUME=vol;
        let aw=CON.querySelector('.volume').clientWidth,
            vh=CON.querySelector('.volumeHandler'),
            vv=CON.querySelector('.volumeValue'),
            vn=CON.querySelector('.volumeNum');
        vh.style.left=(aw*VOLUME-vh.clientWidth)+"px";
        vv.style.width=(aw*VOLUME-vh.clientWidth/2)+"px";
        vn.innerHTML=VOLUME*100;
    };
    this.exitFullScreen=function(){
        if(!VIDEO||!CON) return false;
        if(document.webkitFullscreenEnabled){
            _FULLSCREEN=0;
            CON.style.height='600px';
            _initData.initSize();
            _refresh.refreshUI();
        }
    };
    this.enterFullScreen=function(){
        if(!VIDEO) return false;
        if(document.webkitFullscreenEnabled){
            if(document.webkitCurrentFullScreenElement){
                document.webkitCurrentFullScreenElement.forEach(el=>{
                    if(el!=VIDEO)  el.webkitExitFullScreen();
                });
            }
            _FULLSCREEN=1;
            CON.style.height=window.innerHeight+'px';
            _initData.initSize();
            _refresh.refreshUI();
        }
    };

}