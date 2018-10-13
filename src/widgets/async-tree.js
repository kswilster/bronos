require('babel-polyfill');

import Blessed from 'blessed';
import contrib from 'blessed-contrib';
const { tree: Tree } = contrib;
const { Node } = Blessed;

function AsyncTree(options) {
  if (!(this instanceof Node)) return new AsyncTree(options);
  Tree.call(this, options);

  this.on('select', async (selectedNode, itemIndex) => {
    this.screen.log(`node selected ${selectedNode.name}`);
    if (selectedNode.asyncState === 'init') {
      selectedNode.children = await selectedNode.asyncChildren();
      this.setData(this.data);
      this.screen.render();
    }
  });
}

AsyncTree.prototype.walk = function(node, treeDepth) {
  var lines = [];

  if (!node.parent) {
    // root level
    this.lineNbr = 0;
    this.nodeLines.length = 0;
    node.parent = null;
  }

  if (treeDepth === '' && node.name) {
    this.lineNbr = 0;
    this.nodeLines[this.lineNbr++] = node;
    lines.push(node.name);
    treeDepth = ' ';
  }

  node.depth = treeDepth.length - 1;

  if (node.children && node.extended) {

    var i = 0;

    if (typeof node.asyncChildren === 'function' && !node.asyncState) {
      node.asyncState = 'init';
      node.children = { Loading: { name: 'Loading' } };
    }

    if (typeof node.children === 'function')
      node.childrenContent = node.children(node);

    if (!node.childrenContent)
      node.childrenContent = node.children;

    for (var child in node.childrenContent) {

      if (!node.childrenContent[child].name)
        node.childrenContent[child].name = child;

      child = node.childrenContent[child];
      child.parent = node;
      child.position = i++;

      if (typeof child.extended === 'undefined')
        child.extended = this.options.extended;

      if (typeof child.asyncChildren ===  'function' && !child.asyncState) {
        child.asyncState = 'init';
        child.children = { Loading: { name: 'Loading...' } };
      }
      if (typeof child.children === 'function')
        child.childrenContent = child.children(child);
      else
        child.childrenContent = child.children;

      var isLastChild = child.position === Object.keys(child.parent.childrenContent).length - 1;
      var treePrefix;
      var suffix = '';
      if (isLastChild)
        treePrefix = '└';
      else
        treePrefix = '├';

      if (!child.childrenContent || Object.keys(child.childrenContent).length === 0) {
        treePrefix += '─';
      } else if (child.extended) {
        treePrefix += '┬';
        suffix = this.options.template.retract;
      } else {
        treePrefix += '─';
        suffix = this.options.template.extend;
      }

      if (!this.options.template.lines) treePrefix = '|-';
      if (this.options.template.spaces) treePrefix = ' ';

      lines.push(treeDepth + treePrefix + child.name + suffix);

      this.nodeLines[this.lineNbr++] = child;

      var parentTree;
      if (isLastChild || !this.options.template.lines)
        parentTree = treeDepth + ' ';
      else
        parentTree = treeDepth + '│';

      lines = lines.concat(this.walk(child, parentTree));
    }
  }
  return lines;
}

AsyncTree.prototype.__proto__ = Tree.prototype;
AsyncTree.prototype.type = 'tree';

export default AsyncTree;
