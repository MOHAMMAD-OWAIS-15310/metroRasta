function addStation(stationMap, id, name) {
    stationMap.set(id, {
        id,
        name,
        lat: null,
        lon: null
    });
}
//............green line 176 isssue
function insertPunjabiBaghWestIntoGreenSequence(lineSequences, service) {

    const key = `Green Line|${service}`;
    const sequence = lineSequences.get(key);

    if (!sequence) {
        console.log(`Green sequence not found: ${key}`);
        return;
    }

    // Already inserted
    if (sequence.includes("176")) {
        return;
    }

    const index33 = sequence.indexOf("33");
    const index32 = sequence.indexOf("32");

    if (index33 === -1 || index32 === -1) {
        console.log(
            `Cannot insert 176 into ${key}: 33 or 32 missing`
        );
        return;
    }

    // 176 must physically lie between Punjabi Bagh (33)
    // and Shivaji Park (32).

    if (index33 < index32) {
        sequence.splice(index32, 0, "176");
    } else {
        sequence.splice(index33, 0, "176");
    }

    console.log(
        `${key}:`,
        sequence
    );
}


//.......new to handle green line issue
function connectStations(graph, stationMap, from, to, line, service = null) {

    if (!graph.has(from)) graph.set(from, []);
    if (!graph.has(to)) graph.set(to, []);

    const fromEdges = graph.get(from);

    if (!fromEdges.some(edge =>
        edge.to === to &&
        edge.line === line &&
        edge.service === service
    )) {
        fromEdges.push({
            to,
            station: stationMap.get(to).name,
            line,
            service,
            weight: 1
        });
    }

    const toEdges = graph.get(to);

    if (!toEdges.some(edge =>
        edge.to === from &&
        edge.line === line &&
        edge.service === service
    )) {
        toEdges.push({
            to: from,
            station: stationMap.get(from).name,
            line,
            service,
            weight: 1
        });
    }
}

function markShivViharBranch(graph) {
    const branchEdges = [
        ["215", "216"], 
        ["216", "217"], 
        ["217", "218"]  
    ];

    for (const [from, to] of branchEdges) {

        // forward edge
        const forwardEdges = graph.get(from) || [];
        for (const edge of forwardEdges) {
            if (edge.to === to && edge.line === "Pink Line") {
                edge.service = "Pink Shiv Vihar";
            }
        }

        // reverse edge
        const reverseEdges = graph.get(to) || [];
        for (const edge of reverseEdges) {
            if (edge.to === from && edge.line === "Pink Line") {
                edge.service = "Pink Shiv Vihar";
            }
        }
    }
}
function markMagentaNorth(graph) {

    const northEdges = [
        ["530", "531"],
        ["531", "532"],
        ["532", "533"],
        ["533", "38"],
        ["38", "534"],
        ["534", "173"]
    ];

    for (const [from, to] of northEdges) {

        // Forward: Deepali - Majlis Park
        const forwardEdges = graph.get(from) || [];

        for (const edge of forwardEdges) {
            if (edge.to === to && edge.line === "Magenta Line") {
                edge.service = "Magenta Majlis Park";
            }
        }

        // Reverse: Majlis Park - Deepali
        const reverseEdges = graph.get(to) || [];

        for (const edge of reverseEdges) {
            if (edge.to === from && edge.line === "Magenta Line") {
                edge.service = "Magenta Deepali Chowk";
            }
        }
    }
}


//............ working on pink towards feature 
function createPinkCircularSequence(graph, stationMap) {

    const startId = [...stationMap.entries()]
        .find(([id, station]) => station.name === "Jafrabad")?.[0];

    if (!startId) {
        console.log("Jafrabad not found");
        return [];
    }

    const sequence = [];
    const visited = new Set();

    let current = startId;

    while (!visited.has(current)) {

        visited.add(current);
        sequence.push(current);

        const edges = graph.get(current) || [];

        const pinkEdges = edges.filter(
            edge =>
                edge.line === "Pink Line" &&
                edge.service !== "Pink Shiv Vihar"
        );

        if (pinkEdges.length === 0) {
            break;
        }

        // Don't go backwards to the station we just came from
        const nextEdge = pinkEdges.find(
            edge => !visited.has(edge.to)
        );

        if (!nextEdge) {
            break;
        }

        current = nextEdge.to;
    }

    // console.log(
    //     "PINK CIRCULAR SEQUENCE:",
    //     sequence.map(id => stationMap.get(id)?.name)
    // );

    return sequence;
}



