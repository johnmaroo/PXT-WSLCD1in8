/**
 * Graphics library for drawing primitives
 * All drawing operations write to SRAM frame buffer
 * Call display() to transfer to LCD
 * 
 * Key optimizations:
 * - Horizontal line drawing uses stream mode
 * - Rectangle fill uses optimized row fills
 * - Dirty region tracking for partial updates
 */

//% weight=20 color=#436EEE icon="\uf108"
//% groups="['Display', 'Drawing', 'Shapes', 'Text']"
namespace Graphics {
    // Track dirty region for partial updates
    let dirtyX1 = 0
    let dirtyY1 = 0
    let dirtyX2 = LCD_WIDTH - 1
    let dirtyY2 = LCD_HEIGHT - 1
    let isDirty = true

    /**
     * Mark a region as dirty (needs update)
     */
    function markDirty(x1: number, y1: number, x2: number, y2: number): void {
        if (!isDirty) {
            dirtyX1 = x1
            dirtyY1 = y1
            dirtyX2 = x2
            dirtyY2 = y2
            isDirty = true
        } else {
            dirtyX1 = Math.min(dirtyX1, x1)
            dirtyY1 = Math.min(dirtyY1, y1)
            dirtyX2 = Math.max(dirtyX2, x2)
            dirtyY2 = Math.max(dirtyY2, y2)
        }
    }

    /**
     * Clamp value to screen bounds
     */
    function clampX(x: number): number {
        return Math.clamp(0, LCD_WIDTH - 1, x)
    }

    function clampY(y: number): number {
        return Math.clamp(0, LCD_HEIGHT - 1, y)
    }

    //% blockId=gfx_init
    //% block="initialize display"
    //% group="Display"
    //% weight=100
    export function init(): void {
        LCD.init()
        clear(Color.WHITE)
    }

    //% blockId=gfx_clear
    //% block="clear screen with %color"
    //% color.shadow=gfx_color_picker
    //% group="Display"
    //% weight=95
    export function clear(color: number): void {
        SRAM.fillColor(color)
        markDirty(0, 0, LCD_WIDTH - 1, LCD_HEIGHT - 1)
    }

    //% blockId=gfx_display
    //% block="update display"
    //% group="Display"
    //% weight=90
    export function display(): void {
        if (!isDirty) return

        // Transfer only the dirty region
        LCD.transferRegion(
            clampX(dirtyX1),
            clampY(dirtyY1),
            clampX(dirtyX2) - clampX(dirtyX1) + 1,
            clampY(dirtyY2) - clampY(dirtyY1) + 1
        )

        isDirty = false
    }

    //% blockId=gfx_display_full
    //% block="update full display"
    //% group="Display"
    //% weight=85
    export function displayFull(): void {
        LCD.transferFromSRAM()
        isDirty = false
    }

    //% blockId=gfx_set_backlight
    //% block="set backlight to %level"
    //% level.min=0 level.max=100
    //% group="Display"
    //% weight=80
    export function setBacklight(level: number): void {
        // Convert 0-100 to 0-1023
        const pwmValue = Math.map(level, 0, 100, 0, 1023)
        LCD.setBacklight(pwmValue)
    }

    //% blockId=gfx_draw_pixel
    //% block="draw pixel at x %x y %y color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=gfx_color_picker
    //% group="Drawing"
    //% weight=70
    export function drawPixel(x: number, y: number, color: number): void {
        if (x < 0 || x >= LCD_WIDTH || y < 0 || y >= LCD_HEIGHT) return
        
        const addr = SRAM.getPixelAddr(x, y)
        SRAM.writeColor(addr, color)
        markDirty(x, y, x, y)
    }

    /**
     * Draw a pixel with a given size (thickness)
     */
    //% blockId=gfx_draw_point
    //% block="draw point at x %x y %y color %color size %size"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=gfx_color_picker
    //% group="Drawing"
    //% weight=65
    export function drawPoint(x: number, y: number, color: number, size: PixelSize): void {
        const half = Math.floor(size / 2)
        const x1 = clampX(x - half)
        const y1 = clampY(y - half)
        const x2 = clampX(x + half)
        const y2 = clampY(y + half)

        // Use horizontal line fills for efficiency
        for (let py = y1; py <= y2; py++) {
            SRAM.writeHLine(x1, py, x2 - x1 + 1, color)
        }
        markDirty(x1, y1, x2, y2)
    }

