/**
 * Created by vik on 17/01/2015.
 */

EZ.Scene = function() {
// TODO put some attributes, time... we'll see

}

EZ.Scene.prototype = Object.create( EZ.Entity.prototype ); // we inherit from Entity
EZ.Scene.prototype.constructor = EZ.Scene;