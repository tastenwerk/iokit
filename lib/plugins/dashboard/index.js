var dashboardPlugin = {

  routes: function( app ){

    app.get('/dashboard/sidebar_content', function( req, res ){
      res.render( __dirname + '/views/sidebar_content' );
    });

    app.get('/dashboard', function( req, res ){
      res.render( __dirname + '/views/index' );
    });

  },

  sidebarWidget: {
  }


}

module.exports = exports = dashboardPlugin;