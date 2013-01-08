var fs = require('fs')
  , path = require('path')
  , stylus = require('stylus')
  , i18next = require('i18next')
  , iomapper = require('iomapper')
  , express
  , expressValidator = require('express-validator');


i18next.init({
    resGetPath: __dirname + '/locales/__lng__/__ns__.json',
    fallbackLng: 'de',
    saveMissing: true,
    dynamicLoad: true
});

iokit = {

  /**
   * the mongo connection object
   */
  conn: null,

  /**
   * the plugins loaded into this application
   */
  plugins: {},

  /**
   * injects expressjs app with iokit plugin eco-system
   *
   * this function should be called from express.js app.js
   * and should be loaded right after bodyParser has been loaded
   *
   * @param [express] - expressjs object
   * @param [app] - the app object
   * @param [io] - the socket.io object (if initialized)
   *
   */
  inject: function loadPlugins( _express, app, io ){

    express = _express;
    
    app.set('view engine', 'jade');
    app.engine('jade', require('jade').__express);
    app.engine('ejs', require('ejs').__express);

    app.use(express.bodyParser());
    app.use(expressValidator); // VALIDATOR

    app.use(express.cookieParser(new Date().getTime().toString(36)));
    app.use(express.session({ key: 'iokit' }));
    app.use( express.csrf() );

    var pluginsPath = __dirname + '/lib/plugins';
    fs.readdirSync( pluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( pluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( pluginsPath, dirName );
      iokit.registerPlugin( plugin );
    });

    // get plugins from app (maybe they override some of the defaults)
    var appPluginsPath = process.cwd() + '/app/plugins';
    if( fs.existsSync(appPluginsPath) )
      fs.readdirSync( appPluginsPath ).forEach( function( dirName ){
        var plugin = require( path.join( appPluginsPath, dirName ) );
        plugin.name = dirName;
        plugin.relativePath = path.join( appPluginsPath, dirName );
        iokit.registerPlugin( plugin );
      });

    app.use(i18next.handle);
    i18next.registerAppHelper(app);
    
    iokit.loadPluginStatics( app, __dirname + '/public' );
    iokit.loadPluginMiddleware( app );
    if( typeof( io ) !== 'undefined' )
      iokit.loadPluginSocketware( io );
    iokit.loadPluginRoutes( app );
    iokit.loadPluginStatics( app );

    app.use( express.favicon( __dirname + '/public/favicon.ico' ));
    app.get('/admin', iokit.plugins.auth.check, function( req, res ){ res.render( __dirname + '/app/views/index', {title: iokit.config.site.title+'|tas10box'} ); } );
  
  },

  view: {

    paths: [],

    /**
     * iterate through the iokit.view.paths
     * if the given relative path matches
     * with them.
     *
     * @param {String} [relPath] the relative path that
     * is expected to be in one of the defined view.paths
     *
     * @returns {String} [absPath] the absolute path which
     * can be passed to expressjs' res.render.
     *
     * @example
     *  res.render( iokit.view.paths('/auth/login.jade'), {flash: 'please log in'} );
     */
    lookup: function( relPath, noError ){
      var found;
      for( var i=0, pth; pth = iokit.view.paths[i]; i++ ){
        var absPth = path.join( pth, relPath );
        if( fs.existsSync( absPth ) )
          return (found = absPth);
      }
      console.log('using view', found);
      if( found ) return found;
      if( noError )
        return;
      throw( new Error('could not find template '+ relPath +' in any of the provided views ('+iokit.view.paths.join(',')+')') );
    }

  },

  /**
   * starts the mongo connection
   */
  startDBConnection: function(){
    console.log('[iokit] conecting to mongodb '+ iokit.config.db.url );
    iokit.conn = iomapper.connect( iokit.config.db.url, iokit.config.db.debug );
  },

  /**
   * registers an iokit plugin
   *
   * a plugin can either be a collection of plugins where
   * the collection's keys are the plugin's names (will override .name)
   * or a single plugin where .name is defined
   *
   * @param {object} [app] - the expressjs application object
   * @param {object} [plugin] - the plugin or collection of plugins to be registered.
   *
   * @example
   *  { name: 'myplugin',
   *    routes: function( app ){ // routes as described in expressjs },
   *    middleware: function( app ){ // middleware as described in expressjs },
   *    docklets: [ array, of, <dockletName>s, to, be, expected, in, 'views/<pluginName>/docklets/<dockletName>'],
   *    statics: [ public: 'path/to/public/path/to/be/added', javascripts: 'path/to/javascripts' ],
   *    views: absolutePathToAdditionaViewsDir,
   *    translations: absolutePathToTranslationsFile,
   *    sidebarWidget: true // will be listed in sidebar, also: { url: 'url/to/widget.html', icon: 'url/to/img' } are possible
   *    allowedRoles: [ array, of, userRoles, allowed, to, access, this, plugin ]
   *  }
   *
   * @example of more than one plugin within a plugin folder
   *  { myplugin1: {
   *      routes: //routes as described above,
   *      middleware: // middleware as described above
   *    },
   *    myplugin2: {
   *      routes: //routes as described above
   *    }
   *  }
   *
   */
  registerPlugin: function registerPlugin( app, plugin ){

    // external plugin loads with (app, plugin)
    if( arguments.length === 2 ){

      if( !plugin.name )
        for( var pluginName in plugin ){
          plugin[pluginName].name = pluginName;
          this._registerPlugin( app, plugin[pluginName] );
        }
      else
        this._registerPlugin( plugin );

    } else {

      plugin = app;
      if( plugin.name )
        if( plugin.disabled )
          console.log('[iokit] [INTERNAL PLUGIN] ['+plugin.name+'] DISABLED !!!');
        else
          iokit.plugins[plugin.name] = plugin;

    }

  },

  /**
   * internal register function called from
   * iokit.registerPlugin
   */
  _registerPlugin: function _registerPlugin( app, plugin ){

    this.plugins[plugin.name] = plugin;

    if( plugin.disabled ){
      console.log('[iokit] [PLUGIN] ['+plugin.name+'] DISABLED !!!');
      return;
    }

    if( plugin.middleware )
      plugin.middleware( app );

    if( plugin.routes )
      this.loadPluginRoutes( app, plugin );

    if( plugin.statics )
      this.loadPluginStatics( app, plugin.statics.public );

    if( plugin.views )
      this.view.paths = [ plugin.views ].concat( this.view.paths );

    console.log('[iokit] [PLUGIN] ['+plugin.name+'] registered');

  },

  loadPluginMiddleware: function loadPluginMiddleware( app ){

    for( var i in iokit.plugins ){
      var plugin = iokit.plugins[i];
      if( plugin.middleware )
        plugin.middleware( app );
    }

  },

  loadPluginSocketware: function loadPluginSocketware( io ){

    for( var i in iokit.plugins ){
      var plugin = iokit.plugins[i];
      if( plugin.socketware )
        plugin.socketware( io );
    }

  },

  loadPluginRoutes: function loadPluginRoutes( app, plugin ){

    if( arguments.length === 2 ){
      this._loadPluginRoutes( app, plugin );
    } else {
      for( var i in iokit.plugins ){
        var plugin = iokit.plugins[i];
        this._loadPluginRoutes( app, plugin );
      }
    }

  },

  _loadPluginRoutes: function _loadPluginRoutes( app, plugin ){

    if( plugin.routes )

      if( typeof(plugin.routes) === 'function' )

        plugin.routes( app );

      else if( typeof(plugin.routes) === 'string' ){

        fs.readdirSync( plugin.routes ).forEach( function( routeFile ){

            if( routeFile.indexOf('index') < 0 )
              require( path.join(plugin.routes, routeFile ) )( app );

          });

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
      for( var i in iokit.plugins ){
        var plugin = iokit.plugins[i];
        if( plugin.statics ){
          if( plugin.statics.public )
            loadPluginPublic( plugin.statics.public );
        }
      }

  },

  sendMail: require( __dirname + '/lib/sendmail'),

  port: function(){
    var hostname = JSON.parse( fs.readFileSync( process.cwd()+'/config/iokit.json' ) ).hostname
    return( hostname.split(':').length === 3 ? hostname.split(':')[2] : 3000 );
  }()

}

module.exports = iokit;