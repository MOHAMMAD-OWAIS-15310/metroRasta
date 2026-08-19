const { lineEndpoints } = require("./lineEndpoints");


function createStationMap(stops){
    const stationMap =new Map();

    for(const stop of stops){
        stationMap.set(stop.stop_id,{
            id   : stop.stop_id,
            name: stop.stop_name,
            lat: parseFloat(stop.stop_lat),
             lon: parseFloat(stop.stop_lon),
        });
    }

    return stationMap;
}



function createRouteMap(routes) {
    const routeMap = new Map();

    for (const route of routes) {
        routeMap.set(route.route_id, {
            shortName: route.route_short_name,
            longName: route.route_long_name
        });
    }
    // console.log(
    // [...routeMap.entries()]
    //     .filter(([id, route]) => route.longName.startsWith("BLUE"))
    // );
    //testing
    for (const route of routes) {
    // if (route.route_long_name.startsWith("PINK")) {
    // if (route.route_long_name.startsWith("GREEN")) {
    // if (route.route_long_name.startsWith("MAGENTA")) {
    if (route.route_long_name.startsWith("RAPID")) {
        console.log(route.route_short_name, route.route_long_name);
    }
    }

    return routeMap;
}



function createTripMap(trips){
    const tripMap = new Map();
    for(const trip of trips) {
        tripMap.set(trip.trip_id,trip.route_id);
    }
    return tripMap;
}




function groupStopsByTrip(stopTimes){
    const tripStops = new Map();

    for(const stopTime of stopTimes){
        const tripId = stopTime.trip_id;

        if(!tripStops.has(tripId)){
            tripStops.set(tripId, []);
        }

        tripStops.get(tripId).push(stopTime);
    }

    return tripStops;
}




function sortTripStops(tripStops){
    for(const stops of tripStops.values()) {
        stops.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
    }

    return tripStops;
}




function createLineSequences(
    tripStops,
    tripMap,
    routeMap,
    stationMap
) {
    const lineSequences = new Map();

    // .................normal lines 
    for (const stops of tripStops.values()) {

        if(stops.length < 2) continue;

        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];

        const routeId = tripMap.get(firstStop.trip_id);
        const route = routeMap.get(routeId);

        if(!route) continue;

        const line = getLineName(route.longName);
        const service = getServiceName(route.shortName);

        const key = `${line}|${service}`;

        // Aqua  will be handle neeche
        if(line === "Aqua Line"){
            continue;
        }

        const endpoints = lineEndpoints[key];

        if (!endpoints) continue;

        const firstName =
            stationMap.get(firstStop.stop_id).name;

        const lastName =
            stationMap.get(lastStop.stop_id).name;

        if(firstName === endpoints.from && lastName === endpoints.to){
            lineSequences.set(
                key,
                stops.map(stop => stop.stop_id)
            );
        }
    }



    // ...............................aqua line

    let aquaForward = null;
    let aquaDepotTo142 = null;

    for(const stops of tripStops.values()){

        if(stops.length < 2) continue;

        const firstStop = stops[0];
        const lastStop = stops[stops.length - 1];

        const routeId = tripMap.get(firstStop.trip_id);
        const route = routeMap.get(routeId);

        if(!route) continue;

        if(getLineName(route.longName) !== "Aqua Line") {
            continue;
        }

        const names = stops.map(
            stop => stationMap.get(stop.stop_id).name
        );

        const first = names[0];
        const last = names[names.length - 1];

        // 51 - 142
        if(first === "Noida Sector 51" && last === "Noida Sector 142"){
            aquaForward = stops.map(stop => stop.stop_id);
        }

        // depot - 142
        if(first === "Depot Station" && last === "Noida Sector 142") {
            aquaDepotTo142 = stops.map(stop => stop.stop_id);
        }
    }


    // ......................COMBINE AQUA TRIPS

    if (aquaForward && aquaDepotTo142) {
        // Depot -> 142
        // reverse it
        // 142 -> Depot
        const aqua142ToDepot = [...aquaDepotTo142].reverse();

        // remove duplicate 142
        aqua142ToDepot.shift();

        // vomplete conceptual sequence:
        // 51 > ... > 142 > ...... > Depot
        const aquaSequence = [
            ...aquaForward,
            ...aqua142ToDepot
        ];

        lineSequences.set(
            "Aqua Line|null",
            aquaSequence
        );

        // console.log(
        //     "AQUA SEQUENCE:",
        //     aquaSequence.map(
        //         id => stationMap.get(id).name
        //     )
        // );

    }else{

        console.log(
            "AQUA SEQUENCE COULD NOT BE BUILT"
        );

        console.log(
            "Forward trip:",
            !!aquaForward
        );

        console.log(
            "Depot -> 142 trip:",
            !!aquaDepotTo142
        );
    }


    // console.log(
    //     "..............................LINE SEQUENCES:"
    // );

    // console.log(lineSequences);

    return lineSequences;
}






