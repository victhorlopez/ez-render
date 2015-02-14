/**
 * Created by vik on 17/01/2015.
 *
 *    dependencies: gl-matrix.js, litegl.js
 */



var EZ = EZ || {};

EZ.declare('EZ.Render');

/* consts ************/
EZ.ZERO = vec3.fromValues(0,0,0);
EZ.LEFT = vec3.fromValues(1,0,0);
EZ.UP = vec3.fromValues(0,1,0);
EZ.FRONT = vec3.fromValues(0,0,1);
EZ.WHITE = vec3.fromValues(1,1,1);
EZ.BLACK = vec3.fromValues(0,0,0);

/* Temporary containers ************/
EZ.temp_mat4 = mat4.create();
EZ.temp_vec2 = vec3.create();
EZ.temp_vec3 = vec3.create();
EZ.temp_vec4 = vec4.create();
EZ.temp_quat = quat.create();
EZ.temp_quat2 = quat.create();
EZ.temp_mat3 = mat3.create();

/* priority render values ****/

EZ.PRIORITY_BACKGROUND = 30;
EZ.PRIORITY_OPAQUE = 20;
EZ.PRIORITY_ALPHA = 10;
EZ.PRIORITY_HUD = 0;
