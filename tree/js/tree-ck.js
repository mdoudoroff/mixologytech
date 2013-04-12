// Word cloud layout by Jason Davies, http://www.jasondavies.com/word-cloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf
(function(exports) {
  function cloud() {
    var size = [256, 256],
        text = cloudText,
        font = cloudFont,
        fontSize = cloudFontSize,
        fontStyle = cloudFontNormal,
        fontWeight = cloudFontNormal,
        rotate = cloudRotate,
        padding = cloudPadding,
        spiral = archimedeanSpiral,
        words = [],
        timeInterval = Infinity,
        event = d3.dispatch("word", "end"),
        timer = null,
        cloud = {};

    cloud.start = function() {
      var board = zeroArray((size[0] >> 5) * size[1]),
          bounds = null,
          n = words.length,
          i = -1,
          tags = [],
          data = words.map(function(d, i) {
            d.text = text.call(this, d, i);
            d.font = font.call(this, d, i);
            d.style = fontStyle.call(this, d, i);
            d.weight = fontWeight.call(this, d, i);
            d.rotate = rotate.call(this, d, i);
            d.size = ~~fontSize.call(this, d, i);
            d.padding = cloudPadding.call(this, d, i);
            return d;
          }).sort(function(a, b) { return b.size - a.size; });

      if (timer) clearInterval(timer);
      timer = setInterval(step, 0);
      step();

      return cloud;

      function step() {
        var start = +new Date,
            d;
        while (+new Date - start < timeInterval && ++i < n && timer) {
          d = data[i];
          d.x = (size[0] * (Math.random() + .5)) >> 1;
          d.y = (size[1] * (Math.random() + .5)) >> 1;
          cloudSprite(d, data, i);
          if (place(board, d, bounds)) {
            tags.push(d);
            event.word(d);
            if (bounds) cloudBounds(bounds, d);
            else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
            // Temporary hack
            d.x -= size[0] >> 1;
            d.y -= size[1] >> 1;
          }
        }
        if (i >= n) {
          cloud.stop();
          event.end(tags, bounds);
        }
      }
    }

    cloud.stop = function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      return cloud;
    };

    cloud.timeInterval = function(x) {
      if (!arguments.length) return timeInterval;
      timeInterval = x == null ? Infinity : x;
      return cloud;
    };

    function place(board, tag, bounds) {
      var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
          startX = tag.x,
          startY = tag.y,
          maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
          s = spiral(size),
          dt = Math.random() < .5 ? 1 : -1,
          t = -dt,
          dxdy,
          dx,
          dy;

      while (dxdy = s(t += dt)) {
        dx = ~~dxdy[0];
        dy = ~~dxdy[1];

        if (Math.min(dx, dy) > maxDelta) break;

        tag.x = startX + dx;
        tag.y = startY + dy;

        if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
            tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
        // TODO only check for collisions within current bounds.
        if (!bounds || !cloudCollide(tag, board, size[0])) {
          if (!bounds || collideRects(tag, bounds)) {
            var sprite = tag.sprite,
                w = tag.width >> 5,
                sw = size[0] >> 5,
                lx = tag.x - (w << 4),
                sx = lx & 0x7f,
                msx = 32 - sx,
                h = tag.y1 - tag.y0,
                x = (tag.y + tag.y0) * sw + (lx >> 5),
                last;
            for (var j = 0; j < h; j++) {
              last = 0;
              for (var i = 0; i <= w; i++) {
                board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
              }
              x += sw;
            }
            delete tag.sprite;
            return true;
          }
        }
      }
      return false;
    }

    cloud.words = function(x) {
      if (!arguments.length) return words;
      words = x;
      return cloud;
    };

    cloud.size = function(x) {
      if (!arguments.length) return size;
      size = [+x[0], +x[1]];
      return cloud;
    };

    cloud.font = function(x) {
      if (!arguments.length) return font;
      font = d3.functor(x);
      return cloud;
    };

    cloud.fontStyle = function(x) {
      if (!arguments.length) return fontStyle;
      fontStyle = d3.functor(x);
      return cloud;
    };

    cloud.fontWeight = function(x) {
      if (!arguments.length) return fontWeight;
      fontWeight = d3.functor(x);
      return cloud;
    };

    cloud.rotate = function(x) {
      if (!arguments.length) return rotate;
      rotate = d3.functor(x);
      return cloud;
    };

    cloud.text = function(x) {
      if (!arguments.length) return text;
      text = d3.functor(x);
      return cloud;
    };

    cloud.spiral = function(x) {
      if (!arguments.length) return spiral;
      spiral = spirals[x + ""] || x;
      return cloud;
    };

    cloud.fontSize = function(x) {
      if (!arguments.length) return fontSize;
      fontSize = d3.functor(x);
      return cloud;
    };

    cloud.padding = function(x) {
      if (!arguments.length) return padding;
      padding = d3.functor(x);
      return cloud;
    };

    return d3.rebind(cloud, event, "on");
  }

  function cloudText(d) {
    return d.text;
  }

  function cloudFont() {
    return "serif";
  }

  function cloudFontNormal() {
    return "normal";
  }

  function cloudFontSize(d) {
    return Math.sqrt(d.value);
  }

  function cloudRotate() {
    return (~~(Math.random() * 6) - 3) * 30;
  }

  function cloudPadding() {
    return 1;
  }

  // Fetches a monochrome sprite bitmap for the specified text.
  // Load in batches for speed.
  function cloudSprite(d, data, di) {
    if (d.sprite) return;
    c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
    var x = 0,
        y = 0,
        maxh = 0,
        n = data.length;
    di--;
    while (++di < n) {
      d = data[di];
      c.save();
      c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
      var w = c.measureText(d.text + "m").width * ratio,
          h = d.size << 1;
      if (d.rotate) {
        var sr = Math.sin(d.rotate * cloudRadians),
            cr = Math.cos(d.rotate * cloudRadians),
            wcr = w * cr,
            wsr = w * sr,
            hcr = h * cr,
            hsr = h * sr;
        w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
        h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
      } else {
        w = (w + 0x1f) >> 5 << 5;
      }
      if (h > maxh) maxh = h;
      if (x + w >= (cw << 5)) {
        x = 0;
        y += maxh;
        maxh = 0;
      }
      if (y + h >= ch) break;
      c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
      if (d.rotate) c.rotate(d.rotate * cloudRadians);
      c.fillText(d.text, 0, 0);
      c.restore();
      d.width = w;
      d.height = h;
      d.xoff = x;
      d.yoff = y;
      d.x1 = w >> 1;
      d.y1 = h >> 1;
      d.x0 = -d.x1;
      d.y0 = -d.y1;
      x += w;
    }
    var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
        sprite = [];
    while (--di >= 0) {
      d = data[di];
      var w = d.width,
          w32 = w >> 5,
          h = d.y1 - d.y0,
          p = d.padding;
      // Zero the buffer
      for (var i = 0; i < h * w32; i++) sprite[i] = 0;
      x = d.xoff;
      if (x == null) return;
      y = d.yoff;
      var seen = 0,
          seenRow = -1;
      for (var j = 0; j < h; j++) {
        for (var i = 0; i < w; i++) {
          var k = w32 * j + (i >> 5),
              m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
          if (p) {
            if (j) sprite[k - w32] |= m;
            if (j < w - 1) sprite[k + w32] |= m;
            m |= (m << 1) | (m >> 1);
          }
          sprite[k] |= m;
          seen |= m;
        }
        if (seen) seenRow = j;
        else {
          d.y0++;
          h--;
          j--;
          y++;
        }
      }
      d.y1 = d.y0 + seenRow;
      d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
    }
  }

  // Use mask-based collision detection.
  function cloudCollide(tag, board, sw) {
    sw >>= 5;
    var sprite = tag.sprite,
        w = tag.width >> 5,
        lx = tag.x - (w << 4),
        sx = lx & 0x7f,
        msx = 32 - sx,
        h = tag.y1 - tag.y0,
        x = (tag.y + tag.y0) * sw + (lx >> 5),
        last;
    for (var j = 0; j < h; j++) {
      last = 0;
      for (var i = 0; i <= w; i++) {
        if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
            & board[x + i]) return true;
      }
      x += sw;
    }
    return false;
  }

  function cloudBounds(bounds, d) {
    var b0 = bounds[0],
        b1 = bounds[1];
    if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
    if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
    if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
    if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
  }

  function collideRects(a, b) {
    return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
  }

  function archimedeanSpiral(size) {
    var e = size[0] / size[1];
    return function(t) {
      return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
    };
  }

  function rectangularSpiral(size) {
    var dy = 4,
        dx = dy * size[0] / size[1],
        x = 0,
        y = 0;
    return function(t) {
      var sign = t < 0 ? -1 : 1;
      // See triangular numbers: T_n = n * (n + 1) / 2.
      switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
        case 0:  x += dx; break;
        case 1:  y += dy; break;
        case 2:  x -= dx; break;
        default: y -= dy; break;
      }
      return [x, y];
    };
  }

  // TODO reuse arrays?
  function zeroArray(n) {
    var a = [],
        i = -1;
    while (++i < n) a[i] = 0;
    return a;
  }

  var cloudRadians = Math.PI / 180,
      cw = 1 << 11 >> 5,
      ch = 1 << 11,
      canvas,
      ratio = 1;

  if (typeof document !== "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;
  } else {
    // node-canvas support
    var Canvas = require("canvas");
    canvas = new Canvas(cw << 5, ch);
  }

  var c = canvas.getContext("2d"),
      spirals = {
        archimedean: archimedeanSpiral,
        rectangular: rectangularSpiral
      };
  c.fillStyle = "red";
  c.textAlign = "center";

  exports.cloud = cloud;
})(typeof exports === "undefined" ? d3.layout || (d3.layout = {}) : exports);


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
     Begin topojson.v0.js
