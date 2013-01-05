var fs = require('fs')
  , config = JSON.parse( fs.readFileSync( process.cwd() + '/config/iokit.json' ) )
  , flash = require( __dirname + '/../../flash' )
  , partial = require( __dirname + '/../../partial' )
  , moment = require('moment')
  , iokit = require( __dirname + '/../../../index' );

config.version = require( __dirname + '/../../version' )

var defaultsPlugin = {

  middleware: function( app ){

    iokit.config = config,
    
    app.locals.iokit = { 
      config: config, 
      plugins: iokit.plugins
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
      app.locals.iokit.pluginAllowed = function( plugin ){
        if( !res.locals.currentUser )
          return false;
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
      var name = lang = req.query.lng;
      if( name.split(' ').length > 1 )
        name = lang = name.split(' ')[name.split(' ').length-1];
      var tr = {};
      tr[lang] = {'translation': JSON.parse( fs.readFileSync( __dirname + '/../../../locales/'+name+'/translation.json' ) )};
      for( var i in iokit.plugins)
        if( iokit.plugins[i].translations ){
          var _tr = JSON.parse( fs.readFileSync( iokit.plugins[i].translations+'/'+name+'/translation.json' ) );
          for( var j in _tr )
            tr[lang]['translation'][j] = _tr[j];
        }
      res.json( tr );
    });

  }

}

module.exports = exports = defaultsPlugin;