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

// Global Variables
let isDown = false;
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let cursorPosition = [0, 0];


let g_globalAngle = 0;
let g_globalRot = 0;

let idleAnimate = false;
let flapAnimate = false;
let spinAnimate = false;
let g_legAngle = -10;
let g_earAngle = 40;
let g_trunkAngle = -35;

let g_trunk1Angle = -3;
let g_trunk2Angle = -3;
let g_trunk3Angle = -3;

let g_tailAngle = 0;
let g_headAngle = 0;
let g_testAngle = 0;

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

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
    // Mouse rotation
        // Track mousedown, mouseup, mousemove
    var currpos = {
        x: 0,
        y: 0,
    }
    var downFlag = false;
    delta = 100;
    var dx, dy = 0;

    canvas.onmousedown = function (down) {
        //console.log('Mouse Down')
        downFlag = true;
        let omd = convertCoordinatesEventToGL(down)
        currpos.x = omd[0];
        currpos.y = omd[1];
        //console.log('x: ' + currpos.x + ' y: ' + currpos.y);
    }
    canvas.onmouseup = function (up) {
        //console.log('Mouse Up')
        downFlag = false;
        // newpos = convertCoordinatesEventToGL(up);
        // dx = newpos[0] - currpos.x;
        // dy = newpos[1] - currpos.y;
        // g_globalAngle += (dx * delta);
        // console.log('New Angle' + g_globalAngle);
    }
    canvas.onmousemove = function (move) {
        //console.log('Angle' + g_globalAngle);
        if (!downFlag) {
            return;
        }
        else {
            newpos = convertCoordinatesEventToGL(move);
            dx = newpos[0] - currpos.x;
            dy = newpos[1] - currpos.y;
            g_globalAngle -= (dx * delta);
            currpos.x = newpos[0];
            currpos.y = newpos[1];
            dx = 0;
            dy = 0;
            document.getElementById('angleValue').innerText = Math.floor(g_globalAngle) % 360;
        }
    }

    // Shift detection
    canvas.addEventListener("click", function (e) {
        if (e.shiftKey) {
            spinAnimate = true;
            document.getElementById('currentAnimation').innerText = "You Can't See Me"
            document.getElementById('elephName').innerText = "JOHNNNNN CENAAAAAAA"
        }
    })


    // Leg Segment Slider
    document.getElementById('legSlider').addEventListener('mousemove',
        function() {g_legAngle = this.value; renderAllShapes(); });

    // Ear Segment Slider
    document.getElementById('earSlider').addEventListener('mousemove',
        function() {g_earAngle = this.value; renderAllShapes(); })

    // Trunk Whole Slider
    document.getElementById('trunkSlider').addEventListener('mousemove',
        function() {g_trunkAngle = this.value; renderAllShapes(); })

    // Trunk Segments Sliders
    document.getElementById('trunk1Slider').addEventListener('mousemove',
        function() {g_trunk1Angle = this.value; renderAllShapes(); })
    document.getElementById('trunk2Slider').addEventListener('mousemove',
        function() {g_trunk2Angle = this.value; renderAllShapes(); })
    document.getElementById('trunk3Slider').addEventListener('mousemove',
        function() {g_trunk3Angle = this.value; renderAllShapes(); })

    // Tail Slider
    document.getElementById('tailSlider').addEventListener('mousemove',
        function() {g_tailAngle = this.value; renderAllShapes(); })

    // Head Segment Slider
    document.getElementById('headSlider').addEventListener('mousemove',
        function() {g_headAngle = this.value; renderAllShapes(); })

    // Buttons
    // idleButton
    idleAnimation = document.getElementById('idleButton');
    idleAnimation.addEventListener('click', function (e) {
        idleAnimate = true;
        if(flapAnimate) {
            flapAnimate = false;
        }
        if(spinAnimate) {
            spinAnimate = false;
        }
    })
    // flapButton
    flapAnimation = document.getElementById('flapButton');
    flapAnimation.addEventListener('click', function (e) {
        flapAnimate = true;
        if(idleAnimate) {
            idleAnimate = false
        }
        if(spinAnimate) {
            spinAnimate = false;
        }
    })
    // clearAnimations
    clearAnimations = document.getElementById('clearButton').addEventListener('click', function (e) {
        flapAnimate = false;
        idleAnimate = false;
        spinAnimate = false;

        g_legAngle = -10;
        g_earAngle = 15;
        g_trunkAngle = -20;
        g_tailAngle = 0;
        g_headAngle = 0;
        g_testAngle = 0;
        g_trunk1Angle = -3;
        g_trunk2Angle = -3;
        g_trunk3Angle = -3;
            // leg, ear trunk, t1, t2, t3, tail, head, 
        document.getElementById('sliderForm').reset();
    })
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
    //canvas.onmousedown = click;
    //canvas.onmousemove = function(ev) { if(ev.buttons==1){ click(ev) }};

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    //gl.clear(gl.COLOR_BUFFER_BIT);
    // renderScene();

    requestAnimationFrame(tick);
}

//  var g_points = [];  // The array for the position of a mouse press
//  var g_colors = [];  // The array to store the color of a point
//  var g_sizes = [];

function click(ev) {
    // Extract the event click and return it in WebGL coords
    [x, y] = convertCoordinatesEventToGL(ev);
}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function tick() {
    // Update
    g_seconds = performance.now()/1000.0 - g_startTime;
    renderScene();
    requestAnimationFrame(tick);
    animate();
}

function renderScene() {
    renderAllShapes();
}

function animate() {
    if(idleAnimate) {
        idle();
    }
    if(flapAnimate) {
        flap();
    }
    if(spinAnimate) {
        spin();
    }
}

function idle() {
    g_headAngle = 10 * Math.cos(g_seconds);
    g_trunkAngle = 5 * Math.sin(g_seconds);
    g_tailAngle = 30 * Math.sin(g_seconds);
    g_legAngle = 5 * Math.sin(g_seconds / 2);
}

function flap() {
    g_earAngle = 30 * Math.cos(g_seconds * 2.1);
    g_headAngle = 10 * Math.cos(g_seconds * 2);
    g_trunkAngle = 10 * Math.sin(g_seconds * 2);
    g_legAngle = -10 * Math.abs(Math.sin(g_seconds));
    g_tailAngle = 1080 * Math.sin(g_seconds) * 2.5;
}

function spin() {
    g_trunkAngle = 45;
    g_legAngle = -50 * - Math.abs(Math.sin(g_seconds * 5));
    setTimeout(() => {
        spinAnimate = false;
        let reset = document.getElementById('clearButton');
        if(idleAnimate) {
            setTimeout(() => {
                document.getElementById('idleButton').click();
            }, 130)
        }
        else if (flapAnimate) {
            setTimeout(() => {
                document.getElementById('flapButton').click();
            }, 130)
        }
        else {
            reset.click();
        }
        document.getElementById('elephName').innerText = "Smarto the Elephant.";
    }, 1500);
}

function sendTextToHTML(text, htmlID) {
    var htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}