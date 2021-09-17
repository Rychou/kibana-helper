// ==UserScript==
// @name         kibana 日志辅助工具
// @namespace    http://tampermonkey.net/
// @version      0.10.11
// @description  
// @author       You
// @match        http://esa.kibana.qcloud.com/app/kibana
// @match        http://es-ioknxgy0.internal.kibana.tencentelasticsearch.com/app/kibana
// @grant        none
// @require https://unpkg.com/pagemap@1.4.0/dist/pagemap.js
// ==/UserScript==
(async function () {
  "use strict";
  await loadJS("https://unpkg.com/@popperjs/core@2");
  await loadJS("https://unpkg.com/tippy.js@6");
  // eslint-ignore
  try {
    // 当 table 高度变化时，重新执行一次 start
    let tableHeight = 0;
    let tippyCount = 0;
    let timer = -1;
    const ipv4Pattern = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;
    const ipv6Pattern = /^([\da-fA-F]{1,4}:){6}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^::([\da-fA-F]{1,4}:){0,4}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:):([\da-fA-F]{1,4}:){0,3}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){2}:([\da-fA-F]{1,4}:){0,2}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){3}:([\da-fA-F]{1,4}:){0,1}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){4}:((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^:((:[\da-fA-F]{1,4}){1,6}|:)$|^[\da-fA-F]{1,4}:((:[\da-fA-F]{1,4}){1,5}|:)$|^([\da-fA-F]{1,4}:){2}((:[\da-fA-F]{1,4}){1,4}|:)$|^([\da-fA-F]{1,4}:){3}((:[\da-fA-F]{1,4}){1,3}|:)$|^([\da-fA-F]{1,4}:){4}((:[\da-fA-F]{1,4}){1,2}|:)$|^([\da-fA-F]{1,4}:){5}:([\da-fA-F]{1,4})?$|^([\da-fA-F]{1,4}:){6}:$/;
    const infoMap = {
      "play() error: NotAllowedError:": {
          tips: "自动播放受限导致播放失败",
          color: 'red',
          class: 'red'
      },
      "updateStream() try to recover local stream": {
        tips: "摄像头/麦克风拔出，正在尝试自动恢复采集",
      },
      "updateStream() recover local stream successfully": {
        tips: "摄像头/麦克风拔出，自动恢复采集成功",
      },
      "updateStream() failed to recover local stream": {
        tips: "摄像头/麦克风拔出，自动恢复采集失败",
      },
      "main stream - video track is muted": {
        tips:
          "表示收到的视频数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "main stream - audio track is muted": {
        tips:
          "表示收到的音频数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "auxiliary stream - video track is muted": {
        tips:
          "表示收到的屏幕分享数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "main stream - video track is unable to provide media output": {
        tips:
          "表示收到的视频数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "main stream - audio track is unable to provide media output": {
        tips:
          "表示收到的音频数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "auxiliary stream - video track is unable to provide media output": {
        tips:
          "表示收到的屏幕分享数据暂不足以播放，一般是网络原因引起，当收到足够播放的数据会变成 unmuted 状态。",
      },
      "main stream - video track is unmuted": {
        tips: "收到了足够播放的视频数据",
      },
      "main stream - audio track is unmuted": {
        tips: "收到了足够播放的音频数据",
      },
      "auxiliary stream - video track is unmuted": {
        tips: "收到了足够播放的屏幕分享数据",
      },
      "main stream - audio player track is ended": {
        tips: "远端音频轨道停止",
      },
      "main stream - video player track is ended": {
        tips: "远端视频轨道停止",
      },
      "auxiliary stream - video player track is ended": {
        tips: "远端屏幕分享轨道停止",
      },
      "stream - video track is muted": {
        tips:
          "摄像头采集暂停，通常是设备被其他应用占用、浏览器媒体权限被回收导致，需要客户重新采集。",
        color: 'orange',
      },
      "stream - video track is unable to provide media output": {
        tips:
          "摄像头采集暂停，通常是设备被其他应用占用、浏览器媒体权限被回收导致，需要客户重新采集。",
        color: 'orange',
      },
      "stream - video player track is ended": {
        tips:
          "摄像头采集停止，通常是设备被拔出导致，这种情况 SDK 会自动恢复采集，接入侧无需处理。也有可能是设备被其他应用占用、浏览器媒体权限被回收导致，建议此时在页面提醒用户重新采集。",
      },
      "stream - audio track is muted": {
        tips:
          "麦克风采集暂停，通常是设备被其他应用占用、浏览器媒体权限被回收导致，需要客户重新采集。",
        color: 'orange',
      },
      "stream - audio track is unable to provide media output": {
        tips:
          "麦克风采集暂停，通常是设备被其他应用占用、浏览器媒体权限被回收导致，需要客户重新采集。",
        color: 'orange',
      },
      "stream - audio player track is ended": {
        tips:
          "麦克风采集停止，通常是设备被拔出导致，这种情况 SDK 会自动恢复采集，接入侧无需处理。也有可能是设备被其他应用占用、浏览器媒体权限被回收导致，建议此时在页面提醒用户重新采集。",
      },
      "downlink network quality change": {
        tips: "下行网络变更，1: 极佳，2：较好，3：一般，4：较差，5：极差",
      },
      "uplink network quality change": {
        tips: "上行网络变更，1: 极佳，2：较好，3：一般，4：较差，5：极差",
      },
      "localStream mute video": {
        tips: "mute 上行视频流",
        color: 'orange',
      },
      "localStream unmute video": {
        tips: "unmute 上行视频流",
        color: 'orange'
      },
      "localStream mute audio": {
        tips: "mute 上行音频流",
        color: 'orange'
      },
      "localStream unmute audio": {
        tips: "unmute 上行音频流",
        color: 'orange'
      },
      "black detected": {
        tips:
          "检测到黑屏，表示当前 fps = 0。通常是网络引起，网络恢复后会恢复正常。若网络正常时，一直未恢复，则为异常情况。",
      },
      'main stream start to play with options: {"muted":true}': {
        tips: '以静音的方式播放远端流，一般远端流不需要静音播放，需确认客户 stream.play 接口调用的传参是否正确。',
        color: 'orange'
      },
      'main stream - audio player is starting playing': {
        tips: '远端流音频播放成功',
        color: '#0dd90d',
        class: 'success'
      },
      'main stream - video player is starting playing': {
        tips: '远端流视频播放成功',
        color: '#0dd90d',
        class: 'success'
      },
      'stream - video player is starting playing': {
        tips: '本地视频播放成功',
        color: '#0dd90d',
        class: 'success'
      },
      'stream - audio player is starting playing': {
        tips: '本地音频播放成功',
        color: '#0dd90d',
        class: 'success'
      },
      'gotStream': {
        tips: '本地流采集成功'
      },
      'local stream is published successfully': {
        tips: '推流成功',
        color: '#0dd90d',
        class: 'success'
      },
      'encoderImplementation change to OpenH264': {
        tips: '使用软编'
      },
      'encoderImplementation change to ExternalEncoder': {
        tips: '使用硬编'
      },
      'getUserMedia with constraints': {
        tips: '开始采集'
      },
      'client-banned': {
        tips: '被踢出房间',
        color: 'red',
        class: 'red',
        textColor: '#fff'
      },
    };

    function start() {
      try {
        if (!document.getElementsByClassName("table")[0]) {
          timer = setTimeout(start, 2000);
          return;
        }
        // log 在 table 的第几列
        const logCellIndex = [
          ...document.getElementsByClassName("table")[0].tHead.rows[0].cells,
        ].findIndex((item) => item.innerText.trim() === "log");

        // 日志列表
        const logList = [
          ...document
            .getElementsByClassName("table")[0]
            .tBodies[0].getElementsByClassName("discover-table-row"),
        ].map((item) => item.cells[logCellIndex]);

        const keys = Object.keys(infoMap);

        logList.forEach((item) => {
          let tempInnerHTML = item.innerHTML;
          // 1. 给日志添加背景，更易区分不同级别的日志
          tempInnerHTML = item.innerText
            .split("\n")
            .map((log) => {
              log = log.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
              if (log.includes("WARN")) {
                return `<span class='orange' style="background:orange; color:#fff;">${log}</span>`;
              }
              if (log.includes("ERROR") || log.includes("error")) {
                return `<span class='red' style="background:red; color:#fff;">${log}</span>`;
              }
              if (log.includes("failed")) {
                return `<span class='red' style="background:red; color:#fff;">${log}</span>`;
              }
              // 高亮 ipv4
              if (log.includes("clientIp:")) {
                const ipList = log.match(ipv4Pattern);
                ipList.forEach((ip) => {
                  log = log.replaceAll(
                    ip,
                    `<a href="https://ip.oa.com/search/?ip=${ip}" target="_blank"><span class='ip' style="background:#e1dfdf">${ip}</span></a>`
                  );
                });
                return log;
              }
              return log;
            })
            .join("\n");

          // 2. 给特殊日志增加 tooltips
          keys.forEach((key) => {
            if (item.innerText.includes(key)) {
              const id = `tooltip-${tippyCount}`;
              tempInnerHTML = tempInnerHTML.replaceAll(
                new RegExp(`${escapedStringToReg(key)}(?!\<\/span)`, "gi"),
                `<span id="${id}" class='${infoMap[key].class || infoMap[key].color || 'gray'}' style="background:${infoMap[key].color || '#e1dfdf'}; color: ${infoMap[key].textColor || '#000'}">${key}</span>`
              );
              setTimeout(() => {
                tippy(document.getElementById(`${id}`), {
                  content: infoMap[key].tips,
                });
              }, 500);
              tippyCount++;
            }
          });

          item.innerHTML = tempInnerHTML;
        });

        tableHeight = document.getElementsByClassName("table")[0].clientHeight;
        initMiniMap();
        initExportLogButton();
      } catch (error) {}
    }
    start();
    // 当 table 高度变化时，重新执行一次。TODO: 后续可以改成拦截 kibana 拉日志请求，请求成功后执行一次 start
    setInterval(() => {
      if (
        document.getElementsByClassName("table")[0] &&
        document.getElementsByClassName("table")[0].clientHeight !== tableHeight
      ) {
        start();
      }
    }, 2000);
  } catch (error) {
    console.error(error);
  }
})();

