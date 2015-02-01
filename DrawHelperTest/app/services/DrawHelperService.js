/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/* tslint:disable */
/// <reference path="../../scripts/typings/DrawHelper/DrawHelper.d.ts" />
/// <reference path="../../scripts/typings/cesium/cesium.d.ts" />
/// <reference path="../../scripts/typings/bootbox/bootbox.d.ts" />
var Services;
(function (Services) {
    // ReSharper restore InconsistentNaming
    var DrawHelperService = (function (_super) {
        __extends(DrawHelperService, _super);
        function DrawHelperService(widget) {
            _super.call(this, widget);
            this.material = Cesium.Material.fromType(Cesium.Material.ColorType);
            // context menu variables
            this.contextMenuActive = false;
            this.logging = document.getElementById("drawingLogging");
            this.widget = widget;
            this.scene = widget.scene;
            this.globe = this.scene.globe;
            this.ellipsoid = this.globe.ellipsoid;
            this.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);
            this.initialiseHandlers();
            this.enhancePrimitives();
        }
        DrawHelperService.prototype.screenToCartesian3 = function (screen) {
            var pickRay = this.scene.camera.getPickRay(screen);
            var cartesian = this.scene.globe.pick(pickRay, this.scene);
            return (typeof cartesian == "undefined") ? null : cartesian;
        };
        Object.defineProperty(DrawHelperService.prototype, "drawingPrimitives", {
            get: function () {
                if (this.localDrawingPrimitives == null || !this.widget.scene.primitives.contains(this.localDrawingPrimitives) || this.localDrawingPrimitives.isDestroyed()) {
                    this.localDrawingPrimitives = new Cesium.PrimitiveCollection();
                    this.widget.scene.primitives.add(this.localDrawingPrimitives);
                }
                return this.localDrawingPrimitives;
            },
            enumerable: true,
            configurable: true
        });
        DrawHelperService.prototype.getExtentCorners = function (value, height) {
            height = (typeof (height) == "undefined") ? 0.0 : height;
            var corners = [];
            corners.push(new Cesium.Cartographic(value.west, value.north, height));
            corners.push(new Cesium.Cartographic(value.east, value.north, height));
            corners.push(new Cesium.Cartographic(value.east, value.south, height));
            corners.push(new Cesium.Cartographic(value.west, value.south, height));
            var ca = this.ellipsoid.cartographicArrayToCartesianArray(corners);
            this.setCartesianAltitudes(ca, [height, height, height, height]);
            return (ca);
        };
        DrawHelperService.prototype.restoreAll = function () {
            var that = this;
            bootbox.prompt("Please enter the tag associated with the saved draw tool data:", function (result) {
                if (result === null)
                    return;
                that.savedItems = JSON.parse(localStorage.getItem(result));
                if (that.savedItems === null) {
                    bootbox.alert("Could not find tag '" + result + "' in local storage.<br>Is the browser clearing local storage on exit?");
                    return;
                }
                var dp = that.localDrawingPrimitives;
                that.savedItems.forEach(function (ele) {
                    switch (ele.type) {
                        case "extent":
                            that.createAsExtent(ele.extent, ele.height, dp);
                            break;
                        case "circle":
                            that.createAsCircle(ele.center, ele.radius, ele.height, dp);
                            break;
                        case "polygon":
                            that.createAsPolygon(ele.positions, ele.height, dp);
                            break;
                        case "polyline":
                            that.createAsPolyline(ele.positions, dp);
                            break;
                        case "billboards":
                            ele.positions.forEach(function (bb) {
                                that.createAsBillboard(bb, dp);
                            });
                            break;
                    }
                });
            });
        };
        DrawHelperService.prototype.saveAll = function () {
            var that = this;
            bootbox.prompt("Please enter a tag to associate with the draw tool data:", function (result) {
                if (result === null)
                    return;
                that.disableAllEditMode();
                that.disableAllHighlights();
                that.savedItems = [];
                for (var i = 0, len = that.drawingPrimitives.length; i < len; i++) {
                    var ele = that.drawingPrimitives.get(i);
                    if (ele instanceof DrawHelper.ExtentPrimitive) {
                        ele = ele;
                        that.savedItems.push({ type: "extent", extent: ele.extent, height: ele.height });
                    }
                    else if (ele instanceof DrawHelper.CirclePrimitive) {
                        ele = ele;
                        that.savedItems.push({
                            type: "circle",
                            center: ele.center,
                            radius: ele.radius,
                            height: ele.height
                        });
                    }
                    else if (ele instanceof DrawHelper.PolylinePrimitive) {
                        ele = ele;
                        that.savedItems.push({
                            type: "polyline",
                            positions: ele.positions
                        });
                    }
                    else if (ele instanceof DrawHelper.PolygonPrimitive) {
                        ele = ele;
                        that.savedItems.push({
                            type: "polygon",
                            positions: ele.positions,
                            height: ele.height
                        });
                    }
                    else if (ele instanceof Cesium.BillboardCollection && ele.length > 0) {
                        ele = ele;
                        var bills = [];
                        for (var j = 0, length = ele.length; j < length; j++) {
                            bills.push(ele.get(j).position);
                        }
                        that.savedItems.push({ type: "billboards", positions: bills });
                    }
                }
                localStorage.setItem(result, JSON.stringify(that.savedItems));
            });
        };
        // If there is a value in hi, use it to set the height.
        // Otherwise lookup the height and set it.
        DrawHelperService.prototype.setCartesianAltitudes = function (c3, hi) {
            if (c3 == null || c3.length === 0)
                return null;
            var that = this;
            var carto = that.ellipsoid.cartesianArrayToCartographicArray(c3, []);
            var gotHeights = (hi != null && hi.length === c3.length);
            for (var i = 0; i < carto.length; i++) {
                var height = that.globe.getHeight(carto[i]);
                height = (typeof (height) === "undefined") ? DrawHelperService.MIN_HEIGHT : DrawHelperService.MIN_HEIGHT + height;
                if (gotHeights) {
                    carto[i].height = Math.max(height, hi[i]);
                }
                else {
                    if (carto[i].height < DrawHelperService.MIN_HEIGHT)
                        carto[i].height = height;
                    if (hi != null)
                        hi.push(carto[i].height);
                }
            }
            return that.ellipsoid.cartographicArrayToCartesianArray(carto, c3);
        };
        // This is fairly expensive computationally - don't call the Cesium equalsEpsilon (results are not conistent)
        DrawHelperService.prototype.cartesianEqualsEpsilon = function (aIn, bIn, epsilon) {
            // need to compare points without heights
            var aCarto = this.ellipsoid.cartesianToCartographic(aIn);
            aCarto.height = 0;
            var bCarto = this.ellipsoid.cartesianToCartographic(bIn);
            bCarto.height = 0;
            var aOut = this.ellipsoid.cartographicToCartesian(aCarto);
            var bOut = this.ellipsoid.cartographicToCartesian(bCarto);
            // Sort of a Manhattan compare
            return Math.abs(aOut.x - bOut.x) <= epsilon && Math.abs(aOut.y - bOut.y) <= epsilon && Math.abs(aOut.z - bOut.z) <= epsilon;
        };
        DrawHelperService.prototype.initialiseContextMenu = function (scene) {
            var that = this;
            // We'll set up a right-click handler just for the draw entities
            var handler = new Cesium.ScreenSpaceEventHandler(that.scene.canvas);
            handler.setInputAction(function (click) {
                var pickedObject = that.scene.pick(click.position);
                if (Cesium.defined(pickedObject)) {
                    var ele = pickedObject.primitive;
                    if (ele instanceof DrawHelper.ExtentPrimitive || ele instanceof DrawHelper.CirclePrimitive || ele instanceof DrawHelper.PolylinePrimitive || ele instanceof DrawHelper.PolygonPrimitive || (ele instanceof Cesium.Billboard && that.markerBillboards.contains(ele))) {
                        that.manageContextMenu(ele, click.position);
                    }
                }
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        };
        DrawHelperService.prototype.manageContextMenu = function (entity, position) {
            var that = this;
            var cm = null;
            var cms = null;
            var lis = null;
            var listHandler = null;
            that.contextMenuActive = true;
            that["_tooltip"].setVisible(false);
            // handle clicks outside the context menu - by mostly closing the context menu
            var docHandler = function (event) {
                if (event.target !== cm) {
                    cms.display = "none";
                    that.contextMenuActive = false;
                    document.removeEventListener("click", docHandler);
                }
                for (var j = 0; j < lis.length; j++)
                    lis[j].removeEventListener("click", listHandler);
            };
            // we process the many, many menu items here - one at the time of this comment
            var li;
            listHandler = function () {
                var bb = entity instanceof Cesium.Billboard;
                if (!bb)
                    entity.setEditMode(false);
                switch (li.textContent) {
                    case "Remove":
                        if (bb) {
                            that.markerBillboards.remove(entity);
                        }
                        else {
                            that.localDrawingPrimitives.remove(entity);
                        }
                        break;
                }
                cms.display = "none";
                that.contextMenuActive = false;
                document.removeEventListener("click", docHandler);
                for (var j = 0; j < lis.length; j++)
                    lis[j].removeEventListener("click", listHandler);
            };
            // we'll drop this on the contextMenu for now
            var html = "<div class='dropdown open'><ul class='dropdown-menu' role='menu'>"; // the header
            html += "<li><a tabindex='-1'>Remove</a></li>"; // the menu items
            html += "</ul></div>"; // the footer
            // show the context menu in the right position - equivalent to jQuery("#contextMenu").html(html).css({ left: position.x + "px", top: position.y + "px" }).show();
            cm = document.getElementById("contextMenu");
            cm.innerHTML = html;
            cms = cm.style;
            cms.top = position.y + "px";
            cms.left = position.x + "px";
            cms.display = "block";
            // setup to process the context menu click events
            lis = cm.getElementsByTagName("li");
            for (var i = 0; i < lis.length; i++) {
                li = lis[i];
                li.addEventListener("click", listHandler);
            }
            // listen for clicks outside the context menu - so we can close the context menu
            document.addEventListener("click", docHandler);
        };
        DrawHelperService.prototype.createAsBillboard = function (position, dp) {
            var that = this;
            // Create one common billboard collection for all billboarded markers
            if (that.markerBillboards == null || !dp.contains(that.markerBillboards) || that.markerBillboards.isDestroyed()) {
                that.markerBillboards = new Cesium.BillboardCollection();
                dp.add(that.markerBillboards); // only add once
            }
            var billboard = that.markerBillboards.add({
                show: true,
                position: position,
                pixelOffset: new Cesium.Cartesian2(0, 0),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 1.0,
                image: "./img/glyphicons_242_google_maps.png",
                color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
            });
            billboard.setEditable();
            that.loggingMessage("Marker at: " + that.cartesianToString(position));
        };
        DrawHelperService.prototype.createAsPolyline = function (positions, dp) {
            var that = this;
            var polyline = new DrawHelper.PolylinePrimitive({
                positions: positions,
                width: 5,
                geodesic: true
            });
            dp.add(polyline);
            polyline.setEditable();
            that.loggingMessage("Polyline created: " + positions.length + " points");
            polyline.addListener("onEdited", function (event) {
                // Find maximum height for polyline
                var height = that.sampleGridHeights(event.positions, 4);
                var heights = [];
                for (var i = 0, len = event.positions.length; i < len; i++)
                    heights.push(height);
                polyline.positions = that.setCartesianAltitudes(event.positions, heights);
                that.loggingMessage("Polyline edited: " + event.positions.length + " points");
                // This is work-around to deal with the possible reporting of double-clicks as single- + double-clicks.
                // The actual code resets the grab handles on the entity. 
                setTimeout(function () {
                    that.setEdited(polyline);
                    if (that["_editedSurface"])
                        that["_editedSurface"].setEditMode(true);
                }, 250);
            });
        };
        DrawHelperService.prototype.createAsPolygon = function (positions, height, dp) {
            var that = this;
            var polygon = new DrawHelper.PolygonPrimitive({
                positions: positions,
                height: height,
                material: Cesium.Material.fromType("Checkerboard")
            });
            dp.add(polygon);
            polygon.setEditable();
            that.loggingMessage("Polygon created: " + positions.length + " points at " + height.toFixed(0) + "m");
            polygon.addListener("onEdited", function (event) {
                polygon.height = that.sampleGridHeights(event.positions, 4);
                that.loggingMessage("Polygon edited: " + event.positions.length + " points at " + polygon.height.toFixed(0) + "m");
                // This is work-around to deal with the possible reporting of double-clicks as single- + double-clicks.
                // The actual code resets the grab handles on the entity. 
                setTimeout(function () {
                    that.setEdited(polygon);
                    if (that["_editedSurface"])
                        that["_editedSurface"].setEditMode(true);
                }, 250);
            });
        };
        DrawHelperService.prototype.createAsCircle = function (center, radius, height, dp) {
            var that = this;
            var circle = new DrawHelper.CirclePrimitive({
                center: center,
                radius: radius,
                height: height,
                material: Cesium.Material.fromType(Cesium.Material.RimLightingType)
            });
            dp.add(circle);
            circle.setEditable();
            that.loggingMessage("Circle created: Center " + that.cartesianToString(center) + ", Radius " + radius.toFixed(0) + "m" + ", Height " + height.toFixed(0) + "m");
            circle.addListener("onEdited", function (event) {
                circle.height = that.sampleCircleHeights(event.center, event.radius, 4);
                that.loggingMessage("Circle edited: Center " + that.cartesianToString(event.center) + ", Radius " + event.radius.toFixed(0) + "m, Height " + circle.height.toFixed(0) + "m");
            });
        };
        DrawHelperService.prototype.createAsExtent = function (rect, height, dp) {
            var that = this;
            var extentPrimitive = new DrawHelper.ExtentPrimitive({
                extent: rect,
                height: height,
                material: Cesium.Material.fromType(Cesium.Material.StripeType)
            });
            dp.add(extentPrimitive);
            extentPrimitive.setEditable();
            that.loggingMessage("Extent created: " + that.extentToString(rect) + " at " + height.toFixed(0) + "m");
            extentPrimitive.addListener("onEdited", function (event) {
                rect = that.extentToRectangle(event.extent);
                var ca = that.getExtentCorners(rect, extentPrimitive.height);
                extentPrimitive.height = that.sampleGridHeights(ca, 4);
                that.loggingMessage("Extent edited: " + that.extentToString(rect) + " at " + height.toFixed(0) + "m");
            });
        };
        DrawHelperService.prototype.loggingMessage = function (message) {
            var that = this;
            // cancel any old message clearing
            if (that.timeoutId !== 0)
                clearTimeout(that.timeoutId);
            // set the new message
            that.logging.innerHTML = message;
            // set up to clear the new message
            that.timeoutId = setTimeout(function () {
                that.logging.innerHTML = "";
            }, 5000);
        };
        DrawHelperService.prototype.addListeners = function () {
            var _this = this;
            var that = this;
            // we need the primitive collection so we can add stuff
            var dp = this.drawingPrimitives;
            var toolbar = this.addToolbar(document.getElementById("drawingToolbar"), {
                buttons: ["marker", "polyline", "polygon", "circle", "extent"]
            });
            document.getElementById("drawingLogging").style.display = "inline";
            toolbar.addListener("markerCreated", function (event) {
                _this.setCartesianAltitude(event.position);
                that.createAsBillboard(event.position, dp);
            });
            toolbar.addListener("polylineCreated", function (event) {
                // Find maximum height for polyline
                var height = that.sampleGridHeights(event.positions, 4);
                var heights = [];
                for (var i = 0, len = event.positions.length; i < len; i++)
                    heights.push(height);
                that.setCartesianAltitudes(event.positions, heights);
                that.createAsPolyline(event.positions, dp);
            });
            toolbar.addListener("polygonCreated", function (event) {
                // Find maximum height for polygon
                var height = that.sampleGridHeights(event.positions, 4);
                that.createAsPolygon(event.positions, height, dp);
            });
            toolbar.addListener("circleCreated", function (event) {
                var height = that.sampleCircleHeights(event.center, event.radius, 4);
                that.setCartesianAltitude(event.center, [height]);
                that.createAsCircle(event.center, event.radius, height, dp);
            });
            toolbar.addListener("extentCreated", function (event) {
                var rect = that.extentToRectangle(event.extent);
                var ca = that.getExtentCorners(rect, 0.0);
                var height = that.sampleGridHeights(ca, 4);
                that.createAsExtent(rect, height, dp);
            });
        };
        DrawHelperService.prototype.metersPerPixel = function () {
            var that = this;
            var camera = that.scene.camera;
            var ground = that.ellipsoid.cartesianToCartographic(camera.position);
            ground.height = -100;
            var direction = camera.direction;
            var toCenter = Cesium.Cartesian3.subtract(that.ellipsoid.cartographicToCartesian(ground), camera.position, new Cesium.Cartesian3());
            // vector from camera to a primitive
            var toCenterProj = Cesium.Cartesian3.multiplyByScalar(direction, Cesium.Cartesian3.dot(direction, toCenter), new Cesium.Cartesian3());
            // project vector onto camera direction vector
            var distance = Cesium.Cartesian3.magnitude(toCenterProj);
            var pixelSize = camera.frustum.getPixelSize(new Cesium.Cartesian2(that.widget.container.clientWidth, that.widget.container.clientHeight), distance);
            return pixelSize.x;
        };
        // If there is a value in hi, use it to set the height.
        // Otherwise lookup the height and set it.
        DrawHelperService.prototype.setCartesianAltitude = function (c3, hi) {
            var that = this;
            var carto = that.ellipsoid.cartesianToCartographic(c3);
            if (isNaN(carto.height)) {
                carto.height = DrawHelperService.MIN_HEIGHT;
            }
            var height = that.scene.globe.getHeight(carto);
            if (isNaN(carto.height)) {
                carto.height = DrawHelperService.MIN_HEIGHT;
            }
            height = (typeof (height) === "undefined") ? DrawHelperService.MIN_HEIGHT : DrawHelperService.MIN_HEIGHT + height;
            var gotHeight = (hi != null && hi.length > 0);
            if (gotHeight) {
                carto.height = Math.max(carto.height, height, hi[0]);
            }
            else {
                if (carto.height < height)
                    carto.height = height;
                if (hi != null)
                    hi.push(carto.height);
            }
            return that.ellipsoid.cartographicToCartesian(carto, c3);
        };
        DrawHelperService.prototype.extentToRectangle = function (extent) {
            return new Cesium.Rectangle(extent.west, extent.south, extent.east, extent.north);
        };
        DrawHelperService.prototype.extentToString = function (rect) {
            return "(N: " + (rect.north * DrawHelperService.R2D).toFixed(5) + ", S: " + (rect.south * DrawHelperService.R2D).toFixed(5) + ", E: " + (rect.east * DrawHelperService.R2D).toFixed(5) + ", W: " + (rect.west * DrawHelperService.R2D).toFixed(5) + ")";
        };
        DrawHelperService.prototype.cartesianToString = function (c3) {
            var carto = this.ellipsoid.cartesianToCartographic(c3);
            return '(' + (Math.abs(carto.latitude) * DrawHelperService.R2D).toFixed(5) + ((carto.latitude >= 0) ? "\u00B0N, " : "\u00B0S, ") + (Math.abs(carto.longitude) * DrawHelperService.R2D).toFixed(5) + ((carto.longitude >= 0) ? "\u00B0E, " : "\u00B0W, ") + (carto.height).toFixed(0) + "m)";
        };
        /**
         * Finds the maximum height for a grid of points overlaid on the provided points.
         * @param {Array<Cesium.Cartesian3>} cartesian An array of points over which to overlay the grid.
         * @param {number} gridSize The number of subintervals making up the grid, horizontally and vertically.
         * @returns {number} The maximum sampled height.
         */
        DrawHelperService.prototype.sampleGridHeights = function (cartesian, gridSize) {
            var that = this;
            // get the maximum height from the data
            var heights = [];
            that.setCartesianAltitudes(cartesian, heights);
            var height = 0.0;
            heights.forEach(function (high) {
                if (height < high)
                    height = high;
            });
            // find the lat-lon limits of the object - init with data far outside the supposed limits
            var lim = { east: -8, west: 8, north: -8, south: 8 };
            var carto = that.ellipsoid.cartesianArrayToCartographicArray(cartesian);
            carto.forEach(function (c) {
                if (lim.north < c.latitude)
                    lim.north = c.latitude;
                if (lim.south > c.latitude)
                    lim.south = c.latitude;
                if (lim.west > c.longitude)
                    lim.west = c.longitude;
                if (lim.east < c.longitude)
                    lim.east = c.longitude;
            });
            // find the max height over the sampled lat-lon limits
            var n = gridSize;
            var idel = (lim.north - lim.south) / n;
            var jdel = (lim.east - lim.west) / n;
            for (var i = 0; i <= n; i++) {
                var latitude = lim.south + i * idel;
                for (var j = 0; j <= n; j++) {
                    var hi = that.globe.getHeight(new Cesium.Cartographic(lim.west + j * jdel, latitude, 0.0));
                    if (height < hi) {
                        height = hi;
                    }
                }
            }
            for (i = 0; i < cartesian.length; i++)
                heights[i] = height;
            that.setCartesianAltitudes(cartesian, heights);
            return height;
        };
        /**
         * Computes a new map location that is a given arc length (range) and bearing from another map location.
         * @param {Cesium.Cartographic} origin The starting map location for the computation.
         * @param {number} rangeM The arc length (measured in meters).
         * @param {number} bearingRad The bearing (measured clockwise in radians from true north) angle.
         * @returns {Cesium.Cartographic} The new map location at the given range and bearing from the original map location.
         */
        DrawHelperService.prototype.locationRangeBearingToLocation = function (origin, rangeM, bearingRad) {
            var lon1 = origin.longitude;
            var lat1 = origin.latitude;
            var rangeF = rangeM / DrawHelperService.EARTH_RADIUS;
            var lat2 = Math.asin((Math.sin(lat1) * Math.cos(rangeF)) + (Math.cos(lat1) * Math.sin(rangeF) * Math.cos(bearingRad)));
            var lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(rangeF) * Math.cos(lat1), Math.cos(rangeF) - (Math.sin(lat1) * Math.sin(lat2)));
            return new Cesium.Cartographic(lon2, lat2, 0.0);
        };
        /**
         * Finds the maximum height for a grid of points spread out over the given circle.
         * @param {Cesium.Cartesian3} c3 The center of the circle in Cartesian coordinates.
         * @param {number} radiusM The radius of the circle in meters.
         * @param {number} gridSize The number of subintervals making up the grid, horizontally and vertically.
         * @returns {number} The maximum sampled height.
         */
        DrawHelperService.prototype.sampleCircleHeights = function (c3, radiusM, gridSize) {
            var carto = this.ellipsoid.cartesianToCartographic(c3);
            // find the edges
            var edges = [];
            for (var angle = 0.0; angle < 2.0 * Math.PI; angle += Math.PI / 2.0) {
                edges.push(this.locationRangeBearingToLocation(carto, radiusM, angle));
            }
            // sample over the grid
            return this.sampleGridHeights(this.ellipsoid.cartographicArrayToCartesianArray(edges), gridSize);
        };
        DrawHelperService.prototype.scaleExtent = function (extent) {
            return {
                north: extent.north * DrawHelperService.R2D,
                south: extent.south * DrawHelperService.R2D,
                east: extent.east * DrawHelperService.R2D,
                west: extent.west * DrawHelperService.R2D
            };
        };
        DrawHelperService.MIN_HEIGHT = 50.0;
        // ReSharper disable InconsistentNaming
        DrawHelperService.R2D = 180.0 / Math.PI;
        // ReSharper restore InconsistentNaming
        DrawHelperService.EARTH_RADIUS = 6371009; // meters for mean radius per WGS84
        return DrawHelperService;
    })(DrawHelper);
    Services.DrawHelperService = DrawHelperService;
    if (Main && Main.App && Main.App.Services)
        Main.App.Services.service("DrawHelperService", DrawHelperService);
})(Services || (Services = {}));
//# sourceMappingURL=DrawHelperService.js.map