function patchNetwork(graph, stationMap,lineSequences){


// ================= PUNJABI BAGH WEST (176) =================

connectStations(
    graph,
    stationMap,
    "32",
    "176",
    "Green Line",
    "Green Main"
);

connectStations(
    graph,
    stationMap,
    "176",
    "33",
    "Green Line",
    "Green Main"
);

connectStations(
    graph,
    stationMap,
    "32",
    "176",
    "Green Line",
    "Green Kirti Nagar Branch"
);

connectStations(
    graph,
    stationMap,
    "176",
    "33",
    "Green Line",
    "Green Kirti Nagar Branch"
);


// Remove old direct 32 - 33 Green edges

function removeGreenServiceEdge(graph, from, to, service) {

    const edges = graph.get(from);

    if (!edges) return;

    graph.set(
        from,
        edges.filter(edge =>
            !(
                edge.to === to &&
                edge.line === "Green Line" &&
                edge.service === service
            )
        )
    );
}

for (const service of [
    "Green Main",
    "Green Kirti Nagar Branch"
]) {

    removeGreenServiceEdge(
        graph,
        "32",
        "33",
        service
    );

    removeGreenServiceEdge(
        graph,
        "33",
        "32",
        service
    );
}


// Insert 176 into BOTH Green sequences

function insertPunjabiBaghWestIntoGreenSequence(
    lineSequences,
    service
) {

    const key = `Green Line|${service}`;

    const sequence = lineSequences.get(key);

    if (!sequence) {
        console.log(`Sequence not found: ${key}`);
        return;
    }

    if (sequence.includes("176")) {
        return;
    }

    const index33 = sequence.indexOf("33");
    const index32 = sequence.indexOf("32");

    if (index33 === -1 || index32 === -1) {
        console.log(
            `Cannot insert 176 into ${key}`
        );
        return;
    }

    if (index33 < index32) {
        sequence.splice(index32, 0, "176");
    } else {
        sequence.splice(index33, 0, "176");
    }

    console.log(
        `${key} sequence:`,
        sequence
    );
}

insertPunjabiBaghWestIntoGreenSequence(
    lineSequences,
    "Green Main"
);

insertPunjabiBaghWestIntoGreenSequence(
    lineSequences,
    "Green Kirti Nagar Branch"
);


    // ........................................Pink Line Extension

    // adding new stations
    addStation(stationMap, "521", "Burari");
    addStation(stationMap, "522", "Jharoda Majra");
    addStation(stationMap, "523", "Jagatpur-Wazirabad");
    addStation(stationMap, "524", "Soorghat");
    addStation(stationMap, "525", "Nanaksar-Sonia Vihar");
    addStation(stationMap, "526", "Khajuri Khas");
    addStation(stationMap, "527", "Bhajanpura");
    addStation(stationMap, "528", "Yamuna Vihar");

    // Connect stations

    connectStations(graph, stationMap, "173", "521", "Pink Line"); // Majlis Park → Burari
    connectStations(graph, stationMap, "521", "522", "Pink Line");
    connectStations(graph, stationMap, "522", "523", "Pink Line");
    connectStations(graph, stationMap, "523", "524", "Pink Line");
    connectStations(graph, stationMap, "524", "525", "Pink Line");
    connectStations(graph, stationMap, "525", "526", "Pink Line");
    connectStations(graph, stationMap, "526", "527", "Pink Line");
    connectStations(graph, stationMap, "527", "528", "Pink Line");
    connectStations(graph, stationMap, "528", "215", "Pink Line"); // Yamuna Vihar → Maujpur-Babarpur


   
    // .....................................Magenta Line Extension

    // Add new stations
    addStation(stationMap, "529", "Krishna Park Extension");

    addStation(stationMap, "530", "Deepali Chowk");
    addStation(stationMap, "531", "Madhuban Chowk");
    addStation(stationMap, "532", "Uttari Pitampura-Prashant Vihar");
    addStation(stationMap, "533", "Haiderpur Village");
    addStation(stationMap, "534", "Bhalaswa");

    // ......................Section 1
    // Janak Puri West -> Krishna Park Extension
    connectStations(graph, stationMap, "108", "529", "Magenta Line","Magenta Botanical Garden");


    // ........................Section 2
    // Deepali Chowk -> Majlis Park
    connectStations(graph, stationMap, "530", "531", "Magenta Line");
    connectStations(graph, stationMap, "531", "532", "Magenta Line");
    connectStations(graph, stationMap, "532", "533", "Magenta Line");
    connectStations(graph, stationMap, "533", "38", "Magenta Line");   // Haiderpur Badli Mor
    connectStations(graph, stationMap, "38", "534", "Magenta Line");   // Bhalaswa
    connectStations(graph, stationMap, "534", "173", "Magenta Line"); // Majlis Park


    //........noida sect 52(blue) to noida sect 51(aqua) have pedestrian walk
    connectStations(graph,stationMap,"234","500","Walking","Pedestrian Transfer");

    markShivViharBranch(graph);

    const pinkCircularSequence =
    createPinkCircularSequence(graph, stationMap);
    
    markMagentaNorth(graph);

    // .. rapid metro gftss fix
    connectStations(
        graph,
        stationMap,
        "148",   
        "168", 
        "Rapid Metro"
    );
    return {
        graph,
        pinkCircularSequence
    };
}

module.exports = { patchNetwork };