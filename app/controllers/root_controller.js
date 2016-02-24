module.exports.bindRoutesTo = (app) => {
  app.get('/', (req, res) => {
    res.redirect(303, '/proceed');
  });
}