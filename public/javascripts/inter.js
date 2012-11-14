$(function(){

  inter = {

    host: {
      master: $('#_host_master').val()
    },

    mode: 'remote',

    main: $('#inter-main-content'),

    mainHeight: function(){ return $(window).height() - 70 },

    sidebar: $('#inter-sidebar-content'),

    hideSidebar: function(){ 
      inter.sidebar.animate({ left: '-40%' }); 
      $('#inter-main-content').animate({ left: 0 });
    },

    setupAjaxHelpers: function setupAjaxHelpers(){
      
      $(document).bind("ajaxSend", function(e, req){})
      .bind("ajaxError", function(e, xhr){
        if( xhr.status === 0 )
        inter.notify('You are offline!!\n Please Check Your Network.', 'error');
        else if( xhr.status in [401,403] )
          window.location.replace('/login');
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
        var data = $(this).serializeArray();
        data.push({name: '_csrf', value: $('#_csrf').val() });
        $.ajax({ url: $(this).attr('action'),
             dataType: 'script',
             data: data,
             error: function( data, msg, err ){
              console.log('error', err );
             },
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
    notify: function notify( msg, type ){
      if( typeof(msg) === 'object' ){
        if( msg.error && msg.error instanceof Array && msg.error.length > 0 )
          msg.error.forEach( function( err ){
            inter.notify( err, 'error' );
          });
        if( msg.notice && msg.notice instanceof Array && msg.notice.length > 0 )
          msg.notice.forEach( function( notice ){
            inter.notify( notice );
          });
        return;
      }

      $.noticeAdd({
        text: msg,
        stay: (type && type !== 'notice'),
        type: type
      });
    },

    /**
     * adds a blocking modal box to the whole
     * screen
     *
     * @param {String} [html] the html string to be rendered to this modal
     * also, action strings are valid:
     * 
     * @param {Function} [callback] the callback that should be triggered
     * after modal has been rendered.
     *
     * @example
     *  inter.modal('close')
     * closes the modal.
     */
    modal: function( html, options ){
      function closeModal(){
        $('.inter-modal').fadeOut(300);
        setTimeout( function(){
          $('.inter-modal').remove();
        }, 300);
      }
      if( html === 'close' )
        return closeModal();
      $('#inter-main-content').append('<div id="inter-modal-overlay" class="inter-modal"/>');
      $('#inter-main-content').append('<div id="inter-modal" class="inter-modal"><div class="inner-wrapper" /></div>');
      $('#inter-modal .inner-wrapper').html( html ).fadeIn(500);
      $('#inter-modal-overlay').fadeIn(200).on('click', closeModal);
      if( options.height && typeof(options.height) === 'number' )
        $('#inter-modal').css( 'height', options.height );
      if( options.before && typeof(options.before) === 'function' )
        options.before( $('#inter-modal') );
      if( options.complete && typeof(options.complete) === 'function' )
        setTimeout(function(){ options.complete( $('#inter-modal') ); }, 500 );
    },

    ajaxLoad: function( elem ){
      var method = $(elem).attr('data-method') || 'get'
        , data = null;
      if( $(elem).attr('data-method') && $(elem).attr('data-method') !== 'get' )
        data = {_csrf: $('#_csrf').val()};
        $.ajax({ url: $(elem).attr('href'),
             dataType: 'script',
             type: method,
             data: data
        });
    }

  };

  $.i18n.init({ dynamicLoad: true, useLocalStorage: false, fallbackLng: 'de', resGetPath: inter.host.master+'/translations.json?lng=__lng__&ns=__ns__' });

  $('body').tooltip({
    selector: '[rel=tooltip]'
  }).on('click', function(){
    $(this).find('div.tooltip').remove();
  }).on('keydown', function(e){
    // ESC
    if ( e.keyCode === 27 ){
      $('.inter-modal').fadeOut(300);
      setTimeout( function(){
        $('.inter-modal').remove();
      },300);
    }
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