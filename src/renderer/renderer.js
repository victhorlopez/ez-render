/**
 * Created by vik on 17/01/2015.
 */

/**
 * @depend ../entity.js
 * @depend ../camera.js
 * @depend ../scene.js
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
    },

    setSize: function (width, height) {
        this.context.canvas.width = width;
        this.context.canvas.height = height;
    },

    setModelMatrix: function (cam, matrix) {
        mat4.multiply(this.mvp_matrix, cam.view_projection, matrix);
    },

    setUniforms: function (cam, en) {
        this.uniforms = {
            u_view: cam.global_transform,
            u_viewprojection: cam.view_projection,
            u_model: en.global_transform,
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
            this.setUniforms(camera);
            if (en.render)
                en.render(this.context, camera);
        }
    }
};
