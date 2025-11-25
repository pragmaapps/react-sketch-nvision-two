import FabricCanvasTool from './fabrictool'

const fabric = require('fabric').fabric;

class FreeDrawLine extends FabricCanvasTool {

  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    canvas.forEachObject((o) => o.selectable = o.evented = false);
    this._width = props.lineWidth;
    this._color = props.lineColor;
    this.startPoint = null;
    this.objectAdd = false;
    this.startPoint = null;
    this.line = null;
    this.outside = false;
  }

  doMouseDown(o, props) {
    this.isDown = true;
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);

    if (!this.startPoint) {
        // Create new circle for starting point
        this.startPoint = new fabric.Circle({
            radius: 5,
            fill: 'red',
            selectable: false
          });
        this.startPoint.set({ left: pointer.x, top: pointer.y });
        this.line = new fabric.Line([this.startPoint.left, this.startPoint.top, pointer.x, pointer.y], {
          strokeWidth: 10,
          fill: this._color,
          stroke: "#fcdc00",
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
          id: "calibratedLine",
          enable: true,
          description: "",
          name: "calibratedLine",
          defaultName: "calibratedLine",
        });
        canvas.add(this.line);
        this.outside = false;
    } else {
        // Create new circle for ending point
        if(this.startPoint.left === pointer.x && this.startPoint.top ===pointer.y){
          return;
        }
        this.line.set({ 'x2': pointer.x, 'y2': pointer.y });
        this.line.setCoords();
        canvas.renderAll();
        this.startPoint = null;
        this.objectAdd = true;
        props.onLineAdded();
        props.updateIsTrackingSettingsChanged({
          isTrackingSettingChanged: true,
          calibratedArenaEdited: true
        });

        // Reset starting point
        this.startPoint = null;
        this.line = null;
          
    }
  }

  doMouseMove(o) {
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    if(this.checkWithInBoundary(o)){
        this.outside = true;
        return;
    }
    if(this.startPoint !== null && this.line) {
      this.line.set({ 'x2': pointer.x, 'y2': pointer.y });
      canvas.renderAll();
      this.outside = false;
    }
  }

  doMouseUp(o, props) {
    let canvas = this._canvas;
    const { onLineAdded } = props;
    var pointer = canvas.getPointer(o.e);
    // if(this.startPoint.left === pointer.x && this.startPoint.top ===pointer.y){
    //   canvas.remove(this.line);
    //   canvas.remove(this.startPoint);
    //   this.line = null;
    //   this.startPoint = null;
    //   return;
    // }
    // if(this.outside) onLineAdded();
    // if(this.startPoint !== null && this.line && !this.checkWithInBoundary(o)){
    //   this.line.set({ 'x2': pointer.x, 'y2': pointer.y });
    //   canvas.renderAll();
    //   onLineAdded();  
    //  canvas.remove(this.startPoint);
    //  this.outside = false;
    // }
    // this.startPoint = null;
    // this.line = null;
  }

  checkWithInBoundary = (o) =>{
    let canvas = this._canvas;
    var pointer = canvas.getPointer(o.e);
    if(canvas && (pointer.y > canvas.getHeight() || pointer.x > canvas.getWidth() || pointer.x < 0 || pointer.y < 0)){
      return true; 
    }
    return false;
  }

  doMouseOut(o) {
    this.isDown = false;
  }
}

export default FreeDrawLine;