/**
 * Optimized LCD driver for ST7735R controller
 * 160x128 TFT display
 * 
 * Key optimizations:
 * - Cached window state to avoid redundant commands
 * - Bulk data transfers
 * - Efficient initialization sequence
 */

//% weight=15
namespace LCD {
    let initialized = false
    let displayOn = false
    let backlightLevel = 1023

    // Cached window coordinates to avoid redundant commands
    let windowX1 = -1
    let windowY1 = -1
    let windowX2 = -1
    let windowY2 = -1

    /**
     * Write a command byte to the LCD
     */
    function writeCommand(cmd: number): void {
        pins.digitalWritePin(LCDPins.LCD_DC, 0)  // Command mode
        pins.digitalWritePin(LCDPins.LCD_CS, 0)
        pins.spiWrite(cmd)
        pins.digitalWritePin(LCDPins.LCD_CS, 1)
    }

    /**
     * Write a data byte to the LCD
     */
    function writeData(data: number): void {
        pins.digitalWritePin(LCDPins.LCD_DC, 1)  // Data mode
        pins.digitalWritePin(LCDPins.LCD_CS, 0)
        pins.spiWrite(data)
        pins.digitalWritePin(LCDPins.LCD_CS, 1)
    }

    /**
     * Write multiple data bytes (keeps CS low for efficiency)
     */
    function writeDataBulk(data: number[]): void {
        pins.digitalWritePin(LCDPins.LCD_DC, 1)
        pins.digitalWritePin(LCDPins.LCD_CS, 0)
        for (let i = 0; i < data.length; i++) {
            pins.spiWrite(data[i])
        }
        pins.digitalWritePin(LCDPins.LCD_CS, 1)
    }

    /**
     * Hardware reset the LCD
     */
    function hardwareReset(): void {
        pins.digitalWritePin(LCDPins.LCD_RST, 1)
        control.waitMicros(1000)
        pins.digitalWritePin(LCDPins.LCD_RST, 0)
        control.waitMicros(10000)  // 10ms reset pulse
        pins.digitalWritePin(LCDPins.LCD_RST, 1)
        control.waitMicros(120000) // 120ms after reset
    }

    /**
     * Initialize the ST7735R LCD controller
     */
    export function init(): void {
        // Set initial pin states
        pins.digitalWritePin(LCDPins.LCD_CS, 1)
        pins.digitalWritePin(LCDPins.LCD_DC, 1)

        // Hardware reset
        hardwareReset()

        // Frame rate control (normal mode)
        writeCommand(ST7735.FRMCTR1)
        writeDataBulk([0x01, 0x2C, 0x2D])

        // Frame rate control (idle mode)
        writeCommand(ST7735.FRMCTR2)
        writeDataBulk([0x01, 0x2C, 0x2D])

        // Frame rate control (partial mode)
        writeCommand(ST7735.FRMCTR3)
        writeDataBulk([0x01, 0x2C, 0x2D, 0x01, 0x2C, 0x2D])

        // Column inversion control
        writeCommand(ST7735.INVCTR)
        writeData(0x07)

        // Power control 1
        writeCommand(ST7735.PWCTR1)
        writeDataBulk([0xA2, 0x02, 0x84])

        // Power control 2
        writeCommand(ST7735.PWCTR2)
        writeData(0xC5)

        // Power control 3 (normal mode)
        writeCommand(ST7735.PWCTR3)
        writeDataBulk([0x0A, 0x00])

        // Power control 4 (idle mode)
        writeCommand(ST7735.PWCTR4)
        writeDataBulk([0x8A, 0x2A])

        // Power control 5 (partial mode)
        writeCommand(ST7735.PWCTR5)
        writeDataBulk([0x8A, 0xEE])

        // VCOM control
        writeCommand(ST7735.VMCTR1)
        writeData(0x0E)

        // Gamma positive
        writeCommand(ST7735.GMCTRP1)
        writeDataBulk([
            0x0F, 0x1A, 0x0F, 0x18, 0x2F, 0x28, 0x20, 0x22,
            0x1F, 0x1B, 0x23, 0x37, 0x00, 0x07, 0x02, 0x10
        ])

        // Gamma negative
        writeCommand(ST7735.GMCTRN1)
        writeDataBulk([
            0x0F, 0x1B, 0x0F, 0x17, 0x33, 0x2C, 0x29, 0x2E,
            0x30, 0x30, 0x39, 0x3F, 0x00, 0x07, 0x03, 0x10
        ])

        // Enable test command
        writeCommand(0xF0)
        writeData(0x01)

        // Disable RAM power save
        writeCommand(0xF6)
        writeData(0x00)

        // 16-bit color mode (RGB565)
        writeCommand(ST7735.COLMOD)
        writeData(0x05)

        // Memory access control (rotation & color order)
        writeCommand(ST7735.MADCTL)
        writeData(0xA0)  // Row/Column exchange, RGB order

        // Sleep out
        writeCommand(ST7735.SLPOUT)
        control.waitMicros(120000)  // 120ms delay after sleep out

        // Initialize SRAM
        SRAM.init()

        initialized = true

        // Turn on backlight
        setBacklight(backlightLevel)
    }

