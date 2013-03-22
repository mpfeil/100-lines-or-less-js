dojo.require("esri.map");
dojo.require("esri.dijit.Geocoder");

var index;
var mapLocations;
var timerHandle;
var map;
var pictureLayer;
var geocoder;

dojo.ready(init);

function init() {
    var options = {
        center: [-100, 50],
        zoom: 3
    };
    map = new esri.Map("mapDiv", options);
    var baseLayer = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/ESRI_Imagery_World_2D/MapServer");
    pictureLayer = new esri.layers.GraphicsLayer();
    map.addLayer(baseLayer);
    map.addLayer(pictureLayer);
    map.infoWindow.resize(320, 380);

    dojo.connect(map, 'onLoad', function (map) {
        dojo.connect(window, 'resize', map, map.resize);
    });

    dojo.connect(map, "onExtentChange", function (extent) {
        var s = "";
        s = extent.xmin + "," + extent.ymin + "," + extent.xmax + "," + extent.ymax;
        getPictures(s);
    });

    geocoder = new esri.dijit.Geocoder({
        map: map
    }, "search");
    geocoder.startup();
}

function getPictures(extent) {
    $.getJSON("http://api.flickr.com/services/rest/?text=ESRI&method=flickr.photos.search&bbox=" + extent + "&api_key=5d8fe0bdc948adc59961d76b54e521d3&media=photos&extras=owner_name%2Cgeo&format=json&per_page=500&jsoncallback=?",
        function (data) {
            if (data.photos) {
                pictureLayer.clear();
                $.each(data.photos.photo, function(i, item) {
                    var pt = new esri.geometry.Point(item.longitude, item.latitude, map.spatialReference);
                    var sms = new esri.symbol.PictureMarkerSymbol('images/flickr.png', 20, 20);
                    var attr = { "title": item.title };
                    var src = "http://farm" + item.farm + ".staticflickr.com/" + item.server + "/" + item.id + "_" + item.secret + "_n.jpg";
                    var infoTemplate = new esri.InfoTemplate();
                    infoTemplate.setTitle("<b>" + item.title + "</b>");
                    infoTemplate.setContent("<img src='" + src + "' class='flickrimage'/>");
                    var graphic = new esri.Graphic(pt, sms, attr, infoTemplate);
                    pictureLayer.add(graphic);
                });
            }
        });
}

