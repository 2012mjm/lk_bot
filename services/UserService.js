UserService = () => {}
module.exports = UserService

const fs = require('fs')
const nohm = require('nohm').Nohm
const config = require('../config/index')
const {filterLoad, paginationFilterList, paginationInlineKeyboard} = require('../helper')
const moment = require('moment')
const PostService = require('./PostService')
const PaymentService = require('./PaymentService')

const User = require('../models/User')

UserService.findAndCreate = (attr) => {
  return new Promise((resolve, reject) =>
  {
    User.findAndLoad({tgId: attr.id}, (err, users) => {
      if(err || users.length === 0) {
        let user = new User();
        user.p({
          tgId: attr.id,
          name: `${attr.first_name}${(attr.last_name !== undefined && attr.last_name !== '') ? ' '+attr.last_name : ''}`,
          username: attr.username,
          createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        user.save((err) => {
          if(err) return reject(user.errors)

          return resolve({data: filterLoad(user), model: user})
        })
      }
      else {
        return resolve({data: filterLoad(users[0]), model: users[0]})
      }
    })
  })
}

UserService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const user = nohm.factory('User', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(user), model: user})
    })
  })
}

UserService.update = (model, newAttr) => {
  return new Promise((resolve, reject) => {
    newAttr['updatedAt'] = moment().format('YYYY-MM-DD HH:mm:ss')
    model.p(newAttr)
    model.save((err) => {
      if(err) return reject(err)

      return resolve({data: filterLoad(model), model: model})
    })
  })
}

UserService.updateState = (model, newState) => {
  return new Promise((resolve, reject) => {
    model.p('state', newState)
    model.p('updatedAt', moment().format('YYYY-MM-DD HH:mm:ss'))
    model.save((err) => {
      if(err) return reject(err)

      return resolve({data: filterLoad(model), model: model})
    })
  })
}

UserService.decreaseCharge = (user) => {
  return new Promise((resolve, reject) => {
    if(user.data.chargeAmount <= 0) return reject()
    UserService.update(user.model, {chargeAmount: user.data.chargeAmount - 1}).then(resolve, reject)
  })
}

UserService.manageList = (page=1, limit=10) => {
  return new Promise((resolve, reject) => {
    User.sort({field: 'createdAt', direction: 'DESC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'admin_user_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit)

      let list = []
      let count = 0
      ids.forEach(id => {
        UserService.findById(id).then(user =>
        {
          PostService.manageCountByUserId(id).then(postCount => {
            user.data.postCount = postCount
            list.push(user.data)

            count++
            if(count === ids.length) {
              return resolve({message: UserService.filterManageList(list), options: options})
            }
          })
        })
      })
    });
  })
}

UserService.filterManageList = (list) => {
  let out = ''
  list.forEach(user => {
    out += `#${user.id} - ${user.tgId}\n`
    out += `${user.name} ${(user.username !== '') ? '( @' + user.username + ' )' : ''}\n`
    out += `charge: ${user.chargeAmount} ${(user.chargeAmount > 0) ? '😎' : ''}\n`
    out += (user.updatedAt !== '') ? `${moment(user.updatedAt).fromNow()}\n` : `${moment(user.createdAt).fromNow()}\n`
    out += `Post count: ${user.postCount}\n\n`
  })
  return out
}

UserService.selfStatus = (user) => {
  return new Promise((resolve, reject) => {
    PaymentService.zarinpalRequest(user, config.params.vip_price).then(zarinpal =>
    {
      let options = {reply_markup: {inline_keyboard: [[{
        text: config.message.change_to_vip_keyboard,
        url: zarinpal.url
      }]]}}

      let message = `${config.message.charge_my_account}: ${user.data.chargeAmount} ${(user.data.chargeAmount > 0) ? '😎' : '🙁'}\n\n`
      message += config.message.charge_reason_account
      return resolve({message: message, options: options})
    })
  })
}

UserService.backup = () => {
  return new Promise((resolve, reject) => {
    User.sort({field: 'createdAt', direction: 'ASC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      const fileName = `user_backup_${moment().format('YYYY_MM_DD')}.sql`
      let text = ''

      fs.appendFile(fileName, 'INSERT INTO `user` (`id`, `tgId`, `name`, `username`, `chargeAmount`, `postCount`, `createdAt`, `updatedAt`) VALUES\n')

      let count = 0
      let countSuccess = 0
      ids.forEach(id => {
        UserService.findById(id).then(user =>
        {
          PostService.manageCountByUserId(id).then(postCount =>
          {
            fs.appendFile(fileName, `(${user.data.id}, ${user.data.tgId}, '${user.data.name}', '${user.data.username}', ${user.data.chargeAmount}, ${postCount}, '${user.data.createdAt}', '${user.data.updatedAt}'),\n`, (err) => {
              if (!err) countSuccess++
            })

            count++
            if(count === ids.length) {
              return resolve({message: `finish, all: ${count}, success: ${countSuccess}`})
            }
          })
        })
      })
    });
  })
}

UserService.miniBackup = () => {
  return new Promise((resolve, reject) => {
    User.sort({field: 'createdAt', direction: 'ASC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      const fileName = `user_backup_${moment().format('YYYY_MM_DD')}-mini.sql`
      let text = ''

      fs.appendFile(fileName, 'INSERT INTO `user` (`id`, `tgId`, `username`, `chargeAmount`, `postCount`, `createdAt`, `updatedAt`, `broadcastSuccess`, `broadcastError`) VALUES\n', (err) => {console.log(err)})

      let count = 0
      let countSuccess = 0
      let countError = 0
      ids.forEach(id => {
        UserService.findById(id).then(user =>
        {
          PostService.manageCountByUserId(id).then(postCount =>
          {
            console.log(user.data.id, user.data.tgId, user.data.username)
            fs.appendFileSync(fileName, `(${user.data.id}, ${user.data.tgId}, '${user.data.username}', ${user.data.chargeAmount}, ${postCount}, '${user.data.createdAt}', '${user.data.updatedAt}', '0', '0'),\n`)

            // fs.appendFile(fileName, `(${user.data.id}, ${user.data.tgId}, '${user.data.username}', ${user.data.chargeAmount}, ${postCount}, '${user.data.createdAt}', '${user.data.updatedAt}', '0', '0'),\n`, (err) => {
              // if (!err) countSuccess++
              // else countError++
            // })

            count++
            if(count === ids.length) {
              return resolve({message: `finish, all: ${count}, success: ${countSuccess}, error: ${countError}`})
            }
          })
        })
      })
    });
  })
}

