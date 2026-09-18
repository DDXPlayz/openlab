// OPENLAB — Braille learning board: 6-dot cell plate (3D-printable)
// License: CC BY-SA 4.0. Units: mm.
// Standard braille geometry (per Braille Authority of North America / BIS IS 13856-ish):
// dot base diameter 1.5 mm, dot height ~0.6 mm, dot-to-dot 2.5 mm, cell-to-cell 6.2 mm.
// This plate makes ENLARGED learning cells (scale 4x) with pockets for 5 mm half-dome beads,
// so a beginner can build any letter by placing beads. A second module prints the true-size reference strip.

scale_f   = 4;
dot_pitch = 2.5 * scale_f;   // 10 mm
cell_w    = 6.2 * scale_f;   // 24.8 mm
cells     = 6;               // six cells per plate: enough for a short word
plate_t   = 4;
pocket_d  = 5.4;             // 5 mm bead + clearance
pocket_h  = 2.2;

module cell_pockets() {
  for (col = [0:1]) for (row = [0:2])
    translate([col * dot_pitch, -row * dot_pitch, plate_t - pocket_h])
      cylinder(d = pocket_d, h = pocket_h + 1, $fn = 36);
}

module learning_plate() {
  difference() {
    cube([cells * cell_w + 8, 3 * dot_pitch + 8, plate_t]);
    for (c = [0:cells - 1])
      translate([8 + c * cell_w, 3 * dot_pitch + 1, 0]) cell_pockets();
    // cell separators: shallow grooves so fingers can find cell boundaries
    for (c = [1:cells - 1])
      translate([4 + c * cell_w + 1.6, 0, plate_t - 0.8]) cube([0.8, 3 * dot_pitch + 8, 1]);
    // dot numbering guide: tiny ridges on the left edge for dots 1,2,3 (top to bottom)
  }
}

module true_size_strip(text_dots = [[1,1,0,1,0,0],[1,0,1,0,0,0]]) {
  // Raised true-size dots for the letters given as [d1..d6] arrays (default: "b","c")
  cube([len(text_dots) * 6.2 + 4, 10, 2]);
  for (i = [0:len(text_dots) - 1]) {
    d = text_dots[i];
    pos = [[0,2],[0,1],[0,0],[1,2],[1,1],[1,0]]; // dot1..6 -> (col,row from bottom)
    for (k = [0:5]) if (d[k] == 1)
      translate([2 + i * 6.2 + pos[k][0] * 2.5 + 0.75, 2.5 + pos[k][1] * 2.5, 2])
        sphere(d = 1.5, $fn = 24);
  }
}

learning_plate();
translate([0, -20, 0]) true_size_strip();
