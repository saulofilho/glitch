/* SPDX-License-Identifier: GPL-3.0-only
 * Copyright (C) 2026 GL!TCH
 * The glitch landscape, as the firmware draws it at HOME and at boot (firmware/src/ui.c: gl_h, gl_tri, gl_cell,
 * gl_scene), cell for cell, in whole numbers: a posterised sky in wavy bands, its corner torn to pink and violet,
 * dithered hills, a striped plain. glLand(canvas, t, tear): a cell a canvas pixel; t moves the bands, tear (0..8)
 * shifts rows sideways. */
(function () {
  "use strict";
  var MINT = [0x8f, 0xe5, 0x8c], TEAL = [0x19, 0xd9, 0x92], YEL = [0xe6, 0xe0, 0x8a], MAG = [0xc8, 0x18, 0xa0],
      PUR = [0x5a, 0x1f, 0x9a], PINK = [0xe8, 0x7a, 0x96], NAVY = [0x25, 0x49, 0x7a], DEEP = [0x12, 0x24, 0x4a],
      BRICK = [0xa8, 0x48, 0x5a];
  var COOL = [MINT, TEAL, MINT, YEL, MINT, TEAL, YEL, MINT], HOT = [MAG, PUR, TEAL, DEEP, PINK, MAG, MINT, PUR];
  function h2(x, y) {
    var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  function d(a, b) { return Math.trunc(a / b); }
  function tri(v, p) { v %= p; if (v < 0) v += p; return v < d(p, 2) ? v : p - v; }
  function peak(x, cols, rows, at, hi, wide) {
    var c = d(cols * at, 100), top = d(rows * hi, 30);
    return top - d(d(Math.abs(x - c) * rows * hi, 30), d(cols * wide, 100));
  }
  function cell(x, y, cols, rows, t) {
    var hz = d(rows * 2, 3), h = h2(x >>> 0, y), top, g, k, band, corner;
    if (x < 0) x = 0;
    if (x >= cols) x = cols - 1;
    top = hz - Math.max(peak(x, cols, rows, 27, 8, 30), peak(x, cols, rows, 64, 5, 18), peak(x, cols, rows, 88, 3, 14));
    if (y >= hz) {
      g = y - hz; k = d(g * 9, rows - hz) + ((g & 1) ? 3 : 0);
      if ((h2(x, y + 99) & 31) === 0) return BRICK;
      return (h & 7) < k ? ((h & 24) ? NAVY : DEEP) : MINT;
    }
    if (y >= top) {
      if (y - top < 2) return (h & 3) ? BRICK : NAVY;
      return (h & 7) === 0 ? BRICK : (h & 7) === 1 ? DEEP : NAVY;
    }
    band = d(x + 3 * y + 2 * tri(x + y + t, 36), 5) & 7;
    corner = x - 2 * y - d(cols * 52, 100);
    if (corner > 0 || (corner > -3 && (h & 1))) return HOT[band];
    if (tri(x + 2 * tri(y, 14), 46) + d(tri(y * 3 + d(x, 4), 30), 2) < 9 && y > d(rows, 8)) return MINT;
    return COOL[band];
  }
  window.glLand = function (cv, t, tear) {
    var cols = cv.width, rows = cv.height, cx = cv.getContext("2d"), im = cx.createImageData(cols, rows), p = im.data, x, y, r, sh, c, i = 0;
    for (y = 0; y < rows; y++) {
      r = h2(y, d(t, 3) + 7);
      sh = tear && (r & 15) < tear ? ((r >>> 8) & 7) - 3 : 0;
      for (x = 0; x < cols; x++) {
        c = cell(x + sh, y, cols, rows, t);
        p[i++] = c[0]; p[i++] = c[1]; p[i++] = c[2]; p[i++] = 255;
      }
    }
    cx.putImageData(im, 0, 0);
  };
})();
