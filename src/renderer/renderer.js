/**
 * Created by vik on 17/01/2015.
 */


EZ.require('EZ.ECamera');
EZ.require('EZ.EScene');
EZ.declare('EZ.Renderer');
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

