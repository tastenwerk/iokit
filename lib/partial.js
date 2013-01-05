var jade = require('jade')
  , fs = require('fs')
  , iokit = require( __dirname + '/../index' );

module.exports = exports = function( req, res, next ){

  if( res.locals.partial )
    return next();

  /**
   * simple partial system
   *
   */
  res.locals.partial = function( path, options ){
    var pth = path;
    if( !fs.existsSync( pth ) )
      pth = iokit.view.lookup(path);
    var prtl = jade.compile( fs.readFileSync( pth ) );
    options = options || {};
    options.t = req.i18n.t;
    return prtl( options );
  }

  next();

};