# bulletPlayer

a video-player by canvas

## modifiy at 2018-4-11

_使用canvas绘制实现video内容输出_


* _待解决问题_

  > _移动端全屏横屏，双击全屏,全屏后的画布尺寸适配，显示/隐藏水印，开启/关闭弹幕。_


* _调用方法_：

```
let bp=new bulletPlayer();

bp.init();
```


* _参数说明_：

`bulletPlayer(obj)`

obj {

    title:"",       //视频标题，默认为""，为空则不显示标题栏

    debug:true,     //组件调试模式，默认为true，控制台会输出调试信息

    stream:false,   //流模式，默认为false，视频源为帧图片流（base64）

    fps:1000/30,    //帧频，默认为1000/30，即1/30秒绘制一帧

    quality:1,      //画面质量，默认为1,范围为0-1

    volume:1,       //视频音量，默认为1,范围为0-1

    src:""          //视频源地址，默认为""

}


* _调用方法_：

```
bp.init() //组件初始化，将原有video元素隐藏，并返回对象

bp.getVolume() //获取video音量，并返回音量

bp.setVolume(vol=1) //设置video音量，并返回音量

bp.exitFullScreen() //退出全屏，并返回对象

bp.enterFullScreen() //进入全屏，并返回对象


bp.onCreate(fn="") //当组件开始创建htmldom时增加事件，并返回对象

bp.onInit(fn="") //当组件初始化时增加事件，并返回对象

bp.onRefresh(fn="") //当组件每次UI刷新时增加事件，并返回对象

```


* _当开启流模式时_

```
bp.draw(stream="",fn="") //绘制帧流，建议在循环绘制中调用，并返回对象

bp.clean(fn="") //清理当前画布，并返回对象

```


* _当关闭流模式时_

```
bp.playVideo() //播放video，并返回对象

bp.pauseVideo() //暂停video，并返回对象


bp.onVideoLoadStart(fn="") //当元数据开始加载时增加事件，并返回对象

bp.onVideoDurationChange(fn="") //当时长已改变时增加事件，并返回对象

bp.onVideoLoadedMetaData(fn="") //当元数据已加载时增加事件，并返回对象

bp.onVideoLoadedData(fn="") //当当前帧的数据可用时增加事件，并返回对象

bp.onVideoProgressData(fn="") //当视频正在下载中时增加事件，并返回对象

bp.onVideoCanPlay(fn="") //当已准备好开始播放时增加事件，并返回对象

bp.onResize(fn="") //当页面尺寸改变时增加事件，并返回对象

bp.onVideoPlay(fn="") //监听video播放时增加事件，并返回对象

bp.onVideoPause(fn="") //监听video暂停时增加事件，并返回对象

bp.onVideoEnded(fn="") //监听video结束时增加事件，并返回对象

```
