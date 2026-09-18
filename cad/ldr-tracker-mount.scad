// OPENLAB — LDR light tracker: servo horn bracket with two LDR pockets and a shade fin
// License: CC BY-SA 4.0. Units: mm. Prints flat, no supports.
// The fin between the two LDRs casts a shadow on one sensor when the light is off-axis,
// which is what makes the tracking differential work.

plate_w = 40; plate_l = 30; plate_t = 3;
ldr_d   = 5.6;          // GL5528 body ~5 mm
ldr_gap = 20;           // centre-to-centre
fin_h   = 25; fin_t = 1.6;
horn_hole_d = 2.2;      // SG90 horn screw

difference() {
  cube([plate_w, plate_l, plate_t]);
  for (x = [plate_w/2 - ldr_gap/2, plate_w/2 + ldr_gap/2])
    translate([x, plate_l/2, -1]) cylinder(d = ldr_d, h = plate_t + 2, $fn = 32);
  // servo horn mounting: centre + two 7 mm offset holes match the SG90 single-arm horn
  translate([plate_w/2, 6, -1]) cylinder(d = horn_hole_d, h = 5, $fn = 24);
  translate([plate_w/2 - 7, 6, -1]) cylinder(d = horn_hole_d, h = 5, $fn = 24);
  translate([plate_w/2 + 7, 6, -1]) cylinder(d = horn_hole_d, h = 5, $fn = 24);
}
// shade fin
translate([plate_w/2 - fin_t/2, 10, plate_t]) cube([fin_t, plate_l - 10, fin_h]);
