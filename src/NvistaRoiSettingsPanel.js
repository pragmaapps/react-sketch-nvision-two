import React, { Component } from 'react';
import { fabric } from 'fabric';
// import RoiShapes from './RoiShapes';
import plus from './img/plus.svg';

class NvistaRoiSettings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            canvas: null,
            checked: true,
            lmColor: ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ff00', '#00ffff', '#ffa500', '#ffffff', '#008000', '#800080'],
            lmColorUsed: ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ff00', '#00ffff', '#ffa500', '#ffffff', '#008000', '#800080'],
            lmColorIndex: 0,

            crosshairMode: false,
            crosshairMoveMode: false,
            crosshairDeleteMode: false,
            deleteAllLandmarks: false,
            resetAllLandmarks: false
        };
        this.deleteAll = this.deleteAll.bind(this);
        this.enterCrosshairMode = this.enterCrosshairMode.bind(this);
        this.exitCrosshairMode = this.exitCrosshairMode.bind(this);
        this.deleteCrosshairMode = this.deleteCrosshairMode.bind(this);
        this.scaleObj = this.scaleObj.bind(this);
        this.bindLandmarks = this.bindLandmarks.bind(this);
        this.resetLandmarks = this.resetLandmarks.bind(this);
    }

    resetLandmarks() {
        var self = this;
        if (this.props.oneptwopCompare.inscopix.adapter_lsm.rotation !== this.props.oneptwop.inscopix.adapter_lsm.rotation) {
            // self.props.updateSlider(this.props.oneptwopCompare.inscopix.adapter_lsm.rotation, true);
        }

        if (this.props.oneptwopCompare.inscopix.adapter_lsm.flip_horizontal !== this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal) {
            self.props.applyFlip(this.props.oneptwopCompare.inscopix.adapter_lsm.flip_horizontal, false);
        }

        var objects = this.props.canvasProps.getObjects('path');
        for (let i in objects) {
            this.props.canvasProps.remove(objects[i]);
        }
        let defaultColors = ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ff00', '#00ffff', '#ffa500', '#ffffff', '#008000', '#800080'];
        fabric.util.enlivenObjects(this.props.oneptwopCompare.inscopix.frontend, function (objects) {
            var origRenderOnAddRemove = self.props.canvasProps.renderOnAddRemove;
            self.props.canvasProps.renderOnAddRemove = false;

            objects.forEach(function (o) {
                self.props.canvasProps.add(o);
            });

            self.props.canvasProps.renderOnAddRemove = origRenderOnAddRemove;
            if (self.props.canvasProps.item(1) && self.props.canvasProps.item(1).cnWidth !== self.props.canvasProps.getWidth()) {
                var scaleMultiplier = self.props.canvasProps.getWidth() / self.props.canvasProps.item(1).cnWidth;
                var objects = self.props.canvasProps.getObjects();
                for (var i in objects) {
                    if (objects[i].type !== "image") {
                        objects[i].left = objects[i].left * scaleMultiplier;
                        objects[i].top = objects[i].top * scaleMultiplier;
                        objects[i].cnWidth = self.props.canvasProps.getWidth();
                        objects[i].cnHeight = self.props.canvasProps.getHeight();
                        objects[i].setCoords();
                    }

                }
            }
            self.bindLandmarks(true, true);
            self.props.canvasProps.renderAll();
            self.setState({
                lmColorUsed: defaultColors
            }, () => {
                let fabricList = JSON.parse(JSON.stringify(self.props.canvasProps.getObjects().filter(o => o.type !== "image")));
                fabricList.map((item, key) => {
                    let color = item.fill
                    self.state.lmColorUsed.map((item, index) => {
                        if (item == color) {
                            self.state.lmColorUsed.splice(index, 1)
                        }
                    })
                })
                if (self.props.oneptwopCompare.inscopix.adapter_lsm.rotation !== self.props.oneptwop.inscopix.adapter_lsm.rotation) {
                    // self.props.updateSlider(self.props.oneptwop.inscopix.adapter_lsm.rotation, false);
                }
                if (self.props.oneptwopCompare.inscopix.adapter_lsm.flip_horizontal !== self.props.oneptwop.inscopix.adapter_lsm.flip_horizontal) {
                    self.props.applyFlip(self.props.oneptwop.inscopix.adapter_lsm.flip_horizontal, false);
                }
                self.props.oneptwop.inscopix.frontend = JSON.parse((JSON.stringify(self.props.oneptwopCompare.inscopix.frontend)));

            })
        });
    }

    deleteAll() {
        var objects = this.props.canvasProps.getObjects('path');
        for (let i in objects) {
            this.props.canvasProps.remove(objects[i]);
        }
        this.props.canvasProps.renderAll();
        let defaultColors = ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ff00', '#00ffff', '#ffa500', '#ffffff', '#008000', '#800080'];
        // document.getElementById("clearAllLandmark").classList.add("active");
        /*document.getElementById("addLandmark").classList.remove("active");
        document.getElementById("moveLandmark").classList.remove("active");
        document.getElementById("deleteLandmark").classList.remove("active");*/
        this.setState({
            canvas: this.props.canvasProps,
            lmColorIndex: 0,
            lmColorUsed: defaultColors
        })
        // setTimeout(() => {
        //     document.getElementById("clearAllLandmark").classList.remove("active");
        // }, 1000)
        let landMarks = this.props.canvasProps ? JSON.parse(JSON.stringify(this.props.canvasProps.getObjects().filter(o => o.type !== "image"))) : [];
        this.props.updateOnepTwop('_landmarks', landMarks);
    }

    enterCrosshairMode() {
        console.log("[MIRA] landmarks mode: add landmarks");
        let self = this;




        self.props.canvasProps.forEachObject(function (o) {
            o.selectable = false;
        });
        self.props.canvasProps.hoverCursor = 'pointer';
        self.props.canvasProps.off('mouse:up');
        self.props.canvasProps.on('mouse:up', function (event) {
            let landmarkList = JSON.parse(JSON.stringify(self.props.canvasProps.getObjects()));
            if (landmarkList && landmarkList.length > 10) {
                self.props.handleMiraErrorPopup("Only 10 landmarks are allowed. Please remove a landmark before adding additional landmarks.", "Warning");
                return false;
            }
            if (!event.target || event.target.type !== 'image') {
                return false;
            }
            var pointer = self.props.canvasProps.getPointer(event.e, true);
            fabric.loadSVGFromURL(plus, function (objects, options) {
                var obj = fabric.util.groupSVGElements(objects, options);
                /*obj.toObject = (function(toObject) {
                    return function() {
                      return fabric.util.object.extend(toObject.call(this), {
                        cnWidth: this.cnWidth,
                        cnHeight: this.cnHeight
                      });
                    };
                })(obj.toObject);*/
                obj.set({
                    fill: self.state.lmColorUsed[0],
                    left: Math.round(pointer.x),
                    top: Math.round(pointer.y),
                    originX: 'center',
                    originY: 'center',
                    hasControls: false,
                    hasBorders: true,
                    hasRotatingPoint: false,
                    borderColor: '#ffffff',
                    scaleX: 1,
                    scaleY: 1,
                    selectable: false,
                    borderOpacityWhenMoving: 1,
                    lockScalingX: true,
                    lockScalingY: true,
                    noScaleCache: false,
                });
                obj.cnWidth = self.props.canvasProps.getWidth();
                obj.cnHeight = self.props.canvasProps.getHeight();
                self.scaleObj(obj, -self.props.oneptwop.inscopix.adapter_lsm.rotation);
                self.props.canvasProps.add(obj).requestRenderAll();
                self.state.lmColorUsed.splice(0, 1)
                self.bindLandmarks(true, true);
                self.props.canvasProps.requestRenderAll();
            })

        })
    }

    scaleObj(obj, angle) {
        let self = this;
        var width = self.props.canvasProps.getWidth();
        var height = self.props.canvasProps.getHeight();
        var cos_theta = Math.cos(angle * Math.PI / 180);
        var sin_theta = Math.sin(angle * Math.PI / 180);
        var x_scale = width / (Math.abs(width * cos_theta) + Math.abs(height * sin_theta));
        var y_scale = height / (Math.abs(width * sin_theta) + Math.abs(height * cos_theta));
        var scale = Math.min(x_scale, y_scale);
        // get the transformMatrix array
        var rotateMatrix = [cos_theta, -sin_theta, sin_theta, cos_theta, 0, 0];
        var scaleMatrix = [scale, 0, 0, scale, 0, 0];
        //var scaleMatrix = [scale, 0 , 0, scale, 0, 0];
        var rsT = fabric.util.multiplyTransformMatrices(rotateMatrix, scaleMatrix);
        // Unfold the matrix in a combination of scaleX, scaleY, skewX, skewY...
        var options = fabric.util.qrDecompose(rsT);
        obj.set(options);
        obj.setCoords();
    }

    exitCrosshairMode(event) {
        console.log("[MIRA] landmarks mode: move landmarks");
        let self = this;
        // document.getElementById("clearAllLandmark").classList.remove("active");
        // document.getElementById("deleteLandmark").classList.remove("active");
        // document.getElementById("addLandmark").classList.remove("active");
        // document.getElementById("moveLandmark").classList.add("active");
        self.props.canvasProps.forEachObject(function (o) {
            if (o.type !== "image") {
                o.selectable = true;
            }
        });
        self.props.canvasProps.hoverCursor = 'pointer';
        self.props.canvasProps.off('mouse:up');
        self.props.canvasProps.on('mouse:up', function () {
        });
        self.props.canvasProps.on('object:moving', function (options) {
            self.props.canvasProps.hoverCursor = 'pointer';
        });

    }

    deleteCrosshairMode(event) {
        console.log("[MIRA] Landmarks mode: delete landmarks");
        let self = this;
        // document.getElementById("clearAllLandmark").classList.remove("active");
        // document.getElementById("addLandmark").classList.remove("active");
        // document.getElementById("moveLandmark").classList.remove("active");
        // document.getElementById("deleteLandmark").classList.add("active");
        self.props.canvasProps.defaultCursor = 'default';
        self.props.canvasProps.forEachObject(function (o) {
            o.selectable = false;
        });
        self.props.canvasProps.hoverCursor = 'pointer';
        self.props.canvasProps.off('mouse:up');
        self.props.canvasProps.on('mouse:up', function (options) {
            if (options.target && options.target.type == 'path') {
                self.state.lmColorUsed.push(options.target.fill)
                self.props.canvasProps.remove(options.target);
            }
            let landMarks = self.props.canvasProps ? JSON.parse(JSON.stringify(self.props.canvasProps.getObjects().filter(o => o.type !== "image"))) : [];
            console.log("[MIRA] List of Landmarks after deleting objects: ", JSON.stringify(landMarks));
            self.props.updateOnepTwop('_landmarks', landMarks);
        });

    }

    bindLandmarks(updateLandmarks = false, updateForOtherWindow = false) {
        let self = this;
        var multiply = fabric.util.multiplyTransformMatrices;
        var invert = fabric.util.invertTransform;
        var boss = self.props.canvasProps.getObjects().filter(o => o.type == "image");
        var minions = self.props.canvasProps.getObjects().filter(o => o.type !== "image");
        if (boss && boss[0]) {
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
                let landMarks = self.props.canvasProps ? JSON.parse(JSON.stringify(self.props.canvasProps.getObjects().filter(o => o.type !== "image"))) : [];
                this.props.updateOnepTwop('_landmarks', updateForOtherWindow);
                console.log("[MIRA] Updated list of landmarks objects: ", JSON.stringify(landMarks));
            }
        }
    }

    componentDidMount() {
        let self = this;
        fabric.Object.prototype.objectCaching = false;

        window.canvas = self.props.canvasProps;
        self.props.canvasProps.selection = false;
        let imageObject = JSON.parse(JSON.stringify(self.props.canvasProps.getObjects()));
        let landMarks = this.props.landMarks;
        if (landMarks.length > 0) {
            landMarks.splice(0, 0, imageObject[0]);
        } else {
            landMarks = imageObject;
        }
        self.props.canvasProps.loadFromJSON(`{"objects":${JSON.stringify(landMarks)}}`, function () {
            if (self.props.imageData) {
                self.props.updateSbpfTransformValues(self.props.imageData, self.props.loadFromSession);
            } else {
                self.props.rotateAndScale(self.props.canvasProps.item(0), -0);
            }
            if (self.props.canvasProps.item(1) && self.props.canvasProps.item(1).cnWidth !== self.props.canvasProps.getWidth()) {
                var scaleMultiplier = self.props.canvasProps.getWidth() / self.props.canvasProps.item(1).cnWidth;
                var objects = self.props.canvasProps.getObjects();
                for (var i in objects) {
                    if (objects[i].type !== "image") {
                        objects[i].left = objects[i].left * scaleMultiplier;
                        objects[i].top = objects[i].top * scaleMultiplier;
                        objects[i].cnWidth = self.props.canvasProps.getWidth();
                        objects[i].cnHeight = self.props.canvasProps.getHeight();
                        objects[i].setCoords();
                    }

                }
            }
            if (self.props.canvasProps) {
                let fabricList = JSON.parse(JSON.stringify(self.props.canvasProps.getObjects().filter(o => o.type !== "image")));
                fabricList.map((item, key) => {
                    let color = item.fill
                    self.state.lmColorUsed.map((item, index) => {
                        if (item == color) {
                            self.state.lmColorUsed.splice(index, 1)
                        }
                    })
                })
                self.props.canvasProps.forEachObject(function (o) {
                    o.selectable = false;
                });
            }
            self.bindLandmarks(true, false);
            self.props.canvasProps.renderAll();

        });
        self.props.canvasProps.hoverCursor = 'default';

        self.props.canvasProps.on('mouse:down', function (options) {
            if (options.target && options.target.type == 'path') {
                options.target.set({
                    hasControls: false,
                    hasBorders: true,
                    hasRotatingPoint: false,
                    borderColor: '#ffffff',
                    borderOpacityWhenMoving: 1,
                    lockScalingX: true,
                    lockScalingY: true
                })
            }
        });

        self.props.canvasProps.on('object:modified', function (options) {
            try {
                var obj = options.target;
                if (obj.type == "image") {
                    return;
                }
                var canvasTL = new fabric.Point(0, 0);
                var canvasBR = new fabric.Point(self.props.canvasProps.getWidth(), self.props.canvasProps.getHeight());
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
                    self.props.canvasProps.renderAll();
                }
                self.bindLandmarks(true, true);
            }
            catch (err) {
                alert("exception in keepObjectInBounds\n\n" + err.message + "\n\n" + err.stack);
            }
        });

        this.setState({ canvas: self.props.canvasProps }, () => {
            console.log("[MIRA] initial list of landmarks objects: ", JSON.stringify(this.props.canvasProps));
        });
    }


    componentDidUpdate(prevProps, prevState) {
        //console.log("state has been changed>>>>>");
        if (this.props.crosshairMode !== this.state.crosshairMode) {
            this.enterCrosshairMode();
            this.setState({ crosshairMode: this.props.crosshairMode });
        }

        if (this.props.crosshairMoveMode !== this.state.crosshairMoveMode) {
            this.exitCrosshairMode();
            this.setState({ crosshairMoveMode: this.props.crosshairMoveMode });
        }

        if (this.props.crosshairDeleteMode !== this.state.crosshairDeleteMode) {
            this.deleteCrosshairMode();
            this.setState({ crosshairDeleteMode: this.props.crosshairDeleteMode });
        }

        if (this.props.deleteAllLandmarks !== this.state.deleteAllLandmarks) {
            this.deleteAll();
            this.setState({ deleteAllLandmarks: this.props.deleteAllLandmarks });
        }

        if (this.props.resetAllLandmarks !== this.state.resetAllLandmarks) {
            this.resetLandmarks();
            this.setState({ resetAllLandmarks: this.props.resetAllLandmarks });
        }
    }
    componentWillUnmount() {
        this.props.canvasProps.clear();
        this.props.canvasProps.dispose();
        this.setState({
            canvas: null,
            lmColorIndex: 0
        })
        console.log("[MIRA]: dispose the canvas and unmount the component")
    }

    render() {
        return (
            <div></div>
            // <RoiShapes
            //     deleteAll={this.deleteAll}
            //     enterCrosshairMode={this.enterCrosshairMode}
            //     exitCrosshairMode={this.exitCrosshairMode}
            //     deleteCrosshairMode={this.deleteCrosshairMode}
            //     resetLandmarks={this.resetLandmarks}
            // />
        )
    }
}

export default NvistaRoiSettings;
