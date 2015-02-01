///<reference path="../q/Q.d.ts"/>

declare var ko;
declare module cesium {
    export function defined(obj: Object): boolean;

    export class Cartographic {
        height: number;
        latitude: number;
        longitude: number;
        constructor(longitudeRad: number, latitudeRad: number, heightM: number);
        static fromDegrees(longitudeDeg: number, latitudeDeg: number, heightM: number, result?: Cartographic): Cartographic;
        static clone(cartographic: Cartographic, result?: Cartographic): Cartographic;
        static equals(left: Cartographic, right: Cartographic): boolean;
        static equalsEpsilon(left: Cartographic, right: Cartographic, epsilon: number): boolean;
        static toString(cartographic: Cartographic): string;
        static ZERO: Cartographic;
    }

    export class Cartesian4 {
    }

    export class CullingVolume {
        constructor(planes: Array<Cartesian4>);
        getVisibility(boundingVolume: Object) : boolean;
    }

    export interface DataSource {
        changedEvent: Event;
        clock: DataSourceClock;
        entities: EntityCollection;
        errorEvent: Event;
        isLoading: boolean;
        loadingEvent: Event;
        name: string;
        update(time: JulianDate): boolean;
    }
    
    export class Command {
        afterExecute: Event;
        beforeExecute: Event;
        canExecute: boolean;
    }

    export class ToggleButtonViewModel {
        command: Command;
        toggled: boolean;
        tooltip: string;
    }

    export class AnimationViewModel {
        playRealtimeViewModel: ToggleButtonViewModel;
    }

    export class Animation {
        viewModel: AnimationViewModel;
    }

    export class Projection {
    }

    export class GeographicTilingScheme {
        constructor(ellipsoid?: Ellipsoid, rectangle?: Rectangle, zeroLevelTilesX?: number, zereoLevelTilesY?: number);
        ellipsoid: Ellipsoid;
        rectangle: Rectangle;
        projection: Projection;
//        createLevelZeroTiles(): Array<Object>;
        rectangleToNativeRectangle(rectangle: Rectangle, result: Rectangle): Rectangle;
        getNumberOfXTilesAtLevel(level: number);
        getNumberOfYTilesAtLevel(level: number);
        positionToTileXY(position: Cartographic, level: number, result?: Cartesian3): Cartesian3;
        tileXYToRectangle(x: number, y: number, level: number, result?: Rectangle): Rectangle;
        tileXYToNativeRectangle(x: number, y: number, level: number, result?: Rectangle): Rectangle;
    }

    export class CatmullRomSpline {
        constructor(options?: Object);
        firstTangent: Cartesian3;
        lastTangent: Cartesian3;
        points: Cartesian3[];
        times: number[];
        evaluate(time, result?: Cartesian3): Cartesian3;
    }

    export class Label {
        eyeOffset: Cartesian3;
        fillColor: Color;
        font: string;
        horizontalOrigin: HorizontalOrigin;
        id: Object;
        outlineColor: Color;
        outlineWidth: number;
        pixelOffset: Cartesian2;    // now from top-left corner
        pixelOffsetScaleByDistance: NearFarScalar;
        position: Cartesian3;
        scale: number;
        show: boolean;
        style: LabelStyle;
        text: string;
        translucencyByDistance: NearFarScalar;
        verticalOrigin: VerticalOrigin;
        computeScreenSpacePosition(scene: Scene): Cartesian2;
        equals(other: Label): boolean;
        isDestroyed(): boolean;
    }

    export class LabelCollection {
        constructor(options?: Object);
        length: number;
        add(options?: Object): Label;
        contains(label: Label): boolean;
        destroy(): void;
        get(index: number): Label;
        isDestroyed(): boolean;
        remove(label: Label): boolean;
        removeAll(): void;
    }

    export class Credit {
        constructor(text?: string, imageUrl?: string, link?: string);
        imageUrl: string;
        link: string;
        text: string;
        equals(credit: Credit): boolean;
    }

    export class TileDiscardPolicy {
        isReady(): boolean;
        shouldDiscardImage(image: Q.Promise<HTMLImageElement>): boolean;
    }

    export class Proxy {
    }

    export interface SingleTileImageryProvider {
        // constructor(url: string, rectangle?: Rectangle, credit?: Credit, proxy?: Proxy);

        // From ImageryProvider
        credit: Credit;
        defaultAlpha: number;
        defaultBrightness: number;
        defaultContrast: number;
        defaultGamma: number;
        defaultHue: number;
        defaultSaturation: number;
        errorEvent: Event;
        maximumLevel: number;
        minimumLevel: number;
        proxy: Proxy;
        ready: boolean;
        rectangle: Rectangle;
        tileDiscardPolicy: TileDiscardPolicy;
        tileHeight: number;
        tileWidth: number;
        tilingScheme: TilingScheme;
        getTileCredits(x: number, y: number, level: number): Credit[];
        requestImage(x: number, y: number, level: number): Q.Promise<HTMLImageElement>;

        // The only addition to ImageryProvider
        url: string;
    }

    export class JulianDate {
        static toDate(julianDate: JulianDate): Date;
        static fromDate(date: Date, result?: JulianDate): JulianDate;
    }

    export class CzmlDataSource implements DataSource {
        constructor(name: string);
        static updaters: Array<any>;
        changedEvent: Event;
        clock: DataSourceClock;
        entities: EntityCollection;
        errorEvent: Event;
        isLoading: boolean;
        loadingEvent: Event;
        name: string;
        static processMaterialPacketData(object: Object, proeprtyName: string, packetData: Object, interval: TimeInterval, sourceUri: string, entityCollection: EntityCollection);
        static processPacketData(type: Function, object: Object, propertyName: string, packetData: Object);
        static processPositionPacketData(object: Object, propertyName: string, packetData: Object, interval: TimeInterval, sourceUri: string, entityCollection: EntityCollection);
        load(czml: Object, source: string);
        loadUrl(url: string): Q.Promise<void>;
        process(czml: Object, sourceUri: string);
        processUrl(url: string): Q.Promise<void>;
        update(time: JulianDate): boolean;
    }

    export class GeoJsonDataSource implements DataSource {
        constructor(name: string);
        static crsLinkHrefs: Object;
        static crsLinkTypes: Object;
        static crsName: Object;
        static fill: Color;
        static markerColor: Color;
        static markerSize: number;
        static markerSymbol: string;
        static stroke: Color;
        static strokeWidth: number;
        changedEvent: Event;
        clock: DataSourceClock;
        entities: EntityCollection;
        errorEvent: Event;
        isLoading: boolean;
        loadingEvent: Event;
        name: string;
        static fromUrl(url: Object, options: GeoJsonDataSourceOptions): GeoJsonDataSource;
        loadUrl(url: string, options: GeoJsonDataSourceOptions): Q.Promise<void>;
        load(geoJson: Object, options: GeoJsonDataSourceOptions): Q.Promise<void>;
        update(time: JulianDate): boolean;
    }

