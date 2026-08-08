function addStation(stationMap, id, name) {
    stationMap.set(id, {
        id,
        name,
        lat: null,
        lon: null
    });
}

function connectStations(graph , stationMap, from,to, line, service = null) {

    if(!graph.has(from)) graph.set(from, []);
    if(!graph.has(to)) graph.set(to, []);

    const fromEdges= graph.get(from);

    if (!fromEdges.some(edge => edge.to === to && edge.line === line)){
        fromEdges.push({
            to,
            station: stationMap.get(to).name,
            line,
            service,
            weight: 1
        });
    }

    const toEdges = graph.get(to);

    if(!toEdges.some(edge => edge.to === from && edge.line === line)){
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

function patchNetwork(graph, stationMap){
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
    markMagentaNorth(graph);

    // .. rapid metro gftss fix
    connectStations(
        graph,
        stationMap,
        "148",   
        "168", 
        "Rapid Metro"
    );
}

module.exports = { patchNetwork };