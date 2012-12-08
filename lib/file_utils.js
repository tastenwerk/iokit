/**
 * file utils plugin
 */

var fs = require('fs')
  , path = require('path');

var inter = require( __dirname + '/../index' );

/**
 * ensures the existence of given directory
 * within inter.config.datastore.absolutePath
 *
 * @param {String} [dir] relative path which is asked to be created
 * @param {Function} [callback] the function to be called on finish
 *
 */
function ensureRecursiveDir( dir, callback ){

  console.log('request to create recursive dir', dir);
  var dirs = dir.split(path.sep)
    , err
    , dir = '';

  function createNext(){
    var tmpDir;
    console.log('arr:', dirs)
    if( tmpDir = dirs.shift() )
      if( dir = path.join( dir, tmpDir ) ){
        console.log('creating', tmpDir);
        if( !fs.existsSync( path.join(inter.config.datastore.absolutePath, dir ) ) )
          err = fs.mkdirSync( path.join(inter.config.datastore.absolutePath, dir) );
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