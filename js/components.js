// OPENLAB component catalogue.
// Prices are typical Indian street / online hobby-shop prices in INR (2026),
// rounded. Each entry may list ordered cheaper alternatives. `impact` is a
// 0–1 score of how much the project's function degrades if the alternative
// is used (0 = identical, 1 = project no longer works). `salvage: true`
// marks things you can usually find for free.

export const CATEGORIES = [
  'Microcontroller', 'Sensor', 'Actuator', 'Passive', 'IC', 'Display', 'Power',
  'Wiring', 'Mechanical', 'Optics', 'Chemical', 'Consumable', 'Structure',
  'Tool-like part', 'Device you already own'
];

const C = {};
function add(id, name, category, unitCost, opts = {}) {
  C[id] = { id, name, category, unitCost, unit: opts.unit || 'pc', synonyms: opts.synonyms || [],
    alternatives: opts.alternatives || [], salvage: !!opts.salvage, assumedOwned: !!opts.assumedOwned,
    availability: opts.availability || 'Hobby electronics shop or online marketplace', note: opts.note || '' };
}
function alt(id, impact, impactText, availability) { return { id, impact, impactText, availability }; }

// ---- Devices you already own ----
add('phone-camera', 'Smartphone camera (your own phone)', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['phone', 'smartphone', 'mobile', 'mobile camera', 'phone camera'], availability: 'Any Android/iOS phone' });
add('phone-stopwatch', 'Smartphone stopwatch app', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['stopwatch', 'timer', 'phone timer'], availability: 'Built into every phone' });
add('android-phone-pydroid', 'Android phone with Pydroid 3 (free app)', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['android phone', 'pydroid', 'python phone'], availability: 'Play Store, free tier is enough' });
add('web-browser', 'Any device with a web browser', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['browser', 'laptop', 'computer', 'pc', 'chromebook', 'tablet'], availability: 'Phone, tablet, school computer' });
add('computer-usb', 'Computer with a USB port (for uploading code)', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['laptop', 'pc', 'computer', 'desktop'], availability: 'School lab computer works; Arduino IDE is free' });

// ---- Microcontrollers ----
add('arduino-uno', 'Arduino Uno R3 (compatible clone)', 'Microcontroller', 450, {
  synonyms: ['arduino', 'uno', 'arduino uno', 'uno r3', 'arduino board'],
  alternatives: [alt('arduino-nano', 0.05, 'Same chip (ATmega328P) but smaller; needs a breadboard or soldered headers.', 'Widely available, ₹280–320'), alt('esp8266-nodemcu', 0.15, '3.3 V logic: LDR/servo circuits need a small rethink and the ADC has only one channel.', '₹250–300')]
});
add('arduino-nano', 'Arduino Nano (compatible clone, soldered headers)', 'Microcontroller', 300, { synonyms: ['nano', 'arduino nano'] });
add('esp8266-nodemcu', 'NodeMCU ESP8266 (Wi‑Fi microcontroller)', 'Microcontroller', 280, { synonyms: ['nodemcu', 'esp8266', 'esp'] });
add('esp32-devkit', 'ESP32 DevKit V1', 'Microcontroller', 420, { synonyms: ['esp32'], alternatives: [alt('esp8266-nodemcu', 0.2, 'Only one usable analog input and no Bluetooth; fine for single-sensor logging.', '₹250–300')] });
add('usb-cable-ab', 'USB A‑B cable (printer type, for Uno)', 'Wiring', 60, { synonyms: ['usb cable', 'printer cable', 'usb a-b'], alternatives: [alt('usb-cable-salvaged', 0, 'Any old printer/scanner USB cable works.', 'Salvage from an old printer')] });
add('usb-cable-salvaged', 'Salvaged USB A‑B cable', 'Wiring', 0, { salvage: true, synonyms: ['old usb cable'] });

// ---- Sensors ----
add('ldr', 'LDR / photoresistor (5 mm, GL5528)', 'Sensor', 8, { synonyms: ['ldr', 'photoresistor', 'light dependent resistor', 'photocell', 'light sensor', 'gl5528'] });
add('dht22', 'DHT22 / AM2302 temperature-humidity sensor', 'Sensor', 250, { synonyms: ['dht22', 'am2302', 'humidity sensor'],
  alternatives: [alt('dht11', 0.3, 'Humidity accuracy drops from ±2 % to ±5 %; temperature resolution 1 °C instead of 0.1 °C.', '₹80–100 everywhere')] });
add('dht11', 'DHT11 temperature-humidity sensor', 'Sensor', 90, { synonyms: ['dht11', 'dht'] });
add('bmp280', 'BMP280 barometric pressure module', 'Sensor', 150, { synonyms: ['bmp280', 'pressure sensor', 'barometer', 'bmp'] });
add('mq135', 'MQ‑135 air-quality gas sensor module', 'Sensor', 180, { synonyms: ['mq135', 'mq-135', 'gas sensor', 'air quality sensor'] });
add('pms5003', 'PMS5003 laser PM2.5 particulate sensor', 'Sensor', 1600, { synonyms: ['pms5003', 'pm2.5 sensor', 'dust sensor', 'particulate sensor'],
  alternatives: [alt('gp2y1010', 0.4, 'Optical dust sensor gives a rough relative dust level, not a calibrated µg/m³ reading. Trends still visible.', '₹450–550'), alt('mq135', 0.75, 'Gas sensor only: no particulate reading at all. Logs CO₂-equivalent/VOC trend instead.', '₹180')] });
