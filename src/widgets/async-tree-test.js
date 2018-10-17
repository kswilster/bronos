import 'babel-polyfill';
// import '@babel/polyfill';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import AsyncTree from './async-tree';

var screen = blessed.screen({ log: 'async-tree-test-log.log' });

var grid = new contrib.grid({ rows: 2, cols: 2, screen: screen });

var tree = grid.set(0, 0, 1, 1, AsyncTree, {
  style: { text: "red" },
  template: { lines: true },
  label: "\"Kanye\" Results"
});

function fakeKanye(name) {
  return {
    name,
    asyncChildren: async function() {
      await sleep(600);
      return {
        married: fakeAsyncAlbum("Let's Get Married"),
        jagged: fakeAsyncAlbum("Jagged Little Thrill"),
        def: fakeAsyncAlbum("So So Def 25: From The Vault"),
      }
    }
  }
}

function fakeAsyncAlbum(name) {
  return {
    name,
    asyncChildren: async function() {
      await sleep(700);
      return {
        remedy: { name: 'Remedy' },
        head: { name: 'Head of Household' },
        respect: { name: 'Respect' },
        goes: { name: 'This Goes Out' },
        driving: { name: 'Driving Me to Drink' },
        without: { name: 'Without You' },
        best: { name: 'Best Man' },
      }
    }
  }
}

function asyncAlbum(name) {
  return {
    name,
    asyncChildren: async function() {
      await sleep(100);
      return {
        wake: { name: 'Wake Up Mr. West' },
        heard: { name: 'Heard \'Em Say' },
        roses1: { name: 'Touch The Sky' },
        roses2: { name: 'Gold Digger' },
        roses3: { name: 'Skit #1' },
        roses4: { name: 'Drive Slow' },
        roses5: { name: 'My Way Home' },
        roses6: { name: 'Crack Music' },
        roses7: { name: 'Roses' },
        roses8: { name: 'Bring Me Down' },
        roses9: { name: 'Addiction' },
        roses10: { name: 'Skit #2' },
        roses11: { name: 'Diamonds From Sierra Leone - Remix' },
        roses12: { name: 'We Major' },
        roses13: { name: 'Skit #3' },
        roses14: { name: 'Hey Mama' },
        roses15: { name: 'Celebration' },
        roses16: { name: 'Skit #4' },
        roses17: { name: 'Gone' },
        roses18: { name: 'Diamonds From Sierra Leone - Bonus Track' },
      }
    }
  }
}

tree.setData({
  extended: true,
  // children: function() {
  children: {
  // asyncChildren: async function() {
    // await sleep(500);
    // return {
      kanye: {
        name: 'Kanye West',
        asyncChildren: async function() {
          await sleep(500);
          return {
            ye1: asyncAlbum('KIDS SEE GHOSTS'),
            ye2: asyncAlbum('ye'),
            ye3: asyncAlbum('The Life of Pablo'),
            ye4: asyncAlbum('Yeezus'),
            ye5: asyncAlbum('My Beautiful Dark Twisted Fantasy'),
            ye6: asyncAlbum('Graduation'),
            ye7: asyncAlbum('808s & Hearbreak'),
            ye8: asyncAlbum('808s & Hearbreak (Softpak)'),
            ye9: asyncAlbum('Late Registration'),
          };
        },
      },
      tpain: fakeKanye('T-PAIN & KANYE WEST'),
      young: fakeKanye('Young Jeezy & Kanye'),
      kanman: fakeKanye('Kanye West for KanMan PRoductions, INc. and Krazy Kat Catalogue, Inc.')
    }
  // }
});

screen.key(["escape", "q", "C-c"], function(ch, key) {
  return process.exit(0);
});

screen.key(["tab"], function(ch, key) {
  if (screen.focused == tree.rows) table.focus();
  else tree.focus();
});

tree.focus();

tree.on("select", function(node) {
  if (node.getData) node.getData(node);

  screen.render();
});

screen.render();

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
