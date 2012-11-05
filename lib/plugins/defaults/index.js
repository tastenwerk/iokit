var fs = require('fs')
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/inter.json' ) );
config.version = require( __dirname + '/../../version' )

var defaultsPlugin = {

  middleware: function( app ){

    app.locals = config;

    /**
     * set defaults middleware. This enables the defaults indexed array
     * to be used inside views
     */
    app.use( function setDefaults( req, res, next ){
      next();
    } );

  }

}

module.exports = exports = defaultsPlugin;