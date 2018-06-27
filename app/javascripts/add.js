/* version: 1.0.0, updated: 2018-04-08.12:36:49 */
function init(t) {
    0 == window.parent.document.body.hasAttribute("data-ci-geo") ? AjaxUI.request(location.protocol + "//www.connectignite.com/feed0/ip2.php?url=" + encodeURIComponent(window.location.href) + "&uid=" + ci_ii_uid, "GET", null, function(e) {
        var i = e.countryCode.toLowerCase()
          , n = e.keyword
          , o = e.user
          , r = e.uip;
        window.parent.document.body.setAttribute("data-ci-geo", i),
        window.parent.document.body.setAttribute("data-ci-uid", ci_ii_uid),
        window.parent.document.body.setAttribute("data-ci-uip", r),
        window.parent.document.body.setAttribute("data-ci-keyword", n),
        window.parent.document.body.setAttribute("data-ci-user", o),
        t(),
        (new Image).src = location.protocol + "//www.connectignite.com/trackpi.php?uid=" + ci_ii_uid + "&geo=" + i + "&track=1&url=" + encodeURIComponent(window.location.href) + "&d=" + set_device
    }, function() {
        (new Image).src = location.protocol + "//www.connectignite.com/trackmi.php?uid=" + ci_ii_uid + "&geo=none&track=3&d=&url=" + encodeURIComponent(window.location.href)
    }) : t()
}
function userSyncing(t, e, i) {
    var n = ""
      , o = window.document
      , r = o.cookie.match(new RegExp(t + "=([^;]+)"));
    if (r && (n = r[1]),
    "" === n) {
        var a = window.parent.location.protocol + "//" + window.parent.location.hostname
          , c = o.createElement("iframe");
        c.setAttribute("sandbox", "allow-same-origin"),
        c.setAttribute("id", t),
        c.setAttribute("src", "" + e + encodeURI(a) + "%2F%3Fuid%3D" + i),
        c.setAttribute("width", "1"),
        c.setAttribute("height", "1"),
        c.onload = function() {
            if (o.getElementById(t)) {
                var e = o.getElementById(t).contentWindow.location.href;
                n = e.split("?uid=")[1];
                var i = new Date;
                i.setTime(i.getTime() + 2592e6);
                var r = "expires=" + i.toUTCString();
                o.cookie = t + "=" + n + ";" + r + ";path=/",
                o.body.setAttribute("data-ci-" + t, n)
            }
        }
        ,
        o.body.appendChild(c)
    } else
        o.body.setAttribute("data-ci-" + t, n)
}
localStorage.removeItem("ci_itc"),
function(t) {
    "use strict";
    function e() {
        for (var t, e, i = 0, r = n.length; i < r; i++) {
            t = n[i];
            for (var a, c = 0, d = (e = o.querySelectorAll(t.selector)).length; c < d; c++) {
                a = e[c];
                if (".entry-content img".indexOf("img") > -1) {
                    if (a.width >= 250 && a.height >= 120 && !a.ready) {
                        var l = a.width
                          , p = a.height;
                        a.ready = !0,
                        localStorage.ci_itc ? localStorage.ci_itc = Number(localStorage.ci_itc) + 1 : localStorage.setItem("ci_itc", 1),
                        a.setAttribute("data-img", localStorage.ci_itc),
                        t.fn.call(a, a, l, p, localStorage.ci_itc)
                    }
                } else if (a.offsetWidth >= 250 && a.offsetHeight >= 120 && !a.ready) {
                    var l = a.offsetWidth
                      , p = a.offsetHeight;
                    a.ready = !0,
                    localStorage.ci_itc ? localStorage.ci_itc = Number(localStorage.ci_itc) + 1 : localStorage.setItem("ci_itc", 1),
                    a.setAttribute("data-img", localStorage.ci_itc),
                    t.fn.call(a, a, l, p, localStorage.ci_itc)
                }
            }
        }
    }
    var i, n = [], o = t.parent.document, r = t.MutationObserver || t.WebKitMutationObserver;
    t.ready = function(t, a) {
        n.push({
            selector: t,
            fn: a
        }),
        i || (i = new r(e)).observe(o.documentElement, {
            childList: !0,
            subtree: !0
        }),
        e()
    }
}(this);
var ci_ii_uid = "15653"
  , AjaxUI = {
    xhr: null,
    request: function(t, e, i, n, o) {
        this.xhr || (this.xhr = window.ActiveX ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest);
        var r = this.xhr;
        r.onreadystatechange = function() {
            if (4 === r.readyState && 200 === r.status) {
                var t = JSON.parse(r.responseText);
                n(t)
            } else
                4 === r.readyState && o()
        }
        ,
        this.xhr.open(e, t),
        this.xhr.send()
    }
};
if (navigator.userAgent.match(/Tablet|iPad/i))
    var set_device = "t";