function getPinkTowards(
    sourceStation,
    destinationStation,
    pinkSequence,
    stationMap
) {
    const n = pinkSequence.length;

    const sourceIndex = pinkSequence.indexOf(sourceStation);
    const destinationIndex = pinkSequence.indexOf(destinationStation);

    if (sourceIndex === -1 || destinationIndex === -1) {
        return null;
    }

    if (sourceIndex === destinationIndex) {
        return null;
    }

    // Clockwise (+)
    const clockwiseDistance =
        (destinationIndex - sourceIndex + n) % n;

    // Anti-clockwise (-)
    const antiClockwiseDistance =
        (sourceIndex - destinationIndex + n) % n;

    let nextIndex;
    let direction;

    if (clockwiseDistance < antiClockwiseDistance) {

        nextIndex = (sourceIndex + 1) % n;
        direction = "+";

    } else if (antiClockwiseDistance < clockwiseDistance) {

        nextIndex = (sourceIndex - 1 + n) % n;
        direction = "-";

    } else {

        return null;
    }

    const nextStationId = pinkSequence[nextIndex];
    const nextStation = stationMap.get(nextStationId);

    if (!nextStation) {
        return null;
    }

    return `${nextStation.name} (${direction})`;
}





function addTowardsToPath(path, lineSequences, lineEndpoints,pinkCircularSequence,stationMap) {

    for(let i = 0; i < path.length; i++){

        const current = path[i];

        // START station
        if (current.line === "START") {
            current.towards = null;
            continue;
        }


    // ================= PINK CIRCULAR LINE =================
    if (current.line === "Pink Line") {

        // START is handled above
        if (i === 0) {
            current.towards = null;
            continue;
        }

        const currentIndex =
            pinkCircularSequence.indexOf(current.station);

        if (currentIndex === -1) {
            current.towards = null;
            continue;
        }

        // Determine direction using the next Pink station
        if (i < path.length - 1) {

            const next = path[i + 1];

            if (next.line === "Pink Line") {

                const nextIndex =
                    pinkCircularSequence.indexOf(next.station);

                const n = pinkCircularSequence.length;
                const clockwise =
                    (nextIndex - currentIndex + n) % n;

                const anticlockwise =
                    (currentIndex - nextIndex + n) % n;
                if (clockwise === 1) {
                    current.towards =
                        `${stationMap.get(current.station).name} (+)`;
                }
                else if (anticlockwise === 1) {
                    current.towards =
                        `${stationMap.get(current.station).name} (-)`;
                }
                else {
                    current.towards = null;
                }

                continue;
            }
        }

        // Last Pink station
        current.towards = `${stationMap.get(current.station).name}`;
        continue;
    }
        const key = `${current.line}|${current.service}`;

        const sequence = lineSequences.get(key);
        const endpoints = lineEndpoints[key];

        if(!sequence || !endpoints){
            current.towards = null;
            continue;
        }

        const currentIndex = sequence.indexOf(current.station);

        if (currentIndex === -1) {
            current.towards = null;
            continue;
        }

        // ..........
        // ........last sation /destination
        if (i === path.length - 1) {

            const previous = path[i - 1];

            const previousIndex = sequence.indexOf(previous.station);

            if (previousIndex === -1) {
                current.towards = null;
                continue;
            }

            if (currentIndex > previousIndex) {
                current.towards = endpoints.to;
            }
            else if (currentIndex < previousIndex) {
                current.towards = endpoints.from;
            }
            else {
                current.towards = null;
            }

            continue;
        }

        const next = path[i + 1];


        // ................NORMAL CASE
        // Same line + same service
        if (
            current.line === next.line &&
            current.service === next.service
        ) {

        let nextIndex = sequence.indexOf(next.station);

            // if (nextIndex === -1) {
            //     current.towards = null;
            //     continue;
            // }

            // if (nextIndex > currentIndex) {
            //     current.towards = endpoints.to;
            // }
            // else if (nextIndex < currentIndex) {
            //     current.towards = endpoints.from;
            // }
            // else {
            //     current.towards = null;
            // }

            //........
            // let nextIndex = sequence.indexOf(next.station);

        //.........................................
        // Punjabi Bagh West is not present in the original GTFS
        // Green sequence, so give it a virtual position between
        // Punjabi Bagh (33) and Shivaji Park (32).

        if (
            current.line === "Green Line" &&
            current.station === "33" &&
            next.station === "176"
        ) {
            const index33 = sequence.indexOf("33");
            const index32 = sequence.indexOf("32");

            if (index33 !== -1 && index32 !== -1) {
                nextIndex = (index33 + index32) / 2;
            }
        }

        else if (
            current.line === "Green Line" &&
            current.station === "176"
        ) {
            const index33 = sequence.indexOf("33");
            const index32 = sequence.indexOf("32");

            if (index33 !== -1 && index32 !== -1) {
                // 176 lies between 33 and 32.
                const currentVirtualIndex =
                    (index33 + index32) / 2;

                if (next.station === "32") {
                    nextIndex = index32;
                }
                else if (next.station === "33") {
                    nextIndex = index33;
                }

                if (nextIndex > currentVirtualIndex) {
                    current.towards = endpoints.to;
                }
                else if (nextIndex < currentVirtualIndex) {
                    current.towards = endpoints.from;
                }
                else {
                    current.towards = null;
                }

                continue;
            }
        }

        if (nextIndex === -1) {
            current.towards = null;
            continue;
        }

        if (nextIndex > currentIndex) {
            current.towards = endpoints.to;
        }
        else if (nextIndex < currentIndex) {
            current.towards = endpoints.from;
        }
        else {
            current.towards = null;
        }

        continue;

        }


        // ..................INTERCHANGE CASE
        //....eg (get this prob while testing)
        // 13 (Red)  34 (green main) 35 (green branch)
        // At 34, next station belongs to another service.
        // So determine Green Main direction using:
        //
        // previous station->current station
        // inside Green mains sequence.

        const previous = path[i - 1];

        if(previous) {

            const previousIndex = sequence.indexOf(previous.station);

            if (previousIndex !== -1) {

                if (currentIndex > previousIndex) {
                    current.towards = endpoints.to;
                }
                else if (currentIndex < previousIndex) {
                    current.towards = endpoints.from;
                }
                else {
                    current.towards = null;
                }

                continue;
            }
        }

        // Could not determine direction
        current.towards = null;
    }

    return path;
}







