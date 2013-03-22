dojo.require("esri.map");
dojo.require("esri.tasks.find");
dojo.require("esri.dijit.PopupMobile");
dojo.require("esri.arcgis.utils");
var app = {};
function initMap(room) {
    var m = esri.arcgis.utils.createMap("aee63ae887c94f6bbe15b7e1b411ab9a", "map", {
        mapOptions: {
            infoWindow: new esri.dijit.PopupMobile(null, dojo.create("div"))
        }
    });
    m.then(function (response) {
        app.map = response.map;
        var ms = "http://maps.deschutes.org/arcgis/rest/services/PalmSprings/MapServer";
        var findTask = new esri.tasks.FindTask(ms);
        var findParams = new esri.tasks.FindParameters();
        findParams.returnGeometry = true;
        findParams.layerIds = [0, 3];
        findParams.searchFields = ["RoomName"];
        findParams.searchText = room;
        findTask.execute(findParams, showRooms);
    });
}
function zoomSession() {
    app.map.centerAndZoom(app.ext.getCenter(), 18);
}
function getGPS(zoom) {
    app.zoom = zoom;
    navigator.geolocation.getCurrentPosition(showGPS);
}
function showGPS(location) {
    var eg = esri.geometry;
    var xy = location.coords;
    var gps = eg.geographicToWebMercator(eg.Point(xy.longitude, xy.latitude))
    var pms = new esri.symbol.PictureMarkerSymbol("images/bluedot.png", 30, 30);
    app.map.graphics.clear();
    app.map.graphics.add(new esri.Graphic(gps, pms));
    var gExt = app.map.graphics.graphics[0]._extent;
    if (app.zoom) app.map.setExtent(app.ext.union(gExt).expand(2));
    $("#uxFindMe").removeClass('ui-disabled');
}
function showRooms(results) {
    if (results) {
        var glay = new esri.layers.GraphicsLayer();
        var sym = esri.symbol;
        var pms = new sym.PictureMarkerSymbol("images/bluepin.png", 40, 40);
        var sls = new sym.SimpleFillSymbol(sym.SimpleFillSymbol.STYLE_SOLID,
            new sym.SimpleLineSymbol(sym.SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.25]));
        dojo.forEach(results, function (result) {
            var graphic = result.feature;
            if (graphic.geometry.type == "point") graphic.setSymbol(pms);
            if (graphic.geometry.type == "polygon") {
                graphic.setSymbol(sls);
                app.ext = graphic.geometry.getExtent();
            }
            glay.add(graphic);
        });
        app.map.addLayer(glay);
        setTimeout(function () {
            app.map.centerAndZoom(app.ext.getCenter(), 18);
        }, 500)
    }
    if (navigator.geolocation) getGPS(false);
}
function sortJson(a, b) {
    return getDate(a.Time) > getDate(b.Time) ? 1 : -1;
}
function getDate(i) {
    var t = i.slice(0, i.length - 2).replace(" ", ":").split(":");
    if (i.slice(i.length - 2) == "pm" & t[1] != 12) t[1] = Number(t[1]) + 12;
    var d = ["Sun", "Mon", "Tue", "Wed", "Thu"];
    return new Date(2013, 2, (24 + d.indexOf(t[0])), t[1], Number(t[2]))
}
$(document).ready(function () {
    if (window.location.hash == "#uxMap") {
        $.mobile.changePage("#uxMain", { transition: "none" });
    }
    var url = "http://apify.heroku.com/api/sess.json?callback=?"
    $.getJSON(url, function (data) {
        var json = { json: JSON.parse(data).sort(sortJson) };
        var html = Mustache.render($("#uxListTemplate").text(), json);
        $("#uxSessions").append(html).listview({
            autodividersSelector: function (li) {
                return getDate(li.attr("time")).toDateString();;
            }
        }).listview("refresh");
    });
    $(document).bind("pagechange", function (event, obj) {
        if (obj.absUrl.indexOf("#uxMap") >= 0) {
            window.scrollTo(0, 1);
            var roomNode = obj.options.link[0].attributes["room"].nodeValue;
            $("#uxFindMe").addClass('ui-disabled');
            initMap(roomNode.split("(")[0].trim());
        } else {
            $(".esriMobileNavigationBar, .esriMobileInfoView").hide();
            if (app.map) app.map.destroy();
        }
    })
})




