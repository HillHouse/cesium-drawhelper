/**
 * Created by thomas on 9/01/14.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * (c) www.geocento.com
 *     www.metaaps.com
 *
 */

var DrawHelper = (function () {

    // constructor
    function _(cesiumWidget) {
        this._scene = cesiumWidget.scene;
        this._tooltip = createTooltip(cesiumWidget.container);
        this._surfaces = [];
    }

    _.prototype.initialiseHandlers = function() {
        var scene = this._scene;
        var _self = this;

        // scene events
        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        // handle this separately because of required contextMenu override
        _self.initialiseContextMenu(scene);

        function callPrimitiveCallback(name, position) {
            if (_self._handlersMuted == true) return;
            var pickedObject = scene.pick(position);
            if (pickedObject && pickedObject.primitive && pickedObject.primitive[name]) {
                pickedObject.primitive[name](position);
            }
        }

        handler.setInputAction(
            function(movement) {
                callPrimitiveCallback('leftClick', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(
            function(movement) {
                callPrimitiveCallback('leftDoubleClick', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        var mouseOutObject;
        handler.setInputAction(
            function(movement) {
                if (_self._handlersMuted == true) return;
                var pickedObject = scene.pick(movement.endPosition);
                if (mouseOutObject && (!pickedObject || mouseOutObject != pickedObject.primitive)) {
                    !(mouseOutObject.isDestroyed && mouseOutObject.isDestroyed()) && mouseOutObject.mouseOut(movement.endPosition);
                    mouseOutObject = null;
                }
                if (pickedObject && pickedObject.primitive) {
                    pickedObject = pickedObject.primitive;
                    if (pickedObject.mouseOut) {
                        mouseOutObject = pickedObject;
                    }
                    if (pickedObject.mouseMove) {
                        pickedObject.mouseMove(movement.endPosition);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(
            function(movement) {
                callPrimitiveCallback('leftUp', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_UP);
        handler.setInputAction(
            function(movement) {
                callPrimitiveCallback('leftDown', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    };

    _.prototype.setListener = function(primitive, type, callback) {
        primitive[type] = callback;
    };

    _.prototype.muteHandlers = function(muted) {
        this._handlersMuted = muted;
    };

    // register event handling for an editable shape
    // shape should implement setEditMode and setHighlighted
    _.prototype.registerEditableShape = function(surface) {
        var _self = this;

        // handlers for interactions
        // highlight polygon when mouse is entering
        setListener(surface, 'mouseMove', function(position) {
            surface.setHighlighted(true);
            if (!surface._editMode && !_self.contextMenuActive) {
                _self._tooltip.showAt(position, "Click to edit this shape<br>Right click for more ...");
            }
        });
        // hide the highlighting when mouse is leaving the polygon
        setListener(surface, 'mouseOut', function( /*position*/) {
            surface.setHighlighted(false);
            _self._tooltip.setVisible(false);
        });
        setListener(surface, 'leftClick', function( /*position*/) {
            surface.setEditMode(true);
        });
        setListener(surface, 'rightClick', function(position) {
            _self.manageContextMenu(surface, position);
        });
    };

    _.prototype.startDrawing = function(cleanUp) {
        // undo any current edit of shapes
        this.disableAllEditMode();
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
        }
        this.editCleanUp = cleanUp;
        this.muteHandlers(true);
    };

    _.prototype.stopDrawing = function() {
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
            this.editCleanUp = null;
        }
        this.muteHandlers(false);
    };

    // make sure only one shape is highlighted at a time
    _.prototype.disableAllHighlights = function() {
        this.setHighlighted(undefined);
    };

    _.prototype.setHighlighted = function(surface) {
        if (this._highlightedSurface && !this._highlightedSurface.isDestroyed() && this._highlightedSurface != surface) {
            this._highlightedSurface.setHighlighted(false);
        }
        this._highlightedSurface = surface;
    };

    _.prototype.disableAllEditMode = function() {
        this.setEdited(undefined);
    };

    _.prototype.setEdited = function(surface) {
        if (this._editedSurface && !this._editedSurface.isDestroyed()) {
            this._editedSurface.setEditMode(false);
        }
        this._editedSurface = surface;
    };

    var material = Cesium.Material.fromType(Cesium.Material.ColorType);
    material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);

    var defaultShapeOptions = {
        ellipsoid: Cesium.Ellipsoid.WGS84,
        textureRotationAngle: 0.0,
        height: 0.0,
        asynchronous: true,
        show: true,
        debugShowBoundingVolume: false
    };

    var defaultSurfaceOptions = copyOptions(defaultShapeOptions, {
        appearance: new Cesium.EllipsoidSurfaceAppearance({
            aboveGround: false
        }),
        material: material,
        granularity: Math.PI / 180.0
    });

    var defaultPolygonOptions = copyOptions(defaultShapeOptions, {});
    var defaultExtentOptions = copyOptions(defaultShapeOptions, {});
    var defaultCircleOptions = copyOptions(defaultShapeOptions, {});
    var defaultEllipseOptions = copyOptions(defaultSurfaceOptions, { rotation: 0 });

    var defaultPolylineOptions = copyOptions(defaultShapeOptions, {
        width: 5,
        geodesic: true,
        granularity: 10000,
        appearance: new Cesium.PolylineMaterialAppearance({
            aboveGround: false
        }),
        material: material
    });

    //var defaultFreedrawOptions = copyOptions(defaultShapeOptions, {
    //    width: 5,
    //    geodesic: true,
    //    granularity: 10000,
    //    appearance: new Cesium.PolylineMaterialAppearance({
    //        aboveGround: false
    //    }),
    //    material: material,
    //    isFreedraw: true
    //});
// ReSharper disable InconsistentNaming
    var ChangeablePrimitive = (function () {
// ReSharper restore InconsistentNaming
        function _() {
        }

        _.prototype.initialiseOptions = function(options) {

            fillOptions(this, options);

            this._ellipsoid = undefined;
            this._granularity = undefined;
            this._height = undefined;
            this._textureRotationAngle = undefined;
            this._id = undefined;

            // set the flags to initiate a first drawing
            this._createPrimitive = true;
            this._primitive = undefined;
            this._outlinePolygon = undefined;

        };

        _.prototype.setAttribute = function (name, value) {
            this[name] = value;
            this._createPrimitive = true;
        };

        _.prototype.getAttribute = function (name) {
            return this[name];
        };

        /**
         * @private
         */
        _.prototype.update = function (context, frameState, commandList) {

            if (!Cesium.defined(this.ellipsoid)) {
                throw new Cesium.DeveloperError('this.ellipsoid must be defined.');
            }

            if (!Cesium.defined(this.appearance)) {
                throw new Cesium.DeveloperError('this.material must be defined.');
            }

            if (this.granularity < 0.0) {
                throw new Cesium.DeveloperError('this.granularity and scene2D/scene3D overrides must be greater than zero.');
            }

            if (!this.show) {
                return;
            }

            if (!this._createPrimitive && (!Cesium.defined(this._primitive))) {
                // No positions/hierarchy to draw
                return;
            }

            if (this._createPrimitive ||
                (this._ellipsoid != this.ellipsoid) ||
                (this._granularity != this.granularity) ||
                (this._height != this.height) ||
                (this._textureRotationAngle != this.textureRotationAngle) ||
                (this._id != this.id)) {

                var geometry = this.getGeometry();
                if (!geometry) {
                    return;
                }

                this._createPrimitive = false;
                this._ellipsoid = this.ellipsoid;
                this._granularity = this.granularity;
                this._height = this.height;
                this._textureRotationAngle = this.textureRotationAngle;
                this._id = this.id;

                this._primitive = this._primitive && this._primitive.destroy();

                this._primitive = new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: geometry,
                        id: this.id,
                        pickPrimitive: this
                    }),
                    appearance: this.appearance,
                    asynchronous: this.asynchronous
                });

                this._outlinePolygon = this._outlinePolygon && this._outlinePolygon.destroy();
                if (this.strokeColor && this.getOutlineGeometry) {
                    // create the highlighting frame
                    this._outlinePolygon = new Cesium.Primitive({
                        geometryInstances: new Cesium.GeometryInstance({
                            geometry: this.getOutlineGeometry(),
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
                            }
                        }),
                        appearance: new Cesium.PerInstanceColorAppearance({
                            flat: true,
                            renderState: {
                                depthTest: {
                                    enabled: true
                                },
                                lineWidth: Math.min(this.strokeWidth || 4.0, context._aliasedLineWidthRange[1])
                            }
                        })
                    });
                }
            }

            var primitive = this._primitive;
            primitive.appearance.material = this.material;
            primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
            primitive.update(context, frameState, commandList);
            this._outlinePolygon && this._outlinePolygon.update(context, frameState, commandList);

        };

        _.prototype.isDestroyed = function () {
            return this._primitive && this._primitive.isDestroyed && this._primitive.isDestroyed();
        };

        _.prototype.destroy = function () {
            this._primitive = this._primitive && this._primitive.destroy();
            return Cesium.destroyObject(this);
        };

        _.prototype.setStrokeStyle = function(strokeColor, strokeWidth) {
            if (!this.strokeColor || !this.strokeColor.equals(strokeColor) || this.strokeWidth != strokeWidth) {
                this._createPrimitive = true;
                this.strokeColor = strokeColor;
                this.strokeWidth = strokeWidth;
            }
        };

        return _;
    })();

    _.ExtentPrimitive = (function () {
        function _(options) {

            if (!Cesium.defined(options.extent)) {
                throw new Cesium.DeveloperError('Extent is required');
            }

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);

            this.setExtent(options.extent);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setExtent = function (extent) {
            this.setAttribute('extent', extent);
        };

        _.prototype.getExtent = function () {
            return this.getAttribute('extent');
        };

        _.prototype.setHeight = function (height) {
            this.setAttribute('height', height);
        };

        _.prototype.getHeight = function () {
            return this.getAttribute('height');
        };

        _.prototype.getGeometry = function () {
            // get new extent geometry
            if (!Cesium.defined(this.extent)) {
                return null;
            }

            return new Cesium.RectangleGeometry({
                rectangle: this.extent,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function() {
            return new Cesium.RectangleOutlineGeometry({
                rectangle: this.extent,
                height: this.height
            });
        };

        return _;
    })();

    _.PolygonPrimitive = (function () {

        function _(options) {

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);

            this.isPolygon = true;
        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setPositions = function (positions) {
            this.setAttribute('positions', positions);
        };

        _.prototype.getPositions = function () {
            return this.getAttribute('positions');
        };

        _.prototype.setHeight = function (height) {
            this.setAttribute('height', height);
        };

        _.prototype.getHeight = function () {
            return this.getAttribute('height');
        };

        _.prototype.getGeometry = function () {
            // get new polygon geometry
            if (!Cesium.defined(this.positions) || this.positions.length < 3) {
                return null;
            }

            return Cesium.PolygonGeometry.fromPositions({
                positions: this.positions,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function() {
            return Cesium.PolygonOutlineGeometry.fromPositions({
                positions: this.getPositions(),
                height: this.getHeight()
            });
        };

        return _;
    })();

    _.CirclePrimitive = (function () {

        function _(options) {

            if (!(Cesium.defined(options.center) && Cesium.defined(options.radius))) {
                throw new Cesium.DeveloperError('Center and radius are required');
            }

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);
            this.setRadius(options.radius);
            this.setHeight(options.height);
        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setCenter = function (center) {
            this.setAttribute('center', center);
        };

        _.prototype.setRadius = function (radius) {
            this.setAttribute('radius', Math.max(0.1, radius));
        };

        _.prototype.getCenter = function () {
            return this.getAttribute('center');
        };

        _.prototype.getRadius = function () {
            return this.getAttribute('radius');
        };

        _.prototype.setHeight = function (height) {
            this.setAttribute('height', height);
        };

        _.prototype.getHeight = function () {
            return this.getAttribute('height');
        };

        _.prototype.getGeometry = function () {
            // get new circle geometry
            if (!(Cesium.defined(this.center) && Cesium.defined(this.radius))) {
                return null;
            }

            return new Cesium.CircleGeometry({
                center: this.center,
                radius: this.radius,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function() {
            // get new circle outline geometry
            return new Cesium.CircleOutlineGeometry({
                center: this.getCenter(),
                radius: this.getRadius(),
                height: this.getHeight()
            });
        };

        return _;
    })();

    _.EllipsePrimitive = (function () {
        function _(options) {

            if (!(Cesium.defined(options.center) && Cesium.defined(options.semiMajorAxis) && Cesium.defined(options.semiMinorAxis))) {
                throw new Cesium.DeveloperError('Center and semi major and semi minor axis are required');
            }

            options = copyOptions(options, defaultEllipseOptions);

            this.initialiseOptions(options);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setCenter = function (center) {
            this.setAttribute('center', center);
        };

        _.prototype.setSemiMajorAxis = function (semiMajorAxis) {
            if (semiMajorAxis < this.getSemiMinorAxis()) return;
            this.setAttribute('semiMajorAxis', semiMajorAxis);
        };

        _.prototype.setSemiMinorAxis = function (semiMinorAxis) {
            if (semiMinorAxis > this.getSemiMajorAxis()) return;
            this.setAttribute('semiMinorAxis', semiMinorAxis);
        };

        _.prototype.setRotation = function (rotation) {
            return this.setAttribute('rotation', rotation);
        };

        _.prototype.getCenter = function () {
            return this.getAttribute('center');
        };

        _.prototype.getSemiMajorAxis = function () {
            return this.getAttribute('semiMajorAxis');
        };

        _.prototype.getSemiMinorAxis = function () {
            return this.getAttribute('semiMinorAxis');
        };

        _.prototype.getRotation = function () {
            return this.getAttribute('rotation');
        };

        _.prototype.setHeight = function (height) {
            this.setAttribute('height', height);
        };

        _.prototype.getHeight = function () {
            return this.getAttribute('height');
        };

        _.prototype.getGeometry = function () {
            // get new ellipse geometry
            if (!(Cesium.defined(this.center) && Cesium.defined(this.semiMajorAxis) && Cesium.defined(this.semiMinorAxis))) {
                return null;
            }

            return new Cesium.EllipseGeometry({
                ellipsoid: this.ellipsoid,
                center: this.center,
                semiMajorAxis: this.semiMajorAxis,
                semiMinorAxis: this.semiMinorAxis,
                rotation: this.rotation,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function() {
            return new Cesium.EllipseOutlineGeometry({
                center: this.getCenter(),
                height: this.getHeight(),
                semiMajorAxis: this.getSemiMajorAxis(),
                semiMinorAxis: this.getSemiMinorAxis(),
                rotation: this.getRotation()
            });
        };

        return _;
    })();

    _.PolylinePrimitive = (function () {

        function _(options) {

            options = copyOptions(options, defaultPolylineOptions);

            this.initialiseOptions(options);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setPositions = function (positions) {
            this.setAttribute('positions', positions);
        };

        _.prototype.setWidth = function (width) {
            this.setAttribute('width', width);
        };

        _.prototype.setGeodesic = function (geodesic) {
            this.setAttribute('geodesic', geodesic);
        };

        _.prototype.getPositions = function () {
            return this.getAttribute('positions');
        };

        _.prototype.getWidth = function () {
            return this.getAttribute('width');
        };

        _.prototype.getGeodesic = function (geodesic) {
            return this.getAttribute('geodesic');
        };

        _.prototype.getGeometry = function() {
            // get new polyline geometry
            if (!Cesium.defined(this.positions) || this.positions.length < 2) {
                return null;
            }

            return new Cesium.PolylineGeometry({
                positions: this.positions,
                width: this.width < 1 ? 1 : this.width,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                ellipsoid: this.ellipsoid
            });
        };

        return _;
    })();

    var defaultBillboard = {
        iconUrl: "./img/dragIcon1.png",
        shiftX: 0,
        shiftY: 0
    };

    var dragBillboard = {
        iconUrl: "./img/dragIcon1.png",
        shiftX: 0,
        shiftY: 0
    };

    var dragHalfBillboard = {
        iconUrl: "./img/dragIconLight1.png",
        shiftX: 0,
        shiftY: 0
    };

    _.prototype.createBillboardGroup = function(points, options, callbacks) {
        var markers = new _.BillboardGroup(this, options);
        if (points != null)
            markers.addBillboards(points, callbacks);
        return markers;
    };

    _.BillboardGroup = function(drawHelper, options) {

        this._drawHelper = drawHelper;
        this._scene = drawHelper._scene;
        this._drawingPrimitives = drawHelper.drawingPrimitives;
        this._options = copyOptions(options, defaultBillboard);

        // create one common billboard collection for all billboards
        this._billboards = new Cesium.BillboardCollection();
        this._drawingPrimitives.add(this._billboards);

        // keep an ordered list of billboards
        this._orderedBillboards = [];
    };

    _.BillboardGroup.prototype.createBillboard = function(position, callbacks) {
        var heights = [];
        this._drawHelper.setCartesianAltitude(position, heights);
        this.height = heights[0];

        var billboard = this._billboards.add({
            show: true,
            position: position,
            pixelOffset: new Cesium.Cartesian2(this._options.shiftX, this._options.shiftY),
            eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            scale: 1.0,
            image: this._options.iconUrl,
            color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
        });

        // if editable
        if (callbacks) {
            var _self = this;
            var screenSpaceCameraController = this._scene.screenSpaceCameraController;

            function enableRotation(enable) {
                screenSpaceCameraController.enableRotate = enable;
            }

            function getIndex() {
                // find index via linear search
                for (var i = 0, len = _self._orderedBillboards.length;
                    i < len && _self._orderedBillboards[i] != billboard;
                    ++i);
                return i;
            }

            if (callbacks.dragHandlers) {
                _self = this;
                setListener(billboard, 'leftDown', function(downPosition) {
                    // TODO - start the drag handlers here
                    // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                    function onDrag(cartesian, mousePosition) {
                        _self._drawHelper.setCartesianAltitude(cartesian, [_self.height]);
                        billboard.position = cartesian;
                        callbacks.dragHandlers.onDrag && callbacks.dragHandlers.onDrag(getIndex(), cartesian, mousePosition);
                    }

                    function onDragEnd(cartesian, mousePosition) {
                        _self._drawHelper.setCartesianAltitude(cartesian, [_self.height]);
                        handler.destroy();
                        enableRotation(true);
                        callbacks.dragHandlers.onDragEnd && callbacks.dragHandlers.onDragEnd(getIndex(), cartesian, mousePosition);
                    }

                    var handler = new Cesium.ScreenSpaceEventHandler(_self._scene.canvas);

                    handler.setInputAction(function(movement) {
                        var cartesian = _self._drawHelper.screenToCartesian3(movement.endPosition);
                        if (cartesian) {
                            onDrag(cartesian, movement.endPosition);
                        } else {
                            onDragEnd(cartesian, movement.endPosition);
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                    handler.setInputAction(function(movement) {
                        onDragEnd(_self._drawHelper.screenToCartesian3(movement.position));
                    }, Cesium.ScreenSpaceEventType.LEFT_UP);

                    enableRotation(false);

                    callbacks.dragHandlers.onDragStart &&
                        callbacks.dragHandlers.onDragStart(getIndex(), _self._drawHelper.screenToCartesian3(downPosition));
                });
            }
            if (callbacks.onDoubleClick) {
                setListener(billboard, 'leftDoubleClick', function( /*ldcPosition*/) {
                    callbacks.onDoubleClick(getIndex());
                });
            }
            if (callbacks.onClick) {
                setListener(billboard, 'leftClick', function( /*lcPosition*/) {
                    callbacks.onClick(getIndex());
                });
            }
            if (callbacks.onRightClick) {
                setListener(billboard, 'rightClick', function( /*rcPosition*/) {
                    callbacks.onRightClick(getIndex());
                });
            }
            if (callbacks.tooltip) {
                setListener(billboard, 'mouseMove', function(mmPosition) {
                    _self._drawHelper._tooltip.showAt(mmPosition, callbacks.tooltip());
                });
                setListener(billboard, 'mouseOut', function( /*moPosition*/) {
                    _self._drawHelper._tooltip.setVisible(false);
                });
            }
        }

        return billboard;
    };

    _.BillboardGroup.prototype.insertBillboard = function(index, position, callbacks) {
        this._orderedBillboards.splice(index, 0, this.createBillboard(position, callbacks));
    };

    _.BillboardGroup.prototype.addBillboard = function(position, callbacks) {
        this._orderedBillboards.push(this.createBillboard(position, callbacks));
    };

    _.BillboardGroup.prototype.addBillboards = function(positions, callbacks) {
        var index = 0;
        for (; index < positions.length; index++) {
            this.addBillboard(positions[index], callbacks);
        }
    };

    _.BillboardGroup.prototype.updateBillboardsPositions = function(positions) {
        var index = 0;
        this._drawHelper.setCartesianAltitudes(positions);
        for (; index < positions.length; index++) {
            this.getBillboard(index).position = positions[index];
        }
    };

    _.BillboardGroup.prototype.countBillboards = function() {
        return this._orderedBillboards.length;
    };

    _.BillboardGroup.prototype.getBillboard = function(index) {
        return this._orderedBillboards[index];
    };

    _.BillboardGroup.prototype.removeBillboard = function(index) {
        this._billboards.remove(this.getBillboard(index));
        this._orderedBillboards.splice(index, 1);
    };

    _.BillboardGroup.prototype.remove = function() {
        // first remove the billboards from the collection of drawing primitives, then empty its own collection
        if (this._billboards) {
            this._billboards.removeAll();
            this._drawingPrimitives.remove(this._billboards);
            this._billboards = null; // this._billboards && this._billboards.destroy();
        }
    };

    _.BillboardGroup.prototype.setOnTop = function(height) {
        // set the minimum heights for these points
        if (typeof (height) != 'undefined') {
            var hi = [height];
            var bills = this._billboards._billboards;
            for (var i = 0; i < bills.length; i++) {
                this._drawHelper.setCartesianAltitude(bills[i].position, hi);
            }
        }
        this._drawingPrimitives.raiseToTop(this._billboards);
    };

    _.prototype.startDrawingMarker = function(optionsIn) {

        var options = copyOptions(optionsIn, defaultBillboard);

        this.startDrawing(
            function() {
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var tooltip = this._tooltip;

        var markers = new _.BillboardGroup(this, options);

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        // Now wait for start
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                var cartesian = _self.screenToCartesian3(movement.position);
                if (cartesian) {
                    // Set the altitude here in case the callback needs it
                    _self.setCartesianAltitude(cartesian);
                    markers.addBillboard(cartesian);
                    _self.stopDrawing();
                    options.callback(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        mouseHandler.setInputAction(function(movement) {
            var position = movement.endPosition;
            if (position != null) {
                var cartesian = _self.screenToCartesian3(position);
                if (cartesian) {
                    _self.setCartesianAltitude(cartesian);
                    tooltip.showAt(position, "Click to add marker at:</br>" + _self.cartesianToString(cartesian));
                } else {
                    tooltip.showAt(position, "Click to add marker");
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    };

    _.prototype.startDrawingPolygon = function(optionsIn) {
        var options = copyOptions(optionsIn, defaultSurfaceOptions);
        this.startDrawingPolyshape(true, options);
    };

    _.prototype.startDrawingPolyline = function(optionsIn) {
        var options = copyOptions(optionsIn, defaultPolylineOptions);
        this.startDrawingPolyshape(false, options);
    };
    //_.prototype.startDrawingFreedraw = function (optionsIn) {
    //    var options = copyOptions(optionsIn, defaultFreedrawOptions);
    //    this.startDrawingFreedraw(options);
    //};
    _.prototype.startDrawingPolyshape = function(isPolygon, options) {

        this.startDrawing(
            function() {
                poly && primitives.remove(poly);
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var primitives = this.drawingPrimitives;
        var tooltip = this._tooltip;

        var minPoints = isPolygon ? 3 : 2;
        var poly;
        if (isPolygon) {
            poly = new DrawHelper.PolygonPrimitive(options);
        } else {
            poly = new DrawHelper.PolylinePrimitive(options);
        }
        poly.asynchronous = false;
        primitives.add(poly);

        var positions = [];
//        var markers = new _.BillboardGroup(this, defaultBillboard);
        var markers = this.createBillboardGroup(null, defaultBillboard);

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        // Now wait for start
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                var cartesian = _self.screenToCartesian3(movement.position);
                if (cartesian) {
                    var goodPoint = true;
                    var heights = [];
                    if (poly.height > 0)
                        heights.push(poly.height);
                    _self.setCartesianAltitude(cartesian, heights);
                    if (poly.height < heights[0])
                        poly.height = heights[0];

                    // first click
                    if (positions.length == 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }

                    var epsilon = 0;
                    if (positions.length >= minPoints) {
                        // what's are three pixels worth?
                        epsilon = 3 * _self.metersPerPixel();

                        // need to compare points without heights
                        var loc = positions.length - 2;
                        if (!_self.cartesianEqualsEpsilon(cartesian, positions[loc], epsilon)) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        } else {
                            goodPoint = false;
                        }
                    }

                    if (goodPoint) {
                        // add new point to polygon
                        // this one will move with the mouse
                        positions.push(cartesian);

                        // add marker at the new position
                        markers.addBillboard(cartesian);
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        mouseHandler.setInputAction(function(movement) {
            var position = movement.endPosition;
            if (position != null) {
                var cartesian = _self.screenToCartesian3(position);
                if (cartesian) {
                    // make sure it is slightly different
                    cartesian.y += (1 + Math.random());
                    var heights = [];
                    if (_self.height > 0)
                        heights.push(_self.height);
                    _self.setCartesianAltitude(cartesian, heights);
                }
                if (positions.length == 0) {
                    tooltip.showAt(position, (cartesian) ?
                        "Click to add first point at:</br>" + _self.cartesianToString(cartesian) :
                        "Click to add first point");
                } else {
                    if (cartesian) {
                        positions.pop();
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }

                        // update marker
                        markers.getBillboard(positions.length - 1).position = cartesian;

                        // show tooltip
                        tooltip.showAt(position, "Click to add point (" + positions.length + ") at:</br>" +
                            _self.cartesianToString(cartesian) +
                            (positions.length > minPoints ? "</br>Double click to finish drawing" : ""));
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        mouseHandler.setInputAction(function(movement) {
            var position = movement.position;
            if (position != null) {
                if (positions.length < minPoints + 2) {
                    return;
                } else {
                    var cartesian = _self.screenToCartesian3(position);
                    if (cartesian) {
                        var heights = [];
                        if (_self.height > 0)
                            heights.push(_self.height);
                        _self.setCartesianAltitude(cartesian, heights);
                        _self.stopDrawing();

                        if (typeof options.callback == 'function') {
                            // remove overlapping ones
                            var index = positions.length - 1;

                            // calculate some epsilon based on the zoom level
                            var epsilon = 3 * _self.metersPerPixel();

                            for (; index > 0 &&
                                    _self.cartesianEqualsEpsilon(positions[index], positions[index - 1], epsilon);
                                index--) {
                            }
                            options.callback(positions.splice(0, index + 1));
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    };

    //_.prototype.startDrawingFreedraw = function (options) {

    //    this.startDrawing(
    //        function () {
    //            poly && primitives.remove(poly);
    //            markers && markers.remove();
    //            mouseHandler && mouseHandler.destroy();
    //            tooltip && tooltip.setVisible(false);
    //        }
    //    );

    //    var _self = this;
    //    var scene = this._scene;
    //    scene.screenSpaceCameraController.enableInputs = false;
    //    var primitives = this.drawingPrimitives;
    //    var tooltip = this._tooltip;

    //    var poly = new DrawHelper.PolylinePrimitive(options);
    //    poly.asynchronous = false;
    //    primitives.add(poly);

    //    var positions = [];
    //    //        var markers = new _.BillboardGroup(this, defaultBillboard);
    //    var markers = this.createBillboardGroup(null, defaultBillboard);

    //    var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    //    var isStarted = false;
    //    var last = new Date();
    //    // Now wait for start
    //    mouseHandler.setInputAction(function (movement) {
    //        isStarted = true;
    //        if (movement.position != null) {
    //            var cartesian = _self.screenToCartesian3(movement.position);
    //            if (cartesian) {
    //                var heights = [];
    //                if (poly.height > 0)
    //                    heights.push(poly.height);
    //                _self.setCartesianAltitude(cartesian, heights);
    //                if (poly.height < heights[0])
    //                    poly.height = heights[0];


    //                positions.push(cartesian.clone());
    //                markers.addBillboard(positions[0]);
    //                // add new point to polygon
    //                // this one will move with the mouse
    //                positions.push(cartesian);

    //                // add marker at the new position
    //                markers.addBillboard(cartesian);
    //            }
    //        }
    //    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    //    mouseHandler.setInputAction(function (movement) {
    //        isStarted = false;
    //        scene.screenSpaceCameraController.enableInputs = true;

    //        _self.stopDrawing();
    //        if (typeof options.callback == 'function') {
    //            // remove overlapping ones
    //            var index = positions.length - 1;

    //            // calculate some epsilon based on the zoom level
    //            var epsilon = 3 * _self.metersPerPixel();

                
    //            options.callback(positions);
    //        }
    //    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    //    mouseHandler.setInputAction(function (movement) {
    //        if (!isStarted) return;
    //        var now = new Date();
    //        last = now;
    //        var position = movement.endPosition;
    //        if (position != null) {
    //            var cartesian = _self.screenToCartesian3(position);
    //            if (cartesian) {
    //                // make sure it is slightly different
    //                cartesian.y += (1 + Math.random());
    //                var heights = [];
    //                if (_self.height > 0)
    //                    heights.push(_self.height);
    //                _self.setCartesianAltitude(cartesian, heights);
    //            }

    //            if (cartesian) {
    //                positions.pop();
    //                positions.push(cartesian.clone());
    //                positions.push(cartesian);
    //                poly.positions = positions;
    //                poly._createPrimitive = true;
    //            }

    //        }
    //    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    //};

    _.prototype.startDrawingExtent = function(optionsIn) {

        var options = copyOptions(optionsIn, defaultSurfaceOptions);

        this.startDrawing(
            function() {
                extent && primitives.remove(extent);
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var primitives = this.drawingPrimitives;
        var tooltip = this._tooltip;

        var firstPoint = null;
        var extent = null;
        var markers = null;

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        function updateExtent(value) {
            if (extent == null) {
                extent = new Cesium.RectanglePrimitive();
                extent.asynchronous = false;
                primitives.add(extent);
            }
            extent.rectangle = value;

            // update the markers
            var corners = _self.getExtentCorners(value, extent.height);

            // set the height
            extent.height = Math.max(extent.height, _self.sampleGridHeights(corners));

            // create if they do not yet exist
            if (markers == null) {
//                markers = new _.BillboardGroup(_self, defaultBillboard);
                //                markers.addBillboards(corners);
                markers = _self.createBillboardGroup(corners, defaultBillboard);
            } else {
                markers.updateBillboardsPositions(corners);
            }
        }

        // Now wait for start
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                var cartesian = _self.screenToCartesian3(movement.position);
                if (cartesian) {
                    _self.setCartesianAltitude(cartesian);
                    if (extent == null) {
                        // create the rectangle
                        firstPoint = _self.ellipsoid.cartesianToCartographic(cartesian);
                        updateExtent(getExtent(firstPoint, firstPoint));
                    } else {
                        _self.stopDrawing();
                        if (typeof options.callback == 'function') {
                            updateExtent(getExtent(firstPoint, _self.ellipsoid.cartesianToCartographic(cartesian)));
                            options.callback(extent.rectangle, extent.height);
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction(function(movement) {
            var position = movement.endPosition;
            if (position != null) {
                var cartesian = _self.screenToCartesian3(position);
                if (cartesian) {
                    var heights = (extent) ? [extent.height] : [];
                    _self.setCartesianAltitude(cartesian, heights);
                }
                if (extent == null) {
                    tooltip.showAt(position, (cartesian) ?
                        "Click to set first extent corner at:</br>" + _self.cartesianToString(cartesian) :
                        "Click to set first extent corner");
                } else {
                    if (cartesian) {
                        var value = getExtent(firstPoint, _self.ellipsoid.cartesianToCartographic(cartesian));
                        updateExtent(value);
                        tooltip.showAt(position, "Second extent corner is now: " + _self.cartesianToString(cartesian) + "</br>Click again to finish drawing");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    };

    _.prototype.startDrawingCircle = function(options) {

        options = copyOptions(options, defaultSurfaceOptions);

        this.startDrawing(
            function cleanUp() {
                circle && primitives.remove(circle);
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var primitives = this.drawingPrimitives;
        var tooltip = this._tooltip;

        var circle = null;
        var markers = null;

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        // Now wait for start
        mouseHandler.setInputAction(function(movement) {
            if (movement.position != null) {
                var cartesian = _self.screenToCartesian3(movement.position);
                if (cartesian) {
                    var heights = [];
                    _self.setCartesianAltitude(cartesian, heights);

                    if (circle == null) {
                        // create the circle
                        circle = new _.CirclePrimitive({
                            center: cartesian,
                            radius: 1,
                            height: heights[0],
                            asynchronous: false,
                            material: options.material
                        });
                        primitives.add(circle);
                        // markers = new _.BillboardGroup(_self, defaultBillboard);
                        // markers.addBillboards([cartesian]);
                        markers = _self.createBillboardGroup([cartesian], defaultBillboard);
                    } else {
                        if (typeof options.callback == 'function') {
                            options.callback(circle.getCenter(), circle.getRadius(), circle.getHeight());
                        }
                        _self.stopDrawing();
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction(function(movement) {
            var position = movement.endPosition;
            if (position != null) {
                var cartesian = _self.screenToCartesian3(position);
                if (circle == null) {
                    if (cartesian) {
                        _self.setCartesianAltitude(cartesian);
                        tooltip.showAt(position, "Click to set circle center at:</br>" + _self.cartesianToString(cartesian));
                    } else {
                        tooltip.showAt(position, "Click to set circle center");
                    }
                } else {
                    if (cartesian) {
                        var heights = [];
                        _self.setCartesianAltitude(cartesian, heights);
                        circle.setHeight(Math.max(heights[0], circle.getHeight()));
                        circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), cartesian));
                        markers.updateBillboardsPositions([cartesian]);
                        tooltip.showAt(position, "Radius is now: " + circle.getRadius().toFixed(0) +
                            "m</br>Click again to finish drawing");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    };

    _.prototype.enhancePrimitives = function() {

        var drawHelper = this;

        Cesium.Billboard.prototype.setEditable = function() {

            if (this._editable) {
                return;
            }

            this._editable = true;
            var billboard = this;
            var _self = this;
            var tooltip = drawHelper._tooltip;

            function enableRotation(enable) {
                drawHelper._scene.screenSpaceCameraController.enableRotate = enable;
            }

            setListener(billboard, 'leftDown', function( /*position*/) {
                // TODO - start the drag handlers here
                // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                function onDrag(cartesian, positionIn) {
                    drawHelper.setCartesianAltitude(cartesian);
                    billboard.position = cartesian;
                    tooltip.showAt(positionIn, "Marker position is now:</br>" + drawHelper.cartesianToString(cartesian));
                    _self.executeListeners({ name: 'drag', positions: cartesian });
                }

                function onDragEnd(cartesian /*, positionIn*/) {
                    drawHelper.setCartesianAltitude(cartesian);
                    handler.destroy();
                    enableRotation(true);
//                    tooltip.showAt(positionIn, "<p>Marker position is now:</p>" + drawHelper.cartesianToString(cartesian));
                    _self.executeListeners({ name: 'dragEnd', positions: cartesian });
                    tooltip.setVisible(false);
                }

                var handler = new Cesium.ScreenSpaceEventHandler(drawHelper._scene.canvas);

                handler.setInputAction(function(movement) {
                    var cartesian = drawHelper.screenToCartesian3(movement.endPosition);
                    if (cartesian) {
                        onDrag(cartesian, movement.endPosition);
                    } else {
                        onDragEnd(cartesian, movement.endPosition);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                handler.setInputAction(function(movement) {
                    onDragEnd(drawHelper.screenToCartesian3(movement.position));
                }, Cesium.ScreenSpaceEventType.LEFT_UP);

                enableRotation(false);

            });

            enhanceWithListeners(billboard);

        };

        function setHighlighted(highlighted) {
            // if no change
            // if already highlighted, the outline polygon will be available
            if (this._highlighted && this._highlighted == highlighted) {
                return;
            }
            // disable if already in edit mode
            if (this._editMode == true) {
                return;
            }
            this._highlighted = highlighted;
            // highlight by creating an outline polygon matching the polygon points
            if (highlighted) {
                // make sure all other shapes are not highlighted
                drawHelper.setHighlighted(this);
                this._strokeColor = this.strokeColor;
                this.setStrokeStyle(Cesium.Color.fromCssColorString('white'), this.strokeWidth);
            } else {
                if (this._strokeColor) {
                    this.setStrokeStyle(this._strokeColor, this.strokeWidth);
                } else {
                    this.setStrokeStyle(undefined, undefined);
                }
            }
        }

        function setEditMode(editMode) {
            // if no change
            if (this._editMode == editMode) {
                return;
            }

            // make sure all other shapes are not in edit mode before starting the editing of this shape
            drawHelper.disableAllHighlights();
            // display markers
            if (editMode) {
                drawHelper.setEdited(this);
                var scene = drawHelper._scene;
                var _self = this;

                // create the markers and handlers for the editing
                if (this._markers == null) {
                    var markers = drawHelper.createBillboardGroup(null, dragBillboard);
                    var editMarkers = drawHelper.createBillboardGroup(null, dragHalfBillboard);

                    // function for updating the edit markers around a certain point
                    function updateHalfMarkers(index, positions) {
                        // update the half markers before and after the index
                        var editIndex = index - 1 < 0 ? positions.length - 1 : index - 1;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(editIndex).position = calculateHalfMarkerPosition(editIndex);
                        }
                        editIndex = index;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(editIndex).position = calculateHalfMarkerPosition(editIndex);
                        }
                    }

                    function onEdited() {
                        _self.executeListeners({ name: 'onEdited', positions: _self.positions });
                    }

                    var handleMarkerChanges = {
                        dragHandlers: {
                            onDrag: function(index, position) {
                                _self.positions[index] = position;
                                updateHalfMarkers(index, _self.positions);
                                _self._createPrimitive = true;
                            },
                            onDragEnd: function( /*index, position*/) {
                                _self._createPrimitive = true;
                                onEdited();
                            }
                        },
                        onDoubleClick: function(index) {
                            if (_self.positions.length < 4) {
                                return;
                            }
                            // remove the point and the corresponding markers
                            _self.positions.splice(index, 1);
                            _self._createPrimitive = true;
                            markers.removeBillboard(index);
                            editMarkers.removeBillboard(index);
                            updateHalfMarkers(index, _self.positions);
                            onEdited();
                        },
                        tooltip: function() {
                            if (_self.positions.length > 3) {
                                return "Double click to remove this point";
                            }
                            return '';
                        }
                    };

                    // add billboards and keep an ordered list of them for the polygon edges
                    markers.addBillboards(_self.positions, handleMarkerChanges);
                    this._markers = markers;

                    function calculateHalfMarkerPosition(index) {
                        var positions = _self.positions;
                        var first = _self.ellipsoid.cartesianToCartographic(positions[index]);
                        var second = _self.ellipsoid.cartesianToCartographic(positions[index < positions.length - 1 ? index + 1 : 0]);

                        // Cesium.EllipsoidGeodesic.interpolateUsingFraction zeros out the heights on its arguments and its return value 
                        var halfMarker = new Cesium.EllipsoidGeodesic(first.clone(), second.clone()).interpolateUsingFraction(0.5);

                        // so now we set the altitude manually
                        halfMarker.height = Math.max(first.height, second.height);
                        return _self.ellipsoid.cartographicToCartesian(halfMarker);
                    }

                    var halfPositions = [];
                    var halfPositionIndex = 0;
                    var length = _self.positions.length + (this.isPolygon ? 0 : -1);
                    for (; halfPositionIndex < length; halfPositionIndex++) {
                        halfPositions.push(calculateHalfMarkerPosition(halfPositionIndex));
                    }
                    var handleEditMarkerChanges = {
                        dragHandlers: {
                            onDragStart: function(index, position) {
                                // add a new position to the polygon but not a new marker yet
                                this.index = index + 1;
                                _self.positions.splice(this.index, 0, position);
                                _self._createPrimitive = true;
                            },
                            onDrag: function(index, position) {
                                _self.positions[this.index] = position;
                                _self._createPrimitive = true;
                            },
                            onDragEnd: function(index, position) {
                                // create new sets of makers for editing
                                markers.insertBillboard(this.index, position, handleMarkerChanges);
                                editMarkers.getBillboard(this.index - 1).position = calculateHalfMarkerPosition(this.index - 1);
                                editMarkers.insertBillboard(this.index, calculateHalfMarkerPosition(this.index), handleEditMarkerChanges);
                                _self._createPrimitive = true;
                                onEdited();
                            }
                        },
                        tooltip: function() {
                            return "Drag to create a new point";
                        }
                    };

                    editMarkers.addBillboards(halfPositions, handleEditMarkerChanges);
                    this._editMarkers = editMarkers;
                    // add a handler for clicking in the globe
                    this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                    this._globeClickhandler.setInputAction(
                        function(movement) {
                            var pickedObject = scene.pick(movement.position);
                            if (!(pickedObject && pickedObject.primitive)) {
                                _self.setEditMode(false);
                            }
                        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                    // set on top of the polygon
                    markers.setOnTop(_self.height);
                    editMarkers.setOnTop(_self.height);
                }
                this._editMode = true;
            } else {
                if (this._markers != null) {
                    this._markers.remove();
                    this._editMarkers.remove();
                    this._markers = null;
                    this._editMarkers = null;
                    this._globeClickhandler.destroy();
                }
                this._editMode = false;
            }

        }

        DrawHelper.PolylinePrimitive.prototype.setEditable = function() {

            if (this.setEditMode) {
                return;
            }

            var polyline = this;
            polyline.isPolygon = false;
            polyline.asynchronous = false;

            drawHelper.registerEditableShape(polyline);

            polyline.setEditMode = setEditMode;

            var originalWidth = this.width;

            polyline.setHighlighted = function(highlighted) {
                // disable if already in edit mode
                if (this._editMode == true) {
                    return;
                }
                if (highlighted) {
                    drawHelper.setHighlighted(this);
                    this.setWidth(originalWidth * 2);
                } else {
                    this.setWidth(originalWidth);
                }
            };

            polyline.getExtent = function() {
                return Cesium.Extent.fromCartographicArray(drawHelper.scene.ellipsoid.cartesianArrayToCartographicArray(this.positions));
            };

            enhanceWithListeners(polyline);

            polyline.setEditMode(false);

        };

        DrawHelper.PolygonPrimitive.prototype.setEditable = function() {

            if (this.setEditMode) {
                return;
            }

            var polygon = this;
            polygon.asynchronous = false;

            drawHelper.registerEditableShape(polygon);

            polygon.setEditMode = setEditMode;

            polygon.setHighlighted = setHighlighted;

            enhanceWithListeners(polygon);

            polygon.setEditMode(false);

        };

        DrawHelper.ExtentPrimitive.prototype.setEditable = function() {

            if (this.setEditMode) {
                return;
            }

            var extent = this;
            var scene = drawHelper._scene;
            var tt = drawHelper._tooltip;

            drawHelper.registerEditableShape(extent);
            extent.asynchronous = false;

            extent.setEditMode = function(editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        // var markers = new _.BillboardGroup(drawHelper, dragBillboard);
                        var markers = drawHelper.createBillboardGroup(null, dragBillboard);

                        function onEdited() {
                            extent.executeListeners({ name: 'onEdited', extent: extent.extent, height: extent.height });
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function(index, cartesian, mousePosition) {
                                    var corner = markers.getBillboard((index + 2) % 4).position;
                                    extent.setExtent(getExtent(
                                        drawHelper.ellipsoid.cartesianToCartographic(corner),
                                        drawHelper.ellipsoid.cartesianToCartographic(cartesian)));
                                    markers.updateBillboardsPositions(drawHelper.getExtentCorners(extent.extent, extent.height));
                                    tt.showAt(mousePosition, 'Corner is now:</br>' + drawHelper.cartesianToString(cartesian));
                                },
                                onDragEnd: function( /*index, cartesian, mousePosition*/) {
                                    onEdited();
                                    markers.updateBillboardsPositions(drawHelper.getExtentCorners(extent.extent, extent.height));
                                    tt.setVisible(false);
                                }
                            },
                            tooltip: function() {
                                return "Drag to change this extent corner";
                            }
                        };
                        markers.addBillboards(drawHelper.getExtentCorners(extent.extent, extent.height), handleMarkerChanges);
                        this._markers = markers;
                        // add a handler for clicking in the globe
                        this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                        this._globeClickhandler.setInputAction(
                            function(movement) {
                                var pickedObject = scene.pick(movement.position);
                                // disable edit if pickedobject is different or not an object
                                if (!(pickedObject && pickedObject.primitive)) {
                                    extent.setEditMode(false);
                                }
                            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                        // set on top of the polygon
                        markers.setOnTop(this.height);
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            };

            extent.setHighlighted = setHighlighted;

            enhanceWithListeners(extent);

            extent.setEditMode(false);

        };

        _.EllipsePrimitive.prototype.setEditable = function() {

            if (this.setEditMode) {
                return;
            }

            var ellipse = this;
            var scene = drawHelper._scene;

            ellipse.asynchronous = false;

            drawHelper.registerEditableShape(ellipse);

            ellipse.setEditMode = function(editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    var _self = this;
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        var markers = drawHelper.createBillboardGroup(null, dragBillboard);

                        function getMarkerPositions() {
                            return Cesium.Shapes.computeEllipseBoundary(drawHelper.ellipsoid, ellipse.getCenter(), ellipse.getSemiMajorAxis(), ellipse.getSemiMinorAxis(), ellipse.getRotation() + Math.PI / 2, Math.PI / 2.0).splice(0, 4);
                        }

                        function onEdited() {
                            ellipse.executeListeners({ name: 'onEdited', center: ellipse.getCenter(), semiMajorAxis: ellipse.getSemiMajorAxis(), semiMinorAxis: ellipse.getSemiMinorAxis(), rotation: 0 });
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function(index, position) {
                                    var distance = Cesium.Cartesian3.distance(ellipse.getCenter(), position);
                                    if (index % 2 == 0) {
                                        ellipse.setSemiMajorAxis(distance);
                                    } else {
                                        ellipse.setSemiMinorAxis(distance);
                                    }
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                },
                                onDragEnd: function( /*index, position*/) {
                                    onEdited();
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                }
                            },
                            tooltip: function() {
                                return "Drag to change the excentricity and radius";
                            }
                        };
                        markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                        this._markers = markers;
                        // add a handler for clicking in the globe
                        this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                        this._globeClickhandler.setInputAction(
                            function(movement) {
                                var pickedObject = scene.pick(movement.position);
                                if (!(pickedObject && pickedObject.primitive)) {
                                    _self.setEditMode(false);
                                }
                            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                        // set on top of the polygon
                        markers.setOnTop(_self.height);
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            }

            ellipse.setHighlighted = setHighlighted;

            enhanceWithListeners(ellipse);

            ellipse.setEditMode(false);
        };

        _.CirclePrimitive.prototype.getCircleCartesianCoordinates = function(granularity) {
            var geometry = Cesium.CircleOutlineGeometry.createGeometry(new Cesium.CircleOutlineGeometry({
                ellipsoid: drawHelper.ellipsoid,
                center: this.getCenter(),
                radius: this.getRadius(),
                height: this.getHeight(),
                granularity: granularity
            }));
            var count = 0, value, values = [];
            for (; count < geometry.attributes.position.values.length; count += 3) {
                value = geometry.attributes.position.values;
                values.push(new Cesium.Cartesian3(value[count], value[count + 1], value[count + 2]));
            }
            return values;
        };

        _.CirclePrimitive.prototype.setEditable = function() {

            if (this.setEditMode) {
                return;
            }

            var circle = this;
            var scene = drawHelper._scene;
            var tt = drawHelper._tooltip;
            circle.asynchronous = false;

            drawHelper.registerEditableShape(circle);

            circle.setEditMode = function(editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    var _self = this;
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        var markers = drawHelper.createBillboardGroup(null, dragBillboard);

                        function getMarkerPositions() {
                            return _self.getCircleCartesianCoordinates(Cesium.Math.PI_OVER_TWO);
                        }

                        function onEdited() {
                            circle.executeListeners({ name: 'onEdited', center: circle.getCenter(), radius: circle.getRadius(), height: circle.getHeight() });
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function(index, cartesian, mousePosition) {
                                    circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), cartesian));
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                    tt.showAt(mousePosition, 'Circle radius is now: ' + circle.getRadius().toFixed(0) + 'm');
                                },
                                onDragEnd: function( /*index, cartesian, mousePosition*/) {
                                    onEdited();
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                    tt.setVisible(false);
                                }
                            },
                            tooltip: function() {
                                return ("Drag to change the radius from: " + circle.getRadius().toFixed(0) + "m");
                            }
                        };
                        markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                        this._markers = markers;
                        // add a handler for clicking in the globe
                        this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                        this._globeClickhandler.setInputAction(
                            function(movement) {
                                var pickedObject = scene.pick(movement.position);
                                if (!(pickedObject && pickedObject.primitive)) {
                                    _self.setEditMode(false);
                                }
                            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                        // set on top of the circle
                        markers.setOnTop(_self.height);
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            };

            circle.setHighlighted = setHighlighted;

            enhanceWithListeners(circle);

            circle.setEditMode(false);
        }
    };

    _.DrawHelperWidget = (function () {

        // constructor
        function _(drawHelper, options) {

            // container must be specified
            if (!(Cesium.defined(options.container))) {
                throw new Cesium.DeveloperError('Container is required');
            }

            var drawOptions = {
                //markerIcon: "black fa fa-map-marker",
                //freedrawIcon: "fa fa-pencil",
                //polylineIcon: "./img/glyphicons_097_vector_path_line.png",
                //polygonIcon: "./img/glyphicons_096_vector_path_polygon.png",
                //circleIcon: "./img/glyphicons_095_vector_path_circle.png",
                //extentIcon: "./img/glyphicons_094_vector_path_square.png",
                //clearIcon: "black fa fa-eraser",
                //saveIcon: "black fa fa-save",
                //restoreIcon: "black fa fa-repeat",

                markerIcon: "./img/glyphicons_242_google_maps.png",
                polylineIcon: "./img/glyphicons_097_vector_path_line.png",
                polygonIcon: "./img/glyphicons_096_vector_path_polygon.png",
                circleIcon: "./img/glyphicons_095_vector_path_circle.png",
                extentIcon: "./img/glyphicons_094_vector_path_square.png",
                clearIcon: "./img/glyphicons_067_cleaning.png",
                saveIcon: "./img/file_save.png",
                restoreIcon: "./img/file_restore.png",

      //          freedrawDrawingOptions: defaultFreedrawOptions,
                polylineDrawingOptions: defaultPolylineOptions,
                polygonDrawingOptions: defaultPolygonOptions,
                extentDrawingOptions: defaultExtentOptions,
                circleDrawingOptions: defaultCircleOptions
            };

            fillOptions(options, drawOptions);

            var _self = this;

            var toolbar = document.createElement('DIV');
            toolbar.className = "btn-group-horizontal";
            toolbar.align = (options && options.container) ? options.container.appendChild(toolbar).align : 'center';

            function addIcon(id, url, title, callback) {
                var buttonDiv = document.createElement('DIV');
                buttonDiv.className = 'btn btn-default';
                buttonDiv.title = title;

                buttonDiv.style.backgroundColor = '#808080';
                buttonDiv.style.opacity = '0.666';
                toolbar.appendChild(buttonDiv);
                buttonDiv.onclick = callback;
                var span = document.createElement('SPAN');
                buttonDiv.appendChild(span);
                var classes = url.split(" ");
                if (classes.length > 1) {
                    span.style.fontSize = "xx-large";
                    span.style.color = "black";
                    for (var idx in classes) {
                        span.classList.add(classes[idx]);
                    }
                }
                else {
                    var image = document.createElement('IMG');
                    image.src = url;
                    span.appendChild(image);
                }

                // Horizontal buttons - no labels
                buttonDiv.style.width = '64px';
                buttonDiv.style.height = '54px';

                ///Vertical buttons with labels
                //buttonDiv.style.textAlign = 'left';
                //var text = document.createTextNode('  ' + id);
                //span.appendChild(text);
                return buttonDiv;
            }

            addIcon('marker', options.markerIcon, 'Click to start drawing a Marker', function() {
                drawHelper.startDrawingMarker({
                    callback: function(position) {
                        _self.executeListeners({ name: 'markerCreated', position: position });
                    }
                });
            });

            //addIcon('freedraw', options.freedrawIcon, 'Click to start free drawing', function () {
            //    drawHelper.startDrawingFreedraw({
            //        callback: function (positions) {
            //            _self.executeListeners({ name: 'polylineCreated', positions: positions });
            //        }
            //    });
            //});

            addIcon('polyline', options.polylineIcon, 'Click to start drawing a Polyline', function() {
                drawHelper.startDrawingPolyline({
                    callback: function(positions) {
                        _self.executeListeners({ name: 'polylineCreated', positions: positions });
                    }
                });
            });

            addIcon('polygon', options.polygonIcon, 'Click to start drawing a Polygon', function() {
                drawHelper.startDrawingPolygon({
                    callback: function(positions) {
                        _self.executeListeners({ name: 'polygonCreated', positions: positions });
                    }
                });
            });

            addIcon('extent', options.extentIcon, 'Click to start drawing an Extent', function() {
                drawHelper.startDrawingExtent({
                    callback: function(extent, height) {
                        _self.executeListeners({ name: 'extentCreated', extent: extent, height: height });
                    }
                });
            });

            // add a divider
            var div = document.createElement('DIV');
            div.className = 'divider';
            toolbar.appendChild(div);
            addIcon('circle', options.circleIcon, 'Click to start drawing a Circle', function() {
                drawHelper.startDrawingCircle({
                    callback: function(center, radius, height) {
                        _self.executeListeners({ name: 'circleCreated', center: center, radius: radius, height: height });
                    }
                });
            });

            addIcon('save', options.saveIcon, 'Save all primitives', function () {
                drawHelper.saveAll();
            });
            addIcon('restore', options.restoreIcon, 'Restore all primitives', function () {
                drawHelper.restoreAll();
            });

            // add a clear button
            addIcon('clear', options.clearIcon, 'Remove all primitives', function () {
                bootbox.confirm("This action is irreversible. Are you sure you wish to proceed?", function (result) {
                    if (result == true)
                        drawHelper.drawingPrimitives.removeAll();
                });
            });

            enhanceWithListeners(this);
        }

        return _;

    })();

    _.prototype.addToolbar = function(container, options) {
        options = copyOptions(options, { container: container });
        return new _.DrawHelperWidget(this, options);
    };

    function getExtent(mn, mx) {
        var e = new Cesium.Rectangle();

        // Re-order so west < east and south < north
        e.west = Math.min(mn.longitude, mx.longitude);
        e.east = Math.max(mn.longitude, mx.longitude);
        e.south = Math.min(mn.latitude, mx.latitude);
        e.north = Math.max(mn.latitude, mx.latitude);

        // Check for approx equal (shouldn't require abs due to re-order)
        var epsilon = Cesium.Math.EPSILON7;

        if ((e.east - e.west) < epsilon) {
            e.east += epsilon * 2.0;
        }

        if ((e.north - e.south) < epsilon) {
            e.north += epsilon * 2.0;
        }

        return e;
    }

    function createTooltip(frameDiv) {

        var tooltip = function(parentDiv) {

            var div = document.createElement('DIV');
            div.className = "twipsy right";

            var arrow = document.createElement('DIV');
            arrow.className = "twipsy-arrow";
            div.appendChild(arrow);

            var title = document.createElement('DIV');
            title.className = "twipsy-inner";
            div.appendChild(title);

            this._div = div;
            this._title = title;

            // add to frame div and display coordinates
            parentDiv.appendChild(div);
        };

        tooltip.prototype.setVisible = function(visible) {
            this._div.style.display = visible ? 'block' : 'none';
        };

        tooltip.prototype.showAt = function(position, message) {
            if (position && message) {
                this.setVisible(true);
                this._title.innerHTML = message;
                this._div.style.left = position.x + 10 + "px";
                this._div.style.top = (position.y - this._div.clientHeight / 2) + "px";
            }
        };

        return new tooltip(frameDiv);
    }

    function clone(from, to) {
        if (from == null || typeof from != "object") return from;
        if (from.constructor != Object && from.constructor != Array) return from;
        if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
            from.constructor == String || from.constructor == Number || from.constructor == Boolean)
            return new from.constructor(from);

        to = to || new from.constructor();

        for (var name in from) {
            to[name] = typeof to[name] == "undefined" ? clone(from[name], null) : to[name];
        }

        return to;
    }

    function fillOptions(options, defaultOptions) {
        options = options || {};
        var option;
        for (option in defaultOptions) {
            if (options[option] == undefined) {
                options[option] = clone(defaultOptions[option]);
            }
        }
    }

    // shallow copy
    function copyOptions(options, defaultOptions) {
        var newOptions = clone(options), option;
        for (option in defaultOptions) {
            if (newOptions[option] == undefined) {
                newOptions[option] = clone(defaultOptions[option]);
            }
        }
        return newOptions;
    }

    function setListener(primitive, type, callback) {
        primitive[type] = callback;
    }

    function enhanceWithListeners(element) {

        element._listeners = {};

        element.addListener = function(name, callback) {
            this._listeners[name] = (this._listeners[name] || []);
            this._listeners[name].push(callback);
            return this._listeners[name].length;
        };

        element.executeListeners = function(event, defaultCallback) {
            if (this._listeners[event.name] && this._listeners[event.name].length > 0) {
                var index = 0;
                for (; index < this._listeners[event.name].length; index++) {
                    this._listeners[event.name][index](event);
                }
            } else {
                if (defaultCallback) {
                    defaultCallback(event);
                }
            }
        };

    }

    return _;
})();

