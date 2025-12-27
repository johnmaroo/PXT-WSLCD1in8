/**
 * Waveshare 1.8" LCD for micro:bit v2
 * 160x128 TFT display with ST7735R controller
 * 
 * Version 3.0.0 - Optimized for performance
 * 
 * Hardware connections:
 *   DIN  -> P15 (SPI MOSI)
 *   CLK  -> P13 (SPI SCK)
 *   CS   -> P16 (LCD Chip Select)
 *   DC   -> P12 (Data/Command)
 *   RST  -> P8  (Reset)
 *   BL   -> P1  (Backlight PWM)
 *   RAM  -> P2  (SRAM Chip Select)
 * 
 * Wiki: https://www.waveshare.com/wiki/1.8inch_LCD_for_micro:bit
 * 
 * @author Original: Waveshare (hnwangkg-ezio)
 * @author Optimized: 2024
 */

/**
 * Legacy compatibility layer for LCD1IN8 namespace
 * Maps old API to new optimized Graphics API
 */
//% weight=20 color=#436EEE icon="\uf108"
//% groups="['Setup', 'Display', 'Drawing', 'Shapes', 'Text']"
namespace LCD1IN8 {

    // ==================== SETUP ====================

    /**
     * Initialize the LCD display
     */
    //% blockId=lcd_init
    //% block="LCD initialize"
    //% group="Setup"
    //% weight=100
    export function LCD_Init(): void {
        Graphics.init()
    }

    /**
     * Set the backlight level (0-1023)
     */
    //% blockId=lcd_set_bl
    //% block="set backlight %level"
    //% level.min=0 level.max=1023
    //% group="Setup"
    //% weight=95
    export function LCD_SetBL(level: number): void {
        // FIX: Actually use the level parameter (was hardcoded to 1023)
        LCD.setBacklight(level)
    }

    // ==================== DISPLAY ====================

    /**
     * Clear the LCD to white
     */
    //% blockId=lcd_clear
    //% block="LCD clear"
    //% group="Display"
    //% weight=90
    export function LCD_Clear(): void {
        Graphics.clear(Color.WHITE)
        Graphics.displayFull()
    }

    /**
     * Fill the LCD with a color
     */
    //% blockId=lcd_filling
    //% block="fill screen with %color"
    //% color.shadow=colorNumberPicker
    //% group="Display"
    //% weight=85
    export function LCD_Filling(color: number): void {
        Graphics.clear(color)
        Graphics.displayFull()
    }

    /**
     * Clear the drawing buffer
     */
    //% blockId=lcd_clear_buf
    //% block="clear drawing buffer"
    //% group="Display"
    //% weight=80
    export function LCD_ClearBuf(): void {
        Graphics.clear(Color.WHITE)
    }

    /**
     * Update the display with the buffer contents
     */
    //% blockId=lcd_display
    //% block="update display"
    //% group="Display"
    //% weight=75
    export function LCD_Display(): void {
        Graphics.displayFull()
    }

    // ==================== DRAWING ====================

    /**
     * Draw a point on the display
     */
    //% blockId=lcd_draw_point
    //% block="draw point x %x y %y color %color size %size"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=colorNumberPicker
    //% group="Drawing"
    //% weight=70
    export function DrawPoint(x: number, y: number, color: number, size: PixelSize): void {
        Graphics.drawPoint(x, y, color, size)
    }

    /**
     * Draw a line
     */
    //% blockId=lcd_draw_line
    //% block="draw line from x1 %x1 y1 %y1 to x2 %x2 y2 %y2 color %color width %width style %style"
    //% x1.min=0 x1.max=159 y1.min=0 y1.max=127
    //% x2.min=0 x2.max=159 y2.min=0 y2.max=127
    //% color.shadow=colorNumberPicker
    //% group="Shapes"
    //% weight=65
    export function DrawLine(x1: number, y1: number, x2: number, y2: number, color: number, width: PixelSize, style: LineStyle): void {
        Graphics.drawLine(x1, y1, x2, y2, color, width, style)
    }

    /**
     * Draw a rectangle
     */
    //% blockId=lcd_draw_rect
    //% block="draw rectangle x1 %x1 y1 %y1 x2 %x2 y2 %y2 color %color filled %filled width %width"
    //% x1.min=0 x1.max=159 y1.min=0 y1.max=127
    //% x2.min=0 x2.max=159 y2.min=0 y2.max=127
    //% color.shadow=colorNumberPicker
    //% group="Shapes"
    //% weight=60
    export function DrawRectangle(x1: number, y1: number, x2: number, y2: number, color: number, filled: FillMode, width: PixelSize): void {
        // FIX: Properly handle coordinate swap (old code was broken)
        const left = Math.min(x1, x2)
        const top = Math.min(y1, y2)
        const w = Math.abs(x2 - x1) + 1
        const h = Math.abs(y2 - y1) + 1
        Graphics.drawRect(left, top, w, h, color, filled, width)
    }

    /**
     * Draw a circle
     */
    //% blockId=lcd_draw_circle
    //% block="draw circle x %cx y %cy radius %r color %color filled %filled width %width"
    //% cx.min=0 cx.max=159 cy.min=0 cy.max=127
    //% r.min=1 r.max=64
    //% color.shadow=colorNumberPicker
    //% group="Shapes"
    //% weight=55
    export function DrawCircle(cx: number, cy: number, r: number, color: number, filled: FillMode, width: PixelSize): void {
        Graphics.drawCircle(cx, cy, r, color, filled)
    }

    // ==================== TEXT ====================

    /**
     * Display a string
     */
    //% blockId=lcd_dis_string
    //% block="show text %text at x %x y %y color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=colorNumberPicker
    //% group="Text"
    //% weight=50
    export function DisString(x: number, y: number, text: string, color: number): void {
        Graphics.drawText(text, x, y, color)
    }

    /**
     * Display a number
     */
    //% blockId=lcd_dis_number
    //% block="show number %num at x %x y %y color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=colorNumberPicker
    //% group="Text"
    //% weight=45
    export function DisNumber(x: number, y: number, num: number, color: number): void {
        Graphics.drawNumber(num, x, y, color)
    }
}

// ==================== LEGACY ENUM COMPATIBILITY ====================

/**
 * @deprecated Use PixelSize instead
 */
enum DOT_PIXEL {
    DOT_PIXEL_1 = PixelSize.SIZE_1,
    DOT_PIXEL_2 = PixelSize.SIZE_2,
    DOT_PIXEL_3 = PixelSize.SIZE_3,
    DOT_PIXEL_4 = PixelSize.SIZE_4
}

/**
 * @deprecated Use LineStyle instead
 */
enum LINE_STYLE {
    LINE_SOLID = LineStyle.SOLID,
    LINE_DOTTED = LineStyle.DOTTED
}

/**
 * @deprecated Use FillMode instead
 */
enum DRAW_FILL {
    DRAW_EMPTY = 0,  // FillMode.OUTLINE
    DRAW_FULL = 1    // FillMode.FILLED
}

/**
 * @deprecated Use Color instead
 */
enum COLOR {
    WHITE = Color.WHITE,
    BLACK = Color.BLACK,
    BLUE = Color.BLUE,
    RED = Color.RED,
    GREEN = Color.GREEN,
    CYAN = Color.CYAN,
    MAGENTA = Color.MAGENTA,
    YELLOW = Color.YELLOW,
    GRAY = Color.GRAY,
    BRED = 0xF81F,
    GRED = 0xFFE0,
    GBLUE = 0x07FF,
    BROWN = Color.BROWN,
    BRRED = 0xFC07
}
