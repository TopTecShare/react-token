const apiKey = process.env.COMPLYCUBE_API_KEY || "";
const { ComplyCube } = require("@complycube/api");
const { create } = require("ipfs-http-client");
const Web3 = require("web3");

const complycube = new ComplyCube({ apiKey: apiKey });

const controller = {
  index: async (req, res, next) => {
    res.json({"name":"personal identity token", "version":"v1"});
  },

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
        email: req.query.email,
        personDetails: {
          firstName: req.query.firstName,
          lastName: req.query.lastName
        }
      });

      /*
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
      */

      const cid = await uploadToIPFS(client.id);

      res.json({"data": Web3.utils.toHex(cid)});
    } catch (error) {
      // Passes errors into the error handler
      return next(error)
    }
  },
};

const uploadToIPFS = async (data) => {
  const file = JSON.stringify({data: data, version: "v1"});
  const client = create(new URL('https://ipfs.infura.io:5001/api/v0'));
  const cid = await client.add(file);

  return cid.path;
}

module.exports = controller;
