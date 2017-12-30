//DFRobot.com
//Compatible with the Arduino IDE 1.0
//Library version:1.1
#include <Wire.h> 
#include <Arducam_I2C.h>

Arducam_I2C lcd(0x3F,16,2); // set the LCD address to 0x3F for a 16 chars and 2 line display,If not work, 
                            // you can set it to 0x27 to try. The I2c address is defined by your I2C controller.
                             


void setup()
{
  Serial.begin(9600);
  lcd.init();                      // initialize the lcd 
 
  // Print a message to the LCD.
  lcd.backlight();
  lcd.print("what is up");
}

void loop()
{
  long aca = 0;
  long ada = 0;
  lcd.clear();
  for( int i=0; i < 10; i++ ){
    long ac = analogRead(A0);
    long ad = analogRead(A1);
    aca = aca + ac;
    ada = ada + ad;
    delay(10);
  }
    lcd.setCursor(0,0);
    long acaf = aca/10;
    float outstuff = (((long)acaf * 5000/1024) - 496) * 1000/133;
    float outf = (float)outstuff/1000;
    if ( outf < 0 ) 
        outf = 0;
    lcd.print(outf,4);
    lcd.print(" ");
    ada = (float)ada/10;
    float voltstuff = (float)(ada/1023.0) * 15;
    lcd.print(voltstuff,2);
    lcd.setCursor(0,1);
    float power = voltstuff * outf;
    lcd.print(power,2);
    lcd.print(" ");
    lcd.print(acaf);
    
    Serial.print("{\"Volts\":");
    Serial.print(voltstuff);
    Serial.print(",\"Amps\":");
    Serial.print(outf);
    Serial.print(",\"Watts\":");
    Serial.print(power);
    Serial.println("}");
    delay(1000);
 // }
}
