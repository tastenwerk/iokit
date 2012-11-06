var browserPlugin = {

  routes: function( app ){

    app.get('/browser', function( req, res ){
      res.render( __dirname + '/views/index' );
    });

  },

  sidebarWidget: {
    sidebarRemote: true
  }

}

module.exports = exports = browserPlugin;