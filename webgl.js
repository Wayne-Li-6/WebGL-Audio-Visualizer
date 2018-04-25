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
 * Function to modify the mesh vertices and translate their positions in the 
 * direction specified by their normals. The amount translated depends on the
 * vertex's associated frequency bin in the FFT.
 */
function transform(mesh, FFT) {
    var vertices = mesh.vertices.slice();
    for (var i = 0; i < mesh.n_indices.length; i++) {
        var normal = mesh.normals.slice(3*mesh.n_indices[i], 3*mesh.n_indices[i]+3);
        if (FFT[i] > 0){
            vertices[3*mesh.v_indices[i]] += FFT[i] * mesh.normals[mesh.n_indices[i]];
            vertices[3*mesh.v_indices[i]+1] += FFT[i] * mesh.normals[mesh.n_indices[i]+1];
            vertices[3*mesh.v_indices[i]+2] += FFT[i] * mesh.normals[mesh.n_indices[i]+2];
        }
    }
    return vertices;
}
