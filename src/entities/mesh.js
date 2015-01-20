/**
 * Created by vik on 17/01/2015.
 */

EZ.require('EZ.Entity');
EZ.declare('EZ.EMesh');

EZ.EMesh = function (fov, aspect, near, far) {

    EZ.Entity.call( this );

    this.color = vec4.fromValues(1, 1, 1, 1);

    this.render_priority = EZ.PRIORITY_OPAQUE;

    this.shader = "";
    this.mesh = "";
    this.mesh_obj = null;
    this.textures = {};
    this.uniforms = { u_color: this.color, u_color_texture: 0 };
    this.flags = {}; // rendering flags: flip_normals , depth_test, depth_write, blend, two_sided

    this.type = "mesh";
};

EZ.EMesh.prototype = Object.create(EZ.Entity.prototype); // we inherit from Entity
EZ.EMesh.prototype.constructor = EZ.EMesh;

// from rendeer
EZ.EMesh.prototype.setTexture = function (channel, texture) {
    if (!texture)
        this.textures[channel] = null;
    else if (typeof(texture) == "string")
        this.textures[ channel ] = texture;
};

EZ.EMesh.prototype.setSkyBox = function (){
    this.flags.depth_write = false;
    this.flags.depth_test = false;
    this.render_priority = EZ.PRIORITY_BACKGROUND;
    this.flags.flip_normals = true;
};

// from rendeer
EZ.EMesh.prototype.render = function (renderer) {
    //get mesh
    if(this.mesh)
        this.mesh_obj = gl.meshes[this.mesh];

    if (!this.mesh_obj)
        return;

    //get texture
    var slot = 0;
    var texture = null;
    for (var i in this.textures) {
        var texture_name = this.textures[i];
        texture = gl.textures[ texture_name ];
        if (!texture)
            texture = gl.textures[ "white" ];
        this.uniforms["u_" + i + "_texture"] = texture.bind(slot++);
    }

    //get shader
    var shader = null;
    if (this.shader)
        shader = gl.shaders[ this.shader ];

    // use default shader
    if (!shader)
        shader = gl.shaders[ "flat" ];

    //flags
    gl.frontFace(this.flags.flip_normals ? gl.CW : gl.CCW);
    gl[ this.flags.depth_test === false ? "disable" : "enable"](gl.DEPTH_TEST);
    if (this.flags.depth_write === false)
        gl.depthMask(false);
    gl[ this.flags.two_sided === true ? "disable" : "enable"](gl.CULL_FACE);

    //blend
    if (this.flags.blend) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, this.blendMode == "additive" ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    }

    shader.uniforms(this.uniforms);
    shader.uniforms(renderer.uniforms);
    shader.draw(this.mesh_obj , this.flags.primitive === undefined ? gl.TRIANGLES : this.flags.primitive);

    if (this.flags.flip_normals) gl.frontFace(gl.CCW);
    if (this.flags.depth_test === false) gl.enable(gl.DEPTH_TEST);
    if (this.flags.blend) gl.disable(gl.BLEND);
    if (this.flags.two_sided) gl.disable(gl.CULL_FACE);
    if (this.flags.depth_write === false)
        gl.depthMask(true);
};