********************************************** */

topojson = (function() {

  function merge(topology, arcs) {
    var arcsByEnd = {},
        fragmentByStart = {},
        fragmentByEnd = {};

    arcs.forEach(function(i) {
      var e = ends(i);
      (arcsByEnd[e[0]] || (arcsByEnd[e[0]] = [])).push(i);
      (arcsByEnd[e[1]] || (arcsByEnd[e[1]] = [])).push(~i);
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else if (g = fragmentByEnd[end]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else if (g = fragmentByStart[start]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);
          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[start]) {
        delete fragmentByStart[f.start];
        f.unshift(~i);
        f.start = end;
        if (g = fragmentByEnd[end]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var gf = g.map(function(i) { return ~i; }).reverse().concat(f);
          fragmentByStart[gf.start = g.end] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByEnd[end]) {
        delete fragmentByEnd[f.end];
        f.push(~i);
        f.end = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else if (g = fragmentByStart[start]) {
          delete fragmentByStart[g.start];
          delete fragmentByEnd[g.end];
          var fg = f.concat(g.map(function(i) { return ~i; }).reverse());
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.start] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i], p0 = arc[0], p1 = [0, 0];
      arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      return [p0, p1];
    }

    var fragments = [];
    for (var k in fragmentByEnd) fragments.push(fragmentByEnd[k]);
    return fragments;
  }

  function mesh(topology, o, filter) {
    var arcs = [];

    if (arguments.length > 1) {
      var geomsByArc = [],
          geom;

      function arc(i) {
        if (i < 0) i = ~i;
        (geomsByArc[i] || (geomsByArc[i] = [])).push(geom);
      }

      function line(arcs) {
        arcs.forEach(arc);
      }

      function polygon(arcs) {
        arcs.forEach(line);
      }

      function geometry(o) {
        if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
        else if (o.type in geometryType) {
          geom = o;
          geometryType[o.type](o.arcs);
        }
      }

      var geometryType = {
        LineString: line,
        MultiLineString: polygon,
        Polygon: polygon,
        MultiPolygon: function(arcs) { arcs.forEach(polygon); }
      };

      geometry(o);

      geomsByArc.forEach(arguments.length < 3
          ? function(geoms, i) { arcs.push([i]); }
          : function(geoms, i) { if (filter(geoms[0], geoms[geoms.length - 1])) arcs.push([i]); });
    } else {
      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push([i]);
    }

    return object(topology, {type: "MultiLineString", arcs: merge(topology, arcs)});
  }

  function object(topology, o) {
    var tf = topology.transform,
        kx = tf.scale[0],
        ky = tf.scale[1],
        dx = tf.translate[0],
        dy = tf.translate[1],
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, x = 0, y = 0, p; k < n; ++k) points.push([
        (x += (p = a[k])[0]) * kx + dx,
        (y += p[1]) * ky + dy
      ]);
      if (i < 0) reverse(points, n);
    }

    function point(coordinates) {
      return [coordinates[0] * kx + dx, coordinates[1] * ky + dy];
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0]);
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0]);
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var t = o.type, g = t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
          : {type: null};
      if ("id" in o) g.id = o.id;
      if ("properties" in o) g.properties = o.properties;
      return g;
    }

    var geometryType = {
      Point: function(o) { return point(o.coordinates); },
      MultiPoint: function(o) { return o.coordinates.map(point); },
      LineString: function(o) { return line(o.arcs); },
      MultiLineString: function(o) { return o.arcs.map(line); },
      Polygon: function(o) { return polygon(o.arcs); },
      MultiPolygon: function(o) { return o.arcs.map(polygon); }
    };

    return geometry(o);
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function neighbors(objects) {
    var objectsByArc = [],
        neighbors = objects.map(function() { return []; });

    function line(arcs, i) {
      arcs.forEach(function(a) {
        if (a < 0) a = ~a;
        var o = objectsByArc[a] || (objectsByArc[a] = []);
        if (!o[i]) o.forEach(function(j) {
          var n, k;
          k = bisect(n = neighbors[i], j); if (n[k] !== j) n.splice(k, 0, j);
          k = bisect(n = neighbors[j], i); if (n[k] !== i) n.splice(k, 0, i);
        }), o[i] = i;
      });
    }

    function polygon(arcs, i) {
      arcs.forEach(function(arc) { line(arc, i); });
    }

    function geometry(o, i) {
      if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
    }

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
    };

    objects.forEach(geometry);
    return neighbors;
  }

  return {
    version: "0.0.32",
    mesh: mesh,
    object: object,
    neighbors: neighbors
  };
})();


