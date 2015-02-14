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
    this.needs_rotation_update = true;

    this.radius = vec3.create();


    // controller vars
    this.scale = 1.0;
    this.zoom_speed = 1.0;

    // the scope changes if we enter through an event, thus we need the var that
    var that = this;
    this.onMouseMove = function (e) {
        if(e.dragging){
            // TBH this approach is incorrect, we are supposing that our target is in
            // the 0,0,0 , otherwise it won't work

            var delta = e.deltax > 0.1 || e.deltax < -0.1 ? -e.deltax : 0;
            if(delta){
                quat.setAxisAngle( EZ.temp_quat, [0,1,0], delta * DEG2RAD );
                that.cam.needs_local_update = true;
                that.needs_x_rot = true;
                that.needs_update = true;
            }

            // this works to set the limit in the Y axis
            var front = that.cam.getFront();
            vec3.normalize(front,front);
            var dot = vec3.dot([0,1,0],front);
            var dt = 0.01;
            var angle = e.deltay > 0.1 ? dt : e.deltay < -0.1 ? -dt : 0;
            if( dot + angle < 0.99 && dot + angle > -0.99){
                delta = e.deltay > 0.1 || e.deltay < -0.1 ? -e.deltay : 0;
                if(delta){
                    var left = that.cam.getLeft();
                    vec3.sub(left,left, that.cam.position);// -front
                    quat.setAxisAngle( EZ.temp_quat2, left, delta * DEG2RAD );
                    that.cam.needs_local_update = true;
                    that.needs_y_rot = true;
                    that.needs_update = true;
                }
            }


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
            vec3.sub(EZ.temp_vec4,this.cam.position, this.cam.target);// -front
            vec3.scale(EZ.temp_vec4, EZ.temp_vec4, this.scale); // scale -front

            if( this.needs_x_rot)
                vec3.transformQuat(EZ.temp_vec4, EZ.temp_vec4, EZ.temp_quat ); // rotate -front with quat
            if( this.needs_y_rot)
                vec3.transformQuat(EZ.temp_vec4, EZ.temp_vec4, EZ.temp_quat2 ); // rotate -front with quat

            vec3.add(this.cam.position,this.cam.target, EZ.temp_vec4 ); // add -front to target so it becomes our new position

            this.scale = 1.0; // reset scale
            this.cam.lookAt(this.cam.target); // set the correct lookAt of the camera
            this.needs_update = false;
            this.needs_y_rot = false;
            this.needs_x_rot = false;
        }
    };


    this.ctx.captureMouse(true);
    this.ctx.onmousewheel = this.onMouseWheel;
    this.ctx.onmousedown = this.onMouseDown;
    this.ctx.onmousemove = this.onMouseMove;

    this.ctx.captureKeys();
    this.ctx.onkeydown = function(e) {  };
};

