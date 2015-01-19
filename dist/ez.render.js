/**
 * Created by vik on 17/01/2015.
 *
 *    dependencies: gl-matrix.js, litegl.js
 */



var EZ = EZ || {};



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
EZ.temp_vec4 = vec3.create();
EZ.temp_quat = quat.create();
EZ.temp_mat3 = mat3.create();

/**
 * Created by vik on 17/01/2015.
 */



EZ.entity_count = 0;

EZ.Entity = function() {

    //ids
    this.uuid = EZ.entity_count++;
    this.name = "";
    this.type = "entity";

    // space attributes
    this.position = vec3.create();
    this.rotation = vec3.create();
    this.quat = quat.create();
    this.scale = vec3.fromValues(1,1,1);
    this.up = vec3.clone(EZ.UP);


    // transforms
    this.local_transform = mat4.create();
    this.global_transform = mat4.create();

    this.local_needs_update = true;
    this.global_needs_update = true;

    // tree
    this.parent = null;
    this.children = [];
};

EZ.Entity.prototype = {

    constructor: EZ.Entity,

    updateLocalMatrix: function() {
        mat4.identity(this.local_transform);
        mat4.translate(this.local_transform,this.local_transform, this.position);
        mat4.fromQuat(EZ.temp_mat4, this.quat);
        mat4.mul(this.local_transform, this.local_transform, EZ.temp_mat4);
        mat4.scale(this.local_transform,this.local_transform, this.scale);

        this.local_needs_update = false;
        this.global_needs_update = true;
    },

    // fast to skip parent update
    updateGlobalMatrix: function(fast) {

        if(this.local_needs_update)
            this.updateLocalMatrix();

        if(this.parent){
            if(!fast)
                this.parent.updateGlobalMatrix();
            mat4.mul(this.global_transform, this.local_transform,this.parent.global_transform);
        }
        this.global_needs_update = false;
    },
    lookAt: function (target){
        mat4.lookAt(this.global_transform, this.position, target, this.up);
        //mat3.fromMat4(EZ.temp_mat3, this.global_transform);
        //quat.fromMat3(this.rotation, EZ.temp_mat3);
        quat.fromMat4(this.rotation, this.global_transform); //  quat.fromMat4 says not tested
    },
    addChild: function(child){
        if(child.parent)
            throw ("the child "+ child.name+ " has already a parent");

        child.parent = this;
        this.children.push(child);

        child.propagate("updateGlobalMatrix", [true]);
    },

//    removeChild: function(child){
//        if(child.parent)
//            throw ("the child "+ child.name+ " has already a parent");
//
//        child.parent = this;
//        children.push(child);
//
//        this.propagate("updateGlobalMatrix", [true])
//
//    },

    // method from rendeer
    propagate: function(method, params)
    {
        for(var i = 0, l = this.children.length; i < l; i++)
        {
            var e = this.children[i];
            if(!e)
                continue;
            if(e[method])
                e[method].apply(e, params);
            e.propagate(e, params);
        }
    },

    getAllChildren: function()
    {
        var r = [];
        for(var i = 0, l = this.children.length; i < l; i++)
        {
            var en = this.children[i];
            r.push(en);
            en.getAllChildren(r);
        }
        return r;
    }

};
/**
 * Created by vik on 17/01/2015.
 */




