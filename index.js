var fs = require('fs')
  , path = require('path');

inter = {

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
  inject: function loadPlugins( app ){

    var pluginsPath = __dirname + '/lib/plugins';
    fs.readdirSync( pluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( pluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( pluginsPath, dirName );
      inter.registerPlugin( plugin, app );
    });

    var appPluginsPath = process.cwd() + '/app/plugins';
    fs.readdirSync( appPluginsPath ).forEach( function( dirName ){
      var plugin = require( path.join( appPluginsPath, dirName ) );
      plugin.name = dirName;
      plugin.relativePath = path.join( appPluginsPath, dirName );
      inter.registerPlugin( plugin, app );
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

    if( plugin.routes )
      plugin.routes( app );
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