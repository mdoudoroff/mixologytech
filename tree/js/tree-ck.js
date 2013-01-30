(function(_) {

  function create(n) {
    if (/^#/.test(n)) return document.getElementById(n.substring(1));
    n = qualify(n);
    return n.space == null
        ? document.createElement(n.local)
        : document.createElementNS(n.space, n.local);
  }

  function qualify(n) {
    var i = n.indexOf(":");
    return {
      space: n$.prefix[n.substring(0, i)],
      local: n.substring(i + 1)
    };
  }

  function N$(e) {
    this.element = e;
  }

  N$.prototype = {

    add: function(c, s) {
      return n$(this.element.insertBefore(
          typeof c == "string" ? create(c) : $n(c),
          arguments.length == 1 ? null : $n(s)));
    },

    remove: function(c) {
      this.element.removeChild($n(c));
      return this;
    },

    parent: function() {
      return n$(this.element.parentNode);
    },

    child: function(i) {
      var children = this.element.childNodes;
      return n$(children[i < 0 ? children.length - i - 1 : i]);
    },

    previous: function() {
      return n$(this.element.previousSibling);
    },

    next: function() {
      return n$(this.element.nextSibling);
    },

    attr: function(n, v) {
      var e = this.element;
      n = qualify(n);
      if (arguments.length == 1) {
        return n.space == null
            ? e.getAttribute(n.local)
            : e.getAttributeNS(n.space, n.local);
      }
      if (n.space == null) {
        if (v == null) e.removeAttribute(n.local);
        else e.setAttribute(n.local, v);
      } else {
        if (v == null) e.removeAttributeNS(n.space, n.local);
        else e.setAttributeNS(n.space, n.local, v);
      }
      return this;
    },

    style: function(n, v, p) {
      var style = this.element.style;
      if (arguments.length == 1) return style.getPropertyValue(n);
      if (v == null) style.removeProperty(n);
      else style.setProperty(n, v, arguments.length == 3 ? p : null);
      return this;
    },

    on: function(t, l, c) {
      this.element.addEventListener(t, l, arguments.length == 3 ? c : false);
      return this;
    },

    off: function(t, l, c) {
      this.element.removeEventListener(t, l, arguments.length == 3 ? c : false);
      return this;
    },

    text: function(v) {
      var t = this.element.firstChild;
      if (!arguments.length) return t && t.nodeValue;
      if (t) t.nodeValue = v;
      else if (v != null) t = this.element.appendChild(document.createTextNode(v));
      return this;
    }
  }

  function n$(e) {
    return e == null || e.element ? e : new N$(typeof e == "string" ? create(e) : e);
  }

  function $n(o) {
    return o && o.element || o;
  }

  n$.prefix = {
    svg: "http://www.w3.org/2000/svg",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  n$.version = "1.1.0";

  _.n$ = n$;
  _.$n = $n;
})(this);


/* **********************************************
     Begin polymaps.js
********************************************** */

if (!org) var org = {};
if (!org.polymaps) org.polymaps = {};
(function(po){

  po.version = "2.5.1"; // semver.org

  var zero = {x: 0, y: 0};
po.ns = {
  svg: "http://www.w3.org/2000/svg",
  xlink: "http://www.w3.org/1999/xlink"
};

function ns(name) {
  var i = name.indexOf(":");
  return i < 0 ? name : {
    space: po.ns[name.substring(0, i)],
    local: name.substring(i + 1)
  };
}
po.id = (function() {
  var id = 0;
  return function() {
    return ++id;
  };
})();
po.svg = function(type) {
  return document.createElementNS(po.ns.svg, type);
};
po.transform = function(a, b, c, d, e, f) {
  var transform = {},
      zoomDelta,
      zoomFraction,
      k;

  if (!arguments.length) {
    a = 1; c = 0; e = 0;
    b = 0; d = 1; f = 0;
  }

  transform.zoomFraction = function(x) {
    if (!arguments.length) return zoomFraction;
    zoomFraction = x;
    zoomDelta = Math.floor(zoomFraction + Math.log(Math.sqrt(a * a + b * b + c * c + d * d)) / Math.LN2);
    k = Math.pow(2, -zoomDelta);
    return transform;
  };

  transform.apply = function(x) {
    var k0 = Math.pow(2, -x.zoom),
        k1 = Math.pow(2, x.zoom - zoomDelta);
    return {
      column: (a * x.column * k0 + c * x.row * k0 + e) * k1,
      row: (b * x.column * k0 + d * x.row * k0 + f) * k1,
      zoom: x.zoom - zoomDelta
    };
  };

  transform.unapply = function(x) {
    var k0 = Math.pow(2, -x.zoom),
        k1 = Math.pow(2, x.zoom + zoomDelta);
    return {
      column: (x.column * k0 * d - x.row * k0 * c - e * d + f * c) / (a * d - b * c) * k1,
      row: (x.column * k0 * b - x.row * k0 * a - e * b + f * a) / (c * b - d * a) * k1,
      zoom: x.zoom + zoomDelta
    };
  };

  transform.toString = function() {
    return "matrix(" + [a * k, b * k, c * k, d * k].join(" ") + " 0 0)";
  };

  return transform.zoomFraction(0);
};
po.cache = function(load, unload) {
  var cache = {},
      locks = {},
      map = {},
      head = null,
      tail = null,
      size = 64,
      n = 0;

  function remove(tile) {
    n--;
    if (unload) unload(tile);
    delete map[tile.key];
    if (tile.next) tile.next.prev = tile.prev;
    else if (tail = tile.prev) tail.next = null;
    if (tile.prev) tile.prev.next = tile.next;
    else if (head = tile.next) head.prev = null;
  }

  function flush() {
    for (var tile = tail; n > size; tile = tile.prev) {
      if (!tile) break;
      if (tile.lock) continue;
      remove(tile);
    }
  }

  cache.peek = function(c) {
    return map[[c.zoom, c.column, c.row].join("/")];
  };

  cache.load = function(c, projection) {
    var key = [c.zoom, c.column, c.row].join("/"),
        tile = map[key];
    if (tile) {
      if (tile.prev) {
        tile.prev.next = tile.next;
        if (tile.next) tile.next.prev = tile.prev;
        else tail = tile.prev;
        tile.prev = null;
        tile.next = head;
        head.prev = tile;
        head = tile;
      }
      tile.lock = 1;
      locks[key] = tile;
      return tile;
    }
    tile = {
      key: key,
      column: c.column,
      row: c.row,
      zoom: c.zoom,
      next: head,
      prev: null,
      lock: 1
    };
    load.call(null, tile, projection);
    locks[key] = map[key] = tile;
    if (head) head.prev = tile;
    else tail = tile;
    head = tile;
    n++;
    return tile;
  };

  cache.unload = function(key) {
    if (!(key in locks)) return false;
    var tile = locks[key];
    tile.lock = 0;
    delete locks[key];
    if (tile.request && tile.request.abort(false)) remove(tile);
    return tile;
  };

  cache.locks = function() {
    return locks;
  };

  cache.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    flush();
    return cache;
  };

  cache.flush = function() {
    flush();
    return cache;
  };

  cache.clear = function() {
    for (var key in map) {
      var tile = map[key];
      if (tile.request) tile.request.abort(false);
      if (unload) unload(map[key]);
      if (tile.lock) {
        tile.lock = 0;
        tile.element.parentNode.removeChild(tile.element);
      }
    }
    locks = {};
    map = {};
    head = tail = null;
    n = 0;
    return cache;
  };

  return cache;
};
po.url = function(template) {
  var hosts = [],
      repeat = true;

  function format(c) {
    var max = c.zoom < 0 ? 1 : 1 << c.zoom,
        column = c.column;
    if (repeat) {
      column = c.column % max;
      if (column < 0) column += max;
    } else if ((column < 0) || (column >= max)) {
      return null;
    }
    return template.replace(/{(.)}/g, function(s, v) {
      switch (v) {
        case "S": return hosts[(Math.abs(c.zoom) + c.row + column) % hosts.length];
        case "Z": return c.zoom;
        case "X": return column;
        case "Y": return c.row;
        case "B": {
          var nw = po.map.coordinateLocation({row: c.row, column: column, zoom: c.zoom}),
              se = po.map.coordinateLocation({row: c.row + 1, column: column + 1, zoom: c.zoom}),
              pn = Math.ceil(Math.log(c.zoom) / Math.LN2);
          return se.lat.toFixed(pn)
              + "," + nw.lon.toFixed(pn)
              + "," + nw.lat.toFixed(pn)
              + "," + se.lon.toFixed(pn);
        }
      }
      return v;
    });
  }

  format.template = function(x) {
    if (!arguments.length) return template;
    template = x;
    return format;
  };

  format.hosts = function(x) {
    if (!arguments.length) return hosts;
    hosts = x;
    return format;
  };

  format.repeat = function(x) {
    if (!arguments.length) return repeat;
    repeat = x;
    return format;
  };

  return format;
};
po.dispatch = function(that) {
  var types = {};

  that.on = function(type, handler) {
    var listeners = types[type] || (types[type] = []);
    for (var i = 0; i < listeners.length; i++) {
      if (listeners[i].handler == handler) return that; // already registered
    }
    listeners.push({handler: handler, on: true});
    return that;
  };

  that.off = function(type, handler) {
    var listeners = types[type];
    if (listeners) for (var i = 0; i < listeners.length; i++) {
      var l = listeners[i];
      if (l.handler == handler) {
        l.on = false;
        listeners.splice(i, 1);
        break;
      }
    }
    return that;
  };

  return function(event) {
    var listeners = types[event.type];
    if (!listeners) return;
    listeners = listeners.slice(); // defensive copy
    for (var i = 0; i < listeners.length; i++) {
      var l = listeners[i];
      if (l.on) l.handler.call(that, event);
    }
  };
};
po.queue = (function() {
  var queued = [], active = 0, size = 6;

  function process() {
    if ((active >= size) || !queued.length) return;
    active++;
    queued.pop()();
  }

  function dequeue(send) {
    for (var i = 0; i < queued.length; i++) {
      if (queued[i] == send) {
        queued.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  function request(url, callback, mimeType) {
    var req;

    function send() {
      req = new XMLHttpRequest();
      if (mimeType && req.overrideMimeType) {
        req.overrideMimeType(mimeType);
      }
      req.open("GET", url, true);
      req.onreadystatechange = function(e) {
        if (req.readyState == 4) {
          active--;
          if (req.status < 300) callback(req);
          process();
        }
      };
      req.send(null);
    }

    function abort(hard) {
      if (dequeue(send)) return true;
      if (hard && req) { req.abort(); return true; }
      return false;
    }

    queued.push(send);
    process();
    return {abort: abort};
  }

  function text(url, callback, mimeType) {
    return request(url, function(req) {
      if (req.responseText) callback(req.responseText);
    }, mimeType);
  }

  /*
   * We the override MIME type here so that you can load local files; some
   * browsers don't assign a proper MIME type for local files.
   */

  function json(url, callback) {
    return request(url, function(req) {
      if (req.responseText) callback(JSON.parse(req.responseText));
    }, "application/json");
  }

  function xml(url, callback) {
    return request(url, function(req) {
      if (req.responseXML) callback(req.responseXML);
    }, "application/xml");
  }

  function image(image, src, callback) {
    var img;

    function send() {
      img = document.createElement("img");
      img.onerror = function() {
        active--;
        process();
      };
      img.onload = function() {
        active--;
        callback(img);
        process();
      };
      img.src = src;
      image.setAttributeNS(po.ns.xlink, "href", src);
    }

    function abort(hard) {
      if (dequeue(send)) return true;
      if (hard && img) { img.src = "about:"; return true; } // cancels request
      return false;
    }

    queued.push(send);
    process();
    return {abort: abort};
  }

  return {text: text, xml: xml, json: json, image: image};
})();
po.map = function() {
  var map = {},
      container,
      size,
      sizeActual = zero,
      sizeRadius = zero, // sizeActual / 2
      tileSize = {x: 256, y: 256},
      center = {lat: 37.76487, lon: -122.41948},
      zoom = 12,
      zoomFraction = 0,
      zoomFactor = 1, // Math.pow(2, zoomFraction)
      zoomRange = [1, 18],
      angle = 0,
      angleCos = 1, // Math.cos(angle)
      angleSin = 0, // Math.sin(angle)
      angleCosi = 1, // Math.cos(-angle)
      angleSini = 0, // Math.sin(-angle)
      ymin = -180, // lat2y(centerRange[0].lat)
      ymax = 180; // lat2y(centerRange[1].lat)

  var centerRange = [
    {lat: y2lat(ymin), lon: -Infinity},
    {lat: y2lat(ymax), lon: Infinity}
  ];

  map.locationCoordinate = function(l) {
    var c = po.map.locationCoordinate(l),
        k = Math.pow(2, zoom);
    c.column *= k;
    c.row *= k;
    c.zoom += zoom;
    return c;
  };

  map.coordinateLocation = po.map.coordinateLocation;

  map.coordinatePoint = function(tileCenter, c) {
    var kc = Math.pow(2, zoom - c.zoom),
        kt = Math.pow(2, zoom - tileCenter.zoom),
        dx = (c.column * kc - tileCenter.column * kt) * tileSize.x * zoomFactor,
        dy = (c.row * kc - tileCenter.row * kt) * tileSize.y * zoomFactor;
    return {
      x: sizeRadius.x + angleCos * dx - angleSin * dy,
      y: sizeRadius.y + angleSin * dx + angleCos * dy
    };
  };

  map.pointCoordinate = function(tileCenter, p) {
    var kt = Math.pow(2, zoom - tileCenter.zoom),
        dx = (p.x - sizeRadius.x) / zoomFactor,
        dy = (p.y - sizeRadius.y) / zoomFactor;
    return {
      column: tileCenter.column * kt + (angleCosi * dx - angleSini * dy) / tileSize.x,
      row: tileCenter.row * kt + (angleSini * dx + angleCosi * dy) / tileSize.y,
      zoom: zoom
    };
  };

  map.locationPoint = function(l) {
    var k = Math.pow(2, zoom + zoomFraction - 3) / 45,
        dx = (l.lon - center.lon) * k * tileSize.x,
        dy = (lat2y(center.lat) - lat2y(l.lat)) * k * tileSize.y;
    return {
      x: sizeRadius.x + angleCos * dx - angleSin * dy,
      y: sizeRadius.y + angleSin * dx + angleCos * dy
    };
  };

  map.pointLocation = function(p) {
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3),
        dx = (p.x - sizeRadius.x) * k,
        dy = (p.y - sizeRadius.y) * k;
    return {
      lon: center.lon + (angleCosi * dx - angleSini * dy) / tileSize.x,
      lat: y2lat(lat2y(center.lat) - (angleSini * dx + angleCosi * dy) / tileSize.y)
    };
  };

  function rezoom() {
    if (zoomRange) {
      if (zoom < zoomRange[0]) zoom = zoomRange[0];
      else if (zoom > zoomRange[1]) zoom = zoomRange[1];
    }
    zoomFraction = zoom - (zoom = Math.round(zoom));
    zoomFactor = Math.pow(2, zoomFraction);
  }

  function recenter() {
    if (!centerRange) return;
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3);

    // constrain latitude
    var y = Math.max(Math.abs(angleSin * sizeRadius.x + angleCos * sizeRadius.y),
                     Math.abs(angleSini * sizeRadius.x + angleCosi * sizeRadius.y)),
        lat0 = y2lat(ymin - y * k / tileSize.y),
        lat1 = y2lat(ymax + y * k / tileSize.y);
    center.lat = Math.max(lat0, Math.min(lat1, center.lat));

    // constrain longitude
    var x = Math.max(Math.abs(angleSin * sizeRadius.y + angleCos * sizeRadius.x),
                     Math.abs(angleSini * sizeRadius.y + angleCosi * sizeRadius.x)),
        lon0 = centerRange[0].lon - x * k / tileSize.x,
        lon1 = centerRange[1].lon + x * k / tileSize.x;
    center.lon = Math.max(lon0, Math.min(lon1, center.lon));
 }

  // a place to capture mouse events if no tiles exist
  var rect = po.svg("rect");
  rect.setAttribute("visibility", "hidden");
  rect.setAttribute("pointer-events", "all");

  map.container = function(x) {
    if (!arguments.length) return container;
    container = x;
    container.setAttribute("class", "map");
    container.appendChild(rect);
    return map.resize(); // infer size
  };

  map.focusableParent = function() {
    for (var p = container; p; p = p.parentNode) {
      if (p.tabIndex >= 0) return p;
    }
    return window;
  };

  map.mouse = function(e) {
    var point = (container.ownerSVGElement || container).createSVGPoint();
    if ((bug44083 < 0) && (window.scrollX || window.scrollY)) {
      var svg = document.body.appendChild(po.svg("svg"));
      svg.style.position = "absolute";
      svg.style.top = svg.style.left = "0px";
      var ctm = svg.getScreenCTM();
      bug44083 = !(ctm.f || ctm.e);
      document.body.removeChild(svg);
    }
    if (bug44083) {
      point.x = e.pageX;
      point.y = e.pageY;
    } else {
      point.x = e.clientX;
      point.y = e.clientY;
    }
    return point.matrixTransform(container.getScreenCTM().inverse());
  };

  map.size = function(x) {
    if (!arguments.length) return sizeActual;
    size = x;
    return map.resize(); // size tiles
  };

  map.resize = function() {
    if (!size) {
      rect.setAttribute("width", "100%");
      rect.setAttribute("height", "100%");
      b = rect.getBBox();
      sizeActual = {x: b.width, y: b.height};
      resizer.add(map);
    } else {
      sizeActual = size;
      resizer.remove(map);
    }
    rect.setAttribute("width", sizeActual.x);
    rect.setAttribute("height", sizeActual.y);
    sizeRadius = {x: sizeActual.x / 2, y: sizeActual.y / 2};
    recenter();
    map.dispatch({type: "resize"});
    return map;
  };

  map.tileSize = function(x) {
    if (!arguments.length) return tileSize;
    tileSize = x;
    map.dispatch({type: "move"});
    return map;
  };

  map.center = function(x) {
    if (!arguments.length) return center;
    center = x;
    recenter();
    map.dispatch({type: "move"});
    return map;
  };

  map.panBy = function(x) {
    var k = 45 / Math.pow(2, zoom + zoomFraction - 3),
        dx = x.x * k,
        dy = x.y * k;
    return map.center({
      lon: center.lon + (angleSini * dy - angleCosi * dx) / tileSize.x,
      lat: y2lat(lat2y(center.lat) + (angleSini * dx + angleCosi * dy) / tileSize.y)
    });
  };

  map.centerRange = function(x) {
    if (!arguments.length) return centerRange;
    centerRange = x;
    if (centerRange) {
      ymin = centerRange[0].lat > -90 ? lat2y(centerRange[0].lat) : -Infinity;
      ymax = centerRange[0].lat < 90 ? lat2y(centerRange[1].lat) : Infinity;
    } else {
      ymin = -Infinity;
      ymax = Infinity;
    }
    recenter();
    map.dispatch({type: "move"});
    return map;
  };

  map.zoom = function(x) {
    if (!arguments.length) return zoom + zoomFraction;
    zoom = x;
    rezoom();
    return map.center(center);
  };

  map.zoomBy = function(z, x0, l) {
    if (arguments.length < 2) return map.zoom(zoom + zoomFraction + z);

    // compute the location of x0
    if (arguments.length < 3) l = map.pointLocation(x0);

    // update the zoom level
    zoom = zoom + zoomFraction + z;
    rezoom();

    // compute the new point of the location
    var x1 = map.locationPoint(l);

    return map.panBy({x: x0.x - x1.x, y: x0.y - x1.y});
  };

  map.zoomRange = function(x) {
    if (!arguments.length) return zoomRange;
    zoomRange = x;
    return map.zoom(zoom + zoomFraction);
  };

  map.extent = function(x) {
    if (!arguments.length) return [
      map.pointLocation({x: 0, y: sizeActual.y}),
      map.pointLocation({x: sizeActual.x, y: 0})
    ];

    // compute the extent in points, scale factor, and center
    var bl = map.locationPoint(x[0]),
        tr = map.locationPoint(x[1]),
        k = Math.max((tr.x - bl.x) / sizeActual.x, (bl.y - tr.y) / sizeActual.y),
        l = map.pointLocation({x: (bl.x + tr.x) / 2, y: (bl.y + tr.y) / 2});

    // update the zoom level
    zoom = zoom + zoomFraction - Math.log(k) / Math.LN2;
    rezoom();

    // set the new center
    return map.center(l);
  };

  map.angle = function(x) {
    if (!arguments.length) return angle;
    angle = x;
    angleCos = Math.cos(angle);
    angleSin = Math.sin(angle);
    angleCosi = Math.cos(-angle);
    angleSini = Math.sin(-angle);
    recenter();
    map.dispatch({type: "move"});
    return map;
  };

  map.add = function(x) {
    x.map(map);
    return map;
  };

  map.remove = function(x) {
    x.map(null);
    return map;
  };

  map.dispatch = po.dispatch(map);

  return map;
};

function resizer(e) {
  for (var i = 0; i < resizer.maps.length; i++) {
    resizer.maps[i].resize();
  }
}

resizer.maps = [];

resizer.add = function(map) {
  for (var i = 0; i < resizer.maps.length; i++) {
    if (resizer.maps[i] == map) return;
  }
  resizer.maps.push(map);
};

resizer.remove = function(map) {
  for (var i = 0; i < resizer.maps.length; i++) {
    if (resizer.maps[i] == map) {
      resizer.maps.splice(i, 1);
      return;
    }
  }
};

// Note: assumes single window (no frames, iframes, etc.)!
if (window.addEventListener) {
  window.addEventListener("resize", resizer, false);
  window.addEventListener("load", resizer, false);
}

// See http://wiki.openstreetmap.org/wiki/Mercator

function y2lat(y) {
  return 360 / Math.PI * Math.atan(Math.exp(y * Math.PI / 180)) - 90;
}

function lat2y(lat) {
  return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
}

po.map.locationCoordinate = function(l) {
  var k = 1 / 360;
  return {
    column: (l.lon + 180) * k,
    row: (180 - lat2y(l.lat)) * k,
    zoom: 0
  };
};

po.map.coordinateLocation = function(c) {
  var k = 45 / Math.pow(2, c.zoom - 3);
  return {
    lon: k * c.column - 180,
    lat: y2lat(180 - k * c.row)
  };
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var bug44083 = /WebKit/.test(navigator.userAgent) ? -1 : 0;
po.layer = function(load, unload) {
  var layer = {},
      cache = layer.cache = po.cache(load, unload).size(512),
      tile = true,
      visible = true,
      zoom,
      id,
      map,
      container = po.svg("g"),
      transform,
      levelZoom,
      levels = {};

  container.setAttribute("class", "layer");
  for (var i = -4; i <= -1; i++) levels[i] = container.appendChild(po.svg("g"));
  for (var i = 2; i >= 1; i--) levels[i] = container.appendChild(po.svg("g"));
  levels[0] = container.appendChild(po.svg("g"));

  function zoomIn(z) {
    var end = levels[0].nextSibling;
    for (; levelZoom < z; levelZoom++) {
      // -4, -3, -2, -1, +2, +1, =0 // current order
      // -3, -2, -1, +2, +1, =0, -4 // insertBefore(-4, end)
      // -3, -2, -1, +1, =0, -4, +2 // insertBefore(+2, end)
      // -3, -2, -1, =0, -4, +2, +1 // insertBefore(+1, end)
      // -4, -3, -2, -1, +2, +1, =0 // relabel
      container.insertBefore(levels[-4], end);
      container.insertBefore(levels[2], end);
      container.insertBefore(levels[1], end);
      var t = levels[-4];
      for (var dz = -4; dz < 2;) levels[dz] = levels[++dz];
      levels[dz] = t;
    }
  }

  function zoomOut(z) {
    var end = levels[0].nextSibling;
    for (; levelZoom > z; levelZoom--) {
      // -4, -3, -2, -1, +2, +1, =0 // current order
      // -4, -3, -2, +2, +1, =0, -1 // insertBefore(-1, end)
      // +2, -4, -3, -2, +1, =0, -1 // insertBefore(+2, -4)
      // -4, -3, -2, -1, +2, +1, =0 // relabel
      container.insertBefore(levels[-1], end);
      container.insertBefore(levels[2], levels[-4]);
      var t = levels[2];
      for (var dz = 2; dz > -4;) levels[dz] = levels[--dz];
      levels[dz] = t;
    }
  }

  function move() {
    var map = layer.map(), // in case the layer is removed
        mapZoom = map.zoom(),
        mapZoomFraction = mapZoom - (mapZoom = Math.round(mapZoom)),
        mapSize = map.size(),
        mapAngle = map.angle(),
        tileSize = map.tileSize(),
        tileCenter = map.locationCoordinate(map.center());

    // set the layer zoom levels
    if (levelZoom != mapZoom) {
      if (levelZoom < mapZoom) zoomIn(mapZoom);
      else if (levelZoom > mapZoom) zoomOut(mapZoom);
      else levelZoom = mapZoom;
      for (var z = -4; z <= 2; z++) {
        var l = levels[z];
        l.setAttribute("class", "zoom" + (z < 0 ? "" : "+") + z + " zoom" + (mapZoom + z));
        l.setAttribute("transform", "scale(" + Math.pow(2, -z) + ")");
      }
    }

    // set the layer transform
    container.setAttribute("transform",
        "translate(" + (mapSize.x / 2) + "," + (mapSize.y / 2) + ")"
        + (mapAngle ? "rotate(" + mapAngle / Math.PI * 180 + ")" : "")
        + (mapZoomFraction ? "scale(" + Math.pow(2, mapZoomFraction) + ")" : "")
        + (transform ? transform.zoomFraction(mapZoomFraction) : ""));

    // get the coordinates of the four corners
    var c0 = map.pointCoordinate(tileCenter, zero),
        c1 = map.pointCoordinate(tileCenter, {x: mapSize.x, y: 0}),
        c2 = map.pointCoordinate(tileCenter, mapSize),
        c3 = map.pointCoordinate(tileCenter, {x: 0, y: mapSize.y});

    // round to pixel boundary to avoid anti-aliasing artifacts
    if (!mapZoomFraction && !mapAngle && !transform) {
      tileCenter.column = (Math.round(tileSize.x * tileCenter.column) + (mapSize.x & 1) / 2) / tileSize.x;
      tileCenter.row = (Math.round(tileSize.y * tileCenter.row) + (mapSize.y & 1) / 2) / tileSize.y;
    }

    // layer-specific coordinate transform
    if (transform) {
      c0 = transform.unapply(c0);
      c1 = transform.unapply(c1);
      c2 = transform.unapply(c2);
      c3 = transform.unapply(c3);
      tileCenter = transform.unapply(tileCenter);
    }

    // layer-specific zoom transform
    var tileLevel = zoom ? zoom(c0.zoom) - c0.zoom : 0;
    if (tileLevel) {
      var k = Math.pow(2, tileLevel);
      c0.column *= k; c0.row *= k;
      c1.column *= k; c1.row *= k;
      c2.column *= k; c2.row *= k;
      c3.column *= k; c3.row *= k;
      c0.zoom = c1.zoom = c2.zoom = c3.zoom += tileLevel;
    }

    // tile-specific projection
    function projection(c) {
      var zoom = c.zoom,
          max = zoom < 0 ? 1 : 1 << zoom,
          column = c.column % max,
          row = c.row;
      if (column < 0) column += max;
      return {
        locationPoint: function(l) {
          var c = po.map.locationCoordinate(l),
              k = Math.pow(2, zoom - c.zoom);
          return {
            x: tileSize.x * (k * c.column - column),
            y: tileSize.y * (k * c.row - row)
          };
        }
      };
    }

    // record which tiles are visible
    var oldLocks = cache.locks(), newLocks = {};

    // reset the proxy counts
    for (var key in oldLocks) {
      oldLocks[key].proxyCount = 0;
    }

    // load the tiles!
    if (visible && tileLevel > -5 && tileLevel < 3) {
      var ymax = c0.zoom < 0 ? 1 : 1 << c0.zoom;
      if (tile) {
        scanTriangle(c0, c1, c2, 0, ymax, scanLine);
        scanTriangle(c2, c3, c0, 0, ymax, scanLine);
      } else {
        var x = Math.floor((c0.column + c2.column) / 2),
            y = Math.max(0, Math.min(ymax - 1, Math.floor((c1.row + c3.row) / 2))),
            z = Math.min(4, c0.zoom);
        x = x >> z << z;
        y = y >> z << z;
        scanLine(x, x + 1, y);
      }
    }

    // scan-line conversion
    function scanLine(x0, x1, y) {
      var z = c0.zoom,
          z0 = 2 - tileLevel,
          z1 = 4 + tileLevel;

      for (var x = x0; x < x1; x++) {
        var t = cache.load({column: x, row: y, zoom: z}, projection);
        if (!t.ready && !(t.key in newLocks)) {
          t.proxyRefs = {};
          var c, full, proxy;

          // downsample high-resolution tiles
          for (var dz = 1; dz <= z0; dz++) {
            full = true;
            for (var dy = 0, k = 1 << dz; dy <= k; dy++) {
              for (var dx = 0; dx <= k; dx++) {
                proxy = cache.peek(c = {
                  column: (x << dz) + dx,
                  row: (y << dz) + dy,
                  zoom: z + dz
                });
                if (proxy && proxy.ready) {
                  newLocks[proxy.key] = cache.load(c);
                  proxy.proxyCount++;
                  t.proxyRefs[proxy.key] = proxy;
                } else {
                  full = false;
                }
              }
            }
            if (full) break;
          }

          // upsample low-resolution tiles
          if (!full) {
            for (var dz = 1; dz <= z1; dz++) {
              proxy = cache.peek(c = {
                column: x >> dz,
                row: y >> dz,
                zoom: z - dz
              });
              if (proxy && proxy.ready) {
                newLocks[proxy.key] = cache.load(c);
                proxy.proxyCount++;
                t.proxyRefs[proxy.key] = proxy;
                break;
              }
            }
          }
        }
        newLocks[t.key] = t;
      }
    }

    // position tiles
    for (var key in newLocks) {
      var t = newLocks[key],
          k = Math.pow(2, t.level = t.zoom - tileCenter.zoom);
      t.element.setAttribute("transform", "translate("
        + (t.x = tileSize.x * (t.column - tileCenter.column * k)) + ","
        + (t.y = tileSize.y * (t.row - tileCenter.row * k)) + ")");
    }

    // remove tiles that are no longer visible
    for (var key in oldLocks) {
      if (!(key in newLocks)) {
        var t = cache.unload(key);
        t.element.parentNode.removeChild(t.element);
        delete t.proxyRefs;
      }
    }

    // append tiles that are now visible
    for (var key in newLocks) {
      var t = newLocks[key];
      if (t.element.parentNode != levels[t.level]) {
        levels[t.level].appendChild(t.element);
        if (layer.show) layer.show(t);
      }
    }

    // flush the cache, clearing no-longer-needed tiles
    cache.flush();

    // dispatch the move event
    layer.dispatch({type: "move"});
  }

  // remove proxy tiles when tiles load
  function cleanup(e) {
    if (e.tile.proxyRefs) {
      for (var proxyKey in e.tile.proxyRefs) {
        var proxyTile = e.tile.proxyRefs[proxyKey];
        if ((--proxyTile.proxyCount <= 0) && cache.unload(proxyKey)) {
          proxyTile.element.parentNode.removeChild(proxyTile.element);
        }
      }
      delete e.tile.proxyRefs;
    }
  }

  layer.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      if (map == x) {
        container.parentNode.appendChild(container); // move to end
        return layer;
      }
      map.off("move", move).off("resize", move);
      container.parentNode.removeChild(container);
    }
    map = x;
    if (map) {
      map.container().appendChild(container);
      if (layer.init) layer.init(container);
      map.on("move", move).on("resize", move);
      move();
    }
    return layer;
  };

  layer.container = function() {
    return container;
  };

  layer.levels = function() {
    return levels;
  };

  layer.id = function(x) {
    if (!arguments.length) return id;
    id = x;
    container.setAttribute("id", x);
    return layer;
  };

  layer.visible = function(x) {
    if (!arguments.length) return visible;
    if (visible = x) container.removeAttribute("visibility")
    else container.setAttribute("visibility", "hidden");
    if (map) move();
    return layer;
  };

  layer.transform = function(x) {
    if (!arguments.length) return transform;
    transform = x;
    if (map) move();
    return layer;
  };

  layer.zoom = function(x) {
    if (!arguments.length) return zoom;
    zoom = typeof x == "function" || x == null ? x : function() { return x; };
    if (map) move();
    return layer;
  };

  layer.tile = function(x) {
    if (!arguments.length) return tile;
    tile = x;
    if (map) move();
    return layer;
  };

  layer.reload = function() {
    cache.clear();
    if (map) move();
    return layer;
  };

  layer.dispatch = po.dispatch(layer);
  layer.on("load", cleanup);

  return layer;
};

// scan-line conversion
function edge(a, b) {
  if (a.row > b.row) { var t = a; a = b; b = t; }
  return {
    x0: a.column,
    y0: a.row,
    x1: b.column,
    y1: b.row,
    dx: b.column - a.column,
    dy: b.row - a.row
  };
}

// scan-line conversion
function scanSpans(e0, e1, ymin, ymax, scanLine) {
  var y0 = Math.max(ymin, Math.floor(e1.y0)),
      y1 = Math.min(ymax, Math.ceil(e1.y1));

  // sort edges by x-coordinate
  if ((e0.x0 == e1.x0 && e0.y0 == e1.y0)
      ? (e0.x0 + e1.dy / e0.dy * e0.dx < e1.x1)
      : (e0.x1 - e1.dy / e0.dy * e0.dx < e1.x0)) {
    var t = e0; e0 = e1; e1 = t;
  }

  // scan lines!
  var m0 = e0.dx / e0.dy,
      m1 = e1.dx / e1.dy,
      d0 = e0.dx > 0, // use y + 1 to compute x0
      d1 = e1.dx < 0; // use y + 1 to compute x1
  for (var y = y0; y < y1; y++) {
    var x0 = m0 * Math.max(0, Math.min(e0.dy, y + d0 - e0.y0)) + e0.x0,
        x1 = m1 * Math.max(0, Math.min(e1.dy, y + d1 - e1.y0)) + e1.x0;
    scanLine(Math.floor(x1), Math.ceil(x0), y);
  }
}

// scan-line conversion
function scanTriangle(a, b, c, ymin, ymax, scanLine) {
  var ab = edge(a, b),
      bc = edge(b, c),
      ca = edge(c, a);

  // sort edges by y-length
  if (ab.dy > bc.dy) { var t = ab; ab = bc; bc = t; }
  if (ab.dy > ca.dy) { var t = ab; ab = ca; ca = t; }
  if (bc.dy > ca.dy) { var t = bc; bc = ca; ca = t; }

  // scan span! scan span!
  if (ab.dy) scanSpans(ca, ab, ymin, ymax, scanLine);
  if (bc.dy) scanSpans(ca, bc, ymin, ymax, scanLine);
}
po.image = function() {
  var image = po.layer(load, unload),
      url;

  function load(tile) {
    var element = tile.element = po.svg("image"), size = image.map().tileSize();
    element.setAttribute("preserveAspectRatio", "none");
    element.setAttribute("width", size.x);
    element.setAttribute("height", size.y);

    if (typeof url == "function") {
      element.setAttribute("opacity", 0);
      var tileUrl = url(tile);
      if (tileUrl != null) {
        tile.request = po.queue.image(element, tileUrl, function(img) {
          delete tile.request;
          tile.ready = true;
          tile.img = img;
          element.removeAttribute("opacity");
          image.dispatch({type: "load", tile: tile});
        });
      } else {
        tile.ready = true;
        image.dispatch({type: "load", tile: tile});
      }
    } else {
      tile.ready = true;
      if (url != null) element.setAttributeNS(po.ns.xlink, "href", url);
      image.dispatch({type: "load", tile: tile});
    }
  }

  function unload(tile) {
    if (tile.request) tile.request.abort(true);
  }

  image.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x == "string" && /{.}/.test(x) ? po.url(x) : x;
    return image.reload();
  };

  return image;
};
po.geoJson = function(fetch) {
  var geoJson = po.layer(load, unload),
      container = geoJson.container(),
      url,
      clip = true,
      clipId = "org.polymaps." + po.id(),
      clipHref = "url(#" + clipId + ")",
      clipPath = container.insertBefore(po.svg("clipPath"), container.firstChild),
      clipRect = clipPath.appendChild(po.svg("rect")),
      scale = "auto",
      zoom = null,
      features;

  container.setAttribute("fill-rule", "evenodd");
  clipPath.setAttribute("id", clipId);

  if (!arguments.length) fetch = po.queue.json;

  function projection(proj) {
    var l = {lat: 0, lon: 0};
    return function(coordinates) {
      l.lat = coordinates[1];
      l.lon = coordinates[0];
      var p = proj(l);
      coordinates.x = p.x;
      coordinates.y = p.y;
      return p;
    };
  }

  function geometry(o, proj) {
    return o && o.type in types && types[o.type](o, proj);
  }

  var types = {

    Point: function(o, proj) {
      var p = proj(o.coordinates),
          c = po.svg("circle");
      c.setAttribute("r", 4.5);
      c.setAttribute("transform", "translate(" + p.x + "," + p.y + ")");
      return c;
    },

    MultiPoint: function(o, proj) {
      var g = po.svg("g"),
          c = o.coordinates,
          p, // proj(c[i])
          x, // svg:circle
          i = -1,
          n = c.length;
      while (++i < n) {
        x = g.appendChild(po.svg("circle"));
        x.setAttribute("r", 4.5);
        x.setAttribute("transform", "translate(" + (p = proj(c[i])).x + "," + p.y + ")");
      }
      return g;
    },

    LineString: function(o, proj) {
      var x = po.svg("path"),
          d = ["M"],
          c = o.coordinates,
          p, // proj(c[i])
          i = -1,
          n = c.length;
      while (++i < n) d.push((p = proj(c[i])).x, ",", p.y, "L");
      d.pop();
      if (!d.length) return;
      x.setAttribute("d", d.join(""));
      return x;
    },

    MultiLineString: function(o, proj) {
      var x = po.svg("path"),
          d = [],
          ci = o.coordinates,
          cj, // ci[i]
          i = -1,
          j,
          n = ci.length,
          m;
      while (++i < n) {
        cj = ci[i];
        j = -1;
        m = cj.length;
        d.push("M");
        while (++j < m) d.push((p = proj(cj[j])).x, ",", p.y, "L");
        d.pop();
      }
      if (!d.length) return;
      x.setAttribute("d", d.join(""));
      return x;
    },

    Polygon: function(o, proj) {
      var x = po.svg("path"),
          d = [],
          ci = o.coordinates,
          cj, // ci[i]
          i = -1,
          j,
          n = ci.length,
          m;
      while (++i < n) {
        cj = ci[i];
        j = -1;
        m = cj.length - 1;
        d.push("M");
        while (++j < m) d.push((p = proj(cj[j])).x, ",", p.y, "L");
        d[d.length - 1] = "Z";
      }
      if (!d.length) return;
      x.setAttribute("d", d.join(""));
      return x;
    },

    MultiPolygon: function(o, proj) {
      var x = po.svg("path"),
          d = [],
          ci = o.coordinates,
          cj, // ci[i]
          ck, // cj[j]
          i = -1,
          j,
          k,
          n = ci.length,
          m,
          l;
      while (++i < n) {
        cj = ci[i];
        j = -1;
        m = cj.length;
        while (++j < m) {
          ck = cj[j];
          k = -1;
          l = ck.length - 1;
          d.push("M");
          while (++k < l) d.push((p = proj(ck[k])).x, ",", p.y, "L");
          d[d.length - 1] = "Z";
        }
      }
      if (!d.length) return;
      x.setAttribute("d", d.join(""));
      return x;
    },

    GeometryCollection: function(o, proj) {
      var g = po.svg("g"),
          i = -1,
          c = o.geometries,
          n = c.length,
          x;
      while (++i < n) {
        x = geometry(c[i], proj);
        if (x) g.appendChild(x);
      }
      return g;
    }

  };

  function rescale(o, e, k) {
    return o.type in rescales && rescales[o.type](o, e, k);
  }

  var rescales = {

    Point: function (o, e, k) {
      var p = o.coordinates;
      e.setAttribute("transform", "translate(" + p.x + "," + p.y + ")" + k);
    },

    MultiPoint: function (o, e, k) {
      var c = o.coordinates,
          i = -1,
          n = p.length,
          x = e.firstChild,
          p;
      while (++i < n) {
        p = c[i];
        x.setAttribute("transform", "translate(" + p.x + "," + p.y + ")" + k);
        x = x.nextSibling;
      }
    }

  };

  function load(tile, proj) {
    var g = tile.element = po.svg("g");
    tile.features = [];

    proj = projection(proj(tile).locationPoint);

    function update(data) {
      var updated = [];

      /* Fetch the next batch of features, if so directed. */
      if (data.next) tile.request = fetch(data.next.href, update);

      /* Convert the GeoJSON to SVG. */
      switch (data.type) {
        case "FeatureCollection": {
          for (var i = 0; i < data.features.length; i++) {
            var feature = data.features[i],
                element = geometry(feature.geometry, proj);
            if (element) updated.push({element: g.appendChild(element), data: feature});
          }
          break;
        }
        case "Feature": {
          var element = geometry(data.geometry, proj);
          if (element) updated.push({element: g.appendChild(element), data: data});
          break;
        }
        default: {
          var element = geometry(data, proj);
          if (element) updated.push({element: g.appendChild(element), data: {type: "Feature", geometry: data}});
          break;
        }
      }

      tile.ready = true;
      updated.push.apply(tile.features, updated);
      geoJson.dispatch({type: "load", tile: tile, features: updated});
    }

    if (url != null) {
      tile.request = fetch(typeof url == "function" ? url(tile) : url, update);
    } else {
      update({type: "FeatureCollection", features: features || []});
    }
  }

  function unload(tile) {
    if (tile.request) tile.request.abort(true);
  }

  function move() {
    var zoom = geoJson.map().zoom(),
        tiles = geoJson.cache.locks(), // visible tiles
        key, // key in locks
        tile, // locks[key]
        features, // tile.features
        i, // current feature index
        n, // current feature count, features.length
        feature, // features[i]
        k; // scale transform
    if (scale == "fixed") {
      for (key in tiles) {
        if ((tile = tiles[key]).scale != zoom) {
          k = "scale(" + Math.pow(2, tile.zoom - zoom) + ")";
          i = -1;
          n = (features = tile.features).length;
          while (++i < n) rescale((feature = features[i]).data.geometry, feature.element, k);
          tile.scale = zoom;
        }
      }
    } else {
      for (key in tiles) {
        i = -1;
        n = (features = (tile = tiles[key]).features).length;
        while (++i < n) rescale((feature = features[i]).data.geometry, feature.element, "");
        delete tile.scale;
      }
    }
  }

  geoJson.url = function(x) {
    if (!arguments.length) return url;
    url = typeof x == "string" && /{.}/.test(x) ? po.url(x) : x;
    if (url != null) features = null;
    if (typeof url == "string") geoJson.tile(false);
    return geoJson.reload();
  };

  geoJson.features = function(x) {
    if (!arguments.length) return features;
    if (features = x) {
      url = null;
      geoJson.tile(false);
    }
    return geoJson.reload();
  };

  geoJson.clip = function(x) {
    if (!arguments.length) return clip;
    if (clip) container.removeChild(clipPath);
    if (clip = x) container.insertBefore(clipPath, container.firstChild);
    var locks = geoJson.cache.locks();
    for (var key in locks) {
      if (clip) locks[key].element.setAttribute("clip-path", clipHref);
      else locks[key].element.removeAttribute("clip-path");
    }
    return geoJson;
  };

  var __tile__ = geoJson.tile;
  geoJson.tile = function(x) {
    if (arguments.length && !x) geoJson.clip(x);
    return __tile__.apply(geoJson, arguments);
  };

  var __map__ = geoJson.map;
  geoJson.map = function(x) {
    if (x && clipRect) {
      var size = x.tileSize();
      clipRect.setAttribute("width", size.x);
      clipRect.setAttribute("height", size.y);
    }
    return __map__.apply(geoJson, arguments);
  };

  geoJson.scale = function(x) {
    if (!arguments.length) return scale;
    if (scale = x) geoJson.on("move", move);
    else geoJson.off("move", move);
    if (geoJson.map()) move();
    return geoJson;
  };

  geoJson.show = function(tile) {
    if (clip) tile.element.setAttribute("clip-path", clipHref);
    else tile.element.removeAttribute("clip-path");
    geoJson.dispatch({type: "show", tile: tile, features: tile.features});
    return geoJson;
  };

  geoJson.reshow = function() {
    var locks = geoJson.cache.locks();
    for (var key in locks) geoJson.show(locks[key]);
    return geoJson;
  };

  return geoJson;
};
po.dblclick = function() {
  var dblclick = {},
      zoom = "mouse",
      map,
      container;

  function handle(e) {
    var z = map.zoom();
    if (e.shiftKey) z = Math.ceil(z) - z - 1;
    else z = 1 - z + Math.floor(z);
    zoom === "mouse" ? map.zoomBy(z, map.mouse(e)) : map.zoomBy(z);
  }

  dblclick.zoom = function(x) {
    if (!arguments.length) return zoom;
    zoom = x;
    return dblclick;
  };

  dblclick.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("dblclick", handle, false);
      container = null;
    }
    if (map = x) {
      container = map.container();
      container.addEventListener("dblclick", handle, false);
    }
    return dblclick;
  };

  return dblclick;
};
po.drag = function() {
  var drag = {},
      map,
      container,
      dragging;

  function mousedown(e) {
    if (e.shiftKey) return;
    dragging = {
      x: e.clientX,
      y: e.clientY
    };
    map.focusableParent().focus();
    e.preventDefault();
    document.body.style.setProperty("cursor", "move", null);
  }

  function mousemove(e) {
    if (!dragging) return;
    map.panBy({x: e.clientX - dragging.x, y: e.clientY - dragging.y});
    dragging.x = e.clientX;
    dragging.y = e.clientY;
  }

  function mouseup(e) {
    if (!dragging) return;
    mousemove(e);
    dragging = null;
    document.body.style.removeProperty("cursor");
  }

  drag.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("mousedown", mousedown, false);
      container = null;
    }
    if (map = x) {
      container = map.container();
      container.addEventListener("mousedown", mousedown, false);
    }
    return drag;
  };

  window.addEventListener("mousemove", mousemove, false);
  window.addEventListener("mouseup", mouseup, false);

  return drag;
};
po.wheel = function() {
  var wheel = {},
      timePrev = 0,
      last = 0,
      smooth = true,
      zoom = "mouse",
      location,
      map,
      container;

  function move(e) {
    location = null;
  }

  // mousewheel events are totally broken!
  // https://bugs.webkit.org/show_bug.cgi?id=40441
  // not only that, but Chrome and Safari differ in re. to acceleration!
  var inner = document.createElement("div"),
      outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.top = "0px";
  outer.style.height = "0px";
  outer.style.width = "0px";
  outer.style.overflowY = "scroll";
  inner.style.height = "2000px";
  outer.appendChild(inner);
  document.body.appendChild(outer);

  function mousewheel(e) {
    var delta = e.wheelDelta || -e.detail,
        point;

    /* Detect the pixels that would be scrolled by this wheel event. */
    if (delta) {
      if (smooth) {
        try {
          outer.scrollTop = 1000;
          outer.dispatchEvent(e);
          delta = 1000 - outer.scrollTop;
        } catch (error) {
          // Derp! Hope for the best?
        }
        delta *= .005;
      }

      /* If smooth zooming is disabled, batch events into unit steps. */
      else {
        var timeNow = Date.now();
        if (timeNow - timePrev > 200) {
          delta = delta > 0 ? +1 : -1;
          timePrev = timeNow;
        } else {
          delta = 0;
        }
      }
    }

    if (delta) {
      switch (zoom) {
        case "mouse": {
          point = map.mouse(e);
          if (!location) location = map.pointLocation(point);
          map.off("move", move).zoomBy(delta, point, location).on("move", move);
          break;
        }
        case "location": {
          map.zoomBy(delta, map.locationPoint(location), location);
          break;
        }
        default: { // center
          map.zoomBy(delta);
          break;
        }
      }
    }

    e.preventDefault();
    return false; // for Firefox
  }

  wheel.smooth = function(x) {
    if (!arguments.length) return smooth;
    smooth = x;
    return wheel;
  };

  wheel.zoom = function(x, l) {
    if (!arguments.length) return zoom;
    zoom = x;
    location = l;
    if (map) {
      if (zoom == "mouse") map.on("move", move);
      else map.off("move", move);
    }
    return wheel;
  };

  wheel.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("mousemove", move, false);
      container.removeEventListener("mousewheel", mousewheel, false);
      container.removeEventListener("MozMousePixelScroll", mousewheel, false);
      container = null;
      map.off("move", move);
    }
    if (map = x) {
      if (zoom == "mouse") map.on("move", move);
      container = map.container();
      container.addEventListener("mousemove", move, false);
      container.addEventListener("mousewheel", mousewheel, false);
      container.addEventListener("MozMousePixelScroll", mousewheel, false);
    }
    return wheel;
  };

  return wheel;
};
po.arrow = function() {
  var arrow = {},
      key = {left: 0, right: 0, up: 0, down: 0},
      last = 0,
      repeatTimer,
      repeatDelay = 250,
      repeatInterval = 50,
      speed = 16,
      map,
      parent;

  function keydown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    var now = Date.now(), dx = 0, dy = 0;
    switch (e.keyCode) {
      case 37: {
        if (!key.left) {
          last = now;
          key.left = 1;
          if (!key.right) dx = speed;
        }
        break;
      }
      case 39: {
        if (!key.right) {
          last = now;
          key.right = 1;
          if (!key.left) dx = -speed;
        }
        break;
      }
      case 38: {
        if (!key.up) {
          last = now;
          key.up = 1;
          if (!key.down) dy = speed;
        }
        break;
      }
      case 40: {
        if (!key.down) {
          last = now;
          key.down = 1;
          if (!key.up) dy = -speed;
        }
        break;
      }
      default: return;
    }
    if (dx || dy) map.panBy({x: dx, y: dy});
    if (!repeatTimer && (key.left | key.right | key.up | key.down)) {
      repeatTimer = setInterval(repeat, repeatInterval);
    }
    e.preventDefault();
  }

  function keyup(e) {
    last = Date.now();
    switch (e.keyCode) {
      case 37: key.left = 0; break;
      case 39: key.right = 0; break;
      case 38: key.up = 0; break;
      case 40: key.down = 0; break;
      default: return;
    }
    if (repeatTimer && !(key.left | key.right | key.up | key.down)) {
      repeatTimer = clearInterval(repeatTimer);
    }
    e.preventDefault();
  }

  function keypress(e) {
    switch (e.charCode) {
      case 45: case 95: map.zoom(Math.ceil(map.zoom()) - 1); break; // - _
      case 43: case 61: map.zoom(Math.floor(map.zoom()) + 1); break; // = +
      default: return;
    }
    e.preventDefault();
  }

  function repeat() {
    if (!map) return;
    if (Date.now() < last + repeatDelay) return;
    var dx = (key.left - key.right) * speed,
        dy = (key.up - key.down) * speed;
    if (dx || dy) map.panBy({x: dx, y: dy});
  }

  arrow.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      parent.removeEventListener("keypress", keypress, false);
      parent.removeEventListener("keydown", keydown, false);
      parent.removeEventListener("keyup", keyup, false);
      parent = null;
    }
    if (map = x) {
      parent = map.focusableParent();
      parent.addEventListener("keypress", keypress, false);
      parent.addEventListener("keydown", keydown, false);
      parent.addEventListener("keyup", keyup, false);
    }
    return arrow;
  };

  arrow.speed = function(x) {
    if (!arguments.length) return speed;
    speed = x;
    return arrow;
  };

  return arrow;
};
po.hash = function() {
  var hash = {},
      s0, // cached location.hash
      lat = 90 - 1e-8, // allowable latitude range
      map;

  var parser = function(map, s) {
    var args = s.split("/").map(Number);
    if (args.length < 3 || args.some(isNaN)) return true; // replace bogus hash
    else {
      var size = map.size();
      map.zoomBy(args[0] - map.zoom(),
          {x: size.x / 2, y: size.y / 2},
          {lat: Math.min(lat, Math.max(-lat, args[1])), lon: args[2]});
    }
  };

  var formatter = function(map) {
    var center = map.center(),
        zoom = map.zoom(),
        precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
    return "#" + zoom.toFixed(2)
             + "/" + center.lat.toFixed(precision)
             + "/" + center.lon.toFixed(precision);
  };

  function move() {
    var s1 = formatter(map);
    if (s0 !== s1) location.replace(s0 = s1); // don't recenter the map!
  }

  function hashchange() {
    if (location.hash === s0) return; // ignore spurious hashchange events
    if (parser(map, (s0 = location.hash).substring(1)))
      move(); // replace bogus hash
  }

  hash.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      map.off("move", move);
      window.removeEventListener("hashchange", hashchange, false);
    }
    if (map = x) {
      map.on("move", move);
      window.addEventListener("hashchange", hashchange, false);
      location.hash ? hashchange() : move();
    }
    return hash;
  };

  hash.parser = function(x) {
    if (!arguments.length) return parser;
    parser = x;
    return hash;
  };

  hash.formatter = function(x) {
    if (!arguments.length) return formatter;
    formatter = x;
    return hash;
  };

  return hash;
};
po.touch = function() {
  var touch = {},
      map,
      container,
      rotate = false,
      last = 0,
      zoom,
      angle,
      locations = {}; // touch identifier -> location

  window.addEventListener("touchmove", touchmove, false);

  function touchstart(e) {
    var i = -1,
        n = e.touches.length,
        t = Date.now();

    // doubletap detection
    if ((n == 1) && (t - last < 300)) {
      var z = map.zoom();
      map.zoomBy(1 - z + Math.floor(z), map.mouse(e.touches[0]));
      e.preventDefault();
    }
    last = t;

    // store original zoom & touch locations
    zoom = map.zoom();
    angle = map.angle();
    while (++i < n) {
      t = e.touches[i];
      locations[t.identifier] = map.pointLocation(map.mouse(t));
    }
  }

  function touchmove(e) {
    switch (e.touches.length) {
      case 1: { // single-touch pan
        var t0 = e.touches[0];
        map.zoomBy(0, map.mouse(t0), locations[t0.identifier]);
        e.preventDefault();
        break;
      }
      case 2: { // double-touch pan + zoom + rotate
        var t0 = e.touches[0],
            t1 = e.touches[1],
            p0 = map.mouse(t0),
            p1 = map.mouse(t1),
            p2 = {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2}, // center point
            c0 = po.map.locationCoordinate(locations[t0.identifier]),
            c1 = po.map.locationCoordinate(locations[t1.identifier]),
            c2 = {row: (c0.row + c1.row) / 2, column: (c0.column + c1.column) / 2, zoom: 0},
            l2 = po.map.coordinateLocation(c2); // center location
        map.zoomBy(Math.log(e.scale) / Math.LN2 + zoom - map.zoom(), p2, l2);
        if (rotate) map.angle(e.rotation / 180 * Math.PI + angle);
        e.preventDefault();
        break;
      }
    }
  }

  touch.rotate = function(x) {
    if (!arguments.length) return rotate;
    rotate = x;
    return touch;
  };

  touch.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("touchstart", touchstart, false);
      container = null;
    }
    if (map = x) {
      container = map.container();
      container.addEventListener("touchstart", touchstart, false);
    }
    return touch;
  };

  return touch;
};
// Default map controls.
po.interact = function() {
  var interact = {},
      drag = po.drag(),
      wheel = po.wheel(),
      dblclick = po.dblclick(),
      touch = po.touch(),
      arrow = po.arrow();

  interact.map = function(x) {
    drag.map(x);
    wheel.map(x);
    dblclick.map(x);
    touch.map(x);
    arrow.map(x);
    return interact;
  };

  return interact;
};
po.compass = function() {
  var compass = {},
      g = po.svg("g"),
      ticks = {},
      r = 30,
      speed = 16,
      last = 0,
      repeatDelay = 250,
      repeatInterval = 50,
      position = "top-left", // top-left, top-right, bottom-left, bottom-right
      zoomStyle = "small", // none, small, big
      zoomContainer,
      panStyle = "small", // none, small
      panTimer,
      panDirection,
      panContainer,
      drag,
      dragRect = po.svg("rect"),
      map,
      container,
      window;

  g.setAttribute("class", "compass");
  dragRect.setAttribute("class", "back fore");
  dragRect.setAttribute("pointer-events", "none");
  dragRect.setAttribute("display", "none");

  function panStart(e) {
    g.setAttribute("class", "compass active");
    if (!panTimer) panTimer = setInterval(panRepeat, repeatInterval);
    if (panDirection) map.panBy(panDirection);
    last = Date.now();
    return cancel(e);
  }

  function panRepeat() {
    if (panDirection && (Date.now() > last + repeatDelay)) {
      map.panBy(panDirection);
    }
  }

  function mousedown(e) {
    if (e.shiftKey) {
      drag = {x0: map.mouse(e)};
      map.focusableParent().focus();
      return cancel(e);
    }
  }

  function mousemove(e) {
    if (!drag) return;
    drag.x1 = map.mouse(e);
    dragRect.setAttribute("x", Math.min(drag.x0.x, drag.x1.x));
    dragRect.setAttribute("y", Math.min(drag.x0.y, drag.x1.y));
    dragRect.setAttribute("width", Math.abs(drag.x0.x - drag.x1.x));
    dragRect.setAttribute("height", Math.abs(drag.x0.y - drag.x1.y));
    dragRect.removeAttribute("display");
  }

  function mouseup(e) {
    g.setAttribute("class", "compass");
    if (drag) {
      if (drag.x1) {
        map.extent([
          map.pointLocation({
            x: Math.min(drag.x0.x, drag.x1.x),
            y: Math.max(drag.x0.y, drag.x1.y)
          }),
          map.pointLocation({
            x: Math.max(drag.x0.x, drag.x1.x),
            y: Math.min(drag.x0.y, drag.x1.y)
          })
        ]);
        dragRect.setAttribute("display", "none");
      }
      drag = null;
    }
    if (panTimer) {
      clearInterval(panTimer);
      panTimer = 0;
    }
  }

  function panBy(x) {
    return function() {
      x ? this.setAttribute("class", "active") : this.removeAttribute("class");
      panDirection = x;
    };
  }

  function zoomBy(x) {
    return function(e) {
      g.setAttribute("class", "compass active");
      var z = map.zoom();
      map.zoom(x < 0 ? Math.ceil(z) - 1 : Math.floor(z) + 1);
      return cancel(e);
    };
  }

  function zoomTo(x) {
    return function(e) {
      map.zoom(x);
      return cancel(e);
    };
  }

  function zoomOver() {
    this.setAttribute("class", "active");
  }

  function zoomOut() {
    this.removeAttribute("class");
  }

  function cancel(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  }

  function pan(by) {
    var x = Math.SQRT1_2 * r,
        y = r * .7,
        z = r * .2,
        g = po.svg("g"),
        dir = g.appendChild(po.svg("path")),
        chv = g.appendChild(po.svg("path"));
    dir.setAttribute("class", "direction");
    dir.setAttribute("pointer-events", "all");
    dir.setAttribute("d", "M0,0L" + x + "," + x + "A" + r + "," + r + " 0 0,1 " + -x + "," + x + "Z");
    chv.setAttribute("class", "chevron");
    chv.setAttribute("d", "M" + z + "," + (y - z) + "L0," + y + " " + -z + "," + (y - z));
    chv.setAttribute("pointer-events", "none");
    g.addEventListener("mousedown", panStart, false);
    g.addEventListener("mouseover", panBy(by), false);
    g.addEventListener("mouseout", panBy(null), false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function zoom(by) {
    var x = r * .4,
        y = x / 2,
        g = po.svg("g"),
        back = g.appendChild(po.svg("path")),
        dire = g.appendChild(po.svg("path")),
        chev = g.appendChild(po.svg("path")),
        fore = g.appendChild(po.svg("path"));
    back.setAttribute("class", "back");
    back.setAttribute("d", "M" + -x + ",0V" + -x + "A" + x + "," + x + " 0 1,1 " + x + "," + -x + "V0Z");
    dire.setAttribute("class", "direction");
    dire.setAttribute("d", back.getAttribute("d"));
    chev.setAttribute("class", "chevron");
    chev.setAttribute("d", "M" + -y + "," + -x + "H" + y + (by > 0 ? "M0," + (-x - y) + "V" + -y : ""));
    fore.setAttribute("class", "fore");
    fore.setAttribute("fill", "none");
    fore.setAttribute("d", back.getAttribute("d"));
    g.addEventListener("mousedown", zoomBy(by), false);
    g.addEventListener("mouseover", zoomOver, false);
    g.addEventListener("mouseout", zoomOut, false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function tick(i) {
    var x = r * .2,
        y = r * .4,
        g = po.svg("g"),
        back = g.appendChild(po.svg("rect")),
        chev = g.appendChild(po.svg("path"));
    back.setAttribute("pointer-events", "all");
    back.setAttribute("fill", "none");
    back.setAttribute("x", -y);
    back.setAttribute("y", -.75 * y);
    back.setAttribute("width", 2 * y);
    back.setAttribute("height", 1.5 * y);
    chev.setAttribute("class", "chevron");
    chev.setAttribute("d", "M" + -x + ",0H" + x);
    g.addEventListener("mousedown", zoomTo(i), false);
    g.addEventListener("dblclick", cancel, false);
    return g;
  }

  function move() {
    var x = r + 6, y = x, size = map.size();
    switch (position) {
      case "top-left": break;
      case "top-right": x = size.x - x; break;
      case "bottom-left": y = size.y - y; break;
      case "bottom-right": x = size.x - x; y = size.y - y; break;
    }
    g.setAttribute("transform", "translate(" + x + "," + y + ")");
    dragRect.setAttribute("transform", "translate(" + -x + "," + -y + ")");
    for (var i in ticks) {
      i == map.zoom()
          ? ticks[i].setAttribute("class", "active")
          : ticks[i].removeAttribute("class");
    }
  }

  function draw() {
    while (g.lastChild) g.removeChild(g.lastChild);

    g.appendChild(dragRect);

    if (panStyle != "none") {
      panContainer = g.appendChild(po.svg("g"));
      panContainer.setAttribute("class", "pan");

      var back = panContainer.appendChild(po.svg("circle"));
      back.setAttribute("class", "back");
      back.setAttribute("r", r);

      var s = panContainer.appendChild(pan({x: 0, y: -speed}));
      s.setAttribute("transform", "rotate(0)");

      var w = panContainer.appendChild(pan({x: speed, y: 0}));
      w.setAttribute("transform", "rotate(90)");

      var n = panContainer.appendChild(pan({x: 0, y: speed}));
      n.setAttribute("transform", "rotate(180)");

      var e = panContainer.appendChild(pan({x: -speed, y: 0}));
      e.setAttribute("transform", "rotate(270)");

      var fore = panContainer.appendChild(po.svg("circle"));
      fore.setAttribute("fill", "none");
      fore.setAttribute("class", "fore");
      fore.setAttribute("r", r);
    } else {
      panContainer = null;
    }

    if (zoomStyle != "none") {
      zoomContainer = g.appendChild(po.svg("g"));
      zoomContainer.setAttribute("class", "zoom");

      var j = -.5;
      if (zoomStyle == "big") {
        ticks = {};
        for (var i = map.zoomRange()[0], j = 0; i <= map.zoomRange()[1]; i++, j++) {
          (ticks[i] = zoomContainer.appendChild(tick(i)))
              .setAttribute("transform", "translate(0," + (-(j + .75) * r * .4) + ")");
        }
      }

      var p = panStyle == "none" ? .4 : 2;
      zoomContainer.setAttribute("transform", "translate(0," + r * (/^top-/.test(position) ? (p + (j + .5) * .4) : -p) + ")");
      zoomContainer.appendChild(zoom(+1)).setAttribute("transform", "translate(0," + (-(j + .5) * r * .4) + ")");
      zoomContainer.appendChild(zoom(-1)).setAttribute("transform", "scale(-1)");
    } else {
      zoomContainer = null;
    }

    move();
  }

  compass.radius = function(x) {
    if (!arguments.length) return r;
    r = x;
    if (map) draw();
    return compass;
  };

  compass.speed = function(x) {
    if (!arguments.length) return r;
    speed = x;
    return compass;
  };

  compass.position = function(x) {
    if (!arguments.length) return position;
    position = x;
    if (map) draw();
    return compass;
  };

  compass.pan = function(x) {
    if (!arguments.length) return panStyle;
    panStyle = x;
    if (map) draw();
    return compass;
  };

  compass.zoom = function(x) {
    if (!arguments.length) return zoomStyle;
    zoomStyle = x;
    if (map) draw();
    return compass;
  };

  compass.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      container.removeEventListener("mousedown", mousedown, false);
      container.removeChild(g);
      container = null;
      window.removeEventListener("mousemove", mousemove, false);
      window.removeEventListener("mouseup", mouseup, false);
      window = null;
      map.off("move", move).off("resize", move);
    }
    if (map = x) {
      container = map.container();
      container.appendChild(g);
      container.addEventListener("mousedown", mousedown, false);
      window = container.ownerDocument.defaultView;
      window.addEventListener("mousemove", mousemove, false);
      window.addEventListener("mouseup", mouseup, false);
      map.on("move", move).on("resize", move);
      draw();
    }
    return compass;
  };

  return compass;
};
po.grid = function() {
  var grid = {},
      map,
      g = po.svg("g");

  g.setAttribute("class", "grid");

  function move(e) {
    var p,
        line = g.firstChild,
        size = map.size(),
        nw = map.pointLocation(zero),
        se = map.pointLocation(size),
        step = Math.pow(2, 4 - Math.round(map.zoom()));

    // Round to step.
    nw.lat = Math.floor(nw.lat / step) * step;
    nw.lon = Math.ceil(nw.lon / step) * step;

    // Longitude ticks.
    for (var x; (x = map.locationPoint(nw).x) <= size.x; nw.lon += step) {
      if (!line) line = g.appendChild(po.svg("line"));
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("y1", 0);
      line.setAttribute("y2", size.y);
      line = line.nextSibling;
    }

    // Latitude ticks.
    for (var y; (y = map.locationPoint(nw).y) <= size.y; nw.lat -= step) {
      if (!line) line = g.appendChild(po.svg("line"));
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("x1", 0);
      line.setAttribute("x2", size.x);
      line = line.nextSibling;
    }

    // Remove extra ticks.
    while (line) {
      var next = line.nextSibling;
      g.removeChild(line);
      line = next;
    }
  }

  grid.map = function(x) {
    if (!arguments.length) return map;
    if (map) {
      g.parentNode.removeChild(g);
      map.off("move", move).off("resize", move);
    }
    if (map = x) {
      map.on("move", move).on("resize", move);
      map.container().appendChild(g);
      map.dispatch({type: "move"});
    }
    return grid;
  };

  return grid;
};
po.stylist = function() {
  var attrs = [],
      styles = [],
      title;

  function stylist(e) {
    var ne = e.features.length,
        na = attrs.length,
        ns = styles.length,
        f, // feature
        d, // data
        o, // element
        x, // attr or style or title descriptor
        v, // attr or style or title value
        i,
        j;
    for (i = 0; i < ne; ++i) {
      if (!(o = (f = e.features[i]).element)) continue;
      d = f.data;
      for (j = 0; j < na; ++j) {
        v = (x = attrs[j]).value;
        if (typeof v === "function") v = v.call(null, d);
        v == null ? (x.name.local
            ? o.removeAttributeNS(x.name.space, x.name.local)
            : o.removeAttribute(x.name)) : (x.name.local
            ? o.setAttributeNS(x.name.space, x.name.local, v)
            : o.setAttribute(x.name, v));
      }
      for (j = 0; j < ns; ++j) {
        v = (x = styles[j]).value;
        if (typeof v === "function") v = v.call(null, d);
        v == null
            ? o.style.removeProperty(x.name)
            : o.style.setProperty(x.name, v, x.priority);
      }
      if (v = title) {
        if (typeof v === "function") v = v.call(null, d);
        while (o.lastChild) o.removeChild(o.lastChild);
        if (v != null) o.appendChild(po.svg("title")).appendChild(document.createTextNode(v));
      }
    }
  }

  stylist.attr = function(n, v) {
    attrs.push({name: ns(n), value: v});
    return stylist;
  };

  stylist.style = function(n, v, p) {
    styles.push({name: n, value: v, priority: arguments.length < 3 ? null : p});
    return stylist;
  };

  stylist.title = function(v) {
    title = v;
    return stylist;
  };

  return stylist;
};
})(org.polymaps);


