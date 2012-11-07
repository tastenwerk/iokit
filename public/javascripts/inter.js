$(function(){

  inter = {

    mode: 'desktop',

    main: $('#inter-main-content'),

    sidebar: $('#inter-sidebar-content'),

    setupAjaxHelpers: function setupAjaxHelpers(){
      
      $(document).bind("ajaxSend", function(e, req){})
      .bind("ajaxError", function(e, xhr){
        if( xhr.status === 0 )
        inter.notify('You are offline!!\n Please Check Your Network.', 'error');
        else if( xhr.status in [401,403] )
          location = '/login';
        //else if( xhr.status === 404 )
        //  inter.notify('Destination target could not be found', true);
        else if( xhr.status === 500 )
          inter.notify('Unexpected server error - We have been notified!', 'error');
        else if( e === 'parsererror' )
          inter.notify('Error.\nParsing JSON Request failed.', 'error');
        else if( e === 'timeout' )
          inter.notify('Request Time out.', 'error');
      });
      $('.ajax-button').live('click', function(){
        $(this).addClass('want-to-load-ajax');
      });

      $('form[data-remote=true]').live('submit', function(e){
        e.preventDefault();
        $.ajax({ url: $(this).attr('action'),
             dataType: 'script',
             data: $(this).serializeArray(),
             type: $(this).attr('method') });
      });

      $('a[data-remote=true]').live('click', function(e){
        e.preventDefault();
        var elem = this;
        inter.ajaxLoad( this );
      })

    },

    /**
     * add a notification message to the
     * notification system
     */
    notify: function notify( msg, error ){
      if( error )
        $('#inter-notifier').addClass('error');
      else
        $('#inter-notifier').removeClass('error');
      $('#inter-notifier .content').html(msg);
      $('#inter-notifier').show().find('.wrapper').switchClass('low','high', 0).delay(2000).switchClass('high','low', 600, 'easeOutBack');
    },

    ajaxLoad: function( elem ){
      var method = $(elem).attr('data-method') || 'get'
        , data = null;
      if( $(elem).attr('data-method') !== 'get' )
        data = {_csrf: $('#_csrf').val()};
        $.ajax({ url: $(elem).attr('href'),
             dataType: 'script',
             type: method,
             data: data
        });
    }

  };

  $('#inter-sidebar a.button').live('mouseenter', function(e){
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace('_w.svg', '.svg') ).end()
           .addClass('sidebar-button-hover')
           .find('.hover-text').show();
  }).live('mouseleave', function(e){
    $(this).find('img').attr('src', $(this).find('img').attr('src').replace('.svg', '_w.svg') ).end()
           .removeClass('sidebar-button-hover')
           .find('.hover-text').hide();
  })

  $('body').tooltip({
    selector: '[rel=tooltip]'
  }).on('click', function(){
    $(this).find('div.tooltip').remove();
  });

  $('.js-get-focus:first').focus();

  if( inter.mode === 'desktop' ){
    $('#desktop-control').show();
    $(document).on('keydown', function(e){
      if( e.metaKey && e.keyCode === 82 )
        location.reload();
      if( e.metaKey && e.keyCode == 87 )
        window.close();
    })
  }

  $('#inter-sidebar').interSidebar();
  inter.setupAjaxHelpers();

});