/*eslint no-unused-vars: 0*/

import FabricCanvasTool from "./fabrictool";

const fabric = require("fabric").fabric;

class Rectangle extends FabricCanvasTool {
  configureCanvas(props) {
    let canvas = this._canvas;
    canvas.isDrawingMode = canvas.selection = false;
    // canvas.forEachObject((o) => o.selectable = o.evented = false);
    this._width = props.lineWidth;
    this._color = props.lineColor;
    this._fill = props.fillColor;
    this.isDown = true;
    this.isDragging = false;
    this.objectAdd = false;
    this.strokeWidth = 2;
  }

  doMouseDown(options, props, sketch) {
    if(this.objectAdd) {
      // console.log("[Animal Tracking][Rectangle] Object has not removed and do not called mouse up function.");
      this._canvas.off("mouse:up");
      this._canvas.on("mouse:up", function () {});
      return;
    }
    // console.log("[Animal Tracking][Rectangle] Object has added and called mouse up function.");
    this._canvas.off("mouse:up");
    this._canvas.on("mouse:up", (e) => this.doMouseUp(e, props, sketch));
    if (!this.isDown) return;
    const { notificationShow, roiDefaultNames } = props;
    let objects = this._canvas.getObjects().filter(obj => obj.id !== "trackingArea" && obj.id !== "calibratedLine");
    if (objects.length >= 5 && roiDefaultNames.length === 0 ) {
      notificationShow();
      console.log(
        `Maximum five shapes allowed `,
        "color:blue; font-weight:bold;",
        "color:black;"
      );
      this.objectAdd = false;
      return;
    }
    this.objectAdd = true;
    this.genrateRect(options, props);
  }

  genrateRect = (options, props) => {
    const { addROIDefaultName, removeColorInDefaultShapeColors } = props;
    let canvas = this._canvas;
    this.isDown = true;
    let pointer = canvas.getPointer(options.e);
    let boundary = props.getboudaryCoords();
    if (boundary && (pointer.y > (boundary.height * boundary.scaleY) + boundary.top || pointer.x > (boundary.width * boundary.scaleX) + boundary.left || pointer.x < boundary.left || pointer.y < boundary.top)) {
      return false;
    }
    let objects = canvas.getObjects();
    let name = props.roiDefaultNames[0];
    let defaultName = props.roiDefaultNames[0];
    this.startX = pointer.x;
    this.startY = pointer.y;
    this.rect = new fabric.Rect({
      left: this.startX,
      top: this.startY,
      originX: "left",
      originY: "top",
      width: 20,
      height: 20,
      stroke: props.defaultShapeColors[0],
      strokeWidth: this._width,
      fill: this._fill,
      transparentCorners: false,
      name: name,
      defaultName: defaultName,
      selectable: false,
      evented: false,
      id: new Date().getTime(),
      hasBorders: true,
      cornerSize: 6,
      angle: 0,
      enable: true,
      description: "",
      strokeUniform: true,
    });
    this.addEventTriggerKeys();
    canvas.add(this.rect);
    this.rect.setCoords();
    // this.containInsideBoundary(options);
    this.isDragging = true;
    this.rect.edit = true;
    removeColorInDefaultShapeColors(props.defaultShapeColors);
    addROIDefaultName(props.roiDefaultNames);
  };
  addEventTriggerKeys = ()=>{
    this.rect.triggerEvent= "none";
    this.rect.triggerType= "none";
  }

  doMouseMove(o, props) {
    if (!this.isDown) return;
    let canvas = this._canvas;
    if (this.isDragging) {
      let pointer = canvas.getPointer(o.e);
      let boundary = props.getboudaryCoords();
      if (boundary && (pointer.y > (boundary.height * boundary.scaleY) + boundary.top || pointer.x > (boundary.width * boundary.scaleX) + boundary.left || pointer.x < boundary.left || pointer.y < boundary.top)) {
        return false;
      }
      if (this.startX > pointer.x) {
        this.rect.set({ left: Math.abs(pointer.x) });
      }
      if (this.startY > pointer.y) {
        this.rect.set({ top: Math.abs(pointer.y) });
      }
      this.rect.set({ width: Math.abs(this.startX - pointer.x) });
      this.rect.set({ height: Math.abs(this.startY - pointer.y) });
      this.rect.setCoords();
      this.checkWithInTrackingArea(this.rect, boundary);
      canvas.renderAll();
    }
  }

