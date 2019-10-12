/**
 * @author      OA Wu <comdan66@gmail.com>
 * @copyright   Copyright (c) 2015 - 2019, Ginkgo
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */
// ga
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');ga('create','UA-46121102-26','auto');ga('send','pageview');

// Fb
window.fbAsyncInit = function() {FB.init({appId: '640377126095413',xfbml: true,version: 'v2.4'});};
(function(d, s, id){var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/zh_TW/sdk.js";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));

var _mKeys = ['AIzaSyBF02Xytwx2peyWWpiUwkQDgng_FYmnBaA'];
var _dKey = '1WRuhRwkEq0f0fmu_OYlJXPMfhJjPi0jPSiOL63ujsu0';

var _mDefaultPosition = [23.77133806905457, 120.70937982351438];
var _gInited = false;
var _mInited = false;
var _mFunc = null;
var _mMap = null;
var _isGetting = false;

var _datas = [];
// var _markers = [];
var _nowMarker = null;
// var _polyline = null;
var _myMarker = null;

var _intervalTimer = null;
var _getDataTime = 10 * 1000;

var _lastZoom = null;
var _idleTimer = null;

window.gmc = function() { $(window).trigger('gm'); };

function time() { return new Date().getTime(); }
function OAM(t) { this._div=null, this._option=Object.assign({className:"",top:0,left:0,width:32,height:32,html:"",map:null,position:null,css:{}},t),this._option.map&&this.setMap(this._option.map)}
function iOM() { OAM.prototype=new google.maps.OverlayView,Object.assign(OAM.prototype,{setPoint:function(){ if (!this._div) return; if(!this._option.position) return this._div.style.left="-999px",void(this._div.style.top="-999px"); if (!this.getProjection()) return;var t=this.getProjection().fromLatLngToDivPixel(this._option.position);t&&(this._div.style.left=t.x-this._option.width/2+this._option.left+"px",this._div.style.top=t.y-this._option.height/2+this._option.top+"px")},draw:function(){this.setPoint()},onAdd: function() {for(var t in this._div=document.createElement("div"),this._div.style.position="absolute",this._div.className=this._option.className,this._div.style.width=this._option.width+"px",this._div.style.height=this._option.height+"px",this._div.innerHTML=this._option.html,this._option.css)"width"!=t&&"height"!=t&&"top"!=t&&"left"!=t&&"bottom"!=t&&"right"!=t&&(this._div.style[t]=this._option.css[t]);var i=this;google.maps.event.addDomListener(this._div,"click",function(t){t.stopPropagation&&t.stopPropagation(),google.maps.event.trigger(i,"click")}),this.getPanes().overlayImage.appendChild(this._div)},remove:function(){return this._div&&(this._div.parentNode.removeChild(this._div),this._div=null),this},setHtml:function(t){this._option.html=t;return this._div&&(this._div.innerHTML=this._option.html),this} ,getClassName:function(){ return this._option.className },setClassName:function(t){ this._option.className=t; return this._div&&(this._div.className=this._option.className),this }, setPosition:function(t){return this.map&&(this._option.position=t,this.setPoint()),this},getPosition:function(){return this._option.position}})}
function genLatLng(t) { return new google.maps.LatLng(t[0][0], t[0][1]); }
function googleMapsCallback() { if (_mInited) return; else _mInited = true; _mDefaultPosition = genLatLng([_mDefaultPosition]); _mFunc && _mFunc(); }
function googleInit() { if (_gInited) return; else _gInited = true; $(window).bind('gm', googleMapsCallback); var key = _mKeys[Math.floor((Math.random() * _mKeys.length))]; $.getScript('https://maps.googleapis.com/maps/api/js?' + (key ? 'key=' + key + '&' : '') + 'language=zh-TW&libraries=visualization&callback=gmc', googleMapsCallback); return true; }

function filterNotNull(t) { return t !== null; }
function markerRemove(t) { t.map && t.setMap(null); return null; }

function cluster(oris, zoom, unit, lineStyle, closure) {
  if (!oris.length)
    return closure ? closure([]) : [];

  var tmps = {};
  var news = [];
  
  for (var i = 0; i < oris.length; i++) {
    if (typeof tmps[i] !== 'undefined')
      continue;

    tmps[i] = true;
    var tmp = [oris[i]];

    for (var j = i + 1; j < oris.length; j++) {
      if (typeof tmps[j] !== 'undefined')
        if (lineStyle)
          break;
        else
          continue;

      var distance = Math.max(Math.abs(oris[i][0] - oris[j][0]), Math.abs(oris[i][0] - oris[j][0]));

      if (30 / Math.pow(2, zoom) / unit <= distance)
        if (lineStyle)
          break;
        else
          continue;

      tmps[j] = true;
      tmp.push(oris[j]);
    }

    news.push(tmp);
  }

  tmps = null;
  return closure ? closure(news) : news;
}

$(function() {
  var $body = $('body');
  var $map = $('#map');

  var Storage = {
    exist: function() { return typeof Storage !== 'undefined' && typeof JSON !== 'undefined'; },
    set: function(key, val) { if (!this.exist()) return false; try { localStorage.setItem(key, val === undefined ? null : JSON.stringify(val)); return true; } catch(error) { return false; } },
    get: function(key) { if (!this.exist()) return false; val = localStorage.getItem(key); return JSON.parse(val); }
  };

  var Loading = {
    $el: null,
    $el2: null,
    timer: null,
    init: function() { if (Loading.$el !== null) return; Loading.$el = $('<div />').attr('id', 'y').appendTo($body); Loading.$el2 = $('<span />').appendTo(Loading.$el); },
    remove: function() { if (Loading.$el !== null) Loading.$el.remove(); if (Loading.$el2 !== null) Loading.$el2.remove(); },
    show: function(message, closure) { Loading.init(); Loading.$el2.text(message); Loading.$el.addClass('show'); return Loading.timer = setTimeout(function() { Loading.$el.addClass('ani'); setTimeout(function() { clearTimeout(Loading.timer); Loading.timer = null; }, 300); closure && closure(); }, 100); },
    hide: function(closure) { var tmp = function() { clearTimeout(Loading.timer); Loading.timer = null; Loading.$el.removeClass('ani'); return setTimeout(function() { Loading.$el.removeClass('show'); Loading.remove(); closure && closure(); }, 300); }; if (Loading.timer !== null) setTimeout(tmp, 500); else tmp(); }
  };

  var Geo = {
    key: 'haotien.ioa.tw',
    ttl: 10 * 60 * 1000,
    data: {},
    timeout: 5 * 1000,
    fail: null,
    get: function(cb0, cb1, cb2) {
      var val = Storage.get(Geo.key);
      if (val && typeof val === 'object' && typeof val.t === 'number' && typeof val.v === 'object' && val.t + Geo.ttl > time()) return cb1 && cb1(Geo.data = val.v);
      setTimeout(function() { if (Geo.fail === false) return; else Geo.fail = true; return cb2 && cb2(); }, Geo.timeout);
      return navigator.geolocation.getCurrentPosition(function(position) {
        if (Geo.fail === true) return; else Geo.fail = false;
        Geo.data = { lat: position.coords.latitude, lng: position.coords.longitude, acc: position.coords.accuracy };
        Storage.set(Geo.key, { t: time(), v: Geo.data});
        cb0 && cb0(Geo.data);
        cb1 && cb1(Geo.data);
      }, cb2, { enableHighAccuracy: true });
    }
  };

  var Zoom = {
    $el: null,
    $el2: null,
    $el3: null,
    init: function() {
      if (Zoom.$el !== null) return;
      Zoom.$el = $('<div />').attr('id', 'z').appendTo($body);
      Zoom.$el2 = $('<label />').attr('id', 'zi').click(function() { _mMap.setZoom(_mMap.zoom + 1); }).appendTo(Zoom.$el);
      Zoom.$el3 = $('<label />').attr('id', 'zo').click(function() { _mMap.setZoom(_mMap.zoom - 1); }).appendTo(Zoom.$el);
    },
    show: function(closure) {
      Zoom.init();
      return setTimeout(function() {
        Zoom.$el.addClass('s');
        return closure && closure();
      }, 100);
    },
  };

  var Menu = {
    $el: null,
    datas: [
      { title: '浩天宮', links: [
        {text: '台中浩天宮大庄媽', href: 'https://www.facebook.com/haotiengong/', class: 'icon-7'},
      ]},
      { title: '開發者', links: [
        {text: '楊協達', href: 'https://www.facebook.com/zachtoshiya', class: 'icon-8'},
        {text: '吳政賢', href: 'https://www.facebook.com/comdan66', class: 'icon-8'},
      ]},
    ],
    init: function() {
      if (Menu.$el !== null) return;
      Menu.$el = $('<label />').attr('id', 'u').attr('for', '_u').appendTo($body);
      $('<div />').attr('id', 'e').append(
        $('<header />').append(
          $('<b />').text('2019 大庄媽媽祖')).append(
          $('<span />').text('GPS 即時定位')).append(
          $('<label />').attr('for', '_u'))).append(
        $('<section />').append(Menu.datas.map(function(data) {
          return $('<div />').attr('data-tip', data.title).append(data.links.map(function(link) {
            return $('<a />').attr('href', link.href).text(link.text).attr('class', link.class).attr('target', '_blank');
          }));
        }))).appendTo($body);
      $('<label />').attr('id', 'g').attr('for', '_u').appendTo($body);
    },
    show: function(closure) {
      Menu.init();
      return setTimeout(function() {
        Menu.$el.addClass('s');
        return closure && closure();
      }, 100);
    },
  };

  var Like = {
    ed: false,
    show: function(closure) {
      if (Like.ed) return;
      else Like.ed = true;
      $('#f').addClass('s');
      return closure && closure();
    },
  };

  var Length = {
    $el: null,
    data: 0,
    init: function() {
      if (Length.$el !== null) return;
      Length.$el = $('<div />').attr('id', 'l').text(Length.data).appendTo($body);
    },
    update: function() {

      var deg2rad = function(num) {
        return num * (Math.PI / 180);
      };

      var length = function(aa, an, ba, bn) {
        var a = deg2rad(aa);
        var b = deg2rad(an);
        var c = deg2rad(ba);
        var d = deg2rad(bn);

        return (2 * Math.asin(Math.sqrt(Math.pow(Math.sin((a - c) / 2), 2) + Math.cos(a) * Math.cos(c) * Math.pow(Math.sin((b - d) / 2), 2)))) * 6378137;
      };

      var tmp = 0; for (var i = 1; i < _datas.length; i++) tmp += length(_datas[i - 1][0], _datas[i - 1][1], _datas[i][0], _datas[i][1]);
      Length.data = (tmp / 1000).toFixed(2)
      
      if (Length.$el === null) return;
      Length.$el.text(Length.data)
    },
    show: function(closure) {
      Length.init();
      return setTimeout(function() {
        Length.$el.addClass('s');
        return closure && closure();
      }, 100);
    },
  };

  var GeoAt = {
    $el: null,
    init: function() {
      if (GeoAt.$el !== null) return;
      return GeoAt.$el = $('<label />').attr('id', 'x').click(function() {
        if (_myMarker === null) _myMarker = new OAM({ map: _mMap, width: 16, height: 16, className: 'myMarker', html: "" });
        _myMarker.setPosition(genLatLng([[Geo.data.lat, Geo.data.lng]]));

        // if (_markers.length) {
        //   var b = new google.maps.LatLngBounds();
        //   b.extend(_myMarker.getPosition());
        //   for (var j in _markers) b.extend(_markers[j].getPosition());
        //   _mMap.fitBounds(b);
        // } else {
          _mMap.setOptions({ center: _myMarker.getPosition() });
        // }
      }).appendTo($body);
    },
    show: function(closure) {
      return Geo.get(null, function() {
        GeoAt.init();
        return setTimeout(function() {
          GeoAt.$el.addClass('s');
          return closure && closure();
        }, 100);
      }, closure);
    }
  };

  var error = function(emoticons, message) {
    return Loading.hide(function() {$body.empty().append($('<div />').attr('id', 'm').attr('data-emoticons', emoticons).attr('data-error', message)); });
  };

  var fetch = function(course) {
    // _markers = _markers.map(markerRemove).filter(filterNotNull);

    if (!_datas.length) {
      if (_nowMarker !== null)
        _nowMarker.setMap(null);
      return course && course();
    }
    if (_nowMarker === null) _nowMarker = new OAM({ map: _mMap, width: 80, height: 75, className: 'nowMarker', html: '<img src="img/m4.png" />'});
    _nowMarker.setPosition(genLatLng(_datas));

    // _markers = cluster(_datas, _mMap.zoom, 1, true).map(function(data) { return new OAM({ map: _mMap, position: genLatLng(data), width: 8, height: 8, className: 'marker', html: ""}); });
    
    // if (_polyline === null) _polyline = new google.maps.Polyline({ map: _mMap, strokeColor: 'rgba(249, 39, 114, .45)', strokeWeight: 5 });
    // _polyline.setPath(_markers.map(function(marker) { return marker.getPosition(); }));

    return course && course();
  };

  var getData = function(closure) {
    if (_isGetting) return;
    else _isGetting = true;

    return $.get('https://spreadsheets.google.com/feeds/list/' + _dKey + '/1/public/values?alt=json' + '&t=' + time(), function(response) {
      _datas = response.feed.entry.filter(function(t) { return typeof t['gsx$時間戳記']['$t'] !== 'undefined' && typeof t['gsx$latitudelongitude']['$t'] !== 'undefined'; }).map(function(t) { var tmp = t['gsx$latitudelongitude']['$t'].split(','); if (tmp.length < 2) return null; var p = tmp.map(function(u) { return parseFloat(u); }); return [p[0], p[1], t['gsx$時間戳記']['$t']]; }).filter(function(t) { return t != null; }).reverse();
      Length.update();
      return closure ? closure() : fetch();
    }).fail(error.bind(null, '(ಥ﹏ಥ)', '哭哭，取不到資料！')).always(function() {
      _isGetting = false;
    });
  };

  _mFunc = function() {
    if (_mMap) return;
    else _mMap = new google.maps.Map($('#m').get(0), { zoom: 7, clickableIcons: false, disableDefaultUI: true, gestureHandling: 'greedy', center: _mDefaultPosition }); iOM();
    // _mMap.mapTypes.set('ms', new google.maps.StyledMapType([{stylers: [{gamma: 0}, {weight: 0.75}] }, {featureType: 'all', stylers: [{ visibility: 'on' }]}, {featureType: 'administrative', stylers: [{ visibility: 'on' }]}, {featureType: 'landscape', stylers: [{ visibility: 'on' }]}, {featureType: 'poi', stylers: [{ visibility: 'on' }]}, {featureType: 'road', stylers: [{ visibility: 'simplified' }]}, {featureType: 'road.arterial', stylers: [{ visibility: 'on' }]}, {featureType: 'transit', stylers: [{ visibility: 'on' }]}, {featureType: 'water', stylers: [{ color: '#b3d1ff', visibility: 'on' }]}, {elementType: "labels.icon", stylers:[{ visibility: 'off' }]}]));
    // _mMap.setMapTypeId('ms');
    _mMap.addListener('click', function(e) {
      console.error(e.latLng.lat());
      console.error(e.latLng.lng());
    })

    if (_datas.length >= 2) {
      var bounds = new google.maps.LatLngBounds();
      for (var i in _datas)
        bounds.extend(genLatLng([_datas[i]]));
      _mMap.fitBounds(bounds);
    } else if (_datas.length) {
      _mMap.setCenter(genLatLng(_datas));
      _mMap.setZoom(12);
    }

    Loading.hide(function() {
      Zoom.show(function() {
        GeoAt.show();
        Like.show(function() {
          Length.show(function() {
            Menu.show(function() {
              fetch(function() {
                _mMap.addListener('idle', function() { if (_mMap.zoom === _lastZoom) return; else _lastZoom = _mMap.zoom; clearTimeout(_idleTimer); _idleTimer = setTimeout(fetch, 300); });
                _intervalTimer = setInterval(getData, _getDataTime);
              });
            });
          });
        });
      });
    });
  };

  Loading.show('初始中…', getData.bind(null, googleInit));
});











/**
 * @author      OA Wu <comdan66@gmail.com>
 * @copyright   Copyright (c) 2015 - 2018, OAF2E
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

//   // // function h (ps) { if (google.maps.geometry.spherical) $l.html (f (google.maps.geometry.spherical.computeLength (ps) / 1000, 2)); if (!$l.hasClass ('s')) $l.addClass ('s') }

// // Mylib
// // Array.prototype.last = function () { return this[this.length - 1];};
// // Array.prototype.column = function (k) { return this.map (function (t) { return k ? eval ("t." + k) : t; });};

// // window.gmc = function () { $(window).trigger ('gm'); };
// // var OAML = function () { };

// $(function () {
//   // var _ks = [],
//   //     _ms = [],
//   //     _vm = null,
//   //     _mz = null,
//   //     _c = 0,
//   //     _cl = 30,
//   //     _slp = false,
//   //     _sm = false,
//   //     _lt = null,
//   //     _t = 5 * 1000,
//   //     _e = '1WRuhRwkEq0f0fmu_OYlJXPMfhJjPi0jPSiOL63ujsu0';

//   // var $m = $('#m');
//   // var $l = $('#l');
//   // var $y = $('#y');
//   // function o () { function OAIN(e,t){function i(){}i.prototype=t.prototype,e.superClass_=t.prototype,e.prototype=new i,e.prototype.constructor=e} function OAML_(e,t,i){this.marker_=e,this.handCursorURL_=e.handCursorURL,this.labelDiv_=document.createElement("div"),this.labelDiv_.style.cssText="position: absolute; overflow: hidden;",this.eventDiv_=document.createElement("div"),this.eventDiv_.style.cssText=this.labelDiv_.style.cssText,this.eventDiv_.setAttribute("onselectstart","return false;"),this.eventDiv_.setAttribute("ondragstart","return false;"),this.crossDiv_=OAML_.getSharedCross(t)} OAML = function (e) {e=e||{},e.labelContent=e.labelContent||"",e.initCallback=e.initCallback||function(){},e.labelAnchor=e.labelAnchor||new google.maps.Point(0,0),e.labelClass=e.labelClass||"markerLabels",e.labelStyle=e.labelStyle||{},e.labelInBackground=e.labelInBackground||!1,"undefined"==typeof e.labelVisible&&(e.labelVisible=!0),"undefined"==typeof e.raiseOnDrag&&(e.raiseOnDrag=!0),"undefined"==typeof e.clickable&&(e.clickable=!0),"undefined"==typeof e.draggable&&(e.draggable=!1),"undefined"==typeof e.optimized&&(e.optimized=!1),e.crossImage=e.crossImage||"http"+("https:"===document.location.protocol?"s":"")+"://maps.gstatic.com/intl/en_us/mapfiles/drag_cross_67_16.png",e.handCursor=e.handCursor||"http"+("https:"===document.location.protocol?"s":"")+"://maps.gstatic.com/intl/en_us/mapfiles/closedhand_8_8.cur",e.optimized=!1,this.label=new OAML_(this,e.crossImage,e.handCursor),google.maps.Marker.apply(this,arguments)}; OAIN (OAML_,google.maps.OverlayView),OAML_.getSharedCross=function(e){var t;return"undefined"==typeof OAML_.getSharedCross.crossDiv&&(t=document.createElement("img"),t.style.cssText="position: absolute; z-index: 1000002; display: none;",t.style.marginLeft="-8px",t.style.marginTop="-9px",t.src=e,OAML_.getSharedCross.crossDiv=t),OAML_.getSharedCross.crossDiv},OAML_.prototype.onAdd=function(){var e,t,i,s,a,r,o,n=this,l=!1,g=!1,p=20,_="url("+this.handCursorURL_+")",v=function(e){e.preventDefault&&e.preventDefault(),e.cancelBubble=!0,e.stopPropagation&&e.stopPropagation()},h=function(){n.marker_.setAnimation(null)};this.getPanes().overlayImage.appendChild(this.labelDiv_),this.getPanes().overlayMouseTarget.appendChild(this.eventDiv_),"undefined"==typeof OAML_.getSharedCross.processed&&(this.getPanes().overlayImage.appendChild(this.crossDiv_),OAML_.getSharedCross.processed=!0),this.listeners_=[google.maps.event.addDomListener(this.eventDiv_,"mouseover",function(e){(n.marker_.getDraggable()||n.marker_.getClickable())&&(this.style.cursor="pointer",google.maps.event.trigger(n.marker_,"mouseover",e))}),google.maps.event.addDomListener(this.eventDiv_,"mouseout",function(e){!n.marker_.getDraggable()&&!n.marker_.getClickable()||g||(this.style.cursor=n.marker_.getCursor(),google.maps.event.trigger(n.marker_,"mouseout",e))}),google.maps.event.addDomListener(this.eventDiv_,"mousedown",function(e){g=!1,n.marker_.getDraggable()&&(l=!0,this.style.cursor=_),(n.marker_.getDraggable()||n.marker_.getClickable())&&(google.maps.event.trigger(n.marker_,"mousedown",e),v(e))}),google.maps.event.addDomListener(document,"mouseup",function(t){var i;if(l&&(l=!1,n.eventDiv_.style.cursor="pointer",google.maps.event.trigger(n.marker_,"mouseup",t)),g){if(a){i=n.getProjection().fromLatLngToDivPixel(n.marker_.getPosition()),i.y+=p,n.marker_.setPosition(n.getProjection().fromDivPixelToLatLng(i));try{n.marker_.setAnimation(google.maps.Animation.BOUNCE),setTimeout(h,1406)}catch(r){}}n.crossDiv_.style.display="none",n.marker_.setZIndex(e),s=!0,g=!1,t.latLng=n.marker_.getPosition(),google.maps.event.trigger(n.marker_,"dragend",t)}}),google.maps.event.addListener(n.marker_.getMap(),"mousemove",function(s){var _;l&&(g?(s.latLng=new google.maps.LatLng(s.latLng.lat()-t,s.latLng.lng()-i),_=n.getProjection().fromLatLngToDivPixel(s.latLng),a&&(n.crossDiv_.style.left=_.x+"px",n.crossDiv_.style.top=_.y+"px",n.crossDiv_.style.display="",_.y-=p),n.marker_.setPosition(n.getProjection().fromDivPixelToLatLng(_)),a&&(n.eventDiv_.style.top=_.y+p+"px"),google.maps.event.trigger(n.marker_,"drag",s)):(t=s.latLng.lat()-n.marker_.getPosition().lat(),i=s.latLng.lng()-n.marker_.getPosition().lng(),e=n.marker_.getZIndex(),r=n.marker_.getPosition(),o=n.marker_.getMap().getCenter(),a=n.marker_.get("raiseOnDrag"),g=!0,n.marker_.setZIndex(1e6),s.latLng=n.marker_.getPosition(),google.maps.event.trigger(n.marker_,"dragstart",s)))}),google.maps.event.addDomListener(document,"keydown",function(e){g&&27===e.keyCode&&(a=!1,n.marker_.setPosition(r),n.marker_.getMap().setCenter(o),google.maps.event.trigger(document,"mouseup",e))}),google.maps.event.addDomListener(this.eventDiv_,"click",function(e){(n.marker_.getDraggable()||n.marker_.getClickable())&&(s?s=!1:(google.maps.event.trigger(n.marker_,"click",e),v(e)))}),google.maps.event.addDomListener(this.eventDiv_,"dblclick",function(e){(n.marker_.getDraggable()||n.marker_.getClickable())&&(google.maps.event.trigger(n.marker_,"dblclick",e),v(e))}),google.maps.event.addListener(this.marker_,"dragstart",function(e){g||(a=this.get("raiseOnDrag"))}),google.maps.event.addListener(this.marker_,"drag",function(e){g||a&&(n.setPosition(p),n.labelDiv_.style.zIndex=1e6+(this.get("labelInBackground")?-1:1))}),google.maps.event.addListener(this.marker_,"dragend",function(e){g||a&&n.setPosition(0)}),google.maps.event.addListener(this.marker_,"position_changed",function(){n.setPosition()}),google.maps.event.addListener(this.marker_,"zindex_changed",function(){n.setZIndex()}),google.maps.event.addListener(this.marker_,"visible_changed",function(){n.setVisible()}),google.maps.event.addListener(this.marker_,"labelvisible_changed",function(){n.setVisible()}),google.maps.event.addListener(this.marker_,"title_changed",function(){n.setTitle()}),google.maps.event.addListener(this.marker_,"labelcontent_changed",function(){n.setContent()}),google.maps.event.addListener(this.marker_,"labelanchor_changed",function(){n.setAnchor()}),google.maps.event.addListener(this.marker_,"labelclass_changed",function(){n.setStyles()}),google.maps.event.addListener(this.marker_,"labelstyle_changed",function(){n.setStyles()})]},OAML_.prototype.onRemove=function(){var e;for(this.labelDiv_.parentNode.removeChild(this.labelDiv_),this.eventDiv_.parentNode.removeChild(this.eventDiv_),e=0;e<this.listeners_.length;e++)google.maps.event.removeListener(this.listeners_[e])},OAML_.prototype.draw=function(){this.setContent(),this.setTitle(),this.setStyles()},OAML_.prototype.setContent=function(){var e=this.marker_.get("labelContent");"undefined"==typeof e.nodeType?(this.labelDiv_.innerHTML=e,this.eventDiv_.innerHTML=this.labelDiv_.innerHTML):(this.labelDiv_.innerHTML="",this.labelDiv_.appendChild(e),e=e.cloneNode(!0),this.eventDiv_.innerHTML="",this.eventDiv_.appendChild(e))},OAML_.prototype.setTitle=function(){this.eventDiv_.title=this.marker_.getTitle()||""},OAML_.prototype.setStyles=function(){var e,t;this.labelDiv_.className=this.marker_.get("labelClass"),this.eventDiv_.className=this.labelDiv_.className,this.labelDiv_.style.cssText="",this.eventDiv_.style.cssText="",t=this.marker_.get("labelStyle");for(e in t)t.hasOwnProperty(e)&&(this.labelDiv_.style[e]=t[e],this.eventDiv_.style[e]=t[e]);this.setMandatoryStyles()},OAML_.prototype.setMandatoryStyles=function(){this.labelDiv_.style.position="absolute",this.labelDiv_.style.overflow="","undefined"!=typeof this.labelDiv_.style.opacity&&""!==this.labelDiv_.style.opacity&&(this.labelDiv_.style.MsFilter='"progid:DXImageTransform.Microsoft.Alpha(opacity='+100*this.labelDiv_.style.opacity+')"',this.labelDiv_.style.filter="alpha(opacity="+100*this.labelDiv_.style.opacity+")"),this.eventDiv_.style.position=this.labelDiv_.style.position,this.eventDiv_.style.overflow=this.labelDiv_.style.overflow,this.eventDiv_.style.opacity=.01,this.eventDiv_.style.MsFilter='"progid:DXImageTransform.Microsoft.Alpha(opacity=1)"',this.eventDiv_.style.filter="alpha(opacity=1)",this.setAnchor(),this.setPosition(),this.setVisible()},OAML_.prototype.setAnchor=function(){var e=this.marker_.get("labelAnchor");this.labelDiv_.style.marginLeft=-e.x+"px",this.labelDiv_.style.marginTop=-e.y+"px",this.eventDiv_.style.marginLeft=-e.x+"px",this.eventDiv_.style.marginTop=-e.y+"px"},OAML_.prototype.setPosition=function(e){var t=this.getProjection().fromLatLngToDivPixel(this.marker_.getPosition());"undefined"==typeof e&&(e=0),this.labelDiv_.style.left=Math.round(t.x)+"px",this.labelDiv_.style.top=Math.round(t.y-e)+"px",this.eventDiv_.style.left=this.labelDiv_.style.left,this.eventDiv_.style.top=this.labelDiv_.style.top,this.setZIndex()},OAML_.prototype.setZIndex=function(){var e=this.marker_.get("labelInBackground")?-1:1;"undefined"==typeof this.marker_.getZIndex()?(this.labelDiv_.style.zIndex=parseInt(this.labelDiv_.style.top,10)+e,this.eventDiv_.style.zIndex=this.labelDiv_.style.zIndex):(this.labelDiv_.style.zIndex=this.marker_.getZIndex()+e,this.eventDiv_.style.zIndex=this.labelDiv_.style.zIndex)},OAML_.prototype.setVisible=function(){this.marker_.get("labelVisible")?this.labelDiv_.style.display=this.marker_.getVisible()?"block":"none":this.labelDiv_.style.display="none",this.eventDiv_.style.display=this.labelDiv_.style.display;var e=this.marker_.get("initCallback");e(this.labelDiv_)},OAIN(OAML,google.maps.Marker),OAML.prototype.setMap=function(e){google.maps.Marker.prototype.setMap.apply(this,arguments),this.label.setMap(e)}; }
//   // function c (r) { return 'M 0 0 m -' + r + ', 0 '+ 'a ' + r + ',' + r + ' 0 1,0 ' + (r * 2) + ',0 ' + 'a ' + r + ',' + r + ' 0 1,0 -' + (r * 2) + ',0';}
//   // function f (num, pos) { var size = Math.pow (10, pos); return Math.round (num * size) / size; }
//   // // function h (ps) { if (google.maps.geometry.spherical) $l.html (f (google.maps.geometry.spherical.computeLength (ps) / 1000, 2)); if (!$l.hasClass ('s')) $l.addClass ('s') }

//   // function l (f) {
//   //   if (++_c > _cl) return location.reload (true);
//   //   if (_slp) return;
//   //   _slp = true;

//   //   $.when ($.ajax ('https://spreadsheets.google.com/feeds/list/' + _e + '/1/public/values?alt=json' + '&t=' + new Date ().getTime (), {dataType: 'json'})).done (function (r) {
//   //     _slp = false;
//   //     if (!(r && r.feed && r.feed.entry && r.feed.entry.length)) return ;

//   //     _ms = r.feed.entry.filter (function (t) {
//   //       return typeof t['gsx$時間戳記']['$t'] !== 'undefined' && typeof t['gsx$latitudelongitude']['$t'] !== 'undefined';
//   //     }).map (function (t) {
//   //       var tmp = t['gsx$latitudelongitude']['$t'].split (',');

//   //        if (tmp.length < 2)
//   //         return null;

//   //       var p = tmp.map (function (u) { return parseFloat (u); });

//   //       return {t: t['gsx$時間戳記']['$t'], p: new google.maps.LatLng (p[0], p[1])};
//   //     }).filter (function (t) { return t != null; });
      
//   //     // if (!_p) _p = new google.maps.Polyline ({ map: _vm, strokeColor: 'rgba(249, 39, 114, .45)', strokeWeight: 5 });
//   //     // _p.setPath (_ms.column ('p'));

//   //     if (!_mz) _mz = new OAML ({ map: _vm, draggable: false, optimized: false, labelContent: '<img src="img/m4.png" />', icon: {path: 'M 0 0'}, labelAnchor: new google.maps.Point (80/2, 75), labelClass: 'm'});
//   //     _mz.setPosition (_ms.last ().p);
//   //     _mz.setZIndex (999);

//   //     // _ts.forEach (function (t) { t.setMap (null); }),
//   //     // _ts = [];

//   //     // var tmp = parseInt (_ms.length / 5, 10);
//   //     // _ts = _ms.map (function (t, i) { return i % tmp ? null : new OAML ({position: t.p, draggable: false, map: _vm, zIndex: 1, icon: { path: c (3), strokeColor: 'rgba(255, 68, 170, 1)', strokeWeight: 1, fillColor: 'rgba(255, 68, 170, 1)', fillOpacity: 0.5 }, labelContent: t.t, labelAnchor: new google.maps.Point (-5, -5), labelClass: 't'});}).filter (function (t) { return t; });

//   //     // new google.maps.Geocoder ().geocode ({'latLng': _ms.last ().p}, function (r, s) {
//   //     //   if (!((s == google.maps.GeocoderStatus.OK) && r.length && (r = r[0]) && r.formatted_address)) return;

//   //     //   if(!_a) _a = new OAML ({ draggable: false, map: _vm, labelContent: '', labelAnchor: new google.maps.Point (150, -8), labelClass: 'a', icon: {path: 'M 0 0'} });
//   //     //   _a.labelContent = r.formatted_address;
//   //     //   _a.setPosition (_ms.last ().p);
//   //     // });

//   //     if (f) {
//   //       _vm.setCenter (_ms.last ().p);
              
//   //       $y.addClass ('a');
//   //       setTimeout (function () { $y.remove (); }, 275);
//   //     }

//   //     if (!_sm)
//   //       _vm.setCenter (_ms.last ().p);
      
//   //     // clearTimeout (_lt);
//   //     // _lt = setTimeout (h.bind (this, _ms.column ('p')), 2000);
//   //   });
//   // }


//   // function fin () {
//   //   if (_vm) return;
//   //   o ();

//   //   var p = new google.maps.LatLng (23.569396231491233, 120.3030703338623);
//   //   _vm = new google.maps.Map ($m.get (0), { zoom: 16, disableDefaultUI: true, gestureHandling: 'greedy', center: p }); _vm.mapTypes.set ('style1', new google.maps.StyledMapType ([{featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{visibility: 'on'}]}, {featureType: 'poi', elementType: 'labels.text', stylers: [{visibility: 'off'}]}, {featureType: 'poi.business', stylers: [{visibility: 'on'}]}, {featureType: 'poi.park', elementType: 'labels.text', stylers: [{visibility: 'on'}]}, {featureType: 'road.local', elementType: 'labels', stylers: [{visibility: 'on'}]}])); _vm.setMapTypeId ('style1');
//   //   _vm.addListener ('dragend', function () { _sm = true; })
//   //   $('#z>*').click (function () { _vm.setZoom (_vm.zoom + ($(this).index () ? -1 : 1)); });

//   //   l (true);
//   //   setInterval (l, _t);
//   // }
//   // function flgm (){
//   //   var k = _ks[Math.floor ((Math.random() * _ks.length))], s = document.createElement ('script');
//   //   s.setAttribute ('type', 'text/javascript');
//   //   s.setAttribute ('src', 'https://maps.googleapis.com/maps/api/js?' + (k ? 'key=' + k + '&' : '') + 'language=zh-TW&libraries=visualization&callback=gmc');
//   //   (document.getElementsByTagName ('head')[0] || document.documentElement).appendChild (s);
//   //   s.onload = fin;
//   // }
//   // $(window).bind ('gm', fin);

//   // flgm ();
  
// });