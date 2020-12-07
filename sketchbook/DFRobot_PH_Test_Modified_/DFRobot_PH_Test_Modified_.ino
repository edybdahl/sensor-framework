/*
 * file DFRobot_PH.ino
 * @ https://github.com/DFRobot/DFRobot_PH
 *
 * This is the sample code for Gravity: Analog pH Sensor / Meter Kit V2, SKU:SEN0161-V2
 * In order to guarantee precision, a temperature sensor such as DS18B20 is needed, to execute automatic temperature compensation.
 * You can send commands in the serial monitor to execute the calibration.
 * Serial Commands:
 *   enterph -> enter the calibration mode
 *   calph   -> calibrate with the standard buffer solution, two buffer solutions(4.0 and 7.0) will be automaticlly recognized
 *   exitph  -> save the calibrated parameters and exit from calibration mode
 *
 * Copyright   [DFRobot](http://www.dfrobot.com), 2018
 * Copyright   GNU Lesser General Public License
 *
 * version  V1.0
 * date  2018-04
 */

#include "DFRobot_PH.h"
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <OneWire.h>

#define PH_PIN A1
float voltage,phValue,temperature = 25;
DFRobot_PH ph;
StaticJsonDocument<512> doc;


#define ULONG_MAX 4294967295

#define OneWireDelay 1000
OneWire ds(2);
byte OneWireAddress[6][8];
byte OneWireAddress1[8];
int selection = 0;
volatile unsigned long _TemperatureAvailable = ULONG_MAX;  //When the temperature reading will

void setup()
{
    Serial.begin(115200); 
    while (!Serial) continue; 
    ph.begin();

    contructJsonProperties ();
    serializeJson(doc, Serial);
    Serial.println();
}

bool OneWireSearch()
{
  memset(OneWireAddress,0,40);
  int index = 0; 
  while (ds.search(OneWireAddress[index]))
  {
    index++;
  }
      
  memset(OneWireAddress[index],0,8);   
      
  ds.reset_search();     
      
  ds.reset();
  return true;
}

//Start the read of the current temperature
void OneWireStartRead()
{
  //Reset the bus and select the previously found sensor
  ds.reset();
  ds.select(OneWireAddress[selection]);
  //Instruct the sensor to read the temperature
  ds.write(0x44);

  //Calculate the time when the temperature will be
  //available to read off the bus and store.  This allows
  //control action to take place in the mean time
  _TemperatureAvailable = millis() + OneWireDelay;
  //Prevent a temperature read for now
 // _TemperatureNextRead = ULONG_MAX;
}

//Finish reading the temperature and return the value off the bus
float OneWireFinishRead()
{
  //Prepare the bus
  byte present = ds.reset();
  //Serial.print(present,HEX);
  //Serial.print(" ");
  ds.select(OneWireAddress[selection]);
  ds.write(0xBE);

  //Read the stratch pad
  byte data[12];
  for(int i = 0; i<9; i++)
  {
    data[i] = ds.read();
    //Serial.print(data[i],HEX);
    //Serial.print(" ");
  }
  
  //Serial.print(" CRC=");
  //Serial.print(OneWire::crc8(data, 8), HEX);
  //Serial.print( " ");

  int16_t raw = (data[1] << 8) | data[0];
  
  byte cfg = (data[4] & 0x60);
  // at lower res, the low bits are undefined, so let's zero them
  if (cfg == 0x00) raw = raw & ~7;  // 9 bit resolution, 93.75 ms
  else if (cfg == 0x20) raw = raw & ~3; // 10 bit res, 187.5 ms
  else if (cfg == 0x40) raw = raw & ~1; // 11 bit res, 375 ms
  //// default is 12 bit resolution, 750 ms conversion time

  //Convert the pad into a temperature
  //T(°C) = RAW - 0.25 + (COUNT_PER_C - COUNT_REMAINING)/COUNT_PER_C  
  //int rawtemp = data[0];
  double tempc, tempf;
  //tempc = ((double)rawtemp -.25 + (data[7] - data[6]) / data[7] )/ 2.0;
  //Its °F because I cook in °F, thats why
  tempc = (float)raw / 16.0;
  tempf = (tempc * 1.8) + 32.0;

  //Make the temperature unavailable
  _TemperatureAvailable = ULONG_MAX;
  //Schedule the next read for the delay,
  //over time the overhead in this function will cause a drift, but
  //that won't matter for this non-mission critical purpose
 // _TemperatureNextRead = millis()+OneWireNextRead;

  //Flip the indicator LED
  //digitalWrite(PIN_STATUS,!digitalRead(PIN_STATUS));  
  return tempc;  
}

void contructJsonProperties () { 
    OneWireSearch(); 
    doc.clear();
    JsonArray properties = doc.createNestedArray("ProbeProperties");
    JsonObject property = properties.createNestedObject();
    property["Name"] = "pHProbe";
    property["Type"] = "pH";
    JsonObject metaData = property.createNestedObject("MetaData");
    metaData["Min"]=0;
    metaData["Max"]=14;
    JsonArray commands = property.createNestedArray("Commands");
    JsonObject command1 = commands.createNestedObject(); 
    command1["Name"]="Callibrate";
    command1["type"]="button";
    int index = 0;
    while( OneWireAddress[index][0] !=0 && index < 5)
    {  
         JsonObject property = properties.createNestedObject();
         String value = "Temp";
         for (int i=0; i<8; i++)
         { 
            String stringHEX = String(OneWireAddress[index][i],HEX);
            stringHEX.toUpperCase();
            value = String( value + stringHEX );
         }               
         property["Name"] = value;
         property["Type"] = "Temperature";
         JsonObject metaData = property.createNestedObject("MetaData");
         metaData["Min"] = -55;
         metaData["Max"] = 125;
         metaData["TimeInterval"] = 14000;
         index++;     
    }    
    selection = 0;
    OneWireStartRead();
}

void loop()
{
    static unsigned long timepointWhat = millis();
    if(millis()-timepointWhat>10000U){
        timepointWhat = millis();
        contructJsonProperties();
        serializeJson(doc, Serial);
        Serial.println();
    }
    
    static unsigned long timepoint = millis();
    if(millis()-timepoint>1000U){                  //time interval: 1s
        timepoint = millis();
        //temperature = readTemperature();         // read your temperature sensor to execute temperature compensation
        voltage = analogRead(PH_PIN)/1024.0*5000;  // read the voltage
        phValue = ph.readPH(voltage,temperature);  // convert voltage to pH with temperature compensation
        doc.clear();
        doc["pHProbe"] = phValue;
        serializeJson(doc, Serial);
        Serial.println();
        
  //      Serial.print("temperature:");
  //      Serial.print(temperature,1);
  //      Serial.print("^C  pH:");
  //      Serial.println(phValue,2);
   /*       Serial.print("{\"pHProbe\":");
          Serial.print(phValue);
          Serial.println("}");*/
    }
  if(millis()>= _TemperatureAvailable)
  { 
    doc.clear();
    String key = "Temp";
    for (int i=0; i<8; i++)
    { 
        String stringHEX = String(OneWireAddress[selection][i],HEX);
        stringHEX.toUpperCase();
        key = String( key + stringHEX );
    }               
    float value = OneWireFinishRead();
    doc[key] = value;   
    serializeJson(doc, Serial);
    Serial.println();     
    selection++;
    if ( OneWireAddress[selection][0] !=0 )
    {
       OneWireStartRead();
    }
    }
    ph.calibration(voltage,temperature);           // calibration process by Serail CMD
}

float readTemperature()
{
  //add your code here to get the temperature from your temperature sensor
}