add('gp2y1010', 'Sharp GP2Y1010AU0F optical dust sensor', 'Sensor', 500, { synonyms: ['gp2y1010', 'sharp dust sensor'] });
add('soil-moisture-capacitive', 'Capacitive soil moisture sensor v1.2', 'Sensor', 120, { synonyms: ['soil moisture sensor', 'capacitive soil sensor', 'moisture sensor'],
  alternatives: [alt('soil-probe-nails', 0.35, 'Two galvanised nails as a resistive probe: corrodes in weeks and reads relative wetness only.', 'Hardware shop, ₹5 for two nails')] });
add('soil-probe-nails', 'Two galvanised nails + 10 kΩ divider (resistive soil probe)', 'Sensor', 5, { synonyms: ['nails', 'galvanised nails'] });
add('tcrt5000', 'TCRT5000 IR reflectance sensor module', 'Sensor', 35, { synonyms: ['tcrt5000', 'ir sensor', 'line sensor', 'infrared sensor', 'ir module'] });
add('hc-sr04', 'HC‑SR04 ultrasonic distance sensor', 'Sensor', 70, { synonyms: ['hc-sr04', 'ultrasonic', 'ultrasonic sensor', 'distance sensor'] });
add('ds18b20', 'DS18B20 waterproof temperature probe', 'Sensor', 110, { synonyms: ['ds18b20', 'temperature probe', 'waterproof temperature sensor'],
  alternatives: [alt('thermistor-10k', 0.2, 'A 10 kΩ NTC thermistor needs a calibration step (Steinhart–Hart or a lookup table) and is not waterproof unless you seal it with heat-shrink.', '₹5')] });
add('thermistor-10k', '10 kΩ NTC thermistor', 'Sensor', 5, { synonyms: ['thermistor', 'ntc'] });
add('pushbutton', 'Tactile pushbutton (6 mm)', 'Passive', 2, { synonyms: ['button', 'push button', 'tactile switch', 'switch'] });
add('ph-meter-pen', 'Digital pH pen (0.1 resolution)', 'Sensor', 450, { synonyms: ['ph meter', 'ph pen'],
  alternatives: [alt('ph-strips', 0.3, 'Universal indicator strips read to about ±0.5 pH and cannot log continuously.', '₹120 for 80 strips'), alt('cabbage-indicator-self-made', 0.5, 'Your own red-cabbage indicator: colour chart resolution of roughly 1 pH unit.', 'Make it from the Red Cabbage pH Indicator resource')] });
add('ph-strips', 'Universal pH indicator strips (pack of 80)', 'Consumable', 120, { unit: 'pack', synonyms: ['ph strips', 'ph paper', 'litmus', 'indicator strips'] });
add('cabbage-indicator-self-made', 'Home-made red cabbage indicator (see resource)', 'Chemical', 0, { salvage: true, synonyms: ['cabbage indicator'] });

// ---- Actuators ----
add('servo-sg90', 'SG90 micro servo (9 g)', 'Actuator', 110, { synonyms: ['servo', 'sg90', 'micro servo', 'servo motor'] });
add('tt-gear-motor', 'TT DC gear motor (yellow, 1:48) with wheel', 'Actuator', 90, { synonyms: ['tt motor', 'gear motor', 'dc motor', 'yellow motor', 'bo motor'] });
add('dc-motor-3v', 'Small 3 V DC hobby motor', 'Actuator', 40, { synonyms: ['dc motor', 'toy motor', 'hobby motor', '3v motor'], alternatives: [alt('dc-motor-salvaged', 0, 'A motor from a broken toy car works the same.', 'Salvage from old toys')] });
add('dc-motor-salvaged', 'Salvaged toy-car DC motor', 'Actuator', 0, { salvage: true, synonyms: ['old motor', 'toy car motor'] });
add('l298n', 'L298N dual H‑bridge motor driver module', 'IC', 150, { synonyms: ['l298n', 'motor driver', 'h-bridge'],
  alternatives: [alt('l293d-ic', 0.1, 'Bare L293D chip on a breadboard: same function, but you wire 16 pins yourself and it runs warmer.', '₹60')] });
add('l293d-ic', 'L293D motor driver IC (DIP‑16)', 'IC', 60, { synonyms: ['l293d'] });
add('buzzer-passive', 'Passive piezo buzzer', 'Actuator', 15, { synonyms: ['buzzer', 'piezo', 'speaker'] });
add('vibration-motor', 'Coin vibration motor (3 V)', 'Actuator', 25, { synonyms: ['vibration motor', 'haptic motor', 'coin motor'], alternatives: [alt('vibration-motor-salvaged', 0, 'Salvaged from an old phone or game controller.', 'Old phones')] });
add('vibration-motor-salvaged', 'Salvaged phone vibration motor', 'Actuator', 0, { salvage: true, synonyms: ['old phone motor'] });
add('solenoid-5v', '5 V push-pull mini solenoid', 'Actuator', 140, { synonyms: ['solenoid'] });

