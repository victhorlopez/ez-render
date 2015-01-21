/**
 * Created by vik on 17/01/2015.
 */
EZ.require('EZ.EScene');
EZ.require('EZ.CameraController');
EZ.declare('EZ.Renderer');


EZ.Renderer = function (options) {

    // current rendering objects
    this.current_cam = null;
    this.current_scene = null;
    this.cam_controller = null;

    // vars needed for the rendering
    this.color = [0,0,0,0];
    this.mvp_matrix = mat4.create();
    this.uniforms = {
        u_view: {},
        u_viewprojection: {},
        u_model: {},
        u_mvp: this.mvp_matrix
    };

    // time vars
    this.now = getTime();
    this.then = this.now;
    this.dt = 0;
};

EZ.Renderer.prototype = {
    constructor: EZ.Renderer,

    addMesh: function (name,mesh) {
        this.context.meshes[name] = mesh;
    },

    loadAssets: function () {
        var options = {lat: 128, size: 0.5};
        options["long"] = 128;
        this.addMesh("sphere", GL.Mesh.sphere(options));
        this.addMesh("cylinder", GL.Mesh.cylinder({height: 2, radius: 0.1}));
        this.addMesh("circle", GL.Mesh.circle({xz: true}));
        this.addMesh("grid", GL.Mesh.grid({size: 1, lines: 50}));
        this.addMesh("box", GL.Mesh.box({size: 1}));
        this.addMesh("plane", GL.Mesh.box({size:50}));
        this.addMesh("plane", GL.Mesh.box({size:50}));
        this.addMesh("suzanne", GL.Mesh.fromURL("assets/meshes/suzanne.obj"));
        gl.textures["cubemap"] = GL.Texture.cubemapFromURL( "assets/textures/cube2.jpg", {minFilter: gl.NEAREST});
        this.createShaders();
    },

    createCanvas: function (width, height) {
        this.context = GL.create({width: width, height: height});
        this.context.canvas.width = width;
        this.context.canvas.height = height;
        this.cam_controller = new EZ.CameraController(this);

        this.loadAssets();
    },

    setModelMatrix: function (model, cam) {
        mat4.multiply(this.mvp_matrix, cam.view_projection, model);
    },

    setUniforms: function (cam, entity) {
        this.uniforms = {
            u_eye: cam.position,
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
    update: function() {
        this.now = getTime();
        var dt = (this.now - this.then )* 0.001;;
        if( this.current_scene )
            this.current_scene.update(dt);
        this.cam_controller.update(dt);

    },
    // method from rendeer
    render: function (scene, camera) {
        if (!scene)
            throw("Renderer.render: scene not provided");
        if (!camera)
            throw("Renderer.render: camera not provided");
        this.current_cam = camera;
        this.current_scene = scene;
        // we update the different objects before rendering
        this.update();


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

        // after the scene it's update sort entities by priority
        entities.sort(function(a,b) { return a.render_priority - b.render_priority; } );

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
        var flat_shader = new GL.Shader('\
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
        gl.shaders["flat"] = flat_shader;
        var phong_uniforms = { u_lightvector: vec3.fromValues( 1.0, 0.0, 0.0), u_lightcolor: EZ.WHITE };
        var phong_shader = new GL.Shader('\
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
        gl.shaders["phong"] = phong_shader;
        gl.shaders["phong"].uniforms( phong_uniforms );

        var cubemap_shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_pos;\
				varying vec3 v_normal;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_pos = a_vertex.xyz;\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				varying vec3 v_pos;\
				uniform vec4 u_color;\
				uniform samplerCube u_cubemap_texture;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  gl_FragColor = u_color * textureCube( u_cubemap_texture, v_pos );\
				}\
			');
        gl.shaders["cubemap"] = cubemap_shader;

        var env_reflection_shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_pos;\
				varying vec3 v_normal;\
				varying vec3 v_refl;\
				uniform vec3 u_eye;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_pos = (u_model * vec4(a_vertex,1.0)).xyz;\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				    vec3 I = v_pos - u_eye;\
				    v_refl = reflect(I,v_normal);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				varying vec3 v_pos;\
				varying vec3 v_refl;\
				uniform vec4 u_color;\
				uniform vec3 u_lightvector;\
				uniform samplerCube u_cubemap_texture;\
				void main() {\
				  vec3 N = normalize(v_normal);\
				  vec4 color = u_color * textureCube( u_cubemap_texture, v_refl);\
				  gl_FragColor = color *(0.2  +  max(0.2, dot(u_lightvector, N)));\
				}\
			');
        gl.shaders["env_reflection"] = env_reflection_shader;
        gl.shaders["env_reflection"].uniforms( phong_uniforms );

        var env_refraction_shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				attribute vec3 a_normal;\
				varying vec3 v_pos;\
				varying vec3 v_normal;\
				uniform mat4 u_mvp;\
				uniform mat4 u_model;\
				void main() {\
					v_pos = (u_model * vec4(a_vertex,1.0)).xyz;\
					v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				varying vec3 v_normal;\
				varying vec3 v_pos;\
				varying vec3 v_refr;\
				uniform vec3 u_eye;\
				uniform vec4 u_color;\
				uniform vec3 u_lightvector;\
				uniform samplerCube u_cubemap_texture;\
				void main() {\
                  vec3 N = normalize(v_normal);\
				  vec3 I = normalize(v_pos - u_eye);\
				  vec3 refr = refract(-I,N, (0.666));\
				  vec4 RR_color = u_color * textureCube( u_cubemap_texture, refr);\
				  gl_FragColor = RR_color;\
				}\
			');

//        vec4 RR_color = u_color * textureCube( u_cubemap_texture, RR);\
//				  vec4 RL_color = u_color * textureCube( u_cubemap_texture, RF);\
//				  float reflectionFactor = 0.5 + 15.0 * pow(1.0 + dot(I, N), 2.0);\
//				  vec4 color = mix(RR_color, RL_color, reflectionFactor);\
        gl.shaders["env_refraction"] = env_refraction_shader;
        gl.shaders["env_refraction"].uniforms( phong_uniforms );
    },
    append: function (node) {
        node.appendChild(this.context.canvas);
    },
    resize: function (width, height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
        if(this.current_cam){
            this.current_cam.aspect = gl.canvas.width / gl.canvas.height;
        }
    }

};