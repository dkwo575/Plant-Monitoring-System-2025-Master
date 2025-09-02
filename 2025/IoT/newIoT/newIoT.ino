#include <ArduinoJson.h>
#include <ArduinoJson.hpp>

// #include <SocketIoClient.h>

// #include <ESP32_Servo.h>
#include <HTTP_Method.h>
#include <Middlewares.h>
#include <Uri.h>
#include <WebServer.h>

#include <ESP32_MySQL.h>
#include <ESP32_MySQL.hpp>

#include <analogWrite.h>
// #include "Credentials.h"

#include <Arduino.h>
#include <WiFi.h>


// Import library
#include <dht11.h> // library for temperature and humidity sensor
#include <HTTPClient.h> // library for HTTP client
// #include <LiquidCrystal_I2C.h>
// #include <analogWrite.h>

#define ESP32_MYSQL_DEBUG_PORT      Serial

// Debug Level from 0 to 4
#define _ESP32_MYSQL_LOGLEVEL_      1
#define USING_HOST_NAME     true


// Pin number
#define DHT11PIN        17  //Temperature and humiddity sensor pin
#define LEDPIN          27  //LED pin
#define SERVOPIN        26  //Servo pin // we are not using servor pin right now
#define FANPIN1         19  //Fan IN+ pin
#define FANPIN2         18  //Fan IN- pin
#define STEAMPIN        35  //Steam sensor pin
#define LIGHTPIN        34  //Photoresistor pin
#define SOILHUMIDITYPIN 32  //Soil humidity sensor pin
#define WATERLEVELPIN   33  //Water level sensor pin
#define RELAYPIN        25  //Relay pin
#define BUTTONPIN       5   // Button pin number

// Value
int value_button = 0;

unsigned long lastPostTime = 0;
const unsigned long postInterval = 3600000; // 1 hour in milliseconds

// --- Global Objects ---
// SocketIOclient socketIO;
dht11 DHT11;
// LiquidCrystal_I2C lcd(0x27,16,2);

// Servo myservo; // set servo motor variable as myservo
WebServer serverweb(60); // ESP32 HTTP server on port number 60

#if USING_HOST_NAME
  // Optional using hostname
  char server[] = "smartfarm2025-smartfarm25.g.aivencloud.com"; // change to your server's hostname/URL
#else
  IPAddress server(127, 0, 0, 1); //172.24.8.158
#endif

char ssid[] = //"AndroidHotspot_Jun" ; //"ORBI22";,"kimzuo"; //; //"LAPTOP-DOJUN"// Enter wifi name;             // your network SSID (name)
char pass[] =  //"smartfarm";  //"20171031";,"741852963Zuo"; //"smartfarm"; // Enter wifi password

char user[]         = //"DoJunKwon";              // MySQL user login username
char password[]     = "";          // MySQL user login password :AVNS_KE99pn7l6Y54WtmzIsQ

const char* socket_server = "YOUR_COMPUTER_IP_ADDRESS"; // IMPORTANT: Change to your computer's IP address
const uint16_t socket_port = 5001; // The port your Flask server is running on
// IPAddress server(127, 0, 0, 1); //172.24.8.158

uint16_t server_port = 28350;    // MySQL server port (default : 3306)

char default_database[] = "sensor_DB";           //default DB
char default_table[]    = "lab_data_2025";          //default table

// columns, but if you want to modify in the query, as you please
char temperature_column[] = "temperature";      //pH column name (from table DB)
char humidity_column[] = "humidity";  //temp column name (from table DB)
char light_column[] = "light";
char waterLevel_column[] = "waterLevel";
char soilHumidity_column[] = "soilHumidity";
char steam_column[] = "steam";
char timestamp[] = "timestamp";

// Sample query

ESP32_MySQL_Connection conn((Client *)&client);

ESP32_MySQL_Query *query_mem;

// const char* ssid = "AndroidHotspot_Jun"; //"kimzuo"; //"AndroidHotspot_Jun"; // Enter wifi name
// const char* password = "smartfarm";  //"741852963Zuo"; //"smartfarm"; // Enter wifi password