// ---- Passives / ICs ----
add('resistor-220', 'Resistor 220 Ω (¼ W)', 'Passive', 1, { synonyms: ['220 ohm', '220r', '220 ohm resistor', 'resistor'], note: 'Sold in packs of 10 for ₹10.' });
add('resistor-1k', 'Resistor 1 kΩ (¼ W)', 'Passive', 1, { synonyms: ['1k', '1k resistor', 'resistor'] });
add('resistor-10k', 'Resistor 10 kΩ (¼ W)', 'Passive', 1, { synonyms: ['10k', '10k resistor', 'resistor'] });
add('resistor-100k', 'Resistor 100 kΩ (¼ W)', 'Passive', 1, { synonyms: ['100k', '100k resistor', 'resistor'] });
add('resistor-kit', 'Resistor assortment (600 pcs, 30 values)', 'Passive', 60, { unit: 'kit', synonyms: ['resistor kit', 'resistor pack', 'assorted resistors', 'resistors'] });
add('potentiometer-100k', 'Potentiometer 100 kΩ (linear)', 'Passive', 15, { synonyms: ['pot', 'potentiometer', 'variable resistor', '100k pot'] });
add('capacitor-10uf', 'Electrolytic capacitor 10 µF / 25 V', 'Passive', 2, { synonyms: ['10uf', 'capacitor', '10uf capacitor'] });
add('capacitor-100nf', 'Ceramic capacitor 100 nF (104)', 'Passive', 1, { synonyms: ['100nf', '0.1uf', 'ceramic capacitor', 'capacitor'] });
add('capacitor-10nf', 'Ceramic capacitor 10 nF (103)', 'Passive', 1, { synonyms: ['10nf', 'capacitor'] });
add('led-5mm', 'LED 5 mm (any colour)', 'Passive', 2, { synonyms: ['led', 'leds', 'light emitting diode', 'red led', 'green led'] });
add('led-rgb', 'RGB LED 5 mm (common cathode)', 'Passive', 8, { synonyms: ['rgb led'] });
add('ne555', 'NE555 timer IC (DIP‑8)', 'IC', 12, { synonyms: ['555', 'ne555', '555 timer', 'timer ic'] });
add('diode-1n4007', 'Diode 1N4007', 'Passive', 1, { synonyms: ['diode', '1n4007', '1n4148'] });
add('transistor-bc547', 'Transistor BC547 (NPN)', 'Passive', 2, { synonyms: ['bc547', 'transistor', 'npn'] });
add('tip120', 'TIP120 Darlington transistor', 'Passive', 20, { synonyms: ['tip120', 'darlington'], alternatives: [alt('transistor-bc547', 0.5, 'BC547 handles only 100 mA: the electromagnet must use thinner wire / more turns and lifts less.', '₹2')] });

// ---- Displays ----
add('oled-096', '0.96" I²C OLED display (SSD1306)', 'Display', 220, { synonyms: ['oled', 'ssd1306', 'oled display', '0.96 oled'],
  alternatives: [alt('serial-monitor', 0.15, 'Readings shown on the Arduino Serial Monitor / Serial Plotter on a computer instead of on the device.', 'Free (needs the computer connected)')] });
add('lcd-16x2-i2c', '16×2 character LCD with I²C backpack', 'Display', 180, { synonyms: ['lcd', '16x2', 'lcd display', 'i2c lcd'], alternatives: [alt('serial-monitor', 0.15, 'Readings on Serial Monitor instead of a standalone display.', 'Free')] });
add('serial-monitor', 'Serial Monitor on the connected computer', 'Device you already own', 0, { salvage: true, assumedOwned: true, synonyms: ['serial monitor'] });

// ---- Power ----
add('battery-9v', '9 V battery', 'Power', 30, { synonyms: ['9v', '9v battery', '9 volt'] });
add('battery-snap-9v', '9 V battery snap connector', 'Power', 8, { synonyms: ['battery snap', '9v clip', 'battery clip'] });
add('battery-aa', 'AA alkaline cell', 'Power', 15, { synonyms: ['aa', 'aa battery', 'aa cell', 'battery', 'batteries'] });
add('battery-holder-4aa', '4×AA battery holder with switch', 'Power', 35, { synonyms: ['battery holder', 'aa holder', '4aa holder'] });
add('battery-d', 'D-size alkaline cell', 'Power', 35, { synonyms: ['d cell', 'd battery', 'torch cell', 'big battery'], alternatives: [alt('battery-aa', 0.2, 'AA cell has the same 1.5 V but less current; homopolar motor spins slower and the cell drains faster.', '₹15')] });
add('cell-18650', '18650 Li‑ion cell (2000 mAh)', 'Power', 120, { synonyms: ['18650', 'li-ion', 'lithium cell', 'lithium battery'],
  alternatives: [alt('battery-holder-4aa', 0.1, '4×AA gives 6 V; drop the buck converter and feed the driver directly. Runtime shorter and cost per recharge higher.', '₹35 + cells')] });
