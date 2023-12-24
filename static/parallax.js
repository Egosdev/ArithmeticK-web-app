// https://codepen.io/Mojer/pen/VrqrbN
// I transformed the logic coded by Mojer here into vanilla JavaScript and used it.

document.addEventListener("DOMContentLoaded", function() {

    // Strength of movement for the parallax effect
    var movementStrength = 25;

    // Calculate movement power without exceeding the screen limit based on window sizes
    var height = movementStrength / window.innerHeight;
    var width = movementStrength / window.innerWidth;

    // Background image div element
    var topImage = document.getElementById('parallax-bg');

    // Event listener for mouse movement
    addEventListener('mousemove', function(e) {

        // Calculate the position of the mouse relative to the center of the window
        var pageX = e.pageX - (window.innerWidth / 2);
        var pageY = e.pageY - (window.innerHeight / 2);

        // Calculate the new position values for the parallax effect
        var newvalueX = width * pageX * -1 - 25;
        var newvalueY = height * pageY * -1 - 50;

        // Apply the new background position based on mouse movement as x, y px
        topImage.style.backgroundPosition = newvalueX + "px " + newvalueY + "px";
    });
});
