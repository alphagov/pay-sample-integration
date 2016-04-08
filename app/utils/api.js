module.exports = {
  getKey: function() {
    return process.env.PAY_API_KEY;
  },
  
  getUrl: function() {
    return process.env.PAY_API_URL;
  }
};
