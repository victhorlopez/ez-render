/**
 * Created by vik on 17/01/2015.
 */

// no options yet
EZ.Renderer = function(options) {

    this.context = this.domElement = GL.create({width: 1, height:1});


    // vars needed for the rendering
    this.mvp_matrix = mat4.create();
    this.uniforms = {
        u_view: {},
        u_viewprojection: {},
        u_model: {},
        u_mvp: this.mvp_matrix
    };

}

EZ.Renderer.prototype.setSize = function (width, height ) {
    this.domElement.width = width;
    this.domElement.height = height;
}


EZ.Renderer.prototype.setModelMatrix = function(cam, matrix)
{
    mat4.multiply(this.mvp_matrix, cam.view_projection, matrix );
}

EZ.Renderer.prototype.setUniforms = function(cam, en){
    this.uniforms = {
        u_view: cam.global_transform,
        u_viewprojection: cam.view_projection,
        u_model: en.global_transform,
        u_mvp: this.mvp_matrix
    };

}

// method from rendeer
EZ.Renderer.prototype.render = function(scene, camera)
{
    if (!scene)
        throw("Renderer.render: scene not provided");
    if (!camera)
        throw("Renderer.render: camera not provided");


    //get matrices in the camera
    this.setCamera( camera );

    //find which nodes should we render
    var entities = scene.getAllChildren();

    //recompute matrices
    for (var i = 0; i < entities.length; ++i)
    {
        var en = entities[i];
        en.updateGlobalMatrix(true);
    }

    //rendering
    for (var i = 0; i < entities.length; ++i)
    {
        var en = entities[i];

        this.setModelMatrix( en.global_transform, camera );
        this.setUniforms(camera);
        if(en.render)
            en.render(this.context, camera);
    }


}
