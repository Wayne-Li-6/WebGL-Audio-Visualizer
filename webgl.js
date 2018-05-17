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
 * Function that creates and draws a full screen quad and draws the 2D [texture]
 * on top of said quad. [texture2] is used in the final step of the bloom filter
 * when combining the blurred image and the original image; [combine] is true.
 */
function createAndDrawFullScreenQuad(gl, program, texture, original_texture, combine) {
    var vertices = [
        -1.0, -1.0, 0.0,
        0.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 0.0,
        1.0, 1.0, 0.0,
        1.0, 1.0,
        -1.0, 1.0, 0.0,
        0.0, 1.0
    ];
    var indices = [ 0, 1, 2, 0, 2, 3 ];

    var vertexArray = new Float32Array(vertices);
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexArray = new Uint16Array(indices);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.useProgram(program);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
    if (combine) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, original_texture);
        gl.uniform1i(gl.getUniformLocation(program, "original_texture"), 1);
    } else {
        gl.uniform1f(gl.getUniformLocation(program, "blur"), BLUR_AMOUNT);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var vertPosition = gl.getAttribLocation(program, "vert_position");
    gl.enableVertexAttribArray(vertPosition);
    gl.vertexAttribPointer(vertPosition, 3, gl.FLOAT, false, 4 * 5, 0);
    var vertTexCoord = gl.getAttribLocation(program, "vert_texCoord");
    gl.enableVertexAttribArray(vertTexCoord);
    gl.vertexAttribPointer(vertTexCoord, 2, gl.FLOAT, false, 4 * 5, 4 * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.useProgram(null);
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
function drawShape(gl, program, shape, xf, proj, norm, cam_r, face_mode) {
    gl.useProgram(program);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "cameraRotation"), false, cam_r);
    gl.uniform3f(gl.getUniformLocation(program, "e_color"), E_COLOR[0], E_COLOR[1], E_COLOR[2]);

    gl.useProgram(null);
}

/**
 * Function to create a blank float texture (taken from Lecture 7 Exhibit 0)
 */
function createFloatTexture(gl, width, height) {
    gl.getExtension("OES_texture_float");
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

/**
 * Creates a double buffer object with a read buffer, write buffer, as well as
 * an original_image buffer (used for the final step in bloom filter)
 */
function createDoubleBuffer(gl, width, height) {
    var output = {
        textures: [],
        readBufferIndex: 0,
        original_image: createFloatTexture(gl, width, height),
        getReadBuffer: function() {
            return this.textures[this.readBufferIndex];
        },
        getWriteBuffer: function() {
            return this.textures[1 - this.readBufferIndex];
        },
        swap: function() {
            this.readBufferIndex = 1 - this.readBufferIndex;
        },
        getOriginal: function() {
            return this.original_image;
        }
    };
    output.textures.push(createFloatTexture(gl, width, height));
    output.textures.push(createFloatTexture(gl, width, height));
    return output;
}

/**
 * The first step of the bloom filter; uses a Frame Buffer Object to render the 
 * 3D mesh scene into a 2D texture. Makes a copy of this texture and stores it
 * in the double_buffer's original image as well.
 */
function fboBright(gl, fbo, double_buffer, program, shape, xf, proj, norm, cam_r, face_mode, pass) {
    // 1. bind fbo and clear buffers
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // 2. attach write texture to fbo
    if (pass == 0) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, double_buffer.getWriteBuffer(), 0);
    } else {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, double_buffer.getOriginal(), 0);
    }
    // 3. render as normal
    drawShape(gl, program, shape, xf, proj, norm, cam_r, false);
    gl.flush();
    // 4. detach write texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    // 5. unbind fbo
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
 * The blurring step of the Bloom filter; uses a Frame Buffer Object to blur the
 * image and write it to a write buffer in [double_buffer]. 
 */
function fboBlur(gl, fbo, double_buffer, blur_program) {
    // 1. bind fbo and clear buffers
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // 2. attach texture to fbo
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, double_buffer.getWriteBuffer(), 0);
    // 3. render as normal
    createAndDrawFullScreenQuad(gl, blur_program, double_buffer.getReadBuffer(), null, false);
    gl.flush();
    // 4. detach texture
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
    // 5. unbind the fbo
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
