/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var lookat = new vec3.fromValues(.5,.5,1);
var viewup = new vec3.fromValues(0,1,0);

/* webgl globals */
var bgColor = 0;
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var diffuseBuffer;
var diffusePositionAttrib;
var ambientBuffer;
var ambientPositionAttrib;
var specularBuffer;
var specularPositionAttrib;
var normalsBuffer;
var normalsPositionAttrib;
var nBuffer;
var nPositionAttrib;
var originBuffer;
var originPositionAttrib;
var selectionBuffer;
var selectionPositionAttrib;
var key;
var diffuseArray = [];
var ambientArray = [];
var specularArray = [];
var normalsArray = [];
var nArray = [];
var numberOfSets;
var selection = [];
var setArray = [];
var currentS = -1;
var orgArray = [];
var translateMatrix;


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var indexArray = [];
        var vtxBufferSize = 0;
        var vtxToAdd = [];
        var indexOffset = vec3.create();
        var triToAdd = vec3.create();
        var currentDiff;
        var currentAmb;
        var currentSpecular;
        var currentNormals;
        var currentN;
        var curO = [];
        
        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
        	setArray.push([]);
            vec3.set(indexOffset, vtxBufferSize, vtxBufferSize, vtxBufferSize);
            currentDiff = inputTriangles[whichSet].material.diffuse;
            currentAmb = inputTriangles[whichSet].material.ambient;
            currentSpecular = inputTriangles[whichSet].material.specular;
            numberOfSets = inputTriangles.length;
            currentN = inputTriangles[whichSet].material.n;
            cur0 = [0,0,0];
            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
            	setArray[whichSet].push(0);
            	selection.push(0);
            	vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
            	currentNormals = inputTriangles[whichSet].normals[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                diffuseArray.push(currentDiff[0], currentDiff[1], currentDiff[2]);
                ambientArray.push(currentAmb[0], currentAmb[1], currentAmb[2]);
                specularArray.push(currentSpecular[0], currentSpecular[1], currentSpecular[2]);
                normalsArray.push(currentNormals[0], currentNormals[1], currentNormals[2]);
                nArray.push(currentN);
                cur0 = [cur0[0] + vtxToAdd[0], cur0[1] + vtxToAdd[1], cur0[2] + vtxToAdd[2] ];
                // console.log(inputTriangles[whichSet].vertices[whichSetVert]);
            }
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            }
            vtxBufferSize += inputTriangles[whichSet].vertices.length; // total number of vertices
            triBufferSize += inputTriangles[whichSet].triangles.length; // total number of tris
            for (var j = 0; j < 3; j++) {
            	curO[j] = cur0[j] / inputTriangles[whichSet].vertices.length;
            }
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){
            	orgArray.push(cur0[0], cur0[1], cur0[2]);
            }
            
        } // end for each triangle set
        triBufferSize *= 3;
        // console.log(coordArray.length);
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer
        
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW);
        
        diffuseBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseArray), gl.STATIC_DRAW);
        
        ambientBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientArray), gl.STATIC_DRAW);
        
        specularBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularArray), gl.STATIC_DRAW);
        
        normalsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsArray), gl.STATIC_DRAW);
        
        nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(nArray), gl.STATIC_DRAW);
        
        selectionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,selectionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsArray), gl.STATIC_DRAW);
        
        originBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,originBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selection), gl.STATIC_DRAW);
        
        
        
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    
	
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
    	precision mediump float;
    	varying vec4 vColor;
        
        uniform vec3 eye;
    	uniform vec3 light;
    	uniform mat4 lookAt;
    	uniform mat4 perspective;
    	
        void main(void) {
            gl_FragColor = vColor;
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
    	precision mediump float;
        attribute vec3 vertexPosition;
        attribute vec3 diffuseColor;
        attribute vec3 ambientColor;
        attribute vec3 specularColor;
        attribute vec3 normal;
        attribute float n;
        attribute vec3 origin;
        attribute vec3 selection;
        
        varying vec4 vColor;
    	
    	uniform vec3 eye;
    	uniform vec3 light;
    	uniform mat4 lookAt;
    	uniform mat4 frust;
    	uniform mat4 scale;
    	

        void main(void) {
            gl_Position = frust * lookAt * vec4(vertexPosition, 1.0); // use the untransformed position
          	vec3 lightV = normalize(light - vertexPosition);
          	vec3 viewV = normalize(eye - vertexPosition); 
          	vec3 hV = normalize(viewV + lightV);
          	vec3 diffC = diffuseColor * dot(normal, lightV);
          	vec3 ambC = ambientColor;
          	vec3 specC = specularColor * pow(dot(normal, hV), n); 
          	vColor = vec4(diffC + ambC + specC, 1.0);
            
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input
                diffusePositionAttrib = gl.getAttribLocation(shaderProgram, "diffuseColor");
                ambientPositionAttrib = gl.getAttribLocation(shaderProgram, "ambientColor");
                specularPositionAttrib = gl.getAttribLocation(shaderProgram, "specularColor");
                normalsPositionAttrib = gl.getAttribLocation(shaderProgram, "normal");
                nPositionAttrib = gl.getAttribLocation(shaderProgram, "n");
                originPositionAttrib = gl.getAttribLocation(shaderProgram, "origin");
                selectionPositionAttrib = gl.getAttribLocation(shaderProgram, "selection");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array
                gl.enableVertexAttribArray(diffusePositionAttrib);
                gl.enableVertexAttribArray(ambientPositionAttrib);
                gl.enableVertexAttribArray(specularPositionAttrib);
                gl.enableVertexAttribArray(normalsPositionAttrib);
                gl.enableVertexAttribArray(nPositionAttrib);
                gl.enableVertexAttribArray(originPositionAttrib);
                gl.enableVertexAttribArray(selectionPositionAttrib);
                var eye = gl.getUniformLocation(shaderProgram, "eye");
                gl.uniform3f(eye, Eye[0], Eye[1], Eye[2]);
                var light = gl.getUniformLocation(shaderProgram, "light");
                gl.uniform3f(light, -3.0, 1.0, -0.5);
                //debugger;
                var lookAtn = gl.getUniformLocation(shaderProgram, "lookAt");
                var lookAtMat = mat4.create();
                //var o = vec3.fromValues(.5,.5,.5);
                mat4.lookAt(lookAtMat, Eye,lookat, viewup);
                gl.uniformMatrix4fv(lookAtn, false, lookAtMat);
                var frust = gl.getUniformLocation(shaderProgram, "frust");
                var frus = mat4.create();
                mat4.frustum(frus, -1, 1, -1, 1, 1, 10);
                gl.uniformMatrix4fv(frust, false, frus);
                var scal = gl.getUniformLocation(shaderProgram, "scale");
                var scalM = mat4.create();
                
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
	setupShaders();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    keyPressedMovement();
    key = null;
    requestAnimationFrame(renderTriangles);
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(diffusePositionAttrib,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(ambientPositionAttrib,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(specularPositionAttrib,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(normalsPositionAttrib,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint16Array(nArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(nPositionAttrib,1,gl.SHORT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, originBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(orgArray), gl.STATIC_DRAW);
    gl.vertexAttribPointer(originPositionAttrib,3,gl.FLOAT,false,0,0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, selectionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(selection), gl.STATIC_DRAW);
    gl.vertexAttribPointer(selectionPositionAttrib,3,gl.FLOAT,false,0,0);

    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT, 0); // render
    
} // end render triangles

function keyPressedMovement() {
	if (key == "a") {
		var a = vec3.fromValues( -0.1, 0, 0);
		vec3.add(Eye, Eye, a);
		vec3.add(lookat, lookat, a);
	}
	if (key == "d") {
		var d = vec3.fromValues(0.1, 0, 0);
		vec3.add(Eye, Eye, d);
		vec3.add(lookat, lookat, d);
	}
	if (key == "w") {
		var a = vec3.fromValues( 0, 0, -0.1);
		vec3.add(Eye, Eye, a);
		vec3.add(lookat, lookat, a);
	}
	if (key == "s") {
		var d = vec3.fromValues(0, 0, 0.1);
		vec3.add(Eye, Eye, d);
		vec3.add(lookat, lookat, d);
	}
	if (key == "q") {
		var a = vec3.fromValues( 0, -0.1, 0);
		vec3.add(Eye, Eye, a);
		vec3.add(lookat, lookat, a);
	}
	if (key == "e") {
		var d = vec3.fromValues(0, 0.1, 0);
		vec3.add(Eye, Eye, d);
		vec3.add(lookat, lookat, d);
	}
	if (key == "A") {
		var a = vec3.fromValues( -0.1, 0, 0);
		vec3.add(lookat, lookat, a);
	}
	if (key == "D") {
		var d = vec3.fromValues( 0.1, 0, 0);
		vec3.add(lookat, lookat, d);
	}
	if (key == "W") {
		var a = vec3.fromValues(0,  -0.1, 0);
		vec3.add(lookat, lookat, a);
	}
	if (key == "S") {
		var d = vec3.fromValues(0, 0.1, 0);
		vec3.add(lookat, lookat, d);
	}
	if (key == "ArrowLeft") {
		if (currentS == -1) {
			currentS = setArray.length - 1;
		}
		else {
			currentS = currentS - 1;
			if (currentS < 0) {
				currentS = setArray.length - 1;
			}
		}
		
		select();
	}
	if (key == "ArrowRight") {
		currentS = (currentS + 1) % (setArray.length);
		select();
	}
}


	
/* MAIN -- HERE is where execution begins after window load */

function main() {
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  //setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL;
  
} // end main


$(document).keydown( function(e) {
	key = e.key;
	console.log(key);
	
});
