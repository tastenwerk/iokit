/**
 * top-tabs
 * lets you add a tabbed topbar
 *
 */

$(function(){

  $.fn.iokitTopTabs = function iokitSideTabs( options ){

    var toptabs = this;

    $(toptabs).find('.top-tabs-nav li').on('click', function(e){
      e.preventDefault();
      $(this).closest('ul').find('.active').removeClass('active').find('.active-caret').remove();
      $(toptabs).find('.top-tabs-content > div').hide();
      var container = $($(toptabs).find('.top-tabs-content > div')[$(this).index()]);
      container.show().find('.js-get-focus').focus();
      setTimeout(function(){
        container.find('.js-get-focus').focus();
      }, 500);
      $(this).addClass('active').append('<span class="active-caret" />');
    }).first().click();

  }

});