    export interface GeoJsonDataSourceOptions {
        sourceUri?: string;
        markerSize?: number;
        markerSymbol?: string;
        markerColor?: Color;
        stroke?: Color;
        strokeWidth?: number;
        fill?: Color;
    }

    export class EntityCollection {
        constructor();
        collectionChanged: Event; // readonly
        entities: Array<Entity>; // readonly
        id: string; // readonly
        static collectionChangedEventCallback(collection: EntityCollection, added: Array<Entity>, removed: Array<Entity>, changed: Array<Entity>);
        add(entity: Entity);
        computeAvailability(): TimeInterval;
        getById(id: Object): Entity;
        getOrCreateEntity(id: Object): Entity;
        remove(entity: Entity): boolean;
        removeAll();
        removeById(id: Object): boolean;
        resumeEvent();
        suspendEvents();
    }

    export class TimeInterval {
        constructor(options: TimeIntervalOptions);
        static EMPTY: TimeInterval;
        data: Object;
        isEmpty: boolean; // readonly
        isStartIncluded: boolean;
        isStopIncluded: boolean;
        start: JulianDate;
        stop: JulianDate;
        static clone(timeInterval: TimeInterval, result: TimeInterval): TimeInterval;
        static contains(timeInterval: TimeInterval, julianDate: JulianDate): boolean;
        static equals(left: TimeInterval, right: TimeInterval, dataComparer: TimeInterval.DataComparer);
        static equalsEpsilon(left: TimeInterval, right: TimeInterval, epsilon: number, dataComparer: TimeInterval.DataComparer): boolean;
        static fromIso8601(options: Object, result: TimeInterval): TimeInterval;
        static intersect(left: TimeInterval, right: TimeInterval, result: TimeInterval, mergeCallback: TimeInterval.MergeCallback): TimeInterval;
        static toIso8601(timeInterval: TimeInterval, precision: number): string;
        clone(result: TimeInterval): TimeInterval;
        equals(right: TimeInterval, dataComparer: TimeInterval.DataComparer): boolean;
        equalsEpsilon(right: TimeInterval, epsilon: number, dataComparer: TimeInterval.DataComparer): boolean;
        toString(): string;
    }

    export module TimeInterval {
        export interface DataComparer {
            (leftData: Object, rightData: Object): boolean;
        }

        export interface MergeCallback {
            (leftData: Object, rightData: Object): Object;
        }
    }

    export interface TimeIntervalOptions {
        start?: JulianDate;
        stop?: JulianDate;
        isStartIncluded?: boolean;
        isStopIncluded?: boolean;
        data?: Object;
    }

    export class Entity {
        constructor(id: string);
        availability: TimeIntervalCollection;
        billboard: BillboardGraphics;
        box: BoxGraphics;
        cylinder: CylinderGraphics;
        corridor: CorridorGraphics;
        definitionChanged: Event; // readonly
        description: Property;
        ellipse: EllipseGraphics;
        ellipsoid: EllipsoidGraphics;
        id: string;
        label: LabelGraphics;
        model: LabelGraphics;
        name: string;
        orientation: Property;
        parent: Entity;
        path: PathGraphics;
        point: PointGraphics;
        polygon: PolygonGraphics;
        polyline: PolylineGraphics;
        position: PositionProperty;
        propertyNames: Event;
        rectangle: RectangleGraphics;
        viewFrom: Cartesian3;
        wall: WallGraphics;
        addProperty(propertyName: string);
        isAvailable(time: JulianDate);
        merge(source: Entity);
        removeProperty(propertyName: string);
    }

    export interface PositionProperty {
        definitionChanged: Event; // readonly
        equals: boolean;
        isConstant: boolean; // readonly
        referenceFrame: ReferenceFrame;
        getValue(time: JulianDate, result: Cartesian3): Cartesian3;
        getValueInReferenceFrame(time: JulianDate, referenceFrame: ReferenceFrame, result: Cartesian3): Cartesian3;
    }

    export class ReferenceFrame {
        static FIXED: number;
        static INERTIAL: number;
    }

    export class CylinderGraphics extends FillGraphics<CylinderGraphics> {
        bottomRadius: Property;
        length: Property;
        numberOfVerticalLines: Property;
        slices: Property;
        topRadius: Property;
    }

    export class CorridorGraphics extends FillGraphics<CorridorGraphics> {
        cornerType: Property;
        extrudedHeight: Property;
        granularity: Property;
        positions: Property;
        width: Property;
    }

    export class BoxGraphics extends FillGraphics<BoxGraphics> {
        dimensions: Property;
    }

    export class OutlineGraphics<T> extends Graphics<T> {
        outlineColor: Property;
        outlineWidth: Property;
    }

    export class FillGraphics<T> extends OutlineGraphics<T> {
        fill: Property;
        material: MaterialProperty;
        outline: Property;
    }

    export class WallGraphics extends FillGraphics<WallGraphics> {
        granularity: Property;
        maximumHeights: Property;
        minimumHeights: Property;
        positions: Property;
    }

    export class RectangleGraphics extends FillGraphics<RectangleGraphics> {
        constructor();
        closeBottom: Property;
        closeTop: Property;
        coordinates: Property;
        extrudedHeight: Property;
        granularity: Property;
        height: Property;
        rotation: Property;
        stRotation: Property;
    }

    export class PolygonGraphics extends FillGraphics<PolygonGraphics> {
        constructor();
        extrudedHeight: Property;
        granularity: Property;
        height: Property;
        perPositionHeight: Property;
        positions: Property;
        stRotation: Property;
    }

    export class EllipseGraphics extends FillGraphics<EllipseGraphics> {
        constructor();
        extrudedHeight: Property;
        granularity: Property;
        height: Property;
        numberOfVerticalLines: Property;
        rotation: Property;
        semiMajorAxis: Property;
        semiMinorAxis: Property;
        stRotation: Property;
    }

    export class EllipsoidGraphics extends FillGraphics<EllipsoidGraphics> {
        radii: Property;
        slicePartitions: Property;
        stackPartitions: Property;
        subdivisions: Property;
    }

    export class PolylineGraphics extends Graphics<PolylineGraphics> {
        constructor();
        followSurface: Property;
        granularity: Property;
        material: MaterialProperty;
        positions: Property;
        width: Property;
    }

    export class PointGraphics extends OutlineGraphics<PointGraphics> {
        constructor();
        color: Property;
        pixelSize: Property;
        scaleByDistance: Property;
    }

    export class PathGraphics extends Graphics<PathGraphics> {
        constructor();
        leadTime: Property;
        material: MaterialProperty;
        resolution: Property;
        traiTime: Property;
        width: Property;
    }

    export class Graphics<T> {
        definitionChanged: Event; //readonly
        show: Property;
        clone(result: T): T;
        merge(source: T);
    }