function buildGraph(tripStops, tripMap, routeMap, stationMap) {
    const graph = new Map();

    for (const stops of tripStops.values()) {
        for (let i = 0; i< stops.length - 1; i++) {

            const current=stops[i];
            const next =stops[i + 1];

            const currentName = stationMap.get(current.stop_id).name;
            const nextName = stationMap.get(next.stop_id).name;
            //skip fake rapid metrointerchange edge (fixing bug after testing)
            if(
                (current.stop_id === "148" && next.stop_id === "68") ||
                (current.stop_id === "68" && next.stop_id === "148")
            ) {
                continue;
            }

            const from =current.stop_id;
            const to =next.stop_id;

            // const routeId = tripMap.get(current.trip_id);
            // // const line = routeMap.get(routeId);
            // const line = getLineName(routeMap.get(routeId));
            // const stationName= stationMap.get(to).name;

            const routeId = tripMap.get(current.trip_id);
            const route = routeMap.get(routeId);
            const line = getLineName(route.longName);
            const service = getServiceName(route.shortName);
            const stationName = stationMap.get(to).name;



            if(!graph.has(from)){
                graph.set(from, []);
            }

            if(!graph.has(to)){
                graph.set(to, []);
            }

            //forwrd edge
            const fromEdges = graph.get(from);

            if (!fromEdges.some(
                edge =>
                    edge.to === to &&
                    edge.line === line &&
                    edge.service === service
            )) {
                fromEdges.push({
                    to,
                    station: stationName,
                    line,
                    service,
                    weight: 1,
                });
            }

            //reverse edge
            const toEdges = graph.get(to);

            if (!toEdges.some(
                edge =>
                    edge.to === from &&
                    edge.line === line &&
                    edge.service === service
            )) {
                toEdges.push({
                    to: from,
                    station: stationMap.get(from).name,
                    line,
                    service,
                    weight: 1,
                });
            }
        }
    }

    return graph;
}






function getLineName(routeName) {

    if (routeName.startsWith("RED")) return "Red Line";
    if (routeName.startsWith("BLUE")) return "Blue Line";
    if (routeName.startsWith("YELLOW")) return "Yellow Line";
    if (routeName.startsWith("PINK")) return "Pink Line";
    if (routeName.startsWith("MAGENTA")) return "Magenta Line";
    if (routeName.startsWith("VIOLET")) return "Violet Line";
    if (routeName.startsWith("GREEN")) return "Green Line";
    if (routeName.startsWith("ORANGE")) return "Airport Express";
    if (routeName.startsWith("GREY")) return "Grey Line";
    if (routeName.startsWith("RAPID")) return "Rapid Metro";
    if (routeName.startsWith("AQUA")) return "Aqua Line";

    return routeName;
}





function getServiceName(routeShortName) {

    if (routeShortName === "B_DN" || routeShortName === "B_DN_R") {
        return "Blue Main";
    }
    if (routeShortName === "B_DV" || routeShortName === "B_DV_R") {
        return "Blue Vaishali Branch";
    }
    //........greeen
    if(routeShortName === "G_IB" || routeShortName === "G_IB_R"){
        return "Green Main";
    }
    if (routeShortName === "G_KB" || routeShortName === "G_KB_R"){
        return "Green Kirti Nagar Branch";
    }

    //.....magenta
    if(routeShortName === "M_JB") {
        return "Magenta Botanical Garden";
    }
    if(routeShortName === "M_JB_R") {
        return "Magenta Janak Puri West";
    }

    return null;
}
module.exports = {createStationMap,createRouteMap,createTripMap,groupStopsByTrip,sortTripStops,buildGraph,createLineSequences,addTowardsToPath};