// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =    `
  attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = 10.0;
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
let u_Size;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0]
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSides = 3;

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

    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

function addActionsForHTMLUI() {
    // Button Events (Shape Type)

    // Clear Canvas
    document.getElementById('clear').onclick = function() {
        g_shapesList = [];
        renderAllShapes();
    }
    // Undo Button
    undoButton = document.getElementById('undo');
    undoButton.addEventListener('mousedown', function(ev) {
        if(isDown == false) {
            isDown = true;
            setInterval(function() {
                if(isDown == true) {
                    g_shapesList.pop()
                    renderAllShapes();
                }
            }, 100)
        }
    })
    undoButton.addEventListener('mouseup', function(ev) {
        isDown = false;
    })

    // Background Fill
    document.getElementById('fillButton').onclick = function() {
        let colors = g_selectedColor.slice();
        gl.clearColor(colors[0], colors[1], colors[2], colors[3])
        renderAllShapes();
    }

    // Change shape
    document.getElementById('pointButton').onclick = function() {
        g_selectedType = POINT;
    }
    document.getElementById('triButton').onclick = function() {
        g_selectedType = TRIANGLE;
    }
    document.getElementById('circButton').onclick = function() {
        g_selectedType = CIRCLE;

    }
    document.getElementById('assortedButton').onclick = function() {
        g_selectedType = ASSORTED;
    }
    
    // Color Drop Down
    document.getElementById('saveButton').onclick = function() {
        savedSelect = g_selectedColor
    }
    document.getElementById('selector').onchange = function() {
        var value = this.value;
        console.log(value)
        if(value == "Red") {
            g_selectedColor = redSelect
        }
        else if(value == "Green") {
            g_selectedColor = greenSelect
        }
        else if(value == "Blue") {
            g_selectedColor = blueSelect
        }
        else {
            g_selectedColor = savedSelect
        }
    }
    // Color Sliders
    document.getElementById('redSlider').addEventListener('mouseup',
        function() {g_selectedColor[0] = this.value / 100; });
    document.getElementById('grnSlider').addEventListener('mouseup',
        function() {g_selectedColor[1] = this.value / 100; });
    document.getElementById('bluSlider').addEventListener('mouseup',
        function() {g_selectedColor[2] = this.value / 100; });
    document.getElementById('alpSlider').addEventListener('mouseup',
        function() {g_selectedColor[3] = this.value / 100; });

    // Size
    document.getElementById('sizeSlider').addEventListener('mouseup',
        function() {g_selectedSize = this.value; });
    
    // Sides
    document.getElementById('sidesSlider').addEventListener('mouseup',
        function() {g_selectedSides = this.value; });

    // Drawing
    document.getElementById('drawing').onclick = function() {
        drawSlide()
        renderAllShapes
    }
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
    gl.clear(gl.COLOR_BUFFER_BIT);
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
    console.log(point.position)
    console.log(point.color)
    
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

function renderAllShapes() {
    // Clear <canvas>
    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = g_shapesList.length;
    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();

        // // Pass the position of a point to a_Position variable
        // gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // // Pass the color of a point to u_FragColor variable
        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // // Draw
        // gl.drawArrays(gl.POINTS, 0, 1);
    }

    var duration = performance.now() - startTime
    sendTextToHTML("numdot " + len +
                    " ms: " + Math.floor(duration) +
                    " fps: " + Math.floor(10000/duration),
                    "numdot");
}

function sendTextToHTML(text, htmlID) {
    var htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}

function drawSlide() {
    gl.uniform4f(u_FragColor, 0.0, 0.6, 0.8, 1.0)
    // sky
    drawTriangle([-1, -1, -1, 1, 1, 1])
    drawTriangle([-1, -1, 1, -1, 1, 1])
    // grass
    gl.uniform4f(u_FragColor, 0.2, 1.0, 0.1, 1.0)
    drawTriangle([-1, -1, -0.4, -0.4, -0.4, -1])
    drawTriangle([-0.4, -1, -0.4, -0.4, 1, -0.4])
    drawTriangle([1, -0.4, 1, -1, -0.4, -1])
    gl.uniform4f(u_FragColor, 0.2, 1.0, 0.1, 0.7)
    drawTriangle([0, 0, -1, 0, -1, -1])
    drawTriangle([0, 0, 0.4, -0.4, -0.4, -0.4])
    // slide
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 0.7)
    drawTriangle([-0.04, 0.04, -0.25, 0.04, -0.25, -0.4])
    drawTriangle([-0.04, 0.04, 0.25, 0.04, 0.25, -0.4])
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 0.8)
    drawTriangle([-0.25, -0.4, 0.25, -0.4, -0.5, -0.6])
    drawTriangle([0, -0.6, 0.25, -0.4, -0.5, -0.6])
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 0.85)
    drawTriangle([-0.5, -0.6, 0, -0.6, 0.25, -0.8])
    drawTriangle([-0.5, -0.6, -0.3, -0.8, 0.25, -0.8])
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 0.9)
    drawTriangle([0.25, -0.8, -0.3, -0.8, -0.6, -1])
    drawTriangle([0.25, -0.8, -0.1, -1, -0.6, -1])
}