EZ.EMesh = function (fov, aspect, near, far) {

    EZ.Entity.call( this );

    this.color = vec4.fromValues(1, 1, 1, 1);

    this.shader = "";
    this.mesh = "";
    this.mesh_obj = null;
    this.textures = {};
    this.uniforms = { u_color: this.color, u_color_texture: 0 };
    this.flags = {}; // rendering flags: flip_normals , depth_test, depth_write, blend, two_sided

    this.type = "object3d";
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
// from rendeer
EZ.EMesh.prototype.render = function (gl) {
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
        shader = gl.shaders[ shader_name ];

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
        gl.blendFunc(gl.SRC_ALPHA, node.blendMode == "additive" ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    }

    shader.uniforms(this.uniforms);
    shader.draw(this.mesh_obj , this.flags.primitive === undefined ? gl.TRIANGLES : node.flags.primitive);

    if (this.flags.flip_normals) gl.frontFace(gl.CCW);
    if (this.flags.depth_test === false) gl.enable(gl.DEPTH_TEST);
    if (this.flags.blend) gl.disable(gl.BLEND);
    if (this.flags.two_sided) gl.disable(gl.CULL_FACE);
    if (this.flags.depth_write === false)
        gl.depthMask(true);
};
/**
 * Created by vik on 17/01/2015.
 */




EZ.EScene = function() {
// TODO put some attributes, time... we'll see
    EZ.Entity.call( this );
    this.type = "scene";
};

EZ.EScene.prototype = Object.create( EZ.Entity.prototype ); // we inherit from Entity
EZ.EScene.prototype.constructor = EZ.EScene;
/**
 * Created by vik on 17/01/2015.
 */




EZ.ECamera = function (fov, aspect, near, far) {

    EZ.Entity.call( this );

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
};

EZ.ECamera.prototype = Object.create(EZ.Entity.prototype); // we inherit from Entity
EZ.ECamera.prototype.constructor = EZ.ECamera;


EZ.ECamera.prototype.updateProjectionMatrix = function () {
    mat4.perspective(this.projection_matrix, this.fov * DEG2RAD, this.aspect, this.near, this.far);
    mat4.mul(this.view_projection , this.projection_matrix, this.global_transform); // the view matrix is the transform
};



/**
 * Created by vik on 17/01/2015.
 */





// no options yet
EZ.Renderer = function (options) {

    this.context = GL.create({width: 1, height: 1});

    // vars needed for the rendering
    this.mvp_matrix = mat4.create();
    this.uniforms = {
        u_view: {},
        u_viewprojection: {},
        u_model: {},
        u_mvp: this.mvp_matrix
    };
    this.loadAssets();
};

EZ.Renderer.prototype = {
    constructor: EZ.Renderer,

    addMesh: function (name,mesh) {
        this.context.meshes[name] = mesh;
    },

    loadAssets: function () {
        var options = {lat: 64, size: 0.5};
        options["long"] = 64;
        this.addMesh("sphere", GL.Mesh.sphere(options));
        this.addMesh("cylinder", GL.Mesh.cylinder({height: 2, radius: 0.1}));
        this.addMesh("circle", GL.Mesh.circle({xz: true}));
        this.addMesh("grid", GL.Mesh.grid({size: 1, lines: 50}));
        this.addMesh("box", GL.Mesh.box({size: 1}));
        this.createShaders();
    },

    setSize: function (width, height) {
        this.context.canvas.width = width;
        this.context.canvas.height = height;
    },

    setModelMatrix: function (model, cam) {
        mat4.multiply(this.mvp_matrix, cam.view_projection, model);
    },

    setUniforms: function (cam, entity) {
        this.uniforms = {
            u_view: cam.global_transform,
            u_viewprojection: cam.view_projection,
            u_model: entity.global_transform,
            u_mvp: this.mvp_matrix
        };
    },

    // method from rendeer
    render: function (scene, camera) {
        if (!scene)
            throw("Renderer.render: scene not provided");
        if (!camera)
            throw("Renderer.render: camera not provided");


        // TODO scene doesnt find parent attributes
        //find which nodes should we render
        var entities = scene.getAllChildren();
        var en = null;
        //recompute matrices
        for (var i = 0; i < entities.length; ++i) {
            en = entities[i];
            en.updateGlobalMatrix(true);
        }

        //get matrices in the camera
        camera.updateProjectionMatrix();

        //rendering
        for (i = 0; i < entities.length; ++i) {
            en = entities[i];

            this.setModelMatrix(en.global_transform, camera);
            this.setUniforms(camera, en);
            if (en.render)
                en.render(this.context);
        }
    },
    createShaders: function (){
        this._flat_shader = new GL.Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				uniform mat4 u_mvp;\
				void main() {\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
					gl_PointSize = 5.0;\
				}\
				', '\
				precision highp float;\
				uniform vec4 u_color;\
				void main() {\
				  gl_FragColor = u_color;\
				}\
			');
        this.context.shaders["flat"] = this._flat_shader;
    },
    append: function (id) {
        document.getElementById(id).appendChild(this.context.canvas);
    }

};

