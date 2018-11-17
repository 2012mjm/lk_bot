PostService = () => {}
module.exports = PostService

const nohm = require('nohm').Nohm
const config = require('../config/index')
const request = require('request')
const {filterLoad, isEmoji, paginationFilterList, paginationInlineKeyboard, splitLKT, pager, encrypt, decrypt} = require('../helper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const UserService = require('./UserService')
const LikeService = require('./LikeService')
const ChallengeService = require('./ChallengeService')

const Post = require('../models/Post')

PostService.create = (msg, user) => {
  return new Promise((resolve, reject) => {
    let post = new Post();
    let postData = {
      status: 'draft',
      userId: user.id,
      allowSeeUsers: 0,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    if(msg.text !== undefined) {
      postData.params = {text: msg.text}
      postData.type = 'text'
    }
    else if(msg.photo !== undefined) {
      postData.params = {file_id: msg.photo[0].file_id}
      postData.type = 'photo'
    }
    else if(msg.document !== undefined) {
      postData.params = {file_id: msg.document.file_id}
      postData.type = 'document'
    }
    else if(msg.video !== undefined) {
      postData.params = {file_id: msg.video.file_id}
      postData.type = 'video'
    }
    else if(msg.voice !== undefined) {
      postData.params = {file_id: msg.voice.file_id}
      postData.type = 'voice'
    }
    else if(msg.audio !== undefined) {
      postData.params = {file_id: msg.audio.file_id}
      postData.type = 'audio'
    }
    else if(msg.sticker !== undefined) {
      postData.params = {file_id: msg.sticker.file_id}
      postData.type = 'sticker'
    }
    else if(msg.video_note !== undefined) {
      postData.params = {file_id: msg.video_note.file_id}
      postData.type = 'video_note'
    }
    else if(msg.location !== undefined) {
      postData.params = {latitude: msg.location.latitude, longitude: msg.location.longitude}
      postData.type = 'location'
    }
    else if(msg.contact !== undefined) {
      postData.params = {phone_number: msg.contact.phone_number, first_name: msg.contact.first_name}

      if(msg.contact.last_name !== undefined) {
        postData.params.last_name = msg.contact.last_name
      }

      postData.type = 'contact'
    }
    else {
      return reject()
    }

    if(msg.caption !== undefined) {
      postData.params.caption = msg.caption
    }

    post.p(postData)
    post.save((err) => {
      if(err) return reject(post.errors)

      return resolve({data: filterLoad(post), model: post})
    })
  })
}

PostService.createForChallenge = (msg, user, challengeId, challengeOwnerId, challengeSelfNum) => {
  return new Promise((resolve, reject) => {
    let post = new Post();
    let postData = {
      status: 'showing',
      userId: user.id,
      allowSeeUsers: 0,
      challengeId: challengeId,
      challengeOwnerId: challengeOwnerId,
      likeText1: '❤️',
      hasLike: 1,
      challengeSelfNum: challengeSelfNum,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    if(msg.text !== undefined) {
      postData.params = {text: msg.text}
      postData.type = 'text'
    }
    else if(msg.photo !== undefined) {
      postData.params = {file_id: msg.photo[0].file_id}
      postData.type = 'photo'
    }
    else if(msg.document !== undefined) {
      postData.params = {file_id: msg.document.file_id}
      postData.type = 'document'
    }
    else if(msg.video !== undefined) {
      postData.params = {file_id: msg.video.file_id}
      postData.type = 'video'
    }
    else if(msg.voice !== undefined) {
      postData.params = {file_id: msg.voice.file_id}
      postData.type = 'voice'
    }
    else if(msg.audio !== undefined) {
      postData.params = {file_id: msg.audio.file_id}
      postData.type = 'audio'
    }
    else if(msg.sticker !== undefined) {
      postData.params = {file_id: msg.sticker.file_id}
      postData.type = 'sticker'
    }
    else if(msg.video_note !== undefined) {
      postData.params = {file_id: msg.video_note.file_id}
      postData.type = 'video_note'
    }
    else if(msg.location !== undefined) {
      postData.params = {latitude: msg.location.latitude, longitude: msg.location.longitude}
      postData.type = 'location'
    }
    else if(msg.contact !== undefined) {
      postData.params = {phone_number: msg.contact.phone_number, first_name: msg.contact.first_name}

      if(msg.contact.last_name !== undefined) {
        postData.params.last_name = msg.contact.last_name
      }

      postData.type = 'contact'
    }
    else {
      return reject()
    }

    post.p(postData)
    post.save((err) => {
      if(err) return reject(post.errors)
      return resolve({data: filterLoad(post), model: post})
    })
  })
}

PostService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const post = nohm.factory('Post', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(post), model: post})
    })
  })
}

