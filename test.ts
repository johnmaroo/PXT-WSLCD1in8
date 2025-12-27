/**
 * Simple Animation Test for Waveshare 1.8" LCD
 */

// Initialize
Graphics.init()
Graphics.setBacklight(100)

// Clear to black
Graphics.clear(Color.BLACK)
Graphics.displayFull()

// Animation variables
let x = 80
let y = 64
let dx = 2
let dy = 1

// Simple animation loop
basic.forever(function () {
    // Erase old position
    Graphics.fillRect(x - 12, y - 12, 24, 24, Color.BLACK)

    // Update position
    x = x + dx
    y = y + dy

    // Bounce
    if (x < 10 || x > 150) {
        dx = -dx
    }
    if (y < 10 || y > 118) {
        dy = -dy
    }

    // Draw new position
    Graphics.fillRect(x - 10, y - 10, 20, 20, Color.RED)

    // Update display
    Graphics.displayFull()

    // Small delay
    basic.pause(30)
})
