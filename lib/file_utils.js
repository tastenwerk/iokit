/**
 * file utils plugin
 */

var fs = require('fs')
  , path = require('path');

var iokit = require( __dirname + '/../index' );

/**
 * ensures the existence of given directory
 * within iokit.config.datastore.absolutePath
 *
 * @param {String} [dir] relative path which is asked to be created
 * @param {Function} [callback] the function to be called on finish
 *
 */
function ensureRecursiveDir( dir, callback ){

  var dirs = dir.split(path.sep)
    , err
    , dir = '';

  function createNext(){
    var tmpDir;
    if( tmpDir = dirs.shift() )
      if( dir = path.join( dir, tmpDir ) ){
        if( !fs.existsSync( path.join(iokit.config.datastore.absolutePath, dir ) ) )
          err = fs.mkdirSync( path.join(iokit.config.datastore.absolutePath, dir) );
        if( err ) console.log('error creating dir', tmpDir, err);
        createNext();
      } else
        callback( 'assigning path failed (ensureRecursiveDir)' );
    else
      callback( null ); // TODO: error handling
  }

  createNext();

}

module.exports = exports = {

  ensureRecursiveDir: ensureRecursiveDir

};