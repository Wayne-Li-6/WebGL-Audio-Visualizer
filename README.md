# CS 4621 Final Project
## WebGL Audio Visualizer

Instructions: Run `python -m SimpleHTTPServer`  
Current Camera Controls (subject to change):

| Input | Response |
| ----- | -------- |
| `up` arrow key | Translate the camera in the down direction (+z axis) |
| `down` arrow key | Translate the camera in the down direction (-z axis) |
| `left` arrow key | Rotate camera to the left around the camera target (currently fixed @ origin) |
| `right` arrow key | Rotate camera to the right around the camera target (currently fixed @ origin) |
| `up` mouse scroll | Zoom in towards camera target (decrease field-of-view) |
| `down` mouse scroll | Zoom out from camerat target (increase field-of-view) |

### TODO Tasks:
- [X] Proof of Concept (draw to the screen)
- [X] Create analyzer node to perform FFT and translate vertices according to frequency results
- [X] Read in and parse user-inputted mesh file
- [X] Allow user to upload audio (.mp3) file
- [X] Camera controls using keypresses and mouse
- [ ] Parameterize colors and allow user to choose appearance
- [ ] (IMPORTANT) Figure out double-buffering and bloom-filtering
- [X] (IMPORTANT) Figure out how to allow user to use built-in microphone to create their own audio that can be visualized
- [ ] Improve appearance/theme of application (fullscreen? ; move controls to sidebar? ; etc.)
- [ ] Add a default camera animation when the user is idle
- [ ] See if a skybox/background can be implemented without having a loss in quality due to any Gaussian blurs that we might use
- [ ] Allow more than one mesh per session (currently breaks if a different mesh from the original is uploaded)

### File Structure / Organization
`index.html` : The central script. Contains all of the HTML and CSS for the web application as well as the GLSL vertex and fragment shaders. Also has the "main" script which initializes the glEnvironment and prepares the update loop to start drawing frames.

`audio.js` : Contains any functionality that pertains to the audio aspect of the application. Initializes the AnalyzerNode and performs the FFT.

`interaction.js` : Controls all of the application's responses to the user. Contains functionality that pertains to user-input, such as loading in and parsing the mesh file and setting the audio file. Also contains important variables that pertain to the current camera parameters and callback functions that respond to keyboard and mouse events.

`webgl.js` : Anything related to using WebGL to draw. Contains most of the boilerplate code to set up the WebGL context and create, compile, and link the GLSL shaders into a program. Also has functions that set up the various vertex and index buffers. Creates/draws the shapes required by the mesh to the canvas by passing values to the appropriate shaders.

### Change Log
* April 30, 2018
    * Restructrued `audio.js` to allow for new audio mode where the user inputs their own audio through their microphone to be visualized
    * Changed around HTML to allow for two different audio modes (audio file and user-input); can easily switch between modes using radio buttons
* April 29, 2018
    * Fixed/augmented mesh file parsing to allow for both triangle faces mode and triangle edges mode; user selects rendering mode using a simple radio button
    * Added more complicated icosphere meshes in `assets` folder
    * Added initial basic camera controls (rotation left/right, translation up/down, zoom in/out) in `interaction.js`
    * Fixed minor bug in setting analyzer.fftSize
* April 28, 2018
    * Read in and parse a simplified .obj file to generate user-inputted mesh
    * Allowed user to upload their own audio file to be visualized
    * Translate vertices in the direction of their own respective normals
* April 24, 2018
    * Pushed initial proof of concept to git repository
    * Basic functionality includes drawing a simple triangle and performing a FFT on a predetermined audio file
    * Transform vertices all in same direction based on returned frequency values