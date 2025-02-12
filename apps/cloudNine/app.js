Bangle.setHRMPower(1); // Enable heart rate monitor

let hrmData = null;
let tempData = null;
let lightData = null;
let steps = 0;
let deepSleep = 0;
let lightSleep = 0;
let awake = 0;

// Function to update display
function updateDisplay() {
  g.clear();
  g.setFont("6x8", 1.7);
  
  g.drawString("Heart Rate: " + (hrmData ? hrmData.bpm + " BPM" : "N/A"), 10, 10);
  g.drawString("Temp: " + (tempData ? tempData + "°C" : "N/A"), 10, 30);
  g.drawString("Light: " + (lightData ? lightData : "N/A"), 10, 50);
  g.drawString("Steps: " + (steps ? steps : "N/A"), 10, 70);
  g.drawString("Deep Sleep: " + Math.round(deepSleep / 60) + "h", 10, 90);
  g.drawString("Light Sleep: " + Math.round(lightSleep / 60) + "h", 10, 110);
  g.drawString("Awake: " + Math.round(awake / 60) + "h", 10, 130);
  
  g.flip();
}

// Read heart rate
Bangle.on('HRM', function(hrm) {
  hrmData = hrm;
  updateDisplay();
});

// Read light sensor
Bangle.on('light', function(light) {
  lightData = light;
  updateDisplay();
});

// Read health data (steps & sleep)
function readHealthData() {
  Bangle.getHealthStatus("day").then(data => {
    steps = data.steps || 0;
    deepSleep = data.sleepDeep || 0;
    lightSleep = data.sleep || 0;
    awake = data.awake || 0;
    updateDisplay();
  });
}

// Read temperature
function readTemperature() {
  E.getTemperature().then(temp => {
    tempData = temp.toFixed(1);
    updateDisplay();
  });
}

// Set intervals to update data
setInterval(readTemperature, 1000);  // Every second
setInterval(readHealthData, 1000);   // Every second

// Send Data to Phone via Bluetooth
function sendData() {
  if (NRF.getSecurityStatus().connected) {
    let data = {
      heartRate: hrmData ? hrmData.bpm : null,
      temperature: tempData,
      light: lightData,
      steps: steps,
      deepSleep: deepSleep,
      lightSleep: lightSleep,
      awake: awake
    };
    
    NRF.updateServices({
      0x180D: { // Heart Rate Service
        0x2A37: { value: JSON.stringify(data), notify: true }
      }
    });

    console.log("Sent:", data);
  }
}

// Send data every second
setInterval(sendData, 1000);

// Bluetooth Service Setup
NRF.setServices({
  0x180D: { 
    0x2A37: {
      value: JSON.stringify({ heartRate: 0, temperature: 0 }),
      notify: true,
      readable: true
    }
  }
}, { advertise: ['180D'] });

NRF.on('connect', () => {
  console.log("Connected to iOS App");
});
NRF.on('disconnect', () => {
  console.log("Disconnected");
});

// Show initializing message
g.clear();
g.drawString("Initializing...", 10, 10);
g.flip();
