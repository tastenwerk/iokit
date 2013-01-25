/**
 * sidebar widget
 * adds actions to the iokit-menubar on the left hand side
 */

iokit = typeof(iokit) !== 'undefined' && iokit || {};

iokit.sidebar = {

  load: function( iconId, url ){
    console.log(iconId, url);
    $(this.elem).find('.active').removeClass('active').removeClass('loading');
    $(iconId).addClass('active loading')
      .find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');
    iokit.main.load( url, function(){
        $(iconId).find('.loader').remove().end().find('img').fadeIn(300);
        setTimeout( function(){ $(iconId).removeClass('loading'); }, 300 );
      });

  },

  init: function(){

    this.elem = $('#iokit-menubar');

    $(iokit.sidebar.elem).find('li').on('click', function(e){

      e.preventDefault();
      iokit.sidebar.load( this, $(this).find('a').attr('href') )

    });

    //if( location.hash.length === 0 )
    //$(iokit.sidebar.elem).find('li:first').click();

  }

};