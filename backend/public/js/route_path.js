
//......*****************************************3rd time trying 
// ....................route data

const routeData = document.getElementById("route-data");


const instructions = {

    english:
        JSON.parse(routeData.dataset.english),

    hinglish:
        JSON.parse(routeData.dataset.hinglish),

    hindi:
        JSON.parse(routeData.dataset.hindi)

};


const instructionList = document.getElementById("instruction-list");

const languageButtons =  document.querySelectorAll(".lang-btn");
let selectedLanguage = "english";


// ................audio player

const listenButton = document.getElementById("listen-btn");


let currentInstruction = 0;

let audioState = "stopped";
let pauseTimer = null;


//language switching

languageButtons.forEach(button => {

    button.addEventListener("click", function () {

        const language = this.dataset.language;


        selectedLanguage = language;


        // Update instruction list
        instructionList.innerHTML = "";


        instructions[language].forEach(
            instruction => {

                const li =document.createElement("li");

                li.textContent =instruction;

                instructionList.appendChild(li);

            }
        );


        // Update active button
        languageButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        this.classList.add("active");


        // -------------------------
        // Stop current audio
        // -------------------------

        speechSynthesis.cancel();
        clearTimeout(pauseTimer);

        pauseTimer = null;

        currentInstruction = 0;

        audioState = "stopped";
        listenButton.innerHTML ='<i class="fa-solid fa-play"></i>';

    });

});


//....................listen button

listenButton.addEventListener(
    "click",
    function () {


        // PLAYING → PAUSE

        if (audioState === "playing") {

            speechSynthesis.pause();

            audioState = "paused";
            this.innerHTML = '<i class="fa-solid fa-play"></i>';


            return;
        }


        // PAUSED → RESUME

        if (audioState === "paused") {

            speechSynthesis.resume();
            audioState = "playing";
            this.innerHTML = '<i class="fa-solid fa-pause"></i>';


            return;
        }


        // WAITING BETWEEN
        // INSTRUCTIONS

        if (audioState === "waiting") {

            clearTimeout(pauseTimer);

            pauseTimer = null;
            audioState = "playing";
            speakNextInstruction();
            return;
        }


        // -------------------------
        // STOPPED → START
        // -------------------------

        if (audioState === "stopped") {

            currentInstruction = 0;

            speakNextInstruction();

        }

    }
);


// .............................Speak next instruction

function speakNextInstruction() {

    const currentInstructions =
        instructions[selectedLanguage];


    // -------------------------
    // Finished all instructions
    // -------------------------

    if (currentInstruction >= currentInstructions.length) {

        currentInstruction = 0;

        audioState = "stopped";

        listenButton.innerHTML =
            '<i class="fa-solid fa-play"></i>';


        return;
    }


    const text =currentInstructions[currentInstruction];


    // Safety check
    if (!text || !text.trim()) {

        currentInstruction++;

        speakNextInstruction();

        return;
    }


    // Create speech

    const speech = new SpeechSynthesisUtterance(text);


    // Set language

    if (selectedLanguage === "hindi") {

        speech.lang = "hi-IN";

    } else {

        // English + Hinglish
        speech.lang = "en-IN";

    }


    speech.rate = 0.9;

    speech.pitch = 1;


    // Speech started

    speech.onstart = function () {

        audioState = "playing";
        listenButton.innerHTML =
            '<i class="fa-solid fa-pause"></i>';

    };


    // Speech finished

    speech.onend = function () {

        // Move to next instruction
        currentInstruction++;

        // Last instruction finished

        if (currentInstruction >=currentInstructions.length) {

            audioState = "stopped";


            listenButton.innerHTML =
                '<i class="fa-solid fa-play"></i>';


            return;
        }

        // Wait before next instruction

        audioState = "waiting";

        listenButton.innerHTML =
            // '<i class="fa-solid fa-play"></i>';
            '<i class="fa-solid fa-pause"></i>';


        pauseTimer =
            setTimeout(() => {
                pauseTimer = null;
                speakNextInstruction();

            }, 500);

    };


    // Speech error

    speech.onerror = function () {

        clearTimeout(pauseTimer);
        pauseTimer = null;
        audioState = "stopped";
        listenButton.innerHTML =
            '<i class="fa-solid fa-play"></i>';
    };


    // .............Start speech

    speechSynthesis.speak(speech);

}