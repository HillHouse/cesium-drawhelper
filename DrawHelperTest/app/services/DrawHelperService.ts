/**
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

/* tslint:disable */
/// <reference path="../../scripts/typings/DrawHelper/DrawHelper.d.ts" />
/// <reference path="../../scripts/typings/cesium/cesium.d.ts" />
/// <reference path="../../scripts/typings/bootbox/bootbox.d.ts" />

module Services {
    // ReSharper disable InconsistentNaming
    declare var Cesium;
    // ReSharper restore InconsistentNaming

    export class DrawHelperService extends DrawHelper {
        private widget: cesium.CesiumWidget;
        private scene: cesium.Scene;
        private globe: cesium.Globe;
        private ellipsoid: cesium.Ellipsoid;
        private localDrawingPrimitives: cesium.PrimitiveCollection;
        private markerBillboards: cesium.BillboardCollection;
        private savedItems: Array<Object>;
        private material = Cesium.Material.fromType(Cesium.Material.ColorType);

        // context menu variables
        private contextMenuActive: boolean = false;

        private static MIN_HEIGHT: number = 50.0;
        // ReSharper disable InconsistentNaming
        private static R2D = 180.0 / Math.PI;
        // ReSharper restore InconsistentNaming
        private static EARTH_RADIUS: number = 6371009; // meters for mean radius per WGS84

        constructor(widget: cesium.CesiumWidget) {
            super(widget);
            this.widget = widget;
            this.scene = widget.scene;
            this.globe = this.scene.globe;
            this.ellipsoid = this.globe.ellipsoid;
            this.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);

            this.initialiseHandlers();
            this.enhancePrimitives();
        }

        public screenToCartesian3(screen: cesium.Cartesian2): cesium.Cartesian3 {
            var pickRay = this.scene.camera.getPickRay(screen);
            var cartesian = this.scene.globe.pick(pickRay, this.scene);
            return (typeof cartesian == "undefined") ? null : cartesian;
        }

        public get drawingPrimitives(): cesium.PrimitiveCollection {
            if (this.localDrawingPrimitives == null ||
                !this.widget.scene.primitives.contains(this.localDrawingPrimitives) ||
                this.localDrawingPrimitives.isDestroyed()) {
                this.localDrawingPrimitives = new Cesium.PrimitiveCollection();
                this.widget.scene.primitives.add(this.localDrawingPrimitives);
            }
            return this.localDrawingPrimitives;
        }

        public getExtentCorners(value: cesium.Rectangle, height: number): Array<cesium.Cartesian3> {
            height = (typeof (height) == "undefined") ? 0.0 : height;
            var corners: Array<cesium.Cartographic> = [];
            corners.push(new Cesium.Cartographic(value.west, value.north, height));
            corners.push(new Cesium.Cartographic(value.east, value.north, height));
            corners.push(new Cesium.Cartographic(value.east, value.south, height));
            corners.push(new Cesium.Cartographic(value.west, value.south, height));
            var ca: Array<cesium.Cartesian3> = this.ellipsoid.cartographicArrayToCartesianArray(corners);
            this.setCartesianAltitudes(ca, [height, height, height, height]);
            return (ca);
        }

