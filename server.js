'use strict';

let koa        = require('koa');
let router     = require('koa-router');
let logger     = require('koa-logger');
let bodyParser = require('koa-bodyparser');
let serve      = require('koa-static');
let parse      = require('co-busboy');
let fs         = require('fs');
let path       = require('path');
let tfy        = require('thenify');


let app        = new koa();
app.use(bodyParser());
app.use(logger());
app.use(serve(__dirname + '/public'));

let sticker    = require('./controllers/sticker');
let stickerRouter = new router()
const uploadPath = './public/uploads/';

app.use(function *(next){
  // ignore non-POSTs
  if ('POST' != this.method) return yield next;

  if(this.path == '/upload') {
    let parts = parse(this);
    let part;

    while (part = yield parts) {
      let query_split = part.fieldname.split('-');

      if (query_split.length != 2) this.body("field name is invalid");
      let folder      = query_split[0];
      let stickerName = query_split[1];

      // if directory not exist create one
      if (!fs.existsSync(uploadPath + folder)) {
        fs.mkdirSync(uploadPath + folder);
      }

      let stream = fs.createWriteStream(uploadPath + folder + '/' + stickerName + path.extname(part.filename));
      part.pipe(stream);
      this.body = "uploaded"
    }

  }
  else yield next;
});

stickerRouter.post('/uploadUrl', sticker.getImageUrl);
stickerRouter.get('/', sticker.home);
stickerRouter.post('/', sticker.slack);
stickerRouter.get('/sticker/list', sticker.list);
stickerRouter.get('/sticker/:name', sticker.getStickerByName);
stickerRouter.post('/sticker', sticker.post);

app.use(stickerRouter.routes());

app.listen(3001);

