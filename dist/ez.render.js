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
EZ.temp_vec4 = vec4.create();
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
        //quat.fromMat3(this.quat, EZ.temp_mat3);
        quat.fromMat4(this.quat, this.global_transform); //  quat.fromMat4 says not tested
        this.local_needs_update = true;
    },
    addChild: function(child){
        if(child.parent)
            throw ("the child "+ child.name+ " has already a parent");

        child.parent = this;
        this.children.push(child);

        child.propagate("updateGlobalMatrix", [true]);
    },

    removeChild: function(child){
        if(child.parent !== this )
            throw ("the child "+ child.name+ " has a different parent");

        child.parent = null;
        this.children.push(child);
        for(var i = this.children.length - 1; i >= 0; i--) {
            if(this.children[i] === child) {
                this.children.splice(i, 1);
            }
        }
        this.propagate("updateGlobalMatrix", [true]);

    },

    // method from rendeer
    propagate: function(method, params)
    {
        for(var i = this.children.length - 1; i >= 0; i--) {
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
        for(var i = this.children.length - 1; i >= 0; i--) {
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
        gl.blendFunc(gl.SRC_ALPHA, node.blendMode == "additive" ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
    }

    shader.uniforms(this.uniforms);
    shader.uniforms(renderer.uniforms);
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
    this.view = mat4.create();

    this.type = "camera";
};

EZ.ECamera.prototype = Object.create(EZ.Entity.prototype); // we inherit from Entity
EZ.ECamera.prototype.constructor = EZ.ECamera;


EZ.ECamera.prototype.updateProjectionMatrix = function () {
    mat4.invert(this.view,this.global_transform); // the view matrix is inverse of the transform
    mat4.perspective(this.projection_matrix, this.fov * DEG2RAD, this.aspect, this.near, this.far);
    mat4.mul(this.view_projection , this.projection_matrix, this.view);
};



/**
 * Created by vik on 17/01/2015.
 */





// no options yet
EZ.Renderer = function (options) {

    // vars needed for the rendering
    this.color = [0,0,0,0];
    this.mvp_matrix = mat4.create();
    this.uniforms = {
        u_view: {},
        u_viewprojection: {},
        u_model: {},
        u_mvp: this.mvp_matrix
    };
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
        this.addMesh("plane", GL.Mesh.box({size:50}));
        this.createShaders();
    },

    createCanvas: function (width, height) {
        this.context = GL.create({width: width, height: height});
        this.context.canvas.width = width;
        this.context.canvas.height = height;
        this.loadAssets();
    },

    setModelMatrix: function (model, cam) {
        mat4.multiply(this.mvp_matrix, cam.view_projection, model);
    },

    setUniforms: function (cam, entity) {
        this.uniforms = {
            u_view: cam.view,
            u_viewprojection: cam.view_projection,
            u_model: entity.global_transform,
            u_mvp: this.mvp_matrix
        };
    },
    clearContext: function(){
        this.context.clearColor( this.color[0],this.color[1],this.color[2],this.color[3] );
        this.context.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    },
    // method from rendeer
    render: function (scene, camera) {
        if (!scene)
            throw("Renderer.render: scene not provided");
        if (!camera)
            throw("Renderer.render: camera not provided");

        this.clearContext();

        //find which nodes should we render
        var entities = scene.getAllChildren();
        var en = null;
        //recompute matrices
        for(var i = entities.length - 1; i >= 0; i--) {
            en = entities[i];
            en.updateGlobalMatrix(true);
        }

        //get matrices in the camera
        camera.updateProjectionMatrix();

        //rendering
        for(var i = entities.length - 1; i >= 0; i--) {
            en = entities[i];

            if (en.render){
                this.setModelMatrix(en.global_transform, camera);
                this.setUniforms(camera, en);
                en.render(this);
            }

        }
    },
    createShaders: function (){
        // shaders from rendeer
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
        var phong_uniforms = { u_lightvector: vec3.fromValues(0.577, 0.577, 0.577), u_lightcolor: EZ.WHITE };

        this._phong_shader = new GL.Shader('\
			precision highp float;\
			attribute vec3 a_vertex;\
			attribute vec3 a_normal;\
			varying vec3 v_normal;\
			uniform mat4 u_mvp;\
			uniform mat4 u_model;\
			void main() {\
				v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
				gl_Position = u_mvp * vec4(a_vertex,1.0);\
			}\
			', '\
			precision highp float;\
			varying vec3 v_normal;\
			uniform vec3 u_lightcolor;\
			uniform vec3 u_lightvector;\
			uniform vec4 u_color;\
			void main() {\
			  vec3 N = normalize(v_normal);\
			  gl_FragColor = u_color * max(0.0, dot(u_lightvector,N)) * vec4(u_lightcolor,1.0);\
			}\
		');
        gl.shaders["phong"] = this._phong_shader;
        gl.shaders["phong"].uniforms( phong_uniforms );
    },
    append: function (id) {
        document.getElementById(id).appendChild(this.context.canvas);
    }

};
