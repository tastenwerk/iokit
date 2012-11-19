var konter = require('konter');

// internal modules
var auth = require( __dirname + '/../auth' );

var dashboardPlugin = {

  routes: function( app ){

    app.get('/dashboard/applets.json', function( req, res ){
      res.json( [ 'a', 'b' ] );
    });

    app.get('/dashboard', auth.check, function( req, res ){
      res.render( __dirname + '/views/index' );
    });

  },

  sidebarWidget: {
  }

}

module.exports = exports = dashboardPlugin;