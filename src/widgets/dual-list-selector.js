var blessed = require("blessed"),
  contrib = require("../"),
  screen = blessed.screen();

const TABLE_DATA_LEFT = [
  ["Tame Impala", "Let it Happen"],
  ["Tame Impala", "Nangs"],
  ["Tame Impala", "The Moment"],
  ["Tame Impala", "Yes I'm Changing"],
  ["Tame Impala", "Eventually"],
  ["Tame Impala", "Gossip"],
  ["Tame Impala", "The Less I Know The Better"],
  ["Tame Impala", "Past Life"],
  ["Tame Impala", "Disciples"]
];

const TABLE_DATA_RIGHT = [
  ["Melody's Echo Chamber", "Cross My Heart"],
  ["Melody's Echo Chamber", "Breathe in, Breathe Out"],
  ["Melody's Echo Chamber", "Desert Horse"],
  ["Melody's Echo Chamber", "Var Har Du Vart?"],
  ["Melody's Echo Chamber", "Quand Les Larmes D'un Ange Font Danser La Neige"],
  [
    "Melody's Echo Chamber",
    "Visions of Someone Special, On a Wall of Reflections"
  ],
  ["Melody's Echo Chamber", "Shirim"]
];

var grid = new contrib.grid({ rows: 1, cols: 2, screen: screen });

var leftTable = grid.set(0, 0, 1, 1, contrib.table, {
  keys: true,
  vi: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  label: "Queue",
  width: "50%",
  height: "100%",
  border: { type: "line", fg: "grey" },
  columnSpacing: 8,
  columnWidth: [20, 100]
});

var rightTable = grid.set(0, 1, 1, 1, contrib.table, {
  keys: true,
  vi: true,
  fg: "white",
  selectedFg: "white",
  selectedBg: "blue",
  interactive: true,
  label: "Melody's Echo Chamber - Bon Voyage",
  width: "50%",
  height: "100%",
  border: { type: "line", fg: "grey" },
  columnSpacing: 8,
  columnWidth: [20, 100]
});

let leftFocussed = true;
leftTable.focus();

screen.key(["tab"], function() {
  if (leftFocussed) {
    rightTable.focus();
    leftFocussed = false;
  } else {
    leftTable.focus();
    leftFocussed = true;
  }
});

leftTable.setData({
  headers: ["Artist", "Song"],
  data: TABLE_DATA_LEFT
});

rightTable.setData({
  headers: ["Artist", "Song"],
  data: TABLE_DATA_RIGHT
});

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

screen.render();
