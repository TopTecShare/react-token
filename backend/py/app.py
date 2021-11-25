import json
import os
import yaml
import logging
import complycube
import ipfshttpclient
import py_eth_sig_utils as pesu

from quart import Quart, request, jsonify

CONFIG_LOC = '.personal-identity-token-config'


logging.basicConfig(
    format=r'[%(asctime)s] %(levelname)s: %(message)s',
    filename='logs.log',
    level=logging.DEBUG
)

logger = logging.getLogger('backend.app')


def get_api_config():
    if not os.path.exists(CONFIG_LOC):
        raise FileNotFoundError(
            f'You need to create a server-side config file: `{CONFIG_LOC!r}`\n'
            'This will be in YAML format and contain the following:\n'
            '    CC_API_KEY: YourApiKey\n'
            '    NFT_MANAGER_ADDRESS: NftManagerAddress\n',
        )

    with open(CONFIG_LOC, "r") as stream:
        config = yaml.safe_load(stream)
    return config


CONFIG = get_api_config()

cc_api = complycube.ComplyCubeClient(api_key=CONFIG['CC_API_KEY'])

app = Quart(__name__)


class BadAPIRequestError(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv


@app.errorhandler(BadAPIRequestError)
async def bad_request(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


@app.route('/createClient', methods=['GET'])
async def create_client():
    """
    Creates a client and returns their ID for ComplyCube
    """
    required_fields = ['firstName', 'lastName', 'email']
    missing_fields = [request.args.get(field) for field in required_fields if field is None]

    logger.info(f'{request.path}: Received the client form-data:\n'
                f'{json.dumps(request.args, sort_keys=True, indent=2)}')
    if missing_fields:
        error_msg = f'The following required fields are missing from the request: {missing_fields}'
        logger.info(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})

    new_client = {
        'type': 'person',
        'email': request.args.get('email'),
        'personDetails': {
            'firstName': request.args.get('firstName'),
            'lastName': request.args.get('lastName'),
        }
    }

    try:
        result = cc_api.clients.create(**new_client).to_dict()
        logger.info(f'Created client:\n{json.dumps(result, sort_keys=True, indent=2)}')
    except complycube.error.ComplyCubeAPIError as error_msg:
        logger.error(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})
    return jsonify(result)


@app.route('/createCheck', methods=['GET'])
async def create_check():
    """
    Creates a check with ComplyCube
    """
    required_fields = ['id', 'checkType']
    missing_fields = [request.args.get(field) for field in required_fields if field is None]

    logger.info(f'{request.path}: Received the client form-data:\n'
                f'{json.dumps(request.args, sort_keys=True, indent=2)}')
    if missing_fields:
        error_msg = f'The following required fields are missing from the request: {missing_fields}'
        logger.info(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})

    try:
        result = cc_api.checks.create(request.args['id'], type=request.args['checkType']).to_dict()
        logger.info(f'Created check:\n{json.dumps(result, sort_keys=True, indent=2)}')
    except complycube.error.ComplyCubeAPIError as error_msg:
        logger.error(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})
    return jsonify(result)


@app.route('/checkId', methods=['GET'])
async def check_id():
    """
    Gets the result of the check from the corresponding ID provided to ComplyCube
    """
    client_id = request.args.get('clientId', None)
    if client_id is None:
        error_msg = 'No `clientId` found in GET data'
        logger.info(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})

    try:
        result = await cc_api.checks.get(client_id)
        logger.info(f'Recieved data for `client_id={client_id}`:\n{json.dumps(result, sort_keys=True, indent=2)}')
    except complycube.error.ComplyCubeAPIError as error_msg:
        logger.error(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})
    return jsonify(result)


@app.route('/uploadIdIHFS', methods=['GET'])
async def upload_id_to_ihfs():
    """
    uploads the client data to IHFS
    """
    required_fields = ['json_data', 'wallet_address']
    missing_fields = [request.args.get(field) for field in required_fields if field is None]

    if missing_fields:
        error_msg = f'The following required fields are missing from the request: {missing_fields}'
        logger.info(error_msg)
        raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})

    try:
        ipfs_hash = ipfshttpclient.connect().add(request.args.get('json_data'))
        jsonify({'success': ipfs_hash})
    except Exception as err:
        return jsonify({'error': str(err)})


if __name__ == "__main__":
    app.run(debug=True)
