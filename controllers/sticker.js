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
    extension = path.extname(file) || null;
    basename  = path.basename(file, extension) || null;

    if (targetFile === basename ) {
      fileFound = file; 
      return;
    }
  });
  return fileFound;
}
module.exports.getStickerByName = function * (){
  let ctx         = this;
  let files       = yield tfy(fs.readdir)('./uploads');
  let query_split = ctx.params.name.split('-'); 
  let folder      = query_split[0]; 
  let stickerName = query_split[1];

  if (!_.includes(yield getFolders(), folder)) return yield response(ctx, 400, null, "your spelling sux bro !!! ");
  let imageFile = yield checkFileExist(yield getAllFiles(folder), stickerName );

  if (imageFile) return yield response(ctx, 200, folder + '/' + imageFile);
  else return yield response(ctx, 400, "your spelling sux bro !!! ");
}

module.exports.home = function *(){
  return yield response(this, 200, "home page");
}
module.exports.slack = function *(){
  console.log(this.request.body);
  return yield response(this, 200, "home page");
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
