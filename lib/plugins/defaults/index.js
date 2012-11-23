var fs = require('fs')
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/inter.json' ) )
  , flash = require( __dirname + '/../../flash' )
  , partial = require( __dirname + '/../../partial' )
  , moment = require('moment')
  , inter = require( __dirname + '/../../../index' );

config.version = require( __dirname + '/../../version' )

var defaultsPlugin = {

  middleware: function( app ){

    inter.config = config,
    
    app.locals.inter = { 
      config: config, 
      plugins: inter.plugins
    },

    app.use( flash );
    app.use( partial );

    /**
     * set defaults middleware. This enables the defaults indexed array
     * to be used inside views
     */
    app.use( function setDefaults( req, res, next ){
      try{
        moment.lang(res.locals.currentUser.settings.locale);
      } catch(e){ moment.lang('de'); }

      // returns, if a plugin has defined allowedRoles and if the
      // currentUser is in one of the efined roles
      app.locals.inter.pluginAllowed = function( plugin ){
        if( plugin.allowedRoles )
          return plugin.allowedRoles.some(function(el) { return res.locals.currentUser.roles.indexOf(el) > -1 });
        return true;
      };

      res.locals.moment = req.moment = moment;
      res.locals._csrf = req.session._csrf;
      next();
    } );

  },

  routes: function( app ){

    app.get( '/translations.json', function( req, res ){
      var name = req.query.lng;
      if( name.split(' ').length > 1 )
        name = name.split(' ')[name.split(' ').length-1];
      var tr = JSON.parse( fs.readFileSync( __dirname + '/../../../locales/'+name+'/translation.json' ) );
      for( var i in inter.plugins)
        if( inter.plugins[i].translations ){
          var _tr = JSON.parse( fs.readFileSync( inter.plugins[i].translations+'/'+name+'/translation.json' ) );
          for( var j in _tr )
            tr[j] = _tr[j];
        }
      res.json( tr );
    });

  }

}

module.exports = exports = defaultsPlugin;