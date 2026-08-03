const INTERCHANGE_PENALTY = 6;
const YAMUNA_BANK_ID = "89";
const ASHOK_PARK_MAIN_ID = "34";

function findShortestPath(graph, start  , destination){
    const distances = new Map();
    const previous =new Map();
    const visited = new Set();

    // ..state  = station + line
    // function stateKey(station, line) {
    //     return `${station}|${line}`;
    // }
    function stateKey(station, line, service) {
        return `${station}|${line}|${service}`;
    }

    //abhi tak start stae ke paas line nhi h
    // const startState = stateKey(start,"START");
    const startState = stateKey(start, "START", "START");

    distances.set(startState, 0 );

    let bestDestinationState = null;

    while (true){
        let currentState = null;
        let smallestDistance = Infinity;

        // finding unvisited state with smallest distance
        for (const [state, distance] of distances) {
            if (!visited.has(state) && distance < smallestDistance) {
                smallestDistance = distance;
                currentState = state;
            }
        }

        // no reachable station left
        if (currentState === null) {
            break;
        }

        visited.add(currentState);

        // const separatorIndex =currentState.indexOf("|");
        // const currentStation=currentState.substring(0, separatorIndex);
        // const currentLine =currentState.substring(separatorIndex+1);
        const firstSeparatorIndex = currentState.indexOf("|");
        const secondSeparatorIndex = currentState.indexOf("|", firstSeparatorIndex + 1);
        const currentStation = currentState.substring(0, firstSeparatorIndex);
        const currentLine = currentState.substring(
            firstSeparatorIndex + 1,
            secondSeparatorIndex
        );
        const currentService = currentState.substring(secondSeparatorIndex + 1);

        // destination reaches
        if (currentStation === destination) {
            bestDestinationState = currentState;
            break;
        }

        const edges = graph.get(currentStation) || [];

        for (const edge of edges) {

            // Don't allow Blue branch switching outside Yamuna Bank
            if (
                currentLine === "Blue Line" &&
                edge.line === "Blue Line" &&
                currentService !== edge.service &&
                currentStation !== YAMUNA_BANK_ID
            ) {
                continue;
            }
            //.....green line t branch 
            if (
                currentLine === "Green Line" &&
                edge.line === "Green Line" &&
                currentService !== edge.service &&
                currentStation !== ASHOK_PARK_MAIN_ID
            ) {
                continue;
            }

            let newDistance =
                distances.get(currentState) + edge.weight;

            // adding interchange penalty when line changes
            if (currentLine !== "START" && currentLine !== edge.line){
                newDistance += INTERCHANGE_PENALTY;
            }

            // Blue Line branch change is allowed only at Yamuna Bank
            if (
                currentLine === "Blue Line" &&
                edge.line === "Blue Line" &&
                currentService !== edge.service &&
                currentStation === YAMUNA_BANK_ID
            ) {
                newDistance += INTERCHANGE_PENALTY;
            }

            //....green line branch change bas ashok park pr allow h
            if (
                currentLine === "Green Line" &&
                edge.line === "Green Line" &&
                currentService !== edge.service &&
                currentStation === ASHOK_PARK_MAIN_ID
            ) {
                newDistance += INTERCHANGE_PENALTY;
            }            

            // const nextState = stateKey(edge.to, edge.line);
            const nextState = stateKey(edge.to, edge.line, edge.service);

            if (!distances.has(nextState) || newDistance < distances.get(nextState)){
                distances.set(nextState, newDistance);
                // previous.set(nextState, {station: currentStation,line: currentLine,edgeLine: edge.line});
                previous.set(nextState, {
                    station: currentStation,
                    line: currentLine,
                    service: currentService,
                    edgeLine: edge.line,
                    edgeService: edge.service
                });
            }
        }
    }

    if (bestDestinationState === null) {
        return{
            distance: Infinity,
            path: []
        };
    }

    // reconstruct path
    const path = [];

    let currentState = bestDestinationState;

    while (currentState !== startState) {
        // const separatorIndex = currentState.indexOf("|");
        // const station = currentState.substring(0, separatorIndex);
        // const line = currentState.substring(separatorIndex + 1);
        // path.unshift({station,line});

        const firstSeparatorIndex = currentState.indexOf("|");
        const secondSeparatorIndex = currentState.indexOf("|", firstSeparatorIndex + 1);
        const station = currentState.substring(0, firstSeparatorIndex);
        const line = currentState.substring(
            firstSeparatorIndex + 1,
            secondSeparatorIndex
        );
        const service = currentState.substring(secondSeparatorIndex + 1);
        path.unshift({
            station,
            line,
            service
        });

        currentState = stateKey(
            previous.get(currentState).station,
            previous.get(currentState).line,
            previous.get(currentState).service
        );
    }

    // Add starting station
    path.unshift({
        station: start,
        line: "START",
        service: "START"
    });

    return {
        distance: distances.get(bestDestinationState),
        path
    };
}

module.exports = { findShortestPath };