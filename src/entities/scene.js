/**
 * Created by vik on 17/01/2015.
 */

EZ.require('EZ.Entity');
EZ.declare('EZ.EScene');

EZ.EScene = function() {
    EZ.Entity.call( this );

    this.time = 0.0;

    this.type = "scene";
};

EZ.EScene.prototype = Object.create( EZ.Entity.prototype ); // we inherit from Entity
EZ.EScene.prototype.constructor = EZ.EScene;

EZ.EScene.prototype.update = function(dt) {
    this.time += dt;
};