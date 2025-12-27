/**
 * Animation Demo for Waveshare 1.8" LCD
 * Tests performance and animation features
 */

// Initialize
Graphics.init()
Graphics.setBacklight(100)
Graphics.setTargetFPS(30)

// Variables for animation
let ballX = 80
let ballY = 64
let ballVX = 3
let ballVY = 2
let ballRadius = 10

// Clear to black
Graphics.clear(Color.BLACK)
Graphics.displayFull()

// Animation loop
basic.forever(function () {
    Graphics.beginFrame()

    // Clear previous ball position (draw black circle)
    Graphics.fillCircle(ballX, ballY, ballRadius + 1, Color.BLACK)

    // Update ball position
    ballX += ballVX
    ballY += ballVY

    // Bounce off walls
    if (ballX <= ballRadius || ballX >= 160 - ballRadius) {
        ballVX = -ballVX
        ballX += ballVX
    }
    if (ballY <= ballRadius || ballY >= 128 - ballRadius) {
        ballVY = -ballVY
        ballY += ballVY
    }

    // Draw ball at new position
    Graphics.fillCircle(ballX, ballY, ballRadius, Color.RED)

    // Draw FPS counter
    Graphics.fillRect(0, 0, 50, 14, Color.BLACK)
    Graphics.drawText("FPS:" + Graphics.currentFPS(), 2, 2, Color.WHITE)

    // Update display
    Graphics.display()

    Graphics.endFrame()
})
