/**
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

/* tslint:disable */
/// <reference path="../app.ts"/>
///<reference path="../../scripts/typings/cesium/cesium.d.ts"/>
///<reference path="../services/DrawHelperService.ts"/>

module Factories {
    declare var Cesium;

    export class MapConstants {
        public static R2D: number = 180.0 / Math.PI;
        public static D2R: number = Math.PI / 180.0;
        public static EARTH_RADIUS: number = 6371009; // meters for mean radius per WGS84
        public static TILE_DEPTH: number = 11; // per Microsoft this is about 76 meters per pixel
    }

    export interface ILonLat {
        Longitude: number;
        Latitude: number;
    }

    // A single latitude-longitude-altitude location in decimal degrees and meters
    export interface ILocation {
        Latitude: number;
        Longitude: number;
        Altitude: number;
    }

    export interface IMap {
        Id: string;
        ElevationService: IElevationService;
        setRectangle(lowerLeft: ILocation, upperRight: ILocation, duration?: number);
        setLonLatAlt(longitude: number, latitude: number, altitude: number): ILocation;
    }

    export interface IElevationService {
        TerrainData: { [id: string]: ITerrainData; };
        TerrainProvider: ITerrainProvider;
        getAltitude(loc: ILonLat): number;
        reportError(event: Event);
    }

    export interface ITerrainData {
    }

    export interface ITerrainProvider {
        Ready: boolean;
    }

    export class LonLat implements ILonLat {
        private lon: number;
        private lat: number;

        constructor(lon: number, lat: number) {
            this.lon = lon;
            this.lat = lat;
        }
        public get Longitude(): number { return this.lon; }
        public set Longitude(lon: number) { this.lon = lon; }
        public get Latitude(): number { return this.lat; }
        public set Latitude(lon: number) { this.lat = lon; }
    }

    export class MapController {
        public static $inject = ["$scope", "$q", "$log", "$location", "$http"];

        private mapId: string;
        private map: IMap;
        private useWindow: number = 0;      // 0 - uninitialized, 1 - use window, -1 - use offsetParent

        constructor(
            public $scope: ng.IScope,
            private $q: ng.IQService,
            private $log: ng.ILogService,
            private $location: ng.ILocationService,
            private $http: ng.IHttpService) {

            // For some reason, this constructor may be called twice at startup time.
            // The second time the application is trying to create a child of the first time result.
            // So we check and prevent the second call since we know we want to be created at the $root context.
            //
            if ($scope.$parent !== $scope['$root'])
                return;

            var that = this;
            that.mapId = "dirt";
            setTimeout(() => { that.addStuff(); }, 500);

            // Need to adjust the map window on resize and initialize
            var md: JQuery = jQuery('#' + that.mapId);
            jQuery(document).ready(() => { that.updateWindow(md); });
            jQuery(window).resize(() => { that.updateWindow(md); });
        }

        // Manage the map resize events
        private updateWindow(md: JQuery) {
            var width: number = window.innerWidth;
            var height: number = window.innerHeight;

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
            var svg: HTMLElement = document.getElementById("svg");
            if (svg != null) {
                svg.setAttributeNS(null, "viewBox", "0 0 " + width + " " + height);
                svg.setAttributeNS(null, "width", width.toString());
                svg.setAttributeNS(null, "height", height.toString());
            }
        }

        private count: number = 0;

        private addStuff() {
            var that = this;

            // Get a map using the supplied DIV
            if (that.map == null)
                that.map = new CzMap(that.mapId);

            // Wait around for the elevation service to load.
            if (that.count++ < 10)
                if (!(that.map).ElevationService.TerrainProvider.Ready) {
                    setTimeout(() => { that.addStuff(); }, 500);
                    return;
                }

            // Go find some mountains
            setTimeout(() => {
                that.map.setRectangle(
                    that.map.setLonLatAlt(67, 34, 0),
                    that.map.setLonLatAlt(69, 35, 0), 1);
            }, 0);

            return;
        }
    }

    export class CzMap implements IMap {
        // These should be getters only
        public Viewer: cesium.Viewer;
        public Scene: cesium.Scene;
        public Ellipsoid: cesium.Ellipsoid;

        private elevationService: IElevationService;

        private id: string;

        private drawingTools: boolean;

        public getAltitude: (loc: ILonLat) => number;

        constructor(mapDivId: string) {

            Cesium.BingMapsApi.defaultKey = " ";

            var fullscreenElement: HTMLElement = document.getElementById(mapDivId).parentElement;

            this.drawingTools = true;  // show the drawing tools plugin

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
            var globe: cesium.Globe = this.Scene.globe;
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

        public get Id(): string { return this.id; }
        public get ElevationService(): IElevationService { return this.elevationService; }

        public setLonLatAlt(longitude: number, latitude: number, altitude: number): ILocation {
            return new CzLocation(this, longitude, latitude, altitude);
        }

        private createDrawingTools() {
            // start the draw helper to enable shape creation and editing
            var drawHelper = new Services.DrawHelperService(this.Viewer.cesiumWidget);
            drawHelper.addListeners();
        }

        public setRectangle(lowerLeft: ILocation, upperRight: ILocation, durationSeconds?: number) {
            var that = this;
            var southWest: cesium.Cartographic =
                that.Ellipsoid.cartesianToCartographic((<CzLocation>lowerLeft).getEllipsoidCartesian());
            var northEast: cesium.Cartographic =
                that.Ellipsoid.cartesianToCartographic((<CzLocation>upperRight).getEllipsoidCartesian());

            var rectangle = new Cesium.Rectangle(
                southWest.longitude, southWest.latitude,
                northEast.longitude, northEast.latitude);

            if (durationSeconds == null)
                durationSeconds = 3; // default of 3 seconds
            that.Scene.camera.flyToRectangle({
                destination: rectangle,
                duration: durationSeconds
            });
        }
    }

