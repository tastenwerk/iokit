$(function(){

  iokit = {

    host: {
      native: document.location.protocol+'//'+document.location.host,
      master: $('#_host_master').val()
    },

    socket: {
      native: document.location.protocol+'//'+document.location.host,
      master: $('#_host_master').val()
    },

    mode: 'remote',

    main: {
      show: function( text, options, callback ){
        if( !callback && options && typeof(options) === 'function' )
          callback = options;
        $('#iokit-main-content').fadeOut(200, function(){
          $('#iokit-main-content').html( text ).fadeIn( 200, function(){
            if( callback && typeof(callback) === 'function' )
              callback( $('#iokit-main-content') );
          });
        });
      },
      load: function( url, callback ){
        $('#iokit-main-content').fadeOut( 200, function(){
          $('#iokit-main-content').load( url, function(){
            $('#iokit-main-content').fadeIn( 200, function(){
              if( callback && typeof(callback) === 'function' )
                callback( $('#iokit-main-content') );
            });
          });
        });
      }
    },

    _csrf: $('#_csrf').val(),

    mainHeight: function(){ return $(window).height() - 70 },

    sidebar: $('#iokit-sidebar'),

    hideSidebar: function(){ 
      iokit.sidebar.animate({ left: '-40%' }); 
      $('#iokit-main-content').animate({ left: 0 });
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
          iokit.notify({error: ['You are offline!!\n Please Check Your Network.']});
        else if( xhr.status in [401,403,304] )
          location.replace('/login');
        //else if( xhr.status === 404 )
        //  iokit.notify('Destination target could not be found', true);
        else if( xhr.status === 500 )
          iokit.notify('Unexpected server error - We have been notified!', 'error');
        else if( e === 'parsererror' )
          iokit.notify('Error.\nParsing JSON Request failed.', 'error');
        else if( e === 'timeout' )
          iokit.notify('Request Time out.', 'error');
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
        iokit.ajaxLoad( this );
      });

      $(document).on('click', 'a[data-link=true]', function(e){
        location.hash = $(this).attr('href');
      });

      $(window).on( 'hashchange', iokit.loadRemoteAfterHashChange );

    },

    /**
     * check for hash in url and eventually
     * reload the page
     */
    loadRemoteAfterHashChange: function loadRemoteAfterHashChange(){

      var urlarr = location.hash.substring(1).split('?')
        , pararr
        , url = urlarr[0];

      // deprecated?
      var params;
      if( urlarr.length > 1 )
        pararr = urlarr[1].split('&');

      if( pararr && pararr.length > 0 )
        for( var i=0, param; param=pararr[i]; i++ ){
          if( param.split('=').length === 2 )
            params[param.split('=')[0]] = param.split('=')[1];
        }
      // end deprecated?

      iokit.advancedPanel.hide();
      iokit.main.load( url + ( urlarr.length > 1 ? '?'+urlarr[1] : '' ) );

    },


    /**
     * add a notification message to the
     * notification system
     */
    notify: function notify( msg, type ){
      if( typeof(msg) === 'object' ){
        if( msg.error && msg.error instanceof Array && msg.error.length > 0 )
          msg.error.forEach( function( err ){
            iokit.notify( err, 'error' );
          });
        if( msg.notice && msg.notice instanceof Array && msg.notice.length > 0 )
          msg.notice.forEach( function( notice ){
            iokit.notify( notice );
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
     *  iokit.modal('close')
     * closes the modal.
     */
    modal: function( html, options ){

      function closeModal(){
        $('.iokit-modal').fadeOut(300);
        setTimeout( function(){
          $('.iokit-modal').remove();
        }, 300);
        $(window).off( 'resize', checkModalHeight );
      }

      function checkModalHeight(){
        if( $('#iokit-modal').height() > $(window).height() - 40 )
          $('#iokit-modal').animate({ height: $(window).height() - 40 }, 200);
        else
          $('#iokit-modal').animate({ height: $('#iokit-modal').data('origHeight') }, 200);
      }

      function setupModalActions(){
        if( $('#iokit-modal .modal-sidebar').length > 0 ){
          $('#iokit-modal .modal-sidebar > .sidebar-nav li').on('click', function(){
            $(this).closest('ul').find('.active').removeClass('active');
            $('#iokit-modal .sidebar-content > div').hide();
            $($('#iokit-modal .sidebar-content > div')[$(this).index()]).show();
            $(this).addClass('active');
          }).first().click();
        }
        if( options && options.completed && typeof(options.completed) === 'function' )
          setTimeout(function(){ options.completed( $('#iokit-modal') ); }, 500 );
      }

      if( html === 'close' )
        return closeModal();
      else if( typeof(html) === 'object' ){
        options = html;
        html = null;
      }

      $('.iokit-modal').remove();
      $('body').append('<div id="iokit-modal-overlay" class="iokit-modal"/>')
        .append('<div id="iokit-modal" class="iokit-modal"><div class="modal-inner-wrapper" /></div>');
      var closeModalBtn = $('<a class="close-icn">&times;</a>');
      $('#iokit-modal').prepend(closeModalBtn);
      if( options.windowControls ){
        var countWinCtrlBtns = 1;
        for( ctrl in options.windowControls ){
          var winCtrlBtn = $('<a winCtrl="'+ctrl+'" class="modal-win-ctrl live-tipsy" href="#" original-title="'+options.windowControls[ctrl].title+'"><span class="icn '+options.windowControls[ctrl].icn+'" /></a>');
          winCtrlBtn.css( { right: 16*(countWinCtrlBtns++)+32 } );
          $('#iokit-modal').prepend(winCtrlBtn);
          winCtrlBtn.on('click', function(e){
            options.windowControls[$(this).attr('winCtrl')].callback( $('#iokit-modal') );
          })
        }
      }
      closeModalBtn.on('click', closeModal);
      $('#iokit-modal-overlay').fadeIn(200).on('click', closeModal);
      if( options && options.title )
        $('#iokit-modal').prepend('<span class="modal-title">'+options.title+'</span>');


      // height configuration      
      if( options && options.height && typeof(options.height) === 'number' )
        $('#iokit-modal').css( 'height', options.height );
      $('#iokit-modal').data('origHeight', $('#iokit-modal').height());

      checkModalHeight();
      $(window).on( 'resize', checkModalHeight );

      if( options.url ){
        $('#iokit-modal .modal-inner-wrapper').load( options.url, function(){
          if( options && options.before && typeof(options.before) === 'function' )
            options.before( $('#iokit-modal') );
          $('#iokit-modal').fadeIn( 200 );
          setupModalActions();
        });
      } else {
        html = html || options.data;
        $('#iokit-modal .modal-inner-wrapper').html( html ).fadeIn(200);
        if( options && options.before && typeof(options.before) === 'function' )
          options.before( $('#iokit-modal') );
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
    },

    advancedPanel: {

      show: function(){
        $('#iokit-advanced-panel').slideDown({ easing: 'easeOutBounce', duration: 500 });
        $('#click-here-for-advanced .adv-close').show();
        $('#click-here-for-advanced .adv-open').hide();
        setTimeout( function(){
          $('#iokit-advanced-panel .query input').focus();
        }, 500)
      },

      hide: function(){
        $('#iokit-advanced-panel').slideUp(200);
        $('#click-here-for-advanced .adv-close').hide();
        $('#click-here-for-advanced .adv-open').show();
      }
    }

  };


  $.i18n.init({ dynamicLoad: true, useLocalStorage: false, fallbackLng: 'de', load: 'unspecific', resGetPath: iokit.host.native+'/translations.json?lng=__lng__&ns=__ns__' });

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
      $('.iokit-modal').fadeOut(300);
      setTimeout( function(){
        $('.iokit-modal').remove();
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
    if( !$(e.target).hasClass('iokit-advanced-panel') &&
        !$(e.target).closest('.iokit-advanced-panel').length &&
        !$(e.target).closest('#iokit-top-panel').length )
      iokit.advancedPanel.hide();
    $('.tipsy').remove();
  }).on('keydown', function(e){
    if( e.keyCode === 27 ){ // ESC
      iokit.modal('close');
      iokit.advancedPanel.hide();
      return false;
    }
    if( (e.ctrlKey || e.metaKey) && e.keyCode === 70 ){ // CTRL-f
      iokit.advancedPanel.show();
      return false;
    }
  })

  $('#click-here-for-advanced').on('click', function(e){
    if( $('#iokit-advanced-panel').is(':visible') )
      iokit.advancedPanel.hide();
    else
      iokit.advancedPanel.show();
  });

  /*
  $('#iokit-advanced-panel').on('mouseleave', function(e){
    if( $(e.target).hasClass('iokit-top-panel') || $(e.target).closest('.iokit-top-panel').length )
      return;
    $(this).slideUp(200);
  })
*/

  $('.js-get-focus:first').focus();

  if( iokit.mode === 'desktop' ){
    $('#desktop-control').show();
    $(document).on('keydown', function(e){
      if( e.metaKey && e.keyCode === 82 )
        location.reload();
      if( e.metaKey && e.keyCode == 87 )
        window.close();
    })
  }

  if( typeof($.fn.iokitSidebar) === 'function' )
    $('#iokit-sidebar').iokitSidebar();
  iokit.setupAjaxHelpers();

  if( location.hash.length > 0 )
    iokit.loadRemoteAfterHashChange();

});