// String HOST_NAME = "http://130.216.238.175"; // REPLACE WITH YOUR PC's IP ADDRESS //172.20.15.202 //172.23.122.1
// String PHP_FILE_NAME ="insert_data.php" ;//"/iot_sensor_project/insert_data.php"; // Replace with your php file name
// String Server_URL = HOST_NAME + PHP_FILE_NAME;


int temperature = 0;
int humidity = 0;
int light = 0;
int waterLevel = 0;
int soilHumidity = 0;
int steam = 0;


// HTML content to serve
const char* htmlPage = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <title>ESP32 Web Server</title>
  <style>
    body { font-family: Arial; text-align: center; margin-top: 50px; }
  </style>
</head>
<body>
  <h1>ESP32 Web Server</h1>
  <p>Hello from your ESP32!</p>
</body>
</html>
)rawliteral";


// WebServer server(80); //Set the server port to 80. Enter the website by IP address rather than the port number.



//char user[] = "root" // Enter MySQL user name
//char password_[] = "smartfarm" // Enter MySQL password

// String Merge_Data(void) {

//   //Define all variable as string
//   String dataBuffer;
//   String Humidity;
//   String Temperature;
//   String Steam;
//   String Light;
//   String SoilHumidity;
//   String WaterLevel;

//     //Acquire values
//   int chk = DHT11.read(DHT11PIN); //Read the temperature and humidity sensor
//   //Steam sensor
//   Steam = String(analogRead(STEAMPIN) / 4095.0 * 100);
//   //Photoresistor
//   Light = String(analogRead(LIGHTPIN));
//   //Soil humidity sensor
//   int shvalue = analogRead(SOILHUMIDITYPIN) / 4095.0 * 100 * 2.3;
//   shvalue = shvalue > 100 ? 100 : shvalue;
//   SoilHumidity = String(shvalue);
//   //Water level sensor
//   int wlvalue = analogRead(WATERLEVELPIN) / 4095.0 * 100 * 2.5;
//   wlvalue = wlvalue > 100 ? 100 : wlvalue;
//   WaterLevel = String(wlvalue);
//   //Temperature
//   Temperature = String(DHT11.temperature);
//   //Humidity
//   Humidity = String(DHT11.humidity);


  
// }

//Initialize the website
// void handleRoot() {
//   //Used to send HTTP to the client-side for response, sending 200 means success.
//   server.send(200, "text/html", "<h1>Hello, World!</h1>");
// }

// setup the code
void setup() {
  Serial.begin(115200);
  delay(500);
  while (!Serial && millis() < 5000); // wait for serial port to connect

  ESP32_MYSQL_DISPLAY1("\nStarting Basic_Insert_ESP on", ARDUINO_BOARD);

  // set pin mode
  pinMode(LEDPIN,OUTPUT);
  pinMode(STEAMPIN,INPUT);
  pinMode(LIGHTPIN,INPUT);
  pinMode(SOILHUMIDITYPIN,INPUT);
  pinMode(WATERLEVELPIN,INPUT);
  // pinMode(RELAYPIN,OUTPUT);
  pinMode(FANPIN1,OUTPUT);
  pinMode(FANPIN2,OUTPUT);
  pinMode(BUTTONPIN,INPUT);

  // //Initialize LCD
  // lcd.init();
  // //Turn on LCD backlight
  // lcd.backlight();
  // //Clear LCD displays
  // lcd.clear();
  
  //Initialize wifi
  ESP32_MYSQL_DISPLAY1("Connecting to", ssid);
  WiFi.begin(ssid, pass);
  //Scan for wifi. If connection fails, stay in connecting, and execute "while" loop
  while (WiFi.status() != WL_CONNECTED) {
    delay(5000);
    Serial.println("Connecting to WiFi...");
  }


  //Connected. Print the IP address
  Serial.println("Connected to WiFi");
  Serial.println(WiFi.localIP());
  // print out info about the connection:
  ESP32_MYSQL_DISPLAY1("Connected to network. My IP address is:", WiFi.localIP());

  ESP32_MYSQL_DISPLAY3("Connecting to SQL Server @", server, ", Port =", server_port);
  ESP32_MYSQL_DISPLAY5("User =", user, ", PW =", password, ", DB =", default_database);

  // server.on("/", handleRoot);
  // //Start server
  // server.begin();
  // Serial.println("Web server started");


  // serverweb.on("/move", HTTP_POST, []() {
  //   if (serverweb.hasArg("plain")) {
  //     String body = serverweb.arg("plain");
  //     int angle = body.toInt();
  //     myservo.write(angle);
  //     serverweb.send(200, "text/plain", "Moved to " + String(angle));

  //   } else {
  //     serverweb.send(400, "text/plain", "No data received");
  //   }
  // });

  serverweb.on("/", handleRoot);
  serverweb.on("/motor/on", handleMotorOn);
  serverweb.on("/motor/off", handleMotorOff);

  serverweb.on("/motor/on", HTTP_GET, []() {
  digitalWrite(FANPIN1, 200);
  digitalWrite(FANPIN2, 0);
  serverweb.send(200, "text/plain", "Motor ON");
  });

  serverweb.on("/motor/off", HTTP_GET, []() {
  digitalWrite(FANPIN1, 0);
  digitalWrite(FANPIN2, 0);
  serverweb.send(200, "text/plain", "Motor OFF");
  });

  serverweb.on("/led/on", handleLEDon);
  serverweb.on("/led/off", handleLEDoff);




  serverweb.begin();
  Serial.println("Web server begin");

}