PostService.findByIdAndUserId = (id, userId) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(id).then(post => {
      if(post.data.userId === parseInt(userId)) {
        return resolve(post)
      }
      return reject()
    }, reject)
  })
}

PostService.updateDetails = (model, likeList=null, hasComment=false, hasOrder=false) => {
  return new Promise((resolve, reject) =>
  {
    model.p('status', 'showing')
    model.p('hasComment', (hasComment) ? 1 : 0)
    model.p('hasLike', (likeList !== null && likeList.length > 0) ? 1 : 0)
    model.p('hasOrder', (hasOrder) ? 1 : 0)

    if(likeList !== null && likeList.length > 0) {
      likeList.forEach((emoji, number) => {
        model.p(`likeText${number+1}`, emoji.text)
      })
    }

    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.update = (model, newAttr) => {
  return new Promise((resolve, reject) =>
  {
    model.p(newAttr)
    model.save((err) => {
      if(err) return reject(err)

      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.setAllowSeeUsers = (post, user) => {
  return new Promise((resolve, reject) =>
  {
    if(post.data.allowSeeUsers === 1) return resolve(post)

    UserService.decreaseCharge(user).then(userUpdated => {
      PostService.update(post.model, {allowSeeUsers: 1}).then(resolve, reject)
    })
  })
}

PostService.keyboardCreate = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_post')
    resolve({message: config.message.send_post})
  })
}

PostService.keyboardCreateWithLikeAndCommentAndOrder = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_post_like_comment_order')
    resolve({message: config.message.send_emoji})
  })
}

PostService.keyboardCreateWithLikeAndComment = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_post_like_comment')
    resolve({message: config.message.send_emoji})
  })
}

PostService.keyboardCreateWithLikeAndOrder = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_post_like_order')
    resolve({message: config.message.send_emoji})
  })
}

PostService.keyboardCreateWithLike = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_post_like')
    resolve({message: config.message.send_emoji})
  })
}

PostService.receiveContext = (bot, user, msg) => {
  return new Promise((resolve, reject) =>
  {
    UserService.updateState(user.model, 'receive_post_context')

    if(msg.document !== undefined && msg.document.file_name.split('.').pop() === 'lkt') {
      bot.getFileLink(msg.document.file_id).then(link => {
        request.get(link, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            msg.text = splitLKT(body)
            msg.document = undefined
            PostService.create(msg, user.data).then(res => {
              UserService.update(user.model, {draftPostId: res.data.id})
              return resolve({message: config.message.select_one_item_under, options: config.keyboard.createPostOptions})
            }, (err) => {
              return reject({message: config.message.problem_call_support})
            })
          } else {
            return reject()
          }
        })
      })
    } else {
      PostService.create(msg, user.data).then(res => {
        UserService.update(user.model, {draftPostId: res.data.id})
        return resolve({message: config.message.select_one_item_under, options: config.keyboard.createPostOptions})
      }, (err) => {
        return reject({message: config.message.problem_call_support})
      })
    }
  })
}

