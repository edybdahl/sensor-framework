#include <ArduinoJson.h>
//#include "Wi_ZeroCrossActive _ZeroCrossActive re.h";
#include <OneWire.h> 

#define ULONG_MAX 4294967295

#define OneWireDelay 1000
int selection = 0;

//
// Pins
//

#define PIN_POWER 4        //Pin that controls the triac
// #define PIN_STATUS 13      //Pin that controls the general status LED
#define PIN_ZEROCROSS 1    //Pin with the zero-cross interrupt, 1 = pin 3
#define PIN_INTERRUPT 3    //Actual pin with the zero-cross

//
// Power Control
//

volatile byte _DimLevel = 0;      //The dimming on the control, 255 - Output
                                //Larger value --> less power

#define DIM_DELAY 30  //us - Ideally ~32.5 us, but interrupt overhead
                      //forces this to be smaller to prevent overlapping
                      //execution cycles

volatile byte _Output = 29;                     

const float pi = 3.1416;

OneWire ds(2);
byte OneWireAddress[6][8];
byte OneWireAddress1[8];
int conversion[255];

String inputString = "";       // a string to hold incoming data
boolean stringComplete = false;  // whether the string is complete

volatile unsigned long _TemperatureAvailable = ULONG_MAX;  //When the temperature reading will

volatile unsigned long _ZeroCrossActive = 0;

volatile unsigned long _NextOnTime = ULONG_MAX;  //Next time to turn the triac on,
                                               //initialized high so it doesn't start on
//String PIDTempName = "";

void setup(void)
{
  pinMode(PIN_POWER, OUTPUT);
  pinMode(PIN_INTERRUPT, INPUT);
  
  for ( int index = 0; index < 255; index ++ ) {
     float equation = 0.01; 
     if ( index>=30) {
       float corrected = index -15*(index/255) + 15;
       float xvalue = (pi * corrected)/255;
       equation = 3.688*sqrt( xvalue/(2*pi) - sin(2*xvalue)/(4*pi) );
    }
    conversion[index]=round(equation*100);
  }
    
  Serial.begin(115200);
  
  attachInterrupt(PIN_ZEROCROSS, Cross, RISING);
  
   // reserve 200 bytes for the inputString:
   inputString.reserve(50);
 //  PIDTempName.reserve(15);

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

void Cross()
{
  _ZeroCrossActive = micros() + 16666;
   //Below a level of 30, the delay becomes too long and starts to cross into
  //the next execution cycle.  Below this point the heat rate is small so
  //there is no difference by keeping the triac off.
  //if(_DimLevel > 30)
    _NextOnTime = micros() + (DIM_DELAY * _DimLevel);
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

void loop(void)
{
  if (_Output < 30 )
  {
    digitalWrite(PIN_POWER, LOW);
  }
  else if(_NextOnTime <= micros())    //In the control range
  {
    //The time to start the triac is controlled by the zero-interrupt
    //Dimming function (see below)

    //Turn the AC on
    digitalWrite(PIN_POWER, HIGH);
    //Small delay to allow the pin to set
    delay(1);
    //Turn the pin off, triac won't physically reset until next
    //AC zero-cross
    digitalWrite(PIN_POWER,LOW);

    //Clear the scheduler
    _NextOnTime = ULONG_MAX;
  }
  
  if (stringComplete) {
      StaticJsonDocument<64> docin;     
      deserializeJson(docin,inputString);
      if (docin["Command"] = "heat") {
         float fStuff = docin["Value"];
         int inStuff = round(fStuff*100);
         int index=0;
         while( inStuff > conversion[index] ){
            index++;
         }
         _Output = (abs(inStuff-conversion[index-1]) > abs(inStuff-conversion[index]))?index:index-1;
      } else {
  //       PIDTempName = docin["Value"]["value"];
      }
  //    serializeJson(docin, Serial);    
   //   Serial.println();
      inputString = "";
      stringComplete = false;
  }

   //Invert the PID output to a dimming level
   _DimLevel = 255 - _Output;
  
  static unsigned long _Writeout = millis();
  static int interval = 0;
  if(millis()-_Writeout > interval) 
  {
    interval = 7000;
    _Writeout = millis();
    OneWireSearch(); 
    
    int index = 0;
    StaticJsonDocument <256> doc;
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
    //     if (PIDTempName == value) {
    //        JsonArray commands = property.createNestedArray("Commands");
    //        JsonObject command1 = commands.createNestedObject(); 
   //         command1["Name"]="setPID";
    //        command1["type"]="text";             
     //    }
  //        JsonArray commands = property.createNestedArray("Commands");
     //    JsonObject command1 = commands.createNestedObject(); 
    //     command1["Name"]="Callibrate";
   //      command1["type"]="Event";
   //     JsonObject command2 = commands.createNestedObject();    
   //      command2["Name"]="heat";
   //      command2["type"]="dropDown";      
         
         index++;     
    }
    if (_ZeroCrossActive >= micros()){
         JsonObject property = properties.createNestedObject();       
         property["Name"] = "HeatController";
         property["Type"] = "TempController";
         JsonObject metaData = property.createNestedObject("MetaData");
         metaData["Min"] = 0;
         metaData["Max"] = 3;  
         JsonArray commands = property.createNestedArray("Commands");
         JsonObject command1 = commands.createNestedObject(); 
         command1["Name"]="heat";
         command1["type"]="text";
         JsonObject command2 = commands.createNestedObject();    
         command2["Name"]="tempControl";
         command2["type"]="dropDown";         
    }
    serializeJson(doc, Serial);
    Serial.println();   
      
    selection = 0;
    OneWireStartRead();
  }
  static unsigned long _ampsWrite = millis();
  static int vinterval = 1000;
  if((_ZeroCrossActive >= micros()) && (millis()-_ampsWrite > vinterval)){
    _ampsWrite = millis();
     StaticJsonDocument <32> prop;
    String key = "HeatController";
    float equation = 0.01; 
      if (_Output>=30) {
     float corrected = _Output -14*(_Output/255) + 14;
     float xvalue = (pi * corrected)/255;
     equation = 3.688*sqrt( xvalue/(2*pi) - sin(2*xvalue)/(4*pi) );
   }
    float out =  conversion[_Output]/100.00;
    prop[key] = out;
    serializeJson(prop, Serial);
    Serial.println();     
  }
  if(millis()>= _TemperatureAvailable)
  { 
    StaticJsonDocument<32> property;
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
