/// <reference path="../typescript_definitions/index.d.ts" />
/// <reference path="../api/observable_api.ts" />
/// <reference path="../file_handling/file_reading.ts" />
/// <reference path="../main.ts" />
class DistanceHandler {
    constructor() {
        this.distances = new Array();
    }
    getHTML() {
        return this.distances.map(d => d.html);
    }
    append(e1, e2) {
        this.distances.push(new DistanceObservable(e1, e2, this));
    }
    overwrite(e1, e2) {
        this.distances[0] = new DistanceObservable(e1, e2, this);
    }
    delete(caller) {
        const index = this.distances.indexOf(caller);
        if (index > -1) {
            this.distances.splice(index, 1);
        }
    }
    update() {
        this.distances.forEach(d => d.compute());
    }
}
let distanceHandler = new DistanceHandler();
let boundDistanceUpdate = false;
function distanceSetup() {
    // On opening the window we want to bind
    // the update calls to the next conf loaded
    if (!boundDistanceUpdate) {
        trajReader.lookupReader.callback = api.observable.wrap(trajReader.lookupReader.callback, listDistances);
        boundDistanceUpdate = true;
    }
    listDistances();
}
;
function listDistances() {
    //call all updates and spit out the distance HTML
    distanceHandler.update();
    // console.log(distanceHandler.distances[0].dist)
    let distanceDOM = document.getElementById("distances");
    distanceDOM.innerText = "";
    distanceHandler.getHTML().forEach(d => distanceDOM.appendChild(d));
    render();
}
function measureDistanceFromSelection() {
    //create a new distance measurer
    let s = Array.from(selectedBases);
    if (s.length != 2) {
        notify("please use 2 elements for distance selection");
        return;
    }
    distanceHandler.append(s[0], s[1]);
    clearSelection();
}
function measureDistanceForces() {
    let s = Array.from(selectedBases); // s will contain the base selected in UI
    if (s.length != 2) { // Make sure only two of them are selected
        notify("please use 2 elements for distance selection");
        return;
    }
    // clearSelection();
    distanceHandler.overwrite(s[0], s[1]); // Report selection to distanceHandler
    distanceHandler.update(); // Calculate the distance.
    document.getElementById("r0").value = distanceHandler.distances[0].dist.toString(); //Ids should be unique so just grab them and replace with new value.
    // The above is js format seems to be working in ts.
}
class DistanceObservable {
    constructor(e1, e2, parent) {
        this.e1 = e1;
        this.e2 = e2;
        this.parent = parent;
        this.init();
        this.compute();
    }
    round_num(num, pow = 2) {
        let round = Math.pow(10, pow);
        return Math.round((num + Number.EPSILON) * round) / round;
    }
    compute() {
        if (this.label) {
            const nm_dist = 0.8518 * this.dist;
            this.label.innerText = `${this.e1.id}\t-\t${this.e2.id}\t | \t${this.round_num(this.dist, 3)}\t SU | \t${this.round_num(nm_dist, 3)} nm`;
        }
        this.dist = this.e1.getPos().distanceTo(this.e2.getPos());
        this.line.geometry = new THREE.BufferGeometry().setFromPoints([this.e1.getPos(), this.e2.getPos()]);
    }
    init() {
        //setup html
        this.html = document.createElement('div');
        let delete_button = document.createElement('button');
        this.label = document.createElement('label');
        delete_button.innerText = "x";
        delete_button.onclick = () => {
            this.parent.delete(this);
            scene.remove(this.line);
            listDistances();
        };
        this.html.appendChild(delete_button);
        this.html.appendChild(this.label);
        //line representation
        this.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([this.e1.getPos(), this.e2.getPos()]), new THREE.LineBasicMaterial({ color: 0x999999 }));
        scene.add(this.line);
    }
}