PostService.publish = (user, text) => {
  return new Promise((resolve, reject) =>
  {
    let hasComment = false
    let hasLike = false
    let hasOrder = false
    let inlineKeyboard = []

    if(text === config.message.create_post_comment_keyboard) {
      hasComment = true
    }
    else if(text === config.message.create_post_order_keyboard) {
      hasOrder = true
    }
    else if(text === config.message.create_post_comment_order_keyboard) {
      hasOrder = true
      hasComment = true
    }
    else if(user.data.state === 'create_post_like') {
      hasLike = true
    }
    else if(user.data.state === 'create_post_like_comment') {
      hasComment = true
      hasLike = true
    }
    else if(user.data.state === 'create_post_like_order') {
      hasLike = true
      hasOrder = true
    }
    else if(user.data.state === 'create_post_like_comment_order') {
      hasComment = true
      hasLike = true
      hasOrder = true
    }

    if (hasLike && !isEmoji(text)) {
      return reject({message: config.message.just_send_emoji})
    }

    UserService.updateState(user.model, 'create_final')

    let likeList = []
    if(hasLike) {
      text.split(/\s+/g).forEach((item, index) => {
        likeList.push({
          text: item,
          callback_data: `like_p${user.data.draftPostId}_n${index + 1}`
        })
      })
      likeList.splice(6);
      inlineKeyboard.push(likeList)
    }

    if(hasComment) {
      inlineKeyboard.push([{
        text: config.message.want_send_comment_keyboard,
        url: `https://t.me/${config.telegram.bot_name}?start=cm-${user.data.draftPostId}`
      }])
    }

    if(hasOrder) {
      inlineKeyboard.push([{
        text: config.message.want_send_order_keyboard,
        url: `https://t.me/${config.telegram.bot_name}?start=order-${user.data.draftPostId}`
      }])
    }

    inlineKeyboard.push([{
      text: config.message.publish_button_keyboard,
      switch_inline_query: `#${user.data.draftPostId}`
    }])

    const options = {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    }

    PostService.findByIdAndUserId(user.data.draftPostId, user.data.id).then(post =>
    {
      PostService.updateDetails(post.model, likeList, hasComment, hasOrder).then(updatedPost => {
        UserService.update(user.model, {state: null, draftPostId: null})

        if(hasOrder) {
          PostService.setAllowSeeUsers(updatedPost, user).then(() => {}, () => {})
        }

        const params = JSON.parse(updatedPost.data.params)
        if(updatedPost.data.type === 'text' && Array.isArray(params.text)) {
          return reject({
            message: `https://t.me/${config.telegram.bot_name}?start=p${encrypt(updatedPost.data.id)}`
          })
        }

        return resolve({
          id: updatedPost.data.id,
          type: updatedPost.data.type,
          params: params,
          options: options,
          postModel: updatedPost.model,
          message: config.message.finished_create_post
        })
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.problem_call_support})
    })
  })
}

PostService.publishById = (postId, userId) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findByIdAndUserId(postId, userId).then(post =>
    {
      let params = JSON.parse(post.data.params)
      if(post.data.type === 'text' && Array.isArray(params.text)) {
        params.text = params.text[currentPage-1]
      }
      if(post.data.challengeId !== 0) {
        ChallengeService.findById(post.data.challengeId).then(challenge => {
          params.caption = `#${post.data.challengeSelfNum}\n${challenge.data.name}\n\n${challenge.data.description}`
          return resolve({
            type: post.data.type,
            params: params,
            replyMarkup: {inline_keyboard: PostService.generateInlineKeyboard(post.data)},
          })
        })
      } else {
        return resolve({
          type: post.data.type,
          params: params,
          replyMarkup: {inline_keyboard: PostService.generateInlineKeyboard(post.data)},
        })
      }
    }, () => {
      return reject()
    })
  })
}

PostService.publishByIdInBot = (postId, page=1) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(postId).then(post =>
    {
      let params = JSON.parse(post.data.params)
      if(post.data.type === 'text' && Array.isArray(params.text)) {
        params.text = params.text[page-1]
      }

      return resolve({
        id: post.data.id,
        type: post.data.type,
        params: params,
        options: {reply_markup: {inline_keyboard: PostService.generateInlineKeyboardInBot(post.data, page)}},
        postModel: null
      })
    }, () => {
      return reject()
    })
  })
}

PostService.publishByKey = (key) => {
  return new Promise((resolve, reject) => {
    const postId = decrypt(key)
    PostService.publishByIdInBot(postId, 1).then(resolve, reject)
  })
}