// 将字符中的特殊字符添加转义符
function escapedStringToReg(string) {
  return string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
function loadJS(url) {
  return new Promise((resolve) => {
    var script = document.createElement("script"),
      fn = resolve || function () {};
    script.type = "text/javascript";
    if (script.readyState) {
      script.onreadystatechange = function () {
        if (script.readyState == "loaded" || script.readyState == "complete") {
          script.onreadystatechange = null;

          fn();
        }
      };
    } else {
      //其他浏览器
      script.onload = function () {
        fn();
      };
    }

    script.src = url;

    document.getElementsByTagName("head")[0].appendChild(script);
  });
}


function initMiniMap() {
  if (document.querySelector('#mini-map')) {
    document.body.removeChild(document.querySelector('#mini-map'));
  }
  if (document.querySelector('#toggle-mini-map')) {
      document.body.removeChild(document.querySelector('#toggle-mini-map'));
  }
  const canvas = document.createElement('canvas');
  canvas.id = 'mini-map';
  canvas.style = 'position: fixed; top: 0px; right: 0px;width:120px; mix-width:120px; height: 100vh; z-index: 100; cursor: pointer;';

  let showMinimap = true;
  const toggleButton = document.createElement('button');
  toggleButton.id = 'toggle-mini-map'
  toggleButton.innerText = '关闭预览';
  toggleButton.style = `    font-weight: 400;
    text-align: center;
    vertical-align: middle;
    user-select: none;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out 0s, background-color 0.15s ease-in-out 0s, border-color 0.15s ease-in-out 0s, box-shadow 0.15s ease-in-out 0s;
    position: fixed;
    z-index: 100;
    right: 120px;
    top: 48px;
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;`
  toggleButton.onclick = () => {
      showMinimap = !showMinimap;
      toggleButton.innerText = showMinimap ? '关闭预览' : '开启预览'
      canvas.style.visibility = showMinimap ? 'visible' : 'hidden';
  }
  document.body.appendChild(canvas, null);
  document.body.appendChild(toggleButton, null);
  pagemap(document.querySelector('#mini-map'), {
    viewport: null,
    styles: {
        'tr': 'rgba(0,0,0,0.10)',
        '.red': 'red',
        '.orange': 'orange',
        '.gray': 'gray',
        '.success': '#0dd90d',
        '.ip': '#3c87e8'
    },
    back: 'rgba(0,0,0,0.02)',
    view: 'rgba(0,0,0,0.05)',
    drag: 'rgba(0,0,0,0.10)',
    interval: null
});
}

function initExportLogButton() {
  const button = document.createElement('button');
  button.innerText = '导出日志';
  button.style = `    font-weight: 400;
    text-align: center;
    vertical-align: middle;
    user-select: none;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out 0s, background-color 0.15s ease-in-out 0s, border-color 0.15s ease-in-out 0s, box-shadow 0.15s ease-in-out 0s;
    position: fixed;
    z-index: 100;
    right: 120px;
    top: 100px;
    color: #fff;
    background-color: #007bff;
    border-color: #007bff;`
  button.onclick = () => {
    const logs = [...document.querySelectorAll('.discover-table-datafield')].map(item => item.innerText);
    download('log.txt', logs.join('\n'));
  }
  document.body.appendChild(button, null);
}

function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}
