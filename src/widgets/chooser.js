require('babel-polyfill');

import Blessed from 'blessed';
import LinkedList from 'dbly-linked-list';

function Chooser(options) {
  const self = this;

  if (!(this instanceof Blessed.node)) {
    return new Chooser(options);
  }

  Blessed.list.call(this, options);
  this.selectedItems = new LinkedList();

  this.on('keypress', function(ch, key) {
    if (key.name === 'tab') {
      self.tabSelected();
      return;
    }
  });
}

export default function createChooser(options) {
  var screen = Blessed.screen({
    smartCSR: true
  });

  const chooser = Chooser({ ...CHOOSER_DEFAULTS, ...options });
  screen.append(chooser);

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    screen.destroy();
  });

  chooser.focus();
  screen.render();

  return new Promise(function(resolve, reject) {
    chooser.on('submit', function(results) {
      screen.destroy();
      resolve(results);
    });

    chooser.on('cancel', function() {
      screen.destroy();
      reject();
    });
  });
}

Chooser.prototype.__proto__ = Blessed.list.prototype;
Chooser.prototype.type = 'Chooser';

Chooser.prototype.createItem = function(content) {
  // leave room for numbering
  const baseContent = content;
  content = formatWithSpaces('', content, 4);
  const item = Blessed.list.prototype.createItem.call(this, content);
  item._baseContent = baseContent;
  return item;
}

Chooser.prototype.tabSelected = function(i) {
  Blessed.list.prototype.enterSelected.call(this, i);
  const item = this.items[this.selected];
  item._selected = !item._selected;

  if (item._selected) {
    this.selectedItems.insert(item);
    // item.setContent(formatWithSpaces(1, item._baseContent, 4));
  } else {
    this.selectedItems.removeNode(item);
    item.setContent(formatWithSpaces('', item._baseContent, 4));
  }

  const selectedItemsArray = this.selectedItems.toArray();
  for (let i = 0; i < selectedItemsArray.length; i++) {
    const selectedItem = selectedItemsArray[i];
    selectedItem.setContent(formatWithSpaces(i + 1, selectedItem._baseContent, 4));
  }
  this.screen.render();
}

Chooser.prototype.enterSelected = function() {
  const results = this.selectedItems.toArray().map(item => item._baseContent);
  this.emit('submit', results);
}

function formatWithSpaces(string1, string2, spacing) {
  const spaceBetween = Math.max(0, spacing - String(string1).length);
  const spaces = Array(spaceBetween).fill(' ').join('');
  return `${string1}${spaces}${string2}`;
}

const CHOOSER_DEFAULTS = {
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  tags: true,
  keys: true,
  style: {
    selected: {
      bg: 'white',
      fg: 'black',
      bold: function(item) { return item._selected; },
      underline: function(item) { return item._selected; },
      inverse: false,
    },
    item: {
      bg: 'white',
      fg: 'black',
      bold: function(item) { return item._selected; },
      underline: function(item) { return item._selected; },
      inverse: true,
    }
  },
  items: [
    'one',
    'two',
    'three',
  ]
};
