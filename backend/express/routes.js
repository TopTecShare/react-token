const controller = require('./controller');

module.exports = function(app) {
  app.route('/').get(controller.index);
  app.route('/get/:clientId').get(controller.get);
  app.route('/create').get(controller.create);
  app.route('/check').get(controller.check);
  app.route('/cancel').get(controller.cancel);
};
