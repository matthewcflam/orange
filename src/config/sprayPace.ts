/**
 * "who?" spray pace: how long the nozzle takes between each pair of anchor
 * points in assets-src/svg/who-spray.svg, in ms. Edit freely; the spray lasts
 * as long as everything here adds up to (now 2501 ms).
 *
 * Points are named by letter and index along the path: w0 is the w's first
 * point. Within a segment the nozzle still slows on curves and speeds up on
 * straights (src/spray/paceModel.ts); these only set each segment's total.
 * The comments are the starting values' length and average speed; they go
 * stale once you edit (the dev overlay shows live numbers).
 *
 * Dev: open /?spray-debug to see every point labelled with its ms, coloured
 * by speed; save this file to replay, or press R.
 * Starting values: node scripts/spray-pace.mjs (handwriting model).
 */
export interface StrokePace {
  readonly letter: string;
  /** One value per segment: the path's anchor points − 1. */
  readonly segmentsMs: readonly number[];
  /** The can lifts off before the next stroke. */
  readonly liftMs?: number;
}

export const SPRAY_PACE: { readonly leadMs: number; readonly strokes: readonly StrokePace[] } = {
  /** Before the first stroke (the hiss starts here). */
  leadMs: 250,
  strokes: [
    {
      letter: "w",
      segmentsMs: [
          81, // w0 → w1      74px    914 px/s
          17, // w1 → w2      10px    612 px/s
          72, // w2 → w3      93px   1287 px/s
          49, // w3 → w4      51px   1041 px/s
          22, // w4 → w5      12px    556 px/s
          19, // w5 → w6      12px    645 px/s
          49, // w6 → w7      36px    729 px/s
          43, // w7 → w8      45px   1053 px/s
          24, // w8 → w9      29px   1227 px/s
          67, // w9 → w10     70px   1041 px/s
          38, // w10 → w11    32px    831 px/s
          43, // w11 → w12    26px    607 px/s
      ],
      liftMs: 110,
    },
    {
      letter: "h",
      segmentsMs: [
          47, // h0 → h1      24px    508 px/s
          45, // h1 → h2      80px   1769 px/s
          23, // h2 → h3      23px   1005 px/s
          66, // h3 → h4      62px    942 px/s
          43, // h4 → h5      52px   1216 px/s
          57, // h5 → h6      65px   1132 px/s
          16, // h6 → h7       8px    485 px/s
          53, // h7 → h8      13px    249 px/s
      ],
      liftMs: 120,
    },
    {
      letter: "o",
      segmentsMs: [
          75, // o0 → o1      48px    636 px/s
          27, // o1 → o2      26px    975 px/s
          23, // o2 → o3      27px   1166 px/s
          52, // o3 → o4      50px    970 px/s
          26, // o4 → o5      18px    703 px/s
          33, // o5 → o6      36px   1079 px/s
          43, // o6 → o7      57px   1332 px/s
          17, // o7 → o8      13px    776 px/s
          17, // o8 → o9      10px    582 px/s
          43, // o9 → o10     44px   1018 px/s
          35, // o10 → o11    26px    746 px/s
      ],
      liftMs: 100,
    },
    {
      letter: "?",
      segmentsMs: [
         117, // ?0 → ?1     182px   1558 px/s
          45, // ?1 → ?2      65px   1438 px/s
          22, // ?2 → ?3      23px   1039 px/s
          17, // ?3 → ?4       9px    543 px/s
          65, // ?4 → ?5      96px   1473 px/s
          44, // ?5 → ?6     101px   2289 px/s
          33, // ?6 → ?7      45px   1371 px/s
          13, // ?7 → ?8      15px   1151 px/s
          10, // ?8 → ?9       7px    724 px/s
      ],
      liftMs: 140,
    },
    {
      letter: ".",
      segmentsMs: [
         150, // .0 → .1       1px      6 px/s
      ],
    },
  ],
};
