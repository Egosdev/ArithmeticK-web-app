var startTime = 0;
var gameModes = [];
var question_answer = 0;
var NUMBER_OF_DIGITS = 2;

document.addEventListener('DOMContentLoaded', function() {

    // Get the element with the ID guess for player inputs
    const guess = document.getElementById('guess');

    // Store the elements on which operation and numbers will appear on the screen in an const object
    const placeholders_object = {
        placeholder_left: document.getElementById('placeholder-left'),
        placeholder_right: document.getElementById('placeholder-right'),
        placeholder_center: document.getElementById('placeholder-center')
    };

    // Get the element with the ID progress-bar
    const progress_bar = document.getElementById('progress-bar');

    // Get the innerHTML element with the ID game-modes
    const selected_gamemodes = document.getElementById('game-modes').innerHTML;

    // Get the element with the ID settings-panel
    const settingsPanel = document.getElementById('settings-panel');

    // Check if the selected_gamemodes variable contains 'Addition' string comes from text above classic mode
    if (selected_gamemodes.includes("Addition")) {

        // If 'Addition' found, append it to the gameModes array
        gameModes.push("Addition");

        // If 'Addition' found, set the background of the addition fieldset in the settings panel to light green
        document.getElementById('addition-fieldset').style.backgroundColor = "rgb(152 255 152)";
    }

    // Check if the selected_gamemodes variable contains 'Subtraction' string comes from text above classic mode
    if (selected_gamemodes.includes("Subtraction"))  {

        // If 'Subtraction' found, append it to the gameModes array
        gameModes.push("Subtraction");

        // If 'Subtraction' found, set the background of the subtraction fieldset in the settings panel to light green
        document.getElementById('subtraction-fieldset').style.backgroundColor = "rgb(152 255 152)";
    }

    // Check if the selected_gamemodes variable contains 'Multiplication' string comes from text above classic mode
    if (selected_gamemodes.includes("Multiplication"))  {

        // If 'Multiplication' found, append it to the gameModes array
        gameModes.push("Multiplication");

        // If 'Multiplication' found, set the background of the multiplication fieldset in the settings panel to light green
        document.getElementById('multiplication-fieldset').style.backgroundColor = "rgb(152 255 152)";
    }

    // Check if the selected_gamemodes variable contains 'Division' string comes from text above classic mode
    if (selected_gamemodes.includes("Division"))  {

        // If 'Division' found, append it to the gameModes array
        gameModes.push("Division");

        // If 'Division' found, set the background of the division fieldset in the settings panel to light green
        document.getElementById('division-fieldset').style.backgroundColor = "rgb(152 255 152)";
    }

    // Store the settings min max bound html elements in settings_object for convenience sake
    const settings_object = {
        addition_min: document.getElementById('addition-min'),
        addition_max: document.getElementById('addition-max'),
        subtraction_min: document.getElementById('subtraction-min'),
        subtraction_max: document.getElementById('subtraction-max'),
        multiplication_min: document.getElementById('multiplication-min'),
        multiplication_max: document.getElementById('multiplication-max'),
        division_min: document.getElementById('division-min'),
        division_max: document.getElementById('division-max'),
    };

    // Initialize an empty array to store ten-question set information and statistics as object
    var game_session_data = [];

    // Display settings panel on page load
    toggleSettings();

    // On mouse click event listener for ready button with ready id
    document.getElementById("ready").addEventListener("click", function() {

        // Delete button element
        document.getElementById('ready').remove();

        // Initialize counter variable
        var counter = 3;

        // Displaying countdown with exclamation point in innerHTML element
        placeholders_object["placeholder_center"].innerHTML = counter+"!";

        // Set up a timer using setInterval function repeatedly at intervals of 1 second
        var timer = setInterval( function() {
            setTimeout( () => {
                placeholders_object["placeholder_center"].innerHTML = counter+"!";
            }, 20);

            // Decrement the counter value
            counter--;

            // Check if counter has reached 0
            if (counter == 0)
            {
                // Clear the interval timer
                clearInterval(timer);

                setTimeout( () => {
                    // Show user input
                    guess.classList.remove('hidden');

                    // Clear user input value
                    guess.value = "";

                    // Create first question
                    createQuestion(placeholders_object, settings_object);
                }, 20);
            }
        }, 1000);
    });

    // On any key down event listener
    document.addEventListener('keydown', function(event) {

        // If settings panel shown prevent key presses
        if (settingsPanel.classList.contains('active')) {
            return;
        }

        // (48 to 57 -> numbers 0 to 9) and (96 to 105 -> numpad numbers 0 to 9) and 45 is minus (-) also 8 is represents backspace
        if ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105) || event.keyCode == 8 || event.keyCode == 45) {

            // Ensure input always be in focus
            guess.focus();
        }
    });

    // On any key up event listener
    document.addEventListener('keyup', function() {

        // If settings panel shown prevent key up
        if (settingsPanel.classList.contains('active')) {
            return;
        }

        // Ensure user input (guess) is equal to actual answer
        if (parseInt(guess.value) === question_answer)
        {

            // Set end time for this question
            const endTime = performance.now();

            // Clear user input value
            guess.value = "";

            // Concat the number on the left, the math operation symbol in the middle, and the number on the right as text and store it in variable
            var operationText = placeholders_object["placeholder_left"].innerHTML + placeholders_object["placeholder_center"].innerHTML + placeholders_object["placeholder_right"].innerHTML;

            // Hide math operations as animation of correct answer
            document.getElementById('operation-container').classList.add('hidden');

            // Hide user input as animation of correct answer
            guess.classList.add('hidden');

            // Create new question after half a second
            setTimeout(function() {
                guess.value = "";
                createQuestion(placeholders_object, settings_object);
            }, 501);

            // Update progress bar
            progress_bar.value += 1;

            // Calculate player reaction time with fixing the decimal points to two places
            const reactionTime = ((endTime - startTime) / 1000).toFixed(2);

            // Gain 3 exp if answer reaction faster than or equal to two seconds
            if (reactionTime <= 2) xp = 3;

            // Gain 2 exp if answer reaction between two and five (included) seconds
            else if (reactionTime > 2 && reactionTime <= 5) xp = 2;

            // Gain 1 exp if answer reaction slower than five seconds
            else xp = 1;

            // Initialize object with one question statistics and information
            const question_data = {
                reactionTime: reactionTime,
                operationText: operationText,
                questionAnswer: question_answer,
                operationType: question_operation,
                experience: xp
            };

            // Push object to game session data array
            game_session_data.push(question_data);

            // Call game ending function if progress bar is full
            if (progress_bar.value === progress_bar.max)
            {
                questionsDone(game_session_data);
                return;
            }

            // After delay of one second, display user input and math operations
            setTimeout(function() {
                document.getElementById('operation-container').classList.remove('hidden');
                guess.classList.remove('hidden');
            }, 1000);
        }
    });

    // Click anywhere with the mouse event listener
    document.addEventListener('click', function(event) {

        // Initialize clicked element to variable
        var targetElement = event.target;

        // Hides the panel when clicked outside of the panel or its toggle button
        if (!settingsPanel.contains(targetElement) && !targetElement.classList.contains('settings-button')) {
            settingsPanel.classList.remove('active');
        }
    });
});

