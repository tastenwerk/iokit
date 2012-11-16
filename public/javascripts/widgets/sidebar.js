/**
 * sidebar widget
 * adds actions to the inter-sidebar on the left hand side
 */

$(function(){

  $.fn.interSidebar = function interSidebar( options ){

    $(this).find('li').on('click', function(e){

      var self = this;
      e.preventDefault();

      $(this).find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');

      inter.main.load( $(self).find('a').attr('href'), function(){
        $(self).find('.loader').remove().end().find('img').fadeIn(300);
      });

      $(self).addClass('active');

    });

    $(this).find('li:first').click();

  };

});