add('holder-18650-2', '2×18650 battery holder', 'Power', 30, { synonyms: ['18650 holder'] });
add('buck-converter', 'LM2596 buck converter module', 'Power', 55, { synonyms: ['buck converter', 'lm2596', 'step down', 'voltage regulator'] });
add('solar-panel-6v', '6 V / 1 W polycrystalline solar panel', 'Power', 180, { synonyms: ['solar panel', 'solar cell', 'pv panel'] });
add('power-bank', 'USB power bank (any)', 'Device you already own', 0, { assumedOwned: true, salvage: true, synonyms: ['power bank', 'powerbank', 'usb power'] });

// ---- Wiring ----
add('breadboard-half', 'Half-size breadboard (400 points)', 'Wiring', 80, { synonyms: ['breadboard', 'bread board', 'half breadboard'],
  alternatives: [alt('breadboard-mini', 0.05, 'A 170-point mini breadboard fits simple circuits; tight for anything with more than one IC.', '₹35')] });
add('breadboard-mini', 'Mini breadboard (170 points)', 'Wiring', 35, { synonyms: ['mini breadboard'] });
add('jumper-wires', 'Jumper wire set (40 pcs, M‑M / M‑F mix)', 'Wiring', 60, { unit: 'set', synonyms: ['jumper wires', 'jumpers', 'jumper', 'dupont wires', 'wires', 'wire', 'connecting wires'],
  alternatives: [alt('scrap-wire', 0.1, 'Stripped single-core wire from an old LAN/telephone cable works on a breadboard; less convenient for header pins.', 'Salvage from old cables')] });
add('scrap-wire', 'Scrap single-core wire (from old LAN / phone cable)', 'Wiring', 0, { salvage: true, synonyms: ['scrap wire', 'old wire', 'lan cable', 'telephone wire', 'copper wire'] });
add('enamel-wire-100g', 'Enamelled copper wire 26 SWG (100 g spool)', 'Wiring', 180, { unit: 'spool', synonyms: ['enamelled wire', 'enamel wire', 'magnet wire', 'winding wire', 'copper winding wire'],
  alternatives: [alt('enamel-wire-salvaged', 0.15, 'Wire unwound from a dead transformer, fan or relay coil; you may need to join short lengths.', 'Salvage from a dead adapter or ceiling-fan repair shop scrap')] });
add('enamel-wire-salvaged', 'Salvaged enamelled wire (from a dead transformer or motor)', 'Wiring', 0, { salvage: true, synonyms: ['old transformer wire', 'salvaged wire'] });
add('crocodile-clips', 'Crocodile clip leads (pack of 10)', 'Wiring', 70, { unit: 'pack', synonyms: ['crocodile clips', 'alligator clips', 'clip leads', 'croc clips'],
  alternatives: [alt('scrap-wire', 0.15, 'Twist bare wire ends around terminals and tape them; less reliable contact.', 'Salvage')] });
add('usb-ttl', 'USB‑TTL serial adapter (CP2102)', 'Wiring', 120, { synonyms: ['usb ttl', 'cp2102', 'ftdi', 'serial adapter'] });

// ---- Mechanical ----
add('robot-chassis-2wd', '2WD acrylic robot chassis kit (plate, 2 motors, wheels, castor)', 'Mechanical', 300, { synonyms: ['chassis', 'robot chassis', 'car chassis', '2wd chassis', 'robot kit'],
  alternatives: [alt('cardboard-chassis', 0.2, 'Corrugated-cardboard chassis (template in CAD tab) is lighter and flexes a little; needs hot glue.', 'Salvage a box; template provided')] });
