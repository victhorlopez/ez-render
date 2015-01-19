/**
 * Created by vik on 17/01/2015.
 */


EZ.require('EZ.ECamera');
EZ.require('EZ.EScene');
EZ.declare('EZ.Renderer');
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
        //vec4.set(EZ.temp_vec4, 0,0,0,1);
        //vec4.transformMat4( EZ.temp_vec4,EZ.temp_vec4,this.mvp_matrix);
        //console.log(vec4.str(EZ.temp_vec4));
    },

    setUniforms: function (cam, entity) {
        this.uniforms = {
            u_view: cam.global_transform,
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
        for (var i = 0; i < entities.length; ++i) {
            en = entities[i];
            en.updateGlobalMatrix(true);
        }

        //get matrices in the camera
        camera.updateProjectionMatrix();

        //rendering
        for (i = 0; i < entities.length; ++i) {
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

