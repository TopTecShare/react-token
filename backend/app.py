import os
import yaml
import logging
from complycube import ComplyCubeClient

from quart import Quart, render_template, websocket

CONFIG_LOC = '~/.personal-identity-token-config'


logging.basicConfig(
    format='[%(asctime)s] %(levelname)s: %(message)s',
    filename='logs.log',
    encoding='utf-8',
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

cc = ComplyCubeClient(api_key=CONFIG['CC_API_KEY'])

app = Quart(__name__)


@app.route("/")
async def hello():
    return await render_template("index.html")


@app.route("/api")
async def json():
    return {"hello": "world"}


@app.websocket("/ws")
async def ws():
    while True:
        await websocket.send("hello")
        await websocket.send_json({"hello": "world"})


if __name__ == "__main__":
    app.run()
