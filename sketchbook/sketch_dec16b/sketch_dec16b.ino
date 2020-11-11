//#include "Wire.h";
#include <OneWire.h> 

#define ULONG_MAX 4294967295

//
// Pins
//

#define PIN_POWER 4        //Pin that controls the triac
#define PIN_STATUS 13      //Pin that controls the general status LED
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

//
// Scheduler
//

volatile unsigned long _NextOnTime = ULONG_MAX;  //Next time to turn the triac on,
                                               //initialized high so it doesn't start on
volatile unsigned long _TemperatureAvailable = ULONG_MAX;  //When the temperature reading will
                                                         //be available from parasite power (ms)
volatile unsigned long _TemperatureNextRead = ULONG_MAX;   //Next time to read the temperature (ms)

volatile unsigned long _ZeroCrossActive = 0;;

//
// Historical Values
//

//This implementation is simplier than using arrays

volatile float _TemperatureOneAgo = -1;
volatile float _TemperatureTwoAgo = -1;

volatile long _Output = 29;          //Note: Long to prevent issues from integer overflow
volatile long _OutputOneAgo = 0;

volatile float _ErrorCurrent = 0;
volatile float _ErrorOneAgo = 0;

volatile bool _ReinitHistory = true;  //Flag to indicate the history is invalid and needs to be initialized,
                                    //should lead to faster control action when modes are changed

volatile bool _Connected = true;

volatile int _count = 0;
//
// Temperature OneWire
//
OneWire ds(2);                  //OneWire temperature interface
#define OneWireDelay 750        //Minimum parasite power time required to
                                //read a valid temperature (ms)
#define OneWireNextRead 5000   //Frequency to measure temperature (ms)
volatile float _TemperatureCurrent = -1;  //Current temperature measurement (°F)
byte OneWireAddress[8];         //Address of the temperature sensor

int _BadTempCount = 0;            //Counter of the number of consecutive bad temperature reads
#define TEMP_BAD_LIMIT 10       //Number of bad temperatures before switching to OFF

//
// Control
//

#define CONTROL_FREQ 0          //How many times per minute to execute control
int ControlCounter = CONTROL_FREQ;//Number of cycles since last control action,
                                //initialized to the CONTROL_FREQ to ensure
                                //immediate inital control action
float _ControlFreq = 1;           //How often the control action is executed, in
                                //multiples of OneWireNextRead
                                //TODO: why not a constant?
float K = 0.1;                    //Gain  0.043                  0.1
float Ti = 150;                   //Integral (min)    102        152
float Td = 0.45;                  //Derivative (min)   0.46      0.46

volatile float _TemperatureSP = 31;  //Current controller SetPoint (°F)

String inputString = "";         // a string to hold incoming data
boolean stringComplete = false;  // whether the string is complete

String _mode = "Manua@l";

void setup(void)
{
  pinMode(PIN_POWER, OUTPUT);
  pinMode(PIN_STATUS, OUTPUT);
  pinMode(PIN_INTERRUPT, INPUT);
  
  Serial.begin(9600);
  
  // reserve 200 bytes for the inputString:
  inputString.reserve(200);
  
  OneWireSearch();
  _TemperatureNextRead = millis() + 500;
  attachInterrupt(PIN_ZEROCROSS, Cross, RISING);
}

bool OneWireSearch()
{
  if(!ds.search(OneWireAddress))
  {
    ds.reset_search();
    return false;
  }
  
  if(OneWire::crc8(OneWireAddress,7) != OneWireAddress[7])
     return false;
     
  if(OneWireAddress[0] != 0x10)
      return false;
      
  ds.reset();
  return true;
}

//Start the read of the current temperature
void OneWireStartRead()
{
  //Reset the bus and select the previously found sensor
  ds.reset();
  ds.select(OneWireAddress);
  //Instruct the sensor to read the temperature
  ds.write(0x44,1);

  //Calculate the time when the temperature will be
  //available to read off the bus and store.  This allows
  //control action to take place in the mean time
  _TemperatureAvailable = millis() + OneWireDelay;
  //Prevent a temperature read for now
  _TemperatureNextRead = ULONG_MAX;
}

