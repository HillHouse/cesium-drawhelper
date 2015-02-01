cesium-drawhelper
================

DrawHelper: A very early stage shape editor for Cesium. Currently limited to 2D and simple shapes.

DrawHelperTest.sln (a Visual Studio 2013 AngularJS/TypeScript solution) extends DrawHelper.js to support 3D drawing. The updated DrawHelper.js is located at DrawHelperTest\scripts\DrawHelper.js.

Cesium version: DrawHelperTest was tested against Cesium v1.5.

License: Apache 2.0. Free for commercial and non-commercial use. See LICENSE.md.

Usage:

Import the DrawHelper.js, DrawHelper.css and /img/ image files into your directory. Add script and css files to your page.

Instantiate a drawHelper passing it the CesiumWidget.

<--
To create and deploy the 3D drawing example, open a version of Visual Studio 2013 (the free version should work). TypeScript 1.4 and WebEssentials should also be installed. You can run from inside Visual Studio against the latest version of either IE or Chrome. To create a deployment package for IIS, right-click on the project DrawHelperTest and choose Publish.... The resulting ZIP file in c:\temp\DrawHelperTest can be installed using IIS' WebDeploy feature.

One goal was to minimize changes to DrawHelper.js with most changes being made in the app\services\DrawHelperService.ts(.js) file.	

New features include the ability to save and restore shapes to a local data store. Elevations for filled shapes are sampled over the shape's region so the shape's elevation may still be below some elevation features.

Using TypeScript, the initialization of the DrawingHelper looks like this in the CzMap class in the app\controllers\MapController.ts file ...
    private createDrawingTools() {
        // start the draw helper to enable shape creation and editing
        var drawHelper = new Services.DrawHelperService(this.Viewer.cesiumWidget);
        drawHelper.addListeners();
    }
-->

You can:
- use the self contained drawing widget by calling the drawHelper.addToolbar(container, options). This will add a drawing toolbar to the specified container. Options are for personalising the display of the shapes. The toolbar issues one creation event per shape created. You can listen to those events by calling the addListener method.
- use the startDrawXXX methods of DrawHelper to create shapes interactively
- enable editing of your primitives (at the moment Billboard, Polygon, ExtentPrimitive, DrawHelper.CirclePrimitive, DrawHelper.EllipsePrimitive and DrawHelper.PolylinePrimitive) by calling their setEditable method.

The toolbar can be customised at creation by passing an option object.

Check the index.html example to get started.

Check the website http://pad.geocento.com/DrawHelper/ for a live version.

Future versions will include shape dragging, scaling and rotation and support for hierarchical polygon editing.
