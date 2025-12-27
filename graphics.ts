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
    //% color.shadow=colorNumberPicker
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
    //% color.shadow=colorNumberPicker
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
    //% color.shadow=colorNumberPicker
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
    //% color.shadow=colorNumberPicker
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
    //% color.shadow=colorNumberPicker
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
    //% color.shadow=colorNumberPicker
    //% thickness.defl=PixelSize.SIZE_1
    //% style.defl=LineStyle.SOLID
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=50
    export function drawLine(x1: number, y1: number, x2: number, y2: number, color: number, thickness: PixelSize = PixelSize.SIZE_1, style: LineStyle = LineStyle.SOLID): void {
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
    //% color.shadow=colorNumberPicker
    //% fill.defl=FillMode.OUTLINE
    //% thickness.defl=PixelSize.SIZE_1
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=45
    export function drawRect(x: number, y: number, w: number, h: number, color: number, fill: FillMode = FillMode.OUTLINE, thickness: PixelSize = PixelSize.SIZE_1): void {
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
    //% color.shadow=colorNumberPicker
    //% group="Shapes"
    //% weight=44
    export function fillRect(x: number, y: number, w: number, h: number, color: number): void {
        drawRect(x, y, w, h, color, FillMode.FILLED)
    }

    //% blockId=gfx_draw_circle
    //% block="draw circle at x %cx y %cy radius %r color %color || fill %fill"
    //% cx.min=0 cx.max=159 cy.min=0 cy.max=127
    //% r.min=1 r.max=64
    //% color.shadow=colorNumberPicker
    //% fill.defl=FillMode.OUTLINE
    //% expandableArgumentMode="toggle"
    //% group="Shapes"
    //% weight=40
    export function drawCircle(cx: number, cy: number, r: number, color: number, fill: FillMode = FillMode.OUTLINE): void {
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
    //% color.shadow=colorNumberPicker
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
}

