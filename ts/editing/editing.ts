const instanceParams = new Map([
    ['cmOffsets', 3], ['bbOffsets', 3], ['nsOffsets', 3],
    ['nsRotation', 4], ['conOffsets', 3], ['conRotation', 4],
    ['bbconOffsets', 3], ['bbconRotation', 4], ['bbColors', 3],
    ['scales', 3] ,['nsScales', 3], ['conScales', 3], ['bbconScales', 3],
    ['visibility', 3], ['nsColors', 3], ['bbLabels', 3]
]);

class InstanceCopy {
    type: string;
    id: number;
    clusterId: number;
    n3id: number;
    n5id: number;
    bpid: number;
    elemType: any;
    system: System;
    color: THREE.Color;


    cmOffsets: THREE.Vector3; bbOffsets: THREE.Vector3;
    nsOffsets: THREE.Vector3; nsRotation: THREE.Vector4;
    conOffsets: THREE.Vector3; conRotation: THREE.Vector4;
    bbconOffsets: THREE.Vector3; bbconRotation: THREE.Vector4;
    bbColors: THREE.Vector3; scales: THREE.Vector3;
    nsScales: THREE.Vector3; conScales: THREE.Vector3;
    bbconScales: THREE.Vector3; visibility: THREE.Vector3;
    nsColors: THREE.Vector3; bbLabels: THREE.Vector3;

    constructor(e: BasicElement) {
        instanceParams.forEach((size, attr)=>{
            if (size == 3){
                this[attr] = e.getInstanceParameter3(attr);
            } else { // 4
                this[attr] = e.getInstanceParameter4(attr);
            }
        });
        this.type = e.type;
        this.id = e.id;
        this.clusterId = e.clusterId;
        this.color = e.color;
        this.n3id = e.n3 ? e.n3.id : -1;
        this.n5id = e.n5 ? e.n5.id : -1;
        if(e.isPaired()) {
            this.bpid = (e as Nucleotide).pair.id;
        }
        this.elemType = e.constructor;
        this.system = e.getSystem();
    }

    writeToSystem(sid: number, sys: System) {
        instanceParams.forEach((size, attr)=>{
            sys.fillVec(attr, size, sid, this[attr].toArray());
        });
    }
}

let copied: InstanceCopy[] = [];

function copyWrapper() {
    if (selectedBases.size == 0) {
        notify("Please select monomers to copy");
        return;
    }
    let toCopy = Array.from(selectedBases).map(e=>e.id); // Save so that we can clear the selection
    clearSelection();
    copied = toCopy.map(i => new InstanceCopy(elements.get(i)));
}

function cutWrapper() {
    if (selectedBases.size == 0) {
        notify("Please select monomers to copy");
        return;
    }
    let elems = Array.from(selectedBases); // Save so that we can clear the selection
    clearSelection();
    copied = elems.map(e => new InstanceCopy(e));  
    editHistory.do(new RevertableDeletion(elems));
    topologyEdited = true;
}

function pasteWrapper(keepPos?: Boolean) {
    if (copied.length == 0) {
        notify("Nothing is copied, so nothing to paste");
        return;
    }

    let pos: THREE.Vector3;

    if (!keepPos) {
        // Set paste destination to 20 units in front of the camera
        const cameraHeading = new THREE.Vector3(0, 0, -1);
        cameraHeading.applyQuaternion(camera.quaternion);
        pos = camera.position.clone().add(cameraHeading.clone().multiplyScalar(20))
    }
    // Add elements to scene
    let elems = edit.addElementsAt(copied, pos);

    // Add to history
    editHistory.add(new RevertableAddition(copied, elems, pos));
    topologyEdited = true;

    api.selectElements(elems);
}

function nickWrapper() {
    let e: BasicElement = Array.from(selectedBases).pop();
    if (e == undefined) {
        notify("Please select a monomer to nick at");
        return;
    }
    editHistory.do(new RevertableNick(e))
    topologyEdited = true;
}

