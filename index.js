var fs = require('fs')
  , path = require('path')
  , stylus = require('stylus')
  , i18next = require('i18next')
  , konter = require('konter')
  , express;

i18next.init({
    resGetPath: __dirname + '/public/locales/__lng__/__ns__.json',
    fallbackLng: 'de',
    saveMissing: true,
    dynamicLoad: true
});

inter = {

  /**
   * the mongo connection object
   */
  conn: null,

  /**
   * the plugins loaded into this application
   */
  plugins: {},

  /**
   * injects expressjs app with inter plugin eco-system
   *
   * this function should be called from express.js app.js
   * and should be loaded right after bodyParser has been loaded
   *
   * @param [express] - app the application object from expressjs
   *
   */
  inject: function loadPlugins( _express, app ){

    express = _express;
    
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser(new Date().getTime().toString(36)));
    app.use(express.session({ key: 'inter' }));
    app.use( express.csrf() );

    var pluginsPath = __dirname + '/lib/plugins';
    fs.readdirSync( pluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( pluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( pluginsPath, dirName );
      inter.registerPlugin( plugin );
    });

    // get plugins from app (maybe they override some of the defaults)
    var appPluginsPath = process.cwd() + '/app/plugins';
    fs.readdirSync( appPluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( appPluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( appPluginsPath, dirName );
      inter.registerPlugin( plugin );
    });

    app.use(i18next.handle);
    i18next.registerAppHelper(app);
    
    inter.loadPluginStatics( app, __dirname + '/public' );
    inter.loadPluginMiddleware( app );
    inter.loadPluginRoutes( app );
    inter.loadPluginStatics( app );

    app.use( express.favicon( __dirname + '/public/favicon.ico' ));
    app.get('/inter', inter.plugins.auth.check, function( req, res ){ res.render( __dirname + '/app/views/index' ); } );
  
  },

  /**
   * starts the mongo connection
   */
  startDBConnection: function(){
    console.log('[inter] conecting to mongodb '+ inter.config.db.url );
    inter.conn = konter.connect( inter.config.db.url, inter.config.db.debug );
  },

  /**
   * registers a plugin
   *
   * a plugin structure can be like:
   *
   *  { routes: function( app ){ define routes here }, 
   *    middleware: function( app ){ define your middleware here } 
   *  }
   */
  registerPlugin: function registerPlugin( plugin ){

    if( plugin.name )
      inter.plugins[plugin.name] = plugin;

  },

  loadPluginMiddleware: function loadPluginMiddleware( app ){

    for( var i in inter.plugins ){
      var plugin = inter.plugins[i];
      if( plugin.middleware )
        plugin.middleware( app );
    }

  },

  loadPluginRoutes: function loadPluginRoutes( app ){

    for( var i in inter.plugins ){
      var plugin = inter.plugins[i];
      if( plugin.routes )
        plugin.routes( app );
    }

  },

  loadPluginStatics: function loadPluginStatics( app, dirname ){

    function loadPluginPublic( path ){
      var stats = require('fs').lstatSync( path );
      if( stats.isDirectory() ){
        console.log('PUBLIC PATH: ' + path + ' added.');
        app.use( stylus.middleware( path ) );
        app.use( express.static( path ) );
      }
    }

    if( dirname )
      loadPluginPublic( dirname );
    else
      for( var i in inter.plugins ){
        var plugin = inter.plugins[i];
        if( plugin.statics ){
          if( plugin.statics.public )
            loadPluginPublic( plugin.statics.public );
        }
      }

  }

}

module.exports = inter;