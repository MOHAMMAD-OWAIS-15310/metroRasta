const stationList = document.getElementById("station-list");

fetch("/stations")
    .then(response => response.json())
    .then(stations => {

        stations.forEach(station => {

            const option = document.createElement("option");

            option.value = station.name;

            stationList.appendChild(option);
        });

    });


    