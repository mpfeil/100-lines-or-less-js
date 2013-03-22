dojo.require("esri.map");
dojo.require("esri.dijit.Geocoder");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.layers.osm");

var map, pageLayer;

dojo.ready(init);

function init() {
  map = new esri.Map("map", {center: [-96.9953,37.2397],zoom: 15});
  osmLayer = new esri.layers.OpenStreetMapLayer();
  pageLayer = new esri.layers.GraphicsLayer();
  map.addLayer(osmLayer);
  map.addLayer(pageLayer);
  map.disableKeyboardNavigation()
  autoResize(map)
  getPages([map.extent.getCenter().getLatitude(),map.extent.getCenter().getLongitude()]
      ,$('#buffer').val(), $('#search').val(), $('#resultsToReturn').val());
  dojo.connect(map, "onExtentChange", function(extent){
    getPages([extent.getCenter().getLatitude(),extent.getCenter().getLongitude()]
      ,$('#buffer').val(), $('#search').val(), $('#resultsToReturn').val());
  });
  var geocoder = new esri.dijit.Geocoder({
    map: map,
    autocomplete: true,
    esriGeocoder: {
        name: "Esri World Geocoder"
      }
    }, "geocoder");
    geocoder.startup();
  }

function autoResize(map) {
  dojo.connect(map, 'onLoad', function (map) {
      dojo.connect(window, 'resize', map, map.resize);
  });
  dojo.connect(map, 'onResize',  function(extent, width, height) { 
    map.__resizeCenter = map.extent.getCenter();
	setTimeout(function() {
	  map.centerAt(map.__resizeCenter);
	}, 200);
  });
}

function getPages(center, distance, searchTerm, resultsToReturn) {
  if (searchTerm != ""){
    searchTerm = "q=" + searchTerm + "&";
  }
  $.getJSON("https://graph.facebook.com/search?" + searchTerm + "limit=" + resultsToReturn 
           + "&distance=" + distance + "&type=place&center=" + center 
           + "&access_token=571905639495508|vZvyIA6CVnpiTyhCx1yAaEJFUUg&callback=?",
    function (data) {
      if (data.data) {
        pageLayer.clear();
        $.each(data.data, function (i, item) {
          var pagePoint = new esri.geometry.Point({ latitude: item.location.latitude, 
                                                    longitude: item.location.longitude });
          var symbol = new esri.symbol.PictureMarkerSymbol('images/page.png', 20, 20);
          var attr = { "title": item.name };
          var content = "<a href='http://www.facebook.com/" + item.id 
                        + "' target='_blank'/><img src='https://graph.facebook.com/" + item.id
                        + "/picture' alt='" + item.name + "'/><br/>" + item.location.street 
                        + "<br/>" + item.location.city + "</a>";
          var infoTemplate = new esri.InfoTemplate(item.name, content);
          var graphic = new esri.Graphic(pagePoint, symbol, attr, infoTemplate);
          pageLayer.add(graphic);
        });
      }
    }
  );
}