add('cardboard-chassis', 'Cardboard chassis (from CAD template)', 'Structure', 0, { salvage: true, synonyms: ['cardboard chassis'] });
add('wheel-65mm', '65 mm plastic wheel for TT motor', 'Mechanical', 40, { synonyms: ['wheel', 'wheels', 'robot wheel'], alternatives: [alt('bottle-cap-wheel', 0.15, 'Bottle-cap wheels with a rubber-band tyre: less grip, works on smooth floors.', 'Salvage')] });
add('bottle-cap-wheel', 'Bottle-cap wheel with rubber-band tyre', 'Structure', 0, { salvage: true, synonyms: ['bottle cap'] });
add('castor-wheel', 'Ball castor wheel', 'Mechanical', 30, { synonyms: ['castor', 'caster', 'ball castor'], alternatives: [alt('marble-castor', 0.1, 'A glass marble in a bottle-cap socket rolls fine on smooth floors.', 'Salvage')] });
add('marble-castor', 'Marble in a bottle-cap socket (castor)', 'Structure', 0, { salvage: true, synonyms: ['marble'] });
add('neodymium-magnet', 'Neodymium disc magnet 12×3 mm', 'Mechanical', 40, { synonyms: ['magnet', 'neodymium', 'neodymium magnet', 'strong magnet'], alternatives: [alt('magnet-salvaged', 0.1, 'Magnets from a dead hard disk or speaker are strong enough; shapes vary so the wire loop needs re-bending.', 'Old hard drive / speaker')] });
add('magnet-salvaged', 'Salvaged magnet (hard disk / speaker)', 'Mechanical', 0, { salvage: true, synonyms: ['old magnet', 'speaker magnet', 'hard disk magnet'] });
add('iron-bolt-m8', 'Iron bolt M8 × 80 mm with nut', 'Mechanical', 15, { synonyms: ['bolt', 'iron bolt', 'nail', 'iron nail', 'large nail'], alternatives: [alt('iron-nail-salvaged', 0, 'Any large iron nail or bolt works as a core.', 'Salvage')] });
add('iron-nail-salvaged', 'Salvaged iron nail / bolt', 'Mechanical', 0, { salvage: true, synonyms: ['old nail', 'old bolt'] });
add('steel-nut-m10', 'Steel nut M10 (pendulum bob)', 'Mechanical', 5, { synonyms: ['nut', 'steel nut', 'bob', 'washer'], alternatives: [alt('salvaged-weight', 0, 'Any dense small object: a padlock, a bunch of keys, a stone tied in a cloth.', 'Salvage')] });
add('salvaged-weight', 'Salvaged weight (padlock, keys, stone)', 'Structure', 0, { salvage: true, synonyms: ['weight', 'stone', 'padlock'] });
add('string-cotton', 'Cotton string / thread (10 m)', 'Consumable', 15, { synonyms: ['string', 'thread', 'cotton thread', 'twine', 'rope'], alternatives: [alt('string-salvaged', 0, 'Any non-stretchy thread works; avoid elastic or wool.', 'Household')] });
add('string-salvaged', 'Household string / thread', 'Consumable', 0, { salvage: true, synonyms: ['thread'] });
add('wooden-dowel', 'Wooden dowel 12 mm × 300 mm', 'Structure', 25, { synonyms: ['dowel', 'wooden stick', 'stick', 'broom handle'], alternatives: [alt('pencil-dowel', 0, 'A pencil or a length of broom handle.', 'Household')] });
add('pencil-dowel', 'Pencil / broom-handle offcut (dowel)', 'Structure', 0, { salvage: true, synonyms: ['pencil'] });
add('pvc-pipe-20mm', 'PVC pipe 20 mm × 1 m', 'Structure', 45, { synonyms: ['pvc pipe', 'pvc', 'pipe'] });
add('pulley-small', 'Small plastic pulley wheel', 'Mechanical', 25, { synonyms: ['pulley'], alternatives: [alt('thread-spool-pulley', 0.05, 'An empty thread spool on a pencil axle.', 'Household')] });
add('thread-spool-pulley', 'Empty thread spool (pulley)', 'Structure', 0, { salvage: true, synonyms: ['spool', 'thread spool'] });
add('bearing-608', '608 skateboard bearing', 'Mechanical', 30, { synonyms: ['bearing', '608', 'skate bearing'], alternatives: [alt('pencil-dowel', 0.25, 'A pencil through a straw as the axle: much more friction, turbine needs stronger wind.', 'Household')] });
add('ball-bearing-8mm', 'Steel ball bearing 8 mm', 'Mechanical', 5, { synonyms: ['steel ball', 'ball bearing', 'marble'], alternatives: [alt('marble-castor', 0, 'A glass marble works.', 'Salvage')] });
add('hinge-small', 'Small brass hinge with screws', 'Mechanical', 20, { synonyms: ['hinge'], alternatives: [alt('tape-hinge', 0.1, 'A fabric-tape hinge wears out but works for a semester.', 'Household')] });
add('tape-hinge', 'Cloth-tape hinge', 'Consumable', 0, { salvage: true, synonyms: ['cloth tape'] });

// ---- Optics ----
add('grating-film', 'Diffraction grating film 1000 lines/mm (5×5 cm)', 'Optics', 600, { synonyms: ['diffraction grating', 'grating', 'grating film'],
  availability: 'Science suppliers online; often sold in packs',
  alternatives: [alt('cd-grating', 0.35, 'A CD segment (~625 lines/mm) resolves about 5 nm instead of ~1 nm and shows some ghost lines. All visible emission lines still separate.', 'Any old CD; free'), alt('dvd-grating', 0.4, 'A DVD layer (~1350 lines/mm) disperses more than a CD but the two bonded halves are hard to split cleanly and the dye layer tints the spectrum.', 'Any old DVD; free')] });
