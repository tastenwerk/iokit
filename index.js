var fs = require('fs')
  , path = require('path');

inter = {

  /**
   * we display this version number inside
   * the web frontend
   */
  version: "0.1.0",
  
  /**
   * the defaults (indexed array)
   * held by this application
   */
  defaults: { title: "My Interbox" },

  /**
   * the plugins loaded into this application
   */
  plugins: {},

  /**
   * load plugins from local (inter) path
   *
   * this function should be called from express.js app.js
   * and should be loaded right after bodyParser has been loaded
   *
   * @param [express] - app the application object from expressjs
   *
   */
  collectLocalPlugins: function loadPlugins( app ){

    var pluginsPath = __dirname + '/lib/plugins';
    fs.readdirSync( pluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( pluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( pluginsPath, dirName );
      inter.loadPlugin( plugin, app );
    });

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
  registerPlugin: function registerPlugin( plugin, app ){

    if( plugin.route )
      plugin.route( app );
    if( plugin.middleware )
      plugin.middleware( app );

    if( plugin.statics ){
      if( plugin.statics.public ){
        var stats = require('fs').lstatSync( plugin.statics.public );
        if( stats.isDirectory() ){
          console.log('PUBLIC PATH: ' + plugin.permanent.publicPath + ' added.');
          server.use( express.static( plugin.permanent.publicPath ) );
        }
      }
    }

    inter.plugins[plugin.name] = plugin;

  }

}

module.exports = inter;