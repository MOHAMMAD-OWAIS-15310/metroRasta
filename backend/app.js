const express =require("express");
const cors =require("cors");
const path = require("path");

let stationMap;
let graph;
let lineSequences;
let pinkCircularSequence;


const app = express();
const {loadFile }=require("./services/metroLoader");
const {createStationMap } =require("./services/graphBuilder");
const {createRouteMap } =require("./services/graphBuilder");
const {createTripMap } =require("./services/graphBuilder");
const {groupStopsByTrip,sortTripStops,buildGraph,createLineSequences,addTowardsToPath } =require("./services/graphBuilder");

const {findShortestPath} = require("./services/dijkstra");
const { patchNetwork } = require("./services/networkPatch");

const {lineEndpoints} = require("./services/lineEndpoints");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function start(){
    try {
        const stops= await loadFile("stops.txt");
        const routes = await  loadFile("routes.txt") ;
        const trips= await loadFile("trips.txt");
        const stopTimes =await loadFile("stop_times.txt");

         stationMap=createStationMap(stops);
        // stationMap.forEach(station => {
        //     console.log(station.id, "-", station.name);
        // });
        const routeMap= createRouteMap(routes);
        const tripMap=createTripMap(trips);
        const tripStops = groupStopsByTrip(stopTimes);
        sortTripStops(tripStops);
        

// // TEST: Does GTFS contain Punjabi Bagh West (176)
// // in Green Line trips?
// for (const stops of tripStops.values()) {
//     if (!stops.some(stop => stop.stop_id === "176")) continue;

//     const routeId = tripMap.get(stops[0].trip_id);
//     const route = routeMap.get(routeId);

//     console.log(
//         "176:",
//         route?.shortName,
//         route?.longName
//     );
// }

        //...............towards 
         lineSequences = createLineSequences(
            tripStops,
            tripMap,
            routeMap,
            stationMap
        );

        // console.log("LINE SEQUENCES:");
        // console.log(lineSequences);

        // const graph = buildGraph(tripStops, tripMap, routeMap);
         graph = buildGraph(tripStops, tripMap, routeMap, stationMap);
        // console.log("YAMUNA BANK:", stationMap.get("89"));
        

        // patchNetwork(graph,stationMap);
        const patched = patchNetwork(graph, stationMap,lineSequences);

//         console.log(
//     "PUNJABI BAGH WEST:",
//     graph.get("176")?.map(e => ({
//         to: e.to,
//         station: stationMap.get(e.to)?.name,
//         line: e.line,
//         service: e.service
//     }))
// );
//         console.log(
//     "PUNJABI BAGH WEST green:",
//     graph.get("33")?.map(e => ({
//         to: e.to,
//         station: stationMap.get(e.to)?.name,
//         line: e.line,
//         service: e.service
//     }))
// );
// for (const [id, station] of stationMap) {
//     if (station.name.toLowerCase().includes("punjabi bagh")) {
//         console.log(id, station.name);
//     }
// }
        pinkCircularSequence = patched.pinkCircularSequence;

        
        console.log(
    "PINK FROM APP:",
    pinkCircularSequence?.length,
    pinkCircularSequence?.map(id => stationMap.get(id)?.name)
);

        // //.....rapid metro testing :bug
        // console.log(
        //     "148:",
        //     graph.get("148").map(edge => ({
        //         to: edge.to,
        //         station: stationMap.get(edge.to).name,
        //         line: edge.line,
        //         service: edge.service
        //     }))
        // );

        // console.log(
        //     "68:",
        //     graph.get("68").map(edge => ({
        //         to: edge.to,
        //         station: stationMap.get(edge.to).name,
        //         line: edge.line,
        //         service: edge.service
        //     }))
        // );

       

        //testing dikstra
        // const result = findShortestPath(graph, "21", "1");

        // const result = findShortestPath(graph, "21", "58");

        // const result = findShortestPath(graph, "178", "84");
        // const result = findShortestPath(graph, "178", "211");
        // const result = findShortestPath(graph, "214", "60");
        // const result = findShortestPath(graph, "100", "160");
        const result = findShortestPath(graph, "177", "46");

        console.log("Stops:", stops.length);
        console.log("Routes:", routes.length);
        console.log("Trips:", trips.length);
        console.log("Stop times:", stopTimes.length);

        console.log("station map size:", stationMap.size);
        console.log(stationMap.get("1"));
        console.log("route map size:", routeMap.size);
        console.log(routeMap.get("1"));

        console.log("Trip Map Size:", tripMap.size);
        console.log(tripMap.get(trips[0].trip_id));
        console.log(trips[0]);
        console.log("Trips grouped:", tripStops.size);
        // console.log(tripStops.get("0").slice(0, 5));
        // console.log(tripStops.get("0").slice(0, 5));
        console.log("Graph Size:", graph.size);
        console.log(graph.get("21"));

        console.log("route distance:", result.distance);

        console.log("source-",stationMap.get("21").name);
        console.log("destination-",stationMap.get("58").name);
        // console.log("source-",stationMap.get("214").name);
        // console.log("destination-",stationMap.get("60").name);

        console.log("Route:", result.path);



    } catch(err){
        console.error(err);
    }
}

function findStationId(stationMap, stationName) {
    const searchName = stationName.trim().toLowerCase();

    for (const [id, station] of stationMap) {
        if (station.name.trim().toLowerCase() === searchName) {
            return id;
        }
    }

    return null;
}

start();




app.post("/route", (req, res) => {

    const { source, destination } = req.body;

    const start = findStationId(stationMap, source);
    const end = findStationId(stationMap, destination);

    console.log("Source ID:", start);
    console.log("Destination ID:", end);

    if (!start || !end) {
        return res.status(404).json({
            error: "Station not found"
        });
    }

    const result = findShortestPath(graph, start, end);

    if (result.distance === Infinity) {
        return res.status(404).json({
            error: "No route found between these stations"
        });
    }

    addTowardsToPath(
        result.path,
        lineSequences,
        lineEndpoints,
        pinkCircularSequence,
        stationMap
    );

    console.log("Route:", result.path);
    console.log("Distance:", result.distance);

    const route = result.path.map(step => ({
        id: step.station,
        name: stationMap.get(step.station).name,
        line: step.line,
        service: step.service,
        towards: step.towards
    }));

    // detect interchange when line OR srvice changes
    const interchanges = [];

    for (let i = 1; i < route.length; i++) {

        const previous = route[i - 1];
        const current = route[i];

        const lineChanged =
            previous.line !== current.line;

        const serviceChanged =
            previous.service !== current.service;

        if (
            (lineChanged || serviceChanged) &&
            previous.line !== "START"
        ) {
            interchanges.push({
                station: previous.name,
                from: previous.line,
                to: current.line,
                fromService: previous.service,
                toService: current.service
            });
        }
    }

    const stationMoves = route.length - 1;

    // res.json({
    //     source,
    //     destination,
    //     stationMoves,
    //     interchanges,
    //     cost: result.distance,
    //     route
    // });
    res.render("route_path.ejs",{
        source,
        destination,
        stationMoves,
        interchanges,
        cost: result.distance,
        route,
    });
});

app.get("/index", (req, res) => {
    // res.sendFile(path.join(__dirname, "../frontend/index.html"));
    res.render("index.ejs");
});

app.get("/", (req, res) => {
    res.send("metroRasta is running");
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});