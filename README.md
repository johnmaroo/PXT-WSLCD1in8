# Waveshare 1.8" LCD for micro:bit v2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Optimized MakeCode extension for the [Waveshare 1.8inch LCD for micro:bit](https://www.waveshare.com/1.8inch-lcd-for-micro-bit.htm).

![Waveshare Logo](Waveshare_logo.png)

## Features

- **160×128 pixel** TFT LCD display
- **65K colors** (RGB565)
- **Optimized performance** with stream-mode SRAM operations
- **Partial screen updates** for faster refresh
- **Easy-to-use** Graphics API
- **Backward compatible** with original LCD1IN8 API

## Hardware Connections

| LCD Pin | micro:bit Pin | Function |
|---------|---------------|----------|
| DIN     | P15           | SPI MOSI |
| CLK     | P13           | SPI Clock |
| CS      | P16           | LCD Chip Select |
| DC      | P12           | Data/Command |
| RST     | P8            | Reset |
| BL      | P1            | Backlight (PWM) |
| RAM_CS  | P2            | SRAM Chip Select |

## Installation

1. Open MakeCode for micro:bit: https://makecode.microbit.org
2. Click on **Extensions**
3. Search for the extension URL or paste this repository URL
4. Click to add the extension

## Quick Start

### Using the New Graphics API (Recommended)

```blocks
// Initialize display
Graphics.init()

// Set backlight brightness (0-100%)
Graphics.setBacklight(80)

// Clear screen with a color
Graphics.clear(Color.BLUE)

// Draw shapes
Graphics.fillRect(10, 10, 50, 30, Color.WHITE)
Graphics.drawCircle(80, 60, 20, Color.RED, FillMode.FILLED)

// Draw text
Graphics.drawText("Hello!", 50, 50, Color.YELLOW)

// Update display
Graphics.display()
```

### Using the Legacy LCD1IN8 API

```blocks
// Initialize
LCD1IN8.LCD_Init()
LCD1IN8.LCD_SetBL(800)
LCD1IN8.LCD_ClearBuf()

// Draw
LCD1IN8.DrawRectangle(10, 10, 50, 40, Color.RED, DRAW_FILL.DRAW_FULL, DOT_PIXEL.DOT_PIXEL_1)
LCD1IN8.DisString(10, 50, "Hello!", Color.WHITE)

// Update display
LCD1IN8.LCD_Display()
```

## API Reference

### Display Functions

| Function | Description |
|----------|-------------|
| `Graphics.init()` | Initialize the LCD |
| `Graphics.clear(color)` | Clear screen with color |
| `Graphics.display()` | Update display (partial) |
| `Graphics.displayFull()` | Update entire display |
| `Graphics.setBacklight(level)` | Set backlight (0-100) |

### Drawing Functions

| Function | Description |
|----------|-------------|
| `Graphics.drawPixel(x, y, color)` | Draw single pixel |
| `Graphics.drawLine(x1, y1, x2, y2, color)` | Draw line |
| `Graphics.drawRect(x, y, w, h, color)` | Draw rectangle |
| `Graphics.fillRect(x, y, w, h, color)` | Fill rectangle |
| `Graphics.drawCircle(x, y, r, color)` | Draw circle |
| `Graphics.fillCircle(x, y, r, color)` | Fill circle |

### Text Functions

| Function | Description |
|----------|-------------|
| `Graphics.drawText(text, x, y, color)` | Draw text |
| `Graphics.drawNumber(num, x, y, color)` | Draw number |

### Color Utilities

| Function | Description |
|----------|-------------|
| `Graphics.rgb(r, g, b)` | Create color from RGB |
| `Graphics.width()` | Get screen width (160) |
| `Graphics.height()` | Get screen height (128) |

## Performance Improvements (v3.0)

This version includes significant optimizations:

1. **Stream Mode SRAM** - Bulk data transfers instead of byte-by-byte
2. **Dirty Region Tracking** - Only update changed areas
3. **Cached Window State** - Avoid redundant LCD commands
4. **Optimized Line Drawing** - Special fast paths for H/V lines
5. **Batched Font Rendering** - Row-based character drawing

## Version History

- **v3.0.0** - Complete rewrite with modular architecture and optimizations
- **v2.0.0** - micro:bit v2 support
- **v1.0.0** - Initial release

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Waveshare Wiki](https://www.waveshare.com/wiki/1.8inch_LCD_for_micro:bit)
- [Product Page](https://www.waveshare.com/1.8inch-lcd-for-micro-bit.htm)
- [MakeCode for micro:bit](https://makecode.microbit.org)

## Supported Targets

* PXT/microbit (micro:bit v2 recommended)
