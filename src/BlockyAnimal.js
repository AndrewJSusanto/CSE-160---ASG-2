// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =    `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const ASSORTED = 3;

// Global Variables
let isDown = false;
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSides = 3;
let g_globalAngle = 0;

let g_legAngle = -10;
let g_earAngle = 15;
let g_trunkAngle = -20;
let g_headAngle = 0;
let g_testAngle = 0;

let redSelect = [1.0, 0.0, 0.0, 1.0]
let greenSelect = [0.0, 1.0, 0.0, 1.0]
let blueSelect = [0.0, 0.0, 1.0, 1.0]
let savedSelect = [0.0, 0.0, 0.0, 1.0]
var g_shapesList = [];


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    // no lag fix
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true})
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    } 

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function addActionsForHTMLUI() {
    // Button Events (Shape Type)

    // Angle Slider
    document.getElementById('angleSlider').addEventListener('mousemove',
        function() {g_globalAngle = this.value; renderAllShapes(); });

    // Leg Segment Slider
    document.getElementById('legSlider').addEventListener('mousemove',
        function() {g_legAngle = this.value; renderAllShapes(); });

    // Ear Segment Slider
    document.getElementById('earSlider').addEventListener('mousemove',
        function() {g_earAngle = this.value; renderAllShapes(); })

    // Trunk Segments Slider
    document.getElementById('trunkSlider').addEventListener('mousemove',
        function() {g_trunkAngle = this.value; renderAllShapes(); })
    
    // Head Segment Slider
    document.getElementById('headSlider').addEventListener('mousemove',
        function() {g_headAngle = this.value; renderAllShapes(); })
    
    // Test
    document.getElementById('testSlider').addEventListener('mousemove',
        function() {g_testAngle = this.value; renderAllShapes(); })
}

function main() {
    // Set up canvas and gl variables
    setupWebGL();
    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Button and Sliders
    addActionsForHTMLUI();

    // Register function (event handler) to be called on a mouse press
    // anonymous function, on event ev click() function 
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons==1){ click(ev) }};

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);
    renderAllShapes();
}

//  var g_points = [];  // The array for the position of a mouse press
//  var g_colors = [];  // The array to store the color of a point
//  var g_sizes = [];

function click(ev) {
    // Extract the event click and return it in WebGL coords
    [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    switch (g_selectedType) {
        case POINT:
            point = new Point();
            break;
        case TRIANGLE:
            point = new Triangle();
            break;
        case CIRCLE:
            point = new Circle();
            point.sides = g_selectedSides;
            break;
        case ASSORTED:
            let value = Math.floor(Math.random() * 3)
            if(value == POINT) {
                point = new Point();
            }
            else if (value == TRIANGLE) {
                point = new Triangle();
            }
            else if (value == CIRCLE) {
                point = new Circle();
                point.sides = g_selectedSides;
            }
            break;
    }

    point.position = [x, y];
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
    g_shapesList.push(point)
    
    // Re-render all shapes drawn so far
    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function renderScene() {
    renderAllShapes();

}
function sendTextToHTML(text, htmlID) {
    var htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}