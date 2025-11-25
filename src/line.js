/*eslint no-unused-vars: 0*/

import FabricCanvasTool from './fabrictool'

const fabric = require('fabric').fabric;

class Line extends FabricCanvasTool {

  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    canvas.forEachObject((o) => o.selectable = o.evented = false);
    this._width = props.lineWidth;
    this._color = props.lineColor;
    this.objectAdd = false;
  }

  doMouseDown(o) {
    this.isDown = true;
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    var points = [pointer.x, pointer.y, pointer.x, pointer.y ];
    this.line = new fabric.Line(points, {
      strokeWidth: 10,
      fill: this._color,
      stroke: "#fcdc00",
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      id: new Date().getTime(),
      enable: true,
      description: "",
    });
    this.objectAdd = true;
    canvas.add(this.line);
  }

  doMouseMove(o) {
    if (!this.isDown) return;
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    this.line.set({ x2: pointer.x, y2: pointer.y });
    this.line.setCoords();
    canvas.renderAll();
  }

  doMouseUp(o,props) {
    this.isDown = false;
    const { onLineAdded } = props;
    if(this.objectAdd)
      onLineAdded();
  }

  doMouseOut(o) {
    this.isDown = false;
  }
}

export default Line;