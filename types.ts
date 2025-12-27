/**
 * Shared types and enums for the Waveshare 1.8" LCD
 * for micro:bit v2
 */

/**
 * 16-bit RGB565 color values
 */
enum Color {
    //% block="White"
    WHITE = 0xFFFF,
    //% block="Black"
    BLACK = 0x0000,
    //% block="Blue"
    BLUE = 0x001F,
    //% block="Red"
    RED = 0xF800,
    //% block="Green"
    GREEN = 0x07E0,
    //% block="Cyan"
    CYAN = 0x07FF,
    //% block="Magenta"
    MAGENTA = 0xF81F,
    //% block="Yellow"
    YELLOW = 0xFFE0,
    //% block="Orange"
    ORANGE = 0xFD20,
    //% block="Gray"
    GRAY = 0x8410,
    //% block="Dark Gray"
    DARK_GRAY = 0x4208,
    //% block="Light Gray"
    LIGHT_GRAY = 0xC618,
    //% block="Brown"
    BROWN = 0xBC40,
    //% block="Pink"
    PINK = 0xFE19,
    //% block="Purple"
    PURPLE = 0x8010
}

/**
 * Pixel size for drawing operations
 */
enum PixelSize {
    //% block="1 pixel"
    SIZE_1 = 1,
    //% block="2 pixels"
    SIZE_2 = 2,
    //% block="3 pixels"
    SIZE_3 = 3,
    //% block="4 pixels"
    SIZE_4 = 4
}

/**
 * Line drawing style
 */
enum LineStyle {
    //% block="Solid"
    SOLID = 0,
    //% block="Dotted"
    DOTTED = 1,
    //% block="Dashed"
    DASHED = 2
}

/**
 * Shape fill mode
 */
enum FillMode {
    //% block="Outline"
    OUTLINE = 0,
    //% block="Filled"
    FILLED = 1
}

// LCD display dimensions
const LCD_WIDTH = 160
const LCD_HEIGHT = 128

// ST7735R display offsets (hardware specific)
const LCD_X_OFFSET = 1
const LCD_Y_OFFSET = 2

// Pin definitions for Waveshare 1.8" LCD
namespace LCDPins {
    export const MOSI = DigitalPin.P15
    export const MISO = DigitalPin.P14
    export const SCK = DigitalPin.P13
    export const LCD_CS = DigitalPin.P16
    export const LCD_DC = DigitalPin.P12
    export const LCD_RST = DigitalPin.P8
    export const LCD_BL = AnalogPin.P1
    export const SRAM_CS = DigitalPin.P2
}

// SRAM command opcodes (23LC1024)
namespace SRAMCommands {
    export const WREN = 0x06   // Write enable
    export const WRDI = 0x04   // Write disable
    export const RDSR = 0x05   // Read status register
    export const WRSR = 0x01   // Write status register
    export const READ = 0x03   // Read data
    export const WRITE = 0x02  // Write data
}

// SRAM operating modes
namespace SRAMMode {
    export const BYTE = 0x00   // Byte mode (default)
    export const PAGE = 0x80   // Page mode (32 bytes)
    export const STREAM = 0x40 // Sequential/Stream mode
}

// Configure SPI at startup (must be done before any SPI operations)
pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
pins.spiFormat(8, 0)
pins.spiFrequency(18000000)

// ST7735R command definitions
namespace ST7735 {
    export const NOP = 0x00
    export const SWRESET = 0x01
    export const SLPIN = 0x10
    export const SLPOUT = 0x11
    export const PTLON = 0x12
    export const NORON = 0x13
    export const INVOFF = 0x20
    export const INVON = 0x21
    export const DISPOFF = 0x28
    export const DISPON = 0x29
    export const CASET = 0x2A
    export const RASET = 0x2B
    export const RAMWR = 0x2C
    export const RAMRD = 0x2E
    export const COLMOD = 0x3A
    export const MADCTL = 0x36
    export const FRMCTR1 = 0xB1
    export const FRMCTR2 = 0xB2
    export const FRMCTR3 = 0xB3
    export const INVCTR = 0xB4
    export const PWCTR1 = 0xC0
    export const PWCTR2 = 0xC1
    export const PWCTR3 = 0xC2
    export const PWCTR4 = 0xC3
    export const PWCTR5 = 0xC4
    export const VMCTR1 = 0xC5
    export const GMCTRP1 = 0xE0
    export const GMCTRN1 = 0xE1
}