    export class CzLocation implements ILocation {
        private map: CzMap;
        private cartesian: cesium.Cartesian3;
        private ellipsoidCartesian: cesium.Cartesian3;
        private latitude: number;
        private longitude: number;
        private altitude: number;

        constructor(map: CzMap, longitude: number, latitude: number, altitude: number, private date?: Date) {
            this.map = map;
            this.longitude = longitude;
            this.latitude = latitude;
            this.altitude = altitude;
            this.cartesian = null;
            this.ellipsoidCartesian = null;
        }

        private toCartesian(lon: number, lat: number, alt: number): cesium.Cartesian3 {
            var fd: cesium.Cartographic = Cesium.Cartographic.fromDegrees(lon, lat, alt);
            var temp: cesium.Cartesian3 = this.map.Ellipsoid.cartographicToCartesian(fd);
            if (this.altitude !== alt) {     // terrain height is being used, only set that.cartesian
                this.cartesian = temp;
            } else {                        // using input height, possibly set both values
                if (this.altitude !== 0)     // no need for that.ellipsoidCartesian
                    this.cartesian = temp;
                else                        // two values will be different
                    this.ellipsoidCartesian = temp;
            }
            return temp;
        }

        // This method ignores terrain - used mostly for bounding boxes
        public getEllipsoidCartesian(): cesium.Cartesian3 {
            var that = this;
            if (that.ellipsoidCartesian != null)
                return that.ellipsoidCartesian;
            if (that.altitude !== 0 && that.cartesian != null)
                return that.cartesian;
            return that.toCartesian(that.longitude, that.latitude, that.altitude);
        }

        // This method considers terrain if the entity is "on" the ground
        public getCartesian(): cesium.Cartesian3 {
            var that = this;
            if (that.cartesian != null)
                return that.cartesian;

            if (that.altitude === 0) {
                return that.toCartesian(that.longitude, that.latitude, that.map.getAltitude(new LonLat(that.longitude, that.latitude)));
            }
            else {
                return that.toCartesian(that.longitude, that.latitude, that.altitude);
            }
        }

        public get Latitude(): number { return this.latitude; }
        public get Longitude(): number { return this.longitude; }
        public get Altitude(): number { return this.altitude; }
    }

    export class ElevationService implements IElevationService {
        private terrainProvider: CzTerrainProvider;
        private terrainData: { [id: string]: CzTerrainData; };
        private globe: cesium.Globe;

        constructor(map: CzMap) {
            this.globe = map.Scene.globe;
            this.terrainProvider = new CzTerrainProvider('http://cesiumjs.org/smallterrain', 'Terrain data courtesy Analytical Graphics, Inc.');
            this.globe.terrainProvider = this.terrainProvider.CesiumTerrainProvider;

            this.terrainData = {};
        }

        public get TerrainData(): { [id: string]: ITerrainData; } { return this.terrainData; }
        public get TerrainProvider(): ITerrainProvider { return this.terrainProvider; }

        public getAltitude(loc: ILonLat): number {
            var that = (this instanceof CzMap) ? this["ElevationService"] : this;

            var height: any = that.globe.getHeight(new Cesium.Cartographic(loc.Longitude * MapConstants.D2R, loc.Latitude * MapConstants.D2R));
            if (typeof (height) === "undefined")
                return 0;
            return height;
        }

        public reportError(event: Event) {
            window.console && console.log("Event: " + event["message"]);
        }
    }

    export class CzTerrainProvider implements ITerrainProvider {
        private terrainProvider: cesium.TerrainProvider;

        constructor(url: string, credit: string) {
            this.terrainProvider = new Cesium.CesiumTerrainProvider({
                url: url,
                credit: credit
            });
        }

        public get CesiumTerrainProvider(): cesium.TerrainProvider {
            return this.terrainProvider;
        }

        public get Ready(): boolean {
            return this.terrainProvider.ready;
        }

        public get CesiumTilingScheme(): cesium.TilingScheme {
            return this.terrainProvider.tilingScheme;
        }
    }

    export class CzTerrainData implements ITerrainData {
        private terrainData: cesium.TerrainData;

        constructor(terrainData?: cesium.TerrainData) {
            this.terrainData = terrainData || new cesium.TerrainData();
        }

        public buffer(): Uint16Array {
            return this.terrainData["_buffer"];
        }
    }

    Main.App.Controllers.controller("MapController", MapController);
}