/* **********************************************
     Begin geoff.js
********************************************** */

if (!geoff) var geoff = {};
if (typeof module !== "undefined" && module.exports) {
	module.exports = geoff;
}
(function(geoff) {

 	/**
	 * Convert a GeoJSON geometry coordinate [x,y] array to a WGS94 object with
	 * "lat" and "lon" attributes.
	 */
 	geoff.ctoll = function(coord) {
		return {lat: coord[1], lon: coord[0]};
	};

 	/**
	 * Convert a GeoJSON geometry coordinate [x,y] array to an x/y
	 * object.
	 */
 	geoff.ctoxy = function(coord) {
		return {x: coord[0], y: coord[1]};
	};

 	/**
	 * Convert a WGS94 object with "lat" and "lon" attributes to a GeoJSON
	 * geometry coordinate [x,y] array.
	 */
 	geoff.lltoc = function(latlon) {
		return [latlon.lon, latlon.lat];
	};

 	/**
	 * Convert a lat/lon object to a point object with "x" and "y"
	 * attributes (corresponding to lon and lat, respectively).
	 */
 	geoff.lltoxy = function(latlon) {
		return {x: latlon.lon, y: latlon.lat};
	};

 	/**
	 * Convert an x/y object to a GeoJSON geometry coordinate [x,y]
	 * array.
	 */
 	geoff.xytoc = function(xy) {
		return [xy.x, xy.y];
	};

 	/**
	 * Convert an x/y object to a lat/lon object.
	 */
 	geoff.xytoll = function(xy) {
		return {lat: xy.y, lon: xy.x};
	};

 	/**
	 * Create a GeoJSON Point feature from a single WGS84 lat/lon object and an
	 * optional properties object.
	 */
	geoff.lltoPoint = function(latlon, properties) {
		return geoff.feature.Point(geoff.lltoc(latlon), properties);
	};

	/**
	 * GeoJSON feature generators.
	 */
	geoff.feature = (function() {
		// generate a GeoJSON feature object.
		var feature = function(type, coords, properties) {
			switch (type) {
				case "GeometryCollection":
					return {
						type: "Feature",
						properties: properties || {},
						geometry: {
							type: type,
							geometries: coords || []
						}
					};
			}
			return {
				type: "Feature",
				properties: properties || {},
				geometry: {
					type: type,
					coordinates: coords || []
				}
			};
		};

		feature.Point = function(coord, properties) {
			return feature("Point", coord, properties);
		};

		feature.Polygon = function(rings, properties) {
			return feature("Polygon", rings, properties);
		};

		feature.LineString = function(points, properties) {
			return feature("LineString", points, properties);
		};

		feature.MultiLineString = function(lines, properties) {
			return feature("MultiLineString", lines, properties);
		};

		feature.MultiPolygon = function(polygons, properties) {
			return feature("MultiPolygon", polygons, properties);
		};

		feature.MultiPoint = function(points, properties) {
			return feature("MultiPoint", points, properties);
		};

		feature.GeometryCollection = function(geometries, properties) {
			return feature("GeometryCollection", geometries, properties);
		};

		feature.clone = function(feature, properties, deep) {
			var copy = geoff.clone(feature, deep ? 10 : 0);
			if (properties) geoff.merge(properties, feature.properties);
			return copy;
		};

		return feature;
	})();

	geoff.clone = function(obj, depth) {
		if (typeof depth == "undefined") depth = 0;
		if (obj instanceof Array) {
			return (depth > 0)
				? obj.map(function(o) { return geoff.clone(o, depth - 1); })
				: obj.slice();
		} else {
			var out = {};
			for (var p in obj) {
				if (p == "__proto__") continue;
				out[p] = (typeof obj[p] == "object" && depth > 0)
					? geoff.clone(obj[p], depth - 1)
					: obj[p];
			}
			return out;
		}
	};

	geoff.merge = function(a, b) {
		for (var p in a) {
			if (p == "__proto__") continue;
			if (typeof a[p] == "object" && typeof b[p] == "object") {
				geoff.merge(a[p], b[p]);
			} else {
				b[p] = a[p];
			}
		}
	};

	/**
	 * An extent is a lat/lon bounding box. Extents an be used to calculate
	 * feature bounding boxes, determine
	 */
	geoff.extent = function(coords) {
		// By default an extent is infinite.
		var extent = {
			min: {lon: Infinity, lat: Infinity},
			max: {lon: -Infinity, lat: -Infinity}
		};

		// cover the globe
		extent.world = function() {
			extent.min = {lon: -180, lat: -89.999};
			extent.max = {lon: +180, lat: +89.999};
			return extent;
		};

		extent.size = function(latlon) {
			if (arguments.length) {
				var center = extent.center();
				extent.min.lon = center.lon - latlon.lon / 2;
				extent.max.lon = center.lon + latlon.lon / 2;
				extent.min.lat = center.lat - latlon.lat / 2;
				extent.max.lat = center.lat + latlon.lat / 2;
				return extent;
			} else {
				return {
					lon: extent.max.lon - extent.min.lon,
					lat: extent.max.lat - extent.min.lat
				};
			}
		};

		extent.offset = function(latlon) {
			extent.min.lon += latlon.lon;
			extent.max.lon += latlon.lon;
			extent.min.lat += latlon.lat;
			extent.max.lat += latlon.lat;
			return extent;
		};

		extent.center = function(latlon) {
			if (arguments.length) {
				// TODO
			} else {
				return {
					lon: extent.min.lon + size.lon / 2,
					lat: extent.min.lat + size.lat / 2
				};
			}
		};

		// Northwest, Southeast, Northeast and Southwest corner getter/setters
		extent.northwest = function(latlon) {
			if (arguments.length) {
				extent.min.lon = latlon.lon;
				extent.max.lat = latlon.lat;
				return extent;
			} else {
				return {lat: extent.max.lat, lon: extent.min.lon};
			}
		};
		extent.southeast = function(latlon) {
			if (arguments.length) {
				extent.max.lon = latlon.lon;
				extent.min.lat = latlon.lat;
				return extent;
			} else {
				return {lat: extent.min.lat, lon: extent.max.lon};
			}
		};
		extent.northeast = function(latlon) {
			if (arguments.length) {
				extent.max.lon = latlon.lon;
				extent.max.lat = latlon.lat;
				return extent;
			} else {
				return {lat: extent.max.lat, lon: extent.max.lon};
			}
		};
		extent.southwest = function(latlon) {
			if (arguments.length) {
				extent.min.lon = latlon.lon;
				extent.min.lat = latlon.lat;
				return extent;
			} else {
				return {lat: extent.min.lat, lon: extent.min.lon};
			}
		};

		// Reset the extent to infinite bounds so that min/max calculations work out.
		extent.reset = function() {
			extent.min = {lon: Infinity, lat: Infinity};
			extent.max = {lon: -Infinity, lat: -Infinity};
			return extent;
		};

		// Returns true if the extent contains the given lat/lon location
		extent.containsLocation = function(latlon) {
			return !(
				latlon.lon < extent.min.lon ||
				latlon.lat < extent.min.lat ||
				latlon.lon > extent.max.lon ||
				latlon.lat > extent.max.lat
			);
		};

		// Returns true if the extent contains the given GeoJSON [x,y] coordinate
		extent.containsCoordinate = function(coord) {
			return !(
				coord[0] < extent.min.lon ||
				coord[1] < extent.min.lat ||
				coord[0] > extent.max.lon ||
				coord[1] > extent.max.lat);
		};

		// Returns true if the extent contains the provided extent
		extent.containsExtent = function(other) {
			return extent.containsLocation(other.min)
				&& extent.containsLocation(other.max);
		};

		// Returns true if the extent intersects the other one
		extent.intersects = function(other) {
			return !(
				extent.min.lon > other.max.lon ||
				extent.min.lat > other.max.lat ||
				extent.max.lon < other.min.lon ||
				extent.max.lat < other.min.lat);
		};

		// Get the intersection of two extents as a new extent object if they
		// intersect one another, or null if they don't.
		extent.intersection = function(other) {
			if (extent.intersects(other)) {
				var result = geoff.extent();
				result.min.lon = Math.max(extent.min.lon, other.min.lon);
				result.min.lat = Math.max(extent.max.lat, other.max.lat);
				result.max.lon = Math.min(extent.max.lon, other.max.lon);
				result.max.lat = Math.min(extent.min.lat, other.min.lat);
			}
			return null;
		};

		// Returns a 2-element array of lat/lon objects for use with
		// po.map().extent().
		extent.toArray = function() {
			return [{lon: extent.min.lon, lat: extent.min.lat},
						  {lon: extent.max.lon, lat: extent.max.lat}];
		};

		// Generate a Polygon feature from this extent
		extent.toFeature = function(properties) {
			var ring = extent.ring();
			return geoff.feature.Polygon([ring], properties);
		};

		// Get the "area" of the rectangle.
		extent.area = function() {
			return Math.abs((extent.max.lon - extent.min.lon) * (extent.max.lat - extent.min.lat));
		};

		// Returns true if the extent is empty
		extent.empty = function() {
			return extent.area() == 0;
		};

		// Returns true if the extent is empty
		extent.isFinite = function() {
			return isFinite(extent.area());
		};

		// Generate a GeoJSON coordinate ring corresponding to the four corners of
		// the extent rectangle
		extent.ring = function() {
			if (!extent.isFinite()) {
				throw new TypeError("Can't create a ring from an infinite extent!");
			}
			return [
				[extent.min.lon, extent.max.lat],
				[extent.max.lon, extent.max.lat],
				[extent.max.lon, extent.min.lat],
				[extent.min.lon, extent.min.lat],
				[extent.min.lon, extent.min.lat]
			];
		};

		// Buffer the extent by x and y values. If no y is provided we assume the x
		// value for both dimensions.
		extent.inflate = function(x, y) {
			if (arguments.length == 0) {
				throw new TypeError("Expecting 1 or two arguments for extent.buffer() (got zero)");
			}
			if (arguments.length == 1) {
				y = x;
			}
			if (x != 0 && !isNaN(x)) {
				extent.min.lon -= x;
				extent.max.lon += x;
			}
			if (y != 0 && !isNaN(y)) {
				extent.min.lat -= y;
				extent.max.lat += y;
			}
			return extent;
		};

		// Enclose a GeoJSON [x,y] coordinate
		extent.encloseCoordinate = function(coord) {
			extent.min.lon = Math.min(extent.min.lon, coord[0]);
			extent.max.lon = Math.max(extent.max.lon, coord[0]);
			extent.min.lat = Math.min(extent.min.lat, coord[1]);
			extent.max.lat = Math.max(extent.max.lat, coord[1]);
			return extent;
		};

		// Enclose a WGS84 lat/lon location
		extent.encloseLocation = function(latlon) {
			extent.encloseCoordinate([latlon.lon, latlon.lat]);
			return extent;
		};

		extent.encloseLocations = function(latlons) {
			latlons.forEach(extent.encloseLocation);
			return extent;
		};

		// Enclose a feature geometry.
		extent.encloseGeometry = function(geom) {
			switch (geom.type) {
				// Point geometries contain a single [x,y] coordinate
				case "Point":
					// enclose all of the point coordinates
					extent.encloseCoordinate(geom.coordinates);
					break;

				// LineString and MultiPoint geometries contain a list of coordinates:
				// [[x,y], [x,y]]
				case "LineString":
				case "MultiPoint":
					// enclose all of the point coordinates
					geom.coordinates.forEach(extent.encloseCoordinate);
					break;

				// MultiLineString and Polygon geometries contain a list of rings:
				// [[[x,y], [x,y]],
        //  [[x,y], [x,y]]]
				case "MultiLineString":
				case "Polygon":
					// enclose each of the points in each ring
					geom.coordinates.forEach(function(ring) {
						ring.forEach(extent.encloseCoordinate);
					});
					break;

				// MultiPolygon geometries contain a list of polygonal ring lists:
				// [[[[x,y], [x,y]], [[x,y], [x,y]]],
        //  [[[x,y], [x,y]], [[x,y], [x,y]]]]
				case "MultiPolygon":
					// enclose each of the points of each ring in each polygon
					geom.coordinates.forEach(function(polygon) {
						polygon.forEach(function(ring) {
							ring.forEach(extent.encloseCoordinate);
						});
					});
					break;

				// For GeometryCollection geometries, apply extent.encloseGeometry() to
				// each item in the "geometries" list.
				case "GeometryCollection":
					geom.geometries.forEach(extent.encloseGeometry);
					break;
			}
			return extent;
		};

		// Enclose a single feature.
		extent.encloseFeature = function(feature) {
			return extent.encloseGeometry(feature.geometry);
		};

		return extent;
	};

	// GeoJSON Coordinate functions
	geoff.coord = (function() {
		// Get a coord from either an Array or a lat/lon object
		var coord = function(point) {
			if (latlon instanceof Array) {
				return latlon.slice();
			} else {
				return geoff.lltoc(latlon);
			}
		};

		// TODO: implement wrap()

		// compare two coordinates
		coord.cmp = function(a, b) {
			return a[0] == b[0] && a[1] == b[1];
		};

		return coord;
	})();

	/**
	 * A buffer modifies GeoJSON geometries to include an outer ring around the
	 * rectangular extent of the feature. Call buffer.apply(feature, copy)
	 */
	geoff.buffer = function() {
		var buffer = {},
				extent = null,
				margin = null,
				radius = 1,
				fidelity = 32;

		buffer.extent = function(e) {
			if (arguments.length) {
				extent = e;
				return buffer;
			} else {
				return extent;
			}
		};

		// Set or get the margin. The setter takes either two numerical arguments:
		// lon (x) and lat (y), or a single location object with "lon" and
		// "lat" properties. If no arguments are provided, the margin is
		// returned as an object with lon and lat properties.
		buffer.margin = function(lon, lat) {
			if (arguments.length) {
				if (arguments.length == 1) {
					if (typeof lon == "object") {
						margin = lon;
					} else {
						margin = {lon: lon, lat: lon};
					}
				} else {
					margin = {lon: lon, lat: lat};
				}
				return buffer;
			} else {
				return margin;
			}
		};

		// Set the radius for cirles drawn around Point geometries.
		buffer.radius = function(r) {
			if (arguments.length) {
				radius = r;
				return buffer;
			} else {
				return radius;
			}
		};

		// Set the fidelity for cirles drawn around Point geometries.
		buffer.fidelity = function(r) {
			if (arguments.length) {
				fidelity = r;
				return buffer;
			} else {
				return fidelity;
			}
		};

		function apply(feature, ext) {
			var geom = feature.geometry;
			// maniplate the geometry...
			switch (geom.type) {
				case "Point":
					// Turn it into a polygon with two rings:
					// 1) the extent rectangle, and
					// 2) an inner circle around the point coordinate
					var center = geom.coordinates;
					geom.type = "Polygon";
					geom.coordinates = [
						ext.ring(),
						geoff.circle(center, buffer / 2, fidelity)
					];
					break;

				case "Line":
				case "LineString":
					throw new TypeError("Can't do Line or LineString yet!");

				case "MultiPoint":
					// turn it into a polygon with 2 or more rings:
					// 1) the extent rectangle, and
					// 2+) circles around each of point coordinates
					var coords = geom.coordinates.slice();
					geom.type = "Polygon";
					geom.coordinates = [ext.ring()];
					coords.forEach(function(coord) {
						geom.coordinates.push(geoff.circle(coord, buffer / 2, fidelity));
					});
					break;

				case "Polygon":
					// buffer the extent and prepend the geometry rings with the
					// extent rectangle
					geom.coordinates.unshift(ext.ring());
					break;

				case "MultiPolygon":
					// buffer the extent and prepend a polygon with a the extent
					// rectangle as its only ring
					geom.coordinates.unshift([ext.ring()]);
					break;
			}
			return feature;
		}

		function makeExtent(feature) {
			var ext = geoff.extent();
			if (margin) {
				ext.encloseFeature(feature)
				ext.inflate(margin.lon, margin.lat);
			} else {
				ext.world();
				ext.encloseFeature(feature);
			}
			return ext;
		}

		// Apply the buffer to a feature. If copy is true, a deep copy of the
		// feature is created, modified, and returned. Otherwise the feature is
		// modified in place and returned.
		buffer.apply = function(feature, copy) {
			var ext = extent || makeExtent(feature);
			return copy
				? apply(geoff.feature.clone(feature), ext)
				: apply(feature, ext);
		};

		return buffer;
	};

	var TWO_PI = Math.PI * 2;
	// Generate a circular ring around the given coordinate with a given radius
	// (beware latitudinal distortion!) and number of line segments (fidelity).
	geoff.circle = function(coord, radius, fidelity) {
		if (!radius) return [coord];
		// TODO: deal with latitudinal distortion
		if (!fidelity) fidelity = 32;
		var points = [],
				step = TWO_PI / fidelity;
		for (var a = 0; a < TWO_PI; a += step) {
			var x = coord[0] + radius * Math.sin(a),
					y = coord[1] + radius * Math.cos(a);
			points.push([x, y]);
		}
		return points;
	};

	// Feature property getter
	geoff.property = function(name) {
		return function(feature) {
			return feature.properties[name];
		};
	};

	// Returns a *function* that gets the named property from the function's
	// argument. Property names may contain dots to indicate recursive object
	// values. To read a GeoJSON Point feature's latitude, for instance, you can
	// use: geoff.read("geometry.coordinates.1")(feature);
	geoff.read = function(prop) {
		// TODO: support array accessor bracket notation: "geometry.coordinates[0]"
		if (prop.indexOf(".") > -1) {
			var parts = prop.split("."),
					len = parts.length;
			return function(o) {
				var i = 0;
				do {
					o = o[parts[i]];
				} while ((typeof o != "undefined") && ++i < len);
				return o;
			};
		}
		return function(o) { return o[prop]; };
	};

	// Geoff.sort() is a function generator which returns a sorting function
	// based on the received arguments, which you can then pass to Array.sort():
	//
	// [{foo: 3}, {foo: 5}, {foo: -4}].sort(geoff.sort("-foo"));
	//
	// returns: [{foo: 5}, {foo: 3}, {foo: -4}]
	geoff.sort = function(args) {
		function cmp(a, b) {
			return (a > b) ? 1 : (a < b) ? -1 : 0;
		}

		function by(prop) {
			// TODO: support arrays for grouped sub-sorts?
			if (typeof prop == "function") {
				return prop;
			}
			var dir = prop.charAt(0);
			var order = (dir == "-") ? -1 : 1;
			if (dir == "+" || dir == "-") {
				prop = prop.substr(1);
			}
			var read = geoff.read(prop);
			return function(a, b) {
				return order * cmp(read(a), read(b));
			};
		}

		var sorts = [];
		for (var i = 0; i < arguments.length; i++) {
			sorts.push(by(arguments[i]));
		}
		return function(a, b) {
			var i = 0,
					o = 0,
					max = sorts.length;
			do {
				o = sorts[i].call(undefined, a, b);
			} while (o == 0 && ++i < max);
			return o;
		};
	};

	// The polympas "module" contains utility functions for working with Polymaps:
	// http://polymaps.org
	geoff.polympas = (function() {
		var polymaps = {};

		polymaps.outline = function() {
			var outline = function(e) {
				if (tiled) {
					// Get a tile extent. Note that "this" in a Polymaps event
					// listener is the po.map() reference.
					var coord = e.tile.coord;
					var northWest = this.coordinateLocation(coord);
							southEast = this.coordinateLocation({
								row: coord.row + 1,
								column: coord.column + 1,
								zoom: coord.zoom});
					var ext = geoff.extent()
						.encloseLocations([northwest, southEast]);
					// use the tile extent with a small buffer, assuming that the
					// layer tiles and clips
					buffer.margin(.0001).extent(ext);
				} else {
					// otherwise, use the world as the extent
					buffer.margin(null).extent(null);
				}

				if (single || e.features.length == 1) {
					// if we have a single feature, adjust just that one
					buffer.apply(e.features[0].data);
				} else {
					// But if we have multiple geometries, create a GeometryCollection,
					// buffer that, and set the layer's features to that single feature.
					var geometries = e.features.map(function(f) { return f.data.geometry; });
					var feature = geoff.feature.GeometryCollection(geometries);
					buffer.apply(feature);
				}
			};

			var buffer = geoff.buffer(),
					single = true,
					tiled = false;

			outline.buffer = function(b) {
				if (arguments.length) {
					buffer = b;
					return outline;
				} else {
					return buffer;
				}
			};

			outline.single = function(b) {
				if (arguments.length) {
					single = b;
					return outline;
				} else {
					return single;
				}
			};

			outline.tile = function(b) {
				if (arguments.length) {
					tiled = b;
					return outline;
				} else {
					return tiled;
				}
			};

			return outline;
		};

		return polymaps;
	})();


})(geoff);


