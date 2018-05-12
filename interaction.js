//var MESH = {};
var FIRST = true;
var CHANGED = false;
/**
 * Loads in a mesh file that the user has uploaded to the website. Reads in the
 * mesh file and converts it into a string representation that can be parsed.
 */
function loadMeshFile(file) {
    var input = file.target;
    var reader = new FileReader();
    reader.onload = function(){
        var mesh = createMesh(reader.result);
        runWebGL(mesh);
        // runWebGL();
    }
    reader.readAsText(input.files[0]);
}

/**
 * Loads in an audio file that the user has uploaded to the website. The target
 * URL is set to the input file and linked to the audio tag in the HTML.
 */
function loadAudioFile(file) {
    var input = file.target;
    var audio = document.getElementById("user-audio");
    audio.src = URL.createObjectURL(input.files[0]);
}

/**
 * Takes in a string representation of an obj file and creates the 
 * associated mesh; contains vertices, normals, and the indices of each vertex 
 * and normals in a triangle. Also contains the number of samples for the FFT
 * as the next power of 2 >= to the number of vertices.
 */
function createMesh(text) {
    var vertices = [];
    var normals = [];
    var face_indices = [];
    var line_indices = [];
    var vertex_to_normal = new Map();
    var n = 0;

    var all_lines = text.split("\n");
    for (var i = 0; i < all_lines.length; i++) {
        var line = all_lines[i].split(/[ ,]+/);
        switch (line[0]) {
            case 'v':
                vertices.push(parseFloat(line[1]));
                vertices.push(parseFloat(line[2]));
                vertices.push(parseFloat(line[3]));
                n++;
                break;
            case 'vn':
                normals.push(parseFloat(line[1]));
                normals.push(parseFloat(line[2]));
                normals.push(parseFloat(line[3]));
                break;
            case 'f':
                var idx1 = line[1].split("//");         // [v1, n1]
                var idx2 = line[2].split("//");         // [v2, n2]
                var idx3 = line[3].split("//");         // [v3, n3]
                // map v1 -> n1
                vertex_to_normal.set(parseInt(idx1[0]), parseInt(idx1[1]));     
                // map v2 -> n2
                vertex_to_normal.set(parseInt(idx2[0]), parseInt(idx2[1]));     
                // map v3 -> n3
                vertex_to_normal.set(parseInt(idx3[0]), parseInt(idx3[1]));     
                // edge (v1,v2)
                line_indices.push(parseInt(idx1[0]),parseInt(idx2[0]));
                // edge (v2,v3)
                line_indices.push(parseInt(idx2[0]),parseInt(idx3[0]));
                // edge (v3,v1)
                line_indices.push(parseInt(idx3[0]),parseInt(idx1[0]));
                // face (v1, v2, v3)
                face_indices.push(parseInt(idx1[0]));
                face_indices.push(parseInt(idx2[0]));
                face_indices.push(parseInt(idx3[0]));
                break;
        }
    }
    var exp = Math.ceil(Math.log2(n));
    return {
        sample_number: Math.pow(2,exp),
        vertices: vertices,
        normals: normals,
        line_indices: line_indices,
        face_indices: face_indices,
        vertex_to_normal: vertex_to_normal
    };
}

// Current position of the camera in 3D space
var CAMERA_LOCATION = vec3.fromValues(0.0, 1.0, 3.0);
// Current field-of-view of the camera (in radians)
var CAMERA_FOV = Math.PI/6;
// Current horizontal axis-of-rotation
var HORIZONTAL_AOR = vec3.fromValues(0.0, 1.0, 0.0);
// Current vertical axis-of-rotation
// var VERTICAL_AOR = vec3.fromValues(1.0, 0.0, 0.0);
// Left rotation matrix (5 degrees)
var LEFT_ROT_M = mat4.create();
// Right rotation matrix (5 degrees)
var RIGHT_ROT_M = mat4.create();
// Up translation matrix
var UP_TRANS_M = mat4.create();
// Down translation matrix
var DOWN_TRANS_M = mat4.create();

/**
 * Callback function for user-inputted keypress:
 * left arrow key: rotates camera to the left around the camera targer
 * right arrow key: rotates camera to the right around the camera targer
 * up arrow key: moves camera in the upwards direction (+z-axis)
 * down arrow key: moves camera in the downwards direction (-z-axis)
 */
$("#webglCanvas").on("keydown", function (key) {
    // TODO: Edit this so that the crawler responds to the arrow keys.
    key.preventDefault();
    switch (key.keyCode) {
        case 37:        // left arrow key
            mat4.fromRotation(LEFT_ROT_M, -0.0872665, HORIZONTAL_AOR);
            vec3.transformMat4(CAMERA_LOCATION, CAMERA_LOCATION, LEFT_ROT_M);
            break;
        case 39:        // right arrow key
            mat4.fromRotation(RIGHT_ROT_M, 0.0872665, HORIZONTAL_AOR);
            vec3.transformMat4(CAMERA_LOCATION, CAMERA_LOCATION, RIGHT_ROT_M);
            break;
        case 38:        // up arrow key
            mat4.fromTranslation(UP_TRANS_M, [0.0, 0.1, 0.0]);
            vec3.transformMat4(CAMERA_LOCATION, CAMERA_LOCATION, UP_TRANS_M);
            break;
        case 40:        // down arrow key
            mat4.fromTranslation(DOWN_TRANS_M, [0.0, -0.1, 0.0])
            vec3.transformMat4(CAMERA_LOCATION, CAMERA_LOCATION, DOWN_TRANS_M);
            break;
    }
});

/**
 * Callback function for user-inputted mousewheel scroll:
 * scrolling up: zooms camera in and decreases the FOV
 * scrolling down: zooms camera out and increases the FOV
 */
$("#webglCanvas").on("wheel", function(wheel) {
    var delta = wheel.originalEvent.deltaY;
    if (delta > 0) {
        if (CAMERA_FOV >= 1.309) CAMERA_FOV = 1.309;
        else CAMERA_FOV += 0.0872665;
    }
    else {
        if (CAMERA_FOV <= 0.174533) CAMERA_FOV = 0.174533;
        else CAMERA_FOV -= 0.0872665;
    }
    return false;
});