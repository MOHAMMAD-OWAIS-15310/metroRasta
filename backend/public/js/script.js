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
    // .then(data => {

    //     stations = data;

    //     console.log("Stations loaded:", stations.length);
    //     console.log("Dilli Haat:", stations.find(
    //         station =>
    //             station.name.toLowerCase().includes("dilli haat")
    //     ));

    // })
    // .catch(error => {
    //     console.error("Station loading error:", error);
    // });






//.......................................changing show sugestion feature(basically optimizing it)
//SEARCH HELPERS

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[–—-]/g, " ")
        .replace(/\bsector\b/g, "sec")
        .replace(/\s+/g, " ")
        .trim();
}


//Levenshtein distance
function levenshtein(a, b) {

    const dp = Array.from(
        { length: a.length + 1 },
        () => Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
        dp[i][0] = i;
    }

    for (let j = 0; j <= b.length; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {

        for (let j = 1; j <= b.length; j++) {

            if (a[i - 1] === b[j - 1]) {

                dp[i][j] = dp[i - 1][j - 1];

            } else {

                dp[i][j] =
                    1 +
                    Math.min(
                        dp[i - 1][j],       // delete
                        dp[i][j - 1],       // insert
                        dp[i - 1][j - 1]    // replace
                    );
            }
        }
    }

    return dp[a.length][b.length];
}


// Compare two words
function wordsMatch(queryWord, stationWord) {

    // exact
    if (queryWord === stationWord) {
        return {
            matched: true,
            score: 30
        };
    }


    // prefix
    if (stationWord.startsWith(queryWord) || queryWord.startsWith(stationWord)) {
        return {
            matched: true,
            score: 20
        };
    }


    // Numbers should match exactly
    if (/^\d+$/.test(queryWord) || /^\d+$/.test(stationWord)) {
        return {
            matched: false,
            score: 0
        };
    }


    const distance =levenshtein(queryWord, stationWord);


    // Long words → allow up to 2 mistakes
    if (queryWord.length >= 6 && distance <= 3) {
        return {
            matched: true,
            score: 10
        };
    }


    // Medium words → allow 1 mistake
    if (
        queryWord.length >= 4 &&
        distance <= 1
    ) {
        return {
            matched: true,
            score: 10
        };
    }


    return {
        matched: false,
        score: 0
    };
}




//.................................................
// // Create suggestions
// function showSuggestions(input, suggestionBox) {

//         const value = input.value.trim().toLowerCase();

//         suggestionBox.innerHTML = "";

//         if (value === "") {
//             suggestionBox.style.display = "none";
//             return;
//         }

//     const filteredStations = stations.filter(station =>
//         station.name.toLowerCase().includes(value)
//     );

//     if (filteredStations.length === 0) {
//         suggestionBox.style.display = "none";
//         return;
//     }

//     filteredStations.forEach(station => {

//         const option = document.createElement("div");

//         option.className = "suggestion";
//          option.textContent = station.name;

//          option.addEventListener("click", function () {

//             input.value = station.name;

//             suggestionBox.innerHTML = "";
//             suggestionBox.style.display = "none";
//         });
//         suggestionBox.appendChild(option);
//     });

//     suggestionBox.style.display = "block";
// }

// ........................... SHOW SUGGESTIONS
function showSuggestions(input, suggestionBox) {
    const value =input.value.trim();
    suggestionBox.innerHTML = "";
    if (value === "") {
        suggestionBox.style.display = "none";
        return;
    }

    const query =normalizeText(value);

    const queryWords = query.split(" ");
    //................testing
    console.log("SEARCH INPUT:", value);
    console.log("NORMALIZED:", query);
    console.log("QUERY WORDS:", queryWords);


    const results = [];

    // Check every station
    for (const station of stations) {
        //...................testing
        if (station.name === "Dilli Haat - INA") {
            console.log(
                "TESTING DILLI:",
                station.name
            );
        }

        const stationText = normalizeText(station.name);
        const stationWords = stationText.split(" ");

        let score = 0;
        let matchedWords = 0;

        // Exact normalized phrase
        if (stationText === query) {
            score += 100;
        }
        else if (stationText.includes(query)) {
            score += 70;
        }


        // Compare individual words
        for (const queryWord of queryWords) {
            let bestWordScore = 0;
            for (const stationWord of stationWords) {
                const result =
                    wordsMatch(
                        queryWord,
                        stationWord
                    );

                if (result.matched && result.score > bestWordScore) {
                    bestWordScore = result.score;
                }
            }


            if (bestWordScore > 0) {
                matchedWords++;
                score += bestWordScore;
            }
        }

        // //..............testing
        // if (station.name === "Dilli Haat - INA") {
        //     console.log(
        //         "DILLI RESULT:",
        //         {
        //             stationText,
        //             stationWords,
        //             matchedWords,
        //             queryWords,
        //             score
        //         }
        //     );
        // }

        // Every query word should have a match
        if (matchedWords === queryWords.length){
            results.push({
                station: station,
                score: score
            });
        }
    }


    // Highest score first
    results.sort((a, b) => b.score - a.score);

    // Maximum 8 suggestions
    const topResults = results.slice(0, 8);

    if (topResults.length === 0) {
        suggestionBox.style.display = "none";
        return;
    }


    // Create dropdown options
    topResults.forEach(result => {
        const option = document.createElement("div");

        option.className = "suggestion";

        option.textContent =  result.station.name;


        option.addEventListener(
            "click",
            function () {

                input.value =
                    result.station.name;

                suggestionBox.innerHTML =
                    "";

                suggestionBox.style.display =
                    "none";
            }
        );


        suggestionBox.appendChild(option);
    });


    suggestionBox.style.display =
        "block";
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




//..................................microphne( source and dest )
// .....................SPEECH RECOGNITION

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const sourceMic =document.getElementById("source-mic");

const destinationMic = document.getElementById("destination-mic");


// Start listening
function startListening(input, micButton) {

    // Browser support check
    if (!SpeechRecognition) {

        alert(
            "Speech recognition is not supported in this browser."
        );

        return;
    }


    const recognition =
        new SpeechRecognition();


    // Station names are spoken in English
    recognition.lang = "en-IN";

    // Stop after user finishes speaking
    recognition.continuous = false;

    // We only need the final result
    recognition.interimResults = false;


    // Change microphone icon while listening
    micButton.innerHTML ='<i class="fa-solid fa-microphone"></i>';


    // Start microphone
    recognition.start();


    // speech ka result

    recognition.onresult = function (event) {

        const spokenText =event.results[0][0].transcript.trim();


        console.log(
            "Speech recognized:",
            spokenText
        );


        // Put recognized speech into input
        input.value = spokenText;


        // Use the same search function
        // that is already used for typing
        showSuggestions(
            input,
            input === sourceInput
                ? sourceSuggestions
                : destinationSuggestions
        );

    };


    // ......................LISTENING ENDED 

    recognition.onend = function () {

        micButton.innerHTML =
            '<i class="fa-solid fa-microphone-slash"></i>';

    };

    recognition.onerror = function (event) {

        console.log(
            "Speech recognition error:",
            event.error
        );

        micButton.innerHTML =
            '<i class="fa-solid fa-microphone-slash"></i>';

    };

}


//...source micrphone

sourceMic.addEventListener("click", function () {

    startListening(
        sourceInput,
        sourceMic
    );

});


// dest micro

destinationMic.addEventListener("click", function () {

    startListening(
        destinationInput,
        destinationMic
    );

});