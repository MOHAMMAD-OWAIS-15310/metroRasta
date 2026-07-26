function createStationMap(stops){
    const stationMap =new Map();

    for(const stop of stops){
        stationMap.set(stop.stop_id,{
            id  : stop.stop_id,
            name: stop.stop_name,
            lat: parseFloat(stop.stop_lat),
             lon: parseFloat(stop.stop_lon),
        });
    }

    return stationMap;
}

function createRouteMap(routes) {
    const routeMap = new Map();
    for(const route of routes){
        routeMap.set(route.route_id,  route.route_long_name);
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

            const from =current.stop_id;
            const to =next.stop_id;

            const routeId = tripMap.get(current.trip_id);
            // const line = routeMap.get(routeId);
            const line = getLineName(routeMap.get(routeId));
            const stationName= stationMap.get(to).name;

            if(!graph.has(from)){
                graph.set(from, []);
            }

            if(!graph.has(to)){
                graph.set(to, []);
            }

            //forwrd edge
            const fromEdges = graph.get(from);

            if (!fromEdges.some(edge => edge.to === to && edge.line === line)) {
                fromEdges.push({
                    to,
                    station: stationName,
                    line,
                    weight: 1,
                });
            }

            //reverse edge
            const toEdges = graph.get(to);

            if (!toEdges.some(edge => edge.to === from && edge.line === line)) {
                toEdges.push({
                    to: from,
                    station: stationMap.get(from).name,
                    line,
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

    return routeName;
}
module.exports = {createStationMap,createRouteMap,createTripMap,groupStopsByTrip,sortTripStops,buildGraph};