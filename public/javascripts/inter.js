$(function(){
  
  $('#inter-sidebar a.button').live('mouseenter', function(e){
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace('_w.svg', '.svg') ).end()
           .addClass('sidebar-button-hover')
           .find('.hover-text').show();
  }).live('mouseleave', function(e){
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace('.svg', '_w.svg') ).end()
           .removeClass('sidebar-button-hover')
           .find('.hover-text').hide();
  })

  $('#inter-sidebar').interSidebar();

  $('body').tooltip({
    selector: '[rel=tooltip]'
  }).on('click', function(){
    $(this).find('div.tooltip').remove();
  });

  $('.js-get-focus:first').focus();

})