void handleRoot() {
  // serverweb.send(200, "text/plain", "ESP32 Motor Controller");
  serverweb.send(200, "text/html", htmlPage);
}
// -------------- this part of code is working version to control motor ----------------------
void handleMotorOn() {
  analogWrite(FANPIN1, 100);
  analogWrite(FANPIN2, 0);
  serverweb.send(200, "text/plain", "Motor turned ON");
}

void handleMotorOff() {
  analogWrite(FANPIN1, 0);
  analogWrite(FANPIN2, 0);
  serverweb.send(200, "text/plain", "Motor turned OFF");
}
// ------------------------------------------- //

void handleLEDon() {
  digitalWrite(LEDPIN, HIGH);
  serverweb.send(200, "text/plain", "LED ON");

}

void handleLEDoff() {
  digitalWrite(LEDPIN, LOW);
  serverweb.send(200, "text/plain", "LED OFF");
}

void runInsert() {
  // Initiate the query class instance
  ESP32_MySQL_Query query_mem = ESP32_MySQL_Query(&conn);



  if (conn.connected())
  {
    ESP32_MYSQL_DISPLAY("Database connected. Inserting data...");
    // ESP32_MYSQL_DISPLAY("Database connected. Inserting data...");
    String INSERT_SQL = String("INSERT INTO ") + default_database + "." + default_table 
                 + " (" + temperature_column + "," + humidity_column + "," + light_column + "," + waterLevel_column + "," + soilHumidity_column + "," + steam_column + ") VALUES (" + temperature + ", " + humidity + ", " + light + ", " + waterLevel + ", " + soilHumidity + ", " + steam + ")";
    

    // String INSERT_SQL = String("INSERT INTO ") + default_database + "." + default_table 
    //              + " (" + temperature_column + "," + humidity_column + "," + light_column + "," + waterLevel_column + "," + soilHumidity_column + "," + steam_column + ") VALUES (" 
    //              + String(temperature) + ".0, " 
    //              + String(humidity) + ".0, " 
    //              + String(light) + ".0, " 
    //              + String(waterLevel) + ".0, " 
    //              + String(soilHumidity) + ".0, " 
    //              + String(steam) + ".0)";


    ESP32_MYSQL_DISPLAY(INSERT_SQL);
    
    // Execute the query
    bool success = query_mem.execute(INSERT_SQL.c_str());
    if (!success)
    {
      ESP32_MYSQL_DISPLAY("Insert error! Check MySQL error logs for details.");
      
      // Try a simpler query to test connection
      String TEST_SQL = "SELECT 1";
      bool test_success = query_mem.execute(TEST_SQL.c_str());
      
      if (!test_success) {
        ESP32_MYSQL_DISPLAY("Basic query failed too. Connection may be unstable.");
      } else {
        ESP32_MYSQL_DISPLAY("Basic query succeeded. Issue is with the INSERT statement.");
      }
    }
    else
    {
      ESP32_MYSQL_DISPLAY("Data Inserted Successfully!");
    }
  }
  else
  {
    ESP32_MYSQL_DISPLAY("Error connecting to Database. Can't insert.");
  }


  //   if ( !query_mem.execute(INSERT_SQL.c_str()) )
  //   {
  //     ESP32_MYSQL_DISPLAY("Insert error : " );
      
  //   }
  //   else
  //   {
  //     ESP32_MYSQL_DISPLAY("Data Inserted.");
  //   }
  // }
  // else
  // {
  //   ESP32_MYSQL_DISPLAY("Error connecting to Database. Can't insert.");
  // }
}

