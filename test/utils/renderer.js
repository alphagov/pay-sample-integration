const nunjucks = require('nunjucks')
const environment = nunjucks.configure([
  './app/views',
  './govuk_modules/govuk_template/views/layouts'
], {
  trimBlocks: true, // automatically remove trailing newlines from a block/tag
  lstripBlocks: true // automatically remove leading whitespace from a block/tag
})

module.exports = {
  renderer : function (templateName, templateData, callback) {
    var fullTemplateName = templateName + '.njk'
    var htmlOutput = environment.render(fullTemplateName, templateData)
    callback(htmlOutput);
  }
};
