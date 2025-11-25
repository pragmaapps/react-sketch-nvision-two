import React, { PureComponent, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import History from './history'
import { uuid4 } from './utils'
import Select from './select'
import Pencil from './pencil'
import Line from './line'
import Arrow from './arrow'
import Rectangle from './rectangle'
import Circle from './circle'
import Pan from './pan'
import Tool from './tools'
import RectangleLabel from './rectangle-label'
import DefaultTool from './defaul-tool'
import { useResizeDetector } from 'react-resize-detector'
// import ReactResizeDetector from './ReactResizeDetector';
import NvistaRoiSettings from './NvistaRoiSettingsPanel'
import Ellipse from './ellipse'
import Polygon from './polygon'
import FreeDrawLine from './freedrawline';
import { isInside, getOverlapPoints, getOverlapSize, getOverlapAreas } from "overlap-area";

// Class-based wrapper using ResizeObserver, compatible without hooks
class RefWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  componentDidMount() {
    if (this.props.refCallback) {
      this.props.refCallback(this.ref);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.refCallback !== this.props.refCallback && this.props.refCallback) {
      this.props.refCallback(this.ref);
    }
  }

  render() {
    return React.cloneElement(this.props.children, { ref: this.ref });
  }
}

let fabric = require('fabric').fabric;
let controlsVisible = {
  mtr: false,
};
let executeCanvasResize = false;
fabric.Object.prototype.noScaleCache = false;
//fabric.Object.prototype.setControlsVisibility(controlsVisible);
var svgData = '<svg xmlns="http://www.w3.org/2000/svg" class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium MuiBox-root css-uqopch" viewBox="0 0 24 24" focusable="false" aria-hidden="true" data-testid="Rotate90DegreesCwIcon"><path fill="red" d="M4.64 19.37c3.03 3.03 7.67 3.44 11.15 1.25l-1.46-1.46c-2.66 1.43-6.04 1.03-8.28-1.21-2.73-2.73-2.73-7.17 0-9.9C7.42 6.69 9.21 6.03 11 6.03V9l4-4-4-4v3.01c-2.3 0-4.61.87-6.36 2.63-3.52 3.51-3.52 9.21 0 12.73zM11 13l6 6 6-6-6-6-6 6z"></path></svg>';

