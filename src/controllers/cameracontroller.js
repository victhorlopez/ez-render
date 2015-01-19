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


    // controller vars
    this.scale = 1.0;
    this.zoom_speed = 1.0;

    // the scope changes if we enter through an event, thus we need the var that
    var that = this;
    this.onMouseMove = function (e) {
        if(e.dragging){
            var delta = e.deltax > 0.1 || e.deltax < -0.1 ? -e.deltax : 0;
            if(delta)
                quat.setAxisAngle( that.cam.quat, [0,1,0], delta * DEG2RAD );
            else
                quat.identity(that.cam.quat);
            delta = e.deltay > 0.1 || e.deltay < -0.1 ? -e.deltay : 0;
            if(delta)
                quat.setAxisAngle( EZ.temp_quat, [1,0,0], delta * DEG2RAD );
            else
                quat.identity(EZ.temp_quat);

            quat.mul(that.cam.quat,EZ.temp_quat, that.cam.quat);
            that.needs_update = true;
        }
    };

    this.onMouseDown = function (e) {

    };
    this.onMouseWheel= function (e) {
        var scale = Math.pow( 0.95, that.zoom_speed ); // each mousewheel is a 5% increment at speed 1
        if(e.deltaY < 1)
            that.scale *=0.95;
        else
            that.scale /=0.95;
        that.needs_update = true;
    };
    this.update = function (dt) {
        this.cam = this.renderer.current_cam;
        if(this.cam && this.needs_update){
            // computations for the zoom, EZ.temp_vec4 is the new radius
            vec3.sub(EZ.temp_vec4,this.cam.position, this.target);
            vec3.scale(EZ.temp_vec4, EZ.temp_vec4, this.scale);


            //vec3.transformQuat(EZ.temp_vec4, EZ.temp_vec4,that.cam.quat );

            vec3.add(this.cam.position,this.target, EZ.temp_vec4 );

            quat.identity(that.cam.quat);
            this.scale = 1.0;
            this.cam.lookAt(this.target);
            this.needs_update = false;
        }
    };


    this.ctx.captureMouse(true);
    this.ctx.onmousewheel = this.onMouseWheel;
    this.ctx.onmousedown = this.onMouseDown;
    this.ctx.onmousemove = this.onMouseMove;

    this.ctx.captureKeys();
    this.ctx.onkeydown = function(e) {  };
};