// Create new question
function createQuestion(placeholders_object, settings_object) {

    // Randomly selects index as many as the number of selected game modes
    var randomIndex = Math.floor(Math.random() * gameModes.length);

    // Randomly determines which mathematical operation this question will be
    var randomOperation = gameModes[randomIndex];

    // Initialize random number one, the number on the left
    var rn_number_one = 0;

    // Initialize random number two, the number on the right
    var rn_number_two = 0;

    // Random number generator for both number between in a range
    function numbersGenerator(settings_min, settings_max) {

        // Randomly determines how many digits the number will have
        NUMBER_OF_DIGITS = getRndInteger(settings_min, settings_max);

        // Example: [1, 9], [10, 99], [100, 999] ...
        var lower_bound = 10 ** (NUMBER_OF_DIGITS-1);
        var upper_bound = (10 ** NUMBER_OF_DIGITS)-1;

        // The first number takes a random value between the lower limit and the upper limit
        rn_number_one = getRndInteger(lower_bound, upper_bound);

        // If the checkbox in the settings panel is ticked
        if (random_number_of_digits) {

            // The process is repeated so that two numbers can be in different digits
            NUMBER_OF_DIGITS = getRndInteger(settings_min, settings_max);
            lower_bound = 10 ** (NUMBER_OF_DIGITS-1);
            upper_bound = (10 ** NUMBER_OF_DIGITS)-1;
        }

        // The second number takes a random value between the new lower limit and the upper limit
        rn_number_two = getRndInteger(lower_bound, upper_bound);
    }

    // Stores whether the checkbox in the settings panel is ticked or not
    random_number_of_digits = document.getElementById('random-number-digits').checked;

    // If this question is addition operation
    if (randomOperation === "Addition")
    {
        // Create both numbers with the lower and upper limit information from the settings panel
        numbersGenerator(parseInt(settings_object["addition_min"].value), parseInt(settings_object["addition_max"].value));
        
        // Set operation symbol to plus
        placeholders_object["placeholder_center"].innerHTML = "+";

        // Set correct answer
        question_answer = rn_number_one + rn_number_two;
    }

    // If this question is subtraction operation
    if (randomOperation === "Subtraction")
    {
        // Create both numbers with the lower and upper limit information from the settings panel
        numbersGenerator(parseInt(settings_object["subtraction_min"].value), parseInt(settings_object["subtraction_max"].value));
        
        // Set operation symbol to minus
        placeholders_object["placeholder_center"].innerHTML = "-";

        // Set correct answer
        question_answer = rn_number_one - rn_number_two;
    }

    // If this question is multiplication operation
    if (randomOperation === "Multiplication")
    {
        // Create both numbers with the lower and upper limit information from the settings panel
        numbersGenerator(parseInt(settings_object["multiplication_min"].value), parseInt(settings_object["multiplication_max"].value));
        
        // Set operation symbol to multiplication sign
        placeholders_object["placeholder_center"].innerHTML = "*";

        // Set correct answer
        question_answer = rn_number_one * rn_number_two;
    }

    // If this question is division operation
    if (randomOperation === "Division")
    {
        // Determine how many digits this number will have with lower and upper limit information from the settings panel
        NUMBER_OF_DIGITS = getRndInteger(parseInt(settings_object["division_min"].value), parseInt(settings_object["division_max"].value));
        
        // Example: [1, 9], [10, 99], [100, 999] ...
        var lower_bound = 10 ** (NUMBER_OF_DIGITS-1);
        var upper_bound = (10 ** NUMBER_OF_DIGITS)-1;

        // Random generation of divisor according to lower and upper limits
        var rn_number_two = getRndInteger(lower_bound, upper_bound);

        // For the division result to be an integer, generate a number between 2 and 20 times the divisor.
        var rn_number_one = rn_number_two * getRndInteger(2, 20);

        // Set operation symbol to slash
        placeholders_object["placeholder_center"].innerHTML = "/";

        // Set correct answer
        question_answer = rn_number_one / rn_number_two;
    }

    // Sets operation string for question data object
    question_operation = randomOperation;

    // Set the generated number to the innerHTML element on the left of the screen
    placeholders_object["placeholder_left"].innerHTML = rn_number_one;

    // Set the generated number to the innerHTML element on the right of the screen
    placeholders_object["placeholder_right"].innerHTML = rn_number_two;

    // Starting moment for reaction time
    startTime = performance.now();
}

