module.exports = {
  response : function(req, res, template, data) {
    if (req.headers.accept == "application/json") {
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } else {
      res.render(template, data);
    }
  }
};
