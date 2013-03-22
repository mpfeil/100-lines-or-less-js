require(["dojo/ready", "dojo/on", "dojo/dom-class", "esri/map", "esri/dijit/Geocoder"],
    function (ready, on, domClass) {

        ready(function () {

            var options = {
                basemap: "streets",
                extent: new esri.geometry.Extent({
                    "xmin": -13094934.17795995,
                    "ymin": 3959049.5650010793,
                    "xmax": -12826640.20867888,
                    "ymax": 4053525.7319615935,
                    "spatialReference": { "wkid": 102100 }
                })
            };
            var map = new esri.Map("map", options);

            // Class to represent a bookmark
            function bookmarkEntry(name, extent) {
                this.name = name;
                this.extent = extent;
            }

            // View model for bookmark
            function boomarksModelModel() {
                var self = this;
                var bookmarks = JSON.parse(localStorage.getItem("myMapBookmarks"));
                if (!bookmarks) bookmarks = [new bookmarkEntry("Overview", options.extent.toJson())];

                // Editable data
                self.bookmarks = ko.observableArray(bookmarks);

                // stores the value the user enters
                self.current = ko.observable();

                //listen for enter
                self.addBookmarkEnter = function (model, event) {
                    var keyCode = (event.which ? event.which : event.keyCode);
                    if (keyCode === 13) {
                        self.addBookmark();
                    }
                    return true;
                };

                //add a new one
                self.addBookmark = function () {
                    self.bookmarks.push(new bookmarkEntry(self.current(), map.extent.toJson()));
                    self.current(''); //clear the current value
                    self.save();
                };

                //zoom to it. set up history
                self.zoomBookmark = function (item) {
                    map.setExtent(new esri.geometry.Extent(item.extent));
                    //Don't want to use #! and can't build urls because no control on back end
                    history.pushState(item.extent, document.title, url + "?" + item.name);
                };

                self.zoomBookmarkbyName = function (name) {
                    var bm = self.bookmarks().filter(function (item) {
                        return (item.name.toLowerCase() === name.toLowerCase());
                    });
                    if (!bm[0]) return;
                    self.zoomBookmark(bm[0]);
                };

                //remove it
                self.remove = function (item) {
                    self.bookmarks.remove(item);
                    self.save();
                };

                self.save = function () {
                    localStorage.setItem("myMapBookmarks", JSON.stringify(this.bookmarks()));
                };

            }

            //Create model and apply the bindings to the UI
            var bmModel = new boomarksModelModel();
            ko.applyBindings(bmModel);

            //Allow bookmarks to work with back/forward buttons
            //event for loading history
            window.addEventListener("popstate", function (evt) {
                if (evt.state) {
                    map.setExtent(new esri.geometry.Extent(evt.state));
                }
            });

            //insert polyfill here / get a better browser! 
            if (!history.pushState) {
                history.pushState = function () { };
                history.replaceState = function () { };
            }

            var url = [location.protocol, '//', location.host, location.pathname].join('');

            //don't use dojo.connect anymore. Map object now supports on. Undocumented?
            on(map, "load", function () {
                if (decodeURIComponent(document.location.search.slice(1).split(";")[0])) {
                    bmModel.zoomBookmarkbyName(decodeURIComponent(document.location.search.slice(1).split(";")[0]));
                } else {
                    history.replaceState(options.extent, document.title, url);
                }
            });

            //add a geocoder because it looks really nice and is useful!
            // create the geocoder
            var geocoder = new esri.dijit.Geocoder({ map: map }, "search"); geocoder.startup();

            //Now lets make it responsive!
            on(dojo.byId('responsiveMenuSearch'), "click", function () {
                domClass.toggle(dojo.byId('search'), 'hide');
            });
            on(dojo.byId('responsiveMenuSearchBookmark'), "click", function () {
                domClass.toggle(dojo.byId('bookmarks'), 'hide');
            });

        });
    })