PostService.generateInlineKeyboard = (data, withPublishButton=false) => {
  let inlineKeyboard = []

  if(data.hasLike === 1) {
    let likeList = []
    for(let num=1; num<=6; num++) {
      if(data[`likeText${num}`] !== '')
      {
        let likeCount = (data[`likeCount${num}`] !== 0) ? ' '+data[`likeCount${num}`] : ''
        likeList.push({
          text: data[`likeText${num}`]+likeCount,
          callback_data: `like_p${data.id}_n${num}`
        })
      }
    }
    inlineKeyboard.push(likeList)
  }

  if(data.hasComment === 1)
  {
    let commentCount      = (data.commentCount !== 0) ? ` (${data.commentCount} نظر` : ''
    let commentUserCount  = (data.commentUserCount !== 0) ? ` / ${data.commentUserCount} نظردهنده)` : ''

    inlineKeyboard.push([{
      text: config.message.want_send_comment_keyboard+commentCount+commentUserCount,
      url: `https://t.me/${config.telegram.bot_name}?start=cm-${data.id}`
    }])
  }

  if(data.hasOrder === 1)
  {
    inlineKeyboard.push([{
      text: config.message.want_send_order_keyboard,
      url: `https://t.me/${config.telegram.bot_name}?start=order-${data.id}`
    }])
  }

  if(withPublishButton) {
    inlineKeyboard.push([{
      text: config.message.publish_button_keyboard,
      switch_inline_query: `#${data.id}`
    }])
  }

  return inlineKeyboard
}

PostService.generateInlineKeyboardInBot = (data, currentPage=1) => {
  let inlineKeyboard = []

  const params = JSON.parse(data.params)
  if(data.type === 'text' && Array.isArray(params.text)) {
    inlineKeyboard.push(pager(params.text.length, `post${data.id}_pager`, currentPage))
  }

  if(data.hasLike === 1) {
    let likeList = []
    for(let num=1; num<=6; num++) {
      if(data[`likeText${num}`] !== '')
      {
        let likeCount = (data[`likeCount${num}`] !== 0) ? ' '+data[`likeCount${num}`] : ''
        likeList.push({
          text: data[`likeText${num}`]+likeCount,
          callback_data: `like_p${data.id}_n${num}_page${currentPage}`
        })
      }
    }
    inlineKeyboard.push(likeList)
  }

  if(data.hasComment === 1) {
    let commentCount      = (data.commentCount !== 0) ? ` (${data.commentCount} نظر` : ''
    let commentUserCount  = (data.commentUserCount !== 0) ? ` / ${data.commentUserCount} نظردهنده)` : ''

    inlineKeyboard.push([{
      text: config.message.want_send_comment_keyboard+commentCount+commentUserCount,
      callback_data: `comment_p${data.id}`
    }])
  }

  if(data.hasOrder === 1) {
    inlineKeyboard.push([{
      text: config.message.want_send_order_keyboard,
      callback_data: `order_p${data.id}`
    }])
  }

  return inlineKeyboard
}

