module.exports = {
  getKey: function(req) {
    return process.env.PAY_API_KEY;
  },
  
  getUrl: function(req) {
    return process.env.PAY_API_URL;
  }
};