function ligateWrapper() {
    let e = Array.from(selectedBases).slice(-2);
    if (e[0] == undefined || e[1] == undefined) {
        notify("Please select two monomers to ligate");
        return;
    }
    editHistory.do(new RevertableLigation(e[0], e[1]))
    topologyEdited = true;
}

function extendWrapper(double: boolean) {
    let e: BasicElement = Array.from(selectedBases).pop();
    let seq: string = view.getInputValue("sequence").toUpperCase();
    let extendDuplex = view.getInputBool("setCompl");
    if (e == undefined) {
        notify("Please select a monomer to extend from");
        return;
    }
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let elems = extendDuplex ? edit.extendDuplex(e, seq) : edit.extendStrand(e, seq);
    let instanceCopies = elems.map(e=>{return new InstanceCopy(e)});
    let pos = new THREE.Vector3();
    elems.forEach(e=>pos.add(e.getPos()));
    pos.divideScalar(elems.length);

    // Add to history
    editHistory.add(new RevertableAddition(instanceCopies, elems, pos));
    topologyEdited = true;
}

function createWrapper() {
    let seq: string = view.getInputValue("sequence").toUpperCase();
    let createDuplex = view.getInputBool("setCompl");
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let elems = edit.createStrand(seq, createDuplex);

    let instanceCopies = elems.map(e=>{return new InstanceCopy(e)});
    let pos = new THREE.Vector3();
    elems.forEach(e=>pos.add(e.getPos()));
    pos.divideScalar(elems.length);

    // Add to history
    editHistory.add(new RevertableAddition(instanceCopies, elems, pos));
    topologyEdited = true;
}

function deleteWrapper() {
    let e: BasicElement[] = Array.from(selectedBases);
    clearSelection();
    if (e == []) {
        notify("Please select monomers to delete");
        return;
    }
    editHistory.do(new RevertableDeletion(e));
    topologyEdited = true;

}
function interconnectDuplex3pWrapper(){
    let strands = new Set<Strand>();
    let seq: string = view.getInputValue("sequence").toUpperCase();

    selectedBases.forEach(b=>strands.add(b.strand));
    if (strands.size != 2 || seq == ""){
        notify("please select 2 strands you want to connect by a duplex and type a sequence into the box.");
    }else{
        let [s1,s2] = Array.from(strands);
        edit.interconnectDuplex3p(s1,s2,seq); 
    }
}

function interconnectDuplex5pWrapper(){
    let strands = new Set<Strand>();
    let seq: string = view.getInputValue("sequence").toUpperCase();

    selectedBases.forEach(b=>strands.add(b.strand));
    if (strands.size != 2 || seq == ""){
        notify("please select 2 strands you want to connect by a duplex and type a sequence into the box.");
    }else{
        let [s1,s2] = Array.from(strands);
        edit.interconnectDuplex5p(s1,s2,seq); 
    }
}

