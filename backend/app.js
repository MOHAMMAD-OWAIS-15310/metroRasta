const express =require("express");
const cors =require("cors");
const path = require("path");

let stationMap;
let graph;

const app = express();
const {loadFile }=require("./services/metroLoader");
const {createStationMap } =require("./services/graphBuilder");
const {createRouteMap } =require("./services/graphBuilder");
const {createTripMap } =require("./services/graphBuilder");
const {groupStopsByTrip,sortTripStops,buildGraph } =require("./services/graphBuilder");

const {findShortestPath} = require("./services/dijkstra");
const { patchNetwork } = require("./services/networkPatch");

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
        // const graph = buildGraph(tripStops, tripMap, routeMap);
         graph = buildGraph(tripStops, tripMap, routeMap, stationMap);
        console.log("YAMUNA BANK:", stationMap.get("89"));
        // console.log("YAMUNA BANK EDGES:", graph.get("89"));
        // console.log(
        //     "YAMUNA BANK SERVICE EDGES:",
        //     graph.get("89").map(edge => ({
        //         to: edge.to,
        //         station: edge.station,
        //         line: edge.line,
        //         service: edge.service
        //     }))
        // );
        // console.log("\n--- BLUE SERVICE TEST ---");

// let blueMainCount = 0;
// let blueVaishaliCount = 0;

// for (const [stationId, edges] of graph) {
//     for (const edge of edges) {

//         if (edge.service === "Blue Main") {
//             blueMainCount++;
//         }

//         if (edge.service === "Blue Vaishali Branch") {
//             blueVaishaliCount++;
//         }
//     }
// }

// console.log("Blue Main edges:", blueMainCount);
// console.log("Blue Vaishali Branch edges:", blueVaishaliCount);


        patchNetwork(graph,stationMap);

        // stationMap.forEach(station => {
        // if( station.name === "Majlis Park" ||
        //     station.name === "Maujpur - Babarpur" ||
        //     station.name === "Janak Puri West"  ||
        //     station.name === "Haiderpur Badli Mor"
        // ){
        //     console.log(station);
        // }
        // });

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


        // console.log(
        //     result.path.map(step => ({
        //         station: stationMap.get(step.station).name,
        //         line: step.line,
        //         service: step.service
        //     }))
        // );
        

        // console.log(graph.get("173")); // Majlis Park
        // console.log(graph.get("521")); // Burari
        

        // console.log("Stops:", stops.length);
        // console.log("Routes:", routes.length);
        // console.log("Graph Size:", graph.size);
        // console.log("station map size",stationMap.size);
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

// app.post("/api/route", (req, res) => {

//     const { source, destination } = req.body;

//     const start = findStationId(stationMap, source);
//     const end = findStationId(stationMap, destination);

//     console.log("Source ID:", start);
//     console.log("Destination ID:", end);

//     res.json({
//         source,
//         destination,
//         start,
//         end
//     });
// });

app.post("/api/route", (req, res)=>{

    const {source, destination } = req.body;

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

    console.log("Route:", result.path);
    console.log("Distance:", result.distance);


    // res.json({
    //     source,
    //     destination,
    //     distance: result.distance,
    //     route: result.path
    // });

    const route = result.path.map(step =>({
        id: step.station,
        name: stationMap.get(step.station).name,
        line: step.line
    }));

    const interchanges = [];

    for(let i = 1; i < route.length; i++){
        if (
            route[i].line !== route[i - 1].line &&
            route[i - 1].line !== "START"
        ) {
            interchanges.push({
                station: route[i].name,
                from: route[i - 1].line,
                to: route[i].line
            });
        }
    }
    const stationMoves = route.length - 1;

    res.json({
        source,
        destination,
        stationMoves,
        interchanges,
        cost: result.distance,
        route
    });
});

app.get("/route", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/", (req, res) => {
    res.send("metroRasta is running");
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});