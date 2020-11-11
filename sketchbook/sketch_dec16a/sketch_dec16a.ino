
volatile int _count = 0;
volatile float base_time = 0;
volatile float diff_time = 1000000;
volatile float min_time = 1000000;
volatile float max_time = 0;

void setup(void)
{
  pinMode(3,INPUT);
  Serial.begin(9600);
  attachInterrupt(1, Cross, RISING);
}

void loop(void)
{
  Serial.println(_count);
  Serial.println(diff_time);
  Serial.println(min_time);
  Serial.println(max_time);
  _count = 0;
  min_time = 1000000;
  max_time = 0;
  delay(1000);
}

void Cross()
{
  _count += 1;
  diff_time = micros() - base_time;
  base_time = micros();
  min_time = min( min_time, diff_time);
  max_time = max( max_time, diff_time);
}
