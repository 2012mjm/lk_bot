OrderService = () => {}
module.exports = OrderService

const nohm = require('nohm').Nohm
const config = require('../config/index')
const {filterLoad, paginationFilterList, paginationInlineKeyboard, textTruncate} = require('../helper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const UserService = require('./UserService')
const PostService = require('./PostService')
const PaymentService = require('./PaymentService')

const Order = require('../models/Order')

OrderService.start = (user, postId) => {
  return new Promise((resolve, reject) =>
  {
    UserService.update(user.model, {
      state: 'start_order',
      selectedPostId: postId
    })
    PostService.findById(postId).then(post => {
      return resolve({
        message: config.message.send_order,
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

OrderService.create = (userId, postId, msg) => {
  return new Promise((resolve, reject) =>
  {
    let orderData = {
      userId: userId,
      postId: postId,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }

    if(msg.text !== undefined) {
      orderData.params = {text: msg.text}
      orderData.type = 'text'
    }
    else if(msg.photo !== undefined) {
      orderData.params = {file_id: msg.photo[0].file_id}
      orderData.type = 'photo'
    }
    else if(msg.document !== undefined) {
      orderData.params = {file_id: msg.document.file_id}
      orderData.type = 'document'
    }
    else if(msg.video !== undefined) {
      orderData.params = {file_id: msg.video.file_id}
      orderData.type = 'video'
    }
    else if(msg.voice !== undefined) {
      orderData.params = {file_id: msg.voice.file_id}
      orderData.type = 'voice'
    }
    else if(msg.audio !== undefined) {
      orderData.params = {file_id: msg.audio.file_id}
      orderData.type = 'audio'
    }
    else if(msg.sticker !== undefined) {
      orderData.params = {file_id: msg.sticker.file_id}
      orderData.type = 'sticker'
    }
    else if(msg.video_note !== undefined) {
      orderData.params = {file_id: msg.video_note.file_id}
      orderData.type = 'video_note'
    }
    else if(msg.location !== undefined) {
      orderData.params = {latitude: msg.location.latitude, longitude: msg.location.longitude}
      orderData.type = 'location'
    }
    else if(msg.contact !== undefined) {
      orderData.params = {phone_number: msg.contact.phone_number, first_name: msg.contact.first_name}
      if(msg.contact.last_name !== undefined) orderData.params.last_name = msg.contact.last_name
      orderData.type = 'contact'
    }
    else {
      return reject()
    }


    if(msg.caption !== undefined) {
      orderData.params.caption = msg.caption
    }

    let order = new Order();
    order.p(orderData)
    order.save((err) => {
      if(err) return reject(order.errors)
      return resolve({data: filterLoad(order), model: order})
    })
  })
}

OrderService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const order = nohm.factory('Order', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(order), model: order})
    })
  })
}

OrderService.findByIdAndUserId = (id, userId) => {
  return new Promise((resolve, reject) =>
  {
    OrderService.findById(id).then(order => {
      if(order.data.userId === parseInt(userId)) {
        return resolve(order)
      }
      return reject()
    }, reject)
  })
}

OrderService.add = (user, msg) => {
  return new Promise((resolve, reject) =>
  {
    if(user.data.selectedPostId === null) {
      UserService.update(user.model, {state: null})
      return reject({message: config.message.dont_select_post})
    }

    PostService.findById(user.data.selectedPostId).then(post =>
    {
      OrderService.create(user.data.id, post.data.id, msg).then(order => {
        UserService.update(user.model, {state: null, selectedPostId: null})

        PostService.increaseOrder(post.model).then((newPost) => {
          // get owner
          UserService.findById(newPost.data.userId).then(owner =>
          {
            return resolve({
              message: config.message.send_success_order,
              order: order,
              owner: {
                tgId: owner.data.tgId,
                message: `🙍🏻‍♂️ <a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? ' - @' + user.data.username : ''} ${config.message.receive_new_order}`,
                options: {parse_mode: 'html'},
                post: {
                  id: newPost.data.id,
                  type: newPost.data.type,
                  params: JSON.parse(newPost.data.params),
                  options: {},
                  postModel: null
                },
                order: {
                  id: order.data.id,
                  type: order.data.type,
                  params: JSON.parse(order.data.params),
                  options: {},
                  postModel: null
                }
              }
            })
          })
        }, () => {
          return reject({message: config.message.problem_call_support})
        })
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.not_found_selected_post})
    })
  })
}

OrderService.findAllByUserIdAndPostId = (userId, postId) => {
  return new Promise((resolve, reject) =>
  {
    Order.findAndLoad({userId: userId, postId: postId}, (err, orders) => {
      if(!err && orders.length > 0) {
        let list = []
        orders.forEach(order => (list.push(filterLoad(order))))
        return resolve({list: list, models: orders})
      }
      return reject()
    })
  })
}

OrderService.manageListByPostId = (postId) => {
  return new Promise((resolve, reject) =>
  {
    Order.findAndLoad({postId: postId}, (err, orders) => {
      if(err && orders.length === 0) return reject()

      let count = 0
      let out = ''
      orders.reverse().forEach(order =>
      {
        UserService.findById(order.properties.userId.value).then(user => {
          out += `/admin_post_order${order.id} - ${order.properties.type.value}\n`
          out += `<a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? '( @' + user.data.username + ' )' : ''} | `
          out += `${moment(order.properties.createdAt.value).fromNow()}\n\n`

          count++
          if(count === orders.length) {
            return resolve({message: out, options: {parse_mode: 'html'}})
          }
        })
      })
    })
  })
}

OrderService.selfListByPostId = (user, postId, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    PostService.findByIdAndUserId(postId, user.data.id).then(post => {
      if(post.data.orderCount === 0) {
        return resolve({message: config.message.not_who_order, options: {}})
      }

      let message = `${persianJs(post.data.orderCount.toString()).englishNumber().toString()} سفارش ثبت شده است 🛒\n\n`
      let options = {parse_mode: 'html'}

      OrderService.selfUserListByPostId(post, page, limit).then((resultList) => {
        options.reply_markup = {inline_keyboard: [resultList.inlineKeyboard]}
        return resolve({message: message + resultList.message, options: options})
      }, (error) => {
        return resolve({message: message + error.message, options: {}})
      })
    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}

OrderService.selfUserListByPostId = (post, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Order.find({postId: post.data.id}, (err, ids) => {
      if(err || ids.length === 0) return reject({message: config.message.not_who_order})

      let inlineKeyboard = []
      const inlineKeyboardPagination = paginationInlineKeyboard(ids.length, limit, `self_post${post.data.id}_order_page`, page)
      if(inlineKeyboardPagination !== null) {
        inlineKeyboard = inlineKeyboardPagination
      }

      ids = paginationFilterList(ids, page, limit, 'DESC')

      let count = 0
      let out = ''
      ids.forEach(id => {
        OrderService.findById(id).then(order => {
          UserService.findById(order.data.userId).then(user => {
            out += OrderService.filterOrderSelfList(order, user)
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

OrderService.filterOrderSelfList = (order, user=null) => {
  let out = ''
  if(order.data.type === 'text') {
    out += `${textTruncate(JSON.parse(order.data.params).text, 30)}\n`
  }
  if(user) out += `🙍🏻‍♂️ توسط <a href="tg://user?id=${user.data.tgId}">${user.data.name}</a> ${(user.data.username !== '') ? ' - @' + user.data.username : ''}\n`
  out += `⌚️ ${persianJs(jMoment(order.data.createdAt).fromNow()).englishNumber().toString()}\n`
  out += `👓 /order_${order.data.id}\n\n\n`
  return out
}

OrderService.selfView = (user, orderId) => {
  return new Promise((resolve, reject) =>
  {
    OrderService.findByIdAndUserId(orderId, user.data.id).then(order => {
      return resolve({
        id: order.data.id,
        type: order.data.type,
        params: JSON.parse(order.data.params),
        options: {},
        postModel: null
      })
    }, () => {
      return reject({message: config.message.not_found_post})
    })
  })
}
