/**
 * inter tags
 * transforms input field into a nice tag selector
 *
 */

$(function(){

  $.fn.interTags = function interTags( options ){

    var self = this;


    self.transformTag = function transformTag( val ){
      $(self).find('.tags').append('<span class="inter-tag">'+val+'</span>');
    }

    if( $(self).val().length ){
      $(self).val().split(', ').each( function(){
        transformTag( this );
      })
    }

  };

});
