/**
 * sidebar widget
 * adds actions to the inter-sidebar on the left hand side
 */

$(function(){

  $.fn.interSidebar = function interSidebar( options ){

    $(this).find('a.button').on('click', function(e){

      var self = this;
      e.preventDefault();
      inter.sidebar.animate({ left: '-40%' });

      function cleanUp(){
        $(self).find('.loader').remove().end().find('img').fadeIn(300);
      }

      $(this).find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');

      
      var active = $(self).closest('ul').find('.active')
      if( active.length ){
        var img = active.find('img');
        img.attr('src', img.attr('src').replace(/_w/g,'').replace('.svg', '_w.svg'));
        active.removeClass('active').removeClass('sidebar-button-hover');
      }

      $('#active-line').animate({top: 33+(60*$(self).closest('li').index()) }, 100);
      $('#active-line').show();

      setTimeout( function(){
        if( $(self).attr('data-sidebar-remote') )
          inter.sidebar.load( $(self).attr('data-sidebar-remote'), function(){
            inter.main.animate({ left: '300px' })
            inter.sidebar.animate({ left: 0 });
            cleanUp();
          });
        else
          inter.main.animate({ left: 0 })
        if( $(self).attr('href') !== "#" )
          inter.main.load( $(self).attr('href'), function(){
            cleanUp();
          });
        if( !$(self).attr('data-sidebar-remote') && $(self).attr('href') === '#' )
          cleanUp();

        $(self).find('img').attr('src', $(self).find('img').attr('src').replace(/_w/g,'').replace('_w.svg', '.svg') ).end()
               .addClass('active');

      }, 500);
    });

    $(this).find('a.button:first').click();

  };

  $('#inter-sidebar a.button').live('mouseenter', function(e){
    if( $(this).hasClass('active') )
      return $(this).find('.hover-text').hide();
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace(/_w/g,'').replace('_w.svg', '.svg') ).end()
           .addClass('sidebar-button-hover')
           .find('.hover-text').show();
  }).live('mouseleave', function(e){
    if( $(this).hasClass('active') )
      return $(this).find('.hover-text').hide();
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace(/_w/g,'').replace('.svg', '_w.svg') ).end()
           .removeClass('sidebar-button-hover')
           .find('.hover-text').hide();
  })

});
