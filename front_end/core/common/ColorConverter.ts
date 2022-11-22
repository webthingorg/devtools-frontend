// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Implementation of this module and all the tests are heavily influenced by
 * https://source.chromium.org/chromium/chromium/src/+/main:ui/gfx/color_conversions.cc
*/

// https://en.wikipedia.org/wiki/CIELAB_color_space#Converting_between_CIELAB_and_CIEXYZ_coordinates
const D50_X = 0.9642;
const D50_Y = 1.0;
const D50_Z = 0.8251;

type Array3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

class Vector3 {
  values: [number, number, number] = [0, 0, 0];
  constructor(values?: [number, number, number]) {
    if (values) {
      this.values = values;
    }
  }
}

class Matrix3x3 {
  values: Array3x3 = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  constructor(values?: Array3x3) {
    if (values) {
      this.values = values;
    }
  }

  apply(other: Vector3): Vector3 {
    const dst = new Vector3();
    for (let row = 0; row < 3; ++row) {
      dst.values[row] = this.values[row][0] * other.values[0] + this.values[row][1] * other.values[1] +
          this.values[row][2] * other.values[2];
    }
    return dst;
  }

  concat(other: Matrix3x3): Matrix3x3 {
    const m = new Matrix3x3([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        m.values[r][c] = this.values[r][0] * other.values[0][c] + this.values[r][1] * other.values[1][c] +
            this.values[r][2] * other.values[2][c];
      }
    }
    return m;
  }

  invert(): Matrix3x3|null {
    const a00 = this.values[0][0], a01 = this.values[1][0], a02 = this.values[2][0], a10 = this.values[0][1],
          a11 = this.values[1][1], a12 = this.values[2][1], a20 = this.values[0][2], a21 = this.values[1][2],
          a22 = this.values[2][2];

    let b0 = a00 * a11 - a01 * a10, b1 = a00 * a12 - a02 * a10, b2 = a01 * a12 - a02 * a11, b3 = a20, b4 = a21,
        b5 = a22;

    const determinant = b0 * b5 - b1 * b4 + b2 * b3;

    if (determinant === 0) {
      return null;
    }

    const invdet = 1.0 / determinant;
    if (!Number.isFinite(invdet)) {
      return null;
    }

    b0 *= invdet;
    b1 *= invdet;
    b2 *= invdet;
    b3 *= invdet;
    b4 *= invdet;
    b5 *= invdet;

    const invertedMatrix = new Matrix3x3();
    invertedMatrix.values[0][0] = (a11 * b5 - a12 * b4);
    invertedMatrix.values[1][0] = (a02 * b4 - a01 * b5);
    invertedMatrix.values[2][0] = (Number(b2));
    invertedMatrix.values[0][1] = (a12 * b3 - a10 * b5);
    invertedMatrix.values[1][1] = (a00 * b5 - a02 * b3);
    invertedMatrix.values[2][1] = (-b1);
    invertedMatrix.values[0][2] = (a10 * b4 - a11 * b3);
    invertedMatrix.values[1][2] = (a01 * b3 - a00 * b4);
    invertedMatrix.values[2][2] = (Number(b0));

    for (let r = 0; r < 3; ++r) {
      for (let c = 0; c < 3; ++c) {
        if (!Number.isFinite(invertedMatrix.values[r][c])) {
          return null;
        }
      }
    }

    return invertedMatrix;
  }
}

function adaptToXYZD50(wx: number, wy: number): Matrix3x3 {
  // Assumes that Y is 1.0f.
  const wXYZ = new Vector3([wx / wy, 1, (1 - wx - wy) / wy]);

  // Now convert toXYZ matrix to toXYZD50.
  const wXYZD50 = new Vector3([0.96422, 1.0, 0.82521]);

  // Calculate the chromatic adaptation matrix.  We will use the Bradford method, thus
  // the matrices below.  The Bradford method is used by Adobe and is widely considered
  // to be the best.
  const xyzToLms = new Matrix3x3([
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296],
  ]);
  const lmxToXyz = new Matrix3x3([
    [0.9869929, -0.1470543, 0.1599627],
    [0.4323053, 0.5183603, 0.0492912],
    [-0.0085287, 0.0400428, 0.9684867],
  ]);

  const srcCone = xyzToLms.apply(wXYZ);
  const dstCone = xyzToLms.apply(wXYZD50);

  let toXYZD50 = new Matrix3x3([
    [dstCone.values[0] / srcCone.values[0], 0, 0],
    [0, dstCone.values[1] / srcCone.values[1], 0],
    [0, 0, dstCone.values[2] / srcCone.values[2]],
  ]);

  toXYZD50 = toXYZD50.concat(xyzToLms);
  toXYZD50 = lmxToXyz.concat(toXYZD50);

  return toXYZD50;
}

