var jade = require('jade')
  , fs = require('fs')
  , inter = require( __dirname + '/../index' );

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
      pth = inter.view.lookup(path);
    var prtl = jade.compile( fs.readFileSync( pth ) );
    options = options || {};
    options.t = req.i18n.t;
    return prtl( options );
  }

  next();

};