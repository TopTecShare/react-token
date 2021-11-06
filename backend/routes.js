const controller = require('./controller');

module.exports = function(app) {
  app.route('/get/:clientId').get(controller.get);
  app.route('/create/:firstName/:lastName/:email').get(controller.create);
};