    /**
     * Set the drawing window on the LCD
     */
    export function setWindow(x1: number, y1: number, x2: number, y2: number): void {
        // Skip if window hasn't changed
        if (x1 === windowX1 && y1 === windowY1 && x2 === windowX2 && y2 === windowY2) {
            return
        }

        // Apply hardware offsets
        const xs = x1 + LCD_X_OFFSET
        const xe = x2 + LCD_X_OFFSET
        const ys = y1 + LCD_Y_OFFSET
        const ye = y2 + LCD_Y_OFFSET

        // Column address set
        writeCommand(ST7735.CASET)
        writeDataBulk([0x00, xs, 0x00, xe])

        // Row address set
        writeCommand(ST7735.RASET)
        writeDataBulk([0x00, ys, 0x00, ye])

        // Memory write command
        writeCommand(ST7735.RAMWR)

        // Cache window state
        windowX1 = x1
        windowY1 = y1
        windowX2 = x2
        windowY2 = y2
    }

    /**
     * Set backlight brightness (0-1023)
     */
    export function setBacklight(level: number): void {
        backlightLevel = Math.clamp(0, 1023, level)
        pins.analogWritePin(LCDPins.LCD_BL, backlightLevel)
    }

    /**
     * Turn display on
     */
    export function displayON(): void {
        writeCommand(ST7735.DISPON)
        displayOn = true
    }

    /**
     * Turn display off (backlight stays on)
     */
    export function displayOFF(): void {
        writeCommand(ST7735.DISPOFF)
        displayOn = false
    }

    /**
     * Begin writing pixel data to LCD (after setWindow)
     */
    export function beginPixelWrite(): void {
        pins.digitalWritePin(LCDPins.LCD_DC, 1)
        pins.digitalWritePin(LCDPins.LCD_CS, 0)
    }

    /**
     * Write a pixel color (call between begin/end)
     */
    export function writePixel(color: number): void {
        pins.spiWrite((color >> 8) & 0xFF)
        pins.spiWrite(color & 0xFF)
    }

    /**
     * End pixel write
     */
    export function endPixelWrite(): void {
        pins.digitalWritePin(LCDPins.LCD_CS, 1)
    }