/* **********************************************
     Begin tsv.js
********************************************** */

function tsv(url) {
  var tsv = {},
      key,
      value;

  tsv.key = function(x) {
    if (!arguments.length) return key;
    key = x;
    return tsv;
  };

  tsv.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return tsv;
  };

  tsv.map = function(x) {
    var map = {}, req = new XMLHttpRequest();
    req.overrideMimeType("text/plain");
    req.open("GET", url, false);
    req.send(null);
    var lines = req.responseText.split(/\n/g);
    for (var i = 0; i < lines.length; i++) {
      var columns = lines[i].split(/\t/g),
          k = key(columns);
      if (k != null) map[k] = value(columns);
    }
    return map;
  };

  return tsv;
}


/* **********************************************
     Begin tree.js
********************************************** */



// @codekit-prepend "polymaps/lib/nns/nns.js";
// @codekit-prepend "polymaps/polymaps.js";
// @codekit-prepend "polymaps/geoff.js";
// @codekit-prepend "tsv.js";

var searchPrompt = 'Search by ingredient name...';

var used = [];

jQuery(document).ready(function() {

	// == search form crap

	$("#searchField").val(searchPrompt).addClass("empty");
	
	// When you click on #search
	$("#searchField").focus(function(){
		
		// If the value is equal to "Search..."
		if($(this).val() === searchPrompt) {
			// remove all the text and the class of .empty
			$(this).val("").removeClass("empty");
		}
		
	});
	
	// When the focus on #search is lost
	$("#searchField").blur(function(){
		
		// If the input field is empty
		if($(this).val() === "") {
			// Add the text "Search..." and a class of .empty
			$(this).val(searchPrompt).addClass("empty");
		}
		
	});

	// dynamic search binding (keyup-based)
	// note: returns all results, not just "top" results, so maybe a variant is needed for "drop down"-type results presentation
	$('#searchField').keyup(function() {
		
		var searchStr = $('#searchField').val();
		var searchResults = $('#searchResults');
		if (searchStr.length > 0) {
			$('#resetsearch').css('opacity','1.0');
		} else {
			$('#resetsearch').css('opacity','0.5');
		}
		if (searchStr.length > 1) {
			$.getJSON('/search/ing/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					
					searchResults.append($('<ul>'));

					for (var i = 0; i < 10; i++) {
						if (i < msg.length) {
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' ('+msg[i].context+')</a></li>'));
						}

					}
					if (msg.length > 10) {
						searchResults.append($('<li class="divider"></li><li><a tabindex="-1" href="/tree/index.html?q='+encodeURIComponent(searchStr)+'"><em>... and '+(msg.length-10)+' more</em></a></li>'));
					}
					searchResults.append($('</ul>'));
					searchResults.show();
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<li><em>No matches. Try searching on the first few letters of a product or category.</em></li>'));
					searchResults.show();
				} else {
					searchResults.hide();
				}
			});
		}
		else {
			searchResults.hide();
		}
	});

	// impose clickaway functionality
	$('body').click(function(e) {
		if (!$(e.target).is('#searchResults')) {
			$('#searchResults').hide();
		}
	});

	// reset switch
	$('#resetsearch').click( function() {
		$('#searchResults').hide();
		$('#searchField').val('');
		$('#resetsearch').css('opacity','0.5');
	});

});


