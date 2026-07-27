const express =require("express");
const cors =require("cors");

const app = express();
const {loadFile }=require("./services/metroLoader");
const {createStationMap } =require("./services/graphBuilder");
const {createRouteMap } =require("./services/graphBuilder");
const {createTripMap } =require("./services/graphBuilder");
const {groupStopsByTrip,sortTripStops,buildGraph } =require("./services/graphBuilder");

const {findShortestPath} = require("./services/dijkstra");

app.use(cors());
app.use(express.json());


async function start(){
    try {
        const stops= await loadFile("stops.txt");
        const routes = await  loadFile("routes.txt") ;
        const trips= await loadFile("trips.txt");
        const stopTimes =await loadFile("stop_times.txt");

        const stationMap=createStationMap(stops);
        stationMap.forEach(station => {
            console.log(station.id, "-", station.name);
        });
        // stationMap.forEach(station => console.log(station.name)); 
        const routeMap= createRouteMap(routes);
        const tripMap=createTripMap(trips);
        const tripStops = groupStopsByTrip(stopTimes);
        sortTripStops(tripStops);
        // const graph = buildGraph(tripStops, tripMap, routeMap);
        const graph = buildGraph(tripStops, tripMap, routeMap, stationMap);

        //testing dikstra
        // const result = findShortestPath(graph, "21", "1");
        const result = findShortestPath(graph, "21", "58");
        // const result = findShortestPath(graph, "178", "84");
        // const result = findShortestPath(graph, "178", "211");
        // const result = findShortestPath(graph, "214", "60");

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
        console.log(tripStops.get("0").slice(0, 5));
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
start();

app.get("/", (req, res) => {
    res.send("metroRasta is running");
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});