// // ------------------------------------------ Using HTTP to get rules for LLM------------------
// void applyControlLogic() {
//   HTTPClient http;
//   http.begin("http://localhost:5000/api/get_rules");
//   int httpCode = http.GET();

//   if (httpCode == 200) {
//     String payload = http.getString();
//     DynamicJsonDocument doc(1024);
//     deserializeJson(doc, payload);

//     for (JsonObject rule : doc.as<JsonArray>()) {
//       String condition = rule["condition"];
//       String action = rule["action"];

//       if (evaluateCondition(condition)) {
//         executeAction(action);
//       }
//     }
//   }
//   http.end();
// }

// bool evaluateCondition(String cond) {
//   if (cond.startsWith("temperature < ")) {
//     int value = cond.substring(14).toInt();
//     return temperature < value;
//   }
//   // add other condition parsing here...
//   return false;
// }

// void executeAction(String action) {
//   if (action == "motor_on") {
//     analogWrite(FANPIN1, 255);
//     analogWrite(FANPIN2, 0);
//   } else if (action == "motor_off") {
//     analogWrite(FANPIN1, 0);
//     analogWrite(FANPIN2, 0);
//   }
//   // add fan, relay etc as needed
// }

// ------------------------
// serverweb.on("/motor/on", HTTP_GET, []() {
//   digitalWrite(FANPIN1, HIGH);
//   digitalWrite(FANPIN2, LOW);
//   serverweb.send(200, "text/plain", "Motor ON");
// });

// serverweb.on("/motor/off", HTTP_GET, []() {
//   digitalWrite(FANPIN1, LOW);
//   digitalWrite(FANPIN2, LOW);
//   serverweb.send(200, "text/plain", "Motor OFF");
// });







void loop() {



  // This part always runs, continuously checking sensors or inputs
  // You can place code here to read inputs, respond to events, etc.

  unsigned long currentTime = millis();

  if (currentTime - lastPostTime >= postInterval) {
    lastPostTime = currentTime;

    Load_DHT11_Data();
    Load_Light_Data();
    Load_Wlevel_Data();
    Load_Soil_Data();
    Load_Steam_Data();

    ESP32_MYSQL_DISPLAY("Connecting...");

    if (conn.connectNonBlocking(server, server_port, user, password) != RESULT_FAIL) {
      delay(1000);
      runInsert();
      conn.close();
    } else {
      ESP32_MYSQL_DISPLAY("\nConnect failed. Trying again on next iteration.");
    }

    ESP32_MYSQL_DISPLAY("\nSleeping...");
    ESP32_MYSQL_DISPLAY("================================================");
  }

 



  // Load_DHT11_Data();
  // Load_Light_Data();

  // Load_Wlevel_Data();
 
  // Load_Soil_Data();

  // Load_Steam_Data();

  // ESP32_MYSQL_DISPLAY("Connecting...");
  
  // //if (conn.connect(server, server_port, user, password))
  // if (conn.connectNonBlocking(server, server_port, user, password) != RESULT_FAIL)
  // {
  //   delay(1000);
  //   runInsert();
  //   conn.close();                     // close the connection
  // } 
  // else 
  // {
  //   ESP32_MYSQL_DISPLAY("\nConnect failed. Trying again on next iteration.");
  // }

  // ESP32_MYSQL_DISPLAY("\nSleeping...");
  // ESP32_MYSQL_DISPLAY("================================================");




  // delay(3600000); // post data every 3600 second == every 1 hours, the data is saved.

  // Other non-blocking tasks can go here
  // For example: sensor monitoring, user input, LED blinking, etc.

  applyControlLogic();

  int ButtonValue = digitalRead(BUTTONPIN);

  if (ButtonValue == 0) {
    //Eliminate the button shake
    delay(10);
    if (ButtonValue == 0) {
      value_button = !value_button;
      //Detect the button status, press once to light up LED, press again to turn off LED, in a loop
      if(value_button) {
        analogWrite(FANPIN1, 240);
        analogWrite(FANPIN2, 0);
      }else{
        analogWrite(FANPIN1,0);
        analogWrite(FANPIN2,0);
      }
    }
    //Detect the button status again
    //Pressed: execute the loop; Released: exit the loop to next step
    while (digitalRead(BUTTONPIN) == 0);
  }

  serverweb.handleClient();  // handle incomming request.

 

    
}



 // Controlling button using HTTP