class ColorSpacePrimaries {
  rx: number;
  ry: number;
  gx: number;
  gy: number;
  bx: number;
  by: number;
  wx: number;
  wy: number;

  constructor(rx: number, ry: number, gx: number, gy: number, bx: number, by: number, wx: number, wy: number) {
    this.rx = rx;
    this.ry = ry;
    this.gx = gx;
    this.gy = gy;
    this.bx = bx;
    this.by = by;
    this.wx = wx;
    this.wy = wy;
  }

  toXYZD50(): Matrix3x3|null {
    // First, we need to convert xy values (primaries) to XYZ.
    const primaries: Matrix3x3 = new Matrix3x3([
      [this.rx, this.gx, this.bx],
      [this.ry, this.gy, this.by],
      [1 - this.rx - this.ry, 1 - this.gx - this.gy, 1 - this.bx - this.by],
    ]);

    const primariesInv = primaries.invert();
    if (!primariesInv) {
      return null;
    }

    // Assumes that Y is 1.0f.
    const wXYZ = new Vector3([this.wx / this.wy, 1, (1 - this.wx - this.wy) / this.wy]);
    const XYZ = primariesInv.apply(wXYZ);

    let toXYZ = new Matrix3x3([
      [XYZ.values[0], 0, 0],
      [0, XYZ.values[1], 0],
      [0, 0, XYZ.values[2]],
    ]);

    toXYZ = primaries.concat(toXYZ);

    const DXtoD50 = adaptToXYZD50(this.wx, this.wy);
    if (!DXtoD50) {
      return null;
    }

    return DXtoD50.concat(toXYZ);
  }
}

// //////////////////////////////////////////////////////////////////////////////
// CSS Color Level 4 predefined and xyz color spaces.

const COLOR_SPACE_PRIMARIES = {
  A98RGB: new ColorSpacePrimaries(0.64, 0.33, 0.21, 0.71, 0.15, 0.06, 0.3127, 0.3290),
  ProPhotoRGB: new ColorSpacePrimaries(0.7347, 0.2653, 0.1596, 0.8404, 0.0366, 0.0001, 0.34567, 0.35850),

  XYZD50: new ColorSpacePrimaries(1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.34567, 0.35850),
  XYZD65: new ColorSpacePrimaries(1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.3127, 0.3290),
};

// A transfer function mapping encoded values to linear values,
// represented by this 7-parameter piecewise function:
//
//   linear = sign(encoded) *  (c*|encoded| + f)       , 0 <= |encoded| < d
//          = sign(encoded) * ((a*|encoded| + b)^g + e), d <= |encoded|
//
// (A simple gamma transfer function sets g to gamma and a to 1.)
class TransferFunction {
  g: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;

  constructor(g: number, a: number, b: number = 0, c: number = 0, d: number = 0, e: number = 0, f: number = 0) {
    this.g = g;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.e = e;
    this.f = f;
  }

  eval(val: number): number {
    const sign = val < 0 ? -1.0 : 1.0;
    const abs = val * sign;

    // 0 <= |encoded| < d path
    if (abs < this.d) {
      return sign * (this.c * abs + this.f);
    }

    // d <= |encoded| path
    return sign * (Math.pow(this.a * abs + this.b, this.g) + this.e);
  }
}

const NAMED_TRANSFER_FN = {
  sRGB: new TransferFunction(2.4, (1 / 1.055), (0.055 / 1.055), (1 / 12.92), 0.04045, 0.0, 0.0),
  sRGB_INVERSE: new TransferFunction(0.416667, 1.13728, -0, 12.92, 0.0031308, -0.0549698, -0),

  proPhotoRGB: new TransferFunction(1.8, 1),
  proPhotoRGB_INVERSE: new TransferFunction(0.555556, 1, -0, 0, 0, 0, 0),

  k2Dot2: new TransferFunction(2.2, 1.0),
  k2Dot2_INVERSE: new TransferFunction(0.454545, 1),

  rec2020: new TransferFunction(2.22222, 0.909672, 0.0903276, 0.222222, 0.0812429, 0, 0),
  rec2020_INVERSE: new TransferFunction(0.45, 1.23439, -0, 4.5, 0.018054, -0.0993195, -0),
};

