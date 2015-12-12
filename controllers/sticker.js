'use strict';
let fs = require('fs');
let tfy = require('thenify');
let _   = require('lodash');
let path = require('path');

module.exports.post = function * (){
  let ctx = this;
  ctx.body = "post";
}

module.exports.list = function * (){
  let ctx = this;
  ctx.body = "list";
  let files = yield tfy(fs.readdir)('./uploads');
  return yield response(ctx, 200, null, files);
}

function * getFolders(){
  let folders = yield tfy(fs.readdir)('./uploads');
  return folders;
}

function * getAllFiles(folder){
  let files = yield tfy(fs.readdir)('./uploads/' + folder);
  return files;
}

function * checkFileExist(arrayOfFiles, targetFile) {
  let basename, extension, fileFound = false;
  _.each(arrayOfFiles, function(file){
    extension = path.extname(file) || "";
    basename  = path.basename(file, extension) || null;

    if (targetFile === basename ) {
      fileFound = file; 
      return;
    }
  });
  return fileFound;
}

function * getSticker(ctx, name){
  let files       = yield tfy(fs.readdir)('./uploads');
  let query_split = name.split('-'); 
  
  if (query_split.length !== 2) return yield response(ctx, 400, "your spelling sux bro !!!");
  let folder      = query_split[0]; 
  let stickerName = query_split[1];

  if (!_.includes(yield getFolders(), folder)) return yield response(ctx, 400, "your spelling sux bro !!! ");
  let imageFile = yield checkFileExist(yield getAllFiles(folder), stickerName );

  if (imageFile) return yield response(ctx, 200, folder + '/' + imageFile);
  else return yield response(ctx, 400, "your spelling sux bro !!! ");
}

module.exports.getStickerByName = function * (){
  let ctx = this;
  yield getSticker(ctx, ctx.params.name);
}

module.exports.home = function *(){
  return yield response(this, 200, "home page");
}
module.exports.slack = function *(){
  /*{ token: 'lY27avweu62Cz8WWuEAkj4pa',
  team_id: 'T02TG4M2T',
  team_domain: 'gohart',
  channel_id: 'D0B9K9DGX',
  channel_name: 'directmessage',
  user_id: 'U0B9PA14Z',
  user_name: 'lan.nguyen',
  command: '/sticker',
  text: 'test',
  response_url: 'https://hooks.slack.com/commands/T02TG4M2T/16547085697/5OVozJWlHTJIVMWlZRFoDDjc' }*/
  let body = this.request.body;
  console.log(body.token);
  if (body.token !== "lY27avweu62Cz8WWuEAkj4pa") return yield response(this, 400, "Intruder Go Away");
  else return yield getSticker(this, body.text);
}

let response = function *(ctx, status, data){
  if (status == 200) {
    ctx.status = status;
    let type   = path.extname(data) || 'application/json';
    if (type == 'application/json') {
      ctx.type = type;
      ctx.body = {
        text : data,
        attachments : []
      }
    } else {
      ctx.type = type;
      ctx.body   = fs.createReadStream('./uploads/' + data); 
    }
  } else {
    ctx.type   = 'application/json';
    ctx.status = status;
    ctx.body   = {
      text : data,
      attachments : []
    }
  }
}
