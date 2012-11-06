var fs = require('fs')
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/inter.json' ) )
  , flash = require( __dirname + '/../../flash' )
  , inter = require( __dirname + '/../../../index' );

config.version = require( __dirname + '/../../version' )

var defaultsPlugin = {

  middleware: function( app ){

    inter.config = config,
    
    app.locals.inter = { config: config, plugins: inter.plugins },

    app.use( flash );

    /**
     * set defaults middleware. This enables the defaults indexed array
     * to be used inside views
     */
    app.use( function setDefaults( req, res, next ){
      res.locals._csrf = req.session._csrf;
      next();
    } );

  }

}

module.exports = exports = defaultsPlugin;