    //% blockId=gfx_draw_hline
    //% block="draw horizontal line from x %x y %y length %length color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127 length.min=1 length.max=160
    //% color.shadow=gfx_color_picker
    //% group="Drawing"
    //% weight=60
    export function drawHLine(x: number, y: number, length: number, color: number): void {
        if (y < 0 || y >= LCD_HEIGHT) return
        const x1 = clampX(x)
        const x2 = clampX(x + length - 1)
        if (x1 > x2) return

        SRAM.writeHLine(x1, y, x2 - x1 + 1, color)
        markDirty(x1, y, x2, y)
    }

    //% blockId=gfx_draw_vline
    //% block="draw vertical line from x %x y %y length %length color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127 length.min=1 length.max=128
    //% color.shadow=gfx_color_picker
    //% group="Drawing"
    //% weight=55
    export function drawVLine(x: number, y: number, length: number, color: number): void {
        if (x < 0 || x >= LCD_WIDTH) return
        const y1 = clampY(y)
        const y2 = clampY(y + length - 1)
        if (y1 > y2) return

        // Vertical lines are less efficient - write pixel by pixel
        for (let py = y1; py <= y2; py++) {
            const addr = SRAM.getPixelAddr(x, py)
            SRAM.writeColor(addr, color)
        }
        markDirty(x, y1, x, y2)
    }