add('cd-grating', 'Segment of an old CD (diffraction grating)', 'Optics', 0, { salvage: true, synonyms: ['cd', 'old cd', 'compact disc'] });
add('dvd-grating', 'Segment of an old DVD (diffraction grating)', 'Optics', 0, { salvage: true, synonyms: ['dvd', 'old dvd'] });
add('usb-webcam', 'USB webcam 720p (manual focus)', 'Optics', 950, { synonyms: ['webcam', 'usb camera', 'camera'],
  alternatives: [alt('phone-camera', 0.15, 'You align the phone by hand and analyse photos afterwards instead of capturing live on a laptop.', 'Your own phone')] });
add('body-3d-printed', '3D-printed spectrometer body (print service, ~60 g PLA)', 'Structure', 1050, { synonyms: ['3d print', '3d printed body', 'printed enclosure'],
  availability: 'Local print service / school fab-lab (STL in CAD tab)',
  alternatives: [alt('cardboard-box-body', 0.2, 'Cardboard body from the printable template: light leaks need black tape and it flexes, so re-check alignment after moving it.', '2 corrugated sheets ₹40, or a free shoebox')] });
add('cardboard-box-body', 'Cardboard body (2 corrugated sheets, template in CAD tab)', 'Structure', 40, { synonyms: ['cardboard body', 'cardboard box'] });
add('glass-bead-lens', 'Glass ball lens 2.5 mm (borosilicate)', 'Optics', 15, { synonyms: ['ball lens', 'glass bead', 'bead lens', 'lens'], availability: 'Optics suppliers; school science kits',
  alternatives: [alt('water-drop-lens', 0.5, 'A water drop on a wire loop magnifies ~10× and evaporates; fine for a 5-minute demonstration.', 'Free')] });
add('water-drop-lens', 'Water-drop lens on a wire loop', 'Optics', 0, { salvage: true, synonyms: ['water drop'] });
add('laser-pointer', 'Red laser pointer (Class 2, < 1 mW)', 'Optics', 120, { synonyms: ['laser', 'laser pointer'] });
add('mirror-small', 'Small flat mirror 5×5 cm', 'Optics', 20, { synonyms: ['mirror'], alternatives: [alt('mirror-salvaged', 0, 'Any pocket mirror or a piece of an old CD (shiny side).', 'Household')] });
add('mirror-salvaged', 'Pocket mirror (household)', 'Optics', 0, { salvage: true, synonyms: ['pocket mirror'] });
add('magnifier-10x', '10× hand magnifier', 'Optics', 60, { synonyms: ['magnifier', 'magnifying glass', 'hand lens'] });

// ---- Chemical / consumable ----
add('red-cabbage', 'Red cabbage (½ head)', 'Chemical', 30, { synonyms: ['cabbage', 'red cabbage', 'purple cabbage'], availability: 'Vegetable market' });
add('vinegar', 'White vinegar (250 ml)', 'Chemical', 40, { synonyms: ['vinegar', 'acetic acid'], availability: 'Grocery' });
add('baking-soda', 'Baking soda (100 g)', 'Chemical', 20, { synonyms: ['baking soda', 'sodium bicarbonate', 'soda'], availability: 'Grocery' });
add('lemon', 'Lemon', 'Chemical', 5, { synonyms: ['lemon', 'lime'] });
add('salt', 'Table salt (100 g)', 'Chemical', 5, { synonyms: ['salt', 'sodium chloride', 'nacl'] });
add('epsom-salt', 'Epsom salt / magnesium sulphate (100 g)', 'Chemical', 30, { synonyms: ['epsom salt', 'magnesium sulphate', 'mgso4'], alternatives: [alt('baking-soda', 0.1, 'Baking soda works as an electrolyte; produces a little CO₂ at the anode along with oxygen.', 'Grocery')] });
add('washing-soda', 'Washing soda / sodium carbonate (100 g)', 'Chemical', 20, { synonyms: ['washing soda', 'sodium carbonate'] });
add('pencil-graphite', 'Pencil leads 2 mm (graphite electrodes, pack)', 'Chemical', 20, { unit: 'pack', synonyms: ['pencil lead', 'graphite', 'graphite electrode', 'pencil'], alternatives: [alt('pencil-dowel', 0, 'Sharpen both ends of two ordinary pencils.', 'Household')] });
add('activated-charcoal', 'Activated charcoal (250 g)', 'Chemical', 120, { synonyms: ['activated charcoal', 'charcoal', 'activated carbon'],
  alternatives: [alt('charcoal-crushed', 0.3, 'Crushed cooking charcoal adsorbs less (smaller surface area) but still removes colour and odour.', 'Kitchen / market, ₹20')] });
