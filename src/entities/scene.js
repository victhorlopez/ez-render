/**
 * Created by vik on 17/01/2015.
 */

/**
 * @depend entity.js
 */

EZ.EScene = function() {
// TODO put some attributes, time... we'll see
    EZ.Entity.call( this );
    this.type = "scene";
};

EZ.EScene.prototype = Object.create( EZ.Entity.prototype ); // we inherit from Entity
EZ.EScene.prototype.constructor = EZ.EScene;