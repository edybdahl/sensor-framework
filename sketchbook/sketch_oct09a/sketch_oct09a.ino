#include <ArduinoJson.h>
//#include "Wire.h";
#include <OneWire.h> 

#define ULONG_MAX 4294967295

#define OneWireDelay 1000
int selection = 0;

OneWire ds(2);
byte OneWireAddress[6][8];
byte OneWireAddress1[8];

String inputString = "";         // a string to hold incoming data
boolean stringComplete = false;  // whether the string is complete

volatile unsigned long _TemperatureAvailable = ULONG_MAX;  //When the temperature reading will

void setup(void)
{
  
  Serial.begin(115200);
  
   // reserve 200 bytes for the inputString:
 // inputString.reserve(200); 
  //OneWireSearch();

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

/*
  SerialEvent occurs whenever a new data comes in the
 hardware serial RX.  This routine is run between each
 time loop() runs, so using delay inside loop can delay
 response.  Multiple bytes of data may be available.
 */
void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag
    // so the main loop can do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
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

void loop(void)
{
  static unsigned long _Writeout = millis();
  static int interval = 0;
  if(millis()-_Writeout > interval) 
  {
    interval = 7000;
    _Writeout = millis();
    OneWireSearch(); 
    
    int index = 0;
    StaticJsonDocument<1024> doc;
    JsonArray properties = doc.createNestedArray("ProbeProperties");
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
   
         index++;     
    }
    serializeJson(doc, Serial);
    Serial.println();   
      
    selection = 0;
    OneWireStartRead();
  }
  if(millis()>= _TemperatureAvailable)
  { 
    StaticJsonDocument<512> property;
    String key = "Temp";
    for (int i=0; i<8; i++)
    { 
        String stringHEX = String(OneWireAddress[selection][i],HEX);
        stringHEX.toUpperCase();
        key = String( key + stringHEX );
    }               
    float value = OneWireFinishRead();
    property[key] = value;   
    serializeJson(property, Serial);
    Serial.println();     
  
    selection++;
    if ( OneWireAddress[selection][0] !=0 )
    {
       OneWireStartRead();
    }
  }
}