//Finish reading the temperature and return the value off the bus
float OneWireFinishRead()
{
  //Prepare the bus
  byte present = ds.reset();
  ds.select(OneWireAddress);
  ds.write(0xBE);

  //Read the stratch pad
  byte data[12];
  for(int i = 0; i<9; i++)
    data[i] = ds.read();

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
  _TemperatureNextRead = millis()+OneWireNextRead;

  //Flip the indicator LED
  //digitalWrite(PIN_STATUS,!digitalRead(PIN_STATUS));  
  return tempc;  
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
  
   //Check if a temperature is available to read
  if(millis()>= _TemperatureAvailable)
  {
    
    _Connected = true;
    if(_ZeroCrossActive < micros())
    {
      _Connected = false;
    }
    
     //Read the value off the bus
    float Value = OneWireFinishRead();
    Serial.print(Value);
    Serial.print(' ');
    Serial.print(_Connected);
    Serial.print(' ');
    Serial.print(_Output);
    Serial.print(' ');
    Serial.println(_TemperatureSP);
    
       //If there wasn't a read error, use that as the new temperature
    if(Value!= -1 && Value < 100 && Value > 0)    //261.3 is an invalid read, as is 30.9
    {
      _TemperatureCurrent = Value;
      
      //Reset the bad counter
      _BadTempCount = 0;
    }
    else
    {
      //Count the number of times a bad temperature is read
      _BadTempCount++;
     
      //When a reasonable limit has been passed, switch to off, this
      //prevents bad things from happening due to a short
      if(_BadTempCount > TEMP_BAD_LIMIT)
      {
        //_Mode = MODE_OFF;
        digitalWrite(PIN_POWER, LOW);
        _Output = 0;
      }
    }
   
    if( _mode =="PID" )
    {
    //Increment the control counter
    ControlCounter++;
  
    //When the control counter is greater than/equal to the control
    //frequency then a control action will be executed 
    if(ControlCounter >= CONTROL_FREQ)
    {
        //If this is the first control action in AUTO, initialize the historical
        //values to prevent windup in the first action
        if(_ReinitHistory)
        {
          _TemperatureOneAgo = _TemperatureCurrent;
          _TemperatureTwoAgo = _TemperatureCurrent;  
          
          _OutputOneAgo = _Output;
          
          _ReinitHistory = false;
        }
  
        //Determine the current controller error
        _ErrorCurrent = _TemperatureSP - _TemperatureCurrent;
  
        //Calculate the PID action and scale to the appropriate range
        _Output = max(11, min(CalcPIDOutput(), 255));
  
        //Shift the historical PV/OP/error values
        _TemperatureTwoAgo = _TemperatureOneAgo;
        _TemperatureOneAgo = _TemperatureCurrent;
        _OutputOneAgo = _Output;
  
        _ErrorOneAgo = _ErrorCurrent;
  
        //Reset the control counter
        ControlCounter = 0;
    }
    //Serial.print("output ");
    //Serial.println(_Output);
    }
  }  
   // print the string when a newline arrives:
  if (stringComplete) {
    int  pos = inputString.indexOf(',');
   
    String mode = inputString.substring(0,pos);
    int  mpos = mode.indexOf(':');
    String modename = mode.substring(0,mpos);
    String modevalue = mode.substring(mpos+1,mode.length());
    if ( modename == "mode" )
    {
        _mode = modevalue;
    }
    String input = inputString.substring(pos+1,inputString.length());
    int  ipos = input.indexOf(':');
    String outputname = input.substring(0,ipos);
    String output = input.substring(ipos+1,input.length());
    if ( outputname == "input" )
    {
         if( _mode =="manual" )
         {
            _Output = output.toInt();
            _Output = max(11, min(_Output, 255));
         }
         else
         {
             char buffer[10];
             output.toCharArray(buffer,10);
             _TemperatureSP = atof(buffer);
         }
    }
    //_TemperatureSP = inputString.toInt();
    //Serial.println(_TemperatureSP);
    //Serial.println(input);
    //Serial.println(_Output);
    // clear the string:
    inputString = "";
    stringComplete = false;
  }
  
   //Invert the PID output to a dimming level
   _DimLevel = 255 - _Output;
  
   //If it's time for another temperature read, start it
  if(millis() >= _TemperatureNextRead)
    OneWireStartRead();
}

//Calculate the PID equation change form, add it to the previous output to calculate
//the new absolute output.  Type B: P on Error, I on Error, D on Input
//
//OP[k] = OP[k-1] + K * (e[k] - e[k-1]) + Ti * Freq * e[k] - Td/Freq * (PV[k] - 2 * PV[k-1] + PV[k-2])
float CalcPIDOutput()
{
  return ((float)_OutputOneAgo - K*(_ErrorCurrent - _ErrorOneAgo) + Ti * (float)_ControlFreq * _ErrorCurrent) - Td / _ControlFreq * (_TemperatureCurrent - 2 * _TemperatureOneAgo + _TemperatureTwoAgo);
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

void Cross()
{
  _ZeroCrossActive = micros() + 16666;
   //Below a level of 30, the delay becomes too long and starts to cross into
  //the next execution cycle.  Below this point the heat rate is small so
  //there is no difference by keeping the triac off.
  //if(_DimLevel > 30)
    _NextOnTime = micros() + (DIM_DELAY * _DimLevel);
}
