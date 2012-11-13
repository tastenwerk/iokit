
/**
 * the File model
 * is meant to help organizing
 * files and categorize them
 */

var konter = require('konter');

var FileSchema = konter.mongoose.Schema({ 
  description: {type: konter.mongoose.Schema.Types.Mixed, default: { default: '' } },
  copyright: {type: konter.mongoose.Schema.Types.Mixed, default: { default: '' } },
  relativePath: {type: String, index: { unique: true }},
  fileSize: Number,
  contentType: String
})
FileSchema.plugin( konter.plugin );
var File = konter.mongoose.model( 'File', FileSchema );

module.exports = exports = File;