else if (navigator.userAgent.match(/IEMobile|Windows Phone|Lumia|Android|webOS|iPhone|iPod|Blackberry|PlayBook|BB10|Mobile Safari|Opera Mini|\bCrMo\/|Opera Mobi/i)) {
    var set_device = "m";
    window.parent.document.body.style.overflow = "hidden"
} else
    var set_device = "d";
init(function() {
    ready(".entry-content img", function(t, e, i, n) {
        var o = location.protocol
          , r = "263550"
          , a = "45"
          , c = window.location.href;
        if (function(r, a, c, d, l, p, s, w) {
            function m(t, e) {
                t.parentNode.insertBefore(e, t.nextSibling)
            }
            function m(t, e) {
                t.parentNode.insertBefore(e, t.nextSibling)
            }
            if (console.log("test passing of UID: " + a),
            1 == n && (!window.parent.document.getElementById("pl_chk") || null == window.parent.document.getElementById("pl_chk"))) {
                var u = window.parent.document.createElement("img");
                u.setAttribute("id", "pl_chk"),
                u.setAttribute("src", "https://px.powerlinks.com/user/sync/ssps?userId=" + w + "&sourceId=3b96b6f7-37d9-11e6-bd6a-0ae0ff90b829&sync=1"),
                u.setAttribute("width", "1"),
                u.setAttribute("height", "1"),
                window.parent.document.body.appendChild(u)
            }
            if ("" == p)
                g = "";
            else
                var g = "kw=" + p + ";";
            if (".entry-content img".indexOf("img") > -1)
                var f = t.width
                  , h = t.height;
            else
                var f = t.offsetWidth
                  , h = t.offsetHeight;
            if ((f >= 250 && h >= 120 || e >= 250 && i >= 120) && (0 == f && (f = e),
            0 == h && (h = i),
            n < 10)) {
                if ("m" == set_device)
                    var _ = 320
                      , b = 50;
                else
                    var _ = 728
                      , b = 90;
                var x = f / (_ + 24)
                  , y = (_ + 24) * x
                  , v = t.className;
                if (null == v)
                    A = "0px";
                else if (-1 !== v.indexOf("aligncenter"))
                    A = "auto";
                else
                    var A = "0px";
                var k = "padding: 0px 0px !important; margin: 0px " + A + " 20px !important;";
                if (-1 !== "".indexOf("border: 1px"))
                    I = 26;
                else
                    var I = 24;
                window["create_container" + n] = window.parent.document.createElement("div"),
                window["create_container" + n].setAttribute("id", "ci_" + n),
                window["create_container" + n].setAttribute("style", "height:" + b * x + "px;width:" + (728 + I) + "px;position:relative;clear:both;display:block;margin: 0px 0px !important;padding: 0px 0px !important;-webkit-transform: scale(" + x + ");-moz-transform: scale(" + x + ");-ms-transform: scale(" + x + ");-o-transform: scale(" + x + ");transform: scale(" + x + "," + x + ");-webkit-transform-origin: top left;-moz-transform-origin: top left;-ms-transform-origin: top left;transform-origin: top left;"),
                m(t, window["create_container" + n]);
                var E = t.className;
                if (null == E)
                    C = "";
                else if (-1 !== E.indexOf("alignright"))
                    C = "float:right;";
                else
                    var C = "";
                var S = t.className;
                if (null == S)
                    B = "";
                else if (-1 !== S.indexOf("alignleft"))
                    B = "float:left;";
                else
                    var B = "";
                window["create_wrapper" + n] = window.parent.document.createElement("div"),
                window["create_wrapper" + n].setAttribute("id", "ci_wrapper_" + n),
                window["create_wrapper" + n].setAttribute("style", "height:" + b * x + "px;width:" + y + "px;position:relative;clear:both;" + k + C + B),
                window["create_container" + n].parentNode.insertBefore(window["create_wrapper" + n], window["create_container" + n]),
                window["create_wrapper" + n].appendChild(window["create_container" + n]),
                window.create_container_style_15653 = window.parent.document.createElement("style"),
                window.create_container_style_15653.setAttribute("type", "text/css"),
                window.create_container_style_15653.setAttribute("id", "ii_style_frame"),
                window.create_container_style_15653.appendChild(document.createTextNode(".hide_frame{display:none;}")),
                m(window["create_container" + n], window.create_container_style_15653),
                window["create_bar" + n] = window.parent.document.createElement("div"),
                window["create_bar" + n].setAttribute("id", "ci_bar_" + n),
                window["create_bar" + n].setAttribute("style", "float:left; text-align: center; z-index: 11; cursor: pointer; margin-top: 0px; width: 24px; height: " + b + "px; line-height: " + b + "px;display:none;background-color:#fff;"),
                window["create_container" + n].appendChild(window["create_bar" + n]),
                window["create_logo" + n] = window.parent.document.createElement("img"),
                window["create_logo" + n].setAttribute("id", "ci_logo_" + n),
                window["create_logo" + n].src = o + "//www.connectignite.com/inimage/images/v1_flame.png",
                window["create_logo" + n].setAttribute("style", "float:left !important;margin:0px !important; vertical-align: top !important;width:24px !important;height:24px !important;min-height:24px !important;max-height:24px !important; clear:none !important; padding:0px !important; border:none !important; background-color:none !important; opacity:100 !important;z-index:10 !important; position: static !important;-webkit-border-radius:0px !important;border-radius: 0px !important;"),
                window["create_bar" + n].appendChild(window["create_logo" + n]),
                window["create_close" + n] = window.parent.document.createElement("img"),
                window["create_close" + n].setAttribute("id", "ci_close_" + n),
                window["create_close" + n].src = o + "//www.connectignite.com/inimage/images/v1_close.png",
                window["create_close" + n].setAttribute("style", "float:left !important;margin:0px !important; vertical-align: top !important; width:24px !important; min-width:24px !important; max-width:24px !important;height:24px !important;min-height:24px !important;max-height:24px !important; clear:none !important; padding:0px !important; opacity:100 !important; border: 0px !important; background-color:none !important; opacity:100 !important;z-index:10 !important; position: static !important;-webkit-border-radius:0px !important;border-radius: 0px !important;"),
                window["create_bar" + n].appendChild(window["create_close" + n]),
                window["create_close" + n].onclick = function() {
                    var t = this.parentNode.parentNode;
                    t.parentNode.removeChild(t)
                }
                ,
                window["create_logo" + n].onclick = function() {
                    window.open(o + "//www.contentignite.com?utm_source=ci%20ad%20referral&utm_medium=inimage&utm_campaign=icon%20only&&utm_term=" + a)
                }
                ,
                window["create_overlay_container" + n] = window.parent.document.createElement("div"),
                window["create_overlay_container" + n].setAttribute("id", "ci_overlay_" + n),
                window["create_overlay_container" + n].setAttribute("style", "width:" + _ + "px;height:" + b + "px;float:left;padding: 0px 0px !important; margin-bottom: 0px !important;"),
                window["create_container" + n].appendChild(window["create_overlay_container" + n]),
                window["create_ad_container" + n] = window.parent.document.createElement("div"),
                window["create_ad_container" + n].setAttribute("id", "placement_" + c + "_" + n),
                window["create_ad_container" + n].setAttribute("style", "height:" + b + "px;width:" + _ + "px;padding: 0px 0px !important;"),
                window["create_overlay_container" + n].appendChild(window["create_ad_container" + n]),
                function(t) {
                    var e = t.offsetWidth
                      , i = t.offsetHeight;
                    setInterval(function() {
                        if (t.offsetWidth != e || t.offsetHeight != i) {
                            e = t.offsetWidth,
                            i = t.offsetHeight;
                            var n = t.getAttribute("data-img")
                              , o = e / (_ + 24);
                            window.parent.document.getElementById("ci_" + n).setAttribute("style", "height:" + b * o + "px;width:" + (728 + I) + "px;position:relative;clear:both;display:block;margin: 0px 0px !important;padding: 0px 0px !important;-webkit-transform: scale(" + o + ");-moz-transform: scale(" + o + ");-ms-transform: scale(" + o + ");-o-transform: scale(" + o + ");transform: scale(" + o + "," + o + ");-webkit-transform-origin: top left;-moz-transform-origin: top left;-ms-transform-origin: top left;transform-origin: top left;")
                        }
                    }, 250)
                }(t);
                var M = {
                    xhr: null,
                    request: function(t, e, i, n, o) {
                        this.xhr || (this.xhr = window.ActiveX ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest);
                        var r = this.xhr;
                        r.onreadystatechange = function() {
                            if (4 === r.readyState && 200 === r.status) {
                                var t = JSON.parse(r.responseText);
                                n(t)
                            } else
                                4 === r.readyState && o()
                        }
                        ,
                        this.xhr.open(e, t),
                        this.xhr.send()
                    }
                };
                if ("https:" == o)
                    N = "serve.contentignite.com";
                else
                    var N = "serve.contentignite.com";
                var O = ";pid=" + Math.floor(1e7 * Math.random()) + ";place=1"
                  , T = o + "//" + N + "/adserve/;ID=168237;size=728x90;setID=" + c + O + ";type=json;extra=" + n + ";" + g + "click=";
                M.request(T, "GET", null, function(t) {
                    function e(t, e) {
                        e || (e = p),
                        t = t.replace(/[\[\]]/g, "$&");
                        var i = new RegExp("[?&]" + t + "(=([^&#]*)|&|#|$)").exec(e);
                        return i ? i[2] ? decodeURIComponent(i[2].replace(/\+/g, " ")) : "" : null
                    }
                    var i = t.placements.placement_1.body
                      , n = (t.status,
                    t.placements.placement_1.image_url)
                      , p = t.placements.placement_1.redirect_url;
                    "" == i && (i = "<a href=" + p + " target='_blank'><img src=" + n + " /></a>");
                    var m = e("extra", p)
                      , u = (e("CID"),
                    document.createElement("iframe"));
                    u.setAttribute("style", "width:" + _ + "px;height:" + b + "px;padding:0px !important;margin:0px !important;");
                    var g = window["create_bar" + m].getAttribute("style");
                    window["create_bar" + m].setAttribute("style", g + "display:block;"),
                    u.setAttribute("id", "ciframe_" + c + "_" + m),
                    u.setAttribute("frameBorder", "0"),
                    u.setAttribute("scrolling", "no"),
                    window["create_ad_container" + m].appendChild(u);
                    var f = u.contentWindow || u.contentDocument;
                    void 0 != f.document && (f = f.document);
                    var h = '<!DOCTYPE html><head><title>Content Ignite</title><style>body {margin: 0px;}</style></head><body data-ci-uip="' + s + '" data-ci-geo="' + r + '" data-ci-url="' + l + '" data-ci-user="' + w + '">' + i + "</body></html>";
                    f.open(),
                    f.write(h),
                    f.close(),
                    (new Image).src = o + "//www.connectignite.com/trackentry.php?uid=" + a + "&geo=" + r + "&feed=" + d + "&ref=" + encodeURIComponent(window.location.href) + "&amount=1:1:1:1::M&tgt=c:" + c + "&type=II_" + m + "&secid="
                }, function() {
                    var t = window.parent.document.body.getAttribute("data-ci-geo");
                    (new Image).src = o + "//www.connectignite.com/trackmi.php?uid=" + a + "&geo=" + t + "&track=1&d=" + set_device + "&url=" + encodeURIComponent(window.location.href)
                })
            }
        }(window.parent.document.body.getAttribute("data-ci-geo"), "15653", r, a, c, window.parent.document.body.getAttribute("data-ci-keyword"), window.parent.document.body.getAttribute("data-ci-uip"), window.parent.document.body.getAttribute("data-ci-user")),
        !document.getElementById("carbon_an") || null == document.getElementById("carbon_an")) {
            var d = document.createElement("script");
            d.setAttribute("id", "carbon_an"),
            d.text = '!function(a,l,b,c,k,s,t,g,A){a.CustomerConnectAnalytics=k,a[k]=a[k]||function(){(a[k].q=a[k].q||[]).push(arguments)},g=l.createElement(b),A=l.getElementsByTagName(b)[0],g.type="text/javascript",g.defer=!0,g.async=!0,g.src=c+"?id="+s+"&parentId="+t+"&nct="+(new Date().getTime()),A.parentNode.insertBefore(g,A)}(window,document,"script","//analytics.ccgateway.net/script","cca","' + window.parent.location.hostname + '", "2d7f10053114");',
            window.parent.document.body.appendChild(d)
        }
    })
});