PostService.increaseLike = (model, number) => {
  return new Promise((resolve, reject) => {
    model.p(`likeCount${number}`, model.properties[`likeCount${number}`].value+1)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.decreaseLike = (model, number) => {
  return new Promise((resolve, reject) => {
    model.p(`likeCount${number}`, model.properties[`likeCount${number}`].value-1)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.increaseComment = (model, increaseUserCount=false) => {
  return new Promise((resolve, reject) =>
  {
    if(increaseUserCount) {
      model.p('commentUserCount', model.properties.commentUserCount.value + 1)
    }

    model.p('commentCount', model.properties.commentCount.value+1)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.increaseOrder = (model) => {
  return new Promise((resolve, reject) =>
  {
    model.p('orderCount', model.properties.orderCount.value+1)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PostService.addAndGetPublishUpdate = (model, inlineMessageId=null) => {
  return new Promise((resolve, reject) =>
  {
    const publishSelfUpdate = JSON.parse(model.properties.publishSelfUpdate.value)

    let publishList = []
    const publishUpdate = model.properties.publishUpdate.value
    if(!(publishUpdate === null || publishUpdate === '' || publishUpdate === '0')) {
      publishList = JSON.parse(publishUpdate)
    }

    if(inlineMessageId !== null) {
      let isExist = false
      publishList.forEach(item => {
        if (item === inlineMessageId) isExist = true
      })

      if (!isExist) {
        publishList.push(inlineMessageId)
        model.p('publishUpdate', publishList)
        model.save((err) => {
          if (err) return reject(err)
          return resolve({publishUpdate: publishList, publishSelfUpdate: publishSelfUpdate})
        })
      } else {
        return resolve({publishUpdate: publishList, publishSelfUpdate: publishSelfUpdate})
      }
    }
    else {
      return resolve({publishUpdate: publishList, publishSelfUpdate: publishSelfUpdate})
    }
  })
}

PostService.selfList = (user, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Post.find({userId: user.data.id, status: 'showing', challengeId: 0}, (err, ids) => {
      if(err || ids.length === 0) return reject({message: config.message.dont_give_me_post})

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'self_post_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit, 'DESC')

      let list = []
      let count = 0
      ids.forEach(id => {
        PostService.findById(id).then(post =>
        {
            list.push(post.data)
            count++
            if(count === ids.length) {
              return resolve({message: PostService.filterSelfList(list, page, limit), options: options})
            }
        })
      })
    })
  })
}

PostService.filterSelfList = (list, page=1, limit=10) => {
  const firstNumber = ((page-1)*limit)+1
  let out = ''
  list.forEach((post, index) => {
    out += `💌 ${persianJs((firstNumber+index).toString()).englishNumber().toString()}. `
    out += config.message[`type_${post.type}`]
    out += `\n⌚️ ${persianJs(jMoment(post.createdAt).fromNow()).englishNumber().toString()}\n`
    out += `👓 /post_${post.id}\n`
    out += '\n'
  })
  return out
}

PostService.getListDetails = (ids) => {
  return new Promise((resolve, reject) =>
  {
    let list = []
    let count = 0
    ids.forEach(id => {
      PostService.findById(id).then(post =>
      {
        UserService.findById(post.data.challengeOwnerId).then(user => {
          post.data.user = user.data
          list.push(post.data)
          count++
          if(count === ids.length) {
            return resolve(list)
          }
        })
      })
    })
  })
}

PostService.selfListChallengeParticipant = (userId, challengeId, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Post.find({userId: userId, challengeId: challengeId}, (err, ids) => {
      if(err || ids.length === 0) return resolve({message: 'شرکت کننده ای نداری', options: null})

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'self_post_challenge_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      PostService.getListDetails(ids).then(list => {
        list.sort((a, b) => { return b.likeCount1 - a.likeCount1 })
        list = paginationFilterList(list, page, limit)
        return resolve({message: PostService.filterSelfListChallengeParticipant(list, page, limit), options: options})
      })
    })
  })
}

PostService.filterSelfListChallengeParticipant = (list, page=1, limit=10) => {
  const firstNumber = ((page-1)*limit)+1
  let out = ''
  list.forEach((post, index) => {
    out += `🙎🏻‍♂️ ${persianJs((firstNumber+index).toString()).englishNumber().toString()}. `
    out += `${post.user.name} ${(post.user.username !== '') ? '( @' + post.user.username + ' )' : ''}`
    out += `\n❤️ ${persianJs(post.likeCount1.toString()).englishNumber().toString()} رای\n`
    out += `👓 /post_${post.id}\n`
    out += '\n'
  })
  return out
}

PostService.selfView = (user, postId) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findByIdAndUserId(postId, user.data.id).then(post => {
      let options = {reply_markup: {inline_keyboard: [[]]}}

      if(post.data.hasComment === 1) {
        options.reply_markup.inline_keyboard[0].push({
          text: config.message.who_post_comment_keyboard,
          callback_data: `self_post${post.data.id}_comment`
        })
      }
      if(post.data.hasLike === 1) {
        options.reply_markup.inline_keyboard[0].push({
          text: config.message.who_post_like_keyboard,
          callback_data: `self_post${post.data.id}_like`
        })
      }
      if(post.data.hasOrder === 1) {
        options.reply_markup.inline_keyboard[0].push({
          text: config.message.who_post_order_keyboard,
          callback_data: `self_post${post.data.id}_order`
        })
      }

      options.reply_markup.inline_keyboard.push([{
        text: config.message.publish_button_keyboard,
        switch_inline_query: `#${post.data.id}`
      }])

      if(post.data.challengeId !== 0) {
        ChallengeService.findById(post.data.challengeId).then(challenge => {
          post.data.params = JSON.parse(post.data.params)
          post.data.params.caption = `#${post.data.challengeSelfNum}\n${challenge.data.name}\n\n${challenge.data.description}`
          return resolve({
            id: post.data.id,
            type: post.data.type,
            params: post.data.params,
            options: options,
            postModel: null
          })
        })
      } else {
        return resolve({
          id: post.data.id,
          type: post.data.type,
          params: JSON.parse(post.data.params),
          options: options,
          postModel: null
        })
      }

    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}

PostService.manageListChallengeParticipant = (challengeId, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Post.find({challengeId: challengeId}, (err, ids) => {
      if(err || ids.length === 0) return resolve({message: 'شرکت کننده ای نداری', options: null})

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'self_post_challenge_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      PostService.getListDetails(ids).then(list => {
        list.sort((a, b) => { return b.likeCount1 - a.likeCount1 })
        list = paginationFilterList(list, page, limit)
        return resolve({message: PostService.filterManageListChallengeParticipant(list, page, limit), options: options})
      })
    })
  })
}

PostService.filterManageListChallengeParticipant = (list, page=1, limit=10) => {
  const firstNumber = ((page-1)*limit)+1
  let out = ''
  list.forEach((post, index) => {
    out += `🙎🏻‍♂️ ${persianJs((firstNumber+index).toString()).englishNumber().toString()}. `
    out += `${post.user.name} ${(post.user.username !== '') ? '( @' + post.user.username + ' )' : ''}`
    out += `\n❤️ ${persianJs(post.likeCount1.toString()).englishNumber().toString()} رای\n`
    out += `👓 /admin_post${post.id}\n`
    out += '\n'
  })
  return out
}

PostService.manageCountByUserId = (userId) => {
  return new Promise((resolve) => {
    Post.find({userId: userId}, (err, ids) => {
      if (err) return resolve(0)
      return resolve(ids.length)
    })
  })
}

PostService.manageList = (page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Post.sort({field: 'createdAt', direction: 'DESC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      let options = {parse_mode: 'html'}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'admin_post_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit)

      let list = []
      let count = 0
      ids.forEach(id => {
        PostService.findById(id).then(post =>
        {
          UserService.findById(post.data.userId).then(user => {
            post.data.user = user.data
            list.push(post.data)

            count++
            if(count === ids.length) {
              return resolve({message: PostService.filterManageList(list), options: options})
            }
          }, () => {
            post.data.user = null
            list.push(post.data)

            count++
            if(count === ids.length) {
              return resolve({message: PostService.filterManageList(list), options: options})
            }
          })
        })
      })
    });
  })
}

