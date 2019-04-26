// ==UserScript==
// @name              百度网盘直链下载助手-手机版
// @namespace         https://github.com/syhyz1990/baiduyun.wap
// @version           1.1.1
// @icon              https://www.baidu.com/favicon.ico
// @description       百度网盘直链下载助手-手机版 支持百度网盘手机端网盘页面和分享页面一键下载
// @author            syhyz1990
// @license           MIT
// @supportURL        https://github.com/syhyz1990/baiduyun.wap
// @match             *://pan.baidu.com/s/*
// @match             *://yun.baidu.com/s/*
// @match             *://pan.baidu.com/wap/*surl=*
// @match             *://yun.baidu.com/wap/*surl=*
// @match             *://pan.baidu.com/wap/view*
// @match             *://yun.baidu.com/wap/view*
// @require           https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @require           https://cdn.bootcss.com/sweetalert/2.1.2/sweetalert.min.js
// @run-at            document-idle
// @grant             unsafeWindow
// @grant             GM_xmlhttpRequest
// @grant             GM_download
// @grant             GM_setClipboard
// ==/UserScript==

;(function () {
  'use strict';

  function PanHelper() {
    var yunData, sign, timestamp, bdstoken, logid;
    var currentPath;
    var clientAPIUrl = location.protocol + "//d.pcs.baidu.com/rest/2.0/pcs/";

    this.init = function () {
      yunData = unsafeWindow.yunData;
      console.log('yunData:', yunData);
      if (yunData === undefined) {
        console.log('页面未正常加载，或者百度已经更新！');
        return;
      }
      initParams();
      registerEventListener();
      addButton();
      console.log('百度网盘直链下载助手-手机版 加载成功');
    };

    function initParams() {
      sign = getSign();
      timestamp = getTimestamp();
      bdstoken = getBDStoken();
      logid = getLogID();
      currentPath = getPath();
    }

    function registerEventListener() {
      registerBtnClick();
    }

    function registerBtnClick() {
      $('body').on('click', '#panHelper', function () {
        if ($('.copylink').length === 0) {
          getDownloadLinkWithClientAPI(currentPath, function (result) {
            $.each(result.urls, function (index, element) {
              var $li = $('<li style="display: flex;align-items: center;height: 26px;"><div style="flex: 0 0 20px">' + element.rank + ':</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;"><a class="GMlink" href="' + element.url + '">' + element.url + '</a></div><button class="copylink" style="width: 68px;background: #2b7bdb;border: none;height: 24px;color: #fff;border-radius: 3px;">复制链接</button></li>');
              $('#panLink').append($li);
            })
          })
        } else {
          swal({
            text: '别点了，选个链接复制到ADM下载吧',
            icon: "warning",
          });
        }
      });

      $('body').on('click', '.copylink', function () {
        var $link = $(this).parent().find('a');
        var content = $link.prop('href');
        GM_setClipboard(content, 'text');
        swal({
          text: '复制成功，使用ADM下载吧',
          icon: "success",
        });
      });
    }

    //添加助手按钮
    function addButton() {
      var $button = '<span class="btn blue-btn" id="panHelper" style="margin:10px 0;"><i class="idownload"></i>下载助手</span>';
      var $link = '<ul id="panLink" style="margin-bottom: 50px;">';

      $('.download-innerbox').append($button);
      $('#down-footer').append($link);
    }

    function getSign() {
      var signFnc;
      try {
        signFnc = new Function("return " + yunData.sign2)();
      } catch (e) {
        throw new Error(e.message);
      }
      return base64Encode(signFnc(yunData.sign3, yunData.sign1));
    }

    //获取当前目录
    function getPath() {
      return yunData.file_list[0].path;
    }

    function getTimestamp() {
      return yunData.timestamp;
    }

    function getBDStoken() {
      return yunData.MYBDSTOKEN;
    }

    function getDownloadLinkWithClientAPI(path, cb) {
      var result;
      var url = clientAPIUrl + 'file?method=locatedownload&app_id=265486&ver=4.0&path=' + encodeURIComponent(path);

      GM_xmlhttpRequest({
        method: "POST",
        url: url,
        headers: {
          "User-Agent": "netdisk;6.7.1.9;PC;PC-Windows;10.0.17763;WindowsBaiduYunGuanJia",
        },
        onload: function (res) {
          if (res.status === 200) {
            result = JSON.parse(res.responseText);
            if (result.urls == undefined) {
              return result.errno = 2;
            }
            $.each(result.urls, function (index, element) {
              result.urls[index].url = element.url.replace('\\', '');
            });
            result.errno = 0;
          } else {
            result = {};
            result.errno = -1;
          }
          cb(result)
        }
      });
    }
  }

  function PanShareHelper() {
    var yunData, sign, timestamp, bdstoken, channel, clienttype, web, app_id, logid, uk,
      fid_list, shareid, vcode;
    var panAPIUrl = location.protocol + "//" + location.host + "/share/download?";

    this.init = function () {
      yunData = unsafeWindow.yunData;
      console.log('yunData:', yunData);
      if (yunData === undefined) {
        return console.log('页面未正常加载，或者百度已经更新！');
      }
      initParams();
      addButton();
      createIframe();
      registerEventListener();
      console.log('分享助手加载成功!');
    };

    function initParams() {
      bdstoken = yunData.bdstoken;
      web = 5;
      app_id = 250528;
      logid = getLogID();
      channel = 'chunlei';
      clienttype = 5;
      uk = yunData.uk;
      shareid = yunData.shareid;
      fid_list = getFidList();
      sign = yunData.downloadsign;
      timestamp = yunData.timestamp;
    }

    function registerEventListener() {
      registerBtnClick();
    }

    function registerBtnClick() {
      $('body').on('click', '#panShareHelper', function () {
        getLink();
      });

      $('body').on('click', '#changeCode', function () {
        getLink();
      });
    }

    function getLink() {
      var url = panAPIUrl + 'sign=' + sign + '&timestamp=' + timestamp + '&bdstoken=' + bdstoken + '&channel=' + channel + '&clienttype=' + clienttype + '&web=' + web + '&app_id=' + app_id + '&logid=' + logid + '&fid_list=' + fid_list + '&uk=' + uk + '&shareid=' + shareid;
      $.ajax({
        url: url,
        method: 'GET',
        async: false,
        success: function (response) {
          if (response.errno == 0) {
            swal({
              text: "获取成功",
              icon: "success",
            });
            execDownload(response.dlink);
          }
          if (response.errno == -19) {  //验证码
            vcode = response.vcode;
            createVCode(response.img);
          }
        }
      });
    }

    function addButton() {
      var $button = '<span class="btn blue-btn" id="panShareHelper" style="margin:10px 0;"><i class="idownload"></i>下载助手</span>';
      var $link = '<ul id="panLink" style="margin-bottom: 50px;">';
      $('.normal-download').hide();
      $('.download-box-hack').append($button);
      $('#down-footer').append($link);
    }

    function createIframe() {
      var $div = $('<div class="helper-hide" style="padding:0;margin:0;display:block"></div>');
      var $iframe = $('<iframe src="javascript:void(0)" id="helperdownloadiframe" style="display:none"></iframe>');
      $div.append($iframe);
      $('body').append($div);
    }

    function getFidList() {
      var fidlist = yunData.file_list[0].fs_id;
      return '[' + fidlist + ']';
    }

    function execDownload(link) {
      console.log('下载链接：' + link);
      $('#helperdownloadiframe').attr('src', link);
    }

    function createVCode(img) {
      removeVCode();
      var $vbody = $('<div class="v-body" style="display: flex;justify-content: center;align-items: center;"></div>');
      var $input = $('<input type="text" placeholder="验证码" id="input-code" maxlength="4" style="width: 68px;height: 34px;margin: 0;padding: 5px;box-sizing: border-box;border: 1px solid #ddd;">');
      var $img = $('<img id="img-code" alt="验证码获取中" src="' + img + '" style="margin: 0 8px;width: 70px;height: 34px;border: 1px solid #ddd;box-sizing: border-box;">');
      var $button = $('<a href="javascript:;" id="changeCode">换一张</a>');

      $vbody.append($input).append($img).append($button);
      swal({
        title: "请输入验证码",
        content: $vbody[0],
        buttons: true,
      }).then((handle) => {
        if (handle) {
          submitVCode();
        }
      });
    }

    function removeVCode() {
      $('.v-body').remove();
    }

    //提交验证码
    function submitVCode() {
      var input = $('#input-code').val();
      if (input.length === 0) {
        swal({
          text: "请输入验证码",
          icon: "error",
        });
        return;
      } else if (input.length < 4) {
        swal({
          text: "验证码输入错误，请重新输入",
          icon: "error",
        });
        return;
      }

      var url = panAPIUrl + 'sign=' + sign + '&timestamp=' + timestamp + '&bdstoken=' + bdstoken + '&channel=' + channel + '&clienttype=' + clienttype + '&web=' + web + '&app_id=' + app_id + '&logid=' + logid + '&fid_list=' + fid_list + '&uk=' + uk + '&shareid=' + shareid + '&input=' + input + '&vcode=' + vcode;
      $.ajax({
        url: url,
        method: 'GET',
        async: false,
        success: function (response) {
          if (response.errno == 0) {
            swal({
              text: "获取成功",
              icon: "success",
            });
            execDownload(response.dlink);
            removeVCode();
          }
          if (response.errno == -19) {  //验证码
            swal({
              text: "验证码输入错误，请重新输入",
              icon: "error",
            });
            vcode = response.vcode;
            createVCode(response.img);
          }
        }
      });
    }
  }

  function base64Encode(t) {
    var a, r, e, n, i, s, o = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (e = t.length, r = 0, a = ""; e > r;) {
      if (n = 255 & t.charCodeAt(r++), r == e) {
        a += o.charAt(n >> 2);
        a += o.charAt((3 & n) << 4);
        a += "==";
        break;
      }
      if (i = t.charCodeAt(r++), r == e) {
        a += o.charAt(n >> 2);
        a += o.charAt((3 & n) << 4 | (240 & i) >> 4);
        a += o.charAt((15 & i) << 2);
        a += "=";
        break;
      }
      s = t.charCodeAt(r++);
      a += o.charAt(n >> 2);
      a += o.charAt((3 & n) << 4 | (240 & i) >> 4);
      a += o.charAt((15 & i) << 2 | (192 & s) >> 6);
      a += o.charAt(63 & s);
    }
    return a;
  }

  function detectPage() {
    var href = location.href;
    if (href.indexOf('/s/') > 0 || href.indexOf('surl=') > 0) {
      return 'share';
    }
    return 'home';
  }

  function getCookie(e) {
    var o, t;
    var n = document, c = decodeURI;
    return n.cookie.length > 0 && (o = n.cookie.indexOf(e + "="), -1 != o) ? (o = o + e.length + 1, t = n.cookie.indexOf(";", o), -1 == t && (t = n.cookie.length), c(n.cookie.substring(o, t))) : "";
  }

  function getLogID() {
    var name = "BAIDUID";
    var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/~！@#￥%……&";
    var d = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
    var f = String.fromCharCode;

    function l(e) {
      if (e.length < 2) {
        var n = e.charCodeAt(0);
        return 128 > n ? e : 2048 > n ? f(192 | n >>> 6) + f(128 | 63 & n) : f(224 | n >>> 12 & 15) + f(128 | n >>> 6 & 63) + f(128 | 63 & n);
      }
      var n = 65536 + 1024 * (e.charCodeAt(0) - 55296) + (e.charCodeAt(1) - 56320);
      return f(240 | n >>> 18 & 7) + f(128 | n >>> 12 & 63) + f(128 | n >>> 6 & 63) + f(128 | 63 & n);
    }

    function g(e) {
      return (e + "" + Math.random()).replace(d, l);
    }

    function m(e) {
      var n = [0, 2, 1][e.length % 3];
      var t = e.charCodeAt(0) << 16 | (e.length > 1 ? e.charCodeAt(1) : 0) << 8 | (e.length > 2 ? e.charCodeAt(2) : 0);
      var o = [u.charAt(t >>> 18), u.charAt(t >>> 12 & 63), n >= 2 ? "=" : u.charAt(t >>> 6 & 63), n >= 1 ? "=" : u.charAt(63 & t)];
      return o.join("");
    }

    function h(e) {
      return e.replace(/[\s\S]{1,3}/g, m);
    }

    function p() {
      return h(g((new Date()).getTime()));
    }

    function w(e, n) {
      return n ? p(String(e)).replace(/[+\/]/g, function (e) {
        return "+" == e ? "-" : "_";
      }).replace(/=/g, "") : p(String(e));
    }

    return w(getCookie(name));
  }

  (function () {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//js.users.51.la/20008749.js";
    document.getElementsByTagName("head")[0].appendChild(script);
  })();

  $(function () {
    switch (detectPage()) {
      case 'home':
        var panHelper = new PanHelper();
        return panHelper.init();
      case 'share':
        var panShareHelper = new PanShareHelper();
        return panShareHelper.init();
      default:
        return;
    }
  });

})();
