/*eslint no-unused-vars: 0*/
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import ReactResizeDetector from 'react-resize-detector';
import NvistaRoiSettings from './NvistaRoiSettingsPanel';

const fabric = require('fabric').fabric;

/**
 * Sketch Tool based on FabricJS for React Applications
 */
class MiraMode extends PureComponent {
    static propTypes = {
        // outside the component
        value: PropTypes.object,
        // Specify action on change
        onChange: PropTypes.func,
        // Sketch width
        width: PropTypes.number,
        // Sketch height
        height: PropTypes.number,
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
        image: null,
        callResize: false,
    }

    state = {
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
        resetAllLandmarks: false
    }

    _fc = null


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
                selectable: false,
                hasControls: false,
                hasBorders: false,
                hasRotatingPoint: false
            })

            oImg.scale(scaleFactor);
            canvas.add(oImg);
            this.setState({
                scaleFactor: scaleFactor
            });
            canvas.renderAll();
        })
    }




    /**
     * Track the resize of the window and update our state
     *
     * @param e the resize event
     * @private
     */



    _resize = (e, canvasWidth = null, canvasHeight = null) => {
        let canvas = this._fc;

        if (canvas && canvas.upperCanvasEl) {
            var overlayWidth = document.getElementById("onep-twop-container-2").offsetWidth;
        }
        else {
            var overlayWidth = document.getElementById("oneptwop-container").offsetWidth;
        }
        // var overlayWidth = document.getElementById("onep-twop-container-2").offsetWidth;
        // var overlayHeight = document.getElementById("onep-twop-container-2").offsetHeight;
        var overlayHeight = Math.round(800 / (1280 / overlayWidth));
        var overlayContrain = overlayWidth / overlayHeight;
        console.log('[ONEPTWOP] Color Overlay Width:', overlayWidth, overlayHeight, overlayContrain);
        this.getCanvasAtResoution(overlayWidth, overlayHeight, false);


    };

    getCanvasAtResoution = (newWidth, newHeight, scaleLandmarks = false) => {
        let canvas = this._fc;
        // let { offsetWidth, clientHeight } = this._container;

        if (canvas && canvas.width !== newWidth && canvas.upperCanvasEl) {
            var scaleMultiplier = newWidth / canvas.width;
            var scaleHeightMultiplier = newHeight / canvas.height;
            var objects = canvas.getObjects();

            for (var i in objects) {
                if (objects[i].type === "image" || scaleLandmarks) {
                    console.log(objects[i].type, "type");
                    // objects[i].width = objects[i].width * scaleMultiplier;
                    // objects[i].height = objects[i].height * scaleHeightMultiplier;
                    objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
                    objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
                    objects[i].setCoords();
                    var scaleFactor = this.state.scaleFactor * scaleMultiplier;
                    this.setState({ scaleFactor });
                }
                console.log(objects[i].type, "type");
                // objects[i].scaleX = objects[i].scaleX * scaleMultiplier;
                // objects[i].scaleY = objects[i].scaleY * scaleMultiplier;
                objects[i].left = objects[i].left * scaleMultiplier;
                objects[i].top = objects[i].top * scaleMultiplier;
                objects[i].cnWidth = canvas.getWidth() * scaleMultiplier;
                objects[i].cnHeight = canvas.getHeight() * scaleHeightMultiplier;
                objects[i].setCoords();
            }


            var obj = canvas.backgroundImage;
            if (obj) {
                obj.scaleX = obj.scaleX * scaleMultiplier;
                obj.scaleY = obj.scaleY * scaleMultiplier;
            }

            console.log("[ONEPTWOP] Resize Canvas Dimensions: ", canvas.getWidth() * scaleMultiplier, canvas.getHeight() * scaleHeightMultiplier);
            canvas.discardActiveObject();
            canvas.setWidth(canvas.getWidth() * scaleMultiplier);
            canvas.setHeight(canvas.getHeight() * scaleHeightMultiplier);
            canvas.renderAll();
            canvas.calcOffset();

            // this.setState({
            //   parentWidth: offsetWidth
            // });
            var boss = canvas.getObjects().filter(o => o.type == "image")[0];
            if (boss) {
                this.bindLandmarks();
            }
        }
    }

    bindLandmarks = () => {
        let canvas = this._fc;
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
    }


    componentDidMount = () => {

        let canvas = (this._fc = new fabric.Canvas(
            this._canvas,
            {
                centeredRotation: true,
                centeredScaling: true
            }
        ));

        // Control resize

        window.addEventListener('resize', this._resize, false);


        this.disableTouchScroll();


        this._resize();

    }

    componentWillUnmount = () =>
        window.removeEventListener('resize', this._resize)

    componentDidUpdate = (prevProps, prevState) => {
        // console.log(this.props, "props");
        let canvas = this._fc
        if (
            this.state.parentWidth !== prevState.parentWidth ||
            this.props.width !== prevProps.width ||
            this.props.height !== prevProps.height
        ) {
            this._resize();
        }



        if (this.props.image !== this.state.imageUrl) {
            console.log("value is coming in component did updateeeee iff image props -- > ", this.props.image, " and ---- >>>>>> ", this.props.oneptwop);
            this.addImg(this.props.image)
            this.setState({
                imageUrl: this.props.image,
                scaleFactor: this.state.scaleFactor,
                rotation: this.props.oneptwop.inscopix.adapter_lsm.rotation,
                flipApplied: this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal
            });
        }


        // if (this.props.callResize !== this.state.callResize) {
        // this._resize();
        // this.setState({ callResize: this.props.callResize });
        // }

        if (
            this.props.oneptwop.inscopix.adapter_lsm.rotation !== this.state.rotation && this._fc.item(0)
        ) {
            this.rotateAndScale(
                this._fc.item(0),
                -this.props.oneptwop.inscopix.adapter_lsm.rotation
            );
            this.updateLandmarksPosition();
            this._fc.renderAll();
            this.setState({
                rotation: this.props.oneptwop.inscopix.adapter_lsm.rotation
            });
        }

        if (
            this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal !==
            this.state.flipApplied
        ) {
            this.applyFlip(
                this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal,
                false
            );
            this.setState({
                flipApplied: this.props.oneptwop.inscopix.adapter_lsm.flip_horizontal
            });
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
        if (this.props.activePanels !== prevProps.activePanels) {
            this._resize();
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

        this._resize();
    }

    updateLandmarksPosition = () => {
        var multiply = fabric.util.multiplyTransformMatrices;
        var invert = fabric.util.invertTransform;
        var boss = this._fc.getObjects().filter(o => o.type == 'image')[0];
        var minions = this._fc.getObjects().filter(o => o !== boss);
        minions.forEach(o => {
            if (!o.relationship) {
                return
            }
            var relationship = o.relationship;
            var newTransform = multiply(boss.calcTransformMatrix(), relationship);
            let opt = fabric.util.qrDecompose(newTransform);
            o.set({
                flipX: false,
                flipY: false
            });
            o.setPositionByOrigin(
                { x: opt.translateX, y: opt.translateY },
                'center',
                'center'
            );
            o.set(opt);
            o.setCoords();
        })
    }

    applyFlip = (value, updateOnepTwop) => {
        this._fc.item(0).set({
            flipX: value
        });
        this._fc.item(0).setCoords();
        this.updateLandmarksPosition();
        /*if(updateOnepTwop) {
     window.updateOnepTwopData('_transform', []);
     } */
        this._fc.requestRenderAll();
        this._fc.renderAll();
    }

    rotateAndScale = (obj, angle) => {

        if (obj) {
            var width = this._fc.getWidth();
            var height = this._fc.getHeight();
            var cos_theta = Math.cos((angle * Math.PI) / 180);
            var sin_theta = Math.sin((angle * Math.PI) / 180);
            var x_scale =
                width / (Math.abs(width * cos_theta) + Math.abs(height * sin_theta));
            var y_scale =
                height / (Math.abs(width * sin_theta) + Math.abs(height * cos_theta));
            var scale = Math.min(x_scale, y_scale);
            var actScale = this.state.scaleFactor * scale;
            // get the transformMatrix array
            var rotateMatrix = [cos_theta, -sin_theta, sin_theta, cos_theta, 0, 0];
            var scaleMatrix = [actScale, 0, 0, actScale, 0, 0];

            var rsT = fabric.util.multiplyTransformMatrices(rotateMatrix, scaleMatrix);

            // Unfold the matrix in a combination of scaleX, scaleY, skewX, skewY...
            var options = fabric.util.qrDecompose(rsT);
            // console.log(options, "options");
            var newCenter = { x: this._fc.getWidth() / 2, y: this._fc.getHeight() / 2 };

            // reset transformMatrix to identity and resets flips since negative scale resulting from decompose, will automatically set them.
            //obj.flipX = false;
            obj.flipY = false;
            obj.set(options);

            // position the object in the center given from translateX and translateY
            obj.setPositionByOrigin(newCenter, 'center', 'center');
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

    updateOnepTwop = (saveAs, landmarks = []) => {
        console.log("updateOnepTwop method");
        // if (this.sbpfApplyClick) {
        //   this.oneptwop.inscopix.bpf = {
        //     sigma1: $("#deltaSBFSnapSigmaOne").val() * 1,
        //     sigma2: $("#deltaSBFSnapSigmaTwo").val() * 1,
        //     offset: $("#deltaSBFSnapOffset").val() * 1,
        //     gain: $("#deltaSBFSnapGain").val() * 1
        //   }
        // }
        // this.oneptwop.inscopix.adapter_lsm = {
        //   rotation: parseInt($(".transforms-rotate-data").val()),
        //   flip_horizontal: $("#flip-horizontal").hasClass("active")
        // };
        let landMarks = this._fc ? JSON.parse(JSON.stringify(this._fc.toJSON(['cnWidth', 'cnHeight']))) : [];
        let oneptwop = this.props.oneptwop;
        oneptwop.inscopix.frontend = landMarks.objects.filter(o => o.type !== "image");
        this.props.oneptwopFrontend(oneptwop);
    }

    removeAddOrMoveMode = () => {
        window.canvas = this._fc;
        if (window.canvas.upperCanvasEl) {
            window.canvas.discardActiveObject();
            window.canvas.forEachObject(function (o) {
                o.selectable = false;
            });
            window.canvas.off('mouse:up');
            window.canvas.hoverCursor = window.canvas.defaultCursor = 'default';
            window.canvas.renderAll();
        }
    }

    render = () => {
        let { className, style, width, height } = this.props;

        let containerH = 512;
        if (this._fc) {
            containerH = this._fc.height;
        }

        let canvasDivStyle = Object.assign(
            {},
            style ? style : {},
            width ? { width: '100%' } : { width: '100%' },
            height ? { height: height } : { height: containerH }
        )


        return (
            <div
                className={className}
                ref={c => (this._container = c)}
                style={canvasDivStyle}
                id="onep-twop-container-2"
            >
                <ReactResizeDetector onResize={this.onChangeSize.bind(this)} />
                <div style={{ position: 'absolute' }}>
                    <canvas
                        ref={c => (this._canvas = c)}
                    >
                        Sorry, Canvas HTML5 element is not supported by your browser :(
          </canvas>
                </div>
                {/* </ReactResizeDetector> */}
                {this._fc !== null && this._fc.item(0) &&
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
        )
    }
}

export default MiraMode;
