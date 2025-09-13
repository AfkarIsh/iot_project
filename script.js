document.addEventListener('DOMContentLoaded', () => {
    const ledToggle = document.getElementById('ledToggle');

    if (ledToggle) {
        ledToggle.addEventListener('change', (event) => {
            if (event.target.checked) {
                console.log("LED is ON");
                // Add your code here to send a signal to turn the LED on
            } else {
                console.log("LED is OFF");
                // Add your code here to send a signal to turn the LED off
            }
        });
    }
});