    /**
     * Transfer entire frame buffer from SRAM to LCD
     * This is the main display update function
     * 
     * IMPORTANT: SRAM and LCD share SPI bus, so we must:
     * 1. Read from SRAM into buffer
     * 2. Write buffer to LCD
     * We do this in chunks of 640 bytes (2 rows) like original code
     */
    export function transferFromSRAM(): void {
        // Set window to full screen
        setWindow(0, 0, LCD_WIDTH - 1, LCD_HEIGHT - 1)

        // Buffer for 2 rows (640 bytes = 320 pixels)
        const chunkSize = 640
        let buffer: number[] = []
        for (let i = 0; i < chunkSize; i++) {
            buffer.push(0)
        }

        // Transfer in chunks of 2 rows (64 chunks for 128 rows)
        for (let chunk = 0; chunk < 64; chunk++) {
            const sramAddr = chunk * chunkSize

            // Step 1: Read from SRAM into buffer
            SRAM.setMode(SRAMMode.STREAM)
            pins.digitalWritePin(LCDPins.SRAM_CS, 0)
            pins.spiWrite(SRAMCommands.READ)
            pins.spiWrite(0)
            pins.spiWrite((sramAddr >> 8) & 0xFF)
            pins.spiWrite(sramAddr & 0xFF)
            for (let i = 0; i < chunkSize; i++) {
                buffer[i] = pins.spiWrite(0x00)
            }
            pins.digitalWritePin(LCDPins.SRAM_CS, 1)

            // Step 2: Write buffer to LCD
            pins.digitalWritePin(LCDPins.LCD_DC, 1)
            pins.digitalWritePin(LCDPins.LCD_CS, 0)
            for (let i = 0; i < chunkSize; i++) {
                pins.spiWrite(buffer[i])
            }
            pins.digitalWritePin(LCDPins.LCD_CS, 1)
        }

        // Ensure display is on
        if (!displayOn) {
            displayON()
        }
    }

    /**
     * Transfer a rectangular region from SRAM to LCD
     * For simplicity with shared SPI bus, this uses full screen transfer
     * when region is large, or row-by-row buffered transfer for small regions
     */
    export function transferRegion(x: number, y: number, w: number, h: number): void {
        // Clamp to screen bounds
        if (x < 0) { w += x; x = 0 }
        if (y < 0) { h += y; y = 0 }
        if (x + w > LCD_WIDTH) w = LCD_WIDTH - x
        if (y + h > LCD_HEIGHT) h = LCD_HEIGHT - y
        if (w <= 0 || h <= 0) return

        // For large regions or full width, use full transfer (more efficient)
        if (w >= LCD_WIDTH - 20 || (w * h) > 5000) {
            transferFromSRAM()
            return
        }

        // Set LCD window for the region
        setWindow(x, y, x + w - 1, y + h - 1)

        // Buffer for one row of the region
        const rowBytes = w * 2
        let buffer: number[] = []
        for (let i = 0; i < rowBytes; i++) {
            buffer.push(0)
        }

        // Transfer row by row with proper buffering
        for (let row = 0; row < h; row++) {
            const sramAddr = ((y + row) * LCD_WIDTH + x) * 2

            // Step 1: Read row from SRAM
            SRAM.setMode(SRAMMode.STREAM)
            pins.digitalWritePin(LCDPins.SRAM_CS, 0)
            pins.spiWrite(SRAMCommands.READ)
            pins.spiWrite(0)
            pins.spiWrite((sramAddr >> 8) & 0xFF)
            pins.spiWrite(sramAddr & 0xFF)
            for (let i = 0; i < rowBytes; i++) {
                buffer[i] = pins.spiWrite(0x00)
            }
            pins.digitalWritePin(LCDPins.SRAM_CS, 1)

            // Step 2: Write row to LCD
            pins.digitalWritePin(LCDPins.LCD_DC, 1)
            pins.digitalWritePin(LCDPins.LCD_CS, 0)
            for (let i = 0; i < rowBytes; i++) {
                pins.spiWrite(buffer[i])
            }
            pins.digitalWritePin(LCDPins.LCD_CS, 1)
        }

        if (!displayOn) {
            displayON()
        }
    }

    /**
     * Fill entire screen with a solid color (direct to LCD, bypasses SRAM)
     */
    export function fillScreen(color: number): void {
        setWindow(0, 0, LCD_WIDTH - 1, LCD_HEIGHT - 1)
        
        const highByte = (color >> 8) & 0xFF
        const lowByte = color & 0xFF
        const totalPixels = LCD_WIDTH * LCD_HEIGHT

        beginPixelWrite()
        for (let i = 0; i < totalPixels; i++) {
            pins.spiWrite(highByte)
            pins.spiWrite(lowByte)
        }
        endPixelWrite()

        if (!displayOn) {
            displayON()
        }
    }

    /**
     * Invalidate window cache (force next setWindow to send commands)
     */
    export function invalidateWindow(): void {
        windowX1 = -1
        windowY1 = -1
        windowX2 = -1
        windowY2 = -1
    }
}

