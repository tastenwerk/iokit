$(function(){

  inter = {

    host: {
      master: $('#_host_master').val()
    },

    socket: {
      master: $('#_host_master').val()
    },

    mode: 'remote',

    main: {
      show: function( text, options, callback ){
        if( !callback && options && typeof(options) === 'function' )
          callback = options;
        $('#inter-main-content').fadeOut(200, function(){
          $('#inter-main-content').html( text ).fadeIn( 200, function(){
            if( callback && typeof(callback) === 'function' )
              callback( $('#inter-main-content') );
          });
        });
      },
      load: function( url, callback ){
        $('#inter-main-content').fadeOut( 200, function(){
          $('#inter-main-content').load( url, function(){
            $('#inter-main-content').fadeIn( 200, function(){
              if( callback && typeof(callback) === 'function' )
                callback( $('#inter-main-content') );
            });
          });
        });
      }
    },

    _csrf: $('#_csrf').val(),

    mainHeight: function(){ return $(window).height() - 70 },

    sidebar: $('#inter-sidebar'),

    hideSidebar: function(){ 
      inter.sidebar.animate({ left: '-40%' }); 
      $('#inter-main-content').animate({ left: 0 });
    },

    loaderHtml: '<div class="loader"><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /><div class="circle" /></div>',

    setupTranslations: function setupTranslations(){
      $('.i18n').each( function(){
        $(this).text( $.i18n.t($(this).attr('data-i18n')) );
      });
    },

    setupAjaxHelpers: function setupAjaxHelpers(){
      
      $(document).bind("ajaxSend", function(e, req){})
      .bind("ajaxError", function(e, xhr){
        if( xhr.status === 0 )
          inter.notify({error: ['You are offline!!\n Please Check Your Network.']});
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
     * @param {Object} [options] options are:
     * * height: desired height of modal window
     * * before: callback function, before modal will be shown
     * * completed: callback function, after modal has been shown and is visible
     * to the user.
     * * url: remote url, if this modal should be loaded from url
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
        $(window).off( 'resize', checkModalHeight );
      }

      function checkModalHeight(){
        if( $('#inter-modal').height() > $(window).height() - 40 )
          $('#inter-modal').animate({ height: $(window).height() - 40 }, 200);
        else
          $('#inter-modal').animate({ height: $('#inter-modal').data('origHeight') }, 200);
      }

      function setupModalActions(){
        if( $('#inter-modal .modal-sidebar').length > 0 ){
          $('#inter-modal .modal-sidebar > .sidebar-nav li').on('click', function(){
            $(this).closest('ul').find('.active').removeClass('active');
            $('#inter-modal .sidebar-content > div').hide();
            $($('#inter-modal .sidebar-content > div')[$(this).index()]).show();
            $(this).addClass('active');
          }).first().click();
        }
        if( options && options.completed && typeof(options.completed) === 'function' )
          setTimeout(function(){ options.completed( $('#inter-modal') ); }, 500 );
      }

      if( html === 'close' )
        return closeModal();
      else if( typeof(html) === 'object' ){
        options = html;
        html = null;
      }

      $('.inter-modal').remove();
      $('body').append('<div id="inter-modal-overlay" class="inter-modal"/>')
        .append('<div id="inter-modal" class="inter-modal"><div class="modal-inner-wrapper" /></div>');
      var closeModalBtn = $('<a class="close-icn">&times;</a>');
      $('#inter-modal').prepend(closeModalBtn);
      if( options.windowControls ){
        var countWinCtrlBtns = 1;
        console.log(options.windowControls);
        for( ctrl in options.windowControls ){
          var winCtrlBtn = $('<a winCtrl="'+ctrl+'" class="modal-win-ctrl live-tipsy" href="#" original-title="'+options.windowControls[ctrl].title+'"><span class="icn '+options.windowControls[ctrl].icn+'" /></a>');
          winCtrlBtn.css( { right: 16*(countWinCtrlBtns++)+32 } );
          $('#inter-modal').prepend(winCtrlBtn);
          console.log(ctrl);
          winCtrlBtn.on('click', function(e){
            console.log('callback for', ctrl);
            options.windowControls[$(this).attr('winCtrl')].callback( $('#inter-modal') );
          })
        }
      }
      closeModalBtn.on('click', closeModal);
      $('#inter-modal-overlay').fadeIn(200).on('click', closeModal);
      if( options && options.title )
        $('#inter-modal').prepend('<span class="modal-title">'+options.title+'</span>');


      // height configuration      
      if( options && options.height && typeof(options.height) === 'number' )
        $('#inter-modal').css( 'height', options.height );
      $('#inter-modal').data('origHeight', $('#inter-modal').height());

      checkModalHeight();
      $(window).on( 'resize', checkModalHeight );

      if( options.url ){
        $('#inter-modal .modal-inner-wrapper').load( options.url, function(){
          if( options && options.before && typeof(options.before) === 'function' )
            options.before( $('#inter-modal') );
          $('#inter-modal').fadeIn( 200 );
          setupModalActions();
        });
      } else {
        html = html || options.data;
        $('#inter-modal .modal-inner-wrapper').html( html ).fadeIn(200);
        if( options && options.before && typeof(options.before) === 'function' )
          options.before( $('#inter-modal') );
        setupModalActions();
      }

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
    },

    fineUploaderText: function fineUploaderText(){
      return {
        uploadButton: '<i class="icn icn-upload pull-left"></i> <span class="pull-left">'+$.i18n.t('files.select')+'</span>',
        cancelButton: 'Cancel',
        retryButton: 'Retry',
        failUpload: 'Upload failed',
        dragZone: $.i18n.t('files.drag_here_to_upload'),
        formatProgress: "{percent}% of {total_size}",
        waitingForResponse: "Processing..."
      }
    }

  };


  $.i18n.init({ dynamicLoad: true, useLocalStorage: false, fallbackLng: 'de', load: 'unspecific', resGetPath: inter.host.master+'/translations.json?lng=__lng__&ns=__ns__' });

  $('.live-tipsy').tipsy({live: true});
  $('.live-tipsy-l').tipsy({live: true, gravity: 'e'});
  $('.live-tipsy-r').tipsy({live: true, gravity: 'w'});

  moment.lang('de');

/*
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
  */
  $(document).on('click', function(e){
    if( !$(e.target).closest('.dropdown').length )
      $('.dropdown-menu').hide();
    if( !$(e.target).hasClass('js-remove-on-click-trigger') &&
        !$(e.target).closest('.js-remove-on-click-trigger').length &&
        !$(e.target).hasClass('js-remove-on-click') && 
        !$(e.target).closest('.js-remove-on-click').length )
      $('.js-remove-on-click').remove();
    $('.tipsy').remove();
  }).on('keydown', function(e){
    if( e.keyCode === 27 ){ // ESC
      inter.modal('close');
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

  if( typeof($.fn.interSidebar) === 'function' )
    $('#inter-sidebar').interSidebar();
  inter.setupAjaxHelpers();

});