add('charcoal-crushed', 'Crushed cooking charcoal', 'Chemical', 20, { synonyms: ['charcoal', 'coal'] });
add('sand-fine', 'Fine sand (1 kg)', 'Chemical', 20, { synonyms: ['sand', 'fine sand'], alternatives: [alt('sand-salvaged', 0, 'Washed river or construction sand.', 'Construction site / riverbank')] });
add('sand-salvaged', 'Washed sand (collected)', 'Chemical', 0, { salvage: true, synonyms: ['sand'] });
add('gravel', 'Gravel / small stones (1 kg)', 'Chemical', 20, { synonyms: ['gravel', 'stones', 'pebbles'], alternatives: [alt('gravel-salvaged', 0, 'Collected small stones, washed.', 'Anywhere')] });
add('gravel-salvaged', 'Collected stones (washed)', 'Chemical', 0, { salvage: true, synonyms: ['stones'] });
add('cotton-wool', 'Cotton wool (50 g)', 'Consumable', 20, { synonyms: ['cotton', 'cotton wool'] });
add('pet-bottle', 'Empty 2 L PET bottle', 'Structure', 0, { salvage: true, synonyms: ['bottle', 'pet bottle', 'plastic bottle', 'water bottle', 'soda bottle'] });
add('zinc-washer', 'Galvanised (zinc) washer M10', 'Chemical', 3, { synonyms: ['zinc washer', 'galvanised washer', 'washer', 'zinc'] });
add('copper-washer', 'Copper washer / copper strip piece', 'Chemical', 8, { synonyms: ['copper washer', 'copper strip', 'copper', 'copper coin'], alternatives: [alt('copper-salvaged', 0, 'Copper pieces cut from scrap plumbing pipe or a thick earthing wire, flattened.', 'Scrap dealer / electrician')] });
add('copper-salvaged', 'Scrap copper pieces (pipe / thick wire)', 'Chemical', 0, { salvage: true, synonyms: ['scrap copper'] });
add('paper-towel', 'Paper towel / blotting paper', 'Consumable', 10, { synonyms: ['paper towel', 'tissue', 'blotting paper', 'filter paper'] });
add('seeds-mung', 'Mung (moong) bean seeds (50 g)', 'Chemical', 10, { synonyms: ['seeds', 'mung', 'moong', 'beans', 'gram'] });
add('yeast-dry', "Baker's dry yeast (11 g sachet)", 'Chemical', 25, { synonyms: ['yeast'] });
add('sugar', 'Sugar (100 g)', 'Chemical', 5, { synonyms: ['sugar'] });
add('balloon', 'Balloon', 'Consumable', 2, { synonyms: ['balloon', 'balloons'] });
add('coffee-filter', 'Coffee filter / lab filter paper (pack of 10)', 'Consumable', 40, { unit: 'pack', synonyms: ['filter paper', 'coffee filter'], alternatives: [alt('paper-towel', 0.15, 'Folded paper towel filters slower and tears when wet.', '₹10')] });
add('matchsticks', 'Box of matchsticks', 'Consumable', 2, { synonyms: ['matches', 'matchsticks', 'toothpicks'] });

