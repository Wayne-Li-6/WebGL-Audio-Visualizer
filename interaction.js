/**
 * Loads in a mesh file that the user has uploaded to the website. Reads in the
 * mesh file and converts it into a string representation that can be parsed.
 */
function loadMeshFile(file) {
    var input = file.target;
    var reader = new FileReader();
    reader.onload = function(){
        mesh = createMesh(reader.result);
        runWebGL(mesh);
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
 * and noramal in a triangle. Also contains the number of samples for the FFT
 * as the next power of 2 >= to the number of vertices.
 */
function createMesh(text) {
    var vertices = [];
    var v_indices = [];
    var normals = [];
    var n_indices = [];
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
            case 'n':
                normals.push(parseFloat(line[1]));
                normals.push(parseFloat(line[2]));
                normals.push(parseFloat(line[3]));
                break;
            case 'f':
                for (var j = 1; j <= 3; j++) {
                    var idx = line[j].split("/");
                    v_indices.push(parseInt(idx[0]));
                    n_indices.push(parseInt(idx[1]));
                }
                break;
        }
    }
    n = Math.ceil(Math.log2(n));
    return {
        sample_number: Math.pow(2,n),
        vertices: vertices,
        v_indices: v_indices,
        normals: normals,
        n_indices: n_indices
    };
}