PostService.filterManageList = (list) => {
  let out = ''
  list.forEach(post => {
    out += `/admin_post${post.id} - ${post.type}\n`
    if(post.user !== null) out += `<a href="tg://user?id=${post.user.tgId}">${post.user.name}</a> ${(post.user.username !== '') ? '( @' + post.user.username + ' )' : ''}\n`
    out += `${moment(post.createdAt).fromNow()}\n`

    if(post.hasLike === 1) {
      for(let i=1; i<=6; i++) {
        if(post[`likeText${i}`] !== '') {
          if(i!==1) out += ' | '
          out += post[`likeText${i}`] + ' ' + post[`likeCount${i}`]
        }
      }
      out += '\n'
    }

    if(post.hasComment === 1) {
      out += `${post.commentCount} Comment | ${post.commentUserCount} User\n`
    }

    out += '\n'
  })
  return out
}

PostService.manageInfo = (postId) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(postId).then(post => {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{
              text: config.message.admin_comment_keyboard,
              callback_data: `admin_post${post.data.id}_comment`
            }, {
              text: config.message.admin_like_keyboard,
              callback_data: `admin_post${post.data.id}_like`
            }],
            [{
              text: config.message.admin_comment_increase_keyboard,
              callback_data: `admin_post${post.data.id}_comment_increase`
            }, {
              text: config.message.admin_like_increase_keyboard,
              callback_data: `admin_post${post.data.id}_like_increase`
            }],
          ]
        }
      }

      return resolve({
        id: post.data.id,
        type: post.data.type,
        params: JSON.parse(post.data.params),
        options: options,
        postModel: null
      })
    }, reject)
  })
}

