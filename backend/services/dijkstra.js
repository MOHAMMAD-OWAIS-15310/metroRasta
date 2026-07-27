const INTERCHANGE_PENALTY = 6;

function findShortestPath(graph, start  , destination){
    const distances = new Map();
    const previous =new Map();
    const visited = new Set();

    // ..state  = station + line
    function stateKey(station, line) {
        return `${station}|${line}`;
    }

    //abhi tak start stae ke paas line nhi h
    const startState = stateKey(start,"START");

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

        const separatorIndex =currentState.indexOf("|");

        const currentStation=currentState.substring(0, separatorIndex);
        const currentLine =currentState.substring(separatorIndex+1);

        // destination reaches
        if (currentStation === destination) {
            bestDestinationState = currentState;
            break;
        }

        const edges = graph.get(currentStation) || [];

        for (const edge of edges) {
            let newDistance =
                distances.get(currentState) + edge.weight;

            // adding interchange penalty when line changes
            if (currentLine !== "START" && currentLine !== edge.line){
                newDistance += INTERCHANGE_PENALTY;
            }

            const nextState = stateKey(edge.to, edge.line);

            if (!distances.has(nextState) || newDistance < distances.get(nextState)){
                distances.set(nextState, newDistance);
                previous.set(nextState, {station: currentStation,line: currentLine,edgeLine: edge.line});
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
        const separatorIndex = currentState.indexOf("|");
        const station = currentState.substring(0, separatorIndex);
        const line = currentState.substring(separatorIndex + 1);

        path.unshift({station,line});

        currentState = stateKey(
            previous.get(currentState).station,
            previous.get(currentState).line
        );
    }

    // Add starting station
    path.unshift({
        station: start,
        line: "START"
    });

    return {
        distance: distances.get(bestDestinationState),
        path
    };
}

module.exports = { findShortestPath };