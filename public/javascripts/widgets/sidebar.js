/**
 * sidebar widget
 * adds actions to the iokit-sidebar on the left hand side
 */

$(function(){

  $.fn.iokitSidebar = function iokitSidebar( options ){

    var sidebar = this;

    $(this).find('li').on('click', function(e){

      var self = this;
      e.preventDefault();

      $(sidebar).find('.active').removeClass('active').removeClass('loading');
      $(this).addClass('active loading');
      $(this).find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');

      iokit.main.load( $(self).find('a').attr('href'), function(){
        $(self).find('.loader').remove().end().find('img').fadeIn(300);
        $(self).removeClass('loading');
      });

    });

    $(this).find('li:first').click();

  };

});
