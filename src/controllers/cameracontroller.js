/**
 * Created by vik on 19/01/2015.
 */

EZ.require('EZ.ECamera');
EZ.declare('EZ.CameraController');

EZ.CameraController = function ( renderer ) {
    if(renderer  && !renderer.context)
        throw("CameraController can't work without the canvas");

    this.renderer = renderer;
    this.ctx = renderer.context; // ctx = context
    this.cam = null;
    this.needs_update = true;

    this.target = vec3.create(); // we set it to point to 0,0,0
    this.radius = vec3.create();

    this.ctx.captureMouse(true);
    this.ctx.onmousewheel = this.onMouseWheel;
    this.ctx.onmousedown = this.onMouseDown;
    this.ctx.onmousemove = this.onMouseMove;

    this.ctx.captureKeys();
    this.ctx.onkeydown = function(e) {  };

};



EZ.CameraController.prototye = {

    constructor: EZ.CameraController,

    onMouseMove: function (e) {

    },
    onMouseDown: function (e) {

    },
    onMouseWheel: function (e) {
        console.log("hello");
    },
    update: function (dt) {

    }
};

EZ.CameraController.prototype.update =  function (dt) {
    this.cam = this.renderer.current_cam;
    if(this.cam && this.needs_update){
        this.cam.lookAt(this.target);
        this.needs_update = false;
    }
};