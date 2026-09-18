// OPENLAB — DIY spectrometer body (3D-printable)
// License: CC BY-SA 4.0. Units: mm. Print in PLA, 0.2 mm layers, 15 % infill, no supports.
// Geometry: a light-tight tube. Light enters through a 0.2 mm slit at one end,
// hits the grating at the far end at ~45°, and the first-order spectrum is
// imaged by a webcam/phone through the side port.

tube_len   = 120;   // slit-to-grating distance
tube_w     = 40;
tube_h     = 40;
wall       = 2;
slit_w     = 0.2;   // razor-blade slit is glued over this; this is just a window
slit_h     = 12;
grating_sz = 25;    // 25 x 25 mm grating window
cam_port_d = 14;    // webcam/phone lens port diameter
cam_angle  = 45;    // first-order angle for 1000 l/mm at ~550 nm is ~33°; 45° port gives room

module body() {
  difference() {
    cube([tube_len, tube_w, tube_h]);
    // hollow
    translate([wall, wall, wall]) cube([tube_len - 2*wall, tube_w - 2*wall, tube_h + 1]);
    // slit window at x = 0
    translate([-1, tube_w/2 - 2, tube_h/2 - slit_h/2]) cube([wall + 2, 4, slit_h]);
    // grating window at far end
    translate([tube_len - wall - 1, tube_w/2 - grating_sz/2, tube_h/2 - grating_sz/2])
      cube([wall + 2, grating_sz, grating_sz]);
    // camera port on the side wall, angled toward the grating
    translate([tube_len - 30, -1, tube_h/2]) rotate([-90, 0, 0]) cylinder(d = cam_port_d, h = wall + 2, $fn = 48);
  }
}

module lid() {
  difference() {
    cube([tube_len, tube_w, wall]);
    // lip so the lid sits in the tube
  }
  translate([wall + 0.3, wall + 0.3, -wall]) cube([tube_len - 2*wall - 0.6, tube_w - 2*wall - 0.6, wall]);
}

module grating_holder() {
  // slides over the far end; holds a 25 mm grating tilted at 45°
  difference() {
    cube([grating_sz + 6, grating_sz + 6, 3]);
    translate([3, 3, -1]) cube([grating_sz, grating_sz, 5]);
  }
}

body();
translate([0, tube_w + 10, 0]) lid();
translate([0, 2*tube_w + 20, 0]) grating_holder();
