require(["dojo/ready","dojo/_base/connect", "dojo/_base/array", "dojo/query",
"dojo/on", "dojo/dom-class", "dojo/dom","esri/map", "esri/dijit/Geocoder", 
"esri/tasks/route"],function(ready, connect, array, query, on, domClass, dom){
  var start, end = {x:-12972833,y:4005378,spatialReference:{wkid:102100}}, 
  route, map, es = esri.symbol, rsym = new es.SimpleLineSymbol({color:
  [235,0,0], width: 2}), d=document, eg=esri.geometry, start2,
  endsym = new es.SimpleMarkerSymbol({color:[255,0,0,190],size:16,outline:
  {color:[255,0,0]}}),strtsym = new es.SimpleMarkerSymbol({size:16,color:
  [80,255,90,190],outline:{color:[0,190,0]}}), io = esri.config.defaults.io,
  tsjson = {verticalAlignment:"middle", yoffset: 12, font: {size:14}},
  endtxt = new es.TextSymbol(tsjson).setText("END"),
  strtxt = new es.TextSymbol(tsjson).setText("START");
  io.proxyUrl = "../proxy/proxy.ashx"; io.alwaysUseProxy = false;
  function selected (r) {if (r) { getDirections(r.feature.geometry); }};
  function getDirections (point) {
    var rt, params = new esri.tasks.RouteParameters(), mg = map.graphics;
    if (start) {mg.remove(start); mg.remove(start2);}
    start = map.graphics.add(new esri.Graphic(point, strtsym));
    start2 = map.graphics.add(new esri.Graphic(point, strtxt));
    rt = new esri.tasks.RouteTask("http://tasks.arcgisonline.com/ArcGIS/"
    + "rest/services/NetworkAnalysis/ESRI_Route_NA/NAServer/Long_Route");
    params.stops = new esri.tasks.FeatureSet();
    params.stops.features.push(start);
    params.stops.features.push(end);
    params.returnRoutes = false;
    params.returnDirections = true;
    params.directionsLengthUnits = "esriMiles";
    params.outSpatialReference = map.spatialReference;
	domClass.add(d.body, "wait");
    rt.solve(params).then(showRoute, errHandler);
  };
  function highLine (geometry) { var mg, ul, g = new esri.Graphic(geometry,
    new es.SimpleLineSymbol({color:[255,255,0],width: 4}));mg = map.graphics
    mg.add(g);setTimeout(function(){mg.remove(g);}, 2000);}
  function showRoute(solveResult) {
    var dir = solveResult.routeResults[0].directions, txt = "<p>${text}</p>"
	  + "<span class='miles'>(${length} mi)</span>", il = dir.features.length;
	domClass.add(dom.byId("instructions"), "hideme");
    if (route) {map.graphics.remove(route);}
    route = map.graphics.add(new esri.Graphic(dir.mergedGeometry, rsym));
    map.setExtent(dir.extent, true); ul = dom.byId("dir_list"); 
    while (ul.firstChild) { ul.removeChild(ul.firstChild); }
    array.forEach(dir.features, function (f, i) { if (!i) {return;}
      f.attributes.length = f.attributes.length.toFixed(2);
      var li = d.createElement("li"), t = esri.substitute(f.attributes, txt);
	  li.innerHTML = (i < il - 1) ?  t : t.replace("Location 2", 
	    "ESRI Developers Summit"); ul.appendChild(li);
      on(li, "click", function(e){highLine(f.geometry);
        map.setExtent(f.geometry.getExtent(), true);});
    });
	var li = d.createElement("li"); ul.appendChild(li);
	li.innerHTML = "<p>Total Distance:</p> <span class='miles'>"
	  +dir.totalLength.toFixed(2) + " mi</span>";
    query(".fullroute").removeClass("hideme");
	domClass.remove(d.body, "wait");
  };
  function moveMap (newMapLoc, newDirLoc) {
    var frags = [d.createDocumentFragment(), d.createDocumentFragment()];
    frags[0].appendChild(dom.byId("map"));
    frags[1].appendChild(dom.byId("dir_list"));
    query(".contain").toggleClass("hideme");
    dom.byId(newMapLoc).appendChild(frags[0]);
    dom.byId(newDirLoc).appendChild(frags[1]);
    setTimeout(function(){map.resize();map.reposition();}, 100);
  };
  function errHandler (err) { console.warn(err);}
  function onLoad (map) { end = new eg.Point(end); 
    map.graphics.add(new esri.Graphic(end, endtxt));
	end = map.graphics.add(new esri.Graphic(end, endsym));
  }
  ready(function () {
    var loc, geo, geoOpt; map = new esri.Map("map", 
      {basemap: "streets", center: [-98.43, 40.00], zoom: 4});
	geoOpt = {enableHighAccuracy:false, timeout: 5000, maximumAge:60000};
    loc = new esri.dijit.Geocoder({map:map}, "search"); loc.startup();
    connect.connect(loc, "onSelect", selected);
    connect.connect(map, "onLoad", onLoad);
    connect.connect(map, "onReposition", function () { if (route) {
      setTimeout(function () {
        map.setExtent(route.geometry.getExtent(), true);}, 200);}});
    if (navigator.geolocation) {
      geo = dojo.byId("getmyloc"); domClass.remove(geo, "hideme");
      on(geo, "click", function(e) { 
        navigator.geolocation.getCurrentPosition(function (pos) { 
          pt = eg.geographicToWebMercator(new eg.Point(pos.coords));
          getDirections(pt);
        }, errHandler, geoOpt);
      });
    }
    query(".fullroute").on("click", function (e) { 
      if (route) { map.setExtent(route.geometry.getExtent(), true);}});
    on(dom.byId("gotoprint"), "click", function (e) { 
      e.preventDefault();moveMap("map_here", "dir_here");});
    on(dom.byId("gotoapp"), "click", function () {
      moveMap("map_container", "dir_container");});
    on(dom.byId("printnow"), "click", function(){window.print();});
  });
});