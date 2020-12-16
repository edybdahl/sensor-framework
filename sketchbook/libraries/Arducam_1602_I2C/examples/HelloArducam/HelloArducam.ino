//DFRobot.com
//Compatible with the Arduino IDE 1.0
//Library version:1.1
#include <Wire.h> 
#include <Arducam_I2C.h>

Arducam_I2C lcd(0x3F,16,2); // set the LCD address to 0x3F for a 16 chars and 2 line display,If not work, 
                            // you can set it to 0x27 to try. The I2c address is defined by your I2C controller.
                             


void setup()
{
  lcd.init();                      // initialize the lcd 
 
  // Print a message to the LCD.
  lcd.backlight();
  lcd.print("Hello, Arducam!");
}

void loop()
{
}
