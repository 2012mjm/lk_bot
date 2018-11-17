const fs = require('fs')
const moment = require('moment')
const Hashids = require("hashids")

exports.filterLoad = (nohm) => {
  let value = {id: nohm.id}
  Object.keys(nohm.properties).map((key) => {
    value[key] = nohm.properties[key].value;
  })
  return value
}

exports.isEmoji = (str) => {
  return str.replace(/\s/g, '').split('').map(function (value) {
    if(!value.match(/([\uD800-\uDBFF]|[\uDC00-\uDFFF]|[\u2000-\u3000]|[\uE000-\uFFFF])/g)) {
      return false;
    }
    return true;
  }).indexOf(false) === -1;
}

exports.splitLKT = (str, length=4096) => {
  let list = []
  str.split('[BP]').forEach(breakStr => {
    for(let i=0; i<breakStr.length; i+=length) {
      list.push(breakStr.substr(i, length))
    }
  })
  return list
}

exports.toUnicode = (str) => {
  return str.split('').map((value) => {
    let temp = value.charCodeAt(0).toString(16).toUpperCase();
    if (temp.length > 2) {
      return '\\u' + temp;
    }
    return value;
  }).join('');
}

exports.randId = (length=8) => {
  let text = ""
  const possible = "0123456789"
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

exports.textTruncate = (str, length=100, ending='...') => {
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  }
  return str;
}

exports.encrypt = (value, key='likeKingPost') => {
  const hashids = new Hashids(key, 5, 'abcdefghijklmnopqrstuvwxyz0123456789')
  return hashids.encode(value)
}

exports.decrypt = (value, key='likeKingPost') => {
  const hashids = new Hashids(key, 5, 'abcdefghijklmnopqrstuvwxyz0123456789')
  return hashids.decode(value)[0]
}

exports.paginationFilterList = (list, page=1, limit=20, sort='ASC') =>
{
  if(sort === 'DESC') {
    list = list.reverse()
  }

  let newList = []
  const firstIndex = (limit * (page - 1))
  for (let index = (limit * (page - 1)); index < limit + firstIndex; index++) {
    if(list[index] !== undefined) {
      newList.push(list[index])
    }
  }

  return newList
}

exports.paginationInlineKeyboard = (count, limit=20, perfixCallback='', currentPage=1) => {
  const pageCount = Math.ceil(count / limit)

  if(pageCount <= 1) {
    return null
  }

  let pagination = []
  for(let page=1; page<=pageCount; page++) {
    pagination.push({
      text: page.toString(),
      callback_data: perfixCallback + page
    })
  }

  let finalPagination = []
  if(pagination.length > 5) {
    finalPagination[0] = pagination[0]
    finalPagination[4] = pagination[pagination.length-1]

    firstPage = 1
    endPage   = pagination.length
    lastPage  = currentPage-1
    nextPage  = currentPage+1

    if(currentPage === firstPage || currentPage === firstPage+1 || currentPage === firstPage+2) {
      finalPagination[1] = pagination[firstPage]
      finalPagination[2] = pagination[firstPage+1]
      finalPagination[3] = pagination[firstPage+2]
      finalPagination[3].text += ' ...'
      finalPagination[currentPage-1].text = `[ ${finalPagination[currentPage-1].text} ]`
    }
    else if(currentPage === endPage || currentPage === endPage-1 || currentPage === endPage-2) {
      finalPagination[1] = pagination[endPage-4]
      finalPagination[1].text = '... '+finalPagination[1].text
      finalPagination[2] = pagination[endPage-3]
      finalPagination[3] = pagination[endPage-2]
      finalPagination[(4-(endPage-currentPage))].text = `[ ${finalPagination[(4-(endPage-currentPage))].text} ]`
    }
    else {
      finalPagination[1] = pagination[currentPage-2]
      finalPagination[1].text = '... '+finalPagination[1].text
      finalPagination[2] = pagination[currentPage-1]
      finalPagination[2].text = `[ ${finalPagination[2].text} ]`
      finalPagination[3] = pagination[currentPage]
      finalPagination[3].text += ' ...'
    }
  } else {
    finalPagination = pagination
    finalPagination[currentPage-1].text = `[ ${finalPagination[currentPage-1].text} ]`
  }

  return [finalPagination]
}

