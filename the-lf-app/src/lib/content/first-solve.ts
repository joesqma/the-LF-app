export type FirstSolveStep = {
  id: number;
  name: string;
  desc: string;
  videos: {
    source: string;
    videoId: string;
    startSeconds: number;
    label: string;
  }[];
  keyPoints: string[];
};

export const FIRST_SOLVE_STEPS: FirstSolveStep[] = [
  {
    id: 0,
    name: "Basics & Notation",
    desc: "Learn the anatomy of the cube, how to read move notation, and what an algorithm is.",
    videos: [
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 12,
        label: "0:12",
      },
    ],
    keyPoints: [
      "The cube has 6 faces: Up (U), Down (D), Front (F), Back (B), Left (L), Right (R).",
      "A move without a symbol (e.g. R) means turn that face clockwise 90°.",
      "A prime symbol (R') means turn counter-clockwise 90°.",
      "A 2 (e.g. R2) means turn that face 180°.",
      "An algorithm is a fixed sequence of moves that achieves a specific result.",
    ],
  },
  {
    id: 1,
    name: "The Cross",
    desc: "Solve the four edge pieces on the bottom face to form a white cross.",
    videos: [
      {
        source: "J Perm",
        videoId: "zGu4QSKmj4Y",
        startSeconds: 168,
        label: "2:48",
      },
      {
        source: "Cube Bros",
        videoId: "PW2J8IblczM",
        startSeconds: 53,
        label: "0:53",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 174,
        label: "2:54",
      },
    ],
    keyPoints: [
      "Always build the cross on the bottom face (white centre facing down).",
      "Look at each white edge piece's coloured sticker to know where it belongs.",
      "Solve the cross edges in any order — start with the easiest.",
      "Don't worry about efficiency yet — just get all four edges in place.",
    ],
  },
  {
    id: 2,
    name: "First Layer Corners",
    desc: "Place the four white corner pieces to complete the entire first layer.",
    videos: [
      {
        source: "J Perm",
        videoId: "7Ron6MN45LY",
        startSeconds: 105,
        label: "1:45",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 246,
        label: "4:06",
      },
    ],
    keyPoints: [
      "Find a white corner in the top layer directly above its target slot.",
      "Use the algorithm: R U R' U' — repeat until the corner drops in correctly.",
      "Never physically twist a corner — use the algorithm.",
      "If a white corner is stuck in the bottom layer, use R U R' to bring it up first.",
    ],
  },
  {
    id: 3,
    name: "Second Layer",
    desc: "Insert the four middle-layer edge pieces to complete the first two layers.",
    videos: [
      {
        source: "J Perm",
        videoId: "7Ron6MN45LY",
        startSeconds: 241,
        label: "4:01",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 330,
        label: "5:30",
      },
    ],
    keyPoints: [
      "Look for edge pieces in the top layer that have no yellow sticker.",
      "There are two algorithms — one for edges going left, one for going right.",
      "If an edge is in the middle layer but in the wrong slot, pop it out first.",
      "After this step you should have a fully solved bottom two layers.",
    ],
  },
  {
    id: 4,
    name: "Yellow Cross",
    desc: "Orient the top-layer edges to form a yellow cross on the top face.",
    videos: [
      {
        source: "J Perm",
        videoId: "7Ron6MN45LY",
        startSeconds: 345,
        label: "5:45",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 416,
        label: "6:56",
      },
    ],
    keyPoints: [
      "Only one algorithm: F R U R' U' F'.",
      "Look at the top face — you'll see a dot, L-shape, or line pattern.",
      "Each pattern requires a different number of repetitions.",
      "The cross only needs yellow stickers facing up — edges don't need to match sides yet.",
    ],
  },
  {
    id: 5,
    name: "Matching Corners",
    desc: "Move the yellow corner pieces to their correct positions around the top layer.",
    videos: [
      {
        source: "J Perm",
        videoId: "7Ron6MN45LY",
        startSeconds: 389,
        label: "6:29",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 538,
        label: "8:58",
      },
    ],
    keyPoints: [
      "Find a corner already in the correct position (colours match adjacent centres).",
      "Hold that corner in the front-right-top position.",
      "Apply the algorithm until all corners are in the right spots.",
      "Corners don't need to be twisted correctly yet — just in the right positions.",
    ],
  },
  {
    id: 6,
    name: "Finish the Cube",
    desc: "Orient the final corners and cycle the last edges to complete your first ever solve.",
    videos: [
      {
        source: "J Perm",
        videoId: "7Ron6MN45LY",
        startSeconds: 497,
        label: "8:17",
      },
      {
        source: "Bright Side",
        videoId: "KGvQRaK1mvs",
        startSeconds: 578,
        label: "9:38",
      },
    ],
    keyPoints: [
      "Use R' D' R D (repeated) to orient each corner — hold the cube still.",
      "Only rotate the top layer (U face) between corner orientations.",
      "Finally, cycle the top edges into place with the last algorithm.",
      "If the cube looks more scrambled mid-algorithm — keep going. It always resolves.",
    ],
  },
];
