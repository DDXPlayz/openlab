// OPENLAB resource database. Costs are never hand-typed: `cost` is computed
// from components × catalogue unit prices at load time (see bottom of file).
import { COMPONENTS } from './components.js';

const c = (id, qty = 1, core = true, note = '') => ({ id, qty, core, note });
const v = (version, date, message, author = 'openlab-core') => ({ version, date, message, author });
const s = (hazard, mitigation) => ({ hazard, mitigation });

export const DOMAINS = ['Physics', 'Chemistry', 'Biology', 'Electronics', 'Robotics', 'Computing', 'Mathematics', 'Environmental science'];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];
export const REQUIRES = { microcontroller: 'needs a microcontroller', computer: 'needs a computer/phone to run code', soldering: 'needs soldering', mains: 'uses mains electricity', sharp: 'uses blades / sharp tools', heat: 'uses heat or hot glue', chemicals: 'handles household chemicals' };

const RAW = [
// ---------------------------------------------------------------- PHYSICS
{
  id: 'diy-spectrometer', title: 'DIY visible-light spectrometer',
  description: 'A slit-and-grating spectrometer that splits light from a lamp, the sky or a flame into its spectrum and photographs it. With a CFL as a calibration source you can turn pixel position into wavelength to about ±5 nm and identify the mercury lines in a tube-light, the sodium doublet in a street lamp, or absorption by coloured solutions. The reference build uses a 1000 lines/mm grating, a USB webcam and a 3D-printed body; the cost-down build uses a CD, your phone and cardboard.',
  difficulty: 'Intermediate', domains: ['Physics', 'Computing'], ageMin: 13, type: 'mixed', license: 'CC BY-SA 4.0', timeMinutes: 180,
  requires: ['computer', 'sharp'],
  components: [c('body-3d-printed'), c('usb-webcam'), c('grating-film'), c('cfl-lamp', 1, false, 'Calibration source; any CFL or tube-light in the room also works'), c('electrical-tape'), c('black-chart-paper'), c('razor-blade', 2)],
  tools: ['Hobby knife or scissors', 'Ruler', 'Glue (hot or PVA)', 'Computer with Python 3 (for analysis)'],
  steps: [
    'Print the body (CAD tab, spectrometer-body.scad) or print the cardboard template at 100% on A3, cut on the solid lines and fold on the dashed lines. Line every inside face with black chart paper: stray reflections are the main enemy.',
    'Make the entrance slit: tape two razor blades over the 4 × 12 mm window with their edges parallel and about 0.2 mm apart (a strip of paper is a good spacer). A narrower slit gives sharper lines but a dimmer spectrum.',
    'Cut a 25 × 25 mm piece of grating film (or a CD segment: score the label side, peel the reflective layer off with tape, and use the clear plastic). Glue it over the far window at 45° to the tube axis so the first-order spectrum falls on the side port.',
    'Mount the webcam (or rest your phone) at the side port, lens pointing at the grating. Point the slit at a CFL and adjust the camera angle until you see a bright rainbow with sharp vertical lines in it.',
    'Capture a photo of the CFL spectrum. The bright lines at 436 nm (blue), 546 nm (green) and 611 nm (orange-red) are mercury and europium lines: note the pixel column of each.',
    'Run spectrum.py on the photo. It averages the rows, fits a straight line from pixel column to wavelength through your three calibration points, and plots intensity vs wavelength.',
    'Now photograph other sources with the camera untouched: the sky, an LED, a sodium street lamp, or a white lamp shining through a jar of coloured water. Absorbed colours appear as dips.',
    'Record the calibration: keep the three pixel positions in a text file with the date. If the camera moves, re-calibrate with the CFL before trusting any wavelength.'
  ],
  code: [{ name: 'Spectrum extraction and calibration', lang: 'python', filename: 'spectrum.py', content:
`# spectrum.py — turn a photo of the spectrum into intensity vs wavelength
# usage: python spectrum.py photo.jpg 412 588 690
# (the three numbers are pixel columns of the 436, 546 and 611 nm CFL lines)
import sys
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt

CAL_NM = np.array([436.0, 546.0, 611.0])   # Hg 436, Hg 546, Eu 611 nm in a CFL

def load_profile(path, band=(0.4, 0.6)):
    img = np.asarray(Image.open(path).convert('L'), dtype=float)
    h = img.shape[0]
    rows = img[int(h * band[0]):int(h * band[1]), :]
    return rows.mean(axis=0)              # average the middle 20 % of rows

def calibrate(px):
    # least-squares straight line: wavelength = a * pixel + b
    a, b = np.polyfit(px, CAL_NM, 1)
    return a, b

if __name__ == '__main__':
    path = sys.argv[1]
    px = np.array([float(x) for x in sys.argv[2:5]])
    a, b = calibrate(px)
    profile = load_profile(path)
    nm = a * np.arange(profile.size) + b
    resid = CAL_NM - (a * px + b)
    print(f'nm/pixel = {a:.3f}, offset = {b:.1f} nm, residuals = {resid.round(1)} nm')
    peak = nm[profile.argmax()]
    print(f'brightest wavelength ~ {peak:.0f} nm')
    plt.plot(nm, profile)
    plt.xlabel('wavelength (nm)'); plt.ylabel('intensity (a.u.)')
    plt.xlim(380, 720); plt.title(path)
    plt.savefig('spectrum.png', dpi=150)
    print('saved spectrum.png')` }],
  cad: [
    { file: 'spectrometer-body.scad', kind: 'scad', description: '3D-printable tube body, lid and grating holder (OpenSCAD source, exports to STL in one click).' },
    { file: 'spectrometer-cardboard-template.svg', kind: 'svg', description: 'A3 cut-and-fold template for the cardboard body with the slit, grating and camera windows placed.' }
  ],
  safety: [s('Razor blades', 'Handle blades by the blunt edge; tape the blades in place immediately; an adult cuts for students under 13.'), s('Bright light sources', 'Never point the slit at the Sun or a laser. Sky spectra are taken from blue sky, not the solar disc.'), s('CFL breakage', 'CFLs contain a few milligrams of mercury. Do not use a cracked lamp; ventilate and sweep up (do not vacuum) if one breaks.')],
  accessibility: { lowVision: 'The Python script prints peak wavelengths and calibration numbers as text, so results can be read by a screen reader; increase font sizes in the plot with plt.rcParams.', motor: 'The cardboard version needs no fine assembly beyond taping; the 3D-printed body snaps together. A phone on a small tripod replaces hand-holding.', hearing: 'No audio is used anywhere in the build.', textOnly: 'The measured spectrum can be exported as a CSV of wavelength, intensity pairs and described as "peaks at 436, 546, 611 nm".' },
  versions: [v('1.0.0', '2026-02-11', 'Initial release with 3D-printed body and webcam capture.'), v('1.1.0', '2026-04-03', 'Added A3 cardboard template and CD grating instructions; CFL calibration lines corrected to 436/546/611 nm.', 'r.iyer'), v('1.1.1', '2026-07-19', 'spectrum.py: average middle rows instead of a single row; print residuals.')],
  tags: ['optics', 'diffraction', 'spectroscopy', 'calibration', 'image analysis', 'cd grating']
},
{
  id: 'pendulum-period-rig', title: 'Pendulum period rig (measure g)',
  description: 'A string, a nut and a phone stopwatch are enough to measure the acceleration due to gravity to within a few percent. You time ten swings at five different lengths, plot T² against L, and the slope gives g = 4π²/slope. The included script does the straight-line fit and reports the uncertainty.',
  difficulty: 'Beginner', domains: ['Physics', 'Mathematics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: [],
  components: [c('string-cotton'), c('steel-nut-m10'), c('phone-stopwatch'), c('measuring-tape'), c('cardboard-sheet', 1, false, 'Angle guide so every release is at the same small angle'), c('android-phone-pydroid', 1, false, 'For running the fit script')],
  tools: ['Scissors', 'A door frame, table edge or hook to hang from', 'Pen and paper'],
  steps: [
    'Tie the nut to one end of the string. Fix the other end so the pivot point is sharp: pinch the string between two coins taped to a table edge, or tie it around a pencil clamped in a drawer.',
    'Measure the length L from the pivot to the centre of the nut with the tape. Start with about 1.0 m.',
    'Cut a cardboard angle guide (a 15° wedge) and tape it beside the pivot so every release starts from the same small angle. Larger angles make the period longer than the simple formula predicts.',
    'Pull the nut aside to the guide, release without pushing, and start the stopwatch as it passes the lowest point. Count ten complete swings and stop the watch at the tenth pass through the lowest point. Divide by 10.',
    'Repeat the timing three times at this length and take the mean. Then shorten the string to about 0.8, 0.6, 0.4 and 0.2 m and repeat.',
    'Enter your (L, T) pairs into pendulum_fit.py. It plots T² against L, fits a straight line through the origin and prints g with its standard error.',
    'Compare with 9.79 m/s² (typical for India). Discuss why your value differs: reaction time, angle, string stretch, the nut not being a point mass.'
  ],
  code: [{ name: 'T² vs L fit', lang: 'python', filename: 'pendulum_fit.py', content:
`# pendulum_fit.py — estimate g from pendulum length/period pairs
# Works in Pydroid 3 on a phone (numpy is pre-installed there).
import numpy as np

# length in metres, period in seconds (mean of 3 runs of 10 swings / 10)
L = np.array([1.00, 0.80, 0.60, 0.40, 0.20])
T = np.array([2.01, 1.80, 1.56, 1.27, 0.90])

T2 = T ** 2
# T^2 = (4 pi^2 / g) * L  -> straight line through the origin
slope = (L * T2).sum() / (L * L).sum()
resid = T2 - slope * L
n = len(L)
slope_err = np.sqrt((resid ** 2).sum() / (n - 1) / (L * L).sum())
g = 4 * np.pi ** 2 / slope
g_err = g * slope_err / slope
print(f'slope = {slope:.4f} +/- {slope_err:.4f} s^2/m')
print(f'g = {g:.2f} +/- {g_err:.2f} m/s^2')
for l, t, r in zip(L, T, resid):
    print(f'L={l:.2f} m  T={t:.2f} s  residual={r:+.3f} s^2')` }],
  cad: [],
  safety: [s('Swinging mass', 'Keep faces away from the swing plane; use a nut, not a heavy stone, at head height.'), s('Climbing to fix the pivot', 'Hang from a table edge or door frame reachable from the floor.')],
  accessibility: { lowVision: 'Count swings by sound: tape a piece of card so the nut brushes it at the lowest point, giving an audible tick each pass. Phone stopwatch apps read out time.', motor: 'A second student can operate the stopwatch; releasing from a cardboard notch needs no fine control.', hearing: 'The method is entirely visual; counting is by sight.', textOnly: 'Results are a table of L and T values and a single number g with uncertainty.' },
  versions: [v('1.0.0', '2026-01-20', 'First version.'), v('1.1.0', '2026-05-02', 'Added angle guide and uncertainty calculation to the script.', 'm.kaur')],
  tags: ['gravity', 'oscillation', 'measurement', 'uncertainty', 'no electronics']
},
{
  id: 'homopolar-motor', title: 'Homopolar motor',
  description: 'The simplest electric motor there is: a battery, a neodymium magnet and a bent piece of copper wire that spins as soon as it touches both terminals. It demonstrates the Lorentz force on a current-carrying conductor and takes ten minutes to build. Variations let students test how wire shape, magnet stacking and battery type change the speed.',
  difficulty: 'Beginner', domains: ['Physics', 'Electronics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 30,
  requires: [],
  components: [c('battery-d'), c('neodymium-magnet', 2), c('scrap-wire', 1, true, 'About 20 cm of bare copper wire, 1–1.5 mm; strip an old cable')],
  tools: ['Pliers', 'Wire stripper or knife (adult)'],
  steps: [
    'Stack the two magnets and stand the battery on them, negative terminal down. The magnets must be strong enough to hold the battery upright when nudged.',
    'Strip 20 cm of copper wire. Bend it into a symmetric shape: a point at the top that rests in the dimple of the positive terminal, two arms going down either side of the battery, and two inward bends at the bottom that just touch the magnet rim.',
    'Adjust until the top point sits in the terminal dimple and both bottom ends lightly brush the magnet. If the wire grips the magnet tightly it stalls; if it does not touch, no current flows.',
    'Let go. The wire should start spinning. If it does not, give it a gentle push in either direction and check that both bottom ends touch the magnet.',
    'Flip the magnet stack over (or the battery) and observe that the direction of spin reverses. Write down why: the force direction depends on both current direction and field direction.',
    'Experiment: add a third magnet, use an AA instead of a D cell, or make a heart-shaped wire. Time ten rotations with the phone to compare speeds.',
    'Do not leave the wire on the battery when not spinning: it is a near short-circuit and the battery and wire get hot within a minute.'
  ],
  code: [],
  cad: [],
  safety: [s('Short circuit heating', 'The wire carries several amps. Remove it after 30–60 s runs; the battery and wire get hot. Never use a lithium cell.'), s('Neodymium magnets', 'Strong magnets pinch skin and shatter if they snap together. Keep away from phones, cards and pacemakers; keep away from young children (swallowing hazard).'), s('Wire ends', 'File or bend over sharp cut ends.')],
  accessibility: { lowVision: 'Spinning can be felt as vibration through the table and heard as a faint hum; the wire can be shaped by touch.', motor: 'Pre-bent wire shapes can be provided; a pill bottle holds the battery upright while the wire is placed.', hearing: 'Entirely visual/tactile.', textOnly: 'Describe: current flows through the wire; the field from the magnet pushes on it sideways; reversing either reverses the spin.' },
  versions: [v('1.0.0', '2026-01-12', 'First version.'), v('1.0.1', '2026-03-08', 'Added heat warning and lithium-cell exclusion after a reported hot-battery incident.', 'moderation')],
  tags: ['lorentz force', 'motor', 'magnetism', 'electricity', 'no electronics', 'ten minutes']
},
{
  id: 'cardboard-theodolite', title: 'Cardboard theodolite (measure heights and distances)',
  description: 'A protractor, a straw and a plumb line make an instrument for measuring elevation angles. Pace out a baseline, sight the top of a building or tree, and trigonometry gives its height; sight the same object from two points and you can find a distance you cannot walk. The printable protractor in the CAD tab is marked to 1°.',
  difficulty: 'Beginner', domains: ['Mathematics', 'Physics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 45,
  requires: ['sharp'],
  components: [c('printed-protractor'), c('cardboard-sheet'), c('straw'), c('string-cotton'), c('steel-nut-m10'), c('pushpins', 1, false, 'A pin as the pivot; a paper fastener also works'), c('measuring-tape')],
  tools: ['Printer (any) for the protractor', 'Scissors', 'Glue'],
  steps: [
    'Print theodolite-protractor.svg at 100% (check that the baseline measures 200 mm) and glue it to a cardboard rectangle. Cut it out leaving a margin.',
    'Push a pin through the centre mark from the back and mount the straw on it so the straw pivots around the centre and lies along the baseline when horizontal.',
    'Tie the nut to 20 cm of thread and hang it from the same pin. When the baseline is horizontal the thread should hang across the 90° mark.',
    'To measure a height: stand a measured distance d from the object (pace it or use the tape). Sight the top of the object through the straw and read where the thread crosses the scale. Elevation = |reading − 90|.',
    'Measure your eye height h. The object height is d × tan(elevation) + h. Use the theodolite.py script or a calculator.',
    'Repeat from a different distance and compare: two answers within 5 % of each other means your angle reading is trustworthy.',
    'For an unreachable distance (across a river or road): sight the object from two points a known baseline b apart along a line, record both elevations, and solve the two-angle problem in the script.'
  ],
  code: [{ name: 'Height and distance from angles', lang: 'python', filename: 'theodolite.py', content:
`# theodolite.py — height from one elevation, or distance from two
import math

def height(distance_m, elevation_deg, eye_height_m=1.5):
    return distance_m * math.tan(math.radians(elevation_deg)) + eye_height_m

def distance_two_angles(baseline_m, near_deg, far_deg):
    # Observer moves baseline_m straight back; near_deg > far_deg.
    # tan(near) = H/x, tan(far) = H/(x+b)  ->  x = b*tan(far)/(tan(near)-tan(far))
    tn, tf = math.tan(math.radians(near_deg)), math.tan(math.radians(far_deg))
    x = baseline_m * tf / (tn - tf)
    H = x * tn
    return x, H

if __name__ == '__main__':
    print('height:', round(height(20, 32), 2), 'm')          # 20 m away, 32 degrees
    x, H = distance_two_angles(10, 40, 28)
    print(f'distance to base: {x:.1f} m, height above eye: {H:.1f} m')` }],
  cad: [{ file: 'theodolite-protractor.svg', kind: 'svg', description: 'A5 printable 180° protractor with 1° ticks and a centre pivot mark.' }],
  safety: [s('Sighting the Sun', 'Never sight the Sun through the straw. Measure buildings, trees, poles and the Moon only.'), s('Roads', 'Stay on the footpath when measuring across a road.')],
  accessibility: { lowVision: 'The thread can be replaced by a pointer that clicks into notches cut every 5°, making the reading tactile. Large-print protractor: scale the SVG to A4.', motor: 'Mount the theodolite on a chair back or tripod so it does not need to be hand-held.', hearing: 'No sound used.', textOnly: 'Output is an angle in degrees and a height in metres.' },
  versions: [v('1.0.0', '2026-02-01', 'First version.'), v('1.1.0', '2026-06-14', 'Added two-angle distance method and 1° protractor SVG.', 's.menon')],
  tags: ['trigonometry', 'surveying', 'angles', 'no electronics', 'outdoor']
},
{
  id: 'solar-oven', title: 'Cardboard box solar oven',
  description: 'A pizza box lined with foil and glazed with cling film reaches 60–90 °C in Indian afternoon sun, enough to melt chocolate, warm rotis or pasteurise water in a dark bottle. Students log the temperature every five minutes and compare designs: reflector angle, black interior, double glazing. This is a thermodynamics lab disguised as cooking.',
  difficulty: 'Beginner', domains: ['Physics', 'Environmental science'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 90,
  requires: ['sharp'],
  components: [c('cardboard-salvaged', 1, true, 'A pizza box or shoebox with a lid'), c('aluminium-foil'), c('cling-film'), c('black-chart-paper'), c('thermometer-lab'), c('electrical-tape'), c('wooden-dowel', 1, false, 'Prop for the reflector flap')],
  tools: ['Knife or scissors', 'Glue stick', 'Ruler'],
  steps: [
    'Cut a flap in the lid of the box, leaving about 3 cm of border on three sides and a hinge on the fourth. Glue foil to the underside of the flap, shiny side out, as smooth as possible: this is your reflector.',
    'Glue foil to the inside walls of the box and black paper to the floor. The black floor absorbs; the foil walls reflect stray light down to it.',
    'Stretch cling film across the opening under the flap and tape it on all sides. Add a second layer with a 1 cm air gap if you can: double glazing cuts heat loss noticeably.',
    'Put the thermometer inside so the bulb is in the air above the black floor, readable through the film. Close the lid and prop the reflector with the dowel so it bounces sunlight into the window.',
    'Place the oven in direct sun around 11:00–14:00, facing the Sun. Record the temperature every 5 minutes for 40 minutes; re-aim every 15 minutes.',
    'Plot temperature against time. It should rise fast then level off: the plateau is where heat gained equals heat lost. Try opening the lid for 10 s to see the drop.',
    'Compare variants on the same day: no reflector, single glazing, no black floor. Keep everything else identical so only one variable changes.'
  ],
  code: [],
  cad: [],
  safety: [s('Hot surfaces', 'The interior and any metal inside can exceed 80 °C. Open with the lid edge; use a cloth for anything inside.'), s('Reflected sunlight', 'Do not look into the reflector; sit beside the oven, not in front of it.'), s('Food', 'Only heat pre-cooked food; the oven does not reach safe cooking temperatures for raw meat.')],
  accessibility: { lowVision: 'Use a talking thermometer or a DS18B20 probe with an Arduino reading values aloud through Serial; the reflector can be aligned by feeling where the warm patch falls.', motor: 'Pre-cut boxes; propping with a dowel needs no fine motor control.', hearing: 'No sound needed.', textOnly: 'Data is a time/temperature table; the finding is a plateau temperature.' },
  versions: [v('1.0.0', '2026-03-05', 'First version.'), v('1.0.1', '2026-05-22', 'Added double glazing note and food-safety line.')],
  tags: ['thermodynamics', 'solar', 'energy', 'insulation', 'no electronics', 'outdoor']
},
{
  id: 'electromagnet-crane', title: 'Electromagnet crane',
  description: 'Wind wire around an iron bolt, power it from AA cells through a switch, and you have a crane that picks up paper clips and drops them on command. Students count turns and measure how many clips each configuration lifts, discovering that lifting force grows with turns and current. An optional Arduino version controls the magnet with a transistor and adds a servo boom.',
  difficulty: 'Beginner', domains: ['Physics', 'Electronics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 90,
  requires: [],
  components: [c('iron-bolt-m8'), c('enamel-wire-100g'), c('battery-holder-4aa'), c('battery-aa', 4), c('pushbutton', 1, true, 'Or any switch; a paper-clip switch works'), c('cardboard-sheet', 2), c('string-cotton'), c('thread-spool-pulley'), c('electrical-tape')],
  tools: ['Sandpaper (to strip enamel)', 'Scissors', 'Hot glue or PVA'],
  steps: [
    'Wind 100 turns of enamelled wire tightly around the bolt, all in the same direction, leaving 15 cm free at each end. Tape the coil so it does not unwind. Count as you go and write the number on tape.',
    'Sand 1 cm of enamel off each wire end until bright copper shows all round: the enamel is an insulator and is the number-one reason these builds "do not work".',
    'Connect one wire to the battery holder, the other to the switch, and the switch back to the holder. Press the switch and touch the bolt head to a pile of paper clips.',
    'Count how many clips lift. Release the switch: they should drop. If some stay, the bolt has been magnetised; tap it on the table.',
    'Build the crane from cardboard: a base, an upright and a boom. Run the string over the spool pulley at the boom tip so the magnet can be raised and lowered by hand.',
    'Experiment: wind a second coil with 200 turns and compare clips lifted; try 2 cells vs 4 cells; try a steel nail vs the bolt. Tabulate turns × current against clips lifted.',
    'Optional: drive the coil through a TIP120 transistor from an Arduino pin and add a servo to swing the boom; the sketch below toggles the magnet with a button.'
  ],
  code: [{ name: 'Arduino magnet + boom control (optional)', lang: 'cpp', filename: 'crane.ino', content:
`// crane.ino — toggle electromagnet with a button, sweep boom with a servo
// Coil through TIP120: base <- 1k <- D9, collector -> coil -> +6V, emitter -> GND.
// Put a 1N4007 diode across the coil (stripe to +) to absorb the switch-off spike.
#include <Servo.h>
const int MAGNET = 9, BUTTON = 2, POT = A0;
Servo boom;
bool on = false, lastBtn = HIGH;

void setup() {
  pinMode(MAGNET, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  boom.attach(6);
}

void loop() {
  bool btn = digitalRead(BUTTON);
  if (lastBtn == HIGH && btn == LOW) {   // falling edge = press
    on = !on;
    digitalWrite(MAGNET, on ? HIGH : LOW);
    delay(30);                            // debounce
  }
  lastBtn = btn;
  int angle = map(analogRead(POT), 0, 1023, 20, 160);
  boom.write(angle);
  delay(15);
}` }],
  cad: [],
  safety: [s('Coil heating', 'A 100-turn coil on 6 V draws 1–2 A and warms quickly. Hold the button only while lifting; let the coil cool between trials.'), s('Sharp bolt end', 'File the thread end or cover it with tape.')],
  accessibility: { lowVision: 'Clips lifted can be counted by touch after each trial; the switch gives a tactile click.', motor: 'Winding can be shared: one student turns the bolt in a hand drill (adult) while another guides the wire. A large rocker switch replaces the small button.', hearing: 'No sound needed.', textOnly: 'Result: table of turns, cells, clips lifted.' },
  versions: [v('1.0.0', '2026-01-30', 'First version.'), v('1.1.0', '2026-04-27', 'Added optional Arduino control and flyback diode note.', 'a.bose')],
  tags: ['electromagnetism', 'coil', 'current', 'magnetism', 'mechanics']
},
{
  id: 'wind-turbine-model', title: 'PET-bottle wind turbine with LED output',
  description: 'Three blades cut from a soft-drink bottle drive a small DC motor used as a generator. A table fan provides the wind, a multimeter or an LED shows the output, and students test blade pitch, blade count and fan distance to find what maximises voltage. The template in the CAD tab gives balanced blades.',
  difficulty: 'Intermediate', domains: ['Physics', 'Environmental science', 'Robotics'], ageMin: 13, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 120,
  requires: ['sharp', 'heat'],
  components: [c('pet-bottle', 2), c('dc-motor-3v'), c('bearing-608', 1, false, 'Smoother yaw pivot for the tower head'), c('led-5mm', 1), c('pvc-pipe-20mm'), c('cardboard-sheet', 2), c('glue-hot'), c('scrap-wire'), c('bottle-caps')],
  tools: ['Scissors / hobby knife', 'Hot glue gun', 'Table fan', 'Multimeter (any; school lab)'],
  steps: [
    'Print wind-turbine-blade.svg at 100% and cut three blades from the curved side wall of a 2 L bottle. The natural curve of the bottle gives the blade its camber.',
    'Cut the hub disc from the flat base of the second bottle (or thick card). Glue the blade roots to the hub 120° apart with each blade pitched 15–20° to the hub plane. All blades must lean the same way.',
    'Press a bottle cap onto the motor shaft (drill or melt a 2 mm hole) and hot-glue the hub to the cap. Spin it by hand: if it wobbles, trim the heaviest tip until it runs true.',
    'Build the tower: a 30 cm PVC pipe glued into a cardboard base with a cardboard head that holds the motor horizontally. Add the 608 bearing between head and pipe if you want the head to yaw into the wind.',
    'Connect the motor terminals to the LED with a 220 Ω resistor in series (either polarity; try both). Place the turbine 30 cm in front of the fan on high.',
    'Measure the open-circuit voltage with a multimeter at three fan distances. Then change one variable at a time: blade pitch (10°, 20°, 30°), two blades vs three, and note the voltage each time.',
    'Plot voltage against distance and against pitch. The best pitch is usually around 15–20°; explain in terms of the angle of attack and drag.',
    'Extension: replace the LED with a 1000 µF capacitor and time how long the LED stays lit after the fan is switched off.'
  ],
  code: [],
  cad: [{ file: 'wind-turbine-blade.svg', kind: 'svg', description: 'A4 template: three tapered blades, hub disc with 120° slots, optional tail vane.' }],
  safety: [s('Cutting PET', 'PET edges are sharp. Cut with scissors after starting the cut with a knife (adult); sand or tape the edges.'), s('Hot glue', 'Glue-gun tips reach 180 °C. Keep a bowl of cold water nearby for burns.'), s('Spinning rotor', 'Keep fingers and hair clear of the rotor while the fan is on; blades can fly off if poorly glued — test at low fan speed first.')],
  accessibility: { lowVision: 'Use a buzzer instead of an LED to hear output; the multimeter can be replaced by a talking multimeter app with a USB meter. Blades can be traced from a thick-card template by touch.', motor: 'Pre-cut blades; the hub can be assembled in a jig cut from cardboard with three 120° slots.', hearing: 'Visual LED output; no sound needed.', textOnly: 'Result: voltage vs distance and vs pitch tables.' },
  versions: [v('1.0.0', '2026-02-18', 'First version.'), v('1.1.0', '2026-06-01', 'Blade template redrawn with 25 mm root for stiffer blades; added capacitor extension.', 'r.iyer')],
  tags: ['renewable energy', 'generator', 'aerodynamics', 'upcycling', 'measurement']
},
// ---------------------------------------------------------------- CHEMISTRY
{
  id: 'electrolysis-of-water', title: 'Electrolysis of water with pencil electrodes',
  description: 'Two graphite pencil leads, a 9 V battery and a little Epsom salt split water into hydrogen and oxygen in a jar. Collect the gases in inverted test tubes (or syringes) and you will see the 2:1 volume ratio that gives water its formula. Adding cabbage indicator shows the pH changing at each electrode.',
  difficulty: 'Beginner', domains: ['Chemistry', 'Physics'], ageMin: 13, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: ['chemicals'],
  components: [c('pencil-graphite'), c('battery-9v'), c('battery-snap-9v'), c('epsom-salt'), c('glass-jar'), c('crocodile-clips', 1, false, 'Makes the connections reliable; twisted wire works'), c('cabbage-indicator-self-made', 1, false, 'Shows pH change at the electrodes'), c('cardboard-sheet', 1, true, 'Lid to hold the electrodes')],
  tools: ['Two small test tubes or 10 ml syringes with the plunger removed', 'Teaspoon', 'Tap water'],
  steps: [
    'Dissolve a teaspoon of Epsom salt (MgSO₄) in a jar of tap water. Pure water barely conducts; the salt provides ions without producing chlorine (never use table salt for this).',
    'Push two pencil leads through a cardboard lid 3 cm apart so they dip into the water. Clip the battery snap wires to the tops: red to one lead (anode), black to the other (cathode).',
    'Connect the 9 V battery. Within seconds bubbles form on both leads. The cathode (negative) bubbles about twice as fast: that is hydrogen.',
    'Fill two test tubes with the solution, cover with a thumb, invert into the jar and lower one over each electrode. Gas collects at the top and pushes the liquid down.',
    'After 10 minutes, mark the gas levels. Measure both columns: the hydrogen column should be close to twice the oxygen column (2H₂O → 2H₂ + O₂).',
    'Add a few ml of red cabbage indicator: the cathode region turns blue-green (hydroxide ions, alkaline) and the anode region turns pink (hydrogen ions, acidic).',
    'Disconnect the battery. Note the temperature of the battery and how long it lasted: it is doing real chemical work. Discuss why the ratio is not exactly 2:1 (oxygen is slightly soluble; some graphite oxidises to CO₂).'
  ],
  code: [],
  cad: [],
  safety: [s('Hydrogen gas', 'The volumes collected are tiny, but never bring a flame near the jar. Do the "pop test" only with a teacher and only with a few ml of gas.'), s('Electrolyte choice', 'Do NOT use table salt: it produces chlorine gas at the anode. Epsom salt or baking soda only.'), s('Battery', '9 V is safe to touch, but do not short the terminals; the battery gets hot.')],
  accessibility: { lowVision: 'Bubbling is audible if you hold the jar to your ear; gas volume can be measured by feeling the liquid level with a fingertip inside the tube after removing it.', motor: 'Use a wide jar and pre-mounted electrodes on the lid so nothing needs holding steady.', hearing: 'Fully visual.', textOnly: 'Result: two gas volumes in a ~2:1 ratio and colour changes described as "blue at the negative electrode, pink at the positive".' },
  versions: [v('1.0.0', '2026-02-06', 'First version.'), v('1.0.1', '2026-03-30', 'Strong warning against table salt added after a reported chlorine smell.', 'moderation'), v('1.1.0', '2026-07-08', 'Added cabbage indicator extension.')],
  tags: ['electrochemistry', 'gases', 'stoichiometry', 'ions', 'redox']
},
{
  id: 'red-cabbage-ph-indicator', title: 'Red cabbage pH indicator and colour scale',
  description: 'Anthocyanin from red cabbage changes colour across the whole pH range: red in strong acid, purple when neutral, green and yellow in strong base. Boil half a cabbage, make a reference scale with vinegar, baking soda and washing soda, then measure the pH of household liquids to about one unit. The indicator is used by other OPENLAB projects as a free pH sensor.',
  difficulty: 'Beginner', domains: ['Chemistry'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: ['chemicals', 'heat'],
  components: [c('red-cabbage'), c('vinegar'), c('baking-soda'), c('washing-soda', 1, false, 'Gives the pH 11 reference; without it the scale stops at 8.5'), c('lemon'), c('ice-tray'), c('dropper'), c('coffee-filter'), c('glass-jar')],
  tools: ['Saucepan and stove (adult)', 'Knife (adult)', 'Labels or masking tape'],
  steps: [
    'Chop half a red cabbage, cover with about 500 ml of water in a pan, and simmer for 10 minutes. The water turns deep purple. Let it cool and filter it through a coffee filter into a jar. This is your indicator; it keeps for a week in a fridge.',
    'Make the reference scale in an ice tray: put a teaspoon of indicator in each of six wells. Add to them, in order: a few drops of vinegar (pH ~3), lemon juice (pH ~2), nothing (pH ~7, tap water), a pinch of baking soda (pH ~8.5), a pinch of washing soda (pH ~11), and a drop of vinegar plus a pinch of baking soda (fizzes; ends near 5).',
    'Photograph the tray under daylight beside a white sheet. Label each well with its pH. This photo is your colour chart: red (2) → pink (4) → purple (7) → blue (8) → green (10) → yellow (12+).',
    'Now test unknowns: milk, soap water, cola, shampoo, rain water, soil shaken in water. Put a teaspoon of indicator in a well and add drops of the unknown until the colour stops changing.',
    'Match against the chart and record the estimated pH. Rank the liquids from most acidic to most basic.',
    'Make indicator paper: soak strips of coffee filter in the indicator, dry them on a plate, and store in a sealed bag. A drop of any liquid on a strip gives an instant reading.',
    'Discuss limitations: the colour also depends on concentration and lighting; compare with a universal indicator strip if the school has one.'
  ],
  code: [],
  cad: [],
  safety: [s('Hot liquid', 'An adult handles the stove and pours the hot liquid.'), s('Washing soda', 'Sodium carbonate is irritating to eyes and skin; use a pinch, wash hands, do not rub eyes.'), s('Do not taste', 'Nothing in this activity is drunk, even though the ingredients are foods.')],
  accessibility: { lowVision: 'A phone colour-identifier app (many are free) names the colour of each well aloud; pair with a sighted partner for the reference photo. Wells can be identified by position in the tray.', motor: 'Use a wide-mouth dropper or a syringe; a muffin tray instead of an ice tray gives bigger targets.', hearing: 'Fully visual.', textOnly: 'Result: a list of liquids with estimated pH and colour names.' },
  versions: [v('1.0.0', '2026-01-15', 'First version.'), v('1.1.0', '2026-04-11', 'Added indicator-paper step and colour/pH mapping from measured samples.', 'p.nair')],
  tags: ['acids and bases', 'ph', 'anthocyanin', 'kitchen chemistry', 'no electronics']
},
{
  id: 'coin-battery', title: 'Zinc–copper coin battery',
  description: 'A stack of zinc washers, copper pieces and vinegar-soaked paper is a voltaic pile. Each cell gives about 0.7–0.9 V; five in series light an LED. Students measure voltage per cell, see how it drops under load, and discover why the "battery" dies as the electrolyte dries.',
  difficulty: 'Beginner', domains: ['Chemistry', 'Electronics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 45,
  requires: ['chemicals'],
  components: [c('zinc-washer', 6), c('copper-washer', 6), c('vinegar'), c('salt'), c('paper-towel'), c('led-5mm'), c('crocodile-clips', 1, false, 'Or press wire ends against the stack'), c('electrical-tape')],
  tools: ['Scissors', 'Small dish', 'Multimeter (school lab) — optional but recommended'],
  steps: [
    'Cut twelve paper-towel discs slightly smaller than the washers. Soak them in vinegar with a pinch of salt dissolved in it (the salt lowers resistance).',
    'Build one cell: zinc washer, soaked paper, copper piece. Measure the voltage across it with a multimeter or touch the LED legs to it (it will not light: one cell is too weak).',
    'Stack cells in the same order: zinc, paper, copper, zinc, paper, copper… never let a zinc touch the next zinc. Blot the paper so vinegar does not bridge between cells.',
    'After five cells, press the LED\'s long leg (anode) to the copper end and the short leg to the zinc end. It should glow dimly; a red LED (needs ~1.8 V) works best.',
    'Measure the stack voltage with no load and then with the LED connected. The drop is due to the pile\'s high internal resistance.',
    'Time how long the LED stays lit. Then re-soak the paper: it recovers, showing the electrolyte, not the metals, was the limit.',
    'Try lemon juice or cola as the electrolyte and compare voltages; try steel washers instead of zinc and see why the voltage changes (different electrode potentials).'
  ],
  code: [],
  cad: [],
  safety: [s('Vinegar in eyes', 'Rinse with water; it stings but is harmless. Wash hands after handling zinc.'), s('Do not use coins', 'Defacing currency is an offence in India; use washers and copper scrap.')],
  accessibility: { lowVision: 'A talking multimeter or buzzer instead of an LED gives audible output; the stacking order zinc/paper/copper can be felt (zinc is dull and thicker, copper smooth).', motor: 'Use large M12 washers and a pill-bottle as a stacking guide.', hearing: 'Visual output.', textOnly: 'Result: voltage per cell (~0.8 V), stack voltage, and time lit.' },
  versions: [v('1.0.0', '2026-01-25', 'First version.'), v('1.0.1', '2026-02-14', 'Replaced coins with washers after a note about the Coinage Act.', 'moderation')],
  tags: ['electrochemistry', 'voltaic pile', 'batteries', 'no electronics', 'kitchen chemistry']
},
{
  id: 'water-filtration-column', title: 'Water filtration column (bottle)',
  description: 'A cut PET bottle packed with cotton, charcoal, sand and gravel turns muddy pond water visibly clear and removes odour. Students measure turbidity before and after with a phone camera and a printed test card, and learn what a filter does and does not remove (it does not make water safe to drink). Pairs well with the cabbage indicator for a pH check.',
  difficulty: 'Beginner', domains: ['Environmental science', 'Chemistry'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: ['sharp'],
  components: [c('pet-bottle'), c('cotton-wool'), c('activated-charcoal'), c('sand-fine'), c('gravel'), c('coffee-filter', 1, false, 'Final polish layer; improves clarity noticeably'), c('glass-jar', 2)],
  tools: ['Scissors or knife (adult)', 'Measuring cup', 'Phone camera'],
  steps: [
    'Cut the bottle in half. Invert the top half (with the cap removed) into the bottom half so it forms a funnel over a collecting cup.',
    'Pack layers from the neck up: a plug of cotton wool (2 cm), activated charcoal (3 cm), fine sand (5 cm), then gravel (3 cm). Rinse each layer with clean water first so the filter does not release dust.',
    'Make a test sample: a jar of water stirred with two spoons of garden soil and a little cooking oil. Pour half into a second jar as the "before" reference.',
    'Photograph the "before" jar in front of a printed black-and-white test card (a page of text). Note how much text you can read through it.',
    'Pour the other half slowly through the filter and collect the output. It takes a few minutes; do not press or stir the layers.',
    'Photograph the "after" jar the same way. Compare clarity, colour and smell. Repeat the pass a second time and see whether it improves further.',
    'Test pH of both with cabbage indicator. Write a one-paragraph conclusion: what changed, what did not, and why this water is still not safe to drink (bacteria, dissolved salts).'
  ],
  code: [],
  cad: [],
  safety: [s('Not drinking water', 'Filtered output is NOT potable. Label the cup "do not drink".'), s('Cutting PET', 'Adult cuts the bottle; tape the cut edge.'), s('Muddy water', 'Wash hands after handling pond/soil water.')],
  accessibility: { lowVision: 'Turbidity can be judged by shining a torch through the jar and feeling the warmth… better: use a phone light-meter app on the far side of the jar and compare lux readings before and after.', motor: 'Use a wide bottle and a funnel stand made from a cardboard box so nothing needs holding.', hearing: 'Fully visual.', textOnly: 'Result: before/after lux readings or "readable lines of text" counts.' },
  versions: [v('1.0.0', '2026-02-20', 'First version.'), v('1.1.0', '2026-05-15', 'Added the light-meter turbidity method and the explicit not-potable warning.', 'p.nair')],
  tags: ['water', 'filtration', 'adsorption', 'turbidity', 'upcycling', 'no electronics']
},
// ---------------------------------------------------------------- BIOLOGY
{
  id: 'paper-microscope', title: 'Paper microscope with a glass bead lens',
  description: 'A 2.5 mm glass ball lens has a focal length of about 1.7 mm, giving roughly 140× magnification when held close to the eye. Sandwich it in card with a sliding stage and a phone torch and you can see onion cells, cheek cells and pond organisms. The design follows the Foldscope idea using stationery-shop materials.',
  difficulty: 'Intermediate', domains: ['Biology', 'Physics'], ageMin: 13, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 90,
  requires: ['sharp'],
  components: [c('glass-bead-lens'), c('cardboard-sheet', 1, true, 'Thin card (cereal box) is better than corrugated'), c('cling-film', 1, true, 'Slide cover; or clear tape'), c('electrical-tape'), c('phone-camera', 1, false, 'Torch for illumination and camera for recording'), c('magnifier-10x', 1, false, 'For finding the sample before switching to the bead')],
  tools: ['Hobby knife (adult) or a hole punch', 'Ruler', 'Clear tape'],
  steps: [
    'Cut two card strips 30 × 120 mm. Punch a 2 mm hole in the centre of each; the bead must sit in a hole slightly smaller than itself. Sandwich the bead between the strips so it is held in both holes, and tape the strips together at the ends.',
    'Make the stage: a third strip with a 10 mm window, held against the lens strip by a folded card sleeve so it can slide sideways and up/down. This is your focusing mechanism.',
    'Make a slide: a piece of clear tape stuck to a card frame with a window. Peel a thin layer from an onion (the skin between the layers), lay it on the tape, add a drop of water and cover with cling film.',
    'Insert the slide in the stage. Hold the lens up to your eye (or your phone camera lens, pressed flat) and a torch behind the slide. Slide the stage slowly until the cells snap into focus; the depth of focus is tiny.',
    'Photograph by pressing the phone camera against the lens hole and using digital zoom; tape the phone to a book for stability.',
    'Try cheek cells (scrape gently with a clean spoon), a drop of pond water, a hair, salt crystals and newspaper print. Note that the image is inverted.',
    'Estimate magnification: magnification ≈ 250 mm / focal length; for f = 1.7 mm that is ~150×. Measure a hair (about 0.07 mm) to check the scale of your photos.'
  ],
  code: [],
  cad: [],
  safety: [s('Small glass bead', 'Choking hazard; keep away from young children; store in a labelled container.'), s('Cheek cells', 'Use a clean spoon per person; dispose of slides in the bin after use.'), s('Torch', 'Do not shine the torch directly into the eye; view with the slide in between.')],
  accessibility: { lowVision: 'A phone camera with screen magnification and high-contrast mode can replace the eye at the lens; images can be enlarged on screen and described. Focus by sliding is tactile.', motor: 'Tape the microscope to a book or box and move the slide with a card handle; a phone tripod removes the need to hold anything steady.', hearing: 'Fully visual.', textOnly: 'Describe the onion cells as brick-shaped with a dark dot (nucleus) in each.' },
  versions: [v('1.0.0', '2026-03-02', 'First version.'), v('1.0.1', '2026-04-20', 'Added hair as a scale reference; corrected magnification formula.', 'm.kaur')],
  tags: ['microscopy', 'cells', 'optics', 'lens', 'foldscope']
},
{
  id: 'seed-germination-lab', title: 'Seed germination variables lab',
  description: 'Mung beans germinate in two days, which makes them ideal for a controlled experiment: light vs dark, wet vs damp, warm vs cold, salt water vs fresh. Students grow batches in cups, measure root and shoot length daily with a ruler, and analyse means and spread with the included script. It teaches experimental design before it teaches biology.',
  difficulty: 'Beginner', domains: ['Biology', 'Mathematics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 30,
  requires: [],
  components: [c('seeds-mung'), c('paper-towel'), c('glass-jar', 4, true, 'Any four identical cups'), c('salt'), c('cling-film'), c('measuring-tape', 1, true, 'A ruler is enough'), c('android-phone-pydroid', 1, false, 'For the statistics script')],
  tools: ['Marker for labelling', 'Notebook'],
  steps: [
    'Soak 40 mung seeds overnight. Discard any that float.',
    'Line four cups with folded paper towel and place 10 seeds in each, between the towel and the cup wall so you can see them. Label the cups A–D.',
    'Set the conditions: A = control (tap water, window light, room temperature). B = dark (cover with a box). C = salt (water with 1 teaspoon salt per cup). D = cold (fridge door). Keep the towel damp, not flooded, in all four.',
    'Every day at the same time, measure root and shoot length of every seed in mm and record it in a table: day, cup, seed number, root, shoot.',
    'After 5 days, enter the day-5 numbers into germination_stats.py. It prints the mean, standard deviation and germination percentage for each cup.',
    'Plot mean shoot length per cup as a bar chart with error bars (the script does this). Which variable mattered most? Was the dark cup taller but paler (etiolation)?',
    'Write a fair-test checklist: what you kept the same, what you changed, and one thing you would control better next time (e.g. seed size).'
  ],
  code: [{ name: 'Germination statistics', lang: 'python', filename: 'germination_stats.py', content:
`# germination_stats.py — mean, spread and germination % per condition
import statistics as st

# day-5 shoot length in mm per seed; 0 = did not germinate
data = {
    'A control': [42, 38, 45, 40, 0, 44, 39, 41, 37, 43],
    'B dark':    [55, 60, 0, 58, 52, 61, 57, 0, 54, 59],
    'C salt':    [0, 5, 0, 0, 8, 0, 3, 0, 0, 6],
    'D cold':    [10, 12, 0, 9, 11, 0, 13, 8, 10, 0],
}

print(f"{'condition':<12}{'n germ':>8}{'germ %':>8}{'mean mm':>9}{'sd mm':>8}")
for name, vals in data.items():
    grown = [x for x in vals if x > 0]
    pct = 100 * len(grown) / len(vals)
    mean = st.mean(grown) if grown else 0
    sd = st.stdev(grown) if len(grown) > 1 else 0
    print(f'{name:<12}{len(grown):>8}{pct:>8.0f}{mean:>9.1f}{sd:>8.1f}')

# simple text bar chart (works without matplotlib)
print()
for name, vals in data.items():
    grown = [x for x in vals if x > 0]
    mean = st.mean(grown) if grown else 0
    print(f'{name:<12}' + '#' * int(mean / 2) + f' {mean:.0f}')` }],
  cad: [],
  safety: [s('Mould', 'Wet towel grows mould after a week; discard cups at the end and wash hands.'), s('Fridge', 'Label the cold cup so nobody eats the seeds.')],
  accessibility: { lowVision: 'Measure with a tactile ruler (notched every 5 mm) or by laying the seedling along a string and knotting it; the script prints results as text.', motor: 'Cups can be pre-set; measuring can be done by a partner while the student records.', hearing: 'No sound needed.', textOnly: 'Result: a table of means and germination percentages per condition.' },
  versions: [v('1.0.0', '2026-01-18', 'First version.'), v('1.1.0', '2026-03-25', 'Script rewritten to need only the standard library so it runs on Pydroid without installs.', 's.menon')],
  tags: ['plants', 'experimental design', 'statistics', 'fair test', 'no electronics']
},
{
  id: 'yeast-fermentation-balloon', title: 'Yeast fermentation rate with balloons',
  description: 'Yeast eating sugar makes CO₂, which inflates a balloon on a bottle. Measure the balloon circumference every five minutes at different temperatures or sugar concentrations and you get a respiration-rate curve. It is a cheap, safe introduction to enzymes, gas production and rate of reaction.',
  difficulty: 'Beginner', domains: ['Biology', 'Chemistry'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: [],
  components: [c('yeast-dry'), c('sugar'), c('balloon', 3), c('pet-bottle', 3, true, '500 ml bottles are ideal'), c('string-cotton'), c('measuring-tape'), c('thermometer-lab', 1, false, 'To record the water temperature of each bottle')],
  tools: ['Funnel (or a rolled paper cone)', 'Warm water', 'Timer'],
  steps: [
    'Put one teaspoon of yeast in each of three bottles. Add two teaspoons of sugar to bottles 1 and 2, none to bottle 3 (control).',
    'Fill bottle 1 with 150 ml warm water (~35 °C, hand-hot), bottle 2 with 150 ml cold water, bottle 3 with warm water. Swirl gently.',
    'Immediately stretch a balloon over each neck. Start the timer.',
    'Every 5 minutes, wrap the string around the fattest part of each balloon and measure that length with the tape. Record it. Continue for 40 minutes.',
    'Plot circumference against time for the three bottles. Warm + sugar should rise fastest; no-sugar should barely change.',
    'Convert circumference to approximate volume (V ≈ C³ / 59 for a sphere) and compare final CO₂ volumes.',
    'Extension: repeat with different sugars (jaggery, honey, artificial sweetener) or add a pinch of salt and observe inhibition.'
  ],
  code: [],
  cad: [],
  safety: [s('Pressure', 'Balloons can pop off; do not tie them tightly and keep bottles away from faces.'), s('Warm water', 'Hand-hot only (about 35–40 °C); hotter kills the yeast and can scald.')],
  accessibility: { lowVision: 'Balloon size is measured by string length, which can be compared by touch; a timer app announces intervals.', motor: 'Use wide-neck bottles and pre-stretched balloons.', hearing: 'No sound needed.', textOnly: 'Result: circumference vs time table for three conditions.' },
  versions: [v('1.0.0', '2026-02-25', 'First version.'), v('1.0.1', '2026-06-20', 'Added volume conversion formula and sweetener extension.')],
  tags: ['respiration', 'enzymes', 'rate of reaction', 'gas', 'no electronics']
},
// ---------------------------------------------------------------- ELECTRONICS
{
  id: 'breadboard-555-timer', title: 'Breadboard 555 astable blinker and tone generator',
  description: 'The 555 is the classic first IC. Wire it as an astable oscillator and it blinks an LED at a rate you set with two resistors and a capacitor; swap the capacitor and it drives a buzzer at an audible pitch. Students calculate the frequency from f = 1.44 / ((R1 + 2R2)·C) and check it against a phone stopwatch or a tuner app.',
  difficulty: 'Beginner', domains: ['Electronics'], ageMin: 13, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: [],
  components: [c('ne555'), c('breadboard-half'), c('jumper-wires'), c('resistor-1k'), c('resistor-100k'), c('potentiometer-100k', 1, false, 'Replaces R2 so the rate can be swept'), c('capacitor-10uf'), c('capacitor-10nf'), c('capacitor-100nf'), c('led-5mm'), c('resistor-220'), c('buzzer-passive'), c('battery-9v'), c('battery-snap-9v')],
  tools: ['Wire stripper or small pliers', 'Phone with a tuner app (for the tone version)'],
  steps: [
    'Insert the 555 across the breadboard centre gap. Pin 1 is next to the notch/dot, counting anticlockwise. Connect pin 1 to the ground rail and pin 8 to the + rail.',
    'Wire the astable: pin 4 to +; pin 7 to + through R1 (1 kΩ); pin 7 to pin 6 through R2 (100 kΩ); pin 6 to pin 2; pin 2 to ground through C (10 µF, negative leg to ground); pin 5 to ground through 100 nF.',
    'Connect the LED from pin 3 through a 220 Ω resistor to ground (long leg toward pin 3). Connect the 9 V battery to the rails. The LED should blink at about 0.7 Hz.',
    'Calculate the expected frequency: f = 1.44 / ((R1 + 2·R2) × C) = 1.44 / (201 000 × 10 µF) ≈ 0.72 Hz. Time twenty blinks with a stopwatch and compare.',
    'Replace the 10 µF capacitor with 10 nF: the frequency becomes ~720 Hz. Move the LED wire to the buzzer instead and you hear a tone. Check the pitch with a tuner app.',
    'Replace R2 with the 100 kΩ potentiometer (middle and one end pin). Turning it sweeps the pitch: you have built a one-knob synthesiser.',
    'Measure the duty cycle: high time = 0.693 (R1 + R2) C, low time = 0.693 R2 C. With R1 much smaller than R2 the wave is nearly symmetric; explain why the 555 cannot go below 50 % in this circuit.',
    'Document your build with a photo and the measured vs calculated table; add it as an improvement if you find a resistor pair that gives exactly 1.00 Hz.'
  ],
  code: [],
  cad: [],
  safety: [s('Reversed electrolytic capacitor', 'The 10 µF capacitor has polarity; reversed on 9 V it can vent. Negative stripe to ground.'), s('Loud buzzer', 'Keep the buzzer away from ears; cover it with a finger to reduce volume.')],
  accessibility: { lowVision: 'The buzzer version gives an audible result for every change; breadboard rows can be counted by touch (5 holes per row). Use a template with pin numbers in large print.', motor: 'Use a breadboard with pre-inserted 555 and pre-bent resistor legs; jumper wires with rigid pins are easier than bare wire.', hearing: 'Use the LED version; a phone tuner app shows the pitch visually.', textOnly: 'Result: calculated vs measured frequency.' },
  versions: [v('1.0.0', '2026-01-08', 'First version.'), v('1.1.0', '2026-02-27', 'Added the potentiometer sweep and duty-cycle step.', 'a.bose')],
  tags: ['555', 'oscillator', 'breadboard', 'frequency', 'capacitor', 'no microcontroller']
},
{
  id: 'ldr-light-tracker', title: 'LDR light tracker with a servo',
  description: 'Two photoresistors either side of a small fin sense which side is brighter; an Arduino turns a servo toward the light until both read the same. This is the control loop behind solar trackers. The sketch uses a proportional controller with a dead-band, and the serial output lets you plot the error settling to zero.',
  difficulty: 'Intermediate', domains: ['Electronics', 'Robotics', 'Computing'], ageMin: 13, type: 'mixed', license: 'MIT', timeMinutes: 90,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('ldr', 2), c('resistor-10k', 2), c('servo-sg90'), c('jumper-wires'), c('breadboard-half', 1, false, 'You can twist wires directly onto the LDR legs instead'), c('cardboard-sheet', 1, true, 'For the sensor plate and the shade fin'), c('computer-usb')],
  tools: ['Arduino IDE (free)', 'Scissors', 'Tape or hot glue', 'A torch'],
  steps: [
    'Cut a 40 × 30 mm cardboard plate and a 25 mm tall fin (or print ldr-tracker-mount.scad). Push the two LDRs through the plate 20 mm apart with the fin between them, and glue the plate to the servo horn.',
    'Wire each LDR as a voltage divider: 5 V → LDR → A0 (or A1) → 10 kΩ → GND. The analog pin sits at the junction. Brighter light → lower LDR resistance → higher reading.',
    'Servo: brown → GND, red → 5 V, orange → D9. An SG90 draws up to 250 mA when it stalls; the Uno\'s 5 V pin can handle one servo over USB.',
    'Upload tracker.ino. Open the Serial Plotter at 9600 baud: you will see left, right and error traces.',
    'Shine a torch from one side. The error grows, the servo turns, the error shrinks to inside the dead-band and the servo stops. Move the torch slowly around and watch it follow.',
    'Tune: increase KP until it overshoots and oscillates, then halve it. Increase the DEADBAND if it twitches in steady light. Note the values that give the fastest settling without oscillation.',
    'Calibrate the sensors: cover both LDRs and read them, then expose both to the same light. If they differ by more than ~20 counts, add the difference as an offset in the code.',
    'Extension: add a second servo and two more LDRs for two-axis tracking, or log the servo angle every minute across a day to trace the Sun\'s path.'
  ],
  code: [{ name: 'Proportional light tracker', lang: 'cpp', filename: 'tracker.ino', content:
`// tracker.ino — two-LDR light tracker with a proportional controller
#include <Servo.h>

const int LDR_LEFT = A0, LDR_RIGHT = A1, SERVO_PIN = 9;
const float KP = 0.02;      // degrees of correction per count of error
const int DEADBAND = 15;    // ignore errors smaller than this (ADC counts)
const int OFFSET = 0;       // add to right reading if sensors differ in matched light
Servo servo;
float angle = 90;

void setup() {
  Serial.begin(9600);
  servo.attach(SERVO_PIN);
  servo.write(angle);
}

void loop() {
  int left = analogRead(LDR_LEFT);
  int right = analogRead(LDR_RIGHT) + OFFSET;
  int error = left - right;             // positive = left brighter
  if (abs(error) > DEADBAND) {
    angle += KP * error;                // turn toward the brighter side
    angle = constrain(angle, 10, 170);
    servo.write((int)angle);
  }
  Serial.print(left); Serial.print('\\t');
  Serial.print(right); Serial.print('\\t');
  Serial.println(error);
  delay(40);
}` }],
  cad: [{ file: 'ldr-tracker-mount.scad', kind: 'scad', description: 'Servo-horn plate with two LDR pockets and a shade fin (OpenSCAD).' }],
  safety: [s('Servo stall', 'If the servo buzzes against its end stop, cut power; a stalled servo overheats in a minute.'), s('USB power', 'Do not add more than one servo on USB power; use a 4×AA pack for more.')],
  accessibility: { lowVision: 'The Serial output can be read as numbers by a screen reader; the servo motion is audible and can be felt. Large-print wiring table provided in the README.', motor: 'The mount can be pre-glued; all connections are push-fit jumpers, no soldering.', hearing: 'Fully visual; the plotter shows the loop settling.', textOnly: 'Result: error settles from hundreds of counts to under the dead-band within about a second.' },
  versions: [v('1.0.0', '2026-01-10', 'First version.'), v('1.1.0', '2026-03-12', 'Replaced bang-bang control with proportional + dead-band; added Serial plotter output.', 'a.bose'), v('1.1.1', '2026-08-02', 'Added OFFSET calibration step.')],
  tags: ['arduino', 'servo', 'sensor', 'control loop', 'solar tracking', 'feedback']
},
{
  id: 'arduino-weather-station', title: 'Arduino weather station with data logging',
  description: 'Temperature, humidity and pressure logged every minute to a CSV file through the serial port, displayed on a small OLED. A week of readings lets students correlate pressure drops with rain and see the daily humidity cycle. The Python logger writes the file; the notebook-free plotting script charts it.',
  difficulty: 'Intermediate', domains: ['Electronics', 'Environmental science', 'Computing'], ageMin: 13, type: 'mixed', license: 'MIT', timeMinutes: 150,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('dht22'), c('bmp280'), c('oled-096', 1, false, 'Standalone readout; Serial Monitor works without it'), c('resistor-10k', 1, true, 'DHT data-line pull-up'), c('jumper-wires'), c('breadboard-half'), c('cardboard-sheet', 1, false, 'Radiation shield for the sensor (stack of plates)'), c('computer-usb')],
  tools: ['Arduino IDE with DHT, Adafruit BMP280 and SSD1306 libraries', 'Python 3 with pyserial'],
  steps: [
    'Wire the DHT22: pin 1 → 5 V, pin 2 → D2 with a 10 kΩ pull-up to 5 V, pin 4 → GND. Wire the BMP280 and OLED on I²C: SDA → A4, SCL → A5, VCC → 3.3 V (BMP280) / 5 V (OLED), GND → GND.',
    'Install the libraries via Library Manager: "DHT sensor library" (Adafruit), "Adafruit BMP280", "Adafruit SSD1306". Upload weather.ino.',
    'Open the Serial Monitor at 9600. Every 60 s a line like "23.4,61.2,1008.7" (°C, %RH, hPa) appears. If the BMP280 is not found, change 0x76 to 0x77 in the sketch.',
    'Run logger.py on the computer; it timestamps each line and appends to weather.csv. Leave it running for at least 24 h.',
    'Put the sensor outside a window in a radiation shield: three cardboard plates spaced 2 cm apart, painted white, so sun does not heat the sensor directly. Keep the Arduino indoors.',
    'Run plot.py after a day: it produces temperature, humidity and pressure charts. Look for the afternoon temperature peak and the humidity trough at the same time.',
    'Convert pressure to sea level: P₀ = P / (1 − h/44330)^5.255 with h your altitude in metres, so readings compare with the weather report.',
    'Extension: log for a month and mark the days it rained. Does pressure fall 6–12 hours earlier?'
  ],
  code: [
    { name: 'Sensor sketch', lang: 'cpp', filename: 'weather.ino', content:
`// weather.ino — DHT22 + BMP280, CSV over serial every 60 s, optional OLED
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_SSD1306.h>

#define DHTPIN 2
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp;
Adafruit_SSD1306 oled(128, 64, &Wire, -1);
bool haveOled = false;
const unsigned long PERIOD_MS = 60000UL;

void setup() {
  Serial.begin(9600);
  dht.begin();
  if (!bmp.begin(0x76)) Serial.println("# BMP280 not found at 0x76 (try 0x77)");
  haveOled = oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  Serial.println("temp_c,rh_pct,pressure_hpa");
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  float p = bmp.readPressure() / 100.0f;
  if (isnan(t) || isnan(h)) { Serial.println("# DHT read failed"); }
  else {
    Serial.print(t, 1); Serial.print(',');
    Serial.print(h, 1); Serial.print(',');
    Serial.println(p, 1);
  }
  if (haveOled) {
    oled.clearDisplay(); oled.setTextColor(SSD1306_WHITE); oled.setTextSize(2);
    oled.setCursor(0, 0);  oled.print(t, 1); oled.println(" C");
    oled.setCursor(0, 22); oled.print(h, 0); oled.println(" %RH");
    oled.setCursor(0, 44); oled.print(p, 0); oled.println(" hPa");
    oled.display();
  }
  delay(PERIOD_MS);
}` },
    { name: 'Serial CSV logger', lang: 'python', filename: 'logger.py', content:
`# logger.py — append timestamped serial lines to weather.csv
# pip install pyserial ; usage: python logger.py COM3  (or /dev/ttyUSB0)
import sys, time, serial

port = sys.argv[1] if len(sys.argv) > 1 else '/dev/ttyUSB0'
ser = serial.Serial(port, 9600, timeout=70)
with open('weather.csv', 'a') as f:
    while True:
        line = ser.readline().decode('ascii', 'ignore').strip()
        if not line or line.startswith('#') or line.startswith('temp'):
            continue
        stamp = time.strftime('%Y-%m-%d %H:%M:%S')
        f.write(f'{stamp},{line}\\n'); f.flush()
        print(stamp, line)` },
    { name: 'Plot the log', lang: 'python', filename: 'plot.py', content:
`# plot.py — three stacked charts from weather.csv
import csv
from datetime import datetime
import matplotlib.pyplot as plt

t, temp, rh, p = [], [], [], []
with open('weather.csv') as f:
    for row in csv.reader(f):
        if len(row) != 4: continue
        t.append(datetime.strptime(row[0], '%Y-%m-%d %H:%M:%S'))
        temp.append(float(row[1])); rh.append(float(row[2])); p.append(float(row[3]))

fig, ax = plt.subplots(3, 1, sharex=True, figsize=(9, 7))
ax[0].plot(t, temp); ax[0].set_ylabel('temp (C)')
ax[1].plot(t, rh);   ax[1].set_ylabel('RH (%)')
ax[2].plot(t, p);    ax[2].set_ylabel('pressure (hPa)')
fig.autofmt_xdate(); plt.tight_layout(); plt.savefig('weather.png', dpi=130)
print('saved weather.png with', len(t), 'points')` }
  ],
  cad: [],
  safety: [s('Outdoor wiring', 'Keep the Arduino and USB indoors; only the sensor goes outside, in a shield, out of the rain.'), s('3.3 V sensor', 'The BMP280 module without a regulator must be powered from 3.3 V, not 5 V.')],
  accessibility: { lowVision: 'CSV output is plain text; a screen reader can read the latest line. The OLED can be swapped for spoken readings using a laptop text-to-speech loop over the serial stream.', motor: 'All connections are breadboard push-fit.', hearing: 'Fully visual.', textOnly: 'Daily summary: min/max temperature, humidity range and pressure trend as numbers.' },
  versions: [v('1.0.0', '2026-01-14', 'First version.'), v('1.1.0', '2026-03-18', 'Added BMP280 and sea-level conversion; OLED made optional.', 'r.iyer'), v('1.1.1', '2026-06-30', 'logger.py: ignore header/comment lines.')],
  tags: ['arduino', 'sensors', 'data logging', 'csv', 'weather', 'i2c']
},
{
  id: 'air-quality-logger', title: 'Air-quality logger (PM2.5 + gas)',
  description: 'A PMS5003 laser particle counter gives real µg/m³ PM2.5 readings, an MQ‑135 adds a gas/VOC trend, and an ESP32 logs both to a CSV over serial every 30 seconds. Take it to a bus stop, a kitchen while cooking and a classroom, and compare against the national standard of 60 µg/m³ (24‑h). The cost-down build swaps the laser sensor for an optical dust sensor with a relative reading.',
  difficulty: 'Advanced', domains: ['Environmental science', 'Electronics', 'Computing'], ageMin: 16, type: 'mixed', license: 'MIT', timeMinutes: 180,
  requires: ['microcontroller', 'computer'],
  components: [c('esp32-devkit'), c('pms5003'), c('mq135'), c('oled-096', 1, false, 'Readout in the field; serial works at a desk'), c('jumper-wires'), c('breadboard-half'), c('power-bank'), c('computer-usb')],
  tools: ['Arduino IDE with ESP32 board package', 'Python 3 with pyserial', 'Small box for the sensors'],
  steps: [
    'Power the PMS5003 from 5 V (VIN on the ESP32 when on USB) and connect its TX to ESP32 GPIO16 (RX2). Its output is 3.3 V logic, so no level shifter is needed. Leave SET and RESET unconnected.',
    'Power the MQ‑135 from 5 V; connect its AOUT through a 10 kΩ / 20 kΩ divider (or just use 3.3 V power at reduced sensitivity) to GPIO34. Let it warm up for 24 h once, then 3 min per session.',
    'Upload airq.ino. Open Serial at 115200: lines "pm1,pm25,pm10,gas_raw" appear every 30 s. The first three are µg/m³ from the PMS5003 frame; gas_raw is the 12‑bit ADC value.',
    'Run the same logger.py from the weather station (change baud to 115200) to timestamp lines into airq.csv. Powered from a power bank, the logger runs for a full day.',
    'Take a 20‑minute baseline in a quiet room. Then log in three locations: a kitchen during frying, a roadside, a room with an incense stick. Note the times.',
    'Plot PM2.5 against time and mark the locations. Compare peaks with the CPCB 24‑h standard (60 µg/m³) and the WHO guideline (15 µg/m³).',
    'The MQ‑135 raw value is not calibrated to ppm; treat it as a relative index and note that it responds to humidity too. Discuss what a real calibration would need.',
    'Extension: build a 20 cm box-fan filter and log PM2.5 before and after running it for 30 minutes in a closed room.'
  ],
  code: [{ name: 'ESP32 sensor sketch', lang: 'cpp', filename: 'airq.ino', content:
`// airq.ino — PMS5003 (UART2) + MQ-135 (ADC) -> CSV over USB serial
#include <HardwareSerial.h>
HardwareSerial pms(2);            // UART2: RX=GPIO16, TX=GPIO17
const int GAS_PIN = 34;
const unsigned long PERIOD_MS = 30000UL;
uint16_t pm1 = 0, pm25 = 0, pm10 = 0;

bool readPMS() {
  // frame: 0x42 0x4D len(2) data... checksum(2); total 32 bytes
  while (pms.available() >= 32) {
    if (pms.read() != 0x42) continue;
    if (pms.peek() != 0x4D) continue;
    uint8_t buf[31]; buf[0] = 0x42;
    pms.readBytes(buf + 1, 31);
    uint16_t sum = 0;
    for (int i = 0; i < 30; i++) sum += buf[i];
    uint16_t check = (buf[30] << 8) | buf[31 - 1 + 0]; // placeholder replaced below
    check = (buf[30] << 8) | buf[31];                   // bytes 30,31 = checksum
    // Note: buf holds 32 bytes indices 0..31 after readBytes(buf+1,31)
    if (check != sum) return false;
    pm1  = (buf[10] << 8) | buf[11];   // atmospheric-environment values
    pm25 = (buf[12] << 8) | buf[13];
    pm10 = (buf[14] << 8) | buf[15];
    return true;
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  pms.begin(9600, SERIAL_8N1, 16, 17);
  analogReadResolution(12);
  Serial.println("pm1,pm25,pm10,gas_raw");
}

void loop() {
  static unsigned long last = 0;
  readPMS();
  if (millis() - last >= PERIOD_MS) {
    last = millis();
    int gas = analogRead(GAS_PIN);
    Serial.print(pm1); Serial.print(',');
    Serial.print(pm25); Serial.print(',');
    Serial.print(pm10); Serial.print(',');
    Serial.println(gas);
  }
  delay(50);
}` }],
  cad: [],
  safety: [s('Deliberate pollution', 'Log incense or frying only in a ventilated room for a few minutes; do not sit in smoke to "get a reading".'), s('MQ‑135 heater', 'The sensor runs warm (about 50 °C); mount it clear of plastic and do not touch the metal mesh.'), s('Roadside', 'Log from the footpath, with a partner.')],
  accessibility: { lowVision: 'CSV is screen-reader friendly; the ESP32 can beep (add a buzzer on GPIO25) when PM2.5 crosses a threshold.', motor: 'Everything is push-fit on a breadboard; mount the sensor box on a bag strap.', hearing: 'Fully visual output.', textOnly: 'Result: PM2.5 in µg/m³ per location, compared to 60 (CPCB) and 15 (WHO).' },
  versions: [v('1.0.0', '2026-03-22', 'First version.'), v('1.0.1', '2026-04-15', 'Fixed PMS5003 checksum indexing; documented that the MQ‑135 value is relative only.', 'moderation'), v('1.1.0', '2026-08-09', 'Added box-fan filter extension and CPCB/WHO reference values.')],
  tags: ['esp32', 'pm2.5', 'air pollution', 'sensors', 'data logging', 'uart']
},
{
  id: 'soil-moisture-alarm', title: 'Soil moisture alarm for a classroom plant',
  description: 'A capacitive probe in a pot, an Arduino and a buzzer: when the soil dries past a threshold the plant "asks" for water. Students calibrate the sensor in dry and wet soil, choose a threshold, and log readings to see how fast the pot dries in sun versus shade. The nails-and-resistor version costs almost nothing.',
  difficulty: 'Beginner', domains: ['Electronics', 'Biology', 'Environmental science'], ageMin: 10, type: 'mixed', license: 'MIT', timeMinutes: 60,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-nano'), c('usb-cable-ab', 1, true, 'A Nano uses mini/micro USB; any phone cable of the right type works'), c('soil-moisture-capacitive'), c('buzzer-passive'), c('led-5mm'), c('resistor-220'), c('jumper-wires'), c('breadboard-mini'), c('computer-usb')],
  tools: ['Arduino IDE', 'A potted plant', 'A cup of water'],
  steps: [
    'Connect the sensor: VCC → 5 V, GND → GND, AOUT → A0. Buzzer + → D8, − → GND. LED long leg → D7 through 220 Ω, short leg → GND.',
    'Upload soil.ino and open the Serial Monitor. Hold the probe in the air: note the reading (about 600–700 on a 5 V Nano). Dip it in a cup of water: note it (about 250–300).',
    'Push the probe into the pot to the marked line, away from the pot edge. Water the plant well and note the "wet soil" reading; wait two days and note "dry soil".',
    'Set DRY_THRESHOLD in the sketch halfway between wet and dry soil readings and re-upload. When the soil dries past it, the buzzer chirps every 30 s and the LED lights.',
    'Log a reading every 10 minutes for a week (the sketch prints one every 10 min; paste into a spreadsheet or use logger.py from the weather station).',
    'Plot moisture against time and mark watering events: the curve drops in sunny afternoons and flattens at night. Compare a pot in sun with one in shade.',
    'Discuss why the capacitive probe reads relative moisture, not percentage: the value depends on soil type and how tightly it is packed.'
  ],
  code: [{ name: 'Moisture alarm sketch', lang: 'cpp', filename: 'soil.ino', content:
`// soil.ino — capacitive soil probe, buzzer + LED alarm, 10-minute serial log
const int PROBE = A0, BUZZER = 8, LED = 7;
const int DRY_THRESHOLD = 520;          // set halfway between your wet and dry readings
const unsigned long LOG_MS = 600000UL;  // 10 minutes
const unsigned long CHIRP_MS = 30000UL;

void setup() {
  Serial.begin(9600);
  pinMode(BUZZER, OUTPUT); pinMode(LED, OUTPUT);
  Serial.println("minutes,moisture_raw");
}

void loop() {
  static unsigned long lastLog = 0, lastChirp = 0;
  int m = analogRead(PROBE);              // higher = drier for capacitive v1.2
  bool dry = m > DRY_THRESHOLD;
  digitalWrite(LED, dry ? HIGH : LOW);
  if (dry && millis() - lastChirp > CHIRP_MS) {
    tone(BUZZER, 2000, 150); delay(200); tone(BUZZER, 2500, 150);
    lastChirp = millis();
  }
  if (millis() - lastLog >= LOG_MS || lastLog == 0) {
    lastLog = millis();
    Serial.print(millis() / 60000UL); Serial.print(','); Serial.println(m);
  }
  delay(200);
}` }],
  cad: [],
  safety: [s('Water near electronics', 'Keep the Nano and USB above the pot on a shelf; only the probe goes in the soil.'), s('Probe edge', 'Capacitive probes have an unsealed PCB edge; do not bury past the line.')],
  accessibility: { lowVision: 'The alarm is audible; readings print as text.', motor: 'Push-fit wiring on a mini breadboard; the probe can be pre-inserted.', hearing: 'The LED shows the same state as the buzzer; add a vibration motor on D8 for a tactile alert.', textOnly: 'Result: wet and dry calibration numbers and a drying curve.' },
  versions: [v('1.0.0', '2026-02-09', 'First version.'), v('1.1.0', '2026-05-28', 'Added the nail-probe alternative and 10-minute logging.', 'p.nair')],
  tags: ['arduino', 'plants', 'sensor', 'calibration', 'alarm', 'logging']
},
{
  id: 'braille-learning-board', title: 'Low-cost Braille learning board',
  description: 'A six-button board that speaks and shows the letter for any Braille cell a learner presses, plus a quiz mode that names a letter and checks the dots pressed. Built from an Arduino, six large tactile buttons in the standard 2×3 cell layout and a buzzer; the optional 3D-printed plate takes bead "dots" so a learner can build letters by hand. Designed with blind students in mind, but useful for sighted classmates learning alongside.',
  difficulty: 'Intermediate', domains: ['Electronics', 'Computing'], ageMin: 13, type: 'mixed', license: 'MIT', timeMinutes: 150,
  requires: ['microcontroller', 'computer', 'soldering'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('pushbutton', 8, true, '6 for the cell, 1 for "enter", 1 for "quiz"'), c('buzzer-passive'), c('lcd-16x2-i2c', 1, false, 'Shows the letter for sighted users; the buzzer patterns work without it'), c('vibration-motor', 1, false, 'Haptic "correct" pulse'), c('braille-dots-beads', 1, false, 'For the tactile plate'), c('foam-board'), c('jumper-wires'), c('breadboard-half'), c('computer-usb')],
  tools: ['Arduino IDE with LiquidCrystal_I2C', 'Hot glue', 'Hobby knife', 'Soldering iron (for button leads) — optional if using a breadboard-mounted buttons'],
  steps: [
    'Lay out the six buttons on the foam board in the Braille cell pattern: two columns, three rows, 20 mm apart (dots 1–3 down the left, 4–6 down the right). Add the Enter button below and the Quiz button to the side.',
    'Wire each button between a digital pin (D2–D9) and GND; the sketch uses INPUT_PULLUP so no resistors are needed. Buzzer + → D10. Optional LCD on I²C (SDA A4, SCL A5). Optional vibration motor via a BC547 on D11.',
    'Upload braille.ino. Press dots 1 and 2 together, then Enter: the buzzer plays the tone pattern for "b" and the LCD shows "b". The map covers a–z and the numbers.',
    'Learn mode: a learner presses any dots and Enter; the board names the letter using a tone code (short beeps for the alphabet position, e.g. 2 beeps for "b") and shows it on the LCD.',
    'Quiz mode: press Quiz. The board plays the tone code for a random letter; the learner presses its dots and Enter. Correct → rising two-tone and a haptic pulse; wrong → low buzz and it repeats the letter.',
    'Print braille-cell-plate.scad (or glue half-beads onto card in the same 2×3 layout at 10 mm pitch) so the learner can feel the letter shape while pressing the buttons.',
    'Session log: the sketch prints "letter,correct,ms" over serial for each quiz item; log it with logger.py to track progress over weeks.',
    'Add a serial command ("say b") so a teacher with a laptop can drive the board; use free TTS on the laptop to speak the letter name if you want speech rather than tone codes.'
  ],
  code: [{ name: 'Braille board firmware', lang: 'cpp', filename: 'braille.ino', content:
`// braille.ino — six-dot Braille input, learn + quiz modes, tone codes, optional LCD
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);
bool haveLcd = true;

const int DOT_PINS[6] = {2, 3, 4, 5, 6, 7};   // dots 1..6
const int ENTER = 8, QUIZ = 9, BUZZER = 10, HAPTIC = 11;

// Braille alphabet: bit i set = dot i+1 raised (a=1, b=12, c=14 ...)
const uint8_t LETTERS[26] = {
  0b000001, 0b000011, 0b001001, 0b011001, 0b010001, 0b001011, 0b011011, 0b010011, 0b001010, 0b011010,
  0b000101, 0b000111, 0b001101, 0b011101, 0b010101, 0b001111, 0b011111, 0b010111, 0b001110, 0b011110,
  0b100101, 0b100111, 0b111010, 0b101101, 0b111101, 0b110101 };

uint8_t readCell() {
  uint8_t cell = 0;
  for (int i = 0; i < 6; i++) if (digitalRead(DOT_PINS[i]) == LOW) cell |= (1 << i);
  return cell;
}
int letterIndex(uint8_t cell) {
  for (int i = 0; i < 26; i++) if (LETTERS[i] == cell) return i;
  return -1;
}
void toneCode(int idx) {           // idx 0..25 -> groups of 5 long beeps + short beeps
  for (int i = 0; i < (idx + 1) / 5; i++) { tone(BUZZER, 660, 220); delay(300); }
  for (int i = 0; i < (idx + 1) % 5; i++) { tone(BUZZER, 880, 90); delay(160); }
}
void show(const char* s) { if (haveLcd) { lcd.clear(); lcd.print(s); } Serial.println(s); }

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 6; i++) pinMode(DOT_PINS[i], INPUT_PULLUP);
  pinMode(ENTER, INPUT_PULLUP); pinMode(QUIZ, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT); pinMode(HAPTIC, OUTPUT);
  lcd.init(); lcd.backlight();
  show("Braille board");
  randomSeed(analogRead(A0));
}

void waitEnter(uint8_t &cell) {
  cell = 0;
  while (digitalRead(ENTER) == HIGH) { cell |= readCell(); delay(10); }  // latch dots pressed
  while (digitalRead(ENTER) == LOW) delay(10);
}

void loop() {
  uint8_t cell;
  if (digitalRead(QUIZ) == LOW) {
    while (digitalRead(QUIZ) == LOW) delay(10);
    int target = random(26);
    show("Quiz: listen");
    toneCode(target);
    unsigned long t0 = millis();
    waitEnter(cell);
    bool ok = (letterIndex(cell) == target);
    char msg[17]; snprintf(msg, 17, "%s  ans: %c", ok ? "correct" : "wrong", 'a' + target);
    show(msg);
    Serial.print('a' + target); Serial.print(','); Serial.print(ok); Serial.print(','); Serial.println(millis() - t0);
    if (ok) { tone(BUZZER, 880, 120); delay(150); tone(BUZZER, 1320, 200); digitalWrite(HAPTIC, HIGH); delay(250); digitalWrite(HAPTIC, LOW); }
    else { tone(BUZZER, 220, 400); delay(600); toneCode(target); }
    return;
  }
  waitEnter(cell);
  int idx = letterIndex(cell);
  if (idx < 0) { show("not a letter"); tone(BUZZER, 220, 300); return; }
  char msg[17]; snprintf(msg, 17, "letter: %c", 'a' + idx);
  show(msg); toneCode(idx);
}` }],
  cad: [{ file: 'braille-cell-plate.scad', kind: 'scad', description: 'Enlarged 6-cell learning plate with bead pockets, plus a true-size raised-dot reference strip (OpenSCAD).' }],
  safety: [s('Soldering', 'If soldering button leads, use a stand and ventilation; breadboard-mounted buttons avoid it entirely.'), s('Loud buzzer', 'Set tone volume by covering the buzzer with tape; keep away from the ear.')],
  accessibility: { lowVision: 'Designed for it: all feedback is audible and tactile; the LCD is optional. Buttons are large and in the standard cell layout so the skill transfers to a Perkins brailler.', motor: 'Buttons can be replaced with larger arcade buttons; Enter can be a foot switch.', hearing: 'The LCD and LED (or a vibration motor) carry the same information as the tones.', textOnly: 'Serial prints every letter and quiz result as plain text.' },
  versions: [v('1.0.0', '2026-04-08', 'First version.'), v('1.1.0', '2026-06-10', 'Added quiz mode, session logging and the tactile plate.', 's.menon'), v('1.1.1', '2026-08-21', 'Fixed dot latching so chords do not need simultaneous presses.')],
  tags: ['accessibility', 'braille', 'arduino', 'inclusive', 'buttons', 'haptic']
},
// ---------------------------------------------------------------- ROBOTICS
{
  id: 'line-following-robot', title: 'Line-following robot (two sensors)',
  description: 'Two infrared reflectance sensors, two gear motors, a driver board and an Arduino: the classic first robot. It follows a black electrical-tape line on a white floor with a simple proportional rule, and students tune speed and gain to take corners without losing the line. The chassis template cuts from plywood or double cardboard.',
  difficulty: 'Intermediate', domains: ['Robotics', 'Electronics', 'Computing'], ageMin: 13, type: 'mixed', license: 'MIT', timeMinutes: 240,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('robot-chassis-2wd'), c('l298n'), c('tcrt5000', 2), c('cell-18650', 2), c('holder-18650-2'), c('jumper-wires'), c('electrical-tape', 1, true, 'The track itself'), c('computer-usb')],
  tools: ['Arduino IDE', 'Screwdriver', 'Cable ties', 'Hot glue', 'White chart paper or a light floor for the track'],
  steps: [
    'Assemble the chassis: motors at the rear, castor at the front. If using the cardboard template (CAD tab) cut two copies and glue them cross-grain.',
    'Mount the two TCRT5000 modules at the very front, 30 mm apart, 10–15 mm above the floor, so the tape passes between them when the robot is centred.',
    'Wire the L298N: motor A to OUT1/2, motor B to OUT3/4; 12 V input from the 2×18650 pack (7.4 V), GND shared with the Arduino; ENA → D5, IN1 → D6, IN2 → D7, ENB → D10, IN3 → D8, IN4 → D9. Power the Arduino from the L298N 5 V output.',
    'Sensors: VCC → 5 V, GND → GND, left DO → D2, right DO → D3. Turn each module\'s trimmer so its LED goes off over black tape and on over white.',
    'Lay a track: a loop of black tape with gentle curves (radius > 20 cm) on white paper or a light tiled floor.',
    'Upload linefollower.ino with BASE_SPEED = 120. Place the robot on the line and switch on. If it turns away from the line, swap IN1/IN2 for that motor (or flip the motor wires).',
    'Tune: raise BASE_SPEED until it loses the line on the sharpest curve, then back off 10 %. Increase TURN until corners are clean; too much and it wiggles on straights.',
    'Time three laps and record speed and turn settings in a table; the fastest reliable setting wins. Extension: add a third sensor in the middle and implement a proper weighted-position PID.'
  ],
  code: [{ name: 'Two-sensor line follower', lang: 'cpp', filename: 'linefollower.ino', content:
`// linefollower.ino — two digital IR sensors, L298N driver, differential steering
const int L_SENSOR = 2, R_SENSOR = 3;          // LOW over black tape (after trimmer setup)
const int ENA = 5, IN1 = 6, IN2 = 7;           // left motor
const int ENB = 10, IN3 = 8, IN4 = 9;          // right motor
int BASE_SPEED = 120;                          // 0-255
int TURN = 90;                                 // speed difference when correcting

void motor(int en, int a, int b, int speed) {  // speed -255..255
  digitalWrite(a, speed >= 0 ? HIGH : LOW);
  digitalWrite(b, speed >= 0 ? LOW : HIGH);
  analogWrite(en, constrain(abs(speed), 0, 255));
}
void drive(int left, int right) { motor(ENA, IN1, IN2, left); motor(ENB, IN3, IN4, right); }

void setup() {
  int pins[] = {ENA, IN1, IN2, ENB, IN3, IN4};
  for (int p : pins) pinMode(p, OUTPUT);
  pinMode(L_SENSOR, INPUT); pinMode(R_SENSOR, INPUT);
  Serial.begin(9600);
  delay(1500);                                 // time to put the robot down
}

void loop() {
  bool leftOnLine  = digitalRead(L_SENSOR) == LOW;
  bool rightOnLine = digitalRead(R_SENSOR) == LOW;
  static int lastTurn = 0;                     // remember which way the line went

  if (!leftOnLine && !rightOnLine)      { drive(BASE_SPEED, BASE_SPEED); }          // centred
  else if (leftOnLine && !rightOnLine)  { drive(BASE_SPEED - TURN, BASE_SPEED); lastTurn = -1; }  // drifted right
  else if (!leftOnLine && rightOnLine)  { drive(BASE_SPEED, BASE_SPEED - TURN); lastTurn = 1; }   // drifted left
  else {                                                                     // both on line: crossing or lost
    if (lastTurn < 0) drive(-TURN, BASE_SPEED); else drive(BASE_SPEED, -TURN);   // spin toward last known side
  }
  delay(5);
}` }],
  cad: [{ file: 'line-follower-chassis.svg', kind: 'svg', description: 'A4 chassis plate with TT-motor slots, castor and sensor holes, plus a sensor bracket and cap-wheel spacers.' }],
  safety: [s('Li‑ion cells', 'Use protected 18650 cells, never short the pack, and charge only in a proper charger. A 4×AA pack is a safer alternative for younger groups.'), s('Pinch points', 'Keep fingers away from wheels while powered; add a power switch on the pack.')],
  accessibility: { lowVision: 'Sensor state can be echoed as two tones (left/right) on a buzzer; the track can be a raised tape edge that is also tactile.', motor: 'Cardboard chassis needs only glue; pre-crimped jumper wires avoid fine work. Use screw terminals on the L298N rather than pins.', hearing: 'Fully visual.', textOnly: 'Result: lap time vs speed/turn table.' },
  versions: [v('1.0.0', '2026-02-14', 'First version.'), v('1.1.0', '2026-05-09', 'Added lost-line recovery using the last turn direction; chassis SVG added.', 'a.bose')],
  tags: ['robot', 'arduino', 'motors', 'ir sensor', 'control', 'chassis']
},
{
  id: 'ultrasonic-obstacle-bot', title: 'Obstacle-avoiding robot with a scanning ultrasonic sensor',
  description: 'The line follower\'s chassis with an HC‑SR04 on a servo: the robot drives forward, and when something is closer than 25 cm it stops, scans left and right, and turns toward the clearer side. It introduces distance measurement by time-of-flight (speed of sound), servos and simple decision logic.',
  difficulty: 'Intermediate', domains: ['Robotics', 'Physics', 'Computing'], ageMin: 13, type: 'mixed', license: 'MIT', timeMinutes: 240,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('robot-chassis-2wd'), c('l298n'), c('hc-sr04'), c('servo-sg90'), c('battery-holder-4aa'), c('battery-aa', 4), c('jumper-wires'), c('computer-usb')],
  tools: ['Arduino IDE', 'Screwdriver', 'Hot glue', 'Cable ties'],
  steps: [
    'Assemble the chassis as in the line follower. Glue the servo at the front centre and the HC‑SR04 to the servo horn facing forward.',
    'Wire the L298N as in the line follower (ENA D5, IN1 D6, IN2 D7, ENB D10, IN3 D8, IN4 D9), powered from the 4×AA pack (6 V). Servo signal → D11; HC‑SR04 TRIG → D12, ECHO → D13, both 5 V/GND.',
    'Upload avoid.ino and, with the wheels off the ground, check that the serial output prints a sensible distance in cm when you hold your hand in front of the sensor.',
    'Compute: distance = echo_time × 343 m/s ÷ 2. At 25 °C sound is ~346 m/s; the 1 % difference is smaller than the sensor\'s own error.',
    'Put the robot on the floor. It should drive forward, stop before a wall, look left and right, and turn toward the side with more room.',
    'Tune STOP_CM (25) and the turn time (400 ms) for your floor: on carpet the motors need a higher minimum speed.',
    'Extension: log the distances seen during a 2-minute run and draw a rough map of the room from the turn sequence.'
  ],
  code: [{ name: 'Obstacle avoidance', lang: 'cpp', filename: 'avoid.ino', content:
`// avoid.ino — HC-SR04 on a servo; scan and turn toward free space
#include <Servo.h>
const int TRIG = 12, ECHO = 13, SERVO_PIN = 11;
const int ENA = 5, IN1 = 6, IN2 = 7, ENB = 10, IN3 = 8, IN4 = 9;
const int SPEED = 150, STOP_CM = 25;
Servo head;

long readCm() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW);
  long us = pulseIn(ECHO, HIGH, 25000);        // 25 ms timeout ~ 4 m
  return us == 0 ? 400 : us * 0.0343 / 2;      // cm; 343 m/s = 0.0343 cm/us
}
void motor(int en, int a, int b, int sp) {
  digitalWrite(a, sp >= 0); digitalWrite(b, sp < 0); analogWrite(en, abs(sp));
}
void drive(int l, int r) { motor(ENA, IN1, IN2, l); motor(ENB, IN3, IN4, r); }

void setup() {
  int pins[] = {ENA, IN1, IN2, ENB, IN3, IN4, TRIG};
  for (int p : pins) pinMode(p, OUTPUT);
  pinMode(ECHO, INPUT);
  head.attach(SERVO_PIN); head.write(90);
  Serial.begin(9600); delay(1000);
}

void loop() {
  long d = readCm();
  Serial.println(d);
  if (d > STOP_CM) { drive(SPEED, SPEED); delay(60); return; }
  drive(0, 0); delay(200);
  head.write(30);  delay(400); long right = readCm();
  head.write(150); delay(500); long left  = readCm();
  head.write(90);  delay(300);
  if (left < STOP_CM && right < STOP_CM) { drive(-SPEED, -SPEED); delay(500); drive(-SPEED, SPEED); delay(700); }
  else if (left > right) drive(-SPEED, SPEED); else drive(SPEED, -SPEED);
  delay(400);
}` }],
  cad: [{ file: 'line-follower-chassis.svg', kind: 'svg', description: 'Same chassis plate as the line follower; mount the servo on the front sensor holes.' }],
  safety: [s('Moving robot', 'Run it in a cleared area; keep it off tables (it will drive off the edge).'), s('Battery pack', 'Switch off between runs; AA packs are safe but the L298N gets warm.')],
  accessibility: { lowVision: 'Distance can be beeped on a buzzer (faster beeps when closer); the robot\'s motion is audible.', motor: 'Same chassis notes as the line follower.', hearing: 'Fully visual.', textOnly: 'Serial prints distance in cm continuously.' },
  versions: [v('1.0.0', '2026-03-16', 'First version.'), v('1.0.1', '2026-07-02', 'Added the both-sides-blocked reverse case and a pulseIn timeout.')],
  tags: ['robot', 'ultrasonic', 'servo', 'speed of sound', 'arduino']
},
{
  id: 'servo-cardboard-gripper', title: 'Cardboard servo gripper with a potentiometer',
  description: 'A two-finger gripper cut from cardboard, driven by one SG90 and controlled by a knob. Students learn about servo PWM, mechanical advantage of the linkage, and how to map an analog input to an angle. It attaches to the line-follower chassis for a pick-and-place challenge.',
  difficulty: 'Beginner', domains: ['Robotics', 'Physics'], ageMin: 10, type: 'mixed', license: 'MIT', timeMinutes: 90,
  requires: ['microcontroller', 'computer', 'sharp'],
  components: [c('arduino-nano'), c('usb-cable-ab'), c('servo-sg90'), c('potentiometer-100k'), c('cardboard-sheet', 2), c('pushpins'), c('rubber-bands'), c('jumper-wires'), c('breadboard-mini'), c('computer-usb')],
  tools: ['Hobby knife (adult)', 'Hot glue', 'Ruler'],
  steps: [
    'Cut two fingers (120 × 20 mm) and a palm (60 × 60 mm) from double-thickness cardboard. Pivot each finger on a push pin 15 mm from its base on either side of the palm.',
    'Glue the servo to the palm with the horn between the finger bases. Cut two cardboard links (40 × 10 mm) from the horn ends to each finger 25 mm above the pivot, pinned at both ends.',
    'Turn the horn by hand: both fingers should open and close together. If they bind, lengthen the links or move the pivot pins.',
    'Wire: servo signal → D9, red → 5 V, brown → GND. Potentiometer ends → 5 V and GND, wiper → A0.',
    'Upload gripper.ino. Turning the knob should sweep the gripper from open (0°) to closed (about 70°). Adjust CLOSED so the fingers just touch.',
    'Add rubber-band pads to the fingertips for grip. Test with a bottle cap, a marker and a paper cup: which shapes are easy, which slip?',
    'Measure the mechanical advantage: the servo pushes at 25 mm from the pivot and the fingertip is at 105 mm, so fingertip force is roughly 25/105 of the link force. Explain why a shorter finger grips harder.'
  ],
  code: [{ name: 'Knob-controlled gripper', lang: 'cpp', filename: 'gripper.ino', content:
`// gripper.ino — map a potentiometer to servo angle with smoothing
#include <Servo.h>
const int POT = A0, SERVO_PIN = 9;
const int OPEN = 0, CLOSED = 70;   // adjust CLOSED until fingertips just touch
Servo grip;
float smooth = 0;

void setup() { grip.attach(SERVO_PIN); Serial.begin(9600); }

void loop() {
  int raw = analogRead(POT);
  smooth = 0.9 * smooth + 0.1 * raw;                 // low-pass to stop jitter
  int angle = map((int)smooth, 0, 1023, OPEN, CLOSED);
  grip.write(angle);
  Serial.println(angle);
  delay(20);
}` }],
  cad: [],
  safety: [s('Knife', 'Adult cuts double cardboard; students score and fold.'), s('Servo pinch', 'The gripper closes with a few newtons; keep fingers out while testing.')],
  accessibility: { lowVision: 'The knob gives a direct tactile mapping; the gripper state is audible.', motor: 'A larger knob or a slider potentiometer is easier to operate; the whole gripper can be pre-cut.', hearing: 'Fully visual.', textOnly: 'Serial prints the angle.' },
  versions: [v('1.0.0', '2026-03-28', 'First version.'), v('1.0.1', '2026-06-06', 'Added smoothing to the sketch and the mechanical-advantage step.')],
  tags: ['servo', 'mechanism', 'linkage', 'arduino', 'cardboard']
},
// ---------------------------------------------------------------- COMPUTING
{
  id: 'python-physics-sims', title: 'Physics simulations in Python on a phone (no laptop)',
  description: 'Three small numerical simulations (projectile with air drag, a spring-mass oscillator, and a two-body orbit) that run in the free Pydroid 3 app on any Android phone. Each one uses Euler or Verlet integration with plain Python lists, prints a table, and draws a text plot, so nothing needs installing. Students change a parameter, predict, run, and compare.',
  difficulty: 'Beginner', domains: ['Computing', 'Physics', 'Mathematics'], ageMin: 13, type: 'software', license: 'MIT', timeMinutes: 90,
  requires: ['computer'],
  components: [c('android-phone-pydroid')],
  tools: ['Pydroid 3 (free) or any Python 3.8+'],
  steps: [
    'Install Pydroid 3 from the Play Store (the free version is enough). Create a new file and paste projectile.py.',
    'Run it. It prints the range and flight time with and without air drag for a ball thrown at 20 m/s at 45°. Change the angle: at what angle is the range greatest with drag? (It is less than 45°.)',
    'Paste oscillator.py. It integrates a mass on a spring with damping using semi-implicit Euler and prints a text plot of x against t. Halve the time step and check the amplitude decay stays the same: that is how you know the step is small enough.',
    'Paste orbit.py. It runs Earth around the Sun with velocity-Verlet. Print the energy each orbit: with Verlet it stays nearly constant; switch to plain Euler and watch it drift.',
    'Investigation: give Earth 10 % more speed and see the orbit become elliptical; find the speed at which it escapes (compare to √2 × circular speed).',
    'Save your outputs as text and write down one prediction per simulation that turned out wrong and why.',
    'Extension: add a second planet to orbit.py and see whether the orbits stay stable over 100 years.'
  ],
  code: [
    { name: 'Projectile with drag', lang: 'python', filename: 'projectile.py', content:
`# projectile.py — range with and without quadratic air drag (Euler, dt=1 ms)
import math
g, dt = 9.81, 0.001
mass, radius, rho, Cd = 0.145, 0.037, 1.2, 0.47      # a cricket-ball-sized sphere
k = 0.5 * rho * Cd * math.pi * radius**2 / mass      # drag accel = k * v^2

def fly(speed, angle_deg, drag=True):
    vx = speed * math.cos(math.radians(angle_deg))
    vy = speed * math.sin(math.radians(angle_deg))
    x = y = t = 0.0
    while True:
        v = math.hypot(vx, vy)
        ax = -k * v * vx if drag else 0.0
        ay = -g - (k * v * vy if drag else 0.0)
        vx += ax * dt; vy += ay * dt
        x += vx * dt; y += vy * dt; t += dt
        if y < 0: return x, t

for ang in (30, 35, 40, 45, 50):
    r0, t0 = fly(20, ang, drag=False)
    r1, t1 = fly(20, ang, drag=True)
    print(f'{ang:2d} deg  no drag: {r0:5.1f} m  with drag: {r1:5.1f} m  ({t1:.2f} s)')` },
    { name: 'Damped oscillator', lang: 'python', filename: 'oscillator.py', content:
`# oscillator.py — mass on a spring with damping, semi-implicit Euler, text plot
m, k, c = 0.5, 20.0, 0.4          # kg, N/m, N s/m
x, v, dt, T = 0.10, 0.0, 0.005, 5.0
t = 0.0
rows = []
while t <= T:
    a = (-k * x - c * v) / m
    v += a * dt                    # update velocity first (semi-implicit)
    x += v * dt
    t += dt
    if round(t / 0.1, 6) % 1 == 0: rows.append((t, x))

omega = (k / m) ** 0.5
print(f'natural period = {2 * 3.14159 / omega:.2f} s')
for t, x in rows:
    col = int(30 + x * 250)
    print(f'{t:4.1f}s {x:+.3f} |' + ' ' * col + '*')` },
    { name: 'Two-body orbit (Verlet)', lang: 'python', filename: 'orbit.py', content:
`# orbit.py — Earth around the Sun with velocity-Verlet; energy stays put
import math
G, M = 6.674e-11, 1.989e30
AU = 1.496e11
x, y = AU, 0.0
vx, vy = 0.0, 29780.0 * 1.0        # try 1.1 for an ellipse, 1.42 to escape
dt = 3600.0                          # one hour
day = 0

def accel(x, y):
    r = math.hypot(x, y)
    a = -G * M / r**3
    return a * x, a * y

ax, ay = accel(x, y)
for step in range(24 * 365 * 3):     # three years
    vx += 0.5 * ax * dt; vy += 0.5 * ay * dt
    x += vx * dt; y += vy * dt
    ax, ay = accel(x, y)
    vx += 0.5 * ax * dt; vy += 0.5 * ay * dt
    if step % (24 * 30) == 0:
        r = math.hypot(x, y)
        E = 0.5 * (vx**2 + vy**2) - G * M / r
        print(f'day {step // 24:4d}  r = {r / AU:.3f} AU  E = {E:.4e} J/kg')` }
  ],
  cad: [],
  safety: [s('Screen time', 'None beyond normal phone use.')],
  accessibility: { lowVision: 'All output is text and works with TalkBack; the text plots can be replaced by printing the numbers only.', motor: 'Pydroid supports external keyboards and voice typing; scripts are short enough to paste.', hearing: 'No audio.', textOnly: 'Everything is text already.' },
  versions: [v('1.0.0', '2026-01-05', 'First version.'), v('1.1.0', '2026-04-30', 'Oscillator switched to semi-implicit Euler (plain Euler grew in amplitude).', 'm.kaur')],
  tags: ['python', 'simulation', 'numerical methods', 'orbits', 'no hardware', 'phone']
},
{
  id: 'arduino-reaction-timer', title: 'Arduino reaction timer',
  description: 'An LED lights after a random delay; the player hits a button; the Arduino reports the reaction time in milliseconds. Ten trials per person give a mean and spread, which turns into a statistics lesson: does caffeine, sleep or practice change it? Fits on a mini breadboard and needs no libraries.',
  difficulty: 'Beginner', domains: ['Computing', 'Electronics', 'Biology'], ageMin: 10, type: 'mixed', license: 'MIT', timeMinutes: 45,
  requires: ['microcontroller', 'computer'],
  components: [c('arduino-uno'), c('usb-cable-ab'), c('led-5mm'), c('resistor-220'), c('pushbutton'), c('buzzer-passive', 1, false, 'Audio-only mode for players who cannot see the LED'), c('jumper-wires'), c('breadboard-mini'), c('computer-usb')],
  tools: ['Arduino IDE'],
  steps: [
    'LED long leg → D8 through 220 Ω, short leg → GND. Button between D2 and GND. Optional buzzer + → D9.',
    'Upload reaction.ino and open the Serial Monitor at 9600.',
    'Press the button to start. After a random 1–4 s delay the LED lights (and the buzzer beeps). Press again as fast as you can. The time appears in ms.',
    'Pressing before the LED lights prints "false start" and restarts the trial; that is deliberate, so nobody can guess the timing.',
    'Do 10 trials per person and copy the numbers into a table. Compute the mean and standard deviation (by hand, in a spreadsheet, or with germination_stats.py adapted).',
    'Test a hypothesis: right hand vs left hand; visual (LED) vs audio (buzzer only, LED covered); first thing in the morning vs afternoon. Compare means and spreads.',
    'Discuss what limits reaction time (nerve conduction ~100 m/s, processing) and why the Arduino\'s own timing error (< 1 ms) does not matter here.'
  ],
  code: [{ name: 'Reaction timer', lang: 'cpp', filename: 'reaction.ino', content:
`// reaction.ino — LED/buzzer reaction timer with false-start detection
const int LED = 8, BUTTON = 2, BUZZER = 9;
bool AUDIO_ONLY = false;             // set true to test hearing-only reaction

void waitRelease() { while (digitalRead(BUTTON) == LOW) delay(5); delay(30); }

void setup() {
  pinMode(LED, OUTPUT); pinMode(BUTTON, INPUT_PULLUP); pinMode(BUZZER, OUTPUT);
  Serial.begin(9600);
  randomSeed(analogRead(A0));
  Serial.println("Press the button to start a trial.");
}

void loop() {
  if (digitalRead(BUTTON) == HIGH) return;   // wait for a press to start
  waitRelease();
  unsigned long wait = random(1000, 4000);
  unsigned long t0 = millis();
  while (millis() - t0 < wait) {
    if (digitalRead(BUTTON) == LOW) { Serial.println("false start"); tone(BUZZER, 200, 300); waitRelease(); return; }
  }
  if (!AUDIO_ONLY) digitalWrite(LED, HIGH);
  tone(BUZZER, 1000, 100);
  unsigned long go = millis();
  while (digitalRead(BUTTON) == HIGH) { if (millis() - go > 3000) break; }
  unsigned long rt = millis() - go;
  digitalWrite(LED, LOW);
  if (rt > 3000) Serial.println("no response"); else { Serial.print("reaction_ms,"); Serial.println(rt); }
  waitRelease();
}` }],
  cad: [],
  safety: [s('None significant', 'Low-voltage USB circuit; keep the buzzer volume modest.')],
  accessibility: { lowVision: 'AUDIO_ONLY mode uses the buzzer; results print as text.', motor: 'Any large switch (a foot pedal, a big arcade button) can replace the small button; the sketch does not care about press force.', hearing: 'Visual LED mode is the default.', textOnly: 'Result: list of reaction times and their mean.' },
  versions: [v('1.0.0', '2026-01-22', 'First version.'), v('1.1.0', '2026-05-05', 'Added audio-only mode and false-start detection.', 'a.bose')],
  tags: ['arduino', 'timing', 'statistics', 'human biology', 'beginner']
},
{
  id: 'js-orbit-simulator', title: 'Browser gravity sandbox (JavaScript, no install)',
  description: 'A single HTML file: open it in any browser, click to place planets, drag to give them velocity, and watch N-body gravity with a fixed-step Verlet integrator. Nothing to install and it runs on a school computer or phone. Students explore stable orbits, slingshots and why three bodies are chaotic.',
  difficulty: 'Intermediate', domains: ['Computing', 'Physics'], ageMin: 13, type: 'software', license: 'MIT', timeMinutes: 60,
  requires: ['computer'],
  components: [c('web-browser')],
  tools: ['Any text editor (Notepad is fine)', 'A web browser'],
  steps: [
    'Copy gravity.html into a text editor, save it with a .html extension and double-click it. A dark canvas with a yellow star appears.',
    'Click anywhere to add a planet at rest: it falls straight into the star. Click and drag instead: the drag direction and length set its velocity.',
    'Find a circular orbit: for a star of mass M at distance r the speed is √(GM/r). The panel shows the value for your mouse position; drag to about that length, perpendicular to the star.',
    'Add a second planet nearby and watch them perturb each other. Add a third and try to make anything stable for more than a minute: this is the three-body problem.',
    'Press T to toggle trails, and 1/2/4 to change the time step. At larger steps energy drifts; the panel shows total energy so you can quantify it.',
    'Read the code: the physics is 25 lines. Change G, add a drag term, or make collisions merge bodies (sum masses, conserve momentum).',
    'Challenge: set up a gravitational slingshot that sends a small body out of the system faster than it came in.'
  ],
  code: [{ name: 'Gravity sandbox', lang: 'html', filename: 'gravity.html', content:
`<!doctype html>
<meta charset="utf-8"><title>gravity sandbox</title>
<style>body{margin:0;background:#000;color:#ddd;font:14px monospace}canvas{display:block}#p{position:fixed;left:8px;top:8px}</style>
<canvas id="c"></canvas><div id="p"></div>
<script>
var cv = document.getElementById('c'), cx = cv.getContext('2d'), panel = document.getElementById('p');
var W, H; function size(){ W = cv.width = innerWidth; H = cv.height = innerHeight; } size(); onresize = size;
var G = 2000, dt = 0.5, trails = true;
var bodies = [{x: 0, y: 0, vx: 0, vy: 0, m: 400, r: 10, star: true}];
bodies[0].x = W / 2; bodies[0].y = H / 2;

function accel(b) {
  var ax = 0, ay = 0;
  for (var i = 0; i < bodies.length; i++) {
    var o = bodies[i]; if (o === b) continue;
    var dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy + 25, d = Math.sqrt(d2);
    var a = G * o.m / d2; ax += a * dx / d; ay += a * dy / d;
  }
  return [ax, ay];
}
function step() {                       // velocity-Verlet
  var acc = bodies.map(accel);
  for (var i = 0; i < bodies.length; i++) { var b = bodies[i]; if (b.star) continue;
    b.vx += 0.5 * acc[i][0] * dt; b.vy += 0.5 * acc[i][1] * dt; b.x += b.vx * dt; b.y += b.vy * dt; }
  var acc2 = bodies.map(accel);
  for (var j = 0; j < bodies.length; j++) { var c = bodies[j]; if (c.star) continue;
    c.vx += 0.5 * acc2[j][0] * dt; c.vy += 0.5 * acc2[j][1] * dt; }
}
function energy() {
  var e = 0;
  for (var i = 0; i < bodies.length; i++) { var b = bodies[i]; e += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy);
    for (var j = i + 1; j < bodies.length; j++) { var o = bodies[j]; e -= G * b.m * o.m / Math.hypot(o.x - b.x, o.y - b.y); } }
  return e;
}
var drag = null, mouse = {x: 0, y: 0};
cv.onmousedown = function(e){ drag = {x: e.clientX, y: e.clientY}; };
cv.onmousemove = function(e){ mouse.x = e.clientX; mouse.y = e.clientY; };
cv.onmouseup = function(e){ if (!drag) return;
  bodies.push({x: drag.x, y: drag.y, vx: (e.clientX - drag.x) / 20, vy: (e.clientY - drag.y) / 20, m: 1, r: 3}); drag = null; };
onkeydown = function(e){ if (e.key === 't') trails = !trails; if (e.key === '1') dt = 0.25; if (e.key === '2') dt = 0.5; if (e.key === '4') dt = 1; if (e.key === 'r') bodies.length = 1; };

function frame() {
  for (var k = 0; k < 4; k++) step();
  cx.fillStyle = trails ? 'rgba(0,0,0,0.08)' : '#000'; cx.fillRect(0, 0, W, H);
  for (var i = 0; i < bodies.length; i++) { var b = bodies[i];
    cx.fillStyle = b.star ? '#fc0' : '#6cf'; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.fill(); }
  if (drag) { cx.strokeStyle = '#fff'; cx.beginPath(); cx.moveTo(drag.x, drag.y); cx.lineTo(mouse.x, mouse.y); cx.stroke(); }
  var s = bodies[0], r = Math.hypot(mouse.x - s.x, mouse.y - s.y), vc = Math.sqrt(G * s.m / r) * 20;
  panel.textContent = 'bodies ' + bodies.length + '  dt ' + dt + '  E ' + energy().toFixed(0) +
    '  circular-orbit drag length here: ' + vc.toFixed(0) + ' px   [t] trails [1/2/4] dt [r] reset';
  requestAnimationFrame(frame);
}
frame();
</script>` }],
  cad: [],
  safety: [s('None', 'Software only.')],
  accessibility: { lowVision: 'The panel text is readable by screen readers; bodies are high-contrast on black. Keyboard controls for time step and reset.', motor: 'Placing bodies needs a drag; a touch screen works. A keyboard-only mode (add a body with fixed velocity on Enter) is a two-line change in the code and a good exercise.', hearing: 'No audio.', textOnly: 'Energy and body count are printed as text each frame.' },
  versions: [v('1.0.0', '2026-02-28', 'First version.'), v('1.0.1', '2026-06-25', 'Added energy readout and softening term to avoid singularities.')],
  tags: ['javascript', 'gravity', 'n-body', 'simulation', 'browser', 'no hardware']
},
// ---------------------------------------------------------------- MATHEMATICS
{
  id: 'buffon-needle-pi', title: 'Estimate π by dropping matchsticks (Buffon\'s needle)',
  description: 'Drop matchsticks on a sheet ruled with parallel lines spaced exactly one matchstick length apart. The fraction that cross a line tends to 2/π, so π ≈ 2 × drops / crossings. Two hundred drops give π to about ±0.2; the script shows how the estimate converges and how the error shrinks with √N.',
  difficulty: 'Beginner', domains: ['Mathematics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 45,
  requires: [],
  components: [c('matchsticks'), c('cardboard-sheet', 1, true, 'Or any large sheet of paper'), c('measuring-tape'), c('android-phone-pydroid', 1, false, 'For the simulation script')],
  tools: ['Pen', 'Ruler'],
  steps: [
    'Measure a matchstick precisely (say 42 mm). Rule parallel lines across the sheet exactly that far apart: the method only works if line spacing = stick length.',
    'Drop ten matchsticks at a time from about 30 cm, without aiming. Count how many touch or cross a line. Record drops and crossings.',
    'After every 50 drops compute π ≈ 2 × drops ÷ crossings. Write the running estimate in a table.',
    'Continue to at least 200 drops. Plot the estimate against drops: it wanders, then settles near 3.14.',
    'Run buffon.py: it simulates 100 000 drops and prints the estimate at 100, 1 000, 10 000 and 100 000. Notice the error falls roughly by √10 each time.',
    'Derive it: a stick at angle θ crosses if its centre is within (L/2) sin θ of a line; averaging over θ gives probability 2L/(πd) = 2/π when L = d.',
    'Try a shorter stick (L = d/2): the crossing probability halves. Does the estimate still work if you adjust the formula?'
  ],
  code: [{ name: 'Buffon simulation', lang: 'python', filename: 'buffon.py', content:
`# buffon.py — Monte Carlo Buffon's needle, stick length = line spacing = 1
import math, random
random.seed(7)
crossings = 0
checkpoints = {100, 1000, 10000, 100000}
for n in range(1, 100001):
    centre = random.random()            # distance to the nearest line below, 0..1
    theta = random.random() * math.pi   # angle to the lines
    half = 0.5 * math.sin(theta)
    if centre < half or 1 - centre < half:
        crossings += 1
    if n in checkpoints:
        est = 2 * n / crossings
        print(f'{n:>7} drops  pi ~ {est:.4f}  error {abs(est - math.pi):.4f}')` }],
  cad: [],
  safety: [s('Matchsticks', 'Use safety matches or snap the heads off first; never strike them.')],
  accessibility: { lowVision: 'Rule the lines with raised string or wikki-stix so crossings can be felt; count by touch.', motor: 'Drop from a cup rather than by hand; a partner counts.', hearing: 'No sound.', textOnly: 'Result: a table of drops, crossings and π estimate.' },
  versions: [v('1.0.0', '2026-02-03', 'First version.'), v('1.0.1', '2026-05-19', 'Added the derivation step and the short-stick variant.', 'm.kaur')],
  tags: ['probability', 'monte carlo', 'pi', 'statistics', 'no electronics']
},
{
  id: 'tactile-graph-kit', title: 'Tactile graph kit for blind and low-vision students',
  description: 'A pegboard-style grid where axes are raised, grid intersections are pin holes, and functions are plotted with push pins joined by pipe cleaners or rubber bands. A blind student can plot y = 2x + 1, feel a parabola, or read a bar chart made by a classmate. Laser-cut from 3 mm ply using the SVG, or made from cardboard and a push pin in an afternoon.',
  difficulty: 'Beginner', domains: ['Mathematics'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 120,
  requires: ['sharp'],
  components: [c('plywood-3mm', 2), c('pushpins'), c('pipe-cleaners'), c('rubber-bands'), c('braille-dots-beads', 1, false, 'Tactile axis labels every 5 units'), c('foam-board', 1, true, 'Backing layer so pins have something to grip'), c('glue-hot')],
  tools: ['Laser cutter (school fab-lab) OR a push pin and a printed grid', 'Ruler', 'Glue'],
  steps: [
    'Laser route: send tactile-graph-grid.svg to the cutter with red = cut, blue = light score, black = deep engrave. The result is a 277 × 190 mm board with 1.6 mm pin holes at every 10 mm intersection and grooved axes.',
    'Cardboard route: print the SVG at 100% on A4, glue it to card, prick every intersection from the back with a push pin so a raised dot appears on the front, and glue a pipe cleaner along each axis.',
    'Glue the foam-board backing behind the grid so push pins bite firmly. Mark the origin with a large bead and put small beads every 5 units along both axes.',
    'Plot a straight line: y = 2x + 1. Push pins into (0,1), (1,3), (2,5), (−1,−1) and stretch a rubber band around them. Feel that it is straight.',
    'Plot y = x²: pins at x = −3 … 3 and a pipe cleaner bent through them. Feel the symmetry and that it gets steeper away from the origin.',
    'Make a bar chart of class data (e.g. shoe sizes): a pipe cleaner per bar, cut to length. Compare bars by touch.',
    'Sighted classmates plot the same functions blindfolded; discuss what was harder and what the tactile version made obvious that a drawing hides.'
  ],
  code: [],
  cad: [{ file: 'tactile-graph-grid.svg', kind: 'svg', description: 'A4 laser file: cut outline and pin holes, scored grid, engraved axes, edge notches every 5 units.' }],
  safety: [s('Push pins', 'Store pins in a magnetic tray; count them out and back in.'), s('Laser cutter', 'Only trained adults operate it; plywood only (no PVC).')],
  accessibility: { lowVision: 'This resource exists for it. Contrast for low vision: paint the axes black on a white board and use coloured pins.', motor: 'Use golf tees in larger holes (drill 4 mm) instead of push pins; rubber bands rather than pipe cleaners need less dexterity.', hearing: 'Fully tactile/visual.', textOnly: 'Coordinates can be read aloud from a table while the student places pins.' },
  versions: [v('1.0.0', '2026-03-10', 'First version.'), v('1.1.0', '2026-07-14', 'Added edge notches and bead labels for locating coordinates without sight; cardboard route added.', 's.menon')],
  tags: ['accessibility', 'graphs', 'tactile', 'inclusive', 'coordinates', 'laser cut']
},
{
  id: 'sundial-latitude', title: 'Cardboard sundial and latitude finder',
  description: 'A gnomon set at your latitude on a cardboard dial tells the time from the Sun; measuring the shortest shadow at solar noon over a few days lets you find your latitude and the local solar noon offset from clock time. Geometry, astronomy and a bit of geography in one afternoon plus a week of two-minute readings.',
  difficulty: 'Beginner', domains: ['Mathematics', 'Physics', 'Environmental science'], ageMin: 10, type: 'hardware', license: 'CC BY-SA 4.0', timeMinutes: 60,
  requires: [],
  components: [c('cardboard-sheet', 2), c('wooden-dowel', 1, true, 'Gnomon; a pencil works'), c('printed-protractor'), c('measuring-tape'), c('phone-stopwatch', 1, true, 'Clock for timestamps'), c('electrical-tape')],
  tools: ['Scissors', 'Glue', 'A sunny spot that is not shaded between 10:00 and 15:00'],
  steps: [
    'Fix a 15 cm gnomon (dowel or pencil) vertically at the centre of a large cardboard sheet using a small cardboard cone for support. Place it on flat ground in the sun, and mark the sheet\'s position so it can be returned exactly.',
    'From 10:00 to 15:00, mark the tip of the shadow every 20 minutes and write the clock time beside each mark. The shortest shadow is solar noon; note the clock time it happened.',
    'Measure the shortest shadow s and the gnomon height h. The Sun\'s noon altitude a = arctan(h/s). Your latitude φ = 90° − a + δ, where δ is the Sun\'s declination for the date (look it up; about +23° in June, 0° at the equinoxes, −23° in December).',
    'Compare with the latitude from a map. Repeat on two more days and average.',
    'Note the solar noon clock time. IST is set for 82.5° E; for every degree of longitude west of that, solar noon is 4 minutes later. Use this to estimate your longitude.',
    'Build the sundial: glue a triangular gnomon to a second sheet with its slope equal to your latitude, pointing true north (found from the noon shadow line). Mark hour lines from the shadow over a day.',
    'Check the sundial on later days: it will drift by up to ±15 minutes through the year due to the equation of time. Explain why.'
  ],
  code: [],
  cad: [{ file: 'theodolite-protractor.svg', kind: 'svg', description: 'Reuse the protractor to set the gnomon slope equal to your latitude.' }],
  safety: [s('Sun', 'Never look at the Sun; the shadow tells you everything. Use sunscreen and water on a hot day.')],
  accessibility: { lowVision: 'Shadow tips can be marked with pins and the pattern traced by touch; a phone light-sensor app finds the shadow edge by a drop in lux.', motor: 'A partner marks while the student reads the time.', hearing: 'No sound.', textOnly: 'Result: latitude and longitude estimates with the measurement table.' },
  versions: [v('1.0.0', '2026-04-02', 'First version.'), v('1.0.1', '2026-06-18', 'Added longitude from solar noon and equation-of-time note.')],
  tags: ['astronomy', 'geometry', 'shadows', 'latitude', 'no electronics', 'outdoor']
}
];

// ---- derive computed fields ----
function computeCost(components) {
  return components.reduce((sum, ci) => {
    const comp = COMPONENTS[ci.id];
    if (!comp) throw new Error('Unknown component ' + ci.id);
    return sum + comp.unitCost * ci.qty;
  }, 0);
}
function hashSha(str) { // stable short "commit sha" per version entry for display only
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
}

export const RESOURCES = RAW.map(r => {
  const versions = r.versions.map(ver => ({ ...ver, sha: hashSha(r.id + ver.version + ver.date) }));
  const latest = versions[versions.length - 1];
  return {
    ...r,
    versions,
    cost: computeCost(r.components),
    coreCost: computeCost(r.components.filter(x => x.core)),
    version: latest.version,
    updated: latest.date,
    ageLabel: r.ageMin + '+',
    hasAdaptations: !!(r.accessibility && (r.accessibility.lowVision || r.accessibility.motor || r.accessibility.hearing))
  };
});

export const BY_ID = Object.fromEntries(RESOURCES.map(r => [r.id, r]));
export function getResource(id) { return BY_ID[id] || null; }