/* **********************************************
     Begin map.js
********************************************** */

/*global d3 */
/*global topojson */
/*jshint devel:true */

// @codekit-prepend "topojson.v0.js";

function buildMap(map_ids) {

	var mapWidth = 460,
		mapHeight = 300;

	var projection = d3.geo.mercator()
		.scale(1000)
		.translate([mapWidth / 2, mapHeight / 2]);

	var path = d3.geo.path()
		.projection(projection);

	var svg = d3.select("#map").append("svg")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	svg.append("rect")
		.attr("width", mapWidth)
		.attr("height", mapHeight);

	var g = svg.append("g");

	d3.json("test3.json", function(error, mapData) {

		var countries = topojson.object(mapData, mapData.objects.subunits3).geometries;

		g.selectAll("path")
			.data(countries)
		.enter().append("path")
			.attr("d", path)
			.attr("class", function(d) { 
				if (map_ids.indexOf(d.id)>-1) {
					return "feature glow " + d.id;
				} else {
					return "feature " + d.id;
				}
			});

		g.append("path")
			.datum(topojson.mesh(mapData, mapData.objects.subunits3, function(a, b) { return a !== b; }))
			.attr("class", "mesh")
			.attr("d", path);


		// Zoom in on some arbitrary countries
		var ids = map_ids;
		var lonBounds = [];
		var latBounds = [];
		g.selectAll("path").each(function(d){
			if (ids.indexOf(d.id)>-1) {
				lonBounds.push(path.bounds(d)[0][0]);
				lonBounds.push(path.bounds(d)[1][0]);
				latBounds.push(path.bounds(d)[0][1]);
				latBounds.push(path.bounds(d)[1][1]);
			}
		});
		console.log(lonBounds,latBounds);
		var absLonMin = projection([-169,0]);
		var absLonMax = projection([180,0]);
		var lonMin = (d3.min(lonBounds)>absLonMin[0]) ? d3.min(lonBounds) : absLonMin[0];
		var lonMax = (d3.max(lonBounds)<absLonMax[0]) ? d3.max(lonBounds) : absLonMax[0];
		//console.log('absLonMin, absLonMax', absLonMin, absLonMax);
		var absLatMin = projection([0,66]);	// ceiling and floor latitudes (may not work out in the long run)
		var absLatMax = projection([0,-34]);
		var latMin = (d3.min(latBounds)>absLatMin[1]) ? d3.min(latBounds) : absLatMin[1];
		var latMax = (d3.max(latBounds)<absLatMax[1]) ? d3.max(latBounds) : absLatMax[1];
		var b = [[lonMin,latMin],[lonMax,latMax]];
		//console.log('b',b);
		var newScale = 0.80 / Math.max((b[1][0] - b[0][0]) / mapWidth, (b[1][1] - b[0][1]) / mapHeight);
		g.attr(
			"transform",
			"translate(" + projection.translate() + ")" +
			"scale(" + newScale + ")" +
			"translate(" + -(b[1][0] + b[0][0]) / 2 + "," + -(b[1][1] + b[0][1]) / 2 + ")"
			);



		// country labels (we're rendering these after the zoom/crop and applying a reverse scale on the text to get the label up to size)
		var countryLabels = g.selectAll('.country-label')
			.data(countries)
			.enter()
			.append("text")
			.attr("class", 'country-label')
			.text(function(d){return d.properties.name;})
			.attr("transform", function(d) { return "translate(" + path.centroid(d) + ") scale("+1/newScale+") translate(" + this.getBBox().width/2 * -1 + ",0)"; });

		countryLabels.filter(function(d){ return map_ids.indexOf(d.id)<0; })
			.attr("visibility","hidden");
		

	});

}



