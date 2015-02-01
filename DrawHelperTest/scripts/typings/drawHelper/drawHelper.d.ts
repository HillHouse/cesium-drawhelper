declare module Services {
    export interface ISerializedPrimitive {
        type: string;
        height?: number;
        extent?: cesium.Rectangle; // { north: number; south: number; east: number; west: number; };
        positions?: Array<cesium.Cartesian3>;
        radius?: number;
        center?: cesium.Cartesian3;
    }

    export interface IPolygonPrimitive {
        positions: Array<cesium.Cartesian3>;
        height: number;
        getGeometry(): cesium.PolygonGeometry;
        getOutlineGeometry(): cesium.PolygonOutlineGeometry;
        setEditable();
        addListener(message: string, event: any);
    }

    export interface IPolylinePrimitive {
        positions: Array<cesium.Cartesian3>;
        width: number;
        geodesic: any;
        getGeometry(): cesium.PolylineGeometry;
        setEditable();
        addListener(message: string, event: any);
    }

    export interface ICirclePrimitive {
        center: cesium.Cartesian3;
        radius: number;
        height: number;
        getGeometry(): cesium.CircleGeometry;
        getOutlineGeometry(): cesium.CircleOutlineGeometry;
        getCircleCartesianCoordinates(granularity): Array<cesium.Cartesian3>;
        setEditable();
        addListener(message: string, event: any);
    }

    export interface IExtentPrimitive {
        extent: { north: number; south: number; east: number; west: number; };
        height: number;
        getGeometry(): cesium.RectangleGeometry;
        getOutlineGeometry(): cesium.RectangleOutlineGeometry;
        setEditable();
        addListener(message: string, event: any);
    }

    export interface IBillboardGroup {
        createBillboard(position, callbacks);
        insertBillboard(index, position, callbacks);
        addBillboard(position, callbacks);
        addBillboards(positions, callbacks);
        updateBillboardsPositions(positions);
        countBillboards();
        getBillboard(index);
        removeBillboard(index);
        remove();
        setOnTop(height: number);
    }
}

declare class BillboardGroup implements Services.IBillboardGroup {
    createBillboard(position, callbacks);
    insertBillboard(index, position, callbacks);
    addBillboard(position, callbacks);
    addBillboards(positions, callbacks);
    updateBillboardsPositions(positions);
    countBillboards();
    getBillboard(index);
    removeBillboard(index);
    remove();
    setOnTop(height: number);    
}

declare class DrawHelper {
    constructor(widget: cesium.CesiumWidget); 
    
    public startDrawingFreedraw(options);
    public startDrawingMarker(options);
    public startDrawingPolygon(options);
    public startDrawingPolyline(options);
    public startDrawingPolyshape(options);
    public startDrawingExtent(options);
    public startDrawingCircle(options);
    public enhancePrimitives();
    public createBillboardGroup(points: Array<cesium.Cartesian3>, options: Object, callbacks: any): any;
    public addToolbar(container: HTMLElement, options?: Object);
    public startDrawing(cleanup: any);
    public stopDrawing();
    public disableAllHighlights();
    public setHighlighted(surface: any);
    public disableAllEditMode();
    public setEdited(surface: any);
    public registerEditableShape(surface: any);
    public initialiseHandlers();
    public muteHandlers(muted: any);
    public setListener(primitive, type, callback);
    public static PolygonPrimitive: new (options: Object) => Services.IPolygonPrimitive;      // really a constructor
    public static CirclePrimitive: new (options: Object) => Services.ICirclePrimitive;
    public static PolylinePrimitive: new (options: Object) => Services.IPolylinePrimitive;
    public static ExtentPrimitive: new (options: Object) => Services.IExtentPrimitive;
}

