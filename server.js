'use strict';

let koa        = require('koa');
let router     = require('koa-router');
let bodyParser = require('koa-bodyParser');

let app        = new koa();
let sticker    = require('./controllers/sticker');
let stickerRouter = new router()

app.use(bodyParser());

stickerRouter.get('/', sticker.home);
stickerRouter.post('/', sticker.slack);
stickerRouter.get('/sticker/list', sticker.list);
stickerRouter.get('/sticker/:name', sticker.getStickerByName);
stickerRouter.post('/sticker', sticker.post);

app.use(stickerRouter.routes());

app.listen(3001);

