// this example is public domain. enjoy!
// www.ladyada.net/learn/sensors/thermocouple

#include "max6675.h"
#include <ArduinoJson.h>

int thermoDO = 4;
int thermoCS = 5;
int thermoCLK = 6;

MAX6675 thermocouple(thermoCLK, thermoCS, thermoDO);
int vccPin = 3;
int gndPin = 2;

StaticJsonDocument<512> doc;
  
void setup() {
  Serial.begin(115200);
  // use Arduino pins 
  pinMode(vccPin, OUTPUT); digitalWrite(vccPin, HIGH);
  pinMode(gndPin, OUTPUT); digitalWrite(gndPin, LOW);
  
 // Serial.println("MAX6675 test");
  // wait for MAX chip to stabilize
  delay(500);
  contructJsonProperties();
}

void contructJsonProperties () { 
    doc.clear();
    JsonArray properties = doc.createNestedArray("ProbeProperties");
    JsonObject property = properties.createNestedObject();
    property["Name"] = "TempThermalCouple";
    property["Type"] = "Thermalcouple";
    JsonObject metaData = property.createNestedObject("MetaData");
    metaData["Min"]=0;
    metaData["Max"]=1024;
    metaData["TimeInterval"] = 2000;
}

void loop() {
    static unsigned long timepointWhat = millis();
    if(millis()-timepointWhat>7000U){
        timepointWhat = millis();
        contructJsonProperties();
        serializeJson(doc, Serial);
        Serial.println();
    }

    static unsigned long timepoint = millis();
    if(millis()-timepoint>1000U){                  //time interval: 1s
        timepoint = millis();
        doc.clear();
        doc["TempThermalCouple"] = thermocouple.readCelsius();
        serializeJson(doc, Serial);
        Serial.println();
    }
  // basic readout test, just print the current temp
  
 /*  Serial.print("C = "); 
   Serial.println(thermocouple.readCelsius());
   Serial.print("F = ");
   Serial.println(thermocouple.readFahrenheit());*/
 
 //  delay(1000);
}