var rotateIcon = 'data:image/svg+xml,' + encodeURIComponent(svgData);
var img = document.createElement('img');
img.src = rotateIcon;
function mouseRotateIcon(angle) {
  const relativeAngle = angle - 90;
  const pos = {
    '-90': '9.25 5.25',
    '-75': '9.972 3.863',
    '-60': '10.84 1.756',
    '-45': '11.972 -1.716',
    '-30': '18.83 0.17',
    '-15': '28.49 -9.49',
    15: '-7.985 46.77',
    30: '-0.415 27.57',
    45: '2.32 21.713',
    60: '3.916 18.243',
    75: '4.762 16.135',
    90: '5.25 14.75',
    105: '5.84 13.617',
    120: '6.084 12.666',
    135: '6.317 12.01',
    150: '6.754 11.325',
    165: '7.06 10.653',
    180: '7.25 10',
    195: '7.597 9.43',
    210: '7.825 8.672',
    225: '7.974 7.99',
    240: '8.383 7.332',
    255: '8.83 6.441',
  }, 
    defaultPos = '7.25 10';
  const transform = relativeAngle === 0
   ? 'translate(9.5 3.5)'
   : `rotate(${relativeAngle} ${pos[relativeAngle] || defaultPos})`
  const imgCursor = encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='24' height='24'>
    <defs>
      <filter id='a' width='266.7%' height='156.2%' x='-75%' y='-21.9%' filterUnits='objectBoundingBox'>
        <feOffset dy='1' in='SourceAlpha' result='shadowOffsetOuter1'/>
        <feGaussianBlur in='shadowOffsetOuter1' result='shadowBlurOuter1' stdDeviation='1'/>
        <feColorMatrix in='shadowBlurOuter1' result='shadowMatrixOuter1' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0'/>
        <feMerge>
          <feMergeNode in='shadowMatrixOuter1'/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>
      <path id='b' d='M1.67 12.67a7.7 7.7 0 0 0 0-9.34L0 5V0h5L3.24 1.76a9.9 9.9 0 0 1 0 12.48L5 16H0v-5l1.67 1.67z'/>
    </defs>
    <g fill='none' fill-rule='evenodd'><path d='M0 24V0h24v24z'/>
      <g fill-rule='nonzero' filter='url(#a)' transform='${transform}'>
        <use fill='#000' fill-rule='evenodd' xlink:href='#b'/>
        <path stroke='#FFF' d='M1.6 11.9a7.21 7.21 0 0 0 0-7.8L-.5 6.2V-.5h6.7L3.9 1.8a10.4 10.4 0 0 1 0 12.4l2.3 2.3H-.5V9.8l2.1 2.1z'/>
      </g>
    </g>
  </svg>`)
  return `url("data:image/svg+xml;charset=utf-8,${imgCursor}") 12 12, crosshair`
}

function treatAngle(angle) {
  return angle - angle % 15
}

function rotationStyleHandler(eventData, control, fabricObject) {
  if (fabricObject.lockRotation) {
    return NOT_ALLOWED_CURSOR;
}
const angle = treatAngle(fabricObject.angle);
this.lastAngleRotation = angle;
return mouseRotateIcon(angle)
}
// here's where your custom rotation control is defined
// by changing the values you can customize the location, size, look, and behavior of the control
fabric.Object.prototype.controls.mtr = new fabric.Control({
  x: 0.35,
  y: -0.45,
  //offsetY: -40,
  cursorStyleHandler: rotationStyleHandler,
  actionHandler: fabric.controlsUtils.rotationWithSnapping,
  actionName: 'rotate',
  render: renderIcon,
  cornerSize: 15,
  withConnection: true
});

// here's where the render action for the control is defined
function renderIcon(ctx, left, top, styleOverride, fabricObject) {
  var size = this.cornerSize;
  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

fabric.Object.prototype.set({
  cornerSize: 6,
  cornerColor : 'red',
  cornerStyle : 'circle',
  strokeUniform: true,
});
fabric.Object.NUM_FRACTION_DIGITS = 17;

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class NvisionSketchField extends PureComponent {
  static propTypes = {
    // the color of the line
    lineColor: PropTypes.string,
    // The width of the line
    lineWidth: PropTypes.number,
    // the fill color of the shape when applicable
    fillColor: PropTypes.string,
    // the background color of the sketch
    backgroundColor: PropTypes.string,
    // the opacity of the object
    opacity: PropTypes.number,
    // number of undo/redo steps to maintain
    undoSteps: PropTypes.number,
    // The tool to use, can be pencil, rectangle, circle, brush;
    tool: PropTypes.string,
    // image format when calling toDataURL
    imageFormat: PropTypes.string,
    // Sketch data for controlling sketch from
    // outside the component
    value: PropTypes.object,
    // Set to true if you wish to force load the given value, even if it is the same
    forceValue: PropTypes.bool,
    // Specify some width correction which will be applied on auto resize
    widthCorrection: PropTypes.number,
    // Specify some height correction which will be applied on auto resize
    heightCorrection: PropTypes.number,
    // Specify action on change
    onChange: PropTypes.func,
    // Default initial value
    defaultValue: PropTypes.object,
    // Sketch width
    width: PropTypes.number,
    // Sketch height
    height: PropTypes.number,
    // event object added
    onObjectAdded: PropTypes.func,
    // event object modified
    onObjectModified: PropTypes.func,
    // event object removed
    onObjectRemoved: PropTypes.func,
    // event mouse down
    onMouseDown: PropTypes.func,
    // event mouse move
    onMouseMove: PropTypes.func,
    // event mouse up
    onMouseUp: PropTypes.func,
    // event mouse out
    onMouseOut: PropTypes.func,
    // event object move
    onObjectMoving: PropTypes.func,
    // event object scale
    onObjectScaling: PropTypes.func,
    // event object rotating
    onObjectRotating: PropTypes.func,
    // Class name to pass to container div of canvas
    className: PropTypes.string,
    // Style options to pass to container div of canvas
    style: PropTypes.object,

    //add image
    image: PropTypes.string,
    //resize
    callResize: PropTypes.bool
  }

  static defaultProps = {
    lineColor: 'black',
    lineWidth: 10,
    fillColor: 'transparent',
    backgroundColor: 'transparent',
    opacity: 1.0,
    undoSteps: 25,
    tool: null,
    widthCorrection: 0,
    heightCorrection: 0,
    forceValue: false,
    image: null,
    callResize: false,
    onObjectAdded: () => null,
    onObjectModified: () => null,
    onObjectRemoved: () => null,
    onMouseDown: () => null,
    onMouseMove: () => null,
    onMouseUp: () => null,
    onMouseOut: () => null,
    onObjectMoving: () => null,
    onObjectScaling: () => null,
    onObjectRotating: () => null
  }
  constructor(props) {
    super(props);
    this.state = {
      parentWidth: 550,
      action: true,
      imageUrl: null,
      scaleFactor: 1,
      rotation: 0,
      flipApplied: false,
      crosshairMode: false,
      crosshairMoveMode: false,
      crosshairDeleteMode: false,
      deleteAllLandmarks: false,
      resetAllLandmarks: false,
      frontEnd: [],
      canvasHeight: 512,
      canvasWidth: 800,
      strokeWidth: 2,
      updateLandmarksForOtherWindow: false,
      scaleHeightMultiplier: 1,
      scaleMultiplier: 1,
      lmColorUsed: ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'],

    };
      this.handleResize = this.handleResize.bind(this);
    }

  _fc = null
  childRef = React.createRef();
  left1 = 0;
  top1 = 0 ;
  scale1x = 0 ;    
  scale1y = 0 ;    
  width1 = 0 ;    
  height1 = 0 ;
  angle1=0;
  lastAngleRotation = null;
  currentAngle = 0;
  isRotating = false;
  cursorPos = new fabric.Point();
  resizeObserver = null;
  internalRef = React.createRef();
  _initTools = fabricCanvas => {
    this._tools = {}
    this._tools[Tool.Select] = new Select(fabricCanvas)
    this._tools[Tool.Pencil] = new Pencil(fabricCanvas)
    this._tools[Tool.Line] = new Line(fabricCanvas)
    this._tools[Tool.Arrow] = new Arrow(fabricCanvas)
    this._tools[Tool.Rectangle] = new Rectangle(fabricCanvas)
    this._tools[Tool.RectangleLabel] = new RectangleLabel(fabricCanvas)
    this._tools[Tool.Circle] = new Circle(fabricCanvas)
    this._tools[Tool.Pan] = new Pan(fabricCanvas)
    this._tools[Tool.DefaultTool] = new DefaultTool(fabricCanvas)
    this._tools[Tool.Ellipse] = new Ellipse(fabricCanvas)
    this._tools[Tool.Polygon] = new Polygon(fabricCanvas)
    this._tools[Tool.FreeDrawLine] = new FreeDrawLine(fabricCanvas)
  }

  /**
  * Enable touch Scrolling on Canvas
  */
  enableTouchScroll = () => {
    let canvas = this._fc
    if (canvas.allowTouchScrolling) return
    canvas.allowTouchScrolling = true
  }

  /**
  * Disable touch Scrolling on Canvas
  */
  disableTouchScroll = () => {
    let canvas = this._fc
    if (canvas.allowTouchScrolling) {
      canvas.allowTouchScrolling = false
    }
  }

  /**
  * Add an image as object to the canvas
  *
  * @param dataUrl the image url or Data Url
  * @param options object to pass and change some options when loading image, the format of the object is:
  *
  * {
  * left: <Number: distance from left of canvas>,
  * top: <Number: distance from top of canvas>,
  * scale: <Number: initial scale of image>
  * }
  */
  addImg = (dataUrl, options = {}) => {
    let canvas = this._fc
    // canvas.clear();
    // let canvas = this._fc = new fabric.Canvas("roi-canvas", { centeredRotation: true, centeredScaling: true });
    canvas.clear()
    this._resize()
    fabric.Image.fromURL(dataUrl, oImg => {
      let widthFactor = canvas.getWidth() / oImg.width

      let heightFactor = canvas.getHeight() / oImg.height

      let scaleFactor = Math.min(widthFactor, heightFactor)

      oImg.set({
        //width:window.canvas.getWidth(),
        //height:window.canvas.getHeight(),
        selectable: false,
        hasControls: false,
        hasBorders: false,
        hasRotatingPoint: false
      })

      // let opts = {
      // left: Math.random() * (canvas.getWidth() - oImg.width * 0.5),
      // top: Math.random() * (canvas.getHeight() - oImg.height * 0.5),
      // scale: 0.5
      // };
      // Object.assign(opts, options);
      oImg.scale(scaleFactor)
      // oImg.set({
      // 'left': opts.left,
      // 'top': opts.top
      // });
      canvas.add(oImg)
      this.setState({
        scaleFactor: scaleFactor
      })
      canvas.renderAll()
    })
    // if (this.state.rotation > 0) {
    // setTimeout(() => {
    // this.rotateAndScale(this._fc.item(0), -this.state.rotation, this._fc, this.state.scaleFactor);
    // canvas.renderAll();
    // }, 100);
    // }
  }

  /**
  * Action when an object is added to the canvas
  */
  _onObjectAdded = e => {
    const { onObjectAdded } = this.props
    if (!this.state.action) {
      this.setState({ action: true })
      return
    }
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectAdded : ",obj)
    if(obj.id === "trackingArea"){
      this.left1 =obj.left;
      this.top1 =obj.top;
      this.scale1x = obj.scaleX;
      this.scale1y=obj.scaleY;
      this.width1=obj.width;
      this.height1=obj.height;
    }
    // obj.__version = 1
    // // record current object state as json and save as originalState
    // let objState = obj.toJSON()
    // obj.__originalState = objState
    // let state = JSON.stringify(objState)
    // object, previous state, current state
    // this._history.keep([obj, state, state])
    onObjectAdded(e)
  }

  /**
  * Action when an object is moving around inside the canvas
  */
  _onObjectMoving = e => {
    const { onObjectMoving } = this.props;
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectMoving : ",obj)
    let roiTypes = ["rect", "ellipse", "polygon"];
    let boundary = this.props.getboudaryCoords();
    var brNew = obj.getBoundingRect();
    if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) return;
    if(obj.id !== "trackingArea" && roiTypes.includes(obj.type)){
      this.left1 =obj.left;
      this.top1 =obj.top;
      this.scale1x = obj.scaleX;
      this.scale1y=obj.scaleY;
      this.width1=obj.width;
      this.height1=obj.height;
    }
    onObjectMoving(e)
  }

  /**
  * Action when an object is scaling inside the canvas
  */
  _onObjectScaling = e => {
    const { onObjectScaling } = this.props;
    var obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _ONOBJECTSCALING : ",obj)
    obj.setCoords();
    var brNew = obj.getBoundingRect();
    let canvas = this._fc;
    if(obj.id !== "trackingArea"){
      let boundary = this.props.getboudaryCoords();
      let pointer = canvas.getPointer(e.e)
      if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) {
        obj.left = this.left1;
        obj.top=this.top1;
        obj.scaleX=this.scale1x;
        obj.scaleY=this.scale1y;
        obj.width=this.width1;
        obj.height=this.height1;
      }else if(!this.props.checkForMinTotalArea(obj, "edit")){
        console.log("%c[Animal Tracking]%c [Skecth Field] [On Object Scaling] The zone size should not be less than 100px of the total area.","color:blue; font-weight: bold;",
        "color: black;");
        obj.left = this.left1;
        obj.top=this.top1;
        obj.scaleX=this.scale1x;
        obj.scaleY=this.scale1y;
        obj.width=this.width1;
        obj.height=this.height1;
      }else{   
          this.left1 =obj.left;
          this.top1 =obj.top;
          this.scale1x = obj.scaleX;
          this.scale1y=obj.scaleY;
          this.width1=obj.width;
          this.height1=obj.height;
          // this.props.onShapeAdded();
        }
      return;
    }

    
    brNew = obj;
    if ((((brNew.width * brNew.scaleX) + brNew.left) > canvas.getWidth() -1 ) || (((brNew.height * brNew.scaleY) + brNew.top) > canvas.getHeight() - 1) || ((brNew.left<0) || (brNew.top<0))) {
    obj.left = this.left1 <= 0 ? obj.left : this.left1;
    obj.top=this.top1 <= 0 ? obj.top : this.top1;
    obj.scaleX=this.scale1x === 0 ? obj.scaleX : this.scale1x;
    obj.scaleY=this.scale1y === 0 ? obj.scaleY : this.scale1y;
    obj.width=this.width1 === 0 ? obj.width : this.width1;
    obj.height=this.height1 === 0 ? obj.height : this.height1;
    obj.setCoords();
  }else if(!this.props.checkForMinTotalArea(obj, "edit", true)){
    console.log("%c[Animal Tracking]%c [Skecth Field] [On Object Scaling] The tracking area should not be less than 200px width and height respectively.","color:blue; font-weight: bold;",
    "color: black;");
    obj.left = this.left1;
    obj.top=this.top1;
    obj.scaleX=this.scale1x;
    obj.scaleY=this.scale1y;
    obj.width=this.width1;
    obj.height=this.height1;
  }
    else{    
      this.left1 =obj.left;
      this.top1 =obj.top;
      this.scale1x = obj.scaleX;
      this.scale1y=obj.scaleY;
      this.width1=obj.width;
      this.height1=obj.height;
      // this.props.onShapeAdded();
    }

    onObjectScaling(e)
  }

  /**
  * Action when an object is rotating inside the canvas
  */
  _onObjectRotating = e => {
    const { onObjectRotating } = this.props;
    const angle = treatAngle(e.target.angle);
    let canvas = this._fc;
    if (this.lastAngleRotation !== angle) {
      canvas.setCursor(mouseRotateIcon(angle));
      this.lastAngleRotation = angle;
    };
    this.isRotating = true;
    this.currentAngle = e.target.angle;
    this.cursorPos.x = e.pointer.x;
    this.cursorPos.y = e.pointer.y;
    let roiTypes = ["rect", "ellipse", "polygon"];
    var obj = e.target;
    obj.setCoords();
    var brNew = obj.getBoundingRect();
    if(obj.id !== "trackingArea" && roiTypes.includes(obj.type)){
      let boundary = this.props.getboudaryCoords();
      if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) {
        obj.angle = this.angle1;
        obj.left = this.left1;
        obj.top=this.top1;
        obj.scaleX=this.scale1x;
        obj.scaleY=this.scale1y;
        obj.width=this.width1;
        obj.height=this.height1;
      }else{  
        this.angle1 = obj.angle;
        this.left1 =obj.left;
        this.top1 =obj.top;
        this.scale1x = obj.scaleX;
        this.scale1y=obj.scaleY;
        this.width1=obj.width;
        this.height1=obj.height;
        }
      return;
    }
    onObjectRotating(e)
  }

  _onObjectModified = e => {
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectModified : ",obj)
    this.isRotating = false;
    if(obj.id === "trackingArea"){
      this.trackingAreaModified(obj);
      return;
    }
    // if(obj.type === "polygon" && this.checkForMinDistance(obj)){
    //   this.props.notificationShow("Zone size should be bigger then 100px");
    //   this.props.onShapeAdded();
    //   return;
    // }
    let boundaryObj = this.props.getboudaryCoords();
    //FEN-413
    /*if(boundaryObj && obj.height > (boundaryObj.height * boundaryObj.scaleY) || obj.width > (boundaryObj.width * boundaryObj.scaleX) ){
    return;
    }*/      
    var canvasTL = new fabric.Point(boundaryObj.left, boundaryObj.top);
    var canvasBR = new fabric.Point(boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX) , (boundaryObj.height * boundaryObj.scaleY) + boundaryObj.top);
    if (!obj.isContainedWithinRect(canvasTL, canvasBR, true, true)) {
      var vertices = obj.getCoords(); // Get the transformed vertices
    
      // Define the boundaries
      var boundaryLeft = canvasTL.x;
      var boundaryTop = canvasTL.y;
      var boundaryRight = canvasBR.x;
      var boundaryBottom = canvasBR.y;
    
      var leftAdjustment = 0;
      var topAdjustment = 0;
      var rightAdjustment = 0;
      var bottomAdjustment = 0;
    
      // Check each vertex
      vertices.forEach(function (vertex) {
        if (vertex.x < boundaryLeft) {
          leftAdjustment = Math.max(leftAdjustment, boundaryLeft - vertex.x);
        }
        if (vertex.x > boundaryRight) {
          rightAdjustment = Math.max(rightAdjustment, vertex.x - boundaryRight);
        }
        if (vertex.y < boundaryTop) {
          topAdjustment = Math.max(topAdjustment, boundaryTop - vertex.y);
        }
        if (vertex.y > boundaryBottom) {
          bottomAdjustment = Math.max(bottomAdjustment, vertex.y - boundaryBottom);
        }
      });
    
      // Apply adjustments to the object's position
      var newLeft = obj.left + leftAdjustment - rightAdjustment;
      var newTop = obj.top + topAdjustment - bottomAdjustment;
    
      obj.set({
        left: newLeft,
        top: newTop
      });
    
      obj.setCoords();
      this._fc.renderAll();
    }
    
    
    
    
    obj.setCoords();
    this.props.checkForOverlap(obj);
    this.props.onShapeAdded();
    obj.__version += 1
    let prevState = JSON.stringify(obj.__originalState)
    let objState = obj.toJSON()
    // record current object state as json and update to originalState
    obj.__originalState = objState
    let currState = JSON.stringify(objState)
    this.props.updateIsTrackingSettingsChanged({
      isTrackingSettingChanged: true,
      defineArenaZoneEdited: true
    });
    // this._history.keep([obj, prevState, currState]);
  }

  trackingAreaModified = (obj) =>{    
    let canvas = this._fc;
    var canvasTL = new fabric.Point(0, 0);
    var canvasBR = new fabric.Point(canvas.getWidth() -1, canvas.getHeight() -1);
    console.log("TRACKING SETTING NVISION SKETCH FIELD trackingAreaModified : ",obj)
    if (!obj.isContainedWithinRect(canvasTL, canvasBR, true, true)) {
      console.log("%c[Animal Tracking]%c [Traking Area] Modified outside the canvas","color:blue; font-weight: bold;",
      "color: black;",obj);
      var objBounds = obj.getBoundingRect();
      obj.setCoords();
      var objTL = obj.getPointByOrigin("left", "top");
      var left = objTL.x;
      var top = objTL.y;

      if (objBounds.left < canvasTL.x) left = 0;
      if (objBounds.top < canvasTL.y) top = 0;
      if ((objBounds.top + objBounds.height) > canvasBR.y) top = canvasBR.y - objBounds.height;
      if ((objBounds.left + objBounds.width) > canvasBR.x) left = canvasBR.x - objBounds.width;
      if(top < 0) top = 0;
      if(left < 0) left = 0;
      obj.setPositionByOrigin(new fabric.Point(left, top), "left", "top");
      obj.setCoords();
      this._fc.renderAll();
      this.checkWithInBoundary();
    }else{
      console.log("%c[Animal Tracking]%c [Traking Area] Modified with in canvas","color:blue; font-weight: bold;",
      "color: black;",obj);
      this.checkWithInBoundary();
    }
    this.props.onShapeAdded();
    this.props.updateIsTrackingSettingsChanged({
      isTrackingSettingChanged: true,
      trackingAreaEdited: true
    });
  }

  getCenterPoint = (obj) => {
    let selectedObj = this._fc.getObjects().find(ob => ob.defaultName === obj.defaultName);
    if(selectedObj){
      return selectedObj.getCenterPoint();
    }
    return obj.centerPoint;
  }

  areShapesOverlapping = (obj1, obj2) => {
    let shape1Points = this.convertShapeToPolygon(obj1);
    let shape2Points = this.convertShapeToPolygon(obj2);
    console.log(getOverlapAreas(shape1Points,shape2Points).length > 0,"isOverlap");
    let isOverlap = getOverlapAreas(shape1Points,shape2Points).length > 0 ? true : false;
    return isOverlap;
  }

  generateEllipsePoints = (ellipse) => {
    const points = [];
    const center = ellipse.getCenterPoint();
    const radiusX = ellipse.rx * ellipse.scaleX;
    const radiusY = ellipse.ry * ellipse.scaleY;
    const angle = ellipse.angle * (Math.PI / 180); // Convert angle to radians
    const numPoints = 32; // Adjust as needed
    for (let i = 0; i < numPoints; i++) {
        const angleIncrement = (i / numPoints) * 2 * Math.PI;
        const x = center.x + radiusX * Math.cos(angleIncrement);
        const y = center.y + radiusY * Math.sin(angleIncrement);
        points.push({x, y})
    }
  
    // Rotate all points
    const rotatedPoints = []
    points.map(point => {
        const rotatedX = center.x + (point.x - center.x) * Math.cos(angle) - (point.y - center.y) * Math.sin(angle);
        const rotatedY = center.y + (point.x - center.x) * Math.sin(angle) + (point.y - center.y) * Math.cos(angle);
        rotatedPoints.push([rotatedX,rotatedY]);
    });
    return rotatedPoints;
  };

  convertShapeToPolygon = (shape) => {
    switch (shape.type) {
      case 'rect':
        const x1 = shape.oCoords.tl.x;
        const y1 = shape.oCoords.tl.y;
        const x2 = shape.oCoords.tr.x;
        const y2 = shape.oCoords.tr.y;
        const x3 = shape.oCoords.br.x;
        const y3 = shape.oCoords.br.y;
        const x4 = shape.oCoords.bl.x;
        const y4 = shape.oCoords.bl.y;
  
        return [[x1,y1],[x2,y2],[x3,y3],[x4,y4]];
  
      case 'ellipse':
        return this.generateEllipsePoints(shape);
  
        case 'polygon':
          let points = []
          Object.keys(shape.oCoords).map(p => {
            if(p !== "mtr"){
              let tempObj = JSON.parse(JSON.stringify(shape.oCoords[p]));
              let obj = [
                tempObj.x, 
                tempObj.y
              ];
              points.push(obj);
            }
          });
          return points;
    
  
      default:
        throw new Error(`Unknown shape type: ${shape.type}`);
    }
  }

  checkWithInBoundary = async() =>{
    let canvas = this._fc; 
    let showNotification = false;
    let boundary = canvas.getObjects().find(ob => ob.id === "trackingArea");
    let boundryCoords = [];
    if(boundary){
      boundryCoords = this.convertShapeToPolygon(boundary);
    }
    boundryCoords.length && canvas.getObjects().forEach((shape) => {
      if(shape.id === "calibratedLine") return;
      if(shape.id !== "trackingArea"){
        let isOutsideBoundary = false;
        let transformedPoints = this.convertShapeToPolygon(shape);
        transformedPoints.forEach((point) => {
          if (!isInside(point, boundryCoords)) {
            isOutsideBoundary = true;
          }
        });
        if(isOutsideBoundary){
          showNotification = true;
          this.props.addColorInDefaultShapeColors(shape.stroke);
          this.props.deleteROIDefaultName(shape.defaultName);
          canvas.remove(shape);
        }
      }
    });   
    showNotification && this.props.notificationShow("Zones lying outside of tracking area were removed.");   
    canvas.renderAll();
    // this.props.onShapeAdded();
  }

  /*checkWithInBoundary = async() =>{
    let canvas = this._fc; 
    let showNotification = false;
    canvas.getObjects().forEach((shape) => {
      if(shape.id === "calibratedLine") return;
      let boundaryObj = this.props.getboudaryCoords();
      if(!boundaryObj) return;
      var canvasTL = new fabric.Point(boundaryObj.left, boundaryObj.top);
      var canvasBR = new fabric.Point(boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX), (boundaryObj.height * boundaryObj.scaleY) + boundaryObj.top);
      // if (!shape.isContainedWithinRect(canvasTL, canvasBR, true, true) && shape.id !== "trackingArea") {
      //   this.props.addColorInDefaultShapeColors(shape.stroke);
      //   this.props.deleteROIDefaultName(shape.defaultName);
      //   canvas.remove(shape);
      // }
      if((shape.left < boundaryObj.left ||
        shape.top < boundaryObj.top ||
        shape.left + (shape.width * shape.scaleX) > boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX) ||
        shape.top + (shape.height * shape.scaleY) > boundaryObj.top + (boundaryObj.height * boundaryObj.scaleY)) && shape.id !== "trackingArea"){
          showNotification = true;
          this.props.addColorInDefaultShapeColors(shape.stroke);
          this.props.deleteROIDefaultName(shape.defaultName);
          canvas.remove(shape);
        }
    });   
    showNotification && this.props.notificationShow("Zones lying outside of tracking area were removed.");   
    canvas.renderAll();
    this.props.onShapeAdded();
  }*/

  removeUnCompletedShapes = () =>{
    let canvas = this._fc; 
    let roiTypes = ["rect", "ellipse", "polygon"];
    canvas.getObjects().forEach((shape) => {
      if(shape.id !== "calibratedLine" && !roiTypes.includes(shape.type)) 
        canvas.remove(shape);
    });   
    canvas.renderAll();
  }

  checkForMinDistance = (polygon) =>{
    const points = polygon.points;
    const minDistance = 10;
    let distance;
    for (let i = 0; i < points.length - 1; i++) {
      distance = Math.sqrt(
        Math.pow(points[i + 1].x - points[i].x, 2) +
        Math.pow(points[i + 1].y - points[i].y, 2)
      );
      if (distance < minDistance) {
          this.props.setSelected(polygon, true);
          return true;
      }
    }
    return false;
  }

  /**
  * Action when an object is removed from the canvas
  */
  _onObjectRemoved = e => {
    const { onObjectRemoved } = this.props
    let obj = e.target
    if (obj.__removed) {
      obj.__version += 1
      return
    }
    obj.__version = 0
    onObjectRemoved(e)
  }

  /**
  * Action when the mouse button is pressed down
  */
  _onMouseDown = e => {
    const { onMouseDown } = this.props
    this._selectedTool.doMouseDown(e, this.props, this)
    onMouseDown(e)
  }

  /**
  * Action when the mouse cursor is moving around within the canvas
  */
  _onMouseMove = e => {
    const { onMouseMove } = this.props
    this._selectedTool.doMouseMove(e, this.props)
    onMouseMove(e)
  }

  /**
  * Action when the mouse cursor is moving out from the canvas
  */
  _onMouseOut = e => {
    const { onMouseOut } = this.props
    this._selectedTool.doMouseOut(e)
    if (this.props.onChange) {
      let onChange = this.props.onChange
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
    onMouseOut(e)
  }

  _onMouseUp = e => {
    const { onMouseUp } = this.props
    this._selectedTool.doMouseUp(e, this.props, this)
    this.isRotating = false;
    // Update the final state to new-generated object
    // Ignore Path object since it would be created after mouseUp
    // Assumed the last object in canvas.getObjects() in the newest object
    if (this.props.tool !== Tool.Pencil) {
      const canvas = this._fc
      const objects = canvas.getObjects()
      const newObj = objects[objects.length - 1]
      if (newObj && newObj.__version === 1) {
        newObj.__originalState = newObj.toJSON()
      }
    }
    if (this.props.onChange) {
      let onChange = this.props.onChange
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
    onMouseUp(e)
    this.isRotating = false;
  }

  /**
  * Track the resize of the window and update our state
  *
  * @param e the resize event
  * @private
  */

  renderRotateLabel =(ctx, canvas)=> {
    const angleText = `${this.currentAngle.toFixed(0)}°`,
    borderRadius = 5,
    rectWidth = 32,
    rectHeight = 19,
    textWidth = 6.01 * angleText.length - 2.317;
    const tempPoint = fabric.util.rotatePoint(new fabric.Point(40, 0),new fabric.Point(40, 0),fabric.util.degreesToRadians(30));
    const pos = this.cursorPos.add(
      tempPoint
    );

    const { tl, br } = canvas.vptCoords;

    ctx.save();
    ctx.translate(
      Math.min(
        Math.max(pos.x, tl.x),
        br.x - rectWidth
      ),
      Math.min(
        Math.max(pos.y, tl.y),
        br.y - rectHeight
      )
    );
    ctx.beginPath();
    ctx.fillStyle = "rgba(37,38,39,0.9)";
    ctx.roundRect(0, 0, rectWidth, rectHeight, borderRadius);
    ctx.fill();
    ctx.font = "400 13px serif";
    ctx.fillStyle = "hsla(0,0%, 100%, 0.9)";
    ctx.fillText(angleText, rectWidth / 2 - textWidth / 2, rectHeight / 2 + 4);
    ctx.restore();
  }

  getOverlayDimensions  = () => {
    let canvas = this._fc;
    if (canvas && canvas.upperCanvasEl) {
      var overlayWidth = document.getElementById("onep-twop-container-2").offsetWidth;
    }
    else {
      var overlayWidth = document.getElementById("oneptwop-container").offsetWidth;
    }
    let resolutionRatio = this.props.resolutionWidth / this.props.resolutionHeight;
    if(this.props.resolutionHeight === 1080 && this.props.resolutionWidth === 1920){
      var overlayHeight = Math.ceil(this.props.resolutionHeight / (this.props.resolutionWidth / overlayWidth));
    }else{
      //var overlayHeight = Math.ceil(document.getElementById("video-container-3").offsetHeight);
      //var overlayWidth = overlayHeight * resolutionRatio;
      var overlayHeight = document.getElementById("video-container-3").offsetHeight;
      var overlayWidth = Math.ceil(this.props.resolutionWidth / (this.props.resolutionHeight / overlayHeight));
    }
    console.log('[Tracking Setting][Tracking Area][getOverlayDimensions] Canvas Overlay Width:', overlayWidth, overlayHeight);
    return { overlayWidth: overlayWidth,overlayHeight: overlayHeight }
  }

  _resize = (e, canvasWidth = null, canvasHeight = null) => {
    let {overlayWidth, overlayHeight} = this.getOverlayDimensions();
    console.log('[Tracking Setting][Tracking Area] [_resize] Canvas Overlay Width height:', overlayWidth, overlayHeight);
    this.getCanvasAtResoution(overlayWidth, overlayHeight, false);
  };

  resizeZones = (oldWidth, oldHeight) => {
    return;
    let { scaleHeightMultiplier, scaleMultiplier } = this.state;
    let canvas = this._fc;
    //let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    //let cHeight = canvas.getHeight() - this.state.strokeWidth;
    let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    let cHeight = canvas.getHeight() - this.state.strokeWidth;
    let newWidth = oldWidth - this.state.strokeWidth;
    let newHeight = oldHeight - this.state.strokeWidth;
    if(this.props.resolutionHeight === 1080 && this.props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - this.state.strokeWidth;
    }
    console.log("[Tracking Settings][Sketch Field][resizeZones]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[Tracking Settings][Sketch Field][resizeZones]: Canvas width and height", cWidth, cHeight );
    console.log("[Tracking Settings][Sketch Field][resizeZones]: Canvas scaleMultiplier", scaleMultiplier, "heightmultiplier", scaleHeightMultiplier);
    if (canvas && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      // if(!scaleMultiplier)
        scaleMultiplier = cWidth / newWidth;
      // if(!scaleHeightMultiplier)
        scaleHeightMultiplier =  cHeight / newHeight;
        let cnwidthMultiplier = newWidth / cWidth;
        let cnHeightMultiplier = newHeight / cHeight;
        console.log("[Tracking Settings][Sketch Field][resizeZones]: Canvas scaleMultiplier", scaleMultiplier, "hightmultiplier", scaleHeightMultiplier);
      var objects = canvas.getObjects();
      for (var i in objects) {
        //objects[i].width = objects[i].width * scaleMultiplier;
        //objects[i].height = objects[i].height * scaleHeightMultiplier;
        objects[i].left = objects[i].left * scaleMultiplier;
        objects[i].top = objects[i].top * scaleMultiplier;
        objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
        objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
        objects[i].setCoords();
        var scaleFactor = this.state.scaleFactor * scaleMultiplier;
        // this.setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][resizeZones]: object details after resizing", objects[i]);
      }

      this.updateObjectsInReduxAnimalTrackingKey(scaleMultiplier);
      this.updateObjectsInRedux(scaleMultiplier);
      console.log("[Tracking Settings][Sketch Field][resizeZones]: Canvas Dimensions after resize", cHeight * cnwidthMultiplier, cWidth * cnHeightMultiplier);
      canvas.discardActiveObject();
      // canvas.setWidth(cWidth * cnwidthMultiplier);
      // canvas.setHeight(cHeight * cnHeightMultiplier);
      //this.props.trackingCanvasHeight(cHeight * cnHeightMultiplier);
      //this.props.trackingCanvasWidth( cWidth * cnwidthMultiplier);
      canvas.renderAll();
      // canvas.calcOffset();
      // this.props.onShapeAdded();
      // this.setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
      // });
    }
  }

  resizeZonesOnImport = (newWidth, newHeight) => {
    console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport] New width",newWidth,"NewHeight", newHeight);
    let { scaleHeightMultiplier, scaleMultiplier } = this.state;
    let canvas = this._fc;
    //let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    //let cHeight = canvas.getHeight() - this.state.strokeWidth;
    let cWidth =  canvas.getWidth();
    let cHeight = canvas.getHeight();
    if(this.props.resolutionHeight === 1080 && this.props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - this.state.strokeWidth;
    }
    console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Canvas width and height", cWidth, cHeight );
    console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Canvas scaleMultiplier", scaleMultiplier, "heightmultiplier", scaleHeightMultiplier);
    if (canvas && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      // if(!scaleMultiplier)
        scaleMultiplier = cWidth / newWidth;
      // if(!scaleHeightMultiplier)
        scaleHeightMultiplier =  cHeight / newHeight;
        let cnwidthMultiplier = newWidth / cWidth;
        let cnHeightMultiplier = newHeight / cHeight;
        console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Canvas scaleMultiplier", scaleMultiplier, "hightmultiplier", scaleHeightMultiplier);
      var objects = canvas.getObjects();
      for (var i in objects) {
        //objects[i].width = objects[i].width * scaleMultiplier;
        //objects[i].height = objects[i].height * scaleHeightMultiplier;
        objects[i].left = objects[i].left * scaleMultiplier;
        objects[i].top = objects[i].top * scaleMultiplier;
        objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
        objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
        objects[i].setCoords();
        var scaleFactor = this.state.scaleFactor * scaleMultiplier;
        // this.setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: object details after resizing", objects[i]);
      }
      // this.props.onShapeAdded();
      this.updateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      this.updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Canvas Dimensions after resize", cHeight * cnwidthMultiplier, cWidth * cnHeightMultiplier);
      canvas.discardActiveObject();
      // canvas.setWidth(cWidth * cnwidthMultiplier);
      // canvas.setHeight(cHeight * cnHeightMultiplier);
      this.props.trackingCanvasHeight(cHeight);
      this.props.trackingCanvasWidth( cWidth);
      canvas.renderAll();
      // canvas.calcOffset();
      // this.props.onShapeAdded();
      // this.setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
      // });
    }
  }

  resizeOverlayAndCanvasOnCompoentMount = (e, canvasWidth = null, canvasHeight = null) => {
    let {overlayWidth, overlayHeight} = this.getOverlayDimensions();
    this.getCanvasAtComponentMount(overlayWidth, overlayHeight, false);
  };

  /*getCanvasAtResoution = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = this._fc;
    // let { offsetWidth, clientHeight } = this._container;
    let cWidth =  canvas.getWidth() - 1;
    let cHeight = canvas.getHeight() - 1;
    //let cWidth =  canvas.getWidth();
    //let cHeight = canvas.getHeight();
    console.log("[getCanvasAtResoution]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[getCanvasAtResoution]: Canvas width and height after removing 1 px", cWidth, cHeight );
    if (canvas && cWidth !== newWidth  && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      let isMira = this.props.from === undefined ? true : false;  
      var scaleMultiplier = newWidth / cWidth;
      var scaleHeightMultiplier = newHeight / cHeight;
      var objects = canvas.getObjects();

      for (var i in objects) {
        let isObjectTypeImage = isMira ? objects[i].type === "image" : objects[i].type !== "image";
        if (isObjectTypeImage || scaleLandmarks) {
          objects[i].width = objects[i].width * scaleMultiplier;
          objects[i].height = objects[i].height * scaleHeightMultiplier;
          console.log("object before scaling>>>", objects[i]);
          //objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
          //objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
          objects[i].setCoords();
          var scaleFactor = this.state.scaleFactor * scaleMultiplier;
          this.setState({ scaleFactor });
        }
        // objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
        // objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
        objects[i].left = objects[i].left * scaleMultiplier;
        objects[i].top = objects[i].top * scaleMultiplier;
        objects[i].cnWidth = cWidth * scaleMultiplier;
        objects[i].cnHeight = cHeight * scaleHeightMultiplier;
        objects[i].setCoords();
        console.log("object after scaling>>>>>>>>", objects[i]);
      }


      var obj = canvas.backgroundImage;
      if (obj) {
        obj.scaleX = obj.scaleX * scaleMultiplier;
        obj.scaleY = obj.scaleY * scaleMultiplier;
      }

      //console.log("Resize Canvas Dimensions: ", canvas.getHeight() * scaleMultiplier, canvas.getWidth() * scaleHeightMultiplier);
      console.log("Resize Canvas Dimensions: ", cHeight * scaleMultiplier, cWidth * scaleHeightMultiplier);
      canvas.discardActiveObject();
      //let refactorCanvasHeight = Math.ceil(cHeight * scaleHeightMultiplier) + 1;
      //let refactorCanvasWidth = Math.ceil(cWidth * scaleMultiplier) + 1;
      canvas.setWidth(cWidth * scaleMultiplier);
      canvas.setHeight(cHeight * scaleHeightMultiplier);
      this.props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
      this.props.trackingCanvasWidth( cWidth * scaleMultiplier);
      /*canvas.setWidth(Math.ceil(canvas.getWidth() * scaleMultiplier));
      canvas.setHeight(Math.ceil(canvas.getHeight() * scaleHeightMultiplier));
      this.props.trackingCanvasHeight(Math.ceil(canvas.getHeight() * scaleHeightMultiplier));
      this.props.trackingCanvasWidth(Math.ceil(canvas.getWidth() * scaleMultiplier));*/
      /*
      canvas.renderAll();
      canvas.calcOffset();

      // this.setState({
      // parentWidth: offsetWidth
      // });
      var boss = canvas.getObjects().filter(o => o.type == "image")[0];
      if (boss) {
        this.bindLandmarks();
      }
      this.setState({canvasHeight:canvas.height,canvasWidth:canvas.width},()=>{
        if(!isMira){
          this.props.onShapeAdded();
        }
      });
    }
  } */

  getCanvasAtResoution = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = this._fc;
    let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    let cHeight = canvas.getHeight() - this.state.strokeWidth;
    if(this.props.resolutionHeight === 1080 && this.props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - this.state.strokeWidth;
    }
    console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Canvas width and height after removing 2 px", cWidth, cHeight );
    if (canvas && cWidth !== newWidth  && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = newWidth / cWidth;
      var scaleHeightMultiplier = newHeight / cHeight;
      console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: scaleMultiplier & scaleHeightMultiplier ", scaleMultiplier, scaleHeightMultiplier );
      var objects = canvas.getObjects();
      for (var i in objects) {
        //objects[i].width = objects[i].width * scaleMultiplier;
        //objects[i].height = objects[i].height * scaleHeightMultiplier;
        objects[i].left = objects[i].left * scaleMultiplier;
        objects[i].top = objects[i].top * scaleMultiplier;
        objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
        objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
        objects[i].cnWidth = Math.round(cWidth * scaleMultiplier);
        objects[i].cnHeight = Math.round(cHeight * scaleHeightMultiplier);
        objects[i].setCoords();
        var scaleFactor = this.state.scaleFactor * scaleMultiplier;
        this.setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: object details after resizing", objects[i]);
      }
      this.updateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      this.updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Canvas Dimensions after resize", cHeight * scaleMultiplier, cWidth * scaleHeightMultiplier);
      canvas.discardActiveObject();
      canvas.setWidth(cWidth * scaleMultiplier);
      canvas.setHeight(cHeight * scaleHeightMultiplier);
      this.props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
      this.props.trackingCanvasWidth( cWidth * scaleMultiplier);
      canvas.renderAll();
      canvas.calcOffset();
      this.setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
              });
    }
  }

  scaleObject = (object, scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false) =>{
    object.left = object.left * scaleMultiplier;
    object.top = object.top * scaleMultiplier;
    object.scaleX = object.scaleX * scaleMultiplier;
    object.scaleY = object.scaleY * scaleMultiplier;
    if(object.type === "ellipse") {
      let canvas = this._fc;
      let selectedObject = canvas.getObjects().find(ob => ob.defaultName === object.defaultName);
      if(selectedObject){
        let centerPoint = {};
        centerPoint = selectedObject.getCenterPoint();
        object.centerPoint = centerPoint;
      }else{
        let centerPoint = {};
        centerPoint = {x: object.centerPoint.x * scaleMultiplier, y: object.centerPoint.y * scaleMultiplier};
        object.centerPoint = centerPoint;
      }
    }
    if(object.type === "polygon" || (object.type === "rect" && object.angle > 0)){
      let canvas = this._fc;
      let selectedObject = canvas.getObjects().find(ob => ob.defaultName === object.defaultName);
      if(selectedObject){
        let oCoords = {};
        oCoords = JSON.parse(JSON.stringify(selectedObject.oCoords));
        object.oCoords = oCoords;
      }else{
        let oCoords = {};
        Object.keys(object.oCoords).forEach((key) => {
          oCoords[key] = {
            ...object.oCoords[key],
            x: object.oCoords[key].x * scaleMultiplier,
            y: object.oCoords[key].y * scaleMultiplier,
          };
        });
        object.oCoords = oCoords;
      }
    }
    if(updateCanvasDimensions){
      object.cnWidth = Math.round(cWidth * scaleMultiplier);
      object.cnHeight = Math.round(cHeight * scaleHeightMultiplier);
    }
    return object;
  }

  /*scaleObject = (object, scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false) =>{
    let obj = JSON.parse(JSON.stringify(object));
    let canvas = this._fc;
    console.log("[scledd Object]Object before scaling", object);
    let selectedObject = canvas.getObjects().find(ob => ob.defaultName === obj.defaultName);
    if(selectedObject){
      let left = 0, top = 0, scaleX = 1, scaleY = 1;
      left = selectedObject.left;
      top = selectedObject.top;
      scaleX = selectedObject.scaleX;
      scaleY = selectedObject.scaleY;
      obj.left = left;
      obj.top = top;
      obj.scaleX = scaleX;
      obj.scaleY = scaleY;
      if(obj.type === "polygon"){
        let oCoords = {};
        oCoords = JSON.parse(JSON.stringify(selectedObject.oCoords));
        obj.oCoords = oCoords;
      }
    }else{
      obj.left = obj.left * scaleMultiplier;
      obj.top = obj.top * scaleMultiplier;
      obj.scaleX = obj.scaleX * scaleMultiplier;
      obj.scaleY = obj.scaleY * scaleMultiplier;
    }
    if(updateCanvasDimensions){
      obj.cnWidth = Math.round(cWidth * scaleMultiplier);
      obj.cnHeight = Math.round(cHeight * scaleHeightMultiplier);
    }
    console.log("[scledd Object]Object after scaling", obj);
    return obj;
  }*/
  updateObjectsInReduxAnimalTrackingKey = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false ) => {
    let scaleMultiplierForObjects = scaleMultiplier;
    let trackingArea = this.scaleObject(JSON.parse(JSON.stringify(this.props.trackingArea)), scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    console.log("[REACT SKETCH][updateObjectsInReduxAnimalTrackingKey] TRACKING AREA : ", trackingArea);
    this.props.saveDimesions(trackingArea);
    let lineShape = [];
    if(this.props.lineShape.length){
      lineShape[0] = this.scaleObject(JSON.parse(JSON.stringify(this.props.lineShape[0])), scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    this.props.updateLineShape(lineShape);
    let zones = [];
    this.props.zones.map(async zone => {
      let scaledObject = await this.scaleObject(zone, scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
      zones.push(scaledObject);
    })
    this.props.updateArenaZoneShapesList(zones);
  }

  updateObjectsInRedux = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false) => {
    const { selectedCameraForTracking } = this.props;
    let nVisionSession = JSON.parse(JSON.stringify(this.props.nVisionSession));
    let trackingInterface = nVisionSession.userInterface.trackingInterface;
    let trackingArea = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].trackingArea));
    console.log("[tracking settings][Sketch Field][updateObjectsInRedux][scaling objects][object details before scaling]: ", trackingArea);
    let lineShape = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].calibrateArena.geometry.coordinates));
    let arenaZoneShapesList = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].arenaZone.zoneList));
    trackingArea.geometry.coordinates = this.scaleObject(trackingArea.geometry.coordinates,scaleMultiplier,scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    if(lineShape.length){
      lineShape[0] = this.scaleObject(lineShape[0], scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    let zones = [];
    arenaZoneShapesList.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(this.scaleObject(zone, scaleMultiplier,scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions)));
      zones.push(scaledObject);
    })
    console.log("[Tracking Settings][Sketch Field][updateObjectsInRedux][scaling objects]: Objects details after rescaling: ", arenaZoneShapesList );
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].trackingArea = trackingArea;
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].calibrateArena.geometry.coordinates = lineShape;
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].arenaZone.zoneList = zones;
    this.props.updateNvisionSession(nVisionSession);
  }

  getCanvasAtComponentMount = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = this._fc;
    let cWidth =  canvas.getWidth();
    let cHeight = canvas.getHeight();
    var scaleMultiplier = newWidth / cWidth;
    var scaleHeightMultiplier = newHeight / cHeight;
    /*let scaleMultiplierForObjects = newWidth / this.props.oldCanvasWidth;
    let trackingArea = this.scaleObject(JSON.parse(JSON.stringify(this.props.trackingArea)), scaleMultiplierForObjects);
    this.props.saveDimesions(trackingArea);
    let lineShape = this.scaleObject(JSON.parse(JSON.stringify(this.props.lineShape)), scaleMultiplierForObjects);
    this.props.updateLineShape(lineShape);
    let zones = [];
    this.props.zones.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(this.scaleObject(zone, scaleMultiplierForObjects)));
      zones.push(scaledObject);
    })
    this.props.updateArenaZoneShapesList(zones);*/
    console.log("[Tracking Settings][Sketch Field][getCanvasAtComponentMount][component mount] Resize Canvas Dimensions to: ", cHeight * scaleHeightMultiplier, cWidth * scaleMultiplier);
    canvas.setWidth(cWidth * scaleMultiplier);
    canvas.setHeight(cHeight * scaleHeightMultiplier);
    this.props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
    this.props.trackingCanvasWidth( cWidth * scaleMultiplier);
    canvas.renderAll();
    canvas.calcOffset();
    this.setState({canvasHeight:canvas.height,canvasWidth:canvas.width},()=>{
          });
    this.resizeCanvas(true, false);
  }

  resizeCanvas = (addDimension = false, resize = true) => {
    let currCanvas = this._fc;
    let {overlayWidth, overlayHeight} = this.getOverlayDimensions();
    console.log("[Tracking Settings][Sketch Field][resize Canvas][Current width and height of overlay container] :", overlayWidth, overlayHeight);
    console.log("[Tracking Settings][Sketch Field][resize Canvas][Current width and height of canvas] :", currCanvas.getWidth(),currCanvas.getHeight());
    if(resize){
      this._resize();
    }
    let newCanvasWidth = overlayWidth;
    let newCanvasHeight = overlayHeight;
    if(addDimension){
      newCanvasWidth = this.getActualCanvasDimensions(overlayWidth, overlayHeight, true).width;
      newCanvasHeight = this.getActualCanvasDimensions(overlayWidth,overlayHeight,true).height;
    }
    currCanvas.setHeight(newCanvasHeight);
    currCanvas.setWidth(newCanvasWidth);
    currCanvas.requestRenderAll();
    this.props.trackingCanvasHeight(currCanvas.getHeight());
    this.props.trackingCanvasWidth(currCanvas.getWidth());
    console.log("[Tracking Settings][Sketch Field][resize Canvas][width and height of canvas after resize] :", currCanvas.getWidth(),currCanvas.getHeight());
  }

  setCanvasWidthHeightInRedux = () => {
    let currCanvas = this._fc;
    this.props.trackingCanvasHeight(currCanvas.getHeight());
    this.props.trackingCanvasWidth(currCanvas.getWidth());
  }

  bindLandmarks = (updateLandmarks = false, canvasData) => {
    let canvas = canvasData ? canvasData : this._fc;
    var multiply = fabric.util.multiplyTransformMatrices;
    var invert = fabric.util.invertTransform;
    var boss = canvas.getObjects().filter(o => o.type == "image");
    var minions = canvas.getObjects().filter(o => o.type !== "image");
    var bossTransform = boss[0].calcTransformMatrix();
    var invertedBossTransform = invert(bossTransform);
    minions.forEach(o => {
      var desiredTransform = multiply(
        invertedBossTransform,
        o.calcTransformMatrix()
      );
      // save the desired relation here.
      o.relationship = desiredTransform;
    });
    if (updateLandmarks) {
      let landMarks = canvas ? JSON.parse(JSON.stringify(canvas.getObjects().filter(o => o.type !== "image"))) : [];
      this.updateOnepTwop('_landmarks');
      console.log("[MIRA] Updated list of landmarks objects: ", JSON.stringify(landMarks));
    }
  }

  getActualCanvasDimensions = (width, height, fullWidth=true) => {
    let canvas = this._fc;
    let obj = { width:width, height:height };
    obj.width = width + this.state.strokeWidth;
    obj.height = height + ( fullWidth ? this.state.strokeWidth : (this.state.strokeWidth +0) );
    return obj;
  }

  onMountUpdateObjectsInReduxAnimalTrackingKey = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false, trackingArea, arenaZoneShapesList, lineShape) => {
    let scaleMultiplierForObjects = scaleMultiplier;
    let trackingObject = this.scaleObject(JSON.parse(JSON.stringify(trackingArea)), scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    this.props.saveDimesions(trackingObject);
    let lineObject = [];
    if(lineShape.length){
      lineObject[0] = this.scaleObject(JSON.parse(JSON.stringify(lineShape[0])), scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    this.props.updateLineShape(lineObject);
    let zones = [];
    arenaZoneShapesList.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(this.scaleObject(zone, scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions)));
      zones.push(scaledObject);
    })
    this.props.updateArenaZoneShapesList(zones);
  }

  resizeReduxAndSessionObjectsOnMount = (oldWidth, oldHeight, trackingArea, arenaZoneShapesList, lineShape) => {
    let canvas = this._fc;
    let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    let cHeight = canvas.getHeight() - this.state.strokeWidth;
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsOnMount]: canvas Old width and old height:", oldWidth, oldHeight);
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsOnMount]: Current Canvas width and height : ", cWidth, cHeight );
    if (canvas && oldWidth !== cWidth && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = cWidth/oldWidth;
      var scaleHeightMultiplier = cHeight/oldHeight;
      this.onMountUpdateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true, trackingArea, arenaZoneShapesList, lineShape );
      this.updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true);
    }
  }

  resizeReduxAndSessionObjectsAfterPageLoad = (oldWidth, oldHeight, trackingArea, arenaZoneShapesList, lineShape) => {
    let canvas = this._fc;
    let cWidth =  canvas.getWidth() - this.state.strokeWidth;
    let cHeight = canvas.getHeight() - this.state.strokeWidth;
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsAfterPageLoad]: canvas Old width and old height:", oldWidth, oldHeight);
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsAfterPageLoad]: Current Canvas width and height : ", cWidth, cHeight );
    if (canvas && oldWidth !== cWidth && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = cWidth/oldWidth;
      var scaleHeightMultiplier = cHeight/oldHeight;
      this.onMountUpdateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true, trackingArea, arenaZoneShapesList, lineShape );
      this.updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true);
    }
  }
  /**
  * Sets the background color for this sketch
  * @param color in rgba or hex format
  */
  _backgroundColor = color => {
    if (!color) return
    let canvas = this._fc
    canvas.setBackgroundColor(color, () => canvas.renderAll())
  }

  /**
  * Zoom the drawing by the factor specified
  *
  * The zoom factor is a percentage with regards the original, for example if factor is set to 2
  * it will double the size whereas if it is set to 0.5 it will half the size
  *
  * @param factor the zoom factor
  */
  zoom = factor => {
    let canvas = this._fc
    let objects = canvas.getObjects()
    for (let i in objects) {
      objects[i].scaleX = objects[i].scaleX * factor
      objects[i].scaleY = objects[i].scaleY * factor
      objects[i].left = objects[i].left * factor
      objects[i].top = objects[i].top * factor
      objects[i].setCoords()
    }
    canvas.renderAll()
    canvas.calcOffset()
  }

  /**
  * Perform an undo operation on canvas, if it cannot undo it will leave the canvas intact
  */
  undo = () => {
    let history = this._history
    let [obj, prevState, currState] = history.getCurrent()
    history.undo()
    if (obj.__removed) {
      this.setState({ action: false }, () => {
        this._fc.add(obj)
        obj.__version -= 1
        obj.__removed = false
      })
    } else if (obj.__version <= 1) {
      this._fc.remove(obj)
    } else {
      obj.__version -= 1
      obj.setOptions(JSON.parse(prevState))
      obj.setCoords()
      this._fc.renderAll()
    }
    if (this.props.onChange) {
      this.props.onChange()
    }
  }

  /**
  * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
  */
  redo = () => {
    let history = this._history
    if (history.canRedo()) {
      let canvas = this._fc
      //noinspection Eslint
      let [obj, prevState, currState] = history.redo()
      if (obj.__version === 0) {
        this.setState({ action: false }, () => {
          canvas.add(obj)
          obj.__version = 1
        })
      } else {
        obj.__version += 1
        obj.setOptions(JSON.parse(currState))
      }
      obj.setCoords()
      canvas.renderAll()
      if (this.props.onChange) {
        this.props.onChange()
      }
    }
  }

  /**
  * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
  *
  * @returns {*} true if we can undo otherwise false
  */
  canUndo = () => {

    return this._history.canUndo()
  }

  /**
  * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
  *
  * @returns {*} true if we can redo otherwise false
  */
  canRedo = () => {

    return this._history.canRedo()
  }

  /**
  * Exports canvas element to a dataurl image. Note that when multiplier is used, cropping is scaled appropriately
  *
  * Available Options are
  * <table style="width:100%">
  *
  * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Argument</b></td><td><b>Default</b></td><td><b>Description</b></td></tr>
  * <tr><td>format</td> <td>String</td> <td><optional></td><td>png</td><td>The format of the output image. Either "jpeg" or "png"</td></tr>
  * <tr><td>quality</td><td>Number</td><td><optional></td><td>1</td><td>Quality level (0..1). Only used for jpeg.</td></tr>
  * <tr><td>multiplier</td><td>Number</td><td><optional></td><td>1</td><td>Multiplier to scale by</td></tr>
  * <tr><td>left</td><td>Number</td><td><optional></td><td></td><td>Cropping left offset. Introduced in v1.2.14</td></tr>
  * <tr><td>top</td><td>Number</td><td><optional></td><td></td><td>Cropping top offset. Introduced in v1.2.14</td></tr>
  * <tr><td>width</td><td>Number</td><td><optional></td><td></td><td>Cropping width. Introduced in v1.2.14</td></tr>
  * <tr><td>height</td><td>Number</td><td><optional></td><td></td><td>Cropping height. Introduced in v1.2.14</td></tr>
  *
  * </table>
  *
  * @returns {String} URL containing a representation of the object in the format specified by options.format
  */
  toDataURL = options => this._fc.toDataURL(options)

  /**
  * Returns JSON representation of canvas
  *
  * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
  * @returns {string} JSON string
  */
  toJSON = propertiesToInclude => this._fc.toJSON(propertiesToInclude)

  /**
  * Populates canvas with data from the specified JSON.
  *
  * JSON format must conform to the one of fabric.Canvas#toDatalessJSON
  *
  * @param json JSON string or object
  */
  fromJSON = json => {
    if (!json) return
    let canvas = this._fc
    setTimeout(() => {
      canvas.loadFromJSON(json, () => {
        if (this.props.tool === Tool.DefaultTool) {
          canvas.isDrawingMode = canvas.selection = false
          canvas.forEachObject(o => (o.selectable = o.evented = false))
        }
        canvas.renderAll()
        if (this.props.onChange) {
          this.props.onChange()
        }
      })
    }, 100)
  }

  /**
  * Clear the content of the canvas, this will also clear history but will return the canvas content as JSON to be
  * used as needed in order to undo the clear if possible
  *
  * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
  * @returns {string} JSON string of the canvas just cleared
  */
  clear = propertiesToInclude => {
    let discarded = this.toJSON(propertiesToInclude)
    this._fc.clear()
    // this._history.clear()
    return discarded
  }


  /**
  * Remove selected object from the canvas
  */
  removeSelected = () => {
    let canvas = this._fc
    let activeObj = canvas.getActiveObject()
    if (activeObj) {
      let selected = []
      if (activeObj.type === 'activeSelection') {
        activeObj.forEachObject(obj => selected.push(obj))
      } else {
        selected.push(activeObj)
      }
      selected.forEach(obj => {
        obj.__removed = true
        let objState = obj.toJSON()
        obj.__originalState = objState
        let state = JSON.stringify(objState)
        // this._history.keep([obj, state, state])
        canvas.remove(obj)
      })
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }

  copy = () => {
    let canvas = this._fc
    canvas.getActiveObject().clone(cloned => (this._clipboard = cloned))
  }

  paste = () => {

    // clone again, so you can do multiple copies.
    this._clipboard.clone(clonedObj => {
      let canvas = this._fc
      canvas.discardActiveObject()
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true
      })
      if (clonedObj.type === 'activeSelection') {
        // active selection needs a reference to the canvas.
        clonedObj.canvas = canvas
        clonedObj.forEachObject(obj => canvas.add(obj))
        clonedObj.setCoords()
      } else {
        canvas.add(clonedObj)
      }
      this._clipboard.top += 10
      this._clipboard.left += 10
      canvas.setActiveObject(clonedObj)
      canvas.requestRenderAll()
    })
  }

  /**
  * Sets the background from the dataUrl given
  *
  * @param dataUrl the dataUrl to be used as a background
  * @param options
  */
  setBackgroundFromDataUrl = (dataUrl, options = {}) => {
    let canvas = this._fc
    if (options.stretched) {
      delete options.stretched
      Object.assign(options, {
        width: canvas.width,
        height: canvas.height
      })
    }
    if (options.stretchedX) {
      delete options.stretchedX
      Object.assign(options, {
        width: canvas.width
      })
    }
    if (options.stretchedY) {
      delete options.stretchedY
      Object.assign(options, {
        height: canvas.height
      })
    }
    let img = new Image()
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () =>
      canvas.setBackgroundImage(
        new fabric.Image(img),
        () => canvas.renderAll(),
        options
      )
    img.src = dataUrl
  }

  addText = (text, options = {}) => {
    let canvas = this._fc
    let iText = new fabric.IText(text, options)
    let opts = {
      left: (canvas.getWidth() - iText.width) * 0.5,
      top: (canvas.getHeight() - iText.height) * 0.5
    }
    Object.assign(options, opts)
    iText.set({
      left: options.left,
      top: options.top
    })

    canvas.add(iText)
  }

  callEvent = (e, eventFunction) => {
    // console.log("inside callEvet method");
    if (this._selectedTool)
      eventFunction(e);
  }

  addLandmarks = (canvas, frontEnd) => {
    let self = this;

    canvas.selection = false;
    let imageObject = JSON.parse(JSON.stringify(canvas.getObjects()));
    let landMarks = frontEnd;
    if (landMarks.length > 0) {
      landMarks.splice(0, 0, imageObject[0]);
    } else {
      landMarks = imageObject;
    }
    canvas.loadFromJSON(`{"objects":${JSON.stringify(landMarks)}}`, function () {
      if (self.props.oneptwop) {
        self.props.updateSbpfTransformValues(self.props.oneptwop, self.props.loadFromSession);
      } else {
        self.rotateAndScale(canvas.item(0), -0);
      }

      //if (canvas.item(1) && canvas.item(1).cnWidth !== canvas.getWidth()) {
      var scaleMultiplier = canvas.getWidth() / canvas.item(1).cnWidth;
      var objects = canvas.getObjects();
      for (var i in objects) {
        if (objects[i].type !== "image") {
          objects[i].left = objects[i].left * scaleMultiplier;
          objects[i].top = objects[i].top * scaleMultiplier;
          objects[i].cnWidth = canvas.getWidth();
          objects[i].cnHeight = canvas.getHeight();
          objects[i].setCoords();
        }

      }
      // }
      if (canvas) {
        let fabricList = JSON.parse(JSON.stringify(canvas.getObjects().filter(o => o.type !== "image")));
        fabricList.map((item, key) => {
          let color = item.fill
          self.state.lmColorUsed.map((item, index) => {
            if (item == color) {
              self.state.lmColorUsed.splice(index, 1)
            }
          })
        })
        canvas.forEachObject(function (o) {
          o.selectable = false;
        });
      }
      var boss = canvas.getObjects().filter(o => o.type == "image")[0];
      //if (boss) {
      self.bindLandmarks(true, canvas);
      //}
      //canvas.requestRenderAll();
      canvas.renderAll();
    });

    canvas.on('object:modified', function (options) {
      try {
        var obj = options.target;
        if (obj.type == "image") {
          return;
        }
        var canvasTL = new fabric.Point(0, 0);
        var canvasBR = new fabric.Point(canvas.getWidth(), canvas.getHeight());
        //if object not totally contained in canvas, adjust position
        if (!obj.isContainedWithinRect(canvasTL, canvasBR)) {
          var objBounds = obj.getBoundingRect();
          obj.setCoords();
          var objTL = obj.getPointByOrigin("left", "top");
          var left = objTL.x;
          var top = objTL.y;

          if (objBounds.left < canvasTL.x) left = 0;
          if (objBounds.top < canvasTL.y) top = 0;
          if ((objBounds.top + objBounds.height) > canvasBR.y) top = canvasBR.y - objBounds.height;
          if ((objBounds.left + objBounds.width) > canvasBR.x) left = canvasBR.x - objBounds.width;

          obj.setPositionByOrigin(new fabric.Point(left, top), "left", "top");
          obj.setCoords();
          canvas.renderAll();
        }
        self.bindLandmarks(true);
      }
      catch (err) {
        alert("exception in keepObjectInBounds\n\n" + err.message + "\n\n" + err.stack);
      }
    });


  }

  componentDidMount = () => {
    let {
      tool,
      value,
      undoSteps,
      defaultValue,
      backgroundColor,
      image
    } = this.props

    //console.log("value is coming in component did mount before starttttt-- > ", this._fc);

    //let canvas = this._fc = new fabric.Canvas("roi-canvas", { centeredRotation: true, centeredScaling: true });
    let canvas = (this._fc = new fabric.Canvas(
      this._canvas,
      {
        centeredRotation: true,
        centeredScaling: false,
        id: "roi-canvas"
      } 
    ));
    canvas.centeredScaling = false;
    this._initTools(canvas)

    // set initial backgroundColor
    this._backgroundColor(backgroundColor)

    let selectedTool = this._tools[tool]
    if (selectedTool) selectedTool.configureCanvas(this.props)
    this._selectedTool = selectedTool

    // Control resize

    //window.addEventListener('resize', this._resize, false)

    // Initialize History, with maximum number of undo steps
    // this._history = new History(undoSteps);

    // Events binding
    canvas.on('object:added', e => this.callEvent(e, this._onObjectAdded))
    canvas.on('object:modified', e => this.callEvent(e, this._onObjectModified))
    canvas.on('object:removed', e => this.callEvent(e, this._onObjectRemoved))
    canvas.on('mouse:down', e => this.callEvent(e, this._onMouseDown))
    canvas.on('mouse:move', e => this.callEvent(e, this._onMouseMove))
    canvas.on('mouse:up', e => this.callEvent(e, this._onMouseUp))
    canvas.on('mouse:out', e => this.callEvent(e, this._onMouseOut))
    canvas.on('object:moving', e => this.callEvent(e, this._onObjectMoving))
    canvas.on('object:scaling', e => this.callEvent(e, this._onObjectScaling))
    canvas.on('object:rotating', e => this.callEvent(e, this._onObjectRotating))
    canvas.on("after:render", (opt) => {
      // this.isRotating && this.renderRotateLabel(opt.ctx, canvas);
    });
    // IText Events fired on Adding Text
    // canvas.on("text:event:changed", console.log)
    // canvas.on("text:selection:changed", console.log)
    // canvas.on("text:editing:entered", console.log)
    // canvas.on("text:editing:exited", console.log)

    this.disableTouchScroll()

    // setTimeout(() => {
    //this._resize()
    this.resizeOverlayAndCanvasOnCompoentMount();
      // }, 3000);

      // if (image !== null) {
      // this.addImg(image);
      // }
      // initialize canvas with controlled value if exists
    (value || defaultValue) && this.fromJSON(value || defaultValue);


    if (this.internalRef.current) {
            
            this.resizeObserver = new ResizeObserver(entries => {
                if (entries.length > 0) {
                    const lastEntry = entries[entries.length - 1]; 
                    
                    if (lastEntry.target === this.internalRef.current) {
                        const { width, height } = lastEntry.contentRect;
                        console.log("[nVisionSketchField] [TRACKING SETTING] [componentDidMount] width, height : ", width, height)
                        this.handleResize(Math.round(width), Math.round(height));
                    }
                }
            });

            this.resizeObserver.observe(this.internalRef.current);
        }

  }
  resizeTimeout = null; 
    
  handleResize(width, height) {
      const DEBOUNCE_DELAY = 50; 
      if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
      }
      console.log("[TRACKING SETTING] [handleResize] width, height before timeout : ", width, height)
      this.resizeTimeout = setTimeout(() => {
        console.log("[TRACKING SETTING] [handleResize] width, height after timeout : ", width, height)
          this.onChangeSize(width, height);
          this.resizeTimeout = null; 
      }, DEBOUNCE_DELAY);
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this._resize)
    executeCanvasResize = false;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
    

  componentDidUpdate = (prevProps, prevState) => {
    // console.log(this.props, "props");
    let canvas = this._fc
    if (
      this.state.parentWidth !== prevState.parentWidth ||
      this.props.width !== prevProps.width ||
      this.props.height !== prevProps.height
    ) {
    //   this._resize();
    // this.resizeCanvas(true);
    }

    if (this.props.tool !== prevProps.tool) {
      this._selectedTool = this._tools[this.props.tool]
      //Bring the cursor back to default if it is changed by a tool
      this._fc.defaultCursor = 'default'
      if (this._selectedTool) {
        this._selectedTool.configureCanvas(this.props);
      }
    }

    if (this.props.backgroundColor !== prevProps.backgroundColor) {
      this._backgroundColor(this.props.backgroundColor)
    }


    if (this.props.image !== this.state.imageUrl) {
      this.addImg(this.props.image)
      this.setState({
        imageUrl: this.props.image,
        scaleFactor: this.state.scaleFactor,
        rotation: this.props.oneptwop.inscopix.adapter_lsm.rotation,
        flipApplied: this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal
      })
    }

    if (
      this.props.value !== prevProps.value ||
      (this.props.value && this.props.forceValue)
    ) {
      this.fromJSON(this.props.value)
    }

    // if (this.props.callResize !== this.state.callResize) {
    // this._resize();
        // this.setState({ callResize: this.props.callResize });
    // }

    if (this.props.oneptwop) {

      if (
        this.props.oneptwop.inscopix.adapter_lsm.rotation !== this.state.rotation && this._fc.item(0)
      ) {
        this.rotateAndScale(
          this._fc.item(0),
          -this.props.oneptwop.inscopix.adapter_lsm.rotation
        )
        this.updateLandmarksPosition()
        this._fc.renderAll()
        this.setState({
          rotation: this.props.oneptwop.inscopix.adapter_lsm.rotation
        })
      }
      if (
        this.props.oneptwop.inscopix.frontend !== this.state.frontEnd && this.state.updateLandmarksForOtherWindow && this._fc
      ) {
        this.setState({
          frontEnd: this.props.oneptwop.inscopix.frontend,
          updateLandmarksForOtherWindow: false
        });
        this.props.addLandmarks(this._fc, this.props.oneptwop.inscopix.frontend)
        this._fc.renderAll()
      }

      if (
        this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal !==
        this.state.flipApplied
      ) {
        this.applyFlip(
          this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal,
          false
        )
        this.setState({
          flipApplied: this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal
        })
      }
    }

    if (this.props.crosshairMode !== this.state.crosshairMode) {
      this.setState({ crosshairMode: this.props.crosshairMode });
    }

    if (this.props.crosshairMoveMode !== this.state.crosshairMoveMode) {
      this.setState({ crosshairMoveMode: this.props.crosshairMoveMode });
    }

    if (this.props.crosshairDeleteMode !== this.state.crosshairDeleteMode) {
      this.setState({ crosshairDeleteMode: this.props.crosshairDeleteMode });
    }

    if (this.props.deleteAllLandmarks !== this.state.deleteAllLandmarks) {
      this.setState({ deleteAllLandmarks: this.props.deleteAllLandmarks });
    }

    if (this.props.resetAllLandmarks !== this.state.resetAllLandmarks) {
      this.setState({ resetAllLandmarks: this.props.resetAllLandmarks });
    }
  }
  onChangeSize = (width, height) => {
    // if (this.state.imageUrl !== null) {
    // this.addImg(this.state.imageUrl);
    // // if (this.state.rotation !== 0 && this._fc.item(0)) {
    // // this.rotateAndScale(this._fc.item(0), -this.state.rotation, this._fc, this.state.scaleFactor);
    // // this._fc.renderAll();
    // // }
    // }

    // this._resize();
    console.log("[TRACKING SETTINGS][NVISION SKETCH FIELD][onChangeSize]: Resized to:", width, height);
    this.resizeCanvas(true);
  }

  updateLandmarksPosition = () => {
    var multiply = fabric.util.multiplyTransformMatrices
    var invert = fabric.util.invertTransform
    var boss = this._fc.getObjects().filter(o => o.type == 'image')[0]
    var minions = this._fc.getObjects().filter(o => o !== boss)
    minions.forEach(o => {
      if (!o.relationship) {
        return
      }
      var relationship = o.relationship
      var newTransform = multiply(boss.calcTransformMatrix(), relationship)
      let opt = fabric.util.qrDecompose(newTransform)
      o.set({
        flipX: false,
        flipY: false
      })
      o.setPositionByOrigin(
        { x: opt.translateX, y: opt.translateY },
        'center',
        'center'
      )
      o.set(opt)
      o.setCoords()
    })
  }

  applyFlip = (value, updateOnepTwop) => {
    if(this._fc.item(0)){
      this._fc.item(0).set({
        flipX: value
      })
      this._fc.item(0).setCoords()
    }
    this.updateLandmarksPosition()
    /*if(updateOnepTwop) {
    window.updateOnepTwopData('_transform', []);
    } */
    this._fc.requestRenderAll()
    this._fc.renderAll()
  }

  rotateAndScale = (obj, angle) => {
    if (obj) {
      var width = this._fc.getWidth()
      var height = this._fc.getHeight()
      var cos_theta = Math.cos((angle * Math.PI) / 180)
      var sin_theta = Math.sin((angle * Math.PI) / 180)
      var x_scale =
        width / (Math.abs(width * cos_theta) + Math.abs(height * sin_theta))
      var y_scale =
        height / (Math.abs(width * sin_theta) + Math.abs(height * cos_theta))
      var scale = Math.min(x_scale, y_scale)
      var actScale = this.state.scaleFactor * scale
      // get the transformMatrix array
      var rotateMatrix = [cos_theta, -sin_theta, sin_theta, cos_theta, 0, 0]
      var scaleMatrix = [actScale, 0, 0, actScale, 0, 0]
      // console.log(scaleMatrix, "scaleMatrix");
      // console.log(rotateMatrix, "rotateMatrix");
      //var scaleMatrix = [scale, 0 , 0, scale, 0, 0];
      var rsT = fabric.util.multiplyTransformMatrices(rotateMatrix, scaleMatrix)

      // Unfold the matrix in a combination of scaleX, scaleY, skewX, skewY...
      var options = fabric.util.qrDecompose(rsT)
      // console.log(options, "options");
      var newCenter = { x: this._fc.getWidth() / 2, y: this._fc.getHeight() / 2 }

      // reset transformMatrix to identity and resets flips since negative scale resulting from decompose, will automatically set them.
      //obj.flipX = false;
      obj.flipY = false
      obj.set(options)

      // position the object in the center given from translateX and translateY
      obj.setPositionByOrigin(newCenter, 'center', 'center')
      obj.setCoords();
    }
  }

  updateLandmarks = () => {
    var currentRotation = this.props.oneptwop.inscopix.adapter_lsm.rotation;
    var isFliped = this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal;
    if (isFliped) {
      this.applyFlip(false, true);
    }
    this.props.updateSlider(0);
    let points = []
    if (this.props.oneptwop.inscopix.frontend.length > 0) {
      this.props.oneptwop.inscopix.frontend = this.props.oneptwop.inscopix.frontend.filter(o => o.type !== "image")
      this.props.oneptwop.inscopix.frontend.map((item, key) => {
        let x, y
        x = item.left + (item.width / 2);
        y = item.top + (item.height / 2);
        points.push({ x, y })
      })
      this.props.oneptwop.inscopix.landmarks = { points: points }
    } else {
      this.props.oneptwop.inscopix.landmarks = { points: [] }
    }
    this.props.updateSlider(currentRotation);
    if (isFliped) {
      this.applyFlip(true, true);
    }
  }

  updateOnepTwop = (saveAs, updateLandmarksForOtherWindow = false) => {
    // if (this.sbpfApplyClick) {
    // this.oneptwop.inscopix.bpf = {
    // sigma1: $("#deltaSBFSnapSigmaOne").val() * 1,
    // sigma2: $("#deltaSBFSnapSigmaTwo").val() * 1,
    // offset: $("#deltaSBFSnapOffset").val() * 1,
    // gain: $("#deltaSBFSnapGain").val() * 1
    // }
    // }
    // this.oneptwop.inscopix.adapter_lsm = {
    // rotation: parseInt($(".transforms-rotate-data").val()),
    // flip_horizontal: $("#flip-horizontal").hasClass("active")
    // };
    let landMarks = this._fc ? JSON.parse(JSON.stringify(this._fc.toJSON(['cnWidth', 'cnHeight']))) : [];
    let oneptwop = this.props.oneptwop;
    oneptwop.inscopix.frontend = landMarks.objects.filter(o => o.type !== "image");
    this.props.oneptwopFrontend(oneptwop);
    /*if (updateLandmarksForOtherWindow) {
    this.props.addLandmarks()
    }*/
    this.setState({
      updateLandmarksForOtherWindow: updateLandmarksForOtherWindow
    })
  }

  removeAddOrMoveMode = () => {
    let canvas = this._fc;
    if (canvas.upperCanvasEl) {
      canvas.discardActiveObject();
      canvas.forEachObject(function (o) {
        o.selectable = false;
      });
      canvas.off('mouse:up');
      canvas.hoverCursor = canvas.defaultCursor = 'default';
      canvas.renderAll();
    }
  }

  createRect = () =>{
    let canvas = this._fc;
    let updatedheight =  canvas.getHeight();
    let updatedWidth = canvas.getWidth();
    // let updatedTop = obj.y * canvas.getHeight() / fov.height;
    // let updatedLeft = obj.x * canvas.getWidth() / fov.width;
    // console.log(updatedTop,"updatedTop");
    // console.log(updatedLeft,"updatedLeft");
    let rect = new fabric.Rect({
      left: 0,
      top: 0,
      originX: "left",
      originY: "top",
      strokeWidth: this.state.strokeWidth,
      transparentCorners: false,
      name: "trackingArea",
      defaultName: "trackingArea",
      width: updatedWidth,
      height: updatedheight,
      id: "trackingArea",
      fill: "transparent",
      stroke: '#ff0000',
      selectable: true,
      evented: true,
      hasBorders: false,
      cornerSize: 6,
      enable: true,
      description: "",
      angle: 0
    });
    canvas.add(rect);
    this.props.onShapeAdded();
  }

  render = () => {
    let { className, style, width, height } = this.props



    let canvasDivStyle = Object.assign(
      {},
      style ? style : {},
      width ? { width: '100%' } : { width: '100%' },
      //width ? { width: this.state.canvasWidth } : { width: this.state.canvasWidth },
      height ? { height: this.state.canvasHeight } : { height: this.state.canvasHeight }
    )
    let canvasResizeObserver = { width: `${this._fc && this._fc.getWidth() ? this._fc.getWidth()+"px" : "100%"}`, height: `${this._fc && this._fc.getHeight() ? this._fc.getHeight()+"px" : "100%" }` }
// console.log("TRACKLING SETTINGS NVISION SKETCH FIELD LINK");
    return (
      <RefWrapper refCallback={(ref) => this._container = ref.current} >
        <div
          className={className}
          style={canvasDivStyle}
          id="onep-twop-container-2"
        >
          <div ref={this.internalRef} style={canvasResizeObserver}>
            <div style={{ position: 'absolute' }}>
              <canvas
                //id={uuid4()}
                id="tracking-canvas"
                // style={{
                // margin: "0 auto",
                // position: "absolute",
                // opacity: 1,
                // width: "100%",
                // height: "100%",
                // maxHeight: 800,
                // maxWidth: 1280,
                // backgroundRepeat: "no-repeat",
                // backgroundPosition: "center",
                // backgroundSize: "contain",
                // zIndex: 1
                // }}
                ref={c => (this._canvas = c)}
              >
              </canvas>
            </div>
          </div>
          {this._fc !== null && this._fc.item(0) && this.props.from === undefined &&
            <NvistaRoiSettings
              canvasProps={this._fc}
              landMarks={this.props.oneptwop.inscopix.frontend}
              imageData={this.props.oneptwop}
              oneptwop={this.props.oneptwop}
              rotateAndScale={this.rotateAndScale}
              crosshairMode={this.state.crosshairMode}
              crosshairMoveMode={this.state.crosshairMoveMode}
              crosshairDeleteMode={this.state.crosshairDeleteMode}
              deleteAllLandmarks={this.state.deleteAllLandmarks}
              oneptwopCompare={this.props.oneptwopCompare}
              oneptwopDefault={this.props.oneptwopDefault}
              updateSlider={this.props.updateSlider}
              applyFlip={this.applyFlip}
              resetAllLandmarks={this.state.resetAllLandmarks}
              updateOnepTwop={this.updateOnepTwop}
              loadFromSession={this.props.loadFromSession}
              updateSbpfTransformValues={this.props.updateSbpfTransformValues}
              handleMiraErrorPopup={this.props.handleMiraErrorPopup}
            />}

        </div>
      </RefWrapper>
    )
  }
}

export default NvisionSketchField