const pager = (count, perfixCallback='', currentPage=1) => {
  let pagination = []
  for(let page=1; page<=count; page++) {
    pagination.push({
      text: page.toString(),
      callback_data: perfixCallback + page
    })
  }

  let finalPagination = []
  if(pagination.length > 5) {
    finalPagination[0] = pagination[0]
    finalPagination[4] = pagination[pagination.length-1]

    firstPage = 1
    endPage   = pagination.length
    lastPage  = currentPage-1
    nextPage  = currentPage+1

    if(currentPage === firstPage || currentPage === firstPage+1 || currentPage === firstPage+2) {
      finalPagination[1] = pagination[firstPage]
      finalPagination[2] = pagination[firstPage+1]
      finalPagination[3] = pagination[firstPage+2]
      finalPagination[3].text += ' ...'
      finalPagination[currentPage-1].text = `[ ${finalPagination[currentPage-1].text} ]`
    }
    else if(currentPage === endPage || currentPage === endPage-1 || currentPage === endPage-2) {
      finalPagination[1] = pagination[endPage-4]
      finalPagination[1].text = '... '+finalPagination[1].text
      finalPagination[2] = pagination[endPage-3]
      finalPagination[3] = pagination[endPage-2]
      finalPagination[(4-(endPage-currentPage))].text = `[ ${finalPagination[(4-(endPage-currentPage))].text} ]`
    }
    else {
      finalPagination[1] = pagination[currentPage-2]
      finalPagination[1].text = '... '+finalPagination[1].text
      finalPagination[2] = pagination[currentPage-1]
      finalPagination[2].text = `[ ${finalPagination[2].text} ]`
      finalPagination[3] = pagination[currentPage]
      finalPagination[3].text += ' ...'
    }
  } else {
    finalPagination = pagination
    finalPagination[currentPage-1].text = `[ ${finalPagination[currentPage-1].text} ]`
  }

  return finalPagination
}
exports.pager = pager

exports.editPostMessage = (bot, post, newInlineMessageId=null) => {
  return new Promise((resolve, reject) => {
    PostService.addAndGetPublishUpdate(post.model, newInlineMessageId).then(publish =>
    {
      bot.editMessageReplyMarkup({inline_keyboard: PostService.generateInlineKeyboard(post.data, true)}, {
        message_id: publish.publishSelfUpdate.message_id,
        chat_id: publish.publishSelfUpdate.chat_id
      }).then(() =>
      {
        publish.publishUpdate.forEach(inlineMessageId => {
          bot.editMessageReplyMarkup({inline_keyboard: PostService.generateInlineKeyboard(post.data)}, {
            inline_message_id: inlineMessageId,
          }).then(() => {}).catch(() => {})
        })
      }, reject)
    })
  })
}


const PostService = require('./services/PostService')

exports.sendPostMessage = (bot, chatId, result) => {
  return new Promise((resolve, reject) =>
  {
    if (result.params.caption !== undefined) {
      result.options.caption = result.params.caption
    }

    switch (result.type) {
      case 'text':
        if(Array.isArray(result.params.text)) {
          result.options.reply_markup.inline_keyboard.unshift(pager(result.params.text.length, `post${result.id}_pager`, 1))
          result.params.text = result.params.text[0]
        }
        bot.sendMessage(chatId, result.params.text, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'photo':
        bot.sendPhoto(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'audio':
        bot.sendAudio(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'video':
        bot.sendVideo(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'document':
        bot.sendDocument(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'sticker':
        bot.sendSticker(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'voice':
        bot.sendVoice(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'video_note':
        bot.sendVideoNote(chatId, result.params.file_id, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'location':
        bot.sendLocation(chatId, result.params.latitude, result.params.longitude, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
      case 'contact':
        if (result.params.last_name !== undefined) result.options.last_name = result.params.last_name
        bot.sendContact(chatId, result.params.phone_number, result.params.first_name, result.options).then((res) => {
          if(result.postModel !== null) PostService.update(result.postModel, {publishSelfUpdate: {message_id: res.message_id, chat_id: res.chat.id}})
          return resolve(res)
        }, reject)
        break
    }
  })
}

exports.logError = (e, user, cm) => {
  let message = `${moment().format('YYYY-MM-DD HH:mm:ss')}\n`
  message += `#${user.data.id} - ${user.data.name} ${(user.data.username !== '') ? '( @' + user.data.username + ' )' : ''}\n`
  message += `CM: ${cm}\n`
  message += `${e.code}\n`
  message += `${e.response.body.error_code}\n`
  message += `${e.response.body.description}\n\n\n`
  fs.appendFileSync('error.log', message)
}
