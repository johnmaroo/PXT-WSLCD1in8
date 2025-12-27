/**
 * Optimized SRAM driver for 23LC1024 (1Mbit SPI SRAM)
 * Used as frame buffer for the LCD
 * 
 * Key optimizations:
 * - Stream mode for bulk operations
 * - Minimized CS toggling
 * - Buffer-based transfers where possible
 */

//% weight=10
namespace SRAM {
    let currentMode = SRAMMode.BYTE
    let initialized = false

    /**
     * Initialize the SRAM chip
     */
    export function init(): void {
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
        setMode(SRAMMode.BYTE)
        initialized = true
    }

    /**
     * Set the SRAM operating mode
     */
    export function setMode(mode: number): void {
        if (currentMode === mode) return
        
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.WRSR)
        pins.spiWrite(mode)
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
        currentMode = mode
    }

    /**
     * Write a single byte (use sparingly - prefer bulk operations)
     */
    export function writeByte(addr: number, data: number): void {
        setMode(SRAMMode.BYTE)
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.WRITE)
        pins.spiWrite(0x00)  // 24-bit address, high byte
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
        pins.spiWrite(data)
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
    }

    /**
     * Read a single byte
     */
    export function readByte(addr: number): number {
        setMode(SRAMMode.BYTE)
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.READ)
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
        const data = pins.spiWrite(0x00)
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
        return data
    }

    /**
     * Write a 16-bit color value (2 bytes) - optimized for pixel writes
     */
    export function writeColor(addr: number, color: number): void {
        setMode(SRAMMode.BYTE)
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.WRITE)
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
        pins.spiWrite((color >> 8) & 0xFF)  // High byte first (RGB565)
        pins.spiWrite(color & 0xFF)
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
    }

    /**
     * Begin a stream write operation at the specified address
     * Call endStream() when done
     */
    export function beginStreamWrite(addr: number): void {
        setMode(SRAMMode.STREAM)
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.WRITE)
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
    }

    /**
     * Write a byte during stream mode (no address, no CS toggle)
     */
    export function streamWriteByte(data: number): void {
        pins.spiWrite(data)
    }

    /**
     * Write a 16-bit color during stream mode
     */
    export function streamWriteColor(color: number): void {
        pins.spiWrite((color >> 8) & 0xFF)
        pins.spiWrite(color & 0xFF)
    }

    /**
     * End a stream operation
     */
    export function endStream(): void {
        pins.digitalWritePin(LCDPins.SRAM_CS, 1)
    }

    /**
     * Begin a stream read operation at the specified address
     */
    export function beginStreamRead(addr: number): void {
        setMode(SRAMMode.STREAM)
        pins.digitalWritePin(LCDPins.SRAM_CS, 0)
        pins.spiWrite(SRAMCommands.READ)
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
    }

    /**
     * Read a byte during stream mode
     */
    export function streamReadByte(): number {
        return pins.spiWrite(0x00)
    }

    /**
     * Fill entire SRAM with a color (optimized)
     * Total bytes: 160 * 128 * 2 = 40,960 bytes
     */
    export function fillColor(color: number): void {
        const highByte = (color >> 8) & 0xFF
        const lowByte = color & 0xFF
        const totalPixels = LCD_WIDTH * LCD_HEIGHT

        beginStreamWrite(0)
        for (let i = 0; i < totalPixels; i++) {
            pins.spiWrite(highByte)
            pins.spiWrite(lowByte)
        }
        endStream()
    }

    /**
     * Fill a rectangular region with a color (stream mode)
     */
    export function fillRect(x: number, y: number, w: number, h: number, color: number): void {
        const highByte = (color >> 8) & 0xFF
        const lowByte = color & 0xFF

        // For each row in the rectangle
        for (let row = 0; row < h; row++) {
            const addr = ((y + row) * LCD_WIDTH + x) * 2
            beginStreamWrite(addr)
            for (let col = 0; col < w; col++) {
                pins.spiWrite(highByte)
                pins.spiWrite(lowByte)
            }
            endStream()
        }
    }

    /**
     * Write a horizontal line of pixels (very fast)
     */
    export function writeHLine(x: number, y: number, length: number, color: number): void {
        const addr = (y * LCD_WIDTH + x) * 2
        const highByte = (color >> 8) & 0xFF
        const lowByte = color & 0xFF

        beginStreamWrite(addr)
        for (let i = 0; i < length; i++) {
            pins.spiWrite(highByte)
            pins.spiWrite(lowByte)
        }
        endStream()
    }

    /**
     * Get the SRAM address for a pixel coordinate
     */
    export function getPixelAddr(x: number, y: number): number {
        return (y * LCD_WIDTH + x) * 2
    }
}