    //% blockId=gfx_draw_line
    //% block="draw line from x1 %x1 y1 %y1 to x2 %x2 y2 %y2 color %color || thickness %thickness style %style"
    //% x1.min=0 x1.max=159 y1.min=0 y1.max=127
    //% x2.min=0 x2.max=159 y2.min=0 y2.max=127
    //% color.shadow=gfx_color_picker
    //% thickness.defl=1
    //% style.defl=0
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=50
    export function drawLine(x1: number, y1: number, x2: number, y2: number, color: number, thickness: PixelSize = 1, style: LineStyle = 0): void {
        // Optimize for horizontal and vertical lines
        if (y1 === y2) {
            const startX = Math.min(x1, x2)
            const length = Math.abs(x2 - x1) + 1
            if (thickness === PixelSize.SIZE_1 && style === LineStyle.SOLID) {
                drawHLine(startX, y1, length, color)
            } else {
                for (let px = startX; px < startX + length; px++) {
                    if (style === LineStyle.SOLID || (px % 4 < 2)) {
                        drawPoint(px, y1, color, thickness)
                    }
                }
            }
            return
        }

        if (x1 === x2) {
            const startY = Math.min(y1, y2)
            const length = Math.abs(y2 - y1) + 1
            if (thickness === PixelSize.SIZE_1 && style === LineStyle.SOLID) {
                drawVLine(x1, startY, length, color)
            } else {
                for (let py = startY; py < startY + length; py++) {
                    if (style === LineStyle.SOLID || (py % 4 < 2)) {
                        drawPoint(x1, py, color, thickness)
                    }
                }
            }
            return
        }

        // Bresenham's line algorithm for diagonal lines
        let dx = Math.abs(x2 - x1)
        let dy = Math.abs(y2 - y1)
        let sx = x1 < x2 ? 1 : -1
        let sy = y1 < y2 ? 1 : -1
        let err = dx - dy

        let x = x1
        let y = y1
        let step = 0

        while (true) {
            // Draw based on line style
            if (style === LineStyle.SOLID) {
                if (thickness === PixelSize.SIZE_1) {
                    drawPixel(x, y, color)
                } else {
                    drawPoint(x, y, color, thickness)
                }
            } else if (style === LineStyle.DOTTED && step % 3 === 0) {
                if (thickness === PixelSize.SIZE_1) {
                    drawPixel(x, y, color)
                } else {
                    drawPoint(x, y, color, thickness)
                }
            } else if (style === LineStyle.DASHED && step % 6 < 4) {
                if (thickness === PixelSize.SIZE_1) {
                    drawPixel(x, y, color)
                } else {
                    drawPoint(x, y, color, thickness)
                }
            }

            if (x === x2 && y === y2) break

            let e2 = 2 * err
            if (e2 > -dy) {
                err -= dy
                x += sx
            }
            if (e2 < dx) {
                err += dx
                y += sy
            }
            step++
        }

        markDirty(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2))
    }

    //% blockId=gfx_draw_rect
    //% block="draw rectangle x %x y %y width %w height %h color %color || fill %fill thickness %thickness"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% w.min=1 w.max=160 h.min=1 h.max=128
    //% color.shadow=gfx_color_picker
    //% fill.defl=0
    //% thickness.defl=1
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=45
    export function drawRect(x: number, y: number, w: number, h: number, color: number, fill: FillMode = 0, thickness: PixelSize = 1): void {
        const x1 = clampX(x)
        const y1 = clampY(y)
        const x2 = clampX(x + w - 1)
        const y2 = clampY(y + h - 1)

        if (fill === FillMode.FILLED) {
            // Fill rectangle using optimized SRAM fill
            SRAM.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1, color)
        } else {
            // Draw outline
            drawLine(x1, y1, x2, y1, color, thickness)  // Top
            drawLine(x1, y2, x2, y2, color, thickness)  // Bottom
            drawLine(x1, y1, x1, y2, color, thickness)  // Left
            drawLine(x2, y1, x2, y2, color, thickness)  // Right
        }

        markDirty(x1, y1, x2, y2)
    }

    //% blockId=gfx_fill_rect
    //% block="fill rectangle x %x y %y width %w height %h color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% w.min=1 w.max=160 h.min=1 h.max=128
    //% color.shadow=gfx_color_picker
    //% group="Shapes"
    //% weight=44
    export function fillRect(x: number, y: number, w: number, h: number, color: number): void {
        drawRect(x, y, w, h, color, FillMode.FILLED)
    }

    //% blockId=gfx_draw_circle
    //% block="draw circle at x %cx y %cy radius %r color %color || fill %fill"
    //% cx.min=0 cx.max=159 cy.min=0 cy.max=127
    //% r.min=1 r.max=64
    //% color.shadow=gfx_color_picker
    //% fill.defl=0
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=40
    export function drawCircle(cx: number, cy: number, r: number, color: number, fill: FillMode = 0): void {
        // Midpoint circle algorithm
        let x = 0
        let y = r
        let d = 3 - 2 * r

        if (fill === FillMode.FILLED) {
            while (x <= y) {
                // Draw horizontal lines for filled circle
                drawHLine(cx - x, cy + y, 2 * x + 1, color)
                drawHLine(cx - x, cy - y, 2 * x + 1, color)
                drawHLine(cx - y, cy + x, 2 * y + 1, color)
                drawHLine(cx - y, cy - x, 2 * y + 1, color)

                if (d < 0) {
                    d = d + 4 * x + 6
                } else {
                    d = d + 4 * (x - y) + 10
                    y--
                }
                x++
            }
        } else {
            while (x <= y) {
                // Draw 8 symmetric points
                drawPixel(cx + x, cy + y, color)
                drawPixel(cx - x, cy + y, color)
                drawPixel(cx + x, cy - y, color)
                drawPixel(cx - x, cy - y, color)
                drawPixel(cx + y, cy + x, color)
                drawPixel(cx - y, cy + x, color)
                drawPixel(cx + y, cy - x, color)
                drawPixel(cx - y, cy - x, color)

                if (d < 0) {
                    d = d + 4 * x + 6
                } else {
                    d = d + 4 * (x - y) + 10
                    y--
                }
                x++
            }
        }

        markDirty(cx - r, cy - r, cx + r, cy + r)
    }

    //% blockId=gfx_fill_circle
    //% block="fill circle at x %cx y %cy radius %r color %color"
    //% cx.min=0 cx.max=159 cy.min=0 cy.max=127
    //% r.min=1 r.max=64
    //% color.shadow=gfx_color_picker
    //% group="Shapes"
    //% weight=39
    export function fillCircle(cx: number, cy: number, r: number, color: number): void {
        drawCircle(cx, cy, r, color, FillMode.FILLED)
    }

    /**
     * Create RGB565 color from RGB components
     */
    //% blockId=gfx_rgb
    //% block="color from red %r green %g blue %b"
    //% r.min=0 r.max=255 g.min=0 g.max=255 b.min=0 b.max=255
    //% group="Drawing"
    //% weight=30
    export function rgb(r: number, g: number, b: number): number {
        // Convert 8-bit RGB to RGB565
        const r5 = (r >> 3) & 0x1F
        const g6 = (g >> 2) & 0x3F
        const b5 = (b >> 3) & 0x1F
        return (r5 << 11) | (g6 << 5) | b5
    }

    /**
     * Get screen width
     */
    //% blockId=gfx_width
    //% block="screen width"
    //% group="Display"
    //% weight=20
    export function width(): number {
        return LCD_WIDTH
    }

    /**
     * Get screen height
     */
    //% blockId=gfx_height
    //% block="screen height"
    //% group="Display"
    //% weight=19
    export function height(): number {
        return LCD_HEIGHT
    }

    //% blockId=gfx_draw_text
    //% block="draw text %text at x %x y %y color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=gfx_color_picker
    //% group="Text"
    //% weight=35
    export function drawText(text: string, x: number, y: number, color: number): void {
        let cursorX = x
        let cursorY = y

        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i)

            // Handle newline
            if (char === '\n') {
                cursorX = x
                cursorY += Font.CHAR_HEIGHT
                continue
            }

            // Word wrap
            if (cursorX + Font.CHAR_WIDTH > LCD_WIDTH) {
                cursorX = x
                cursorY += Font.CHAR_HEIGHT
            }

            // Stop if off screen vertically
            if (cursorY + Font.CHAR_HEIGHT > LCD_HEIGHT) break

            Font.drawChar(cursorX, cursorY, char, color)
            cursorX += Font.CHAR_WIDTH
        }
    }

    //% blockId=gfx_draw_text_bg
    //% block="draw text %text at x %x y %y color %color background %bgColor"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=gfx_color_picker
    //% bgColor.shadow=gfx_color_picker
    //% group="Text"
    //% weight=34
    export function drawTextWithBackground(text: string, x: number, y: number, color: number, bgColor: number): void {
        let cursorX = x
        let cursorY = y

        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i)

            if (char === '\n') {
                cursorX = x
                cursorY += Font.CHAR_HEIGHT
                continue
            }

            if (cursorX + Font.CHAR_WIDTH > LCD_WIDTH) {
                cursorX = x
                cursorY += Font.CHAR_HEIGHT
            }

            if (cursorY + Font.CHAR_HEIGHT > LCD_HEIGHT) break

            Font.drawChar(cursorX, cursorY, char, color, bgColor)
            cursorX += Font.CHAR_WIDTH
        }
    }

    //% blockId=gfx_draw_number
    //% block="draw number %num at x %x y %y color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% color.shadow=gfx_color_picker
    //% group="Text"
    //% weight=33
    export function drawNumber(num: number, x: number, y: number, color: number): void {
        drawText(num.toString(), x, y, color)
    }

    // ==================== COLOR PICKER ====================

    /**
     * Pick an RGB565 color
     */
    //% blockId=gfx_color_picker
    //% block="%color"
    //% color.shadow="colorWheelPicker"
    //% blockHidden=true
    //% shim=TD_ID
    export function __colorPicker(color: number): number {
        // Convert from 24-bit to RGB565
        const r = (color >> 16) & 0xFF
        const g = (color >> 8) & 0xFF
        const b = color & 0xFF
        return rgb(r, g, b)
    }

    /**
     * Get a preset color
     */
    //% blockId=gfx_preset_color
    //% block="%c"
    //% group="Drawing"
    //% weight=29
    export function presetColor(c: Color): number {
        return c
    }

    // ==================== ANIMATION & PERFORMANCE ====================

    let frameStartTime = 0
    let lastFrameTime = 0
    let targetFps = 30

    /**
     * Set target frame rate for animations
     */
    //% blockId=gfx_set_fps
    //% block="set target FPS to %fps"
    //% fps.min=1 fps.max=60 fps.defl=30
    //% group="Animation"
    //% weight=28
    export function setTargetFPS(fps: number): void {
        targetFps = Math.clamp(1, 60, fps)
    }

    /**
     * Start timing a new frame (call at beginning of game loop)
     */
    //% blockId=gfx_frame_start
    //% block="begin frame"
    //% group="Animation"
    //% weight=27
    export function beginFrame(): void {
        frameStartTime = control.millis()
    }

    /**
     * End frame and wait to maintain target FPS
     */
    //% blockId=gfx_frame_end
    //% block="end frame"
    //% group="Animation"
    //% weight=26
    export function endFrame(): void {
        const frameTime = control.millis() - frameStartTime
        const targetFrameTime = 1000 / targetFps
        const waitTime = targetFrameTime - frameTime

        if (waitTime > 0) {
            basic.pause(waitTime)
        }

        lastFrameTime = control.millis() - frameStartTime
    }

    /**
     * Get the actual FPS from last frame
     */
    //% blockId=gfx_get_fps
    //% block="current FPS"
    //% group="Animation"
    //% weight=25
    export function currentFPS(): number {
        if (lastFrameTime <= 0) return targetFps
        return Math.round(1000 / lastFrameTime)
    }

    /**
     * Get milliseconds since last beginFrame
     */
    //% blockId=gfx_frame_time
    //% block="frame time ms"
    //% group="Animation"
    //% weight=24
    export function frameTime(): number {
        return control.millis() - frameStartTime
    }

    /**
     * Draw a sprite (small image) from a buffer
     * Buffer format: width, height, then pixel data (RGB565 high/low bytes)
     */
    //% blockId=gfx_draw_sprite
    //% block="draw sprite %data at x %x y %y"
    //% group="Animation"
    //% weight=23
    //% advanced=true
    export function drawSprite(data: Buffer, x: number, y: number): void {
        if (data.length < 2) return

        const w = data[0]
        const h = data[1]
        const pixelStart = 2

        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const idx = pixelStart + (py * w + px) * 2
                if (idx + 1 >= data.length) return

                const color = (data[idx] << 8) | data[idx + 1]
                // Skip transparent (magenta 0xF81F)
                if (color !== 0xF81F) {
                    const screenX = x + px
                    const screenY = y + py
                    if (screenX >= 0 && screenX < LCD_WIDTH && screenY >= 0 && screenY < LCD_HEIGHT) {
                        const addr = SRAM.getPixelAddr(screenX, screenY)
                        SRAM.writeColor(addr, color)
                    }
                }
            }
        }
    }

    /**
     * Create a solid color sprite buffer
     */
    //% blockId=gfx_create_sprite
    //% block="create sprite width %w height %h color %color"
    //% w.min=1 w.max=32 h.min=1 h.max=32
    //% color.shadow=gfx_color_picker
    //% group="Animation"
    //% weight=22
    //% advanced=true
    export function createSprite(w: number, h: number, color: number): Buffer {
        const size = 2 + w * h * 2
        const buf = Buffer.create(size)
        buf[0] = w
        buf[1] = h

        const highByte = (color >> 8) & 0xFF
        const lowByte = color & 0xFF

        for (let i = 0; i < w * h; i++) {
            buf[2 + i * 2] = highByte
            buf[2 + i * 2 + 1] = lowByte
        }

        return buf
    }

    /**
     * Scroll the entire screen in a direction
     */
    //% blockId=gfx_scroll
    //% block="scroll screen %dir by %pixels pixels fill %fillColor"
    //% pixels.min=1 pixels.max=128
    //% fillColor.shadow=gfx_color_picker
    //% group="Animation"
    //% weight=21
    export function scroll(dir: ScrollDirection, pixels: number, fillColor: number): void {
        // This is a software scroll - reads from SRAM and rewrites shifted
        // For simplicity, we just clear and let user redraw
        // A full implementation would copy SRAM regions

        if (dir === ScrollDirection.UP) {
            // Shift everything up, fill bottom
            for (let y = 0; y < LCD_HEIGHT - pixels; y++) {
                for (let x = 0; x < LCD_WIDTH; x++) {
                    const srcAddr = SRAM.getPixelAddr(x, y + pixels)
                    const dstAddr = SRAM.getPixelAddr(x, y)
                    // Read and write (inefficient but works)
                    const highByte = SRAM.readByte(srcAddr)
                    const lowByte = SRAM.readByte(srcAddr + 1)
                    SRAM.writeByte(dstAddr, highByte)
                    SRAM.writeByte(dstAddr + 1, lowByte)
                }
            }
            // Fill bottom
            SRAM.fillRect(0, LCD_HEIGHT - pixels, LCD_WIDTH, pixels, fillColor)
        }
        // Add other directions as needed
    }

    /**
     * Fast fill a region (optimized for speed)
     */
    //% blockId=gfx_fast_fill
    //% block="fast fill x %x y %y width %w height %h color %color"
    //% x.min=0 x.max=159 y.min=0 y.max=127
    //% w.min=1 w.max=160 h.min=1 h.max=128
    //% color.shadow=gfx_color_picker
    //% group="Animation"
    //% weight=20
    export function fastFill(x: number, y: number, w: number, h: number, color: number): void {
        SRAM.fillRect(x, y, w, h, color)
    }
}

/**
 * Scroll direction for screen scrolling
 */
enum ScrollDirection {
    //% block="up"
    UP = 0,
    //% block="down"
    DOWN = 1,
    //% block="left"
    LEFT = 2,
    //% block="right"
    RIGHT = 3
}

