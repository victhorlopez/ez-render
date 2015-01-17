/**
 * Created by vik on 17/01/2015.
 */

EZ.ECamera = function (fov, aspect, near, far) {

    // so far perspective cam, if I need ortho inhertic from this class
    this.aspect = aspect || 1.0;
    this.fov = fov || 45;
    this.near = near || 0.1;
    this.far = far || 1000;

    this.type = "camera";

    // matrices
    this.projection_matrix = mat4.create();
    this.view_projection = mat4.create();


    this.type = "camera";
}
EZ.ECamera.prototype = Object.create(EZ.Entity.prototype); // we inherit from Entity
EZ.ECamera.prototype.constructor = EZ.ECamera;


EZ.ECamera.prototype.updateProjectionMatrix = function () {
    mat4.perspective(this.projection_matrix, this.fov * DEG2RAD, this.aspect, this.near, this.far);
    mat4.mul(this.view_projection ,this.global_transform, this.projection_matrix); // the view matrix is the transform
}


