const apiKey = process.env.COMPLYCUBE_API_KEY || "";
const { ComplyCube } = require("@complycube/api");

const complycube = new ComplyCube({ apiKey: apiKey });

const controller = {
  get: async (req, res, next) => {
    try {
      const checkResponse = await complycube.check.create(req.params.clientId, {
        type: "extensive_screening_check"
      });
      const check = await complycube.check.get(checkResponse.id);

      res.json(check);
    } catch (error) {
      return next(error)
    }
  },

  create: async (req, res, next) => {
    try {
      const client = await complycube.client.create({
        type: "person",
        email: req.params.email,
        personDetails: {
          firstName: req.params.firstName,
          lastName: req.params.lastName
        }
      });

      console.log("clientId", client.id)

      const session = await complycube.flow.createSession(client.id, {
        checkTypes: [
          "standard_screening_check",
          "identity_check",
          "document_check"
        ],
        successUrl: "http://localhost:8080/get/"+client.id,
        cancelUrl: "http://localhost:8080/cancel",
        theme: "light"
      });

      res.json(session);
    } catch (error) {
      // Passes errors into the error handler
      return next(error)
    }
  },
};

module.exports = controller;
