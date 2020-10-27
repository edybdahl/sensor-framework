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

#define PH_PIN A1
float voltage,phValue,temperature = 25;
DFRobot_PH ph;
StaticJsonDocument<1024> doc;

void setup()
{
    Serial.begin(115200); 
    while (!Serial) continue; 
    ph.begin();

    contructJsonProperties ();
    serializeJson(doc, Serial);
    Serial.println();
    
 //   Serial.println("{\"ProbeProperties\":\"[{\'Name\':\'pHProbe\',\'Type\':\'pH\',\'MetaData\':{\'Min\':0,\'Max\':14}}]\"}");
}

void contructJsonProperties () { 
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
    command1["type"]="Event";
    JsonObject command2 = commands.createNestedObject();    
    command2["Name"]="stuff";
    command2["type"]="button";  
}

void loop()
{
    static unsigned long timepointWhat = millis();
    if(millis()-timepointWhat>10000U){
        timepointWhat = millis();
        serializeJson(doc, Serial);
        Serial.println();
    }
    
    static unsigned long timepoint = millis();
    if(millis()-timepoint>1000U){                  //time interval: 1s
        timepoint = millis();
        //temperature = readTemperature();         // read your temperature sensor to execute temperature compensation
        voltage = analogRead(PH_PIN)/1024.0*5000;  // read the voltage
        phValue = ph.readPH(voltage,temperature);  // convert voltage to pH with temperature compensation
        StaticJsonDocument<32> property;
        property["pHProbe"] = phValue;
        serializeJson(property, Serial);
        Serial.println();
        
  //      Serial.print("temperature:");
  //      Serial.print(temperature,1);
  //      Serial.print("^C  pH:");
  //      Serial.println(phValue,2);
   /*       Serial.print("{\"pHProbe\":");
          Serial.print(phValue);
          Serial.println("}");*/
    }
    ph.calibration(voltage,temperature);           // calibration process by Serail CMD
}

float readTemperature()
{
  //add your code here to get the temperature from your temperature sensor
}