// ---- Structure / consumables ----
add('cardboard-sheet', 'Corrugated cardboard sheet A3', 'Structure', 20, { synonyms: ['cardboard', 'card board', 'corrugated', 'carton', 'box'], alternatives: [alt('cardboard-salvaged', 0, 'Any delivery box.', 'Salvage')] });
add('cardboard-salvaged', 'Salvaged cardboard box', 'Structure', 0, { salvage: true, synonyms: ['old box', 'cardboard'] });
add('black-chart-paper', 'Black chart paper (A2 sheet)', 'Consumable', 30, { synonyms: ['black paper', 'chart paper', 'black chart'] });
add('electrical-tape', 'Black electrical (PVC) tape', 'Consumable', 60, { synonyms: ['tape', 'electrical tape', 'insulation tape', 'black tape'] });
add('razor-blade', 'Single-edge razor blade', 'Tool-like part', 10, { synonyms: ['razor blade', 'blade', 'razor'] });
add('cfl-lamp', 'Compact fluorescent lamp (calibration source)', 'Optics', 90, { synonyms: ['cfl', 'cfl bulb', 'fluorescent lamp', 'tube light'], availability: 'Any electrical shop; an existing CFL/tube-light in the room works' });
add('aluminium-foil', 'Aluminium foil (roll)', 'Consumable', 40, { synonyms: ['foil', 'aluminium foil', 'aluminum foil', 'silver foil'] });
add('cling-film', 'Cling film / clear plastic sheet', 'Consumable', 40, { synonyms: ['cling film', 'plastic sheet', 'clear plastic', 'ohp sheet'], alternatives: [alt('plastic-salvaged', 0, 'A clear polythene bag or packaging window, stretched flat.', 'Salvage')] });
add('plastic-salvaged', 'Clear plastic from packaging', 'Consumable', 0, { salvage: true, synonyms: ['polythene'] });
add('black-paint', 'Matte black poster paint (small)', 'Consumable', 30, { synonyms: ['black paint', 'paint'], alternatives: [alt('black-chart-paper', 0.05, 'Line the box with black paper instead of painting.', '₹30')] });
add('glue-hot', 'Hot glue sticks (pack of 5)', 'Consumable', 30, { unit: 'pack', synonyms: ['hot glue', 'glue', 'glue stick'], alternatives: [alt('fevicol', 0.1, 'PVA glue needs clamping and drying time; less rigid joints.', '₹20')] });
add('fevicol', 'PVA white glue (50 g)', 'Consumable', 20, { synonyms: ['fevicol', 'pva', 'white glue'] });
add('double-sided-tape', 'Double-sided foam tape', 'Consumable', 40, { synonyms: ['double sided tape', 'foam tape'] });
add('protractor', 'Plastic protractor 180°', 'Tool-like part', 10, { synonyms: ['protractor'], alternatives: [alt('printed-protractor', 0, 'Print the SVG protractor from the CAD tab on paper and glue it to card.', 'Free')] });
add('printed-protractor', 'Printed paper protractor (from CAD tab)', 'Tool-like part', 0, { salvage: true, synonyms: ['paper protractor'] });
add('straw', 'Drinking straw', 'Structure', 1, { synonyms: ['straw', 'straws'] });
add('glass-jar', 'Glass jar / beaker 250 ml', 'Structure', 0, { salvage: true, assumedOwned: true, synonyms: ['jar', 'glass', 'beaker', 'cup', 'container'] });
add('ice-tray', 'Plastic ice-cube tray', 'Structure', 20, { synonyms: ['ice tray', 'ice cube tray'], alternatives: [alt('glass-jar', 0, 'Use several small cups instead.', 'Household')] });
add('dropper', 'Plastic dropper / pipette', 'Tool-like part', 5, { synonyms: ['dropper', 'pipette'], alternatives: [alt('straw', 0.05, 'A straw with your finger over the top works as a dropper.', '₹1')] });
add('foam-board', 'Foam board A3 (5 mm)', 'Structure', 60, { synonyms: ['foam board', 'sunboard', 'thermocol', 'styrofoam'], alternatives: [alt('cardboard-sheet', 0.05, 'Corrugated cardboard is heavier but works.', '₹20')] });
add('plywood-3mm', 'Plywood / MDF 3 mm A4 piece', 'Structure', 40, { synonyms: ['plywood', 'mdf', 'wood', 'wooden board'], alternatives: [alt('cardboard-sheet', 0.15, 'Double-layered cardboard instead of 3 mm ply: less rigid, cannot be laser-cut as cleanly.', '₹20')] });
add('acrylic-3mm', 'Acrylic sheet 3 mm (A4)', 'Structure', 120, { synonyms: ['acrylic', 'perspex'], alternatives: [alt('plywood-3mm', 0.05, 'Plywood is opaque but equally stiff.', '₹40'), alt('cardboard-sheet', 0.15, 'Cardboard: lighter and flexes.', '₹20')] });
add('velcro', 'Velcro strip (30 cm)', 'Consumable', 20, { synonyms: ['velcro', 'hook and loop'] });
add('bottle-caps', 'Plastic bottle caps (bag of 20)', 'Structure', 0, { salvage: true, synonyms: ['bottle caps', 'caps'] });
add('pushpins', 'Push pins (box of 50)', 'Consumable', 20, { synonyms: ['push pins', 'pins', 'drawing pins', 'thumb tacks'] });
add('rubber-bands', 'Rubber bands (bag)', 'Consumable', 10, { synonyms: ['rubber band', 'rubber bands', 'elastic'] });
add('braille-dots-beads', 'Half-dome beads 5 mm (pack of 100, for tactile dots)', 'Consumable', 40, { unit: 'pack', synonyms: ['beads', 'half beads', 'tactile dots', 'dome stickers'], alternatives: [alt('glue-dots', 0.1, 'Raised dots of hot glue or fabric paint (puff paint): less uniform height, still readable.', '₹30')] });
add('glue-dots', 'Fabric puff-paint dots', 'Consumable', 30, { synonyms: ['puff paint', 'fabric paint', 'glue dots'] });
add('pipe-cleaners', 'Pipe cleaners (pack of 20)', 'Consumable', 40, { unit: 'pack', synonyms: ['pipe cleaner', 'chenille sticks'], alternatives: [alt('scrap-wire', 0.05, 'Insulated scrap wire bends into graph lines just as well.', 'Salvage')] });
add('thermometer-lab', 'Lab thermometer −10 to 110 °C', 'Sensor', 80, { synonyms: ['thermometer', 'glass thermometer'], alternatives: [alt('ds18b20', 0.1, 'Digital probe with an Arduino, if you already have one.', '₹110')] });
add('measuring-tape', 'Measuring tape (3 m)', 'Tool-like part', 40, { synonyms: ['measuring tape', 'tape measure', 'ruler', 'scale', 'metre scale'] });

export const COMPONENTS = C;

export function getComponent(id) { return C[id] || null; }

// Build synonym lookup: normalised phrase -> component id (first wins by longest phrase)
export const SYNONYM_INDEX = (() => {
  const idx = new Map();
  const norm = s => s.toLowerCase().replace(/[^a-z0-9.+ ]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const c of Object.values(C)) {
    const names = [c.name, ...(c.synonyms || [])];
    for (const n of names) {
      const k = norm(n);
      if (!k) continue;
      if (!idx.has(k)) idx.set(k, []);
      if (!idx.get(k).includes(c.id)) idx.get(k).push(c.id);
    }
  }
  return idx;
})();