const NAMED_GAMUTS = {
  sRGB: new Matrix3x3([
    [0.436065674, 0.385147095, 0.143066406],
    [0.222488403, 0.716873169, 0.060607910],
    [0.013916016, 0.097076416, 0.714096069],
  ]),
  displayP3: new Matrix3x3([
    [0.515102, 0.291965, 0.157153],
    [0.241182, 0.692236, 0.0665819],
    [-0.00104941, 0.0418818, 0.784378],
  ]),
  adobeRGB: new Matrix3x3([
    [0.60974, 0.20528, 0.14919],
    [0.31111, 0.62567, 0.06322],
    [0.01947, 0.06087, 0.74457],
  ]),
  rec2020: new Matrix3x3([
    [0.673459, 0.165661, 0.125100],
    [0.279033, 0.675338, 0.0456288],
    [-0.00193139, 0.0299794, 0.797162],
  ]),
  xyz: new Matrix3x3([
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
  ]),

};

function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function radToDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

function applyTransferFns(fn: TransferFunction, r: number, g: number, b: number): [number, number, number] {
  return [fn.eval(r), fn.eval(g), fn.eval(b)];
}

const OKLAB_TO_LMS_MATRIX = new Matrix3x3([
  [0.99999999845051981432, 0.39633779217376785678, 0.21580375806075880339],
  [1.0000000088817607767, -0.1055613423236563494, -0.063854174771705903402],
  [1.0000000546724109177, -0.089484182094965759684, -1.2914855378640917399],
]);

// Inverse of the above matrix
const LMS_TO_OKLAB_MATRIX = new Matrix3x3([
  [0.2104542553, 0.7936177849999999, -0.0040720468],
  [1.9779984951000003, -2.4285922049999997, 0.4505937099000001],
  [0.025904037099999982, 0.7827717662, -0.8086757660000001],
]);

const XYZ_TO_LMS_MATRIX = new Matrix3x3([
  [0.8190224432164319, 0.3619062562801221, -0.12887378261216414],
  [0.0329836671980271, 0.9292868468965546, 0.03614466816999844],
  [0.048177199566046255, 0.26423952494422764, 0.6335478258136937],
]);

// Inverse of XYZ_TO_LMS_MATRIX
const LMS_TO_XYZ_MATRIX = new Matrix3x3([
  [1.226879873374156, -0.5578149965554814, 0.2813910501772159],
  [-0.040575762624313734, 1.1122868293970596, -0.07171106666151703],
  [-0.07637294974672144, -0.4214933239627915, 1.586924024427242],
]);

const XYZD65_TO_XYZD50_MATRIX = adaptToXYZD50(0.3127, 0.3290);

const XYZD65_TO_SRGB_MATRIX = new Matrix3x3([
                                [3.134112151374599, -1.6173924597114966, -0.4906334036481285],
                                [-0.9787872938826594, 1.9162795854799963, 0.0334547139520088],
                                [0.07198304248352326, -0.2289858493321844, 1.4053851325241447],
                              ]).concat(XYZD65_TO_XYZD50_MATRIX);

function labToXyzd50(l: number, a: number, b: number): [number, number, number] {
  let y = (l + 16.0) / 116.0;
  let x = y + a / 500.0;
  let z = y - b / 200.0;

  function labInverseTransferFunction(t: number): number {
    const delta = (24.0 / 116.0);

    if (t <= delta) {
      return (108.0 / 841.0) * (t - (16.0 / 116.0));
    }

    return t * t * t;
  }

  x = labInverseTransferFunction(x) * D50_X;
  y = labInverseTransferFunction(y) * D50_Y;
  z = labInverseTransferFunction(z) * D50_Z;

  return [x, y, z];
}

