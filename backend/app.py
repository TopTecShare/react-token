from quart import Quart, render_template, websocket

import logging

logging.basicConfig(
    format='[%(asctime)s] %(levelname)s: %(message)s',
    filename='logs.log',
    encoding='utf-8',
    level=logging.DEBUG
)

logger = logging.getLogger('backend.app')


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