  checkWithInTrackingArea = (obj, boundaryObj) =>{     
    var canvasTL = new fabric.Point(boundaryObj.left, boundaryObj.top);
    var canvasBR = new fabric.Point(boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX) , (boundaryObj.height * boundaryObj.scaleY) + boundaryObj.top);
    if (!obj.isContainedWithinRect(canvasTL, canvasBR, true, true)) {
      var objBounds = obj.getBoundingRect();
      obj.setCoords();
      var objTL = obj.getPointByOrigin("left", "top");
      var left = objTL.x;
      var top = objTL.y;

      if (objBounds.left < canvasTL.x) left = boundaryObj.left;
      if (objBounds.top < canvasTL.y) top = boundaryObj.top;
      if ((objBounds.top + objBounds.height) > canvasBR.y) top = canvasBR.y - objBounds.height;
      if ((objBounds.left + objBounds.width) > canvasBR.x) left = canvasBR.x - objBounds.width;

      obj.setPositionByOrigin(new fabric.Point(left, top), "left", "top");
      obj.setCoords();
      this._canvas.renderAll();
      // this.props.checkForOverlap(obj);
    }
  }
  async doMouseUp(o, props, sketch) {
    // this.containInsideBoundary(o);
    this.isDown = true;
    this.isDragging = false;
    const { onShapeAdded, checkForOverlap } = props;
    let isOverlap = false;
    if(this.objectAdd){
      let rectSmall = await props.checkForMinTotalArea();
      let outsideZone = await this.checkWithInBoundary(props);
      if(outsideZone){
        console.log("%c[Animal Tracking]%c [Skecth Field][Rectangle][do mouse up] Rectangle is created outside the tracking area.","color:blue; font-weight: bold;",
        "color: black;");
        props.notificationShow("Zone should not be created outside tracking area.");
      }
      else if(!rectSmall){ 
        console.log("%c[Animal Tracking]%c [Skecth Field][Rectangle][do mouse up] The zone size should not be less than 100px of the total area.","color:blue; font-weight: bold;",
          "color: black;");
        props.notificationShow("Zone size should be bigger than 100px.");
      }else{
        isOverlap = await checkForOverlap();
      }
      await onShapeAdded();
      setTimeout(() => {
        this.objectAdd = false;
      }, isOverlap ? 500 : 0); 
    }
  }

  checkWithInBoundary = async (props) => {
    let canvas = this._canvas; 
    let isObjectOutSideBoundary = false;
    let roiTypes = ["rect", "ellipse", "polygon"];
    canvas.getObjects().forEach((shape) => {
      if(shape.id === "calibratedLine" || !roiTypes.includes(shape.type)) return;
      let boundaryObj = props.getboudaryCoords();
      if(!boundaryObj) return;
      if((shape.left < boundaryObj.left ||
        shape.top < boundaryObj.top ||
        shape.left + (shape.width * shape.scaleX) > boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX) ||
        shape.top + (shape.height * shape.scaleY) > boundaryObj.top + (boundaryObj.height * boundaryObj.scaleY)) && shape.id !== "trackingArea"){
          props.addColorInDefaultShapeColors(shape.stroke);
          props.deleteROIDefaultName(shape.defaultName);
          canvas.remove(shape);
          isObjectOutSideBoundary = true;
        }
    });
    return isObjectOutSideBoundary;
  }

  containInsideBoundary = (o) => {
    let canvas = this._canvas;
    var canvasTL = new fabric.Point(0, 0);
    var canvasBR = new fabric.Point(canvas.getWidth(), canvas.getHeight());
    let pointer = canvas.getPointer(o.e);
    if (this.startX > pointer.x) {
      this.rect.set({ left: Math.abs(pointer.x) });
    }
    if (this.startY > pointer.y) {
      this.rect.set({ top: Math.abs(pointer.y) });
    }
    if (!this.rect.isContainedWithinRect(canvasTL, canvasBR)) {
      var objBounds = this.rect.getBoundingRect();
      this.rect.setCoords();
      var objTL = this.rect.getPointByOrigin("left", "top");
      var left = objTL.x;
      var top = objTL.y;

      if (objBounds.left < canvasTL.x) left = 0;
      if (objBounds.top < canvasTL.y) top = 0;
      if (objBounds.top + objBounds.height > canvasBR.y)
        top = canvasBR.y - objBounds.height;
      if (objBounds.left + objBounds.width > canvasBR.x)
        left = canvasBR.x - objBounds.width;

      this.rect.setPositionByOrigin(new fabric.Point(left, top), "left", "top");
      this.rect.setCoords();
      canvas.renderAll();
    }
  };

  genrateTrackingArea = (fullWidth = true) => {
    let canvas = this._canvas;
    this.isDown = true;
    //let width = Math.ceil(canvas.getWidth());
    //let height = Math.ceil(canvas.getHeight());
    let width = canvas.getWidth()- this.strokeWidth;
    let height;
    if(fullWidth){
      height = canvas.getHeight() - this.strokeWidth;
    }else{
      height = canvas.getHeight() - (this.strokeWidth + 0) ;
    }
    //let height = canvas.getHeight();
    console.log("[Rectangle] [Tracking Area] [Tracking Settings][Sketch Field][Rectangle][genrateTrackingArea]: Width and Height of canvas after removing stroke width", width, height);
    let name = "trackingArea";
    let defaultName = "trackingArea";
    let rect = new fabric.Rect({
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      width: width,
      height: height,
      cnWidth: width,
      cnHeight:height,
      stroke: '#ff0000',
      strokeWidth: this.strokeWidth,
      fill: this._fill,
      transparentCorners: false,
      name: name,
      defaultName: defaultName,
      selectable: false,
      evented: false,
      id: "trackingArea",
      hasBorders: false,
      cornerSize: 10,
      angle: 0,
      enable: true,
      description: "",
      objectCaching: false
    });
    rect.setControlsVisibility({
      mtr: false,
    });
    canvas.add(rect).setActiveObject(rect);
    // this.containInsideBoundary(options);
    rect.edit = true;
  };
}

export default Rectangle;
