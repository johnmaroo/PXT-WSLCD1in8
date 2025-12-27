/**
 * Test file for Waveshare 1.8" LCD
 * Demonstrates both new and legacy APIs
 */

// ==================== NEW API TEST ====================
// The new Graphics API is more intuitive and performs better

// Initialize the display
Graphics.init()

// Set backlight to 80%
Graphics.setBacklight(80)

// Clear screen to a nice blue
Graphics.clear(Color.BLUE)

// Draw some shapes
Graphics.fillRect(10, 10, 50, 30, Color.WHITE)
Graphics.drawRect(70, 10, 50, 30, Color.YELLOW, FillMode.OUTLINE, PixelSize.SIZE_2)

// Draw a filled circle
Graphics.fillCircle(40, 80, 20, Color.RED)

// Draw a circle outline
Graphics.drawCircle(110, 80, 20, Color.GREEN, FillMode.OUTLINE)

// Draw some lines
Graphics.drawLine(0, 0, 159, 127, Color.WHITE, PixelSize.SIZE_1, LineStyle.SOLID)
Graphics.drawLine(0, 127, 159, 0, Color.CYAN, PixelSize.SIZE_1, LineStyle.DOTTED)

// Draw text
Graphics.drawText("Hello!", 60, 55, Color.YELLOW)
Graphics.drawNumber(2024, 100, 110, Color.WHITE)

// Update the display
Graphics.display()

// ==================== LEGACY API TEST ====================
// The old LCD1IN8 API still works for backward compatibility
/*
LCD1IN8.LCD_Init()
LCD1IN8.LCD_SetBL(800)
LCD1IN8.LCD_ClearBuf()

LCD1IN8.DrawPoint(41, 18, Color.RED, DOT_PIXEL.DOT_PIXEL_4)

LCD1IN8.DrawLine(
    10, 100,
    150, 20,
    Color.CYAN,
    DOT_PIXEL.DOT_PIXEL_2,
    LINE_STYLE.LINE_DOTTED
)

LCD1IN8.DrawRectangle(
    21, 42,
    56, 67,
    Color.GREEN,
    DRAW_FILL.DRAW_EMPTY,
    DOT_PIXEL.DOT_PIXEL_1
)

LCD1IN8.DrawCircle(
    100, 60,
    25,
    Color.YELLOW,
    DRAW_FILL.DRAW_FULL,
    DOT_PIXEL.DOT_PIXEL_1
)

LCD1IN8.DisString(10, 10, "Hello World!", Color.WHITE)
LCD1IN8.DisNumber(10, 25, 12345, Color.RED)

LCD1IN8.LCD_Display()
*/

// Animation loop example
basic.forever(function () {
    // You can add animation code here
    // Remember to call Graphics.display() after drawing
})