jQuery(window).load(function() {
	// map!
	var po = org.polymaps;

	/* Country name -> population (July 2010 Est.). */
	//var population = tsv("population.tsv")
	//	.key(function(l) { return l[1]; })
	//	.value(function(l) { return l[2].replace(/,/g, ""); })
	//	.map();

	/* Country name -> internet users (2008). */
	//var internet = tsv("internet.tsv")
	//	.key(function(l) { return l[1]; })
	//	.value(function(l) { return l[2].replace(/,/g, ""); })
	//	.map();

	var map = po.map()
		.container(document.getElementById("map").appendChild(po.svg("svg")))
		.center({lat: 40, lon: 0})
		.zoomRange([1, 7])
		.zoom(2)
		.add(po.interact())
		;

	//map.add(po.image()
	//	.url("http://s3.amazonaws.com/com.modestmaps.bluemarble/{Z}-r{Y}-c{X}.jpg"));

	//map.add(po.geoJson()
	//	.url("world.json")
	//	.tile(false)
	//	.zoom(3)
	//	);
	//	//.on("load", load));

	map.add(po.geoJson()
		.url("world-large-filtered.json")
		.tile(false)
		.zoom(3)
		.on("load", load)
		);


	//map.add(po.geoJson()
	//	.features(geoJSONFeatures['features'])
	//	.tile(false)
	//	.zoom(3)
	//	.on("load", load));


	//map.add(po.compass()
	//	.pan("none"));

	map.container().setAttribute("class", "Oranges");

	

	/** Set feature class and add tooltip on tile load. */
	function load(e) {
	  for (var i = 0; i < e.features.length; i++) {
		var feature = e.features[i];
		var n = feature.data.properties.name;
		var v = originAggregate[n];
		if (v !== undefined) {
			used.push(n);
		}
		if (v === 1.0) {
			v = 0.99;
		}
		n$(feature.element)
			.attr("class", isNaN(v) ? null : "q" + ~~(v * 9) + "-" + 9)
			//.attr("onclick", 'window.location="http://apple.com";')
		  .add("svg:title")
			//.text(n + (isNaN(v) ? "" : ":  " + percent(v)));
			.text(n + (isNaN(v) ? "" : ":  " + v));
	  }
	}


	
	//console.log('initial',map.extent());
	//console.log(boundsSW,boundsNE);
	map.resize();
	//map.extent([{lon:-170,lat:-20},{lon:153,lat:71}]);
	map.extent([{lon:boundsSW.x,lat:boundsSW.y},{lon:boundsNE.x,lat:boundsNE.y}]);
	//console.log('after',map.extent());
	//map.extent([map.pointLocation({y:boundsSW.y,x:boundsSW.x}), map.pointLocation({y:boundsNE.y,x:boundsNE.x})]);

	//console.log(map.extent());

	//map.zoom(Math.floor(map.zoom()));

	/** Formats a given number as a percentage, e.g., 10% or 0.02%. */
	//function percent(v) {
	//  return (v * 100).toPrecision(Math.min(2, 2 - Math.log(v) / Math.LN2)) + "%";
	//}


	// zoom to the feature's extent
	//var neighborhood = $.getJSON('world.json', function(data) {
	//	return data;
	//});
	//console.log(neighborhood.type);
	//var neighborhood = {"type":"Feature","properties":{"OBJECTID":20.000000,"NEIGHBORHO":"Mission"},"geometry":{"type":"Polygon","coordinates":[[[-122.424756,37.747849],[-122.424949,37.749725],[-122.425578,37.756617],[-122.426761,37.769577],[-122.426329,37.769601],[-122.423302,37.772048],[-122.423269,37.772074],[-122.422690,37.770624],[-122.421172,37.770221],[-122.419768,37.770073],[-122.415771,37.769625],[-122.412755,37.769588],[-122.408760,37.769225],[-122.407029,37.768911],[-122.405280,37.767914],[-122.405032,37.766635],[-122.405014,37.765952],[-122.404982,37.764670],[-122.405465,37.762525],[-122.406285,37.760887],[-122.406249,37.759519],[-122.405147,37.758511],[-122.403943,37.757761],[-122.403271,37.756746],[-122.402891,37.754529],[-122.403019,37.751107],[-122.403576,37.749388],[-122.404159,37.749379],[-122.405767,37.749097],[-122.407579,37.748383],[-122.411344,37.748237],[-122.415005,37.748263],[-122.418126,37.748212],[-122.420171,37.748179],[-122.421568,37.748070],[-122.423181,37.747959],[-122.424756,37.747849]]]}};
	//var extent = geoff.extent().encloseGeometry(geoJSONFeatures);
	//map.extent(extent.toArray());
	//map.zoom(Math.floor(map.zoom()));

});


function report() {
	for (var key in originAggregate) {
		if (used.indexOf(key)===-1) {
			console.log('MISMATCH: ',key);
		}
	}
}