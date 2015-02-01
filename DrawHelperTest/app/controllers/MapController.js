/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
/* tslint:disable */
/// <reference path="../app.ts"/>
///<reference path="../../scripts/typings/cesium/cesium.d.ts"/>
///<reference path="../services/DrawHelperService.ts"/>
var Factories;
(function (Factories) {
    var MapConstants = (function () {
        function MapConstants() {
        }
        MapConstants.R2D = 180.0 / Math.PI;
        MapConstants.D2R = Math.PI / 180.0;
        MapConstants.EARTH_RADIUS = 6371009; // meters for mean radius per WGS84
        MapConstants.TILE_DEPTH = 11; // per Microsoft this is about 76 meters per pixel
        return MapConstants;
    })();
    Factories.MapConstants = MapConstants;
    var LonLat = (function () {
        function LonLat(lon, lat) {
            this.lon = lon;
            this.lat = lat;
        }
        Object.defineProperty(LonLat.prototype, "Longitude", {
            get: function () {
                return this.lon;
            },
            set: function (lon) {
                this.lon = lon;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LonLat.prototype, "Latitude", {
            get: function () {
                return this.lat;
            },
            set: function (lon) {
                this.lat = lon;
            },
            enumerable: true,
            configurable: true
        });
        return LonLat;
    })();
    Factories.LonLat = LonLat;
    var MapController = (function () {
        function MapController($scope, $q, $log, $location, $http) {
            this.$scope = $scope;
            this.$q = $q;
            this.$log = $log;
            this.$location = $location;
            this.$http = $http;
            this.useWindow = 0; // 0 - uninitialized, 1 - use window, -1 - use offsetParent
            this.count = 0;
            // For some reason, this constructor may be called twice at startup time.
            // The second time the application is trying to create a child of the first time result.
            // So we check and prevent the second call since we know we want to be created at the $root context.
            //
            if ($scope.$parent !== $scope['$root'])
                return;
            var that = this;
            that.mapId = "dirt";
            setTimeout(function () {
                that.addStuff();
            }, 500);
            // Need to adjust the map window on resize and initialize
            var md = jQuery('#' + that.mapId);
            jQuery(document).ready(function () {
                that.updateWindow(md);
            });
            jQuery(window).resize(function () {
                that.updateWindow(md);
            });
        }
        // Manage the map resize events
        MapController.prototype.updateWindow = function (md) {
            var width = window.innerWidth;
            var height = window.innerHeight;
            // If we have a fixed extent (i.e., offsetParent) use it, otherwise go with the window.
            if (this.useWindow === 0) {
                this.useWindow = (window.innerHeight === md.offsetParent().height()) ? 1 : -1;
            }
            if (this.useWindow === -1) {
                width = md.offsetParent().width();
                height = md.offsetParent().height();
            }
            if (md.height() !== height) {
                md.parents().height(height);
            }
            // Make sure the "canvas" for the SVG data matches the current map window
            var svg = document.getElementById("svg");
            if (svg != null) {
                svg.setAttributeNS(null, "viewBox", "0 0 " + width + " " + height);
                svg.setAttributeNS(null, "width", width.toString());
                svg.setAttributeNS(null, "height", height.toString());
            }
        };
        MapController.prototype.addStuff = function () {
            var that = this;
            // Get a map using the supplied DIV
            if (that.map == null)
                that.map = new CzMap(that.mapId);
            // Wait around for the elevation service to load.
            if (that.count++ < 10)
                if (!(that.map).ElevationService.TerrainProvider.Ready) {
                    setTimeout(function () {
                        that.addStuff();
                    }, 500);
                    return;
                }
            // Go find some mountains
            setTimeout(function () {
                that.map.setRectangle(that.map.setLonLatAlt(67, 34, 0), that.map.setLonLatAlt(69, 35, 0), 1);
            }, 0);
            return;
        };
        MapController.$inject = ["$scope", "$q", "$log", "$location", "$http"];
        return MapController;
    })();
    Factories.MapController = MapController;
    var CzMap = (function () {
        function CzMap(mapDivId) {
            Cesium.BingMapsApi.defaultKey = " ";
            var fullscreenElement = document.getElementById(mapDivId).parentElement;
            this.drawingTools = true; // show the drawing tools plugin
            this.Viewer = new Cesium.Viewer(mapDivId, {
                baseLayerPicker: false,
                fullscreenElement: fullscreenElement,
                navigationInstructionsInitiallyVisible: true,
                timeline: true,
                animation: true,
                fullscreenButton: true,
                scene3DOnly: true,
                homeButton: true,
                infoBox: true,
                geocoder: false,
                navigationHelpButton: true
            });
            this.Scene = this.Viewer.scene;
            this.Ellipsoid = this.Scene.globe.ellipsoid;
            this.id = mapDivId;
            // Set up for 3D terrain
            var globe = this.Scene.globe;
            globe.depthTestAgainstTerrain = true;
            this.elevationService = new ElevationService(this);
            this.getAltitude = this.elevationService.getAltitude;
            globe.imageryLayers.removeAll();
            var imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
                url: "//services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
            });
            globe.imageryLayers.addImageryProvider(imageryProvider);
            // Create some drawing tools
            if (this.drawingTools)
                this.createDrawingTools();
        }
        Object.defineProperty(CzMap.prototype, "Id", {
            get: function () {
                return this.id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CzMap.prototype, "ElevationService", {
            get: function () {
                return this.elevationService;
            },
            enumerable: true,
            configurable: true
        });
        CzMap.prototype.setLonLatAlt = function (longitude, latitude, altitude) {
            return new CzLocation(this, longitude, latitude, altitude);
        };
        CzMap.prototype.createDrawingTools = function () {
            // start the draw helper to enable shape creation and editing
            var drawHelper = new Services.DrawHelperService(this.Viewer.cesiumWidget);
            drawHelper.addListeners();
        };
        CzMap.prototype.setRectangle = function (lowerLeft, upperRight, durationSeconds) {
            var that = this;
            var southWest = that.Ellipsoid.cartesianToCartographic(lowerLeft.getEllipsoidCartesian());
            var northEast = that.Ellipsoid.cartesianToCartographic(upperRight.getEllipsoidCartesian());
            var rectangle = new Cesium.Rectangle(southWest.longitude, southWest.latitude, northEast.longitude, northEast.latitude);
            if (durationSeconds == null)
                durationSeconds = 3; // default of 3 seconds
            that.Scene.camera.flyToRectangle({
                destination: rectangle,
                duration: durationSeconds
            });
        };
        return CzMap;
    })();
    Factories.CzMap = CzMap;
    var CzLocation = (function () {
        function CzLocation(map, longitude, latitude, altitude, date) {
            this.date = date;
            this.map = map;
            this.longitude = longitude;
            this.latitude = latitude;
            this.altitude = altitude;
            this.cartesian = null;
            this.ellipsoidCartesian = null;
        }
        CzLocation.prototype.toCartesian = function (lon, lat, alt) {
            var fd = Cesium.Cartographic.fromDegrees(lon, lat, alt);
            var temp = this.map.Ellipsoid.cartographicToCartesian(fd);
            if (this.altitude !== alt) {
                this.cartesian = temp;
            }
            else {
                if (this.altitude !== 0)
                    this.cartesian = temp;
                else
                    this.ellipsoidCartesian = temp;
            }
            return temp;
        };
        // This method ignores terrain - used mostly for bounding boxes
        CzLocation.prototype.getEllipsoidCartesian = function () {
            var that = this;
            if (that.ellipsoidCartesian != null)
                return that.ellipsoidCartesian;
            if (that.altitude !== 0 && that.cartesian != null)
                return that.cartesian;
            return that.toCartesian(that.longitude, that.latitude, that.altitude);
        };
        // This method considers terrain if the entity is "on" the ground
        CzLocation.prototype.getCartesian = function () {
            var that = this;
            if (that.cartesian != null)
                return that.cartesian;
            if (that.altitude === 0) {
                return that.toCartesian(that.longitude, that.latitude, that.map.getAltitude(new LonLat(that.longitude, that.latitude)));
            }
            else {
                return that.toCartesian(that.longitude, that.latitude, that.altitude);
            }
        };
        Object.defineProperty(CzLocation.prototype, "Latitude", {
            get: function () {
                return this.latitude;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CzLocation.prototype, "Longitude", {
            get: function () {
                return this.longitude;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CzLocation.prototype, "Altitude", {
            get: function () {
                return this.altitude;
            },
            enumerable: true,
            configurable: true
        });
        return CzLocation;
    })();
    Factories.CzLocation = CzLocation;
    var ElevationService = (function () {
        function ElevationService(map) {
            this.globe = map.Scene.globe;
            this.terrainProvider = new CzTerrainProvider('http://cesiumjs.org/smallterrain', 'Terrain data courtesy Analytical Graphics, Inc.');
            this.globe.terrainProvider = this.terrainProvider.CesiumTerrainProvider;
            this.terrainData = {};
        }
        Object.defineProperty(ElevationService.prototype, "TerrainData", {
            get: function () {
                return this.terrainData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ElevationService.prototype, "TerrainProvider", {
            get: function () {
                return this.terrainProvider;
            },
            enumerable: true,
            configurable: true
        });
        ElevationService.prototype.getAltitude = function (loc) {
            var that = (this instanceof CzMap) ? this["ElevationService"] : this;
            var height = that.globe.getHeight(new Cesium.Cartographic(loc.Longitude * MapConstants.D2R, loc.Latitude * MapConstants.D2R));
            if (typeof (height) === "undefined")
                return 0;
            return height;
        };
        ElevationService.prototype.reportError = function (event) {
            window.console && console.log("Event: " + event["message"]);
        };
        return ElevationService;
    })();
    Factories.ElevationService = ElevationService;
    var CzTerrainProvider = (function () {
        function CzTerrainProvider(url, credit) {
            this.terrainProvider = new Cesium.CesiumTerrainProvider({
                url: url,
                credit: credit
            });
        }
        Object.defineProperty(CzTerrainProvider.prototype, "CesiumTerrainProvider", {
            get: function () {
                return this.terrainProvider;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CzTerrainProvider.prototype, "Ready", {
            get: function () {
                return this.terrainProvider.ready;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CzTerrainProvider.prototype, "CesiumTilingScheme", {
            get: function () {
                return this.terrainProvider.tilingScheme;
            },
            enumerable: true,
            configurable: true
        });
        return CzTerrainProvider;
    })();
    Factories.CzTerrainProvider = CzTerrainProvider;
    var CzTerrainData = (function () {
        function CzTerrainData(terrainData) {
            this.terrainData = terrainData || new cesium.TerrainData();
        }
        CzTerrainData.prototype.buffer = function () {
            return this.terrainData["_buffer"];
        };
        return CzTerrainData;
    })();
    Factories.CzTerrainData = CzTerrainData;
    Main.App.Controllers.controller("MapController", MapController);
})(Factories || (Factories = {}));
//# sourceMappingURL=MapController.js.map