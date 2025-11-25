import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
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
import ReactResizeDetector from './ReactResizeDetector'
import NvistaRoiSettings from './NvistaRoiSettingsPanel'
import Ellipse from './ellipse'
import Polygon from './polygon'
import FreeDrawLine from './freedrawline';
import { isInside, getOverlapPoints, getOverlapSize, getOverlapAreas } from "overlap-area";

// Class-based wrapper using ResizeObserver, compatible without hooks
const RefWrapper = (props) =>{
  const ref = useRef();
  const prevPropsRef = useRef();
  useEffect(() => {
    prevPropsRef.current = props;
  });
  useEffect(() => {
    if (props.refCallback) {
      props.refCallback(ref);
    }
  }, [])

  useEffect(() => {
    const prevProps = prevPropsRef.current || {};
    if (prevProps.refCallback !== props.refCallback && props.refCallback) {
      props.refCallback(ref);
    }
  }, [props.refCallback])



  return React.cloneElement(props.children, { ref: ref });
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
let lastAngleRotation = null;
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
lastAngleRotation = angle;
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
  var size = cornerSize;
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
const NvisionSketchField = forwardRef((props, ref) => {

    const [state, setState] = useState({
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
    });

  let _fc = null;
  let childRef = useRef();
  let left1 = 0;
  let top1 = 0 ;
  let scale1x = 0 ;    
  let scale1y = 0 ;    
  let width1 = 0 ;    
  let height1 = 0 ;
  let angle1=0;
  let _selectedTool = null;
  let currentAngle = 0;
  let isRotating = false;
  let cursorPos = new fabric.Point();
  const prevPropsRef = useRef();
  let _tools = {}
  let _canvas = null;
  let _container = null;

  useEffect(() => {
    prevPropsRef.current = props;
  });

  const _initTools = fabricCanvas => {
    _tools = {}
    _tools[Tool.Select] = new Select(fabricCanvas)
    _tools[Tool.Pencil] = new Pencil(fabricCanvas)
    _tools[Tool.Line] = new Line(fabricCanvas)
    _tools[Tool.Arrow] = new Arrow(fabricCanvas)
    _tools[Tool.Rectangle] = new Rectangle(fabricCanvas)
    _tools[Tool.RectangleLabel] = new RectangleLabel(fabricCanvas)
    _tools[Tool.Circle] = new Circle(fabricCanvas)
    _tools[Tool.Pan] = new Pan(fabricCanvas)
    _tools[Tool.DefaultTool] = new DefaultTool(fabricCanvas)
    _tools[Tool.Ellipse] = new Ellipse(fabricCanvas)
    _tools[Tool.Polygon] = new Polygon(fabricCanvas)
    _tools[Tool.FreeDrawLine] = new FreeDrawLine(fabricCanvas)
  }

  /**
  * Enable touch Scrolling on Canvas
  */
  const enableTouchScroll = () => {
    let canvas = _fc
    if (canvas.allowTouchScrolling) return
    canvas.allowTouchScrolling = true
  }

  /**
  * Disable touch Scrolling on Canvas
  */
  const disableTouchScroll = () => {
    let canvas = _fc
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
  const addImg = (dataUrl, options = {}) => {
    let canvas = _fc
    // canvas.clear();
    // let canvas = _fc = new fabric.Canvas("roi-canvas", { centeredRotation: true, centeredScaling: true });
    canvas.clear();
    _resize()
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
      setState(prevState => ({...prevState,
        scaleFactor: scaleFactor
      }));
      canvas.renderAll()
    })
    // if (state.rotation > 0) {
    // setTimeout(() => {
    // rotateAndScale(_fc.item(0), -state.rotation, _fc, state.scaleFactor);
    // canvas.renderAll();
    // }, 100);
    // }
  }

  /**
  * Action when an object is added to the canvas
  */
  const _onObjectAdded = e => {
    const { onObjectAdded } = props
    if (!state.action) {
        setState(prevState => ({ ...prevState, action: true }))
      return
    }
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectAdded : ",obj)
    if(obj.id === "trackingArea"){
      left1 =obj.left;
      top1 =obj.top;
      scale1x = obj.scaleX;
      scale1y=obj.scaleY;
      width1=obj.width;
      height1=obj.height;
    }
    // obj.__version = 1
    // // record current object state as json and save as originalState
    // let objState = obj.toJSON()
    // obj.__originalState = objState
    // let state = JSON.stringify(objState)
    // object, previous state, current state
    // _history.keep([obj, state, state])
    onObjectAdded(e)
  }

  /**
  * Action when an object is moving around inside the canvas
  */
  const _onObjectMoving = e => {
    const { onObjectMoving } = props;
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectMoving : ",obj)
    let roiTypes = ["rect", "ellipse", "polygon"];
    let boundary = props.getboudaryCoords();
    var brNew = obj.getBoundingRect();
    if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) return;
    if(obj.id !== "trackingArea" && roiTypes.includes(obj.type)){
      left1 =obj.left;
      top1 =obj.top;
      scale1x = obj.scaleX;
      scale1y=obj.scaleY;
      width1=obj.width;
      height1=obj.height;
    }
    onObjectMoving(e)
  }

  /**
  * Action when an object is scaling inside the canvas
  */
  const _onObjectScaling = e => {
    const { onObjectScaling } = props;
    var obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _ONOBJECTSCALING : ",obj)
    obj.setCoords();
    var brNew = obj.getBoundingRect();
    let canvas = _fc;
    if(obj.id !== "trackingArea"){
      let boundary = props.getboudaryCoords();
      let pointer = canvas.getPointer(e.e)
      if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) {
        obj.left = left1;
        obj.top=top1;
        obj.scaleX=scale1x;
        obj.scaleY=scale1y;
        obj.width=width1;
        obj.height=height1;
      }else if(!props.checkForMinTotalArea(obj, "edit")){
        console.log("%c[Animal Tracking]%c [Skecth Field] [On Object Scaling] The zone size should not be less than 100px of the total area.","color:blue; font-weight: bold;",
        "color: black;");
        obj.left = left1;
        obj.top=top1;
        obj.scaleX=scale1x;
        obj.scaleY=scale1y;
        obj.width=width1;
        obj.height=height1;
      }else{   
          left1 =obj.left;
          top1 =obj.top;
          scale1x = obj.scaleX;
          scale1y=obj.scaleY;
          width1=obj.width;
          height1=obj.height;
          // props.onShapeAdded();
        }
      return;
    }

    
    brNew = obj;
    if ((((brNew.width * brNew.scaleX) + brNew.left) > canvas.getWidth() -1 ) || (((brNew.height * brNew.scaleY) + brNew.top) > canvas.getHeight() - 1) || ((brNew.left<0) || (brNew.top<0))) {
    obj.left = left1 <= 0 ? obj.left : left1;
    obj.top=top1 <= 0 ? obj.top : top1;
    obj.scaleX=scale1x === 0 ? obj.scaleX : scale1x;
    obj.scaleY=scale1y === 0 ? obj.scaleY : scale1y;
    obj.width=width1 === 0 ? obj.width : width1;
    obj.height=height1 === 0 ? obj.height : height1;
    obj.setCoords();
  }else if(!props.checkForMinTotalArea(obj, "edit", true)){
    console.log("%c[Animal Tracking]%c [Skecth Field] [On Object Scaling] The tracking area should not be less than 200px width and height respectively.","color:blue; font-weight: bold;",
    "color: black;");
    obj.left = left1;
    obj.top=top1;
    obj.scaleX=scale1x;
    obj.scaleY=scale1y;
    obj.width=width1;
    obj.height=height1;
  }
    else{    
      left1 =obj.left;
      top1 =obj.top;
      scale1x = obj.scaleX;
      scale1y=obj.scaleY;
      width1=obj.width;
      height1=obj.height;
      // props.onShapeAdded();
    }

    onObjectScaling(e)
  }

  /**
  * Action when an object is rotating inside the canvas
  */
  const _onObjectRotating = e => {
    const { onObjectRotating } = props;
    const angle = treatAngle(e.target.angle);
    let canvas = _fc;
    if (lastAngleRotation !== angle) {
      canvas.setCursor(mouseRotateIcon(angle));
      lastAngleRotation = angle;
    };
    isRotating = true;
    currentAngle = e.target.angle;
    cursorPos.x = e.pointer.x;
    cursorPos.y = e.pointer.y;
    let roiTypes = ["rect", "ellipse", "polygon"];
    var obj = e.target;
    obj.setCoords();
    var brNew = obj.getBoundingRect();
    if(obj.id !== "trackingArea" && roiTypes.includes(obj.type)){
      let boundary = props.getboudaryCoords();
      if (boundary && ((brNew.height +brNew.top) > (boundary.height * boundary.scaleY) + boundary.top  || (brNew.width +brNew.left) > (boundary.width * boundary.scaleX) + boundary.left  || brNew.left < boundary.left || brNew.top < boundary.top)) {
        obj.angle = angle1;
        obj.left = left1;
        obj.top=top1;
        obj.scaleX=scale1x;
        obj.scaleY=scale1y;
        obj.width=width1;
        obj.height=height1;
      }else{  
        angle1 = obj.angle;
        left1 =obj.left;
        top1 =obj.top;
        scale1x = obj.scaleX;
        scale1y=obj.scaleY;
        width1=obj.width;
        height1=obj.height;
        }
      return;
    }
    onObjectRotating(e)
  }

  const _onObjectModified = e => {
    let obj = e.target;
    console.log("TRACKING SETTING NVISION SKETCH FIELD _onObjectModified : ",obj)
    isRotating = false;
    if(obj.id === "trackingArea"){
      trackingAreaModified(obj);
      return;
    }
    // if(obj.type === "polygon" && checkForMinDistance(obj)){
    //   props.notificationShow("Zone size should be bigger then 100px");
    //   props.onShapeAdded();
    //   return;
    // }
    let boundaryObj = props.getboudaryCoords();
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
      _fc.renderAll();
    }
    
    
    
    
    obj.setCoords();
    props.checkForOverlap(obj);
    props.onShapeAdded();
    obj.__version += 1
    let prevState = JSON.stringify(obj.__originalState)
    let objState = obj.toJSON()
    // record current object state as json and update to originalState
    obj.__originalState = objState
    let currState = JSON.stringify(objState)
    props.updateIsTrackingSettingsChanged({
      isTrackingSettingChanged: true,
      defineArenaZoneEdited: true
    });
    // _history.keep([obj, prevState, currState]);
  }

  const trackingAreaModified = (obj) =>{    
    let canvas = _fc;
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
      _fc.renderAll();
      checkWithInBoundary();
    }else{
      console.log("%c[Animal Tracking]%c [Traking Area] Modified with in canvas","color:blue; font-weight: bold;",
      "color: black;",obj);
      checkWithInBoundary();
    }
    props.onShapeAdded();
    props.updateIsTrackingSettingsChanged({
      isTrackingSettingChanged: true,
      trackingAreaEdited: true
    });
  }

  const getCenterPoint = (obj) => {
    let selectedObj = _fc.getObjects().find(ob => ob.defaultName === obj.defaultName);
    if(selectedObj){
      return selectedObj.getCenterPoint();
    }
    return obj.centerPoint;
  }

  const reShapesOverlapping = (obj1, obj2) => {
    let shape1Points = convertShapeToPolygon(obj1);
    let shape2Points = convertShapeToPolygon(obj2);
    console.log(getOverlapAreas(shape1Points,shape2Points).length > 0,"isOverlap");
    let isOverlap = getOverlapAreas(shape1Points,shape2Points).length > 0 ? true : false;
    return isOverlap;
  }

  const generateEllipsePoints = (ellipse) => {
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

  const convertShapeToPolygon = (shape) => {
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
        return generateEllipsePoints(shape);
  
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

  const checkWithInBoundary = async() =>{
    let canvas = _fc; 
    let showNotification = false;
    let boundary = canvas.getObjects().find(ob => ob.id === "trackingArea");
    let boundryCoords = [];
    if(boundary){
      boundryCoords = convertShapeToPolygon(boundary);
    }
    boundryCoords.length && canvas.getObjects().forEach((shape) => {
      if(shape.id === "calibratedLine") return;
      if(shape.id !== "trackingArea"){
        let isOutsideBoundary = false;
        let transformedPoints = convertShapeToPolygon(shape);
        transformedPoints.forEach((point) => {
          if (!isInside(point, boundryCoords)) {
            isOutsideBoundary = true;
          }
        });
        if(isOutsideBoundary){
          showNotification = true;
          props.addColorInDefaultShapeColors(shape.stroke);
          props.deleteROIDefaultName(shape.defaultName);
          canvas.remove(shape);
        }
      }
    });   
    showNotification && props.notificationShow("Zones lying outside of tracking area were removed.");   
    canvas.renderAll();
    // props.onShapeAdded();
  }

  /*checkWithInBoundary = async() =>{
    let canvas = _fc; 
    let showNotification = false;
    canvas.getObjects().forEach((shape) => {
      if(shape.id === "calibratedLine") return;
      let boundaryObj = props.getboudaryCoords();
      if(!boundaryObj) return;
      var canvasTL = new fabric.Point(boundaryObj.left, boundaryObj.top);
      var canvasBR = new fabric.Point(boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX), (boundaryObj.height * boundaryObj.scaleY) + boundaryObj.top);
      // if (!shape.isContainedWithinRect(canvasTL, canvasBR, true, true) && shape.id !== "trackingArea") {
      //   props.addColorInDefaultShapeColors(shape.stroke);
      //   props.deleteROIDefaultName(shape.defaultName);
      //   canvas.remove(shape);
      // }
      if((shape.left < boundaryObj.left ||
        shape.top < boundaryObj.top ||
        shape.left + (shape.width * shape.scaleX) > boundaryObj.left + (boundaryObj.width * boundaryObj.scaleX) ||
        shape.top + (shape.height * shape.scaleY) > boundaryObj.top + (boundaryObj.height * boundaryObj.scaleY)) && shape.id !== "trackingArea"){
          showNotification = true;
          props.addColorInDefaultShapeColors(shape.stroke);
          props.deleteROIDefaultName(shape.defaultName);
          canvas.remove(shape);
        }
    });   
    showNotification && props.notificationShow("Zones lying outside of tracking area were removed.");   
    canvas.renderAll();
    props.onShapeAdded();
  }*/

  const removeUnCompletedShapes = () =>{
    let canvas = _fc; 
    let roiTypes = ["rect", "ellipse", "polygon"];
    canvas.getObjects().forEach((shape) => {
      if(shape.id !== "calibratedLine" && !roiTypes.includes(shape.type)) 
        canvas.remove(shape);
    });   
    canvas.renderAll();
  }

  const checkForMinDistance = (polygon) =>{
    const points = polygon.points;
    const minDistance = 10;
    let distance;
    for (let i = 0; i < points.length - 1; i++) {
      distance = Math.sqrt(
        Math.pow(points[i + 1].x - points[i].x, 2) +
        Math.pow(points[i + 1].y - points[i].y, 2)
      );
      if (distance < minDistance) {
          props.setSelected(polygon, true);
          return true;
      }
    }
    return false;
  }

  /**
  * Action when an object is removed from the canvas
  */
  const _onObjectRemoved = e => {
    const { onObjectRemoved } = props
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
  const _onMouseDown = e => {
    const { onMouseDown } = props
    _selectedTool.doMouseDown(e, props, this)
    onMouseDown(e)
  }

  /**
  * Action when the mouse cursor is moving around within the canvas
  */
  const _onMouseMove = e => {
    const { onMouseMove } = props
    _selectedTool.doMouseMove(e, props)
    onMouseMove(e)
  }

  /**
  * Action when the mouse cursor is moving out from the canvas
  */
  const _onMouseOut = e => {
    const { onMouseOut } = props
    _selectedTool.doMouseOut(e)
    if (props.onChange) {
      let onChange = props.onChange
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
    onMouseOut(e)
  }

  const _onMouseUp = e => {
    const { onMouseUp } = props
    _selectedTool.doMouseUp(e, props, this)
    isRotating = false;
    // Update the final state to new-generated object
    // Ignore Path object since it would be created after mouseUp
    // Assumed the last object in canvas.getObjects() in the newest object
    if (props.tool !== Tool.Pencil) {
      const canvas = _fc
      const objects = canvas.getObjects()
      const newObj = objects[objects.length - 1]
      if (newObj && newObj.__version === 1) {
        newObj.__originalState = newObj.toJSON()
      }
    }
    if (props.onChange) {
      let onChange = props.onChange
      setTimeout(() => {
        onChange(e.e)
      }, 10)
    }
    onMouseUp(e)
    isRotating = false;
  }

  /**
  * Track the resize of the window and update our state
  *
  * @param e the resize event
  * @private
  */

  const renderRotateLabel =(ctx, canvas)=> {
    const angleText = `${currentAngle.toFixed(0)}°`,
    borderRadius = 5,
    rectWidth = 32,
    rectHeight = 19,
    textWidth = 6.01 * angleText.length - 2.317;
    const tempPoint = fabric.util.rotatePoint(new fabric.Point(40, 0),new fabric.Point(40, 0),fabric.util.degreesToRadians(30));
    const pos = cursorPos.add(
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

  const getOverlayDimensions  = () => {
    let canvas = _fc;
    if (canvas && canvas.upperCanvasEl) {
      var overlayWidth = document.getElementById("onep-twop-container-2").offsetWidth;
    }
    else {
      var overlayWidth = document.getElementById("oneptwop-container").offsetWidth;
    }
    let resolutionRatio = props.resolutionWidth / props.resolutionHeight;
    if(props.resolutionHeight === 1080 && props.resolutionWidth === 1920){
      var overlayHeight = Math.ceil(props.resolutionHeight / (props.resolutionWidth / overlayWidth));
    }else{
      //var overlayHeight = Math.ceil(document.getElementById("video-container-3").offsetHeight);
      //var overlayWidth = overlayHeight * resolutionRatio;
      var overlayHeight = document.getElementById("video-container-3").offsetHeight;
      var overlayWidth = Math.ceil(props.resolutionWidth / (props.resolutionHeight / overlayHeight));
    }
    console.log('[Tracking Setting][Tracking Area] Canvas Overlay Width:', overlayWidth, overlayHeight);
    return { overlayWidth: overlayWidth,overlayHeight: overlayHeight }
  }

  const _resize = (e, canvasWidth = null, canvasHeight = null) => {
    let {overlayWidth, overlayHeight} = getOverlayDimensions();
    getCanvasAtResoution(overlayWidth, overlayHeight, false);
  };

  const resizeZones = (oldWidth, oldHeight) => {
    return;
    let { scaleHeightMultiplier, scaleMultiplier } = state;
    let canvas = _fc;
    //let cWidth =  canvas.getWidth() - state.strokeWidth;
    //let cHeight = canvas.getHeight() - state.strokeWidth;
    let cWidth =  canvas.getWidth() - state.strokeWidth;
    let cHeight = canvas.getHeight() - state.strokeWidth;
    let newWidth = oldWidth - state.strokeWidth;
    let newHeight = oldHeight - state.strokeWidth;
    if(props.resolutionHeight === 1080 && props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - state.strokeWidth;
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
        var scaleFactor = state.scaleFactor * scaleMultiplier;
        // setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][resizeZones]: object details after resizing", objects[i]);
      }

      updateObjectsInReduxAnimalTrackingKey(scaleMultiplier);
      updateObjectsInRedux(scaleMultiplier);
      console.log("[Tracking Settings][Sketch Field][resizeZones]: Canvas Dimensions after resize", cHeight * cnwidthMultiplier, cWidth * cnHeightMultiplier);
      canvas.discardActiveObject();
      // canvas.setWidth(cWidth * cnwidthMultiplier);
      // canvas.setHeight(cHeight * cnHeightMultiplier);
      //props.trackingCanvasHeight(cHeight * cnHeightMultiplier);
      //props.trackingCanvasWidth( cWidth * cnwidthMultiplier);
      canvas.renderAll();
      // canvas.calcOffset();
      // props.onShapeAdded();
      // setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
      // });
    }
  }

  const resizeZonesOnImport = (newWidth, newHeight) => {
    console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport] New width",newWidth,"NewHeight", newHeight);
    let { scaleHeightMultiplier, scaleMultiplier } = state;
    let canvas = _fc;
    //let cWidth =  canvas.getWidth() - state.strokeWidth;
    //let cHeight = canvas.getHeight() - state.strokeWidth;
    let cWidth =  canvas.getWidth();
    let cHeight = canvas.getHeight();
    if(props.resolutionHeight === 1080 && props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - state.strokeWidth;
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
        var scaleFactor = state.scaleFactor * scaleMultiplier;
        // setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: object details after resizing", objects[i]);
      }
      // props.onShapeAdded();
      updateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      console.log("[Tracking Settings][Sketch Field][resizeZonesOnImport]: Canvas Dimensions after resize", cHeight * cnwidthMultiplier, cWidth * cnHeightMultiplier);
      canvas.discardActiveObject();
      // canvas.setWidth(cWidth * cnwidthMultiplier);
      // canvas.setHeight(cHeight * cnHeightMultiplier);
      props.trackingCanvasHeight(cHeight);
      props.trackingCanvasWidth( cWidth);
      canvas.renderAll();
      // canvas.calcOffset();
      // props.onShapeAdded();
      // setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
      // });
    }
  }

  const resizeOverlayAndCanvasOnCompoentMount = (e, canvasWidth = null, canvasHeight = null) => {
    let {overlayWidth, overlayHeight} = getOverlayDimensions();
    getCanvasAtComponentMount(overlayWidth, overlayHeight, false);
  };

  /*getCanvasAtResoution = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = _fc;
    // let { offsetWidth, clientHeight } = _container;
    let cWidth =  canvas.getWidth() - 1;
    let cHeight = canvas.getHeight() - 1;
    //let cWidth =  canvas.getWidth();
    //let cHeight = canvas.getHeight();
    console.log("[getCanvasAtResoution]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[getCanvasAtResoution]: Canvas width and height after removing 1 px", cWidth, cHeight );
    if (canvas && cWidth !== newWidth  && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      let isMira = props.from === undefined ? true : false;  
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
          var scaleFactor = state.scaleFactor * scaleMultiplier;
          setState({ scaleFactor });
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
      props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
      props.trackingCanvasWidth( cWidth * scaleMultiplier);
      /*canvas.setWidth(Math.ceil(canvas.getWidth() * scaleMultiplier));
      canvas.setHeight(Math.ceil(canvas.getHeight() * scaleHeightMultiplier));
      props.trackingCanvasHeight(Math.ceil(canvas.getHeight() * scaleHeightMultiplier));
      props.trackingCanvasWidth(Math.ceil(canvas.getWidth() * scaleMultiplier));*/
      /*
      canvas.renderAll();
      canvas.calcOffset();

      // setState({
      // parentWidth: offsetWidth
      // });
      var boss = canvas.getObjects().filter(o => o.type == "image")[0];
      if (boss) {
        bindLandmarks();
      }
      setState({canvasHeight:canvas.height,canvasWidth:canvas.width},()=>{
        if(!isMira){
          props.onShapeAdded();
        }
      });
    }
  } */

  const getCanvasAtResoution = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = _fc;
    let cWidth =  canvas.getWidth() - state.strokeWidth;
    let cHeight = canvas.getHeight() - state.strokeWidth;
    if(props.resolutionHeight === 1080 && props.resolutionWidth === 1920){
      //cHeight = canvas.getHeight() - state.strokeWidth;
    }
    console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Overlay container new width and new height", newWidth, newHeight );
    console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Canvas width and height after removing 2 px", cWidth, cHeight );
    if (canvas && cWidth !== newWidth  && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = newWidth / cWidth;
      var scaleHeightMultiplier = newHeight / cHeight;
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
        var scaleFactor = state.scaleFactor * scaleMultiplier;
        setState({ scaleFactor });
        console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: object details after resizing", objects[i]);
      }
      updateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, cWidth, cHeight, true);
      console.log("[Tracking Settings][Sketch Field][getCanvasAtResoution]: Canvas Dimensions after resize", cHeight * scaleMultiplier, cWidth * scaleHeightMultiplier);
      canvas.discardActiveObject();
      canvas.setWidth(cWidth * scaleMultiplier);
      canvas.setHeight(cHeight * scaleHeightMultiplier);
      props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
      props.trackingCanvasWidth( cWidth * scaleMultiplier);
      canvas.renderAll();
      canvas.calcOffset();
      setState({canvasHeight:canvas.height,canvasWidth:canvas.width, scaleHeightMultiplier, scaleMultiplier},()=>{
              });
    }
  }

  const scaleObject = (object, scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false) =>{
    object.left = object.left * scaleMultiplier;
    object.top = object.top * scaleMultiplier;
    object.scaleX = object.scaleX * scaleMultiplier;
    object.scaleY = object.scaleY * scaleMultiplier;
    if(object.type === "ellipse") {
      let canvas = _fc;
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
      let canvas = _fc;
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
    let canvas = _fc;
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
  const updateObjectsInReduxAnimalTrackingKey = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false ) => {
    let scaleMultiplierForObjects = scaleMultiplier;
    let trackingArea = scaleObject(JSON.parse(JSON.stringify(props.trackingArea)), scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    props.saveDimesions(trackingArea);
    let lineShape = [];
    if(props.lineShape.length){
      lineShape[0] = scaleObject(JSON.parse(JSON.stringify(props.lineShape[0])), scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    props.updateLineShape(lineShape);
    let zones = [];
    props.zones.map(zone => {
      let scaledObject = scaleObject(zone, scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
      zones.push(scaledObject);
    })
    props.updateArenaZoneShapesList(zones);
  }

  const updateObjectsInRedux = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false) => {
    const { selectedCameraForTracking } = props;
    let nVisionSession = JSON.parse(JSON.stringify(props.nVisionSession));
    let trackingInterface = nVisionSession.userInterface.trackingInterface;
    let trackingArea = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].trackingArea));
    console.log("[tracking settings][Sketch Field][updateObjectsInRedux][scaling objects][object details before scaling]: ", trackingArea);
    let lineShape = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].calibrateArena.geometry.coordinates));
    let arenaZoneShapesList = JSON.parse(JSON.stringify(trackingInterface[selectedCameraForTracking].arenaZone.zoneList));
    trackingArea.geometry.coordinates = scaleObject(trackingArea.geometry.coordinates,scaleMultiplier,scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    if(lineShape.length){
      lineShape[0] = scaleObject(lineShape[0], scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    let zones = [];
    arenaZoneShapesList.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(scaleObject(zone, scaleMultiplier,scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions)));
      zones.push(scaledObject);
    })
    console.log("[Tracking Settings][Sketch Field][updateObjectsInRedux][scaling objects]: Objects details after rescaling: ", arenaZoneShapesList );
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].trackingArea = trackingArea;
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].calibrateArena.geometry.coordinates = lineShape;
    nVisionSession.userInterface.trackingInterface[selectedCameraForTracking].arenaZone.zoneList = zones;
    props.updateNvisionSession(nVisionSession);
  }

  const getCanvasAtComponentMount = (newWidth, newHeight, scaleLandmarks = false) => {
    let canvas = _fc;
    let cWidth =  canvas.getWidth();
    let cHeight = canvas.getHeight();
    var scaleMultiplier = newWidth / cWidth;
    var scaleHeightMultiplier = newHeight / cHeight;
    /*let scaleMultiplierForObjects = newWidth / props.oldCanvasWidth;
    let trackingArea = scaleObject(JSON.parse(JSON.stringify(props.trackingArea)), scaleMultiplierForObjects);
    props.saveDimesions(trackingArea);
    let lineShape = scaleObject(JSON.parse(JSON.stringify(props.lineShape)), scaleMultiplierForObjects);
    props.updateLineShape(lineShape);
    let zones = [];
    props.zones.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(scaleObject(zone, scaleMultiplierForObjects)));
      zones.push(scaledObject);
    })
    props.updateArenaZoneShapesList(zones);*/
    console.log("[Tracking Settings][Sketch Field][getCanvasAtComponentMount][component mount] Resize Canvas Dimensions to: ", cHeight * scaleHeightMultiplier, cWidth * scaleMultiplier);
    canvas.setWidth(cWidth * scaleMultiplier);
    canvas.setHeight(cHeight * scaleHeightMultiplier);
    props.trackingCanvasHeight(cHeight * scaleHeightMultiplier);
    props.trackingCanvasWidth( cWidth * scaleMultiplier);
    canvas.renderAll();
    canvas.calcOffset();
    setState({canvasHeight:canvas.height,canvasWidth:canvas.width},()=>{
          });
    resizeCanvas(true, false);
  }

  const resizeCanvas = (addDimension = false, resize = true) => {
    let currCanvas = _fc;
    let {overlayWidth, overlayHeight} = getOverlayDimensions();
    console.log("[Tracking Settings][Sketch Field][resize Canvas][Current width and height of overlay container] :", overlayWidth, overlayHeight);
    console.log("[Tracking Settings][Sketch Field][resize Canvas][Current width and height of canvas] :", currCanvas.getWidth(),currCanvas.getHeight());
    if(resize){
      _resize();
    }
    let newCanvasWidth = overlayWidth;
    let newCanvasHeight = overlayHeight;
    if(addDimension){
      newCanvasWidth = getActualCanvasDimensions(overlayWidth, overlayHeight, true).width;
      newCanvasHeight = getActualCanvasDimensions(overlayWidth,overlayHeight,true).height;
    }
    currCanvas.setHeight(newCanvasHeight);
    currCanvas.setWidth(newCanvasWidth);
    currCanvas.requestRenderAll();
    props.trackingCanvasHeight(currCanvas.getHeight());
    props.trackingCanvasWidth(currCanvas.getWidth());
        console.log("[Tracking Settings][Sketch Field][resize Canvas][width and height of canvas after resize] :", currCanvas.getWidth(),currCanvas.getHeight());
  }

  const setCanvasWidthHeightInRedux = () => {
    let currCanvas = _fc;
    props.trackingCanvasHeight(currCanvas.getHeight());
    props.trackingCanvasWidth(currCanvas.getWidth());
  }

  /* const bindLandmarks = (updateLandmarks = false, canvasData) => {
    let canvas = canvasData ? canvasData : _fc;
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
      updateOnepTwop('_landmarks');
      console.log("[MIRA] Updated list of landmarks objects: ", JSON.stringify(landMarks));
    }
  } */

  const getActualCanvasDimensions = (width, height, fullWidth=true) => {
    let canvas = _fc;
    let obj = { width:width, height:height };
    obj.width = width + state.strokeWidth;
    obj.height = height + ( fullWidth ? state.strokeWidth : (state.strokeWidth +0) );
    return obj;
  }

  const onMountUpdateObjectsInReduxAnimalTrackingKey = (scaleMultiplier, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions = false, trackingArea, arenaZoneShapesList, lineShape) => {
    let scaleMultiplierForObjects = scaleMultiplier;
    let trackingObject = scaleObject(JSON.parse(JSON.stringify(trackingArea)), scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    props.saveDimesions(trackingObject);
    let lineObject = [];
    if(lineShape.length){
      lineObject[0] = scaleObject(JSON.parse(JSON.stringify(lineShape[0])), scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions);
    }
    props.updateLineShape(lineObject);
    let zones = [];
    arenaZoneShapesList.map(zone => {
      let scaledObject = JSON.parse(JSON.stringify(scaleObject(zone, scaleMultiplierForObjects, scaleMultiplierForObjects, scaleHeightMultiplier,cWidth, cHeight, updateCanvasDimensions)));
      zones.push(scaledObject);
    })
    props.updateArenaZoneShapesList(zones);
  }

  const resizeReduxAndSessionObjectsOnMount = (oldWidth, oldHeight, trackingArea, arenaZoneShapesList, lineShape) => {
    let canvas = _fc;
    let cWidth =  canvas.getWidth() - state.strokeWidth;
    let cHeight = canvas.getHeight() - state.strokeWidth;
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsOnMount]: canvas Old width and old height:", oldWidth, oldHeight);
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsOnMount]: Current Canvas width and height : ", cWidth, cHeight );
    if (canvas && oldWidth !== cWidth && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = cWidth/oldWidth;
      var scaleHeightMultiplier = cHeight/oldHeight;
      onMountUpdateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true, trackingArea, arenaZoneShapesList, lineShape );
      updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true);
    }
  }

  const resizeReduxAndSessionObjectsAfterPageLoad = (oldWidth, oldHeight, trackingArea, arenaZoneShapesList, lineShape) => {
    let canvas = _fc;
    let cWidth =  canvas.getWidth() - state.strokeWidth;
    let cHeight = canvas.getHeight() - state.strokeWidth;
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsAfterPageLoad]: canvas Old width and old height:", oldWidth, oldHeight);
    console.log("[Tracking Settings][Sketch Field][resizeReduxAndSessionObjectsAfterPageLoad]: Current Canvas width and height : ", cWidth, cHeight );
    if (canvas && oldWidth !== cWidth && canvas.upperCanvasEl) {
    //if (canvas && canvas.upperCanvasEl) {
      var scaleMultiplier = cWidth/oldWidth;
      var scaleHeightMultiplier = cHeight/oldHeight;
      onMountUpdateObjectsInReduxAnimalTrackingKey(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true, trackingArea, arenaZoneShapesList, lineShape );
      updateObjectsInRedux(scaleMultiplier,scaleHeightMultiplier, oldWidth, oldHeight, true);
    }
  }
  /**
  * Sets the background color for this sketch
  * @param color in rgba or hex format
  */
  const _backgroundColor = color => {
    if (!color) return
    let canvas = _fc
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
  const zoom = factor => {
    let canvas = _fc
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
  const undo = () => {
    let history = _history
    let [obj, prevState, currState] = history.getCurrent()
    history.undo()
    if (obj.__removed) {
      setState({ action: false }, () => {
        _fc.add(obj)
        obj.__version -= 1
        obj.__removed = false
      })
    } else if (obj.__version <= 1) {
      _fc.remove(obj)
    } else {
      obj.__version -= 1
      obj.setOptions(JSON.parse(prevState))
      obj.setCoords()
      _fc.renderAll()
    }
    if (props.onChange) {
      props.onChange()
    }
  }

  /**
  * Perform a redo operation on canvas, if it cannot redo it will leave the canvas intact
  */
  const redo = () => {
    let history = _history
    if (history.canRedo()) {
      let canvas = _fc
      //noinspection Eslint
      let [obj, prevState, currState] = history.redo()
      if (obj.__version === 0) {
        setState({ action: false }, () => {
          canvas.add(obj)
          obj.__version = 1
        })
      } else {
        obj.__version += 1
        obj.setOptions(JSON.parse(currState))
      }
      obj.setCoords()
      canvas.renderAll()
      if (props.onChange) {
        props.onChange()
      }
    }
  }

  /**
  * Delegation method to check if we can perform an undo Operation, useful to disable/enable possible buttons
  *
  * @returns {*} true if we can undo otherwise false
  */
  const canUndo = () => {

    return _history.canUndo()
  }

  /**
  * Delegation method to check if we can perform a redo Operation, useful to disable/enable possible buttons
  *
  * @returns {*} true if we can redo otherwise false
  */
  const canRedo = () => {

    return _history.canRedo()
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
  const toDataURL = options => _fc.toDataURL(options)

  /**
  * Returns JSON representation of canvas
  *
  * @param propertiesToInclude Array <optional> Any properties that you might want to additionally include in the output
  * @returns {string} JSON string
  */
  const toJSON = propertiesToInclude => _fc.toJSON(propertiesToInclude)

  /**
  * Populates canvas with data from the specified JSON.
  *
  * JSON format must conform to the one of fabric.Canvas#toDatalessJSON
  *
  * @param json JSON string or object
  */
  const fromJSON = json => {
    if (!json) return
    let canvas = _fc
    setTimeout(() => {
      canvas.loadFromJSON(json, () => {
        if (props.tool === Tool.DefaultTool) {
          canvas.isDrawingMode = canvas.selection = false
          canvas.forEachObject(o => (o.selectable = o.evented = false))
        }
        canvas.renderAll()
        if (props.onChange) {
          props.onChange()
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
  const clear = propertiesToInclude => {
    let discarded = toJSON(propertiesToInclude)
    _fc.clear()
    // _history.clear()
    return discarded
  }


  /**
  * Remove selected object from the canvas
  */
  const removeSelected = () => {
    let canvas = _fc
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
        // _history.keep([obj, state, state])
        canvas.remove(obj)
      })
      canvas.discardActiveObject()
      canvas.requestRenderAll()
    }
  }

  const copy = () => {
    let canvas = _fc
    canvas.getActiveObject().clone(cloned => (_clipboard = cloned))
  }

  const paste = () => {

    // clone again, so you can do multiple copies.
    _clipboard.clone(clonedObj => {
      let canvas = _fc
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
      _clipboard.top += 10
      _clipboard.left += 10
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
  const setBackgroundFromDataUrl = (dataUrl, options = {}) => {
    let canvas = _fc
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

  const addText = (text, options = {}) => {
    let canvas = _fc
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

  const callEvent = (e, eventFunction) => {
    // console.log("inside callEvet method");
    if (_selectedTool)
      eventFunction(e);
  }

 /*  const addLandmarks = (canvas, frontEnd) => {
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
 */
    useEffect(() => {
    let {
      tool,
      value,
      undoSteps,
      defaultValue,
      backgroundColor,
      image
    } = props

    //console.log("value is coming in component did mount before starttttt-- > ", _fc);

    //let canvas = _fc = new fabric.Canvas("roi-canvas", { centeredRotation: true, centeredScaling: true });
    let canvas = (_fc = new fabric.Canvas(
      _canvas,
      {
        centeredRotation: true,
        centeredScaling: false,
        //id: "roi-canvas"
      } /*, {
 preserveObjectStacking: false,
 renderOnAddRemove: false,
 skipTargetFind: true
 }*/
    ))
    canvas.centeredScaling = false;
    _initTools(canvas)

    // set initial backgroundColor
    _backgroundColor(backgroundColor)

    let selectedTool = _tools[tool]
    if (selectedTool) selectedTool.configureCanvas(props)
    _selectedTool = selectedTool

    // Control resize

    //window.addEventListener('resize', _resize, false)

    // Initialize History, with maximum number of undo steps
    // _history = new History(undoSteps);

    // Events binding
    canvas.on('object:added', e => callEvent(e, _onObjectAdded))
    canvas.on('object:modified', e => callEvent(e, _onObjectModified))
    canvas.on('object:removed', e => callEvent(e, _onObjectRemoved))
    canvas.on('mouse:down', e => callEvent(e, _onMouseDown))
    canvas.on('mouse:move', e => callEvent(e, _onMouseMove))
    canvas.on('mouse:up', e => callEvent(e, _onMouseUp))
    canvas.on('mouse:out', e => callEvent(e, _onMouseOut))
    canvas.on('object:moving', e => callEvent(e, _onObjectMoving))
    canvas.on('object:scaling', e => callEvent(e, _onObjectScaling))
    canvas.on('object:rotating', e => callEvent(e, _onObjectRotating))
    canvas.on("after:render", (opt) => {
      // isRotating && renderRotateLabel(opt.ctx, canvas);
    });
    // IText Events fired on Adding Text
    // canvas.on("text:event:changed", console.log)
    // canvas.on("text:selection:changed", console.log)
    // canvas.on("text:editing:entered", console.log)
    // canvas.on("text:editing:exited", console.log)

    disableTouchScroll()

    // setTimeout(() => {
    //_resize()
    resizeOverlayAndCanvasOnCompoentMount();
      // }, 3000);

      // if (image !== null) {
      // addImg(image);
      // }
      // initialize canvas with controlled value if exists
      (value || defaultValue) && fromJSON(value || defaultValue)
      return () => {
          window.removeEventListener('resize', _resize)
          executeCanvasResize = false;
      }

    },[]);

    useEffect(()=>{
        if (props.tool !== _selectedTool) {
            _selectedTool = _tools[props.tool]
            //Bring the cursor back to default if it is changed by a tool
            _fc.defaultCursor = 'default'
            if (_selectedTool) {
                _selectedTool.configureCanvas(props);
            }
        }
    }, [_selectedTool, props.tool]);

    useEffect(() => {
        if (props.backgroundColor !== prevPropsRef.backgroundColor) {
            _backgroundColor(props.backgroundColor)
        }
    }, [props.backgroundColor]);

    /* useEffect(() => {
        if (props.image !== state.imageUrl) {
            // addImg(props.image)
            setState({
                imageUrl: props.image,
                scaleFactor: state.scaleFactor,
                rotation: props.oneptwop.inscopix.adapter_lsm.rotation,
                flipApplied: props.oneptwop.inscopix.adapter_lsm.flip_horizontal
            })
        }
    }, [props.image, state.imageUrl]); */

    useEffect(() => {
        if (
            props.value !== prevPropsRef.value ||
            (props.value && props.forceValue)
        ) {
            fromJSON(props.value)
        }
    }, [props.value]);
    
  const onChangeSize = (width, height) => {
    // if (state.imageUrl !== null) {
    // addImg(state.imageUrl);
    // // if (state.rotation !== 0 && _fc.item(0)) {
    // // rotateAndScale(_fc.item(0), -state.rotation, _fc, state.scaleFactor);
    // // _fc.renderAll();
    // // }
    // }

    // _resize();
    console.log("[TRACKING SETTINGS][NVISION SKETCH FIELD][onChangeSize]: Resized to:", width, height);
    resizeCanvas(true);
  }

  const removeAddOrMoveMode = () => {
    let canvas = _fc;
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

  const createRect = () =>{
    let canvas = _fc;
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
      strokeWidth: state.strokeWidth,
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
    props.onShapeAdded();
  }
    let { className, style, width, height } = props



    let canvasDivStyle = Object.assign(
      {},
      style ? style : {},
      width ? { width: '100%' } : { width: '100%' },
      //width ? { width: state.canvasWidth } : { width: state.canvasWidth },
      height ? { height: state.canvasHeight } : { height: state.canvasHeight }
    )
// console.log("TRACKLING SETTINGS NVISION SKETCH FIELD LINK");
    return (
      <RefWrapper refCallback={(ref) => _container = ref.current} >
        <div
          className={className}
          style={canvasDivStyle}
          id="onep-twop-container-2"
        >
          <ReactResizeDetector onResize={onChangeSize.bind(this)} />
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
              ref={c => (_canvas = c)}
            >
            </canvas>
            </div>
          {/* </ReactResizeDetector> */}
          {/* {_fc !== null && _fc.item(0) && props.from === undefined &&
            <NvistaRoiSettings
              canvasProps={_fc}
              landMarks={props.oneptwop.inscopix.frontend}
              imageData={props.oneptwop}
              oneptwop={props.oneptwop}
              rotateAndScale={rotateAndScale}
              crosshairMode={state.crosshairMode}
              crosshairMoveMode={state.crosshairMoveMode}
              crosshairDeleteMode={state.crosshairDeleteMode}
              deleteAllLandmarks={state.deleteAllLandmarks}
              oneptwopCompare={props.oneptwopCompare}
              oneptwopDefault={props.oneptwopDefault}
              updateSlider={props.updateSlider}
              applyFlip={applyFlip}
              resetAllLandmarks={state.resetAllLandmarks}
              updateOnepTwop={updateOnepTwop}
              loadFromSession={props.loadFromSession}
              updateSbpfTransformValues={props.updateSbpfTransformValues}
              handleMiraErrorPopup={props.handleMiraErrorPopup}
            />} */}

        </div>
      </RefWrapper>
    )
});

NvisionSketchField.propTypes = {
  // ... all PropTypes definitions ...
  lineColor: PropTypes.string,
  lineWidth: PropTypes.number,
  fillColor: PropTypes.string,
  backgroundColor: PropTypes.string,
  opacity: PropTypes.number,
  undoSteps: PropTypes.number,
  tool: PropTypes.string,
  imageFormat: PropTypes.string,
  value: PropTypes.object,
  forceValue: PropTypes.bool,
  widthCorrection: PropTypes.number,
  heightCorrection: PropTypes.number,
  onChange: PropTypes.func,
  defaultValue: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  onObjectAdded: PropTypes.func,
  onObjectModified: PropTypes.func,
  onObjectRemoved: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseUp: PropTypes.func,
  onMouseOut: PropTypes.func,
  onObjectMoving: PropTypes.func,
  onObjectScaling: PropTypes.func,
  onObjectRotating: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
  image: PropTypes.string,
  callResize: PropTypes.bool
};

NvisionSketchField.defaultProps = {
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
};

export default NvisionSketchField;