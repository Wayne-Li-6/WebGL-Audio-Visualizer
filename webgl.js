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
 * [vertices] as well as the line index buffer from [line_indices]. These help
 * to specify which pair of vertices need to have an edge draw between them.
 */
function createShape(gl, vertices, line_indices) {
    var shape = {};

    shape.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    shape.triangleLineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleLineIndexBuffe);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(line_indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    shape.vertLen = vertices.length;
    shape.idxLen = line_indices.length;
    return shape;
}

/**
 * This function draws the [shape] to the canvas using the shaders specified by
 * [program]. Also sets the model-view matrix [xf] and the projection matrix
 * [proj] as uniform variables in the fragment shader.
 */
function drawShape(gl, program, shape, xf, proj) {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
    var positionLocation = gl.getAttribLocation(program, "vert_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 4*3, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.triangleIndexBuffer);
    gl.drawElements(gl.LINES, shape.idxLen, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelView"), false, xf);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projection"), false, proj);

    gl.useProgram(null);
}

/**
 * Function to modify the [mesh] vertices and translate their positions in the 
 * direction specified by their normals. The amount translated depends on the
 * vertex's associated frequency bin in the [FFT] array.
 */
function transform(mesh, FFT) {
    var vertices = mesh.vertices.slice();
    for (var i = 0; i < vertices.length; i+=3) {
        var normal_idx = mesh.vertex_to_normal.get(i/3) * 3;
        var fft_idx = (i/3);
        if (FFT[fft_idx] > 0) {
            vertices[i] += FFT[fft_idx] * mesh.normals[normal_idx];
            vertices[i+1] += FFT[fft_idx] * mesh.normals[normal_idx+1];
            vertices[i+2] += FFT[fft_idx] * mesh.normals[normal_idx+2];
        }
    }
    return vertices;
}