function replaceSelectionByDuplexWrapper() {
    let set_strands = new Set<Strand>();
    selectedBases.forEach(b=>set_strands.add(b.strand)); // figure out the strands in the game
    //now let's figure out if the segments are matching up
    let strands = Array.from(set_strands);
    // segments partitioned by strand
    let selected_segments = [ 
        strands[0].getMonomers().filter(b=>selectedBases.has(b)),
        strands[1].getMonomers().filter(b=>selectedBases.has(b))  
    ]; // partition the selection into the two strands segments
   
    //selected_segments sequnces
    let selected_segments_seq = [
        selected_segments[0].map(b=>b.type).join(""),
        selected_segments[1].map(b=>b.type).join("")
    ];
    if (selected_segments_seq[0] !== rc(selected_segments_seq[1])){
        notify("The segments selected do not match up, please select complementary segments in both strands.");
        return 
    }
    let seg_length = selected_segments[0].length;
    // now we have to figure out if we extend 3' or 5' of strand0
    let end1 : BasicElement;
    let end2 : BasicElement;
    let is_5p = false;
    let is_3p = false;
    if(selected_segments[0][0].n5){
        //than this is what we want to extend
        end1 = selected_segments[0][0].n5;
        end2 = selected_segments[1][0].n5;
        console.log("extending 5'");
        is_5p = true;
    }
    if(selected_segments[0][seg_length-1].n3){
        end1 = selected_segments[0][seg_length-1].n3;
        end2 = selected_segments[1][seg_length-1].n3;
        is_3p = true;
    }
    
    //kill of the selection we want to replace by Duplex
    edit.deleteElements(Array.from(selectedBases));
    //reconstiute the duplex
    //let cms = new api.observable.CMS([end1,end2],1,0x00ff00);
    let duplex = edit.createStrand(selected_segments_seq[0],true);

    //shift the duplex to the center between the two strands
    let end_cms = new THREE.Vector3();
    [end1,end2].forEach(b=>{end_cms.add(b.getPos());});
    end_cms.divideScalar(2);

    //end we need the cms of the duplex
    let duplex_cms = new THREE.Vector3();
    duplex.forEach(b=>{duplex_cms.add(b.getPos());});
    duplex_cms.divideScalar(duplex.length);

    //first tranlate the duplex to the center of the strand
    translateElements(new Set(duplex),end_cms.sub(duplex_cms));
 
    //backfigure out the strands for ligation purpose
    let s1 = duplex[0].strand;
    let s2 = duplex[1].strand;
    if(is_5p){
        // we need to ligate the 5p of strands
        edit.ligate(s1.end5,end1);
        edit.ligate(s2.end5,end2);
    }
    if(is_3p){
        // we need to ligate the 3p of strands
        edit.ligate(s1.end3,end1);
        edit.ligate(s2.end3,end2);
    }
}


function getSelectedSeqWrapper(){
    let seqInp = view.getInputElement("sequence");
    let seqLen = view.getInputElement("seqLen");
    let seq: string = "";
    let strands  = new Set<Strand>();
     //generate check for the selection to contain 1 strand
    selectedBases.forEach(b=>{
        strands.add(b.strand);
    });
    if(strands.size==1){
        //now that we know we have 1 strand we can enumerate the elements 5->3
        Array.from(strands)[0].forEach(
            b=> {if (selectedBases.has(b)) seq+=b.type;});
        seqInp.value=seq;
        seqLen.innerHTML=seq.length.toString();
    }
    else notify("Selection only on 1 strand allowed"); 
}


let complement_dict = {"A":"T","T":"A","C":"G","G":"C"};
function rc(seq:string){
    let ret =[];
    for(let i=seq.length-1;i>=0;i--)
        ret.push(complement_dict[seq[i]]);
    return ret.join("");
}
function reverseComplementWrapper(){
    let seqInp = view.getInputElement("sequence");
    let seq = rc(seqInp.value.toUpperCase());
    seqInp.value = seq;
}

function findDomainWrapper(){
    let seq: string = view.getInputValue("sequence").toUpperCase();
    const search_func = system=>{
        system.strands.forEach(strand=>{
            let strand_seq = strand.getSequence();
            let idx = strand_seq.indexOf(seq);
            if(idx >= 0){
                let monomers = strand.getMonomers();
                api.selectElements(
                    monomers.slice(idx, idx+seq.length+1),
                    true
                );  
                render();
            }
        });
    };
    systems.forEach(search_func);
    tmpSystems.forEach(search_func);
}

function skipWrapper() {
    let e: BasicElement[] = Array.from(selectedBases);;
    clearSelection();
    if (e == []) {
        notify("Please select monomers to skip");
        return;
    }
    edit.skip(e);
    topologyEdited = true;
}

function insertWrapper() {
    let seq: string = view.getInputValue("sequence").toUpperCase();
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
    let e: BasicElement = Array.from(selectedBases).pop();
    if (e == undefined) {
        notify("Please select a monomer insert after");
        return;
    }
    edit.insert(e, seq);
    topologyEdited = true;
}