function xyzd50ToLab(x: number, y: number, z: number): [number, number, number] {
  function labTransferFunction(t: number): number {
    const deltaLimit: number = (24.0 / 116.0) * (24.0 / 116.0) * (24.0 / 116.0);

    if (t <= deltaLimit) {
      return (841.0 / 108.0) * t + (16.0 / 116.0);
    }
    return Math.pow(t, 1.0 / 3.0);
  }

  x = labTransferFunction(x / D50_X);
  y = labTransferFunction(y / D50_Y);
  z = labTransferFunction(z / D50_Z);

  const l = 116.0 * y - 16.0;
  const a = 500.0 * (x - y);
  const b = 200.0 * (y - z);

  return [l, a, b];
}

function oklabToXyzd65(l: number, a: number, b: number): [number, number, number] {
  const labInput = new Vector3([l / 100, a, b]);
  const lmsIntermediate = OKLAB_TO_LMS_MATRIX.apply(labInput);
  lmsIntermediate.values[0] = lmsIntermediate.values[0] * lmsIntermediate.values[0] * lmsIntermediate.values[0];
  lmsIntermediate.values[1] = lmsIntermediate.values[1] * lmsIntermediate.values[1] * lmsIntermediate.values[1];
  lmsIntermediate.values[2] = lmsIntermediate.values[2] * lmsIntermediate.values[2] * lmsIntermediate.values[2];
  const xyzOutput = LMS_TO_XYZ_MATRIX.apply(lmsIntermediate);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd65ToOklab(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  const lmsIntermediate = XYZ_TO_LMS_MATRIX.apply(xyzInput);

  lmsIntermediate.values[0] = Math.pow(lmsIntermediate.values[0], 1.0 / 3.0);
  lmsIntermediate.values[1] = Math.pow(lmsIntermediate.values[1], 1.0 / 3.0);
  lmsIntermediate.values[2] = Math.pow(lmsIntermediate.values[2], 1.0 / 3.0);

  const labOutput = LMS_TO_OKLAB_MATRIX.apply(lmsIntermediate);
  return [labOutput.values[0] * 100.0, labOutput.values[1], labOutput.values[2]];
}

function lchToLab(l: number, c: number, h: number|undefined): [number, number, number] {
  if (h === undefined) {
    return [l, 0, 0];
  }

  return [l, c * Math.cos(degToRad(h)), c * Math.sin(degToRad(h))];
}

function labToLch(l: number, a: number, b: number): [number, number, number] {
  return [l, Math.sqrt(a * a + b * b), radToDeg(Math.atan2(b, a))];
}

function displayP3ToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const [mappedR, mappedG, mappedB] = applyTransferFns(NAMED_TRANSFER_FN.sRGB, r, g, b);
  const rgbInput = new Vector3([mappedR, mappedG, mappedB]);
  const xyzOutput = NAMED_GAMUTS.displayP3.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd50ToDisplayP3(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);

  // We're sure that inverse of this matrix exists
  const invertedP3 = NAMED_GAMUTS.displayP3.invert() as Matrix3x3;
  const rgbOutput = invertedP3.apply(xyzInput);
  return applyTransferFns(
      NAMED_TRANSFER_FN.sRGB_INVERSE, rgbOutput.values[0], rgbOutput.values[1], rgbOutput.values[2]);
}

function proPhotoToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const [mappedR, mappedG, mappedB] = applyTransferFns(NAMED_TRANSFER_FN.proPhotoRGB, r, g, b);
  const rgbInput = new Vector3([mappedR, mappedG, mappedB]);
  // We're sure that toXYZD50 matrix exists for ProPhotoRGB
  const toXyzd50Matrix = COLOR_SPACE_PRIMARIES.ProPhotoRGB.toXYZD50() as Matrix3x3;
  const xyzOutput = toXyzd50Matrix.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd50ToProPhoto(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that toXYZD50 matrix exists for ProPhotoRGB
  const toXyzd50Matrix = COLOR_SPACE_PRIMARIES.ProPhotoRGB.toXYZD50() as Matrix3x3;
  // We're sure that inverse of this matrix exists
  const invertedToXyzd50Matrix = toXyzd50Matrix.invert() as Matrix3x3;
  const rgbOutput = invertedToXyzd50Matrix.apply(xyzInput);
  return applyTransferFns(
      NAMED_TRANSFER_FN.proPhotoRGB_INVERSE, rgbOutput.values[0], rgbOutput.values[1], rgbOutput.values[2]);
}

function adobeRGBToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const [mappedR, mappedG, mappedB] = applyTransferFns(NAMED_TRANSFER_FN.k2Dot2, r, g, b);
  const rgbInput = new Vector3([mappedR, mappedG, mappedB]);
  const xyzOutput = NAMED_GAMUTS.adobeRGB.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd50ToAdobeRGB(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that inverse of this matrix exists
  const invertedAdobeRgbMatrix = NAMED_GAMUTS.adobeRGB.invert() as Matrix3x3;
  const rgbOutput = invertedAdobeRgbMatrix.apply(xyzInput);
  return applyTransferFns(
      NAMED_TRANSFER_FN.k2Dot2_INVERSE, rgbOutput.values[0], rgbOutput.values[1], rgbOutput.values[2]);
}

function rec2020ToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const [mappedR, mappedG, mappedB] = applyTransferFns(NAMED_TRANSFER_FN.rec2020, r, g, b);
  const rgbInput = new Vector3([mappedR, mappedG, mappedB]);
  const xyzOutput = NAMED_GAMUTS.rec2020.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd50ToRec2020(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that inverse of this matrix exists
  const invertedRec2020Matrix = NAMED_GAMUTS.rec2020.invert() as Matrix3x3;
  const rgbOutput = invertedRec2020Matrix.apply(xyzInput);
  return applyTransferFns(
      NAMED_TRANSFER_FN.rec2020_INVERSE, rgbOutput.values[0], rgbOutput.values[1], rgbOutput.values[2]);
}

function xyzd50ToD65(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that inverse of this matrix exists
  const invertedToXyzd50Matrix = XYZD65_TO_XYZD50_MATRIX.invert() as Matrix3x3;
  const xyzOutput = invertedToXyzd50Matrix.apply(xyzInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd65ToD50(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  const xyzOutput = XYZD65_TO_XYZD50_MATRIX.apply(xyzInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd65TosRGBLinear(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  const rgbResult = XYZD65_TO_SRGB_MATRIX.apply(xyzInput);
  return [rgbResult.values[0], rgbResult.values[1], rgbResult.values[2]];
}

function xyzd50TosRGBLinear(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that inverse of this matrix exists
  const invertedSrgbGamut = NAMED_GAMUTS.sRGB.invert() as Matrix3x3;
  const rgbResult = invertedSrgbGamut.apply(xyzInput);
  return [rgbResult.values[0], rgbResult.values[1], rgbResult.values[2]];
}

function srgbLinearToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const rgbInput = new Vector3([r, g, b]);
  const xyzOutput = NAMED_GAMUTS.sRGB.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function srgbToXyzd50(r: number, g: number, b: number): [number, number, number] {
  const [mappedR, mappedG, mappedB] = applyTransferFns(NAMED_TRANSFER_FN.sRGB, r, g, b);
  const rgbInput = new Vector3([mappedR, mappedG, mappedB]);
  const xyzOutput = NAMED_GAMUTS.sRGB.apply(rgbInput);
  return [xyzOutput.values[0], xyzOutput.values[1], xyzOutput.values[2]];
}

function xyzd50ToSrgb(x: number, y: number, z: number): [number, number, number] {
  const xyzInput = new Vector3([x, y, z]);
  // We're sure that inverse of this matrix exists
  const invertedSrgbGamut = NAMED_GAMUTS.sRGB.invert() as Matrix3x3;
  const rgbOutput = invertedSrgbGamut.apply(xyzInput);
  return applyTransferFns(
      NAMED_TRANSFER_FN.sRGB_INVERSE, rgbOutput.values[0], rgbOutput.values[1], rgbOutput.values[2]);
}

export {
  labToXyzd50,
  xyzd50ToLab,
  oklabToXyzd65,
  xyzd65ToOklab,
  lchToLab,
  labToLch,
  displayP3ToXyzd50,
  xyzd50ToDisplayP3,
  proPhotoToXyzd50,
  xyzd50ToProPhoto,
  adobeRGBToXyzd50,
  xyzd50ToAdobeRGB,
  rec2020ToXyzd50,
  xyzd50ToRec2020,
  xyzd50ToD65,
  xyzd65ToD50,
  xyzd65TosRGBLinear,
  xyzd50TosRGBLinear,
  srgbLinearToXyzd50,
  srgbToXyzd50,
  xyzd50ToSrgb,
};
