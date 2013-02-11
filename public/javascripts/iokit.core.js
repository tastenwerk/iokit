( function(){

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
  * iokit.modal('close')
  * closes the modal.
  */
  function modal( html, options ){

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
          e.preventDefault();
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
      html = html || options.data || options.html;
      $('#iokit-modal .modal-inner-wrapper').html( html ).fadeIn(200);
      if( options && options.before && typeof(options.before) === 'function' )
        options.before( $('#iokit-modal') );
      setupModalActions();
    }

  };

  /**
   * add a notification message to the
   * notification system
   */
  function notify( msg, type ){
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
  };

  var root = this; // window of browser

  if( !root.iokit || typeof( root.iokit ) !== 'object' )
    root.iokit = {};
  root.iokit.notify = notify;
  root.iokit.modal = modal;


  $(document).ready( function(){  
    $('.live-tipsy').tipsy({live: true});
    $('.live-tipsy-l').tipsy({live: true, gravity: 'e'});
    $('.live-tipsy-r').tipsy({live: true, gravity: 'w'});
  });


})();