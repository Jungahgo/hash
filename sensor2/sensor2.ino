#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
// SSID & Password

const char ssid[] = "Android7813";
const char password[] = "09876543";
int SensorPin = 18;

AsyncWebServer server(80);
AsyncEventSource events("/events");

void onRootRequest(AsyncWebServerRequest *request) {
  request->send(SPIFFS, "/web.html", "text/html");
}

void InitWebServer() 
{
    server.addHandler(&events);
    server.on("/", onRootRequest);
    server.serveStatic("/", SPIFFS, "/");
    server.begin();
}

void setup(){
  Serial.begin(9600);
  pinMode(SensorPin, INPUT);
  SPIFFS.begin();
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(10000);
    Serial.println("Connecting to WiFi..");
  }
  Serial.println(WiFi.localIP());

  InitWebServer();
}
 
//static const unsigned long EVENT_INTERVAL_MS = 30;
//void ProcessUpdate()
//{
//  static uint32_t prev_ms = millis();
//  if (millis() > prev_ms + EVENT_INTERVAL_MS)
//  {
//    events.send(String(digitalRead(SensorPin)).c_str(),"update", millis());
//    prev_ms = millis();
//  }
//
//}

void loop()
{ 
  //ProcessUpdate();
  events.send(String(digitalRead(SensorPin)).c_str(),"update", millis());
  delay(100);
}