PostService.manageUpdate = (postId, newAttr) => {
  return new Promise((resolve, reject) => {
    PostService.findById(postId).then(post => {
      PostService.update(post.model, newAttr).then(postUpdated => {
        return resolve({message: config.message.admin_success_updated})
      }, () => {
        return reject({message: config.message.admin_error_updated})
      })
    })
  })
}

PostService.manageIncreaseCommentCount = (user, countIncrease) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(user.data.selectedPostId).then(post =>
    {
      PostService.update(post.model, {commentCount: post.data.commentCount + countIncrease}).then(postUpdated => {
        UserService.updateState(user.model, 'admin_post_comment_user_increase')
        return resolve({message: config.message.admin_success_updated, post: postUpdated})
      }, () => {
        return reject({message: config.message.admin_error_updated})
      })
    })
  })
}

PostService.manageIncreaseCommentUserCount = (user, countIncrease) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(user.data.selectedPostId).then(post =>
    {
      PostService.update(post.model, {commentUserCount: post.data.commentUserCount + countIncrease}).then(postUpdated => {
        UserService.updateState(user.model, null)
        return resolve({message: config.message.admin_success_updated, post: postUpdated})
      }, () => {
        return reject({message: config.message.admin_error_updated})
      })
    })
  })
}

PostService.manageLikeEmojiList = (user, postId) => {
  return new Promise((resolve, reject) =>
  {
    UserService.update(user.model, {state: 'admin_post_like_emoji_selected', selectedPostId: postId})
    PostService.findById(postId).then(post => {
      let likeList = []
      for(let num=1; num<=6; num++) {
        if(post.data[`likeText${num}`] !== '')
        {
          likeList.push({
            text: post.data[`likeText${num}`],
            callback_data: `admin_post_like${num}_increase`
          })
        }
      }
      const options = {reply_markup: {inline_keyboard: [likeList]}}
      return resolve({message: config.message.select_emoji_like_increase, options: options})
    })
  })
}

PostService.manageLikeEmojiSelected = (user, likeNumber) => {
  return new Promise((resolve, reject) =>
  {
    UserService.update(user.model, {state: 'admin_post_like_increase', selectedLikeNumber: likeNumber})
    return resolve({message: config.message.enter_like_increase})
  })
}

PostService.manageIncreaseLikeCount = (user, countIncrease) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(user.data.selectedPostId).then(post =>
    {
      let newAttr = {}
      newAttr[`likeCount${user.data.selectedLikeNumber}`] = post.data[`likeCount${user.data.selectedLikeNumber}`] + countIncrease
      PostService.update(post.model, newAttr).then(postUpdated => {
        UserService.updateState(user.model, null)
        return resolve({message: config.message.admin_success_updated, post: postUpdated})
      }, () => {
        return reject({message: config.message.admin_error_updated})
      })
    })
  })
}

PostService.fixOneLikeCount = () => {
  return new Promise((resolve, reject) =>
  {
    Post.sort({field: 'createdAt', direction: 'DESC', limit: [0, 100000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      ids.forEach(id => {
        PostService.findById(id).then(post =>
        {
          if(post.data.likeText1 !== '' && post.data.likeText2 === '') {
            LikeService.manageCountByPostId(post.data.id).then(count => {
              if(post.data.likeCount1 !== count) {
                PostService.update(post.model, {likeCount1: count}).then(() => {
                  console.log(`post #${post.data.id} like count: ${post.data.likeCount1} update like count: ${count}`)
                })
              }
            }, () => {})
          }
        })
      })
    })
  })
}
