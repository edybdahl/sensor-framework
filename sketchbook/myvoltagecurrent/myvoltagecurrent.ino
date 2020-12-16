//DFRobot.com
//Compatible with the Arduino IDE 1.0
//Library version:1.1
#include <Wire.h> 
#include <Arducam_I2C.h>
#include <ArduinoJson.h>

Arducam_I2C lcd(0x3F,16,2); // set the LCD address to 0x3F for a 16 chars and 2 line display,If not work, 
                            // you can set it to 0x27 to try. The I2c address is defined by your I2C controller.
                             


void setup()
{
  Serial.begin(115200);
  lcd.init();                      // initialize the lcd 
 
  // Print a message to the LCD.
  lcd.backlight();
  lcd.print("what is up");
}

void loop()
{
  StaticJsonDocument <450> doc;
  static unsigned long _Writeout = millis();
  static int interval = 0;
  if(millis()-_Writeout > interval) 
  {
    interval = 7000;
    _Writeout = millis();
     doc.clear();
    JsonArray properties = doc.createNestedArray("ProbeProperties");
    JsonObject property = properties.createNestedObject();
    property["Name"] = "SolarAmps";
    property["Type"] = "Amps";
    JsonObject metaData = property.createNestedObject("MetaData");
    metaData["Min"] = 0;
    metaData["Max"] = 4;
    metaData["TimeInterval"] = 2000;
    JsonObject property1 = properties.createNestedObject();
    property1["Name"] = "SolarVolts";
    property1["Type"] = "Volts";
    JsonObject metaData1 = property1.createNestedObject("MetaData");
    metaData1["Min"] = 0;
    metaData1["Max"] = 15;
    metaData1["TimeInterval"] = 2000;
    JsonObject property2 = properties.createNestedObject();
    property2["Name"] = "SolarWatts";
    property2["Type"] = "Watts";
    JsonObject metaData2 = property2.createNestedObject("MetaData");
    metaData2["Min"] = 0;
    metaData2["Max"] = 60;
    metaData2["TimeInterval"] = 2000;
    serializeJson(doc, Serial);
    Serial.println();   
  }
  static unsigned long _ampsWrite = millis();
  static int vinterval = 1000;
  if ( millis()-_ampsWrite > vinterval ){
    _ampsWrite = millis();
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
    
    doc.clear();
    String key = "SolarVolts";
    doc[key] = voltstuff;
    serializeJson(doc, Serial);
    Serial.println();    
    doc.clear();
    String key1 = "SolarAmps";
    doc[key1] = outf;
    serializeJson(doc, Serial);
    Serial.println();    
    doc.clear();
    String key2 = "SolarWatts";
    doc[key2] = power;
    serializeJson(doc, Serial);
    Serial.println();       
  }

   
}
