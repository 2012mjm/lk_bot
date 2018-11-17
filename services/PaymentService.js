PaymentService = () => {}
module.exports = PaymentService

const nohm = require('nohm').Nohm
const {filterLoad, paginationFilterList, paginationInlineKeyboard} = require('../helper')
const config = require('../config/index')
const uuidv1 = require('uuid/v1')
const zarinpalCheckout = require('zarinpal-checkout');
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const UserService = require('./UserService')

const Payment = require('../models/Payment')

PaymentService.create = (userId, amount, gateway='zarinpal') => {
  return new Promise((resolve, reject) => {
    let payment = new Payment();
    payment.p({
      userId: userId,
      amount: amount,
      gateway: gateway,
      trackingCode: uuidv1(),
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    })
    payment.save((err) => {
      if(err) return reject(payment.errors)
      return resolve({data: filterLoad(payment), model: payment})
    })
  })
}

PaymentService.findOrCreate = (userId, amount, gateway='zarinpal') => {
  return new Promise((resolve, reject) =>
  {
    Payment.findAndLoad({userId: userId, gateway: gateway, amount: amount, status: ''}, (err, payments) => {
      if(!err && payments.length > 0) {
        return resolve({data: filterLoad(payments[0]), model: payments[0]})
      }

      PaymentService.create(userId, amount, gateway).then(payment => {
        return resolve(payment)
      }, (err) => {
        return reject(err)
      })
    })
  })
}

PaymentService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const payment = nohm.factory('Payment', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(payment), model: payment})
    })
  })
}

PaymentService.findByTrackingCode = (trackingCode) => {
  return new Promise((resolve, reject) =>
  {
    Payment.findAndLoad({trackingCode: trackingCode}, (err, payments) => {
      if(!err && payments.length > 0) {
        return resolve({data: filterLoad(payments[0]), model: payments[0]})
      }
      return reject()
    })
  })
}

PaymentService.update = (model, statusCode, status, reffererCode) => {
  return new Promise((resolve, reject) =>
  {
    model.p('statusCode', parseInt(statusCode))
    model.p('status', status)
    model.p('reffererCode', reffererCode)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

PaymentService.zarinpalRequest = (user, amount, type='charge', description='شارژ حساب برای ۲۰۰ پست دیگر') => {
  return new Promise((resolve, reject) =>
  {
    PaymentService.findOrCreate(user.data.id, amount, 'zarinpal').then(payment =>
    {
      const zarinpal = zarinpalCheckout.create(config.zarinpal.merchant_id, config.zarinpal.sandbox)
      zarinpal.PaymentRequest({
        Amount: amount, // In Tomans
        CallbackURL: `${config.zarinpal.callback_url}/${payment.data.trackingCode}/${type}`,
        Description: description,
        Email: config.params.email,
      }).then(response => {
        if (response.status === 100) {
          resolve({url: response.url, payment: payment})
        } else {
          reject({message: response.status})
        }
      }, err => {
        reject({message: err})
      })
    })
  })
}

PaymentService.zarinpalVerify = (trackingCode, authority, status, type) => {
  return new Promise((resolve, reject) =>
  {
    const redirectUrl = `https://t.me/${config.telegram.bot_name}`

    if(trackingCode === '' || authority === '' || status === '') {
      return reject({url: redirectUrl, tgId: null})
    }

    PaymentService.findByTrackingCode(trackingCode).then(payment => {
      UserService.findById(payment.data.userId).then(user => {
        if(status !== 'OK') {
          PaymentService.update(payment.model, 0, status, '').then(paymentUpdated => {
            return reject({url: redirectUrl, tgId: user.data.tgId, message: config.message.cancel_payment_by_user})
          })
        }
        else {
          const zarinpal = zarinpalCheckout.create(config.zarinpal.merchant_id, config.zarinpal.sandbox)
          zarinpal.PaymentVerification({
        		Amount: payment.data.amount,
        		Authority: authority,
        	}).then(response => {
            console.log('response payment', response)
            PaymentService.update(payment.model, parseInt(response.status), status, response.RefID).then(paymentUpdated =>
            {
              if (parseInt(response.status) === 101) {
                if(type === 'charge') {
                  UserService.update(user.model, {chargeAmount: user.data.chargeAmount+config.params.chargeAmount}).then(userUpdated => {
                    return resolve({url: redirectUrl, tgId: user.data.tgId, message: config.message.success_to_vip_account, options: config.keyboard.start})
                  }, () => {
                    return reject({url: redirectUrl, tgId: user.data.tgId, message: config.message.error_to_vip_account})
                  })
                }
                else if(type === 'donate') {
                  return resolve({url: redirectUrl, tgId: user.data.tgId, message: 'بسیار تشکر از حمایت شما 🌺😍', options: config.keyboard.start})
                }
                else if(type === 'likeup') {
                  PostService.likeEmojiIncrease(user.data.likeupCount).then(result => {
                    return resolve({url: redirectUrl, tgId: user.data.tgId, message: result.message, options: config.keyboard.start, post: result.post})
                  }, () => {
                    return reject({url: redirectUrl, tgId: user.data.tgId, message: result.message})
                  })
                }
              } else {
                return reject({url: redirectUrl, tgId: user.data.tgId, message: config.message.error_payment})
              }
            })
        	}, (err) => {
            PaymentService.update(payment.model, 0, err, '').then(paymentUpdated => {
              return reject({url: redirectUrl, tgId: user.data.tgId, message: config.message.error_payment})
            })
          })
        }
      })
    }, () => {
      return reject({url: redirectUrl, tgId: null})
    })
  })
}

PaymentService.manageList = (page=1, limit=10) => {
  return new Promise((resolve, reject) => {
    Payment.sort({field: 'createdAt', direction: 'DESC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'admin_payment_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit)

      let list = []
      let count = 0
      ids.forEach(id => {
        PaymentService.findById(id).then(payment =>
        {
          UserService.findById(payment.data.userId).then(user => {
            payment.data.user = user.data
            list.push(payment.data)

            count++
            if(count === ids.length) {
              return resolve({message: PaymentService.filterManageList(list), options: options})
            }
          })
        })
      })
    });
  })
}

PaymentService.filterManageList = (list) => {
  let out = ''
  list.forEach(payment => {
    out += `#${payment.id} - ${payment.user.name} ${(payment.user.username !== '') ? '( @' + payment.user.username + ' )' : ''}\n`
    out += `charge: ${payment.user.chargeAmount} ${(payment.user.chargeAmount > 0) ? ((payment.user.chargeAmount > 5) ? '😍' : '😎') : '😔'}\n`
    out += `ref: ${payment.reffererCode}\n`
    out += `code: ${payment.statusCode}\n`
    out += `status: ${payment.status}\n`
    out += `${moment(payment.createdAt).fromNow()}\n\n`
  })
  return out
}
