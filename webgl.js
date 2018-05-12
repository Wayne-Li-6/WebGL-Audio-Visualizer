/**
 * Initializes the canvas for a WebGL context the correct way.
 */
function initializeWebGL(canvas) {
    var gl = null; 
    try {
        gl = canvas[0].getContext("experimental-webgl");
        if (!gl) {
            gl = canvas[0].getContext("webgl");
        }
    } catch (error) {} // No-op 
    if (!gl) {
        alert("Could not get WebGL context!");
        throw new Error("Could not get WebGL context!");
    }
    return gl;
}

/**
 * Creates and compiles the appropriate shader specified by [shaderScriptId] 
 * for the WebGL context specified by [gl]; returns this shader.
 */
function createShader(gl, shaderScriptId) {
    var shaderScript = $("#" + shaderScriptId);
    var shaderSource = shaderScript[0].text;
    var shaderType = null;
    if (shaderScript[0].type == "x-shader/x-vertex") {
        shaderType = gl.VERTEX_SHADER;
    } else if (shaderScript[0].type == "x-shader/x-fragment") {
        shaderType = gl.FRAGMENT_SHADER;
    } else {
        throw new Error("Invalid shader type: " + shaderScript[0].type)
    }
    var shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var infoLog = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("An error occurred compiling the shader: " + infoLog);
    } else {
        return shader;
    }
}

/**
 * Creates a GLSL program and links the shaders created by [vertexShaderId] and
 * [fragmentShaderId] to this program; returns this program.
 */
function createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
    var program = gl.createProgram();
    gl.attachShader(program, createShader(gl, vertexShaderId));
    gl.attachShader(program, createShader(gl, fragmentShaderId));
    gl.linkProgram(program);
    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        var infoLog = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error("An error occurred linking the program: " + infoLog);
    } else {
        return program;
    }
}

/**
 * Creates the shape object that is to be drawn; creates the vertex buffer from
 * [vertices] array. Creates the line index buffer from [mesh].line_indices 
 * and the face index buffer from [mesh].face_indices. Line indices specify 
 * which pair of vertices to draw edges between while face indices specify 
 * which triple of vertices to draw a triangle face between.
 */
function createShape(gl, vertices, normals, mesh) {
    var shape = {};

    shape.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    shape.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    shape.triangleLineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleLineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.line_indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.triangleFaceIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleFaceIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.face_indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.vertLen = vertices.length;
    shape.lineIdxLen = mesh.line_indices.length;
    shape.faceIdxLen = mesh.face_indices.length;
    return shape;
}

/**
 * This function draws the [shape] to the canvas using the shaders specified by
 * [program]. Also sets the model-view matrix [xf] and the projection matrix
 * [proj] as uniform variables in the fragment shader. If [face_mode] is TRUE, 
 * then triangle faces are drawn to the screen in index triples. If [face_mode] 
 * is FALSE, then edges are drawn to the screen in index pairs instead.
 */
function drawShape(gl, program, shape, xf, proj, norm, face_mode) {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    var positionLocation = gl.getAttribLocation(program, "vert_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4*3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.normalBuffer);
    var normalLocation = gl.getAttribLocation(program, "vert_normal");
    gl.enableVertexAttribArray(normalLocation);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 4*3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    if (face_mode) {
        gl.uniform1i(gl.getUniformLocation(program, "isFace"), 1);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleFaceIndexBuffer);
        gl.drawElements(gl.TRIANGLES, shape.faceIdxLen, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        gl.uniform1i(gl.getUniformLocation(program, "isFace"), 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleLineIndexBuffer);
        gl.drawElements(gl.LINES, shape.lineIdxLen, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    } else {
        gl.uniform1i(gl.getUniformLocation(program, "isFace"), 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleLineIndexBuffer);
        gl.drawElements(gl.LINES, shape.lineIdxLen, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelView"), false, xf);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, proj);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "normal"), false, norm);

    gl.useProgram(null);
}

/**
 * Function to modify the [mesh] vertices and translate their positions in the 
 * direction specified by their normals. The amount translated depends on the
 * vertex's associated frequency bin in the [FFT] array. Also helps to create
 * a copy of the corresponding normal for each vertex and put it in an array.
 * Returns an array of size 2 with element 0 = vertices and element 1 = normals.
 */
function transform(mesh, FFT) {
    var vertices = mesh.vertices.slice();
    var normals = [];
    for (var i = 0; i < vertices.length; i+=3) {
        var normal_idx = mesh.vertex_to_normal.get(i/3) * 3;
        var fft_idx = (i/3);
        if (FFT[fft_idx] > 0) {
            vertices[i] += FFT[fft_idx] * mesh.normals[normal_idx];
            vertices[i+1] += FFT[fft_idx] * mesh.normals[normal_idx+1];
            vertices[i+2] += FFT[fft_idx] * mesh.normals[normal_idx+2];
        }
        normals.push(mesh.normals[normal_idx]);
        normals.push(mesh.normals[normal_idx+1]);
        normals.push(mesh.normals[normal_idx+2]);
    }
    return [vertices, normals];
}
