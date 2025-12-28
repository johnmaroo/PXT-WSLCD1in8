/**
 * Diagnostic Test - Direct hardware access
 * This bypasses all abstractions to debug the issue
 */

// Pin definitions
const PIN_LCD_CS = DigitalPin.P16
const PIN_LCD_DC = DigitalPin.P12
const PIN_LCD_RST = DigitalPin.P8
const PIN_RAM_CS = DigitalPin.P2

function cmdLCD(c: number) {
    pins.digitalWritePin(PIN_LCD_DC, 0)
    pins.digitalWritePin(PIN_LCD_CS, 0)
    pins.spiWrite(c)
    pins.digitalWritePin(PIN_LCD_CS, 1)
}

function dataLCD(d: number) {
    pins.digitalWritePin(PIN_LCD_DC, 1)
    pins.digitalWritePin(PIN_LCD_CS, 0)
    pins.spiWrite(d)
    pins.digitalWritePin(PIN_LCD_CS, 1)
}

// Initialize LCD with minimal commands
function initLCDSimple() {
    // Reset
    pins.digitalWritePin(PIN_LCD_RST, 1)
    basic.pause(1)
    pins.digitalWritePin(PIN_LCD_RST, 0)
    basic.pause(10)
    pins.digitalWritePin(PIN_LCD_RST, 1)
    basic.pause(120)

    // Basic init sequence
    cmdLCD(0x11)  // Sleep out
    basic.pause(120)
    
    cmdLCD(0x3A)  // Color mode
    dataLCD(0x05) // 16-bit
    
    cmdLCD(0x36)  // MADCTL
    dataLCD(0xA0)
    
    cmdLCD(0x29)  // Display on
}

// Fill SRAM with a color
function fillSRAM(colorHigh: number, colorLow: number) {
    // Set stream mode
    pins.digitalWritePin(PIN_RAM_CS, 0)
    pins.spiWrite(0x01)  // WRSR
    pins.spiWrite(0x40)  // Stream mode
    pins.digitalWritePin(PIN_RAM_CS, 1)
    
    basic.pause(1)
    
    // Write color to all pixels
    pins.digitalWritePin(PIN_RAM_CS, 0)
    pins.spiWrite(0x02)  // WRITE
    pins.spiWrite(0x00)  // Addr
    pins.spiWrite(0x00)
    pins.spiWrite(0x00)
    
    for (let i = 0; i < 160 * 128; i++) {
        pins.spiWrite(colorHigh)
        pins.spiWrite(colorLow)
    }
    pins.digitalWritePin(PIN_RAM_CS, 1)
}

// Transfer SRAM to LCD
function showSRAM() {
    // Set stream mode
    pins.digitalWritePin(PIN_RAM_CS, 0)
    pins.spiWrite(0x01)
    pins.spiWrite(0x40)
    pins.digitalWritePin(PIN_RAM_CS, 1)
    
    // Set LCD window
    cmdLCD(0x2A)
    dataLCD(0x00); dataLCD(1)
    dataLCD(0x00); dataLCD(160)
    cmdLCD(0x2B)
    dataLCD(0x00); dataLCD(2)
    dataLCD(0x00); dataLCD(129)
    cmdLCD(0x2C)
    
    // Transfer in chunks
    let buf = Buffer.create(640)
    
    for (let chunk = 0; chunk < 64; chunk++) {
        let addr = chunk * 640
        
        // Read from SRAM
        pins.digitalWritePin(PIN_RAM_CS, 0)
        pins.spiWrite(0x03)  // READ
        pins.spiWrite(0x00)
        pins.spiWrite((addr >> 8) & 0xFF)
        pins.spiWrite(addr & 0xFF)
        for (let j = 0; j < 640; j++) {
            buf[j] = pins.spiWrite(0x00)
        }
        pins.digitalWritePin(PIN_RAM_CS, 1)
        
        // Write to LCD
        pins.digitalWritePin(PIN_LCD_DC, 1)
        pins.digitalWritePin(PIN_LCD_CS, 0)
        for (let j = 0; j < 640; j++) {
            pins.spiWrite(buf[j])
        }
        pins.digitalWritePin(PIN_LCD_CS, 1)
    }
}

// ===== RUN TEST =====
pins.analogWritePin(AnalogPin.P1, 1023)  // Backlight full

initLCDSimple()

// Fill with RED (0xF800 = high:0xF8, low:0x00)
fillSRAM(0xF8, 0x00)
showSRAM()

basic.pause(2000)

// Fill with BLUE (0x001F = high:0x00, low:0x1F)
fillSRAM(0x00, 0x1F)
showSRAM()

basic.pause(2000)

// Fill with WHITE (0xFFFF)
fillSRAM(0xFF, 0xFF)
showSRAM()

// Show success on micro:bit LED
basic.showIcon(IconNames.Yes)