/* **********************************************
     Begin tree.js
********************************************** */

/*jshint devel:true */
/*global leafPhotos */
/*global examplePhotos */
/*global ingredientAffinities */
/*global flavorAffinities */
/*global originAggregate */
/*global map_ids */

// @codekit-prepend "d3.layout.cloud.js";
// @codekit-prepend "tsv.js";
// @codekit-prepend "map.js";

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
		var searchStrLeadTerm = searchStr.toLowerCase().split(' ')[0];
		var searchResults = $('#searchResults');
		var counter = 0;
		if (searchStr.length > 0) {
			$('#resetsearch').css('opacity','1.0');
		} else {
			$('#resetsearch').css('opacity','0.5');
		}
		if (searchStr.length > 1) {
			$.getJSON('/search/ing/'+searchStr,function(msg){

				searchResults.empty();

				if (msg.length>0) {

					// first, show matches that begin with the first search term
					for (var i = 0; i < msg.length; i++) {
						if (msg[i].name.toLowerCase().indexOf(searchStrLeadTerm)===0) {
							counter += 1;
							searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' <span class="context">'+msg[i].context+'</span></a></li>'));
						}
					}

					// divider, if necessary
					if (counter > 0 && counter < 10) {
						searchResults.append($('<li class="divider"></li>'));
					}

					// then list the rest, space allowing
					for (i = 0; i < msg.length; i++) {
						if (counter > 10) {
							break;
						}
						searchResults.append($('<li><a tabindex="-1" href="/tree/ing-'+msg[i].iid+'.html">'+msg[i].name+' <span class="context">'+msg[i].context+'</span></a></li>'));
						counter += 1;
					}
					if (msg.length > 10) {
						searchResults.append($('<li class="divider"></li><li><a tabindex="-1" href="/tree/index.html?q='+encodeURIComponent(searchStr)+'"><em>... and '+(msg.length-10)+' more</em></a></li>'));
					}

					searchResults.show();
				}
				else if (searchStr.length > 0) {
					searchResults.append($('<li><a href=""><em>No matches. Try searching on the first few letters of a product or category.</em></a></li>'));
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

	// pictures
	var availablePictures = [];
	var picsToLoad;

	// if leaf photos, normalize
	if (leafPhotos.length>0) {
		for (var i=0;i<leafPhotos.length;i++) {
			availablePictures.push({fn:leafPhotos[i],id:'',name:''});			
		}
	} else if (examplePhotos.length>0) {
		availablePictures = examplePhotos;
	}

	if (availablePictures.length<1) {
		$('#topphotos').hide();
	} else {


		var loadmorepics = $('<div id="morepics">Load more<br/><span id="availpics">'+(availablePictures.length)+'</span> available</div>');
		$('#topphotos').append(loadmorepics);

		function loadPics() {
			picsToLoad = 5;
			while (picsToLoad > 0 && availablePictures.length > 0) {
				var d = availablePictures.shift();
				if (d.name.length>0) {
					var img = $('<div class="polaroid"><a href="ing-'+d.id+'.html"><img src="http://ingr-photos.s3.amazonaws.com/'+d.fn+'" height="180" /><p>'+d.name+'</p></a></div>');
				} else {
					var img = $('<div class="polaroid"><a href="http://ingr-photos.s3.amazonaws.com/'+d.fn+'"><img src="http://ingr-photos.s3.amazonaws.com/'+d.fn+'" height="180" /></a></div>');
				}
				
				$('#morepics').before(img);
				picsToLoad -= 1;				
			}
			if (availablePictures.length >= 1) {
				$('#availpics').text(availablePictures.length);
			}
			else {
				$('#morepics').hide();
			}

		}	

		loadmorepics.click(loadPics);
		loadPics();

	}

	if (typeof map_ids === 'object' && map_ids.length>0) {
		buildMap(map_ids);
	}
});