    export class LabelGraphics extends OutlineGraphics<LabelGraphics> {
        constructor();
        eyeOffset: Property;
        fillColor: Property;
        font: Property;
        horizontalOrigin: Property;
        pixelOffset: Property;
        pixelOffsetScaleByDistance: Property;
        scale: Property;
        style: Property;
        text: Property;
        translucencyByDistance: Property;
        verticalOrigin: Property;
    }

    export interface MaterialProperty extends Property {
        getType(time: JulianDate): string;
    }

    export class BillboardGraphics extends Graphics<BillboardGraphics> {
        constructor();
        alignedAxis: Property;
        color: Property;
        eyeOffset: Property;
        height: Property;
        horizontalOrigin: Property;
        image: Property;
        pixelOffset: Property;
        pixelOffsetScaleByDistance: Property;
        rotation: Property;
        scale: Property;
        scaleByDistance: Property;
        translucencyByDistance: Property;
        verticalOrigin: Property;
        width: Property;
    }

    export interface Property {
        definitionChanged: Event; // readonly
        isConstant: boolean; // readonly
        equals(other: Property): boolean;
        getValue(time: JulianDate, result: Object): Object;
    }

    export class TimeIntervalCollection {
        constructor();
        changedEvent: Event; //readonly
        isEmpty: boolean; //readonly
        isStartIncluded: boolean; //readonly
        isStopIncluded: boolean; //readonly
        length: number; //readonly
        start: JulianDate; //readonly
        stop: JulianDate; //readonly
        addInterval(interval: TimeInterval, dataComparer: TimeInterval.DataComparer);
        contains(julianDate: JulianDate): boolean;
        equals(right: TimeIntervalCollection, dataDomparer: TimeInterval.DataComparer): boolean;
        findDataForIntervalContainingDate(date: JulianDate): Object;
        findInterval(optinos): TimeInterval;
        findIntervalContainingDate(date: JulianDate): TimeInterval;
        get(index: number): TimeInterval;
        indexOf(date: JulianDate): number;
        intersect(other: TimeIntervalCollection, dateComparer: TimeInterval.DataComparer, mergeCallback: TimeInterval.MergeCallback): TimeIntervalCollection;
        removeAll();
        removeInterval(interval: TimeInterval): boolean;
    }

    export class DataSourceClock {
        constructor();
        clockRange: ClockRange;
        clockStep: ClockStep;
        currentTime: JulianDate;
        definitionChanged: Event; // readonly
        multiplier: number;
        startTime: JulianDate;
        stopTime: JulianDate;
        clone(result: DataSourceClock): DataSourceClock;
        equals(other: DataSourceClock): boolean;
        getValue(): Clock;
        merge(source: DataSourceClock);
    }

    export class ClockRange {
        static CLAMPED: number;
        static LOOP_STOP: number;
        static UNBOUNDED: number;
    }

    export class ClockStep {
        static SYSTEM_CLOCK: number;
        static SYSTEM_CLOCK_MULTIPLIER: number;
        static TICK_DEPENDENT: number;
    }

    export class DataSourceCollection {
        length: number;
        removeAll(destroy?: boolean);
        add(dataSource: DataSource);
        remove(dataSource: DataSource, destroy?: boolean): boolean;
        get(index: number): DataSource;
    }

    export class HorizontalOrigin {
    }

    export class NearFarScalar {
    }

    export class LabelStyle {
    }

    export class Texture {
        width: number;
        height: number;
        copyFrom(source: Object, xOffset?: number, yOffset?: number);
        destroy();
        isDestroyed(): boolean;
    }

    export class RectangleGeometry {
        constructor(options?: Object);
        static createGeometry(rect: RectangleGeometry): Geometry;
    }

    export class RectangleOutlineGeometry {
        constructor(options?: Object);
        static createGeometry(rect: RectangleOutlineGeometry): Geometry;
    }

    export class CircleOutlineGeometry {
        constructor(options?: Object);
        static createGeometry(circle: CircleOutlineGeometry): Geometry;
    }

    export class EllipseOutlineGeometry {
        constructor(options?: Object);
        static createGeometry(ellipse: EllipseOutlineGeometry): Geometry;
    }

    export class Spherical {
    }

    export class Cartesian3 {
        constructor(x?: number, y?: number, z?: number);
        x: number;
        y: number;
        z: number;

        clone(result?: Cartesian3): Cartesian3;
        equals(right?: Cartesian3): boolean;
        equalsEpsilon(right: Cartesian3, epsilon: number): boolean;
        toString(): string;

