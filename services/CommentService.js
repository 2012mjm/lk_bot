CommentService = () => {}
module.exports = CommentService

const nohm = require('nohm').Nohm
const config = require('../config/index')
const {filterLoad, paginationFilterList, paginationInlineKeyboard} = require('../helper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const UserService = require('./UserService')
const PostService = require('./PostService')
const PaymentService = require('./PaymentService')

const Comment = require('../models/Comment')

CommentService.start = (user, postId) => {
  return new Promise((resolve, reject) =>
  {
    UserService.update(user.model, {
      state: 'start_comment',
      selectedPostId: postId
    })
    PostService.findById(postId).then(post => {
      return resolve({
        message: config.message.send_comment,
        post: {
          id: post.data.id,
          type: post.data.type,
          params: JSON.parse(post.data.params),
          options: {},
          postModel: null
        }
      })
    }, () => {
      return reject({message: config.message.not_found_selected_post})
    })
  })
}

CommentService.create = (userId, postId, msg) => {
  return new Promise((resolve, reject) =>
  {
    let commentData = {
      userId: userId,
      postId: postId,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    if(msg.text !== undefined) {
      commentData.params = {text: msg.text}
      commentData.type = 'text'
    }
    else if(msg.photo !== undefined) {
      commentData.params = {file_id: msg.photo[0].file_id}
      commentData.type = 'photo'
    }
    else if(msg.document !== undefined) {
      commentData.params = {file_id: msg.document.file_id}
      commentData.type = 'document'
    }
    else if(msg.video !== undefined) {
      commentData.params = {file_id: msg.video.file_id}
      commentData.type = 'video'
    }
    else if(msg.voice !== undefined) {
      commentData.params = {file_id: msg.voice.file_id}
      commentData.type = 'voice'
    }
    else if(msg.audio !== undefined) {
      commentData.params = {file_id: msg.audio.file_id}
      commentData.type = 'audio'
    }
    else if(msg.sticker !== undefined) {
      commentData.params = {file_id: msg.sticker.file_id}
      commentData.type = 'sticker'
    }
    else if(msg.video_note !== undefined) {
      commentData.params = {file_id: msg.video_note.file_id}
      commentData.type = 'video_note'
    }
    else if(msg.location !== undefined) {
      commentData.params = {latitude: msg.location.latitude, longitude: msg.location.longitude}
      commentData.type = 'location'
    }
    else if(msg.contact !== undefined) {
      commentData.params = {phone_number: msg.contact.phone_number, first_name: msg.contact.first_name}
      if(msg.contact.last_name !== undefined) commentData.params.last_name = msg.contact.last_name
      commentData.type = 'contact'
    }
    else {
      return reject()
    }


    if(msg.caption !== undefined) {
      commentData.params.caption = msg.caption
    }

    let comment = new Comment();
    comment.p(commentData)
    comment.save((err) => {
      if(err) return reject(comment.errors)
      return resolve({data: filterLoad(comment), model: comment})
    })
  })
}

CommentService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const comment = nohm.factory('Comment', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(comment), model: comment})
    })
  })
}

CommentService.findByIdAndUserId = (id, userId) => {
  return new Promise((resolve, reject) =>
  {
    CommentService.findById(id).then(comment => {
      if(comment.data.userId === parseInt(userId)) {
        return resolve(comment)
      }
      return reject()
    }, reject)
  })
}

CommentService.add = (user, msg) => {
  return new Promise((resolve, reject) =>
  {
    if(user.data.selectedPostId === null) {
      UserService.update(user.model, {state: null})
      return reject({message: config.message.dont_select_post})
    }

    PostService.findById(user.data.selectedPostId).then(post =>
    {
      CommentService.create(user.data.id, post.data.id, msg).then(comment => {
        UserService.update(user.model, {state: null, selectedPostId: null})

        CommentService.countByUserIdAndPostId(user.data.id, post.data.id).then(count => {
          let increaseUserCount = false
          if (count === 1) increaseUserCount = true

          PostService.increaseComment(post.model, increaseUserCount).then((newPost) =>
          {
            // get owner
            UserService.findById(newPost.data.userId).then(owner =>
            {
              if(user.data.chargeAmount === 0) {
                PaymentService.zarinpalRequest(owner, config.params.vip_price).then(zarinpal => {
                  return resolve({
                    message: config.message.send_success_comment,
                    post: newPost,
                    owner: {
                      tgId: owner.data.tgId,
                      message: config.message.receive_new_comment_vip,
                      options: {reply_markup: {inline_keyboard: [[{
                        text: config.message.change_to_vip_keyboard,
                        url: zarinpal.url
                      }]]}},
                      post: {
                        id: newPost.data.id,
                        type: newPost.data.type,
                        params: JSON.parse(newPost.data.params),
                        options: {},
                        postModel: null
                      },
                      comment: {
                        id: comment.data.id,
                        type: comment.data.type,
                        params: JSON.parse(comment.data.params),
                        options: {},
                        postModel: null
                      }
                    }
                  })
                })
              } else {
                PostService.setAllowSeeUsers(post, user).then(() => {}, () => {})
                return resolve({
                  message: config.message.send_success_comment,
                  comment: comment,
                  post: newPost,
                  owner: {
                    tgId: owner.data.tgId,
                    message: `🙍🏻‍♂️ <a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? ' - @' + user.data.username : ''} ${config.message.receive_new_comment}`,
                    options: {parse_mode: 'html'},
                    post: {
                      type: newPost.data.type,
                      params: JSON.parse(newPost.data.params),
                      options: {},
                      postModel: null
                    },
                    comment: {
                      type: comment.data.type,
                      params: JSON.parse(comment.data.params),
                      options: {},
                      postModel: null
                    }
                  }
                })
              }
            })
          }, () => {
            return reject({message: config.message.problem_call_support})
          })
        })
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.not_found_selected_post})
    })
  })
}

