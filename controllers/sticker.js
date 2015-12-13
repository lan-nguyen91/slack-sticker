'use strict';
let fs = require('fs');
let tfy = require('thenify');
let _   = require('lodash');
let path = require('path');
let request = require('koa-request');

const uploadFolder = __dirname + '/../public/uploads'

module.exports.post = function * (){
  let ctx = this;
  ctx.body = "post";
}

module.exports.saveCollection = function * (){
  let ctx = this;
  let folders = yield getFolders(uploadFolder);
  if(_.includes(folders, ctx.request.body.name)) return yield response(ctx, 200, "Existed");
  else {
   let folder = fs.mkdirSync(uploadFolder + '/' + ctx.request.body.name); 
   if (fs.existsSync(uploadFolder + '/' + ctx.request.body.name)) return yield response(ctx, 200, "Saved");
   else return yield response(ctx, 200, "Fail to save!")
  }
}

module.exports.deleteImage = function * (){
  let ctx = this;
  let folder = ctx.params.collection;
  let sticker = ctx.params.sticker;

  fs.unlinkSync(uploadFolder + '/' + folder + '/' + sticker);
  if (!fs.existsSync(uploadFolder + '/' + folder + '/' + sticker)) return yield response(ctx, 200, "removed");
  else return yield response(ctx, 400, "Fail to remove");
}

module.exports.listCollections = function * (){
  let ctx = this;
  let folders = yield getFolders();
  return yield response(ctx, 200, folders);
}

module.exports.listStickers = function * (){
  let ctx = this;
  let files = yield getAllFiles(ctx.params.collection);
  return yield response(ctx, 200, files);
}

function * getFolders(){
  let folders = yield tfy(fs.readdir)(uploadFolder);
  return folders;
}

function * getAllFiles(folder){
  let files = yield tfy(fs.readdir)(uploadFolder + "/" + folder);
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
  let files       = yield tfy(fs.readdir)(uploadFolder);
  let query_split = name.split('-');

  if (query_split.length !== 2) return yield response(ctx, 400, "your spelling sux bro !!!");
  let folder      = query_split[0];
  let stickerName = query_split[1];

  if (!_.includes(yield getFolders(), folder)) return yield response(ctx, 400, "your spelling sux bro !!! ");
  let imageFile = yield checkFileExist(yield getAllFiles(folder), stickerName );

  if (imageFile) return yield response(ctx, 200, folder + '/' + imageFile);
  else return yield response(ctx, 400, "your spelling sux bro !!! ");
}

module.exports.getImageUrl = function * (){
  let ctx  = this;
  let uri  = ctx.request.body.uri;
  let name = ctx.request.body.name;

  let res = yield request({
    uri : uri,
    encoding: 'binary',
    method : "GET"
  });

  if (res.body) {
    let query_split = name.split('-');

    if (query_split.length !== 2) return yield response(ctx, 400, "your spelling sux bro !!!");
    let folder      = query_split[0];
    let stickerName = query_split[1];

    let type = res.headers['content-type'].split('/')[1];
    if (!_.includes(['png', 'jpg', 'jpeg', 'gif'], type.toLowerCase()))
      return yield response(ctx, 400, "Invalid Type");
    // if not exist, create the folder
    if (!fs.existsSync(uploadFolder + '/' + folder)) {
      fs.mkdirSync(uploadFolder + '/' + folder);
    }
   
    let fileDestination = uploadFolder + '/' + folder + '/' + stickerName + '.' + type;
    //write binary to file
    yield tfy(fs.writeFile)(fileDestination, res.body, 'binary');
    if (fs.existsSync(fileDestination)) return yield response(ctx, 200, "Saved");
    else return yield response(ctx, 400, "Fail To Save");
  }
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
  if (body.token !== "lY27avweu62Cz8WWuEAkj4pa") return yield response(this, 400, "Intruder Go Away");
  else return yield getSticker(this, body.text);
}

let response = function *(ctx, status, data){
  let body = ctx.request.body || null;
  if (status == 200) {
    ctx.status = status;
    let type   = path.extname(data) || 'none';
    if (type == 'none' || _.isArray(data)) {
      ctx.type = type;
      ctx.body = {
        text : data,
      }
    } else {
      ctx.type   = 'application/json';
      // construct a request
      let options = {
        response_type : "in_channel",
        attachments : [{
          title     : data,
          image_url : "http://ec2-54-233-93-42.sa-east-1.compute.amazonaws.com:3001/uploads/" + data
        }]
      }

      // send response to response _url web hook
      let response = yield request({
        uri           : body.response_url,
        json          : options,
        method        : "POST"
      });

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