jQuery(window).load(function() {

	// ================= map! =================

	//if (! jQuery.isEmptyObject(originAggregate) || ! jQuery.isEmptyObject(activeMapRegions)) {
	//}

    

    // ============= AFFINITIES! ================

    // blue    orange  green   red     purple  brown   pink    gray    lt green  lt blue
	// #1f77b4 #ff7f0e #2ca02c #d62728 #9467bd #8c564b #e377c2 #7f7f7f #bcbd22   #17becf
	var ordinalColorMapping = {
		0:'#7f7f7f',     // garnishes, whatevah (default)
		1:'#d62728',    // bitters
		2:'#2ca02c',    // mixers/non-alcoholic modifiers/bottled cocktails
		3:'#1f77b4',   // liqueurs
		4:'#17becf',     // white spirits
		5:'#8c564b'     // brown spirits
	};

	var flavorOrdinalColorMapping = {
		0:'#7f7f7f',     // (default)
		1:'#2ca02c',	// vegetal/herbal
		2:'#ff7f0e',    // spice
		3:'#e377c2',    // floral
		4:'#8c564b',    // nutty
		5:'#d62728',    // fruity
	};

	var divwidth = $('#affinities').width();

	//var fill = d3.scale.category20();
	var ingFill = function(i) {return ordinalColorMapping[i]};
	var flavFill = function(i) {return flavorOrdinalColorMapping[i]};

    if (ingredientAffinities) {

    	var terms = Object.keys(ingredientAffinities);

		function drawIA(words) {
			d3.select("#affinities").append("svg")
				.attr("width", divwidth)
				.attr("height", 600)
				
				.append("g")
				.attr("transform", "translate("+divwidth/2+","+300+")")
				
				.selectAll("text")
				.data(words)

				.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Helvetica")
				.style("font-weight", "bold")
				.style("cursor", 'pointer')
				.style("fill", function(d, i) { return ingFill(d.groupIdx); })
				.attr("text-anchor", "middle")
				.on("click", function(d) {
					window.location = "ing-"+d.iid+".html";
				})
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; });
			}

    	

		d3.layout.cloud().size([divwidth, 600])
			.words(terms.map(function(d) {
				return {text: d, size: 10 + ingredientAffinities[d][0] * 90, iid:ingredientAffinities[d][1], groupIdx:ingredientAffinities[d][2]};
			}))
			//.words(terms.map(function(d) {
			//        return {text: d, size: 10 + Math.random() * 90};
			//      }))
			.rotate(function() { return ~~(Math.random() * 2) * 0; })
			.font("Helvetica")
			.fontWeight('bold')
			.fontSize(function(d) { return d.size; })
			.on("end", drawIA)
			.start();



    }

    
    if (flavorAffinities) {

    	var terms = Object.keys(flavorAffinities);

		function drawFA(words) {
			d3.select("#affinities").append("svg")
				.attr("width", divwidth)
				.attr("height", 600)
				
				.append("g")
				.attr("transform", "translate("+divwidth/2+","+300+")")
				
				.selectAll("text")
				.data(words)

				.enter().append("text")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Helvetica")
				.style("font-weight", "bold")
				.style("cursor", 'pointer')
				.style("fill", function(d, i) { return flavFill(d.groupIdx); })
				.attr("text-anchor", "middle")
				.on("click", function(d) {
					window.location = "flavor-"+d.iid+".html";
				})
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.text(function(d) { return d.text; });
			}

    	

		d3.layout.cloud().size([divwidth, 600])
			.words(terms.map(function(d) {
				return {text: d, size: 10 + flavorAffinities[d][0] * 90, iid:flavorAffinities[d][1], groupIdx:flavorAffinities[d][2]};
			}))
			//.words(terms.map(function(d) {
			//        return {text: d, size: 10 + Math.random() * 90};
			//      }))
			.rotate(function() { return ~~(Math.random() * 2) * 0; })
			.font("Helvetica")
			.fontWeight('bold')
			.fontSize(function(d) { return d.size; })
			.on("end", drawFA)
			.start();



    }

});


function report() {
	for (var key in originAggregate) {
		if (used.indexOf(key)===-1) {
			console.log('MISMATCH: ',key);
		}
	}
}