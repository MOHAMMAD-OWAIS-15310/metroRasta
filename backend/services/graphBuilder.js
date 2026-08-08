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
module.exports = {createStationMap,createRouteMap,createTripMap,groupStopsByTrip,sortTripStops,buildGraph};