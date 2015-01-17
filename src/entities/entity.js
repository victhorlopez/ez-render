/**
 * Created by vik on 17/01/2015.
 */

EZ.entity_count = 0;

EZ.Entity = function() {

    //ids
    this.uuid = ez.entity_count++;
    this.name = "";

    // space attributes
    this.position = vec3.create();
    this.rotation = vec3.create();
    this.quat = quat.create();
    this.scale = vec3.create();
    //vec3.copy(this.up,EZ.UP);

    // transforms
    this.local_transform = mat4.create();
    this.global_transform = mat4.create();

    this.local_needs_update = true;
    this.global_needs_update = true;

    // tree
    this.parent = null;
    this.children = [];

}

EZ.Entity.prototype = {

    constructor: EZ.Entity,

    updateLocalMatrix: function() {
        mat4.identity(this.local_transform);
        mat4.translate(this.local_transform,this.local_transform, this.position);
        mat4.fromQuat(EZ.temp_mat4, this.quat);
        mat4.mul(this.local_transform, EZ.temp_mat4);
        mat4.scale(this.local_transform,this.local_transform, this.scale);

        this.global_needs_update = true;
    },

    updateGlobalMatrix: function() {

        if(this.parent){
            this.parent.updateGlobalMatrix();
            mat4.mul(this.global_transform, this.local_transform,this.parent.global_transform);
        }
    },

    addChild: function(child){
        if(child.parent)
            throw ("the child "+ child.name+ " has already a parent");

        child.parent = this;
        children.push(child);

    }

}