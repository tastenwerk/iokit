/**
 * sidebar widget
 * adds actions to the inter-sidebar on the left hand side
 */

$(function(){

  $.fn.interSidebar = function interSidebar( options ){

    $(this).find('a.button').on('click', function(e){

      var self = this;
      e.preventDefault();
      $('#inter-sidebar-content').animate({ left: '-40%' });

      function cleanUp(){
        $(self).find('.loader').remove().end().find('img').fadeIn(300);
      }

      $(this).find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');
      setTimeout( function(){
        if( $(self).attr('data-sidebar-remote') )
          $('#inter-sidebar-content').load( $(self).attr('data-sidebar-remote'), function(){
            $('#inter-main-content').animate({ left: '25%' })
            $('#inter-sidebar-content').animate({ left: 0 });
            cleanUp();
          });
        else
          $('#inter-main-content').animate({ left: 0 })
        if( $(self).attr('href') !== "#" )
          $('#inter-main-content').load( $(self).attr('href'), function(){
            cleanUp();
          });
        if( !$(self).attr('data-sidebar-remote') && $(self).attr('href') === '#' )
          cleanUp();
      }, 500);
    });

    $(this).find('a.button:first').click();

  };

});