// Display or hide settings panel
function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('active');
}

// Game ending function that sends game data to the python
function questionsDone(game_session_data) {

    // Sending a POST request to '/results' endpoint with the game session data
    fetch('/results', {
        method: 'POST',
        headers: {
            // Specifying content type as JSON
            'Content-Type': 'application/json',
        },

        // Converting data to JSON format
        body: JSON.stringify({ game_session_data }),
    })
    .then(response => {

        // If the response is successful
        if (response.ok) {

            // Redirecting to the '/results' page
            window.location.href = '/results';
        } 
    })
    .catch(error => {

        // Catching any errors that occur during the request
        console.error('An error occured:', error);
    });
}

// Generates random integers in a range
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Function of the range of values that can be entered for settings panel inputs
function checkMinMaxInput(event, id, pair_id){

    // Pressed key by the user
    key = event.key;

    // Ensure values between 1 and 5
    if (event.keyCode < 49) key = 1;
    else if (event.keyCode > 53) key = 5;

    // If the value is outside the range, clamp
    if (key > 5) key = 5;
    else if (key < 1) key = 1;

    // If the lower bound input exceeds the upper limit, set the maximum value of the lower bound to match the upper limit instead of five
    if (id.includes("min")) {
        if (key > document.getElementById(pair_id).value){
            key = document.getElementById(pair_id).value;
        }
    }
    // If the input represents the upper bound and the lower bound remains greater than the upper bound, align the lower bound value with the upper bound
    else if (id.includes("max")) {
        if (key < document.getElementById(pair_id).value){
            document.getElementById(pair_id).value = key;
        }
    }

    // Assign last value to input element value
    document.getElementById(id).value = key;
}
