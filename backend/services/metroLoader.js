const fs =require("fs");
const path =require("path");
const csv = require("csv-parser");


// function loadStops(){
//     return new Promise((resolve, reject)=>{
//         const stops=[];

//         fs.createReadStream(
//             path.join(__dirname, "../data/metroData/stops.txt")
//         ).pipe(csv())
//             .on("data", (row) => {
//                 stops.push(row);
//             })
//             .on("end", ()=>{
//                 resolve(stops);
//             })
//             .on("error",(err) =>{
//                 reject(err);
//             });
//     });
// }

function loadFile(fileName){
    return new Promise((resolve, reject) =>{
        const data = [];

        fs.createReadStream(
            path.join(__dirname, "../data/metroData", fileName)
        ).pipe(csv())
        .on("data",(row)=> data.push(row))
        .on("end", ()=> resolve(data))
        .on("error", (err)=>reject(err));
    });
}

module.exports = {loadFile };