CommentService.findAllByUserIdAndPostId = (userId, postId) => {
  return new Promise((resolve, reject) =>
  {
    Comment.findAndLoad({userId: userId, postId: postId}, (err, comments) => {
      if(!err && comments.length > 0) {
        let list = []
        comments.forEach(comment => (list.push(filterLoad(comment))))
        return resolve({list: list, models: comments})
      }
      return reject()
    })
  })
}

CommentService.countByUserIdAndPostId = (userId, postId) => {
  return new Promise((resolve) =>
  {
    CommentService.findAllByUserIdAndPostId(userId, postId).then(result => {
      resolve(result.list.length)
    }, () => {
      resolve(0)
    })
  })
}

CommentService.manageListByPostId = (postId) => {
  return new Promise((resolve, reject) =>
  {
    Comment.findAndLoad({postId: postId}, (err, comments) => {
      if(err && comments.length === 0) return reject()

      let count = 0
      let out = ''
      comments.reverse().forEach(comment =>
      {
        UserService.findById(comment.properties.userId.value).then(user => {
          out += `/admin_post_comment${comment.id} - ${comment.properties.type.value}\n`
          out += `<a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? '( @' + user.data.username + ' )' : ''} | `
          out += `${moment(comment.properties.createdAt.value).fromNow()}\n\n`

          count++
          if(count === comments.length) {
            return resolve({message: out, options: {parse_mode: 'html'}})
          }
        })
      })
    })
  })
}

CommentService.selfListByPostId = (user, postId, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findByIdAndUserId(postId, user.data.id).then(post => {
      let message = `✏️ ${persianJs(post.data.commentCount.toString()).englishNumber().toString()} نظر 🙍🏻‍♂️👩🏼‍💼 توسط ${persianJs(post.data.commentUserCount.toString()).englishNumber().toString()} نفر\n`
      message += '\n\n'

      let options = {parse_mode: 'html'}

      if(user.data.chargeAmount <= 0) {
        PaymentService.zarinpalRequest(user, config.params.vip_price).then(zarinpal => {
          options.reply_markup = {inline_keyboard: [[{
            text: config.message.change_to_vip_keyboard,
            url: zarinpal.url
          }]]}

          CommentService.selfUserListByPostId(post, post.data.allowSeeUsers, page, limit).then((resultList) => {
            message += `${config.message.not_vip_account_comment}\n\n`
            options.reply_markup.inline_keyboard.push(resultList.inlineKeyboard)
            return resolve({message: message + resultList.message, options: options})
          }, (error) => {
            return resolve({message: message + error.message, options: {}})
          })
        })
      } else {
        PostService.setAllowSeeUsers(post, user).then(() => {}, () => {})
        CommentService.selfUserListByPostId(post, 1, page, limit).then((resultList) => {
          options.reply_markup = {inline_keyboard: [resultList.inlineKeyboard]}
          return resolve({message: message + resultList.message, options: options})
        }, (error) => {
          return resolve({message: message + error.message, options: {}})
        })
      }
    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}

CommentService.selfUserListByPostId = (post, allowSeeUsers=0, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Comment.find({postId: post.data.id}, (err, ids) => {
      if(err || ids.length === 0) return reject({message: config.message.not_who_comment})

      let inlineKeyboard = []
      const inlineKeyboardPagination = paginationInlineKeyboard(ids.length, limit, `self_post${post.data.id}_comment_page`, page)
      if(inlineKeyboardPagination !== null) {
        inlineKeyboard = inlineKeyboardPagination
      }

      ids = paginationFilterList(ids, page, limit, 'DESC')

      let count = 0
      let out = ''
      ids.forEach(id => {
        CommentService.findById(id).then(comment => {
          if(allowSeeUsers === 1) {
            UserService.findById(comment.data.userId).then(user => {
              out += CommentService.filterCommentSelfList(comment, user)
              count++
              if(count === ids.length) {
                return resolve({message: out, inlineKeyboard: inlineKeyboard})
              }
            })
          }
          else {
            out += CommentService.filterCommentSelfList(comment)
            count++
            if(count === ids.length) {
              return resolve({message: out, inlineKeyboard: inlineKeyboard})
            }
          }
        })
      })
    })
  })
}

CommentService.filterCommentSelfList = (comment, user=null) => {
  out = '🖊 <strong>' + config.message[`comment_type_${comment.data.type}`] + '</strong>\n'
  // if(comment.data.type === 'text') {
  //   out += JSON.parse(comment.data.params).text.substr(0, 10)
  //   if(JSON.parse(comment.data.params).text.length > 10) out += ' ...'
  //   out += '\n'
  // }
  if(user) out += `🙍🏻‍♂️ توسط <a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? ' - @' + user.data.username : ''}\n`
  out += `⌚️ ${persianJs(jMoment(comment.data.createdAt).fromNow()).englishNumber().toString()}\n`
  out += `👓 /comment_${comment.data.id}\n\n`
  return out
}

CommentService.selfView = (user, commentId) => {
  return new Promise((resolve, reject) =>
  {
    CommentService.findByIdAndUserId(commentId, user.data.id).then(comment => {
      const options = {
        reply_markup: {
          inline_keyboard: [[{
            text: config.message.answer_comment_keyboard,
            callback_data: 'answer_comment_keyboard'
          }]]
        }
      }
      return resolve({
        id: comment.data.id,
        type: comment.data.type,
        params: JSON.parse(comment.data.params),
        options: options,
        postModel: null
      })
    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}
