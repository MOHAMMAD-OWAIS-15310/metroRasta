// const stationList = document.getElementById("station-list");

// fetch("/stations")
//     .then(response => response.json())
//     .then(stations => {

//         stations.forEach(station => {

//             const option = document.createElement("option");

//             option.value = station.name;

//             stationList.appendChild(option);
//         });

//     });

// //...............mobile size screen m list neeche aaye taaki seach bar na chupe i got this erro in testing
// const inputs = document.querySelectorAll("input");

// inputs.forEach(input => {
//     input.addEventListener("focus", function () {
//         setTimeout(() => {
//             this.scrollIntoView({
//                 behavior: "smooth",
//                 block: "center"
//             });
//         }, 300);
//     });
// });

// const sourceInput = document.getElementById("source");
// const destinationInput = document.getElementById("destination");

// sourceInput.addEventListener("focus", function () {
//     setTimeout(() => {
//         window.scrollTo({
//             top: this.getBoundingClientRect().top + window.scrollY - 120,
//             behavior: "smooth"
//         });
//     }, 300);
// });

// destinationInput.addEventListener("focus", function () {
//     setTimeout(() => {
//         window.scrollTo({
//             top: this.getBoundingClientRect().top + window.scrollY - 120,
//             behavior: "smooth"
//         });
//     }, 300);
// });







let stations = [];

const sourceInput = document.getElementById("source");
const destinationInput = document.getElementById("destination");

const sourceSuggestions = document.getElementById("source-suggestions");

const destinationSuggestions =document.getElementById("destination-suggestions");


// get stations from backend
fetch("/stations")
    .then(response => response.json())
    .then(data => {
        stations = data;
    });


// Create suggestions
function showSuggestions(input, suggestionBox) {

        const value = input.value.trim().toLowerCase();

        suggestionBox.innerHTML = "";

        if (value === "") {
            suggestionBox.style.display = "none";
            return;
        }

    const filteredStations = stations.filter(station =>
        station.name.toLowerCase().includes(value)
    );

    if (filteredStations.length === 0) {
        suggestionBox.style.display = "none";
        return;
    }

    filteredStations.forEach(station => {

        const option = document.createElement("div");

        option.className = "suggestion";
         option.textContent = station.name;

         option.addEventListener("click", function () {

            input.value = station.name;

            suggestionBox.innerHTML = "";
            suggestionBox.style.display = "none";
        });
        suggestionBox.appendChild(option);
    });

    suggestionBox.style.display = "block";
}


//source
sourceInput.addEventListener("input", function () {
    showSuggestions(this, sourceSuggestions);
});


// destination
destinationInput.addEventListener("input", function () {
        showSuggestions(this, destinationSuggestions);
});


// hide suggestions when clicking somewhere else
document.addEventListener("click", function (event) {
    if (!sourceInput.contains(event.target) && !sourceSuggestions.contains(event.target)) {
        sourceSuggestions.style.display = "none";
    }
    if(!destinationInput.contains(event.target) && !destinationSuggestions.contains(event.target)) {

        destinationSuggestions.style.display = "none";
    }
});