function setSeqWrapper() {
    let seq: string = view.getInputValue("sequence").toUpperCase();
    let setCompl = view.getInputBool("setCompl");
    if (seq == "") {
        notify("Please type a sequence into the box");
        return;
    }
  
    if (selectedBases.size == 0) {
        notify("Please select nucleotides to apply sequence to");
        return;
    }
    if (selectedBases.size > seq.length) {
        notify("Sequence is shorter than the selection");
        return;
    }
    editHistory.do(new RevertableSequenceEdit(selectedBases, seq, setCompl));
    topologyEdited = true;
}

function moveToWrapper(){
    // assuming last element of the selection is the move to position
    let bases = Array.from(selectedBases);
    let e = bases.pop();
    edit.move_to(e, bases);
}

function createNetworkWrapper() {
    // Makes a Network
    let bases = Array.from(selectedBases);
    // copied = bases.map(e => new InstanceCopy(e)); // this is probably unnecessary
    let nid = networks.length;
    editHistory.do(new RevertableNetworkCreation(bases, nid));
    view.addNetwork(nid) // don't know if it's a good idea to call this here or not?
}
function deleteNetworkWrapper(nid: number) {
    let net = networks[nid];
    if(net.onscreen){
        net.toggleVis(); // turn it off
    }
    try{
        view.removeNetworkData(nid)
    } catch (e) {}

    networks.splice(nid, 1);
    if(selectednetwork == nid) selectednetwork = -1;
    view.removeNetwork(nid);
}

function fillEdgesWrapper(nid: number, edgecase: number) {
    // Easy expansion for other edge methods
    if(networks.length == 0 || nid < 0) {
        notify('No Networks Found, Please Create Network');
    } else {
        let net = networks[nid];
        switch(edgecase){
            case 0:
                let cutoff = view.getInputNumber("edgeCutoff");
                if(typeof(cutoff) != "number" || cutoff > 1000 || cutoff <= 0 || isNaN(cutoff)){
                    notify("Please enter recongized value into 'Edge Cutoff' box")
                } else {
                    net.edgesByCutoff(cutoff);
                }
                break;
            case 1:
                net.edgesMWCENM();
                break;
            case 2:
                let cutoffe = view.getInputNumber("edgeCutoff");
                if(typeof(cutoffe) != "number" || cutoffe > 1000 || cutoffe <= 0 || isNaN(cutoffe)){
                    notify("Please enter recongized value into 'Edge Cutoff' box")
                } else {
                    net.edgesANMT(cutoffe)
                }
                break;
        }
    }
}

function visualizeNetworkWrapper(nid: number) {
    let net = networks[nid];
    if(net.reducedEdges.total == 0){
        notify("Connections must be assigned prior to Network Visualization");
        return;
    }
    net.toggleVis();
}

function selectNetworkWrapper(nid: number) {
    clearSelection();
    let net;
    try{
        net = networks[nid];
    } catch (e) {
        notify("Network " + (nid+1).toString() + " Does Not Exist");
        return;
    }
    selectednetwork = nid; // global declared in main
    net.selectNetwork();
}

function discretizeMassWrapper(option: number){
    if (selectedBases.size == 0) { // Need Elements
        notify("Please select Bases");
        return;
    }
    let cellSize = view.getInputNumber("cellSize");
    if (cellSize <= 0 || typeof(cellSize) != "number" || isNaN(cellSize)) { //Valid value for cellsize
        notify("Please Enter Valid Cell Size into the Cell Size Box");
        return;
    } else {
        let elems = Array.from(selectedBases); // Save so that we can clear the selection
        clearSelection();
        let ret;
        if(option == 0){
            ret = edit.discretizeMass(elems, cellSize);
        } else if (option == 1) {
            // cellsize is the placed particle radius
            ret  = edit.discretizeDensity(elems, 0.2, cellSize);
        }

        const InstMassSys = ret["elems"].map(e => new InstanceCopy(e));
        editHistory.add(new RevertableAddition(InstMassSys, ret["elems"]));
        flux.prepIndxButton(ret["indx"]);
    }
}