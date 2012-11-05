var defaultsPlugin = {

  middleware: function( app ){

    /**
     * set defaults middleware. This enables the defaults indexed array
     * to be used inside views
     */
    setDefaults: function setDefaults( req, res, next ){
      ecp.defaults.version = ecp.version;
      res.locals.ecp = { defaults: ecp.defaults };
      next();
    }

  }

}

module.exports = exports = defaultsPlugin;