load('api_config.js');
load('api_dash.js');
load('api_gpio.js');
load('api_mqtt.js');
load('api_pwm.js');
load('api_mqtt.js');

let decorationName = "unknown";
let deviceID = Cfg.get('device.id');

if (deviceID === "esp8266_197E0E") {
  decorationName = "car-guy"
}

if (deviceID === "esp8266_70E7C0") {
  decorationName = "car-gal"
}

print("Device ID // Decoration Name", deviceID, decorationName);

let btn = Cfg.get('board.btn1.pin');              // Built-in button GPIO
let led = Cfg.get('board.led1.pin');              // Built-in LED GPIO number
let onhi = Cfg.get('board.led1.active_high');     // LED on when high?
let state = {on: false, btnCount: 0, uptime: 0};  // Device state
let online = false;                               // Connected to the cloud?

let JAW_MAX = 0.07; // Fully open
let JAW_MIN = 0.01; // Fully closed

let NECK_MIN = 0.018;
let NECK_CENTER = 0.0725;
let NECK_MAX = 0.115;

// Print whether we're online, every second
Timer.set(1000, Timer.REPEAT, function() {
  state.uptime = Sys.uptime();
  state.ram_free = Sys.free_ram();
  print('online:', online, JSON.stringify(state));
}, null);

Event.on(Event.CLOUD_CONNECTED, function() {
  online = true;
  Shadow.update(0, {ram_total: Sys.total_ram()});
}, null);

Event.on(Event.CLOUD_DISCONNECTED, function() {
  online = false;
}, null);

function jawPercentage(percent) {
  writeJawRaw((percent * 0.06 / 100) + 0.01);
}

function writeJawRaw(value) {
  let adjustedValue = Math.max(JAW_MIN, Math.min(JAW_MAX, value));
  PWM.set(5, 50, adjustedValue);
}

function neckPercentage(percent) {
  writeNeckRaw((percent * (NECK_MAX - NECK_MIN) / 100) + NECK_MIN);
}

function writeNeckRaw(value) {
  PWM.set(4, 50, value);
}

function eyesPercent(percent) {
  writeEyesRaw(percent / 100);
}

function writeEyesRaw(value) {
  PWM.set(14, 50, Math.max(0.0, Math.min(1.0, value)));
}

MQTT.sub('halloween/skeleton/' + decorationName + '/jaw/percent', function(conn, topic, msg) {
  jawPercentage(JSON.parse(msg));
}, null);

MQTT.sub('halloween/skeleton/' + decorationName + '/neck/percent', function(conn, topic, msg) {
  neckPercentage(JSON.parse(msg));
}, null);

MQTT.sub('halloween/skeleton/' + decorationName + '/eyes/percent', function(conn, topic, msg) {
  eyesPercent(JSON.parse(msg));
}, null);

MQTT.sub('halloween/skeletons/jaw/percent', function(conn, topic, msg) {
  jawPercentage(JSON.parse(msg));
}, null);

MQTT.sub('halloween/skeletons/neck/percent', function(conn, topic, msg) {
  neckPercentage(JSON.parse(msg));
}, null);

MQTT.sub('halloween/skeletons/eyes/percent', function(conn, topic, msg) {
  eyesPercent(JSON.parse(msg));
}, null);