void applyControlLogic() {
  HTTPClient http;
  http.begin("http://localhost:5000/api/get_rules");
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);

    for (JsonObject rule : doc.as<JsonArray>()) {
      String condition = rule["condition"];
      String action = rule["action"];

      if (evaluateCondition(condition)) {
        executeAction(action);
      }
    }
  }
  http.end();
}

bool evaluateCondition(String cond) {
  if (cond.startsWith("temperature < ")) {
    int value = cond.substring(14).toInt();
    return temperature < value;
  }
  // add other condition parsing here...
  return false;
}

void executeAction(String action) {
  if (action == "motor_on") {
    analogWrite(FANPIN1, 200);
    analogWrite(FANPIN2, 0);
  } else if (action == "motor_off") {
    analogWrite(FANPIN1, 0);
    analogWrite(FANPIN2, 0);
  }
  // add fan, relay etc as needed
}

void Load_DHT11_Data(){
  
  int chk = DHT11.read(DHT11PIN);

  //--------------------------
  // read sensor and check any error
  Serial.print("Read sensor: ");
  switch (chk)
  {
    case DHTLIB_OK: 
                Serial.println("OK"); 
                break;
    case DHTLIB_ERROR_CHECKSUM: 
                Serial.println("Checksum error"); 
                break;
    case DHTLIB_ERROR_TIMEOUT: 
                Serial.println("Time out error"); 
                break;
    default: 
                Serial.println("Unknown error"); 
                break;
  }

  temperature = DHT11.temperature;
  humidity = DHT11.humidity;

  //--------------
  // check any read fail
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    temperature = 0;
    humidity = 0;
  }
  //----------------

  Serial.printf("Temperature: %d °C\n", temperature);
  Serial.printf("Humidity: %d %%\n", humidity);

}

void Load_Light_Data() {

  // Read the value of photoresistor
  // light = String(analogRead(LIGHTPIN));
  light = analogRead(LIGHTPIN);
  
  //=======
  // //check any read fail
  // if (isnan(light)) {
  //   Serial.println("Failed to read from photoresistor sensor!");
  //   light = 0;
  // }
  //----------------

  Serial.println("Light value: " + String(light));
  // delay(500);
}

void Load_Wlevel_Data() {

  int wlvalue = analogRead(WATERLEVELPIN) / 4095.0 * 100 * 2.5;
  // int wlvalue = analogRead(WATERLEVELPIN) / 1023.0 * 100 ;
  wlvalue = wlvalue > 100 ? 100 : wlvalue;
  waterLevel = int (wlvalue);
  Serial.println("Water level value: " + String(waterLevel));
}



void Load_Soil_Data(){
  // Soil humidity sensor
  int shvalue = analogRead(SOILHUMIDITYPIN) / 4095.0 * 100 * 2.3;
  // int shvalue = analogRead(SOILHUMIDITYPIN) / 1023.0 * 100;
  shvalue = shvalue > 100 ? 100 : shvalue;
  soilHumidity = int(shvalue);
  Serial.println("soilHumidity value: " + String(soilHumidity));
}


void Load_Steam_Data(){
  // int steamValue = analogRead(STEAMPIN);
  steam = int(analogRead(STEAMPIN) / 4095.0 * 100);
  // steam = int(analogRead(STEAMPIN) / 1023.0 * 100);
  //=======
  //check any read fail
  // if (isnan(steam)) {
  //   Serial.println("Failed to read from steam sensor!");
  //   steam = 0;
  // }
  //----------------
  Serial.println("Steam value: " + String(steam));
  // delay(500);
}



