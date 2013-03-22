/*global require esri document define angular*/
(function() {
    'use strict';
    var app = angular.module('searchApp', []);
    define('app.symbols', ['esri/symbol'], function (Symbol) {
        return { pms: new Symbol.PictureMarkerSymbol('images/32Px-196.png',
            32, 32) };
    });
    require(['dojo/_base/connect', 'app.symbols', 'esri/tasks/locator',
        'esri/tasks/find', 'dojo/domReady!'], function (con, symbols) {
            var map = new esri.Map('map', {
                    basemap: 'gray',
                    center: [-118.20959546463835,34.28548773859569],
                    zoom: 10,
                    slider: false
                }),
                url = 'http://gis.lacounty.gov/ArcGIS/rest/services/'+
                        'Parks/Parks_LMS/MapServer',
                find = new esri.tasks.FindTask(url),
                fParams = new esri.tasks.FindParameters();
                fParams.returnGeometry = true;
                fParams.layerIds = [0];
                fParams.searchFields = ['Name', 'org_name', 'addrln1',
                                        'city', 'Amenities', 'Activities'];
            // angular controllers
            app.controller('TooltipCtrl', function ($scope) {
                con.connect(map, 'onLoad', function () {
                    con.connect(map.graphics, 'onMouseOver', function (e) {
                        var coords = esri.geometry.toScreenPoint(map.extent,
                            map.width, map.height, e.graphic.geometry);
                        $scope.info = { x:coords.x+20, y:coords.y+10 };
                        $scope.data = e.graphic.attributes;
                        $scope.showTooltip = true;
                        $scope.$apply();
                    });
                    con.connect(map.graphics, 'onMouseOut', function (e) {
                        $scope.showTooltip = false;
                        $scope.$apply();
                    });
                });
            });
            app.controller('SearchCtrl', function ($scope) {
                $scope.showPark = function (feature) {
                    $scope.results = [];
                    map.graphics.clear();
                    feature.setSymbol(symbols.pms);
                    map.graphics.add(feature);
                    map.centerAndZoom(feature.geometry, 17);
                };
                $scope.search = function () {
                    if ($scope.searchItem.length > 3) {
                        $scope.results = [];
                        fParams.searchText = $scope.searchItem;
                        find.execute(fParams).then(function (r) {
                            var i = 0, res = [],
                            len = r.length < 5 ? r.length : 5;
                        for (i;i<len;i++) {
                            res.push({value:r[i].feature.attributes.Name,
                                feature:r[i].feature});
                        }
                        $scope.results = res;
                        $scope.$apply();
                        });
                    }
                };
            });
            angular.bootstrap(document.body, ['searchApp']);
        });
})();
