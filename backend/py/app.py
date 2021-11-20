import json
import os
import yaml
import logging
import complycube

from quart import Quart, request, jsonify, render_template_string

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


@app.route('/')
@app.route('/checkId', methods=['GET', 'POST'])
async def check_id():
    if request.method == 'GET':
        logger.info('Recieved GET-Request')
        return """
               <form method='POST'>
                <input type='text' name='clientId' id='clientId' placeholder='Input ComplyCubeId Here'></input>
                <input type='submit' name='submit'></input>
               </form>
               """
    elif request.method == 'POST':
        logger.info('Recieved POST-Request')
        client_id = (await request.form).get('clientId', None)
        if client_id is None:
            error_msg = 'No `clientId` found in POST data'
            logger.info(error_msg)
            raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})

        try:
            result = await cc_api.checks.get(client_id)
            logger.info(f'Recieved data for `client_id={client_id}`:\n{json.dumps(result, sort_keys=True, indent=2)}')
        except complycube.error.ComplyCubeAPIError as error_msg:
            logger.error(error_msg)
            raise BadAPIRequestError(str(error_msg), payload={'endpoint': request.path})
        return jsonify(result)


@app.errorhandler(BadAPIRequestError)
async def bad_request(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


if __name__ == "__main__":
    app.run(debug=True)
