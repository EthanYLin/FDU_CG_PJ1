const POINT_RADIUS = 10; // radius of points when drawing
const ALPHA = 0.5; // alpha value of polygon colors when drawing

/**
 * Point class
 * properties: x, y, z
 * @method draw - draw the point in a given context and a given radius
 */
class Point{
    constructor(x, y, z){
        this.x = x;
        this.y = y;
        this.z = z;
    }

    draw(ctx, radius){
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, 2*Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
}

/**
 * Polygon class
 * @property {Point[]} points - An array of Point objects
 * @property {number[]} color - An array of 4 numbers: [r, g, b, a]
 * @method fill - fill the polygon in a given context (uses scan line algorithm)
 */
class Polygon{

    constructor(points, color){
        this.points = points;
        this.color = color;
    }

    /**
     * return x-coordinate of intersection of a edge and a horizontal scan line
     * return NaN if there's no intersection or they're parallel
     * Notice: p1.y < p2.y , edge is [p1, p2)
     */
    static getIntersection(p1, p2, y) {
        if (p1.y == p2.y || y < p1.y || y >= p2.y) return NaN;
        return p1.x + (p2.x - p1.x) * (y - p1.y) / (p2.y - p1.y);
    }

    fill(ctx) {
        // ** Use horizontal scan lines **
        // construct an array of edges that are not parallel to scan lines
        // edge: [Point1, Point2) (Point1.y < Point2.y)
        let edges = [];
        for(let i = 0; i < this.points.length; i++){
            let p1 = this.points[i];
            let p2 = this.points[(i+1)%this.points.length];
            if(p1.y == p2.y) continue;
            edges.push([p1, p2].sort((p1, p2) => p1.y - p2.y));
        }

        //scan line runs in [minY, maxY]
        let minY = Math.min(...this.points.map(p => p.y));
        let maxY = Math.max(...this.points.map(p => p.y));
        for(let y = minY; y < maxY; y++) {
            // get intersections of current scan line and all edges, and sort them ASC
            let intersection_x_coordinates = edges.map(e => Polygon.getIntersection(e[0], e[1], y)).filter(x => !isNaN(x));
            intersection_x_coordinates.sort((a, b) => a - b);
            // fill the scan line
            for (let i = 0; i < intersection_x_coordinates.length; i += 2) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(${this.color.join(",")})`;
                ctx.moveTo(intersection_x_coordinates[i], y);
                ctx.lineTo(intersection_x_coordinates[i + 1], y);
                ctx.stroke();
            }
        }
    }
}

/**
 * Canvas class
 * @property {HTMLCanvasElement} dom - The canvas element
 * @property {CanvasRenderingContext2D} ctx - The context of canvas
 * @property {Point[]} points - An array of Points on the canvas
 * @property {Polygon[]} polygons - An array of Polygons on the canvas
 * @method addPoint - Add a point to the canvas
 * @method addPolygon - Add a polygon to the canvas
 * @method clear_and_draw - Clear the canvas and draw all points and polygons
 */
class Canvas{
    constructor(dom, width, height){
        this.dom = dom;
        dom.width = width;
        dom.height = height;
        this.ctx = dom.getContext("2d");
        this.ctx.translate(0.5, 0.5);
        this.points = [];
        this.polygons = [];
    }

    isOutOfBounds(point){
        return point.x < 0 || point.x > this.dom.width || point.y < 0 || point.y > this.dom.height;
    }

    addPoint(point){
        if (this.isOutOfBounds(point)){
            throw new Error("Point out of bounds");
        }
        this.points.push(point);
    }

    addPolygon(polygon){
        if (polygon.points.some(p => this.isOutOfBounds(p))){
            throw new Error("Polygon out of bounds");
        }
        this.polygons.push(polygon);
    }

    clear_and_draw(){
        this.ctx.clearRect(-0.5, -0.5, this.dom.width, this.dom.height);
        this.points.forEach(p => p.draw(this.ctx, POINT_RADIUS));
        this.polygons.forEach(p => p.fill(this.ctx));
    }

}


/**
 * Use config.js to initialize the canvas 
 * (including add points, add polygons, draw canvas)
 * @param {Canvas} canvas - The canvas to be initialized 
 */
function initCanvas(canvas) {
    // Add points & polygons
    vertex_pos.forEach(p => canvas.addPoint(new Point(...p)));
    polygon.forEach(p => {
        let points = p.map(i => canvas.points[i]);
        let color = vertex_color[p[0]].concat(ALPHA);
        canvas.addPolygon(new Polygon(points, color));
    })
    // Draw
    canvas.clear_and_draw();
}

/**
 * Add drag handler to the canvas
 * When a point is dragged, the canvas will be redrawn
 * @param {Canvas} canvas - The canvas to be initialized
 */
function addDragHandler(canvas) {
    var drag_flag = false;
    var drag_point = null;
    var drag_offset = [0, 0];
    canvas.dom.addEventListener("mousedown", (e) => {
        let x = e.offsetX;
        let y = e.offsetY;
        let point = canvas.points.find(p => Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2) <= Math.pow(POINT_RADIUS, 2));
        if (point != null) {
            drag_flag = true;
            drag_point = point;
            drag_offset = [x - point.x, y - point.y];
        }
    });
    canvas.dom.addEventListener("mousemove", (e) => {
        if (drag_flag) {
            drag_point.x = e.offsetX - drag_offset[0];
            drag_point.y = e.offsetY - drag_offset[1];
            canvas.clear_and_draw();
        }
    });
    canvas.dom.addEventListener("mouseup", (e) => {
        drag_flag = false;
        drag_point = null;
    });
}

var canvas = new Canvas(document.getElementById("myCanvas"), canvasSize.maxX, canvasSize.maxY);
initCanvas(canvas);
addDragHandler(canvas);
