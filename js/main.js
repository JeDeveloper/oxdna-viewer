//Setup the scene and renderer and camera 
var scene = new THREE.Scene();
// make the background white 
// default is black
scene.background = new THREE.Color();

var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

// set camera position 
camera.position.z = 100;


var renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer : true, 
    alpha : true,
    antialias : true
});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


// set scene lighting 
//var light = new THREE.AmbientLight(0x404040);
//light.intensity = 3;
//scene.add(light);
var lights = [];
lights[0] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[1] = new THREE.PointLight( 0xffffff, 1, 0 );
lights[2] = new THREE.PointLight( 0xffffff, 1, 0 );

lights[0].position.set( 0, 200, 0 );
lights[1].position.set( 100, 200, 100 );
lights[2].position.set( - 100, - 200, - 100 );

scene.add( lights[0] );
scene.add( lights[1] );
scene.add( lights[2] );

// base geometry 
var backbone_geometry = new THREE.SphereGeometry(.3,10,10);
var nucleoside_geometry = new THREE.SphereGeometry(.3,10,10);

// define strand colors 
var backbone_materials = [
    new THREE.MeshLambertMaterial({
        color: 0x156289,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        color: 0xFF0089,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        color: 0xFFFF00,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        color: 0x00FF00,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        color: 0x00FFFF,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        color: 0x888888,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    })
];

// define nucleoside colors
var nucleoside_materials = [
    new THREE.MeshLambertMaterial({
        //color: 0x3333FF,
        color: 0x888888,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        //color: 0xFFFF33,
        color: 0x888888,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        //color: 0x33FF33,
        color: 0x888888,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    }),
    new THREE.MeshLambertMaterial({
        //color: 0xFF3333,
        color: 0x888888,
        //emissive: 0x072534,
        side: THREE.DoubleSide,
        //flatShading: true
    })
];

var selection_material = new THREE.MeshLambertMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
});

// scene update call definition
function render(){
    renderer.render(scene, camera);
}


// add base index visualistion
var backbones = []; 
var nucleosides = [];
document.addEventListener('mousedown', event => {
    // magic ... 
    var mouse3D = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1,   
                                    -( event.clientY / window.innerHeight ) * 2 + 1,  
                                     0.5 );
    var raycaster =  new THREE.Raycaster();
    // cast a ray from mose to viewpoint of camera 
    raycaster.setFromCamera( mouse3D, camera );
    // callect all objects that are in the vay
    var intersects = raycaster.intersectObjects(backbones);
    if (intersects.length > 0){
        // highlite the bases we've clicked 
        intersects[0].object.material = selection_material;
        // give index using global base coordinates 
        console.log(backbones.indexOf(intersects[0].object));
        render();
    }
});

// snippet borrowed from three.js examples 
// adding mouse controll to the scene 
var orbit = new THREE.OrbitControls( camera, renderer.domElement );
orbit.addEventListener('change', render);
  

// define the drag and drop behavior of the scene 
var target = renderer.domElement;
target.addEventListener("dragover", function(event) {
    event.preventDefault();
}, false);
// the actual code to drop in the config files 
target.addEventListener("drop", function(event) {

    // cancel default actions
    event.preventDefault();

    var i = 0,
        files = event.dataTransfer.files,
        len = files.length;
    
    var strand_to_material = {};
    var base_to_material = {};
    var base_to_num = {
        "A" : 0,
        "G" : 1,
        "C" : 2,
        "T" : 3,
        "U" : 3 
    };
    // get the extention of one of the 2 files 
    let ext = files[0].name.slice(-3);
    // space to store the file paths 
    let dat_file = null,
        top_file = null;
    // assign files to the extentions 
    if (ext === "dat"){
        dat_file = files[0];    
        top_file = files[1];    
    }
    else{
        dat_file = files[1];
        top_file = files[0];
    }
    
    //read topology file
    let top_reader = new FileReader();
    top_reader.onload = ()=> {
        // parse file into lines 
        var lines = top_reader.result.split(/[\r\n]+/g);
        lines = lines.slice(1); // discard the header  
        lines.forEach(
            (line, i) => {
                let l = line.split(" "); 
                let id = parseInt(l[0]); // get the strand id 
                let base = l[1]; // get base id
                // create a lookup for
                // coloring base according to base id
                base_to_material[i] = nucleoside_materials[base_to_num[base]];
                // coloring bases according to strand id 
                strand_to_material[i] = backbone_materials[Math.floor(id % backbone_materials.length )];
            });
    };
    top_reader.readAsText(top_file);

    // read a configuration file 
    let dat_reader = new FileReader();
    dat_reader.onload = ()=>{
        // parse file into lines 
        var lines = dat_reader.result.split(/[\r\n]+/g);
        
        //get the simulation box size 
        let box = parseFloat(lines[1].split(" ")[3])

        // everything but the header 
        lines = lines.slice(3);
        
        // calculate offset to have the first strand @ the scene origin 
        let first_line = lines[0].split(" ");
        // parse the coordinates
        let fx = parseFloat(first_line[0]), 
            fy = parseFloat(first_line[1]),
            fz = parseFloat(first_line[2]);
        
        // add the bases to the scene
        lines.forEach((line, i) => {
            // consume a new line 
            l = line.split(" ");
            
            // adds a new "backbone" and new "nucleoside" to the scene
            var backbone = new THREE.Mesh( backbone_geometry, strand_to_material[i] );
            var nucleoside = new THREE.Mesh( backbone_geometry, base_to_material[i])
            backbones.push(backbone);
            scene.add(backbone);
            nucleosides.push(nucleoside);
            scene.add(nucleoside);
            // shift coordinates such that the 1st base of the  
            // 1st strand is @ origin 
            let x = parseFloat(l[0])- fx, 
                y = parseFloat(l[1])- fy,
                z = parseFloat(l[2])- fz;
            
            // compute offset to bring strand in box
            let dx = Math.round(x / box) * box,
                dy = Math.round(x / box) * box,
                dz = Math.round(x / box) * box;
            
            //fix coordinates 
            x = x - dx;
            y = y - dx;
            z = z - dx;

            // extract axis vector
            let x_av = parseFloat(l[3]),
                y_av = parseFloat(l[4]),
                z_av = parseFloat(l[5]);

            // compute backbone cm
            let x_bb = x - 0.4 * x_av,
                y_bb = y - 0.4 * y_av,
                z_bb = z - 0.4 * z_av;

            backbone.position.set(x_bb, y_bb, z_bb); 
            
            // get nucleoside cm
            let x_ns = x + 0.4 * x_av,
                y_ns = y + 0.4 * y_av,
                z_ns = z + 0.4 * z_av;

            nucleoside.position.set(x_ns, y_ns, z_ns);

        });
        // update the scene
        render();
        
    };
    // execute the read operation 
    dat_reader.readAsText(dat_file);

}, false);

// update the scene
render();