        static abs(cartesian: Cartesian3, result: Cartesian3): Cartesian3;
        static add(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3;
        static angleBetween(left: Cartesian3, right: Cartesian3): number;
        static clone(cartesian: Cartesian3, result: Cartesian3): Cartesian3;
        static cross(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3;
        static distance(left: Cartesian3, right: Cartesian3): number;
        static distanceSquared(left: Cartesian3, right: Cartesian3): number;
        static divideByScalar(cartesian: Cartesian3, scalar, result: Cartesian3): Cartesian3;
        static dot(left: Cartesian3, right: Cartesian3): number;
        static equals(left: Cartesian3, right: Cartesian3): boolean;
        static equalsEpsilon(left: Cartesian3, right: Cartesian3, epsilon: number): boolean;

        static fromArray(array: Array<number>, startingIndex?: number, result?: Cartesian3): Cartesian3;
        static fromCartesian4(cartesian: Cartesian4, result: Cartesian3): Cartesian3;
        static fromSpherical(spherical: Spherical, result?: Cartesian3): Cartesian3;
        static fromDegrees(longitude: number, latitude: number, height?: number, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3;
        static fromDegreesArray(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>;
        static fromDegreesArrayHeights(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>;
        static fromElements(x: number, y: number, z: number, result?: Cartesian3): Cartesian3;
        static fromRadians(longitude: number, latitude: number, height?: number, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3;
        static fromRadiansArray(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>;
        static fromRadiansArrayHeights(coordinates: Array<number>, ellipsoid?: Ellipsoid, result?: Array<Cartesian3>): Array<Cartesian3>;

        static maximumByComponent(first: Cartesian3, second: Cartesian3, result: Cartesian3): Cartesian3;
        static maximumComponent(cartesian: Cartesian3): number;
        static minimumByComponent(first: Cartesian3, second: Cartesian3, result: Cartesian3): Cartesian3;
        static minimumComponent(cartesian: Cartesian3): number;
        static lerp(start: number, end: number, t: number, result: Cartesian3): Cartesian3;
        static magnitude(cartesian: Cartesian3): number;
        static magnitudeSquared(cartesian: Cartesian3): number;
        static mostOrthogonalAxis(cartesian: Cartesian3, result: Cartesian3): Cartesian3;
        static multiplyByScalar(cartesian: Cartesian3, scalar, result: Cartesian3): Cartesian3;
        static multiplyComponents(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3;
        static negate(cartesian: Cartesian3, result: Cartesian3): Cartesian3;
        static normalize(cartesian: Cartesian3, result: Cartesian3): Cartesian3;
        static pack(value: Cartesian3, array: number[], startingIndex: number);
        static subtract(left: Cartesian3, right: Cartesian3, result: Cartesian3): Cartesian3;
        static unpack(array: number[], startingIndex: number, result: Cartesian3): Cartesian3;
        static packedLength: number;
        static UNIT_X: Cartesian3;
        static UNIT_Y: Cartesian3;
        static UNIT_Z: Cartesian3;
        static ZERO: Cartesian3;
    }

    export enum VerticalOrigin {
        TOP, // = -1,
        CENTER, // = 0,
        BOTTOM // = 1
    }

    export class Billboard {
        equals(other: Billboard): boolean;

        alignedAxis: Cartesian3;
        color: Object;
        eyeOffset: Cartesian3;
        height: number;
        horizontalOrigin: HorizontalOrigin;
        id: Object;
        image: string;
        pixelOffset: Cartesian2;    // now from top-left corner
        position: Cartesian3;
        ready: boolean;
        rotation: number;
        scale: number;
        setImage(id: string, image: any);
        show: boolean;
        verticalOrigin: VerticalOrigin;
        width: number;
        computeScreenSpacePosition(scene: Scene): Cartesian2;
        setEditable();
    }

    //export class TextureAtlas {
    //    addImage(image: any);
    //}

    export class BillboardCollection {
        constructor();
        add(obj?: Object): Billboard;
        contains(billboard: Billboard): boolean;
        destroy(): any;
        get(index: number): Billboard;
        length: number;
        isDestroyed(): boolean;
        remove(billboard: Billboard): boolean;
        removeAll();
        //textureAtlas: TextureAtlas;
    }

    export class PolylineCollection {
        constructor(options?: PolylineCollectionOptions);
        debugShowBoundingVolume: boolean;
        length: number;
        modelMatrix: Matrix4;
        add(template?: Object): Polyline;
        contains(poly: Polyline): boolean;
        destroy();
        get(index: number): Polyline;
        isDestroyed(): boolean;
        remove(poly: Polyline): boolean;
        removeAll();
    }

    export interface PolylineCollectionOptions {
        modelMatrix?: Matrix4;
        debugShowBoundingVolume?: boolean;
    }

    export class Polyline {
        constructor(positions: Cartesian3[]);
        id: Object;
        loop: boolean;
        material: Material;
        positions: Cartesian3[];
        show: boolean;
        width: number;
    }

    export class Appearance {
        material: Material;
    }

    export class EllipsoidSurfaceAppearance {
        constructor(options?: Object);
    }

    export class MaterialAppearance extends Appearance {
        faceForward: boolean;
    }

    export class Matrix4 {
        constructor(
            column0Row0?: number, column1Row0?: number, column2Row0?: number, column3Row0?: number,
            column0Row1?: number, column1Row1?: number, column2Row1?: number, column3Row1?: number,
            column0Row2?: number, column1Row2?: number, column2Row2?: number, column3Row2?: number,
            column0Row3?: number, column1Row3?: number, column2Row3?: number, column3Row3?: number);
        clone(m: Matrix4): Matrix4;
        equals(r: Matrix4): boolean;
        /// BEGIN Manual modification
        static clone(m: Matrix4, r?: Matrix4): Matrix4;
        /// END
    }

    export class Primitive {
        constructor(options);
        allowPicking: boolean;
        appearance: Appearance;
        asynchronous: boolean;
        compressVertices: boolean;
        cull: boolean;
        debugShowBoundingVolume: boolean;
        geometryInstances: Array<GeometryInstance>;
        interleave: boolean; // readonly
        modelMatrix: Object;
        ready: boolean; // readonly
        releaseGeometryInstances: boolean;
        show: boolean;
        vertexCacheOptimize: boolean; // readonly
        destroy();
        getGeometryInstanceAttributes(id: Object): GeometryInstance;
        isDestroyed(): boolean;
        update();
    }

    export class PrimitiveType {
        static LINE_LOOP: number;
        static LINE_STRIP: number;
        static LINES: number;
        static POINTS: number;
        static TRIANGLE_FAN: number;
        static TRIANGLE_STRIP: number;
        static TRIANGLES: number;
    }

    export class Geometry {
        primitiveType: PrimitiveType;
        indices: number[];
    }

    export class EllipseGeometry extends Geometry {
        static createGeometry(): Geometry;
    }

    export class AxisAlignedBoundingBox {
        center: Cartesian3;
        maximum: Cartesian3;
        minimum: Cartesian3;
        clone(): AxisAlignedBoundingBox;
        equals(right: AxisAlignedBoundingBox): boolean;
        static clone(box: AxisAlignedBoundingBox, result?: AxisAlignedBoundingBox): AxisAlignedBoundingBox;
        static equals(left: AxisAlignedBoundingBox, right: AxisAlignedBoundingBox): boolean;
        static fromPoints(positions: Cartesian3[], result?: AxisAlignedBoundingBox): AxisAlignedBoundingBox;
    }

    export class CircleGeometry extends Geometry {
        static createGeometry(): Geometry;
    }

    export class ComponentDatatype {
        DOUBLE: number;
        FLOAT: number;
        SHORT: number;
        UNSIGNED_BYTE: number;
        UNSIGNED_SHORT: number;
    }

    export class PerInstanceColorAppearance {
        constructor(options?: Object);
    }

    export class GeometryAttribute {
        componentDatatype: ComponentDatatype;
        componentsPerAttribute: number;
        normalize: boolean;
        values: number[];
    }

    export class GeometryAttributes {
        binormal: GeometryAttribute;
        color: GeometryAttribute;
        normal: GeometryAttribute;
        position: GeometryAttribute;
        st: GeometryAttribute;
        tangent: GeometryAttribute;
    }

    export class GeometryInstance {
        attributes: GeometryAttributes;
        geometry: Geometry;
        id: string;
    }

    export class Polygon {
        constructor(positions: Cartesian3[]);
        height: number;
        id: string;
        material: Material;
        positions: Cartesian3[];
        show: boolean;

        destroy();
        isDestroyed(): boolean;
    }

    export class VertexFormat {
        binormal: boolean;
        normal: boolean;
        position: boolean;
        st: boolean;
        tangent: boolean;
        options: Object;
    }

    export class PolygonGeometry {
        polygonHierarchy: Object;
        height: number;
        extrudedHeight: number;
        vertexFormat: VertexFormat;
        stRotation: number;
        ellipsoid: Ellipsoid;
        granularity: number;
        perPositionHeight: boolean;
    }

    export class PolygonOutlineGeometry {
        polygonHierarchy: Object;
        height: number;
        extrudedHeight: number;
        vertexFormat: VertexFormat;
        ellipsoid: Ellipsoid;
        granularity: number;
        perPositionHeight: boolean;
    }

    export class PrimitiveCollection {
        add(obj: Object): Object;
        contains(obj: Object): boolean;
        destroy();
        get(i: number): Object;
        length: number;
        isDestroyed(): boolean;
        remove(obj: Object): boolean;
    }

    export class Cartesian2 {
        constructor(x?: number, y?: number);
        x: number;
        y: number;
        static packedLength: number;
        static UNIT_X: Cartesian2;
        static UNIT_Y: Cartesian2;
        static ZERO: Cartesian2;
        clone(result: Cartesian2): Cartesian2;
        equals(right: Cartesian2): boolean;
        equalsEpsilon(right: Cartesian2, epsilon: number): boolean;
        toString(): string;
        static abs(cartesian: Cartesian2, result: Cartesian2): Cartesian2;
        static add(left: Cartesian2, rigtht: Cartesian2, result: Cartesian2): Cartesian2;
        static angleBetween(left: Cartesian2, right: Cartesian2): number;
        static clone(cartesian: Cartesian2, result: Cartesian2): Cartesian2;
        static distance(left: Cartesian2, right: Cartesian2): number;
        static distanceSquared(left: Cartesian2, right: Cartesian2): number;
        static divideByScalar(cartesian: Cartesian2, scalar: number, result: Cartesian2): Cartesian2;
        static dov(left: Cartesian2, right: Cartesian2): number;
        static equals(left: Cartesian2, right: Cartesian2): number;
        static equalsEpsilon(left: Cartesian2, right: Cartesian2, epsilon: number): boolean;
        static fromArray(array: Array<number>, startingIndex: number, result: Cartesian2): Cartesian2;
        static fromCartesian3(cartesian: Cartesian3, result: Cartesian2): Cartesian2;
        static fromCartesian4(cartesian: Cartesian4, result: Cartesian2): Cartesian2;
        static fromElement(x: number, y: number, result: Cartesian2): Cartesian2;
        static lerp(start: Cartesian2, end: Cartesian2, t: number, result: Cartesian2): Cartesian2;
        static magnitude(cartesian: Cartesian2): number;
        static magnitudeSquared(cartesian: Cartesian2): number;
        static maximumByComponents(first: Cartesian2, second: Cartesian2, result: Cartesian2): Cartesian2;
        static maximumComponents(cartesian: Cartesian2): number;
        static minimumBycomponents(first: Cartesian2, second: Cartesian2, result: Cartesian2): Cartesian2;
        static minimumComponent(cartesian: Cartesian2): number;
        static multiplyByScalar(cartesian: Cartesian2, scalar: number, rsult: Cartesian2): Cartesian2;
        static multiplyComponents(left: Cartesian2, right: Cartesian2, result: Cartesian2): Cartesian2;
        static negate(cartesian: Cartesian2, result: Cartesian2): Cartesian2;
        static normalize(cartesian: Cartesian2, result: Cartesian2): Cartesian2;
        static pack(value: Cartesian2, array: Array<number>, startingIndex: number);
        static subtract(left: Cartesian2, right: Cartesian2, result: Cartesian2): Cartesian2;
        static unpack(array: Array<number>, startingIndex: number, result: Cartesian2): Cartesian2;
    }

    export class Color {
        red: number;
        green: number;
        blue: number;
        alpha: number;
        static packedlength: number;
        constructor(red: number, green: number, blue: number, alpha: number);
        static byteToFloat(number: number): number;
        static clone(color: Color, result?: Color): Color;
        static equals(left: Color, right: Color): boolean;
        static floatToByte(number: number): Number;
        static fromBytes(red: number, green: number, blue: number, alpha: number): Color;
        static fromCartesian4(cartesian: Cartesian4, result: Color): Color;
        static fromCssColorString(color: string): Color;
        static fromHsl(hue: number, saturation: number, lightness: number, alpha: number): Color;
        static fromRandom(options: Object, result: Color): Color;
        static fromRgba(rgba: number): Color;
        static pack(value: Color, array: Array<number>, startingIndex: number);
        static unpack(array: Array<number>, startingIndex: number, result: Color);
        brighten(magnitude: number, result: Color): Color;
        clone(result?: Color): Color;
        darken(magntidue: number, result: Color): Color;
        equals(other: Color): boolean;
        equalsEpsilon(other: Color, epsilon: number): boolean;
        toBytes(result?: number[]): number[];
        toCssColorString(): string;
        toRgba(): number;
        toString(): string;
        static ALICEBLUE: Color;
        static ANTIQUEWHITE: Color;
        static AQUA: Color;
        static AQUAMARINE: Color;
        static AZURE: Color;
        static BEIGE: Color;
        static BISQUE: Color;
        static BLACK: Color;
        static BLANCHEDALMOND: Color;
        static BLUE: Color;
        static BLUEVIOLET: Color;
        static BROWN: Color;
        static BURLYWOOD: Color;
        static CADETBLUE: Color;
        static CHARTREUSE: Color;
        static CHOCOLATE: Color;
        static CORAL: Color;
        static CORNFLOWERBLUE: Color;
        static CORNSILK: Color;
        static CRIMSON: Color;
        static CYAN: Color;
        static DARKBLUE: Color;
        static DARKCYAN: Color;
        static DARKGOLDENROD: Color;
        static DARKGRAY: Color;
        static DARKGREEN: Color;
        static DARKKHAKI: Color;
        static DARKMAGENTA: Color;
        static DARKOLIVEGREEN: Color;
        static DARKORANGE: Color;
        static DARKORCHID: Color;
        static DARKRED: Color;
        static DARKSALMON: Color;
        static DARKSEAGREEN: Color;
        static DARKSLATEBLUE: Color;
        static DARKSLATEGRAY: Color;
        static DARKTURQUOISE: Color;
        static DARKVIOLET: Color;
        static DEEPPINK: Color;
        static DEEPSKYBLUE: Color;
        static DIMGRAY: Color;
        static DODGERBLUE: Color;
        static FIREBRICK: Color;
        static FLORALWHITE: Color;
        static FORESTGREEN: Color;
        static FUSCHIA: Color;
        static GAINSBORO: Color;
        static GHOSTWHITE: Color;
        static GOLD: Color;
        static GOLDENROD: Color;
        static GRAY: Color;
        static GREEN: Color;
        static GREENYELLOW: Color;
        static HONEYDEW: Color;
        static HOTPINK: Color;
        static INDIANRED: Color;
        static INDIGO: Color;
        static IVORY: Color;
        static KHAKI: Color;
        static LAVENDER: Color;
        static LAVENDAR_BLUSH: Color;
        static LAWNGREEN: Color;
        static LEMONCHIFFON: Color;
        static LIGHTBLUE: Color;
        static LIGHTCORAL: Color;
        static LIGHTCYAN: Color;
        static LIGHTGOLDENRODYELLOW: Color;
        static LIGHTGRAY: Color;
        static LIGHTGREEN: Color;
        static LIGHTPINK: Color;
        static LIGHTSEAGREEN: Color;
        static LIGHTSKYBLUE: Color;
        static LIGHTSLATEGRAY: Color;
        static LIGHTSTEELBLUE: Color;
        static LIGHTYELLOW: Color;
        static LIME: Color;
        static LIMEGREEN: Color;
        static LINEN: Color;
        static MAGENTA: Color;
        static MAROON: Color;
        static MEDIUMAQUAMARINE: Color;
        static MEDIUMBLUE: Color;
        static MEDIUMORCHID: Color;
        static MEDIUMPURPLE: Color;
        static MEDIUMSEAGREEN: Color;
        static MEDIUMSLATEBLUE: Color;
        static MEDIUMSPRINGGREEN: Color;
        static MEDIUMTURQUOISE: Color;
        static MEDIUMVIOLETRED: Color;
        static MIDNIGHTBLUE: Color;
        static MINTCREAM: Color;
        static MISTYROSE: Color;
        static MOCCASIN: Color;
        static NAVAJOWHITE: Color;
        static NAVY: Color;
        static OLDLACE: Color;
        static OLIVE: Color;
        static OLIVEDRAB: Color;
        static ORANGE: Color;
        static ORANGERED: Color;
        static ORCHID: Color;
        static PALEGOLDENROD: Color;
        static PALEGREEN: Color;
        static PALETURQUOISE: Color;
        static PALEVIOLETRED: Color;
        static PAPAYAWHIP: Color;
        static PEACHPUFF: Color;
        static PERU: Color;
        static PINK: Color;
        static PLUM: Color;
        static POWDERBLUE: Color;
        static PURPLE: Color;
        static RED: Color;
        static ROSYBROWN: Color;
        static ROYALBLUE: Color;
        static SADDLEBROWN: Color;
        static SALMON: Color;
        static SANDYBROWN: Color;
        static SEAGREEN: Color;
        static SEASHELL: Color;
        static SIENNA: Color;
        static SILVER: Color;
        static SKYBLUE: Color;
        static SLATEBLUE: Color;
        static SLATEGRAY: Color;
        static SNOW: Color;
        static SPRINGGREEN: Color;
        static STEELBLUE: Color;
        static TAN: Color;
        static TEAL: Color;
        static THISTLE: Color;
        static TOMATO: Color;
        static TURQUOISE: Color;
        static VIOLET: Color;
        static WHEAT: Color;
        static WHITE: Color;
        static WHITESMOKE: Color;
        static YELLOW: Color;
        static YELLOWGREEN: Color;
    }

    export class PolylineGeometry {
        constructor(options?: Object);
        createGeometry(pg: PolylineGeometry): Geometry;
    }

    export class Uniform {
        Value: Object;
    }

    export class BingMapsApi {
        defaultKey: string;
    }

    //export class Shapes {
    //    computeEllipseBoundary(
    //        ellipsoid: Ellipsoid,
    //        center: Cartesian3,
    //        semiMajorAxis: number,
    //        semiMinorAxis: number,
    //        rotation: number,
    //        granularity: number);
    //    computeCircleBoundary(
    //        ellipsoid: Ellipsoid,
    //        center: Cartesian3,
    //        radius: number,
    //        granularity: number);
    //}

    export class Material {
        constructor();
        materials: Object;
        shaderSource: string;
        type: string;
        uniforms: Object;
        isTranslucent(): boolean;
        isDestroyed(): boolean;
        destroy();

        static fromType(type: string, options?: Object): Material;
        // These all take an image and a repeat factor; most also take a channel or channels object
        static AlphaMapType: string;
        static BumpMapType: string;
        static DiffuseMapType: string;
        static EmissionMapType: string;
        static ImageType: string;
        static NormalMapType: string;
        static SpecularMapType: string;
        // These don't take an image - but many have a pre-defined image
        static AsphaltType: string;
        static BlobType: string;
        static BrickType: string;
        static CementType: string;
        static CheckerboardType: string;
        static ColorType: string;
        static DotType: string;
        static ErosionType: string;
        static FacetType: string;
        static FadeType: string;
        static FresnelType: string;
        static GrassType: string;
        static GridType: string;
        static PolylineArrowType: string;
        static PolylineGlowType: string;
        static PolylineOutlineType: string;
        static ReflectionType: string;
        static RefractionType: string;
        static RimLightingType: string;
        static StripeType: string;
        static TieDyeType: string;
        static WaterType: string;
        static WoodType: string;
    }

    export class ColorGeometryInstanceAttribute {
        static fromColor(color: Color);
    }

    export class Rectangle {
        south: number;
        north: number;
        east: number;
        west: number;
        clone(result?: Rectangle): Rectangle;
        equals(a: Rectangle): boolean;
        width: number;
        height: number;

        static center(a: Rectangle, result?: Cartographic): Cartographic;
        static clone(a: Rectangle, result?: Rectangle): Rectangle;
        static computeHeight(rectangle: Rectangle): number;
        static computeWidth(rectangle: Rectangle): number;
        static contains(a: Rectangle, pt: Cartographic): boolean;
        static equals(a: Rectangle, b: Rectangle): boolean;
        static fromCartographicArray(a: Array<Cartographic>, result?: Rectangle): Rectangle;
        static fromDegrees(west: number, south: number, east: number, north: number, result?: Rectangle): Rectangle;
        static intersection(a: Rectangle, b: Rectangle, result?: Rectangle);
        static northeast(a: Rectangle, result?: Cartographic): Cartographic;
        static northwest(a: Rectangle, result?: Cartographic): Cartographic;
        static southeast(a: Rectangle, result?: Cartographic): Cartographic;
        static southwest(a: Rectangle, result?: Cartographic): Cartographic;
    }

    export class Event {
        numberOfListeners: number;
        addEventListener(fn: Function, ob: Object): Function;
        raiseEvent(args?: Object);
        removeEventListener(fn: Function): boolean;
    }

    export class KeyboardEventModifier {
        SHIFT: number;  // 0
        CTRL: number;   // 1
        ALT: number;    // 2
    }

    export class ScreenSpaceEventType {
        LEFT_DOWN : number; // 0
        LEFT_UP : number; // 1
        LEFT_CLICK : number; // 2
        LEFT_DOUBLE_CLICK : number; // 3
        RIGHT_DOWN : number; // 5
        RIGHT_UP : number; // 6
        RIGHT_CLICK : number; // 7
        RIGHT_DOUBLE_CLICK : number; // 8
        MIDDLE_DOWN : number; // 10
        MIDDLE_UP : number; // 11
        MIDDLE_CLICK : number; // 12
        MIDDLE_DOUBLE_CLICK : number; // 13
        MOUSE_MOVE : number; // 15
        WHEEL : number; // 16
        PINCH_START : number; // 17
        PINCH_END : number; // 18
        PINCH_MOVE : number; // 19
    }

    export class CameraFlightPath {
//        createAnimationRectangle(scene: Scene, options?: Object); replaced by camera.flyToRectangle
    }

    export class AnimationCollection {
        add(animationRectangle: any);
    }

    export class PickedObject {
        primitive: Primitive;
        id: Object;
    }

    export class Frustum {
        near: number;
        far: number;
        computeCullingVolume(position: Cartesian3, direction: Cartesian3, up: Cartesian3): CullingVolume;
        getPixelSize(drawingBufferDimensions: Cartesian2, distance?: number, result?: Cartesian2): Cartesian2;
        /// BEGIN Manual modification
        clone(r?: Frustum) : Frustum;
        /// END
    }

    export class Ray {
        constructor(origin: Cartesian3, direction: Cartesian3);
        direction: Cartesian3;
        origin: Cartesian3;
        static getPoint(t: number, result?: Cartesian3): Cartesian3;
    }

    export class Camera {
        flyToRectangle(options: Object, endTransform?: Matrix4);    // options: destination (Rectangle), duration? (seconds), complete? (fn), cancel? (fn)
        flyTo(options: Object);
        pickEllipsoid(pt: Cartesian2, ellipsoid?: Ellipsoid, result?: Cartesian3): Cartesian3;
        heading: number;
        direction: Cartesian3;
        position: Cartesian3;
        frustum: Frustum;
        viewMatrix: Matrix4;
        tilt: number;
        up: Cartesian3;
        lookAt(eye: Cartesian3, target: Cartesian3, up: Cartesian3);
        lookLeft(rads?: number);
        lookRight(rads?: number);
        moveForward(dist?: number);
        moveBackward(dist?: number);
        setPositionCartographic(cart: Cartographic);
        getPickRay(windowPosition: Cartesian2, result?: Ray): Ray;
        /// BEGIN Manual modification
        constrainedAxis: Cartesian3;
        transform: Matrix4;
        right: Cartesian3;
        /// END
    }

    export class ScreenSpaceCameraController {
    //    ellipsoid: Ellipsoid;
    }

    export class Scene {
        canvas: any;
        drawingBufferHeight: number;
        drawingBufferWidth: number;
        maximumAliasedLineWidth: number;
        primitives: PrimitiveCollection;
        globe: Globe;
        camera: Camera;
        screenSpaceCameraController: ScreenSpaceCameraController;
        // animations: AnimationCollection;
        //frameState: FrameState;
        pick(windowPosition: Cartesian2): PickedObject;
    }

    export class ScreenSpaceEventHandler {
        constructor(element?: HTMLElement);
        destroy();
        isDestroyed(): boolean;
        getInputAction(type: any, modifier?: any): Object;
        removeInputAction(type: any, modifier?: any);
        setInputAction(action: Function, type: any, modifier?: any);
    }

    export class CesiumWidget {
        constructor(container: any/*dom element or string*/, options?: CesiumWidgetOptions);
        camera: Camera; // readonly
        canvas: HTMLCanvasElement;
        clock: Clock;
        container: HTMLElement;
        creditContainer: HTMLElement;
        imageryLayers: ImageryLayerCollection;
        resolutionScale: number;
        scene: Scene;
        screenSpaceEventHandler: ScreenSpaceEventHandler;
        terrainProvider: TerrainProvider;
        targetFrameRate: number;
        useDefaultRenderLoop: boolean;
        destroy();
        isDestroyed(): boolean;
        render();
        resize();
        showErrorPanel(title: string, message: string, error?: string);
    }

    export interface CesiumWidgetOptions {
        clock?: Clock;
        imageryProvider?: ImageryProvider;
        terrainProvider?: TerrainProvider;
        skyBox?: SkyBox;
        sceneMode?: SceneMode;
        scene3DOnly?: boolean;
        orderIndependentTranslucency?: boolean;
        mapProjection?: MapProjection;
        useDefaultRenderLoop?: boolean;
        targetFrameRate?: number;
        showRenderLoopErrors?: boolean;
        contextOptions?: Object;
        creditContainer?: any;
    }

    export class MapProjection {
        constructor();
        ellipsoid: Ellipsoid;
        project(cartographic: Cartographic, result: Cartesian3): Cartesian3;
        unproject(cartesian: Cartesian3, result: Cartographic): Cartographic;
    }

    export class SceneMode {
        static COLUMBUS_VIEW;
        static MORPHING;
        static SCENE2D;
        static SCENE3D;
        static getMorphTime(value: SceneMode): number;
    }

    export class SkyBox {
        constructor(options: Object);
        show: boolean;
        sources: Object;
        destroy();
        isDestroyed(): boolean;
        update();
    }

    export class Geocoder {

    }

    export class Timeline {
        clock: Clock;
        updateFromClock();
    }

    export class ImageryLayer {
    }

    export class ImageryLayerCollection {
        layerAdded: Event;
        layerMoved: Event;
        layerRemoved: Event;
        layerShownOrHidden: Event;
        length: number;
        get(index: number): ImageryLayer;
        addImageryProvider(ip: ImageryProvider, index?: number);
        remove(il: ImageryLayer, destroy?: boolean);
        raiseToTop(il: ImageryLayer);
        lower(il: ImageryLayer);
        lowerToBottom(il: ImageryLayer);
        raise(il: ImageryLayer);

        removeAll(destroy?: boolean);
    }

    export class TilingScheme {
        positionToTileXY(position: Cartographic, level: number, result?: Cartesian2): Cartesian2;
        tileXYToRectangle(x: number, y: number, level: number, result?: Object): Rectangle;
    }

    export class TerrainData {
        interpolateHeight(rectangle: Rectangle, longitude: number, latitude: number);
    }

    export interface TerrainProvider {
        credit: Credit;
        errorEvent: Event;
        hasVortexNormals: boolean;
        hasWaterMask: boolean;
        ready: boolean;
        tilingScheme: TilingScheme;
        getLevelMaximumGeometricError(level: number): number;
        getTileDataAvailable(x: number, y: number, level: number): boolean;
        requestTileGeometry(x: number, y: number, level: number, throttleRequests?: boolean): Q.Promise<TerrainData>;
    }

    export class CesiumTerrainProvider implements TerrainProvider {
        constructor(options?: Object);
        credit: Credit;
        errorEvent: Event;
        hasVortexNormals: boolean;
        hasWaterMask: boolean;
        ready: boolean;
        requestVertexNormals: boolean;
        tilingScheme: TilingScheme;
        getLevelMaximumGeometricError(level: number): number;
        getTileDataAvailable(x: number, y: number, level: number): boolean;
        requestTileGeometry(x: number, y: number, level: number, throttleRequests?: boolean): Q.Promise<TerrainData>;
    }

    export interface ImageryProvider {
        // Can't actually include these properties because we want IViewshed to be both
        // Cesium independent and a single tile imagery provider
//        credit: Credit;
//        defaultAlpha: number;
//        defaultBrightness: number;
//        defaultContrast: number;
//        defaultGamma: number;
//        defaultHue: number;
//        defaultSaturation: number;
//        errorEvent: Event;
//        maximumLevel: number;
//        minimumLevel: number;
//        proxy: Proxy;
//        ready: boolean;
//        rectangle: Rectangle;
//        tileDiscardPolicy: TileDiscardPolicy;
//        tileHeight: number;
//        tileWidth: number;
//        tilingScheme: TilingScheme;
//        getTileCredits(x: number, y: number, level: number): Credit[];
//        requestImage(x: number, y: number, level: number): Q.Promise<HTMLImageElement>;
//        pickFeatures(x: number, y: number, level: number, longitude: number, latitude: number): Promise<Array<ImageryLayerFeatureInfo>>;
    }

    export class Globe {
        constructor(ellipsoid: Ellipsoid);
        baseColor: Color;
        depthTestAgainstTerrain: boolean;
        ellipsoid: Ellipsoid;
        enableLighting: boolean;
        imageryLayers: ImageryLayerCollection;
        lightingFadeInDistance: number;
        lightingFadeOutDistance: number;
        maximumScreenSpaceError: number;
        northPoleColor: Cartesian3;
        oceanNormalMapUrl: string;
        show: boolean;
        showWaterEffect: boolean;
        southPoleColor: Cartesian3;
        terrainProvider: TerrainProvider;
        tileCacheSize: number;
        destroy();
        getHeight(carto: Cartographic): any;
        isDestroyed(): boolean;
        pick(ray: Ray, scene: Scene, result?: Cartesian3): any; // Cartesian3 | undefined
    }

    export class ClockViewModel {
        clock: Clock;
        clockRange: number; // constants used by tick() to determine behavior when startTime or stopTime is reached
        clockStep: number; // constants to determine how much time advances with each call to tick
        currentTime: JulianDate;
        multiplier: number;
        onTick: Event;
        startTime: JulianDate;
        stopTime: JulianDate;
        shouldAnimate: boolean;
        systemTime: JulianDate;
        synchronize();
    }

    export class Clock {
        constructor(options: ClockOptions);
        canAnimate: boolean;
        clockRange: ClockRange; // constants used by tick() to determine behavior when startTime or stopTime is reached
        clockStep: ClockStep; // constants to determine how much time advances with each call to tick
        currentTime: JulianDate;
        multiplier: number;
        onTick: Event;
        startTime: JulianDate;
        stopTime: JulianDate;
        shouldAnimate: boolean;
        tick(): JulianDate;
    }

    export interface ClockOptions {
        startTime?: JulianDate;
        stopTime?: JulianDate;
        currentTime?: JulianDate;
        multiplier?: number;
        clockStep?: ClockStep;
        clockRange?: ClockRange;
        canAnimate?: boolean;
        shouldAnimate?: boolean;
    }

    export class Viewer {
        camera: Camera; // readonly
        container: HTMLElement;
        cesiumWidget: CesiumWidget;
        geocoder: Geocoder;
        imageryLayers: ImageryLayerCollection;
        clock: Clock;
        animation: Animation;
        terrainProvider: TerrainProvider;
        timeline: Timeline;
        dataSources: DataSourceCollection;
        scene: Scene;
        resize();
        render();
        isDestroyed(): boolean;
        destroy();
    }

    export class Ellipsoid {
        constructor(x: number, y: number, z: number);
        static clone(cartographic: Ellipsoid, result?: Ellipsoid): Ellipsoid;
        static fromCartesian3(cartesian: Cartesian3): Ellipsoid;
        radii: Cartesian3;
        radiiSquared: Cartesian3;
        getRadiiToTheFourth(): Cartesian3;
        oneOverRadii: Cartesian3;
        oneOverRadiiSquared: Cartesian3;
        minimumRadius: Cartesian3;
        maximumRadius: Cartesian3;
        geodeticSurfaceNormalCartographic(cartographic: Cartographic, result?: Cartesian3): Cartesian3;
        geodeticSurfaceNormal(cartesian: Cartesian3, result?: Cartesian3): Cartesian3;
        cartographicToCartesian(cartographic: Cartographic, result?: Cartesian3): Cartesian3;
        cartographicArrayToCartesianArray(cartographics: Cartographic[], result?: Cartesian3[]): Cartesian3[];
        cartesianToCartographic(cartesian: Cartesian3, result?: Cartographic): Cartographic;
        cartesianArrayToCartographicArray(cartesian: Cartesian3[], result?: Cartographic[]): Cartographic[];
        scaleToGeodeticSurface(cartesian: Cartesian3, result?: Cartesian3): Cartesian3;
        scaleToGeocentricSurface(cartesian: Cartesian3, result?: Cartesian3): Cartesian3;
        transformPositionToScaledSpace(position: Cartesian3, result?: Cartesian3): Cartesian3;
        transformPositionFromScaledSpace(position: Cartesian3, result?: Cartesian3): Cartesian3;
        equals(right: Ellipsoid): boolean;
        toString(): string;
        static MOON: Ellipsoid;
        static UNIT_SPHERE: Ellipsoid;
        static WGS84: Ellipsoid;
        geocentricSurfaceNormal: Cartesian3;
    }

    export class WebMapTileServiceImageryProvider {
        constructor(options: Object);
        credit: Credit;
        errorEvent: Event;
        format: string;
        hasAlphaChannel: boolean;
        maximumLevel: number;
        minimumLevel: number;
        proxy: Proxy;
        ready: boolean;
        rectangle: Rectangle;
        tileDiscardPolicy: TileDiscardPolicy;
        tileHeight: number;
        tileWidth: number;
        tilingScheme: TilingScheme;
        url: string;
        getTileCredits(x: number, y: number, level: number): Array<Credit>;
        pickFeatures(x: number, y: number, level: number, longitude: number, latitiude: number): Q.Promise<Array<ImageryLayerFeatureInfo>>;
        requestImage(x: number, y: number, level: number): Q.Promise<any>; // Image or DOM element
    }

    export interface WebMapTileServiceImageryProviderOptions
    {
        url?: string;
        format?: string;
        layer?: string;
        style?: string;
        tileMatrixSetID?: string;
        tileMatrixLabels?: Array<string>;
        tileWidth?: number;
        tileHeight?: number;
        tilingScheme?: TilingScheme;
        proxy?: Object;
        rectangle?: Rectangle;
        minimumLevel?: number;
        maximumLevel?: number;
        credit?: any; // Credit or string
    }

    export class ImageryLayerFeatureInfo {
        constructor();
        data: Object;
        description: string;
        name: string;
        position: Cartographic;
        configureDescriptionFromProperties(properties: Object);
        configureNameFromProperties(properties: Object);
    }

    export class PinBuilder {
        constructor();
        fromColor(color: Color, size: number): HTMLCanvasElement;
        fromMakiIconId(id: string, color: Color, size: number): any; // Canvas or Promise
        fromText(text: string, color: Color, size: number): HTMLCanvasElement;
        fromUrl(url: string, color: Color, size: number): any; // Canvas or Promise
    }
}