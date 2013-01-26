/**
 * sidebar widget
 * adds actions to the iokit-menubar on the left hand side
 */

iokit = typeof(iokit) !== 'undefined' && iokit || {};

iokit.menubar = {

  load: function( iconId, url ){
    this.elem.find('.desc').hide(200);
    this.clearActive();
    $(iconId).addClass('active loading')
      .find('img').hide().after('<div class="loader"><div class="circle"><div class="circle"><div class="circle"><div class="circle"><div class="circle"></div>');
    $(iconId).find('img').attr('src', $(iconId).find('img').attr('src').replace('96x96w','96x96g'));
    iokit.ignoreHashChange = true;
    setTimeout(function(){ iokit.ignoreHashChange = false; }, 500);
    location.hash = url;
    $('#iokit-dashboard').hide();
    iokit.main.load( url, function(){
      $('#iokit-main-container').show();
      $(iconId).find('.loader').remove().end().find('img').fadeIn(300);
      setTimeout( function(){ $(iconId).removeClass('loading'); }, 300 );
    });

  },

  clearActive: function(){
    var icn = this.elem.find('img.icon');
    icn.each( function(index, icn){
      $(icn).attr('src', $(icn).attr('src').replace('96x96g','96x96w'));
    });
    this.elem.find('.active').removeClass('active').removeClass('loading');
  },

  init: function(){

    this.elem = $('#iokit-menubar');

    $(iokit.menubar.elem).find('li').on('click', function(e){
      e.preventDefault();

      if( $(this).hasClass('spacer') )
        return;

      iokit.menubar.load( this, $(this).find('a').attr('href') )

    });

    //if( location.hash.length === 0 )
    //$(iokit.menubar.elem).find('li:first').click();

  }

};