LikeService = () => {}
module.exports = LikeService

const nohm = require('nohm').Nohm
const {filterLoad, paginationFilterList, paginationInlineKeyboard} = require('../helper')
const config = require('../config/index')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const PostService = require('./PostService')
const PaymentService = require('./PaymentService')

const Like = require('../models/Like')

LikeService.add = (userId, postId, number) => {
  return new Promise((resolve, reject) => {
    let like = new Like();
    like.p({
      userId: userId,
      postId: postId,
      number: number,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    })
    like.save((err) => {
      if(err) return reject(like.errors)

      return resolve({data: filterLoad(like), model: like})
    })
  })
}

LikeService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const like = nohm.factory('Like', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(like), model: like})
    })
  })
}

LikeService.findByUserIdAndPostId = (userId, postId) => {
  return new Promise((resolve, reject) =>
  {
    Like.findAndLoad({userId: userId, postId: postId}, (err, likes) => {
      if(!err && likes.length > 0) {
        return resolve({data: filterLoad(likes[0]), model: likes[0]})
      }
      return reject()
    })
  })
}

LikeService.update = (userId, postId, likeNum) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(postId).then(post => {
      LikeService.findByUserIdAndPostId(userId, postId).then(like => {

        PostService.decreaseLike(post.model, like.data.number).then(newPost => {
          const deleteLikeNum = like.data.number
          like.model.remove()

          if(likeNum !== deleteLikeNum) {
            PostService.increaseLike(post.model, likeNum).then(newPost => {
              LikeService.add(userId, postId, likeNum).then(() => {
                return resolve(newPost)
              }, reject)
            }, reject)
          } else {
            return resolve(newPost)
          }
        }, reject)
      }, () => {
        PostService.increaseLike(post.model, likeNum).then(newPost => {
          LikeService.add(userId, postId, likeNum).then(() => {
            return resolve(newPost)
          }, reject)
        }, reject)
      })
    }, reject)
  })
}

LikeService.manageListByPostId = (postId) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findById(postId).then(post =>
    {
      Like.findAndLoad({postId: postId}, (err, likes) => {
        if(err && likes.length === 0) return reject()

        let count = 0
        let out = ''
        likes.reverse().forEach(like =>
        {
          UserService.findById(like.properties.userId.value).then(user => {
            out += post.data[`likeText${like.properties.number.value}`]
            out += ` ${user.data.name} ${(user.data.username !== '') ? '( @' + user.data.username + ' )' : ''} | `
            out += `${moment(like.properties.createdAt.value).fromNow()}\n\n`

            count++
            if(count === likes.length) {
              return resolve({message: out})
            }
          })
        })
      })
    })
  })
}

LikeService.selfListByPostId = (user, postId, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findByIdAndUserId(postId, user.data.id).then(post => {
      let message = `${config.message.self_count_like}\n`
      for(let i=1; i<=6; i++) {
        if(post.data[`likeText${i}`] !== '') {
          if(i!==1) message += ' | '
          message += post.data[`likeText${i}`] + ' ' + post.data[`likeCount${i}`]
        }
      }
      message += '\n\n'

      if(user.data.chargeAmount === 0) {
        message += config.message.not_vip_account_like
        PaymentService.zarinpalRequest(user, config.params.vip_price).then(zarinpal => {
          const options = {reply_markup: {inline_keyboard: [[{
            text: config.message.change_to_vip_keyboard,
            url: zarinpal.url
          }]]}}
          return resolve({message: message, options: options})
        })
      }
      else {
        PostService.setAllowSeeUsers(post, user).then(() => {}, () => {})
        LikeService.selfUserListByPostId(post, page, limit).then((resultList) => {
          message += `${config.message.self_who_like}\n\n`
          return resolve({message: message + resultList.message, options: {parse_mode: 'markdown', reply_markup: {inline_keyboard: resultList.inlineKeyboard}}})
        }, (error) => {
          return resolve({message: message + error.message, options: {}})
        })
      }
    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}

LikeService.selfUserListByPostId = (post, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Like.find({postId: post.data.id}, (err, ids) => {
      if(err || ids.length === 0) return reject({message: config.message.not_who_like})

      let inlineKeyboard = []
      const inlineKeyboardPagination = paginationInlineKeyboard(ids.length, limit, `self_post${post.data.id}_like_page`, page)
      if(inlineKeyboardPagination !== null) {
        inlineKeyboard = inlineKeyboardPagination
      }

      ids = paginationFilterList(ids, page, limit, 'DESC')

      let list = []
      let count = 0
      let out = ''
      ids.forEach(id => {
        LikeService.findById(id).then(like => {
          UserService.findById(like.data.userId).then(user => {
            out += post.data[`likeText${like.data.number}`]
            out += ` [${user.data.name}](tg://user?id=${user.data.tgId}) ${(user.data.username !== '') ? '( @' + user.data.username + ' )' : ''} | `
            out += `${persianJs(jMoment(like.data.createdAt).fromNow()).englishNumber().toString()}\n\n`

            count++
            if(count === ids.length) {
              return resolve({message: out, inlineKeyboard: inlineKeyboard})
            }
          })
        })
      })
    })
  })
}

LikeService.manageCountByPostId = (postId) => {
  return new Promise((resolve, reject) =>
  {
    Like.findAndLoad({postId: postId}, (err, likes) => {
      if(err || likes.length === 0) return reject()
      return resolve(likes.length)
    })
  })
}
