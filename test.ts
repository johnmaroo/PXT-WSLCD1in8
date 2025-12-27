/**
 * Direct test - minimal abstraction to debug
 */

// SPI is already configured in types.ts

// LCD pins
const LCD_CS = DigitalPin.P16
const LCD_DC = DigitalPin.P12
const LCD_RST = DigitalPin.P8
const LCD_BL = AnalogPin.P1
const RAM_CS = DigitalPin.P2

// Helper to write LCD command
function lcdCmd(cmd: number) {
    pins.digitalWritePin(LCD_DC, 0)
    pins.digitalWritePin(LCD_CS, 0)
    pins.spiWrite(cmd)
    pins.digitalWritePin(LCD_CS, 1)
}

// Helper to write LCD data
function lcdData(data: number) {
    pins.digitalWritePin(LCD_DC, 1)
    pins.digitalWritePin(LCD_CS, 0)
    pins.spiWrite(data)
    pins.digitalWritePin(LCD_CS, 1)
}

// Set SRAM mode
function sramMode(mode: number) {
    pins.digitalWritePin(RAM_CS, 0)
    pins.spiWrite(0x01)  // WRSR command
    pins.spiWrite(mode)
    pins.digitalWritePin(RAM_CS, 1)
}

// Initialize LCD (minimal version of original)
function initLCD() {
    // Reset
    pins.digitalWritePin(LCD_RST, 1)
    control.waitMicros(1000)
    pins.digitalWritePin(LCD_RST, 0)
    control.waitMicros(10000)
    pins.digitalWritePin(LCD_RST, 1)
    control.waitMicros(120000)

    // Frame rate
    lcdCmd(0xB1); lcdData(0x01); lcdData(0x2C); lcdData(0x2D)
    lcdCmd(0xB2); lcdData(0x01); lcdData(0x2C); lcdData(0x2D)
    lcdCmd(0xB3); lcdData(0x01); lcdData(0x2C); lcdData(0x2D); lcdData(0x01); lcdData(0x2C); lcdData(0x2D)
    lcdCmd(0xB4); lcdData(0x07)

    // Power
    lcdCmd(0xC0); lcdData(0xA2); lcdData(0x02); lcdData(0x84)
    lcdCmd(0xC1); lcdData(0xC5)
    lcdCmd(0xC2); lcdData(0x0A); lcdData(0x00)
    lcdCmd(0xC3); lcdData(0x8A); lcdData(0x2A)
    lcdCmd(0xC4); lcdData(0x8A); lcdData(0xEE)
    lcdCmd(0xC5); lcdData(0x0E)

    // Gamma
    lcdCmd(0xE0)
    lcdData(0x0F); lcdData(0x1A); lcdData(0x0F); lcdData(0x18)
    lcdData(0x2F); lcdData(0x28); lcdData(0x20); lcdData(0x22)
    lcdData(0x1F); lcdData(0x1B); lcdData(0x23); lcdData(0x37)
    lcdData(0x00); lcdData(0x07); lcdData(0x02); lcdData(0x10)

    lcdCmd(0xE1)
    lcdData(0x0F); lcdData(0x1B); lcdData(0x0F); lcdData(0x17)
    lcdData(0x33); lcdData(0x2C); lcdData(0x29); lcdData(0x2E)
    lcdData(0x30); lcdData(0x30); lcdData(0x39); lcdData(0x3F)
    lcdData(0x00); lcdData(0x07); lcdData(0x03); lcdData(0x10)

    lcdCmd(0xF0); lcdData(0x01)  // Enable test
    lcdCmd(0xF6); lcdData(0x00)  // Disable RAM power save
    lcdCmd(0x3A); lcdData(0x05)  // 16-bit color
    lcdCmd(0x36); lcdData(0xA0)  // MADCTL
    lcdCmd(0x11)  // Sleep out
    control.waitMicros(120000)

    // Set SRAM to byte mode
    sramMode(0x00)
}

// Clear SRAM buffer (fill with color)
function clearBuffer(color: number) {
    let highByte = (color >> 8) & 0xFF
    let lowByte = color & 0xFF

    // Set stream mode
    sramMode(0x40)

    // Write command + address 0
    pins.digitalWritePin(RAM_CS, 0)
    pins.spiWrite(0x02)  // WRITE command
    pins.spiWrite(0x00)  // Address high
    pins.spiWrite(0x00)  // Address mid
    pins.spiWrite(0x00)  // Address low

    // Write 160*128 pixels
    for (let i = 0; i < 160 * 128; i++) {
        pins.spiWrite(highByte)
        pins.spiWrite(lowByte)
    }
    pins.digitalWritePin(RAM_CS, 1)
}

// Display buffer to LCD (original algorithm)
function displayBuffer() {
    // Set stream mode for SRAM
    sramMode(0x40)

    // Set LCD window
    lcdCmd(0x2A)
    lcdData(0x00); lcdData(1)    // X start + offset
    lcdData(0x00); lcdData(160)  // X end + offset
    lcdCmd(0x2B)
    lcdData(0x00); lcdData(2)    // Y start + offset
    lcdData(0x00); lcdData(129)  // Y end + offset
    lcdCmd(0x2C)  // Memory write

    // Buffer for 2 lines (640 bytes)
    let buf: number[] = []
    for (let j = 0; j < 640; j++) {
        buf.push(0)
    }

    // Transfer 64 chunks of 2 lines each
    for (let chunk = 0; chunk < 64; chunk++) {
        let addr = chunk * 640

        // Read from SRAM
        pins.digitalWritePin(RAM_CS, 0)
        pins.spiWrite(0x03)  // READ command
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
        for (let k = 0; k < 640; k++) {
            buf[k] = pins.spiWrite(0x00)
        }
        pins.digitalWritePin(RAM_CS, 1)

        // Write to LCD
        pins.digitalWritePin(LCD_DC, 1)
        pins.digitalWritePin(LCD_CS, 0)
        for (let k = 0; k < 640; k++) {
            pins.spiWrite(buf[k])
        }
        pins.digitalWritePin(LCD_CS, 1)
    }

    // Turn on display
    lcdCmd(0x29)
}

// ===== MAIN TEST =====
pins.analogWritePin(LCD_BL, 1023)  // Backlight on
initLCD()
clearBuffer(0xF800)  // RED
displayBuffer()