        public restoreAll() {
            var that = this;
            bootbox.prompt("Please enter the tag associated with the saved draw tool data:", (result) => {
                if (result === null)
                    return;

                that.savedItems = JSON.parse(localStorage.getItem(result));
                if (that.savedItems === null) {
                    bootbox.alert("Could not find tag '" + result + "' in local storage.<br>Is the browser clearing local storage on exit?");
                    return;
                }

                var dp: cesium.PrimitiveCollection = that.localDrawingPrimitives;
                that.savedItems.forEach((ele: ISerializedPrimitive) => {
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
                            ele.positions.forEach((bb) => {
                                that.createAsBillboard(bb, dp);
                            });
                            break;
                    }
                });
            });
        }

        public saveAll() {
            var that = this;
            bootbox.prompt("Please enter a tag to associate with the draw tool data:", (result) => {
                if (result === null)
                    return;

                that.disableAllEditMode();
                that.disableAllHighlights();
                that.savedItems = [];

                for (var i = 0, len = that.drawingPrimitives.length; i < len; i++) {
                    var ele: any = that.drawingPrimitives.get(i);

                    if (ele instanceof DrawHelper.ExtentPrimitive) {
                        ele = <IExtentPrimitive>ele;
                        that.savedItems.push({ type: "extent", extent: ele.extent, height: ele.height });
                    }
                    else if (ele instanceof DrawHelper.CirclePrimitive) {
                        ele = <ICirclePrimitive>ele;
                        that.savedItems.push({
                            type: "circle", center: ele.center, radius: ele.radius, height: ele.height
                        });
                    }
                    else if (ele instanceof DrawHelper.PolylinePrimitive) {
                        ele = <IPolylinePrimitive>ele;
                        that.savedItems.push({
                            type: "polyline", positions: ele.positions
                        });
                    }
                    else if (ele instanceof DrawHelper.PolygonPrimitive) {
                        ele = <IPolygonPrimitive>ele;
                        that.savedItems.push({
                            type: "polygon", positions: ele.positions, height: ele.height
                        });
                    }
                    else if (ele instanceof Cesium.BillboardCollection && ele.length > 0) {
                        ele = <cesium.BillboardCollection>ele;
                        var bills = [];
                        for (var j = 0, length = ele.length; j < length; j++) {
                            bills.push(ele.get(j).position);
                        }
                        that.savedItems.push({ type: "billboards", positions: bills });
                    }
                }

                localStorage.setItem(result, JSON.stringify(that.savedItems));
            });
        }

        // If there is a value in hi, use it to set the height.
        // Otherwise lookup the height and set it.
        public setCartesianAltitudes(c3: Array<cesium.Cartesian3>, hi?: Array<number>): Array<cesium.Cartesian3> {
            if (c3 == null || c3.length === 0)
                return null;
            var that = this;
            var carto: Array<cesium.Cartographic> = that.ellipsoid.cartesianArrayToCartographicArray(c3, []);
            var gotHeights: boolean = (hi != null && hi.length === c3.length);
            for (var i = 0; i < carto.length; i++) {
                var height = that.globe.getHeight(carto[i]);
                height = (typeof (height) === "undefined") ? DrawHelperService.MIN_HEIGHT : DrawHelperService.MIN_HEIGHT + height;
                if (gotHeights) {
                    carto[i].height = Math.max(height, hi[i]);
                } else {
                    if (carto[i].height < DrawHelperService.MIN_HEIGHT)
                        carto[i].height = height;
                    if (hi != null)
                        hi.push(carto[i].height);
                }
            }
            return that.ellipsoid.cartographicArrayToCartesianArray(carto, c3);
        }

        // This is fairly expensive computationally - don't call the Cesium equalsEpsilon (results are not conistent)
        public cartesianEqualsEpsilon(aIn: cesium.Cartesian3, bIn: cesium.Cartesian3, epsilon: number): boolean {
            // need to compare points without heights
            var aCarto: cesium.Cartographic = this.ellipsoid.cartesianToCartographic(aIn);
            aCarto.height = 0;
            var bCarto: cesium.Cartographic = this.ellipsoid.cartesianToCartographic(bIn);
            bCarto.height = 0;
            var aOut = this.ellipsoid.cartographicToCartesian(aCarto);
            var bOut = this.ellipsoid.cartographicToCartesian(bCarto);

            // Sort of a Manhattan compare
            return Math.abs(aOut.x - bOut.x) <= epsilon &&
                   Math.abs(aOut.y - bOut.y) <= epsilon &&
                   Math.abs(aOut.z - bOut.z) <= epsilon;
        }

        private initialiseContextMenu(scene: cesium.Scene) {
            var that = this;

            // We'll set up a right-click handler just for the draw entities
            var handler = new Cesium.ScreenSpaceEventHandler(that.scene.canvas);
            handler.setInputAction(
                (click) => {
                    var pickedObject = that.scene.pick(click.position);
                    if (Cesium.defined(pickedObject)) {
                        var ele: cesium.Primitive = pickedObject.primitive;
                        if (ele instanceof DrawHelper.ExtentPrimitive ||
                            ele instanceof DrawHelper.CirclePrimitive ||
                            ele instanceof DrawHelper.PolylinePrimitive ||
                            ele instanceof DrawHelper.PolygonPrimitive ||
                            (ele instanceof Cesium.Billboard &&
                            that.markerBillboards.contains(<any>ele))) {
                            that.manageContextMenu(ele, click.position);
                        }
                    }
                },
                Cesium.ScreenSpaceEventType.RIGHT_CLICK
            );
        }

        private manageContextMenu(entity, position) {
            var that = this;
            var cm: HTMLElement = null;
            var cms: MSCSSProperties = null;
            var lis: NodeListOf<HTMLLIElement> = null;
            var listHandler: () => void = null;

            that.contextMenuActive = true;
            that["_tooltip"].setVisible(false);

            // handle clicks outside the context menu - by mostly closing the context menu
            var docHandler = (event) => {
                if (event.target !== cm) {
                    cms.display = "none";
                    that.contextMenuActive = false;
                    document.removeEventListener("click", docHandler);
                }
                for (var j = 0; j < lis.length; j++)
                    lis[j].removeEventListener("click", listHandler);
            };

            // we process the many, many menu items here - one at the time of this comment
            var li: HTMLElement;
            listHandler = () => {
                var bb: boolean = entity instanceof Cesium.Billboard;
                if (!bb)    // we haven't attached any setEditMode to the billboards
                    entity.setEditMode(false);
                switch (li.textContent) {
                    case "Remove":
                        if (bb) {
                            that.markerBillboards.remove(entity);
                        } else {
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
            var html = "<div class='dropdown open'><ul class='dropdown-menu' role='menu'>";     // the header
            html += "<li><a tabindex='-1'>Remove</a></li>";                                     // the menu items
            html += "</ul></div>";                                                              // the footer

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
        }

        private createAsBillboard(position: cesium.Cartesian3, dp: cesium.PrimitiveCollection) {
            var that = this;

            // Create one common billboard collection for all billboarded markers
            if (that.markerBillboards == null ||
                !dp.contains(that.markerBillboards) ||
                that.markerBillboards.isDestroyed()) {
                that.markerBillboards = new Cesium.BillboardCollection();
                dp.add(that.markerBillboards);   // only add once
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
        }

        private createAsPolyline(positions: Array<cesium.Cartesian3>, dp: cesium.PrimitiveCollection) {
            var that = this;

            var polyline = new DrawHelper.PolylinePrimitive({
                positions: positions,
                width: 5,
                geodesic: true
            });
            dp.add(polyline);
            polyline.setEditable();
            that.loggingMessage("Polyline created: " + positions.length + " points");

            polyline.addListener("onEdited", (event) => {
                // Find maximum height for polyline
                var height = that.sampleGridHeights(event.positions, 4);
                var heights: Array<number> = [];
                for (var i = 0, len = event.positions.length; i < len; i++)
                    heights.push(height);
                polyline.positions = that.setCartesianAltitudes(event.positions, heights);
                that.loggingMessage("Polyline edited: " + event.positions.length + " points");

                // This is work-around to deal with the possible reporting of double-clicks as single- + double-clicks.
                // The actual code resets the grab handles on the entity. 
                setTimeout(() => {
                    that.setEdited(polyline);
                    if (that["_editedSurface"])
                        that["_editedSurface"].setEditMode(true);
                }, 250);
            });
        }

        private createAsPolygon(positions: Array<cesium.Cartesian3>, height: number, dp: cesium.PrimitiveCollection) {
            var that = this;
            var polygon = new DrawHelper.PolygonPrimitive({
                positions: positions,
                height: height,
                material: Cesium.Material.fromType("Checkerboard")
//                material: that.material
            });
            dp.add(polygon);
            polygon.setEditable();
            that.loggingMessage("Polygon created: " + positions.length + " points at " + height.toFixed(0) + "m");

            polygon.addListener("onEdited", (event) => {
                polygon.height = that.sampleGridHeights(event.positions, 4);
                that.loggingMessage("Polygon edited: " + event.positions.length + " points at " + polygon.height.toFixed(0) + "m");

                // This is work-around to deal with the possible reporting of double-clicks as single- + double-clicks.
                // The actual code resets the grab handles on the entity. 
                setTimeout(() => {
                    that.setEdited(polygon);
                    if (that["_editedSurface"])
                        that["_editedSurface"].setEditMode(true);
                }, 250);
            });
        }

        private createAsCircle(center: cesium.Cartesian3, radius: number, height: number, dp: cesium.PrimitiveCollection) {
            var that = this;

            var circle: any = new DrawHelper.CirclePrimitive({
                center: center,
                radius: radius,
                height: height,
                material: Cesium.Material.fromType(Cesium.Material.RimLightingType)
//                material: that.material
            });
            dp.add(circle);
            circle.setEditable();
            that.loggingMessage("Circle created: Center " + that.cartesianToString(center) +
                ", Radius " + radius.toFixed(0) + "m" + ", Height " + height.toFixed(0) + "m");

            circle.addListener("onEdited", (event) => {
                circle.height = that.sampleCircleHeights(event.center, event.radius, 4);
                that.loggingMessage("Circle edited: Center " + that.cartesianToString(event.center) +
                    ", Radius " + event.radius.toFixed(0) + "m, Height " + circle.height.toFixed(0) + "m");

            });
        }

        private createAsExtent(rect: cesium.Rectangle, height: number, dp: cesium.PrimitiveCollection) {
            var that = this;
            var extentPrimitive = new DrawHelper.ExtentPrimitive({
                extent: rect,
                height: height,
                material: Cesium.Material.fromType(Cesium.Material.StripeType)
//                material: that.material
            });
            dp.add(extentPrimitive);
            extentPrimitive.setEditable();
            that.loggingMessage("Extent created: " + that.extentToString(rect) + " at " + height.toFixed(0) + "m");

            extentPrimitive.addListener("onEdited", (event) => {
                rect = that.extentToRectangle(event.extent);
                var ca = that.getExtentCorners(rect, extentPrimitive.height);
                extentPrimitive.height = that.sampleGridHeights(ca, 4);
                that.loggingMessage("Extent edited: " + that.extentToString(rect) + " at " + height.toFixed(0) + "m");
            });
        }

        private timeoutId: number;
        private logging = document.getElementById("drawingLogging");
        private loggingMessage(message) {
            var that = this;

            // cancel any old message clearing
            if (that.timeoutId !== 0)
                clearTimeout(that.timeoutId);

            // set the new message
            that.logging.innerHTML = message;

            // set up to clear the new message
            that.timeoutId = setTimeout(() => {
                that.logging.innerHTML = "";
            }, 5000);
        }

        public addListeners() {
            var that = this;

            // we need the primitive collection so we can add stuff
            var dp: cesium.PrimitiveCollection = this.drawingPrimitives;

            var toolbar = this.addToolbar(document.getElementById("drawingToolbar"), {
                buttons: ["marker", /*"freedraw",*/ "polyline", "polygon", "circle", "extent"]
            });

            document.getElementById("drawingLogging").style.display = "inline";

            toolbar.addListener("markerCreated", (event) => {
                this.setCartesianAltitude(event.position);

                that.createAsBillboard(event.position, dp);
            });

            toolbar.addListener("polylineCreated", (event) => {
                // Find maximum height for polyline
                var height = that.sampleGridHeights(event.positions, 4);
                var heights: Array<number> = [];
                for (var i = 0, len = event.positions.length; i < len; i++)
                    heights.push(height);
                that.setCartesianAltitudes(event.positions, heights);

                that.createAsPolyline(event.positions, dp);
            });

            toolbar.addListener("polygonCreated", (event) => {
                // Find maximum height for polygon
                var height = that.sampleGridHeights(event.positions, 4);

                that.createAsPolygon(event.positions, height, dp);
            });

            toolbar.addListener("circleCreated", (event) => {
                var height = that.sampleCircleHeights(event.center, event.radius, 4);
                that.setCartesianAltitude(event.center, [height]);

                that.createAsCircle(event.center, event.radius, height, dp);
            });

            toolbar.addListener("extentCreated", (event) => {
                var rect: cesium.Rectangle = that.extentToRectangle(event.extent);
                var ca: Array<cesium.Cartesian3> = that.getExtentCorners(rect, 0.0);
                var height: number = that.sampleGridHeights(ca, 4);

                that.createAsExtent(rect, height, dp);
            });

        }

        public metersPerPixel(): number {
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
            var pixelSize = camera.frustum.getPixelSize(
                new Cesium.Cartesian2(that.widget.container.clientWidth, that.widget.container.clientHeight),
                distance);
            return pixelSize.x;
        }

        // If there is a value in hi, use it to set the height.
        // Otherwise lookup the height and set it.
        public setCartesianAltitude(c3: cesium.Cartesian3, hi?: Array<number>): cesium.Cartesian3 {
            var that = this;
            var carto: cesium.Cartographic = that.ellipsoid.cartesianToCartographic(c3);
            if (isNaN(carto.height)) {
                carto.height = DrawHelperService.MIN_HEIGHT;
            }
            var height: any = that.scene.globe.getHeight(carto);
            if (isNaN(carto.height)) {
                carto.height = DrawHelperService.MIN_HEIGHT;
            }
            height = (typeof (height) === "undefined") ? DrawHelperService.MIN_HEIGHT : DrawHelperService.MIN_HEIGHT + height;

            var gotHeight: boolean = (hi != null && hi.length > 0);
            if (gotHeight) {
                carto.height = Math.max(carto.height, height, hi[0]);
            } else {
                if (carto.height < height)
                    carto.height = height;
                if (hi != null)
                    hi.push(carto.height);
            }
            return that.ellipsoid.cartographicToCartesian(carto, c3);
        }

        public extentToRectangle(extent: { west: number; south: number; east: number; north: number; }): cesium.Rectangle {
            return new Cesium.Rectangle(extent.west, extent.south, extent.east, extent.north);
        }

        public extentToString(rect: cesium.Rectangle): string {
            return "(N: " + (rect.north * DrawHelperService.R2D).toFixed(5) +
                  ", S: " + (rect.south * DrawHelperService.R2D).toFixed(5) +
                  ", E: " + (rect.east * DrawHelperService.R2D).toFixed(5) +
                  ", W: " + (rect.west * DrawHelperService.R2D).toFixed(5) + ")";
        }

        public cartesianToString(c3: cesium.Cartesian3): string {
            var carto: cesium.Cartographic = this.ellipsoid.cartesianToCartographic(c3);
            return '(' +
                (Math.abs(carto.latitude) * DrawHelperService.R2D).toFixed(5) + ((carto.latitude >= 0) ? "\u00B0N, " : "\u00B0S, ") +
                (Math.abs(carto.longitude) * DrawHelperService.R2D).toFixed(5) + ((carto.longitude >= 0) ? "\u00B0E, " : "\u00B0W, ") +
                (carto.height).toFixed(0) + "m)";
        }

        /**
         * Finds the maximum height for a grid of points overlaid on the provided points.
         * @param {Array<Cesium.Cartesian3>} cartesian An array of points over which to overlay the grid.
         * @param {number} gridSize The number of subintervals making up the grid, horizontally and vertically.
         * @returns {number} The maximum sampled height.
         */
        public sampleGridHeights(cartesian: Array<cesium.Cartesian3>, gridSize: number): number {
            var that = this;

            // get the maximum height from the data
            var heights: Array<number> = [];
            that.setCartesianAltitudes(cartesian, heights);

            var height = 0.0;
            heights.forEach((high: number) => {
                if (height < high)
                    height = high;
            });

            // find the lat-lon limits of the object - init with data far outside the supposed limits
            var lim = { east: -8, west: 8, north: -8, south: 8 };
            var carto = that.ellipsoid.cartesianArrayToCartographicArray(cartesian);
            carto.forEach((c) => {
                if (lim.north < c.latitude) lim.north = c.latitude;
                if (lim.south > c.latitude) lim.south = c.latitude;
                if (lim.west > c.longitude) lim.west = c.longitude;
                if (lim.east < c.longitude) lim.east = c.longitude;
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

            // reset the altitudes on the inputs
            for (i = 0; i < cartesian.length; i++)
                heights[i] = height;
            that.setCartesianAltitudes(cartesian, heights);
            return height;
        }


        /** 
         * Computes a new map location that is a given arc length (range) and bearing from another map location.
         * @param {Cesium.Cartographic} origin The starting map location for the computation.
         * @param {number} rangeM The arc length (measured in meters).
         * @param {number} bearingRad The bearing (measured clockwise in radians from true north) angle.
         * @returns {Cesium.Cartographic} The new map location at the given range and bearing from the original map location.
         */
        public locationRangeBearingToLocation(origin: cesium.Cartographic, rangeM: number, bearingRad: number): cesium.Cartographic {
            var lon1 = origin.longitude;
            var lat1 = origin.latitude;
            var rangeF = rangeM / DrawHelperService.EARTH_RADIUS;

            var lat2 = Math.asin((Math.sin(lat1) * Math.cos(rangeF)) +
                (Math.cos(lat1) * Math.sin(rangeF) * Math.cos(bearingRad)));
            var lon2 = lon1 + Math.atan2(Math.sin(bearingRad) * Math.sin(rangeF) * Math.cos(lat1),
                Math.cos(rangeF) - (Math.sin(lat1) * Math.sin(lat2)));
            return new Cesium.Cartographic(lon2, lat2, 0.0);
        }

        /**
         * Finds the maximum height for a grid of points spread out over the given circle.
         * @param {Cesium.Cartesian3} c3 The center of the circle in Cartesian coordinates.
         * @param {number} radiusM The radius of the circle in meters.
         * @param {number} gridSize The number of subintervals making up the grid, horizontally and vertically.
         * @returns {number} The maximum sampled height.
         */
        public sampleCircleHeights(c3: cesium.Cartesian3, radiusM: number, gridSize: number): number {
            var carto: cesium.Cartographic = this.ellipsoid.cartesianToCartographic(c3);

            // find the edges
            var edges: Array<cesium.Cartographic> = [];
            for (var angle = 0.0; angle < 2.0 * Math.PI; angle += Math.PI / 2.0) {
                edges.push(this.locationRangeBearingToLocation(carto, radiusM, angle));
            }

            // sample over the grid
            return this.sampleGridHeights(this.ellipsoid.cartographicArrayToCartesianArray(edges), gridSize);
        }

        public scaleExtent(extent) {
            return {
                north: extent.north * DrawHelperService.R2D,
                south: extent.south * DrawHelperService.R2D,
                east: extent.east * DrawHelperService.R2D,
                west: extent.west * DrawHelperService.R2D
            }
        }
    }

    if (Main && Main.App && Main.App.Services)
        Main.App.Services.service("DrawHelperService", DrawHelperService);
}