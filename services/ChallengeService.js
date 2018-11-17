ChallengeService = () => {}
module.exports = ChallengeService

const nohm = require('nohm').Nohm
const config = require('../config/index')
const request = require('request')
const {filterLoad, isEmoji, paginationFilterList, paginationInlineKeyboard, splitLKT, pager, encrypt, decrypt} = require('../helper')
const moment = require('moment')
const persianJs = require('persianjs')
const jMoment = require('jalali-moment')
jMoment.loadPersian()

const UserService = require('./UserService')
const PostService = require('./PostService')

const Challenge = require('../models/Challenge')

ChallengeService.create = (text, user) => {
  return new Promise((resolve, reject) => {
    let challenge = new Challenge();
    let challengeData = {
      userId: user.id,
      name: text,
      lastPostNum: 0,
      createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    challenge.p(challengeData)
    challenge.save((err) => {
      if(err) return reject(challenge.errors)

      return resolve({data: filterLoad(challenge), model: challenge})
    })
  })
}

ChallengeService.findById = (id) => {
  return new Promise((resolve, reject) =>
  {
    const challenge = nohm.factory('Challenge', id, (err) => {
      if (err) {
        return reject()
      }
      return resolve({data: filterLoad(challenge), model: challenge})
    })
  })
}

ChallengeService.findByIdAndUserId = (id, userId) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findById(id).then(challenge => {
      if(challenge.data.userId === parseInt(userId)) {
        return resolve(challenge)
      }
      return reject()
    }, reject)
  })
}

ChallengeService.keyboardCreate = (user) => {
  return new Promise((resolve, reject) => {
    UserService.updateState(user.model, 'create_challenge')
    resolve({message: config.message.send_challenge_name})
  })
}

ChallengeService.receiveName = (user, text) => {
  return new Promise((resolve, reject) =>
  {
    UserService.updateState(user.model, 'receive_challenge_name')

    ChallengeService.create(text, user.data).then(challenge => {

      let message = `🎖 ${challenge.data.name}\n`
      message += `🙎🏻‍♂️ ${challenge.data.lastPostNum} شرکت‌کننده`

      let options = {
        reply_markup: {
          inline_keyboard: [
            [{
              text: '👱🏻 معرفی چالش و عضوگیری',
              callback_data: `about_challenge_${challenge.data.id}`
            }],
            [{
              text: '✏️ افزودن شرکت کننده',
              callback_data: `add_challenge_participant_${challenge.data.id}`
            }], [{
              text: '📝 لیست شرکت کنندگان',
              callback_data: `list_challenge_participant_${challenge.data.id}`
            }], [{
              text: '🏷 سفارشی سازی کپشن',
              callback_data: `edit_challenge_description_${challenge.data.id}`
            }]
          ]
        }
      }

      return resolve({message: message, options: options})
    }, (err) => {
      return reject({message: config.message.problem_call_support})
    })
  })
}

ChallengeService.addParticipant = (user, msg) => {
  return new Promise((resolve, reject) =>
  {
    if(msg.forward_from === undefined) {
      return reject({message: 'پستی که فوروارد کردی از طرف شرکت کننده نیست!!'})
    }
    UserService.findAndCreate(msg.forward_from).then(owner => {
      ChallengeService.findById(user.data.selectedChallengeId).then(challenge => {
        PostService.createForChallenge(msg, user.data, user.data.selectedChallengeId, parseInt(owner.data.id), challenge.data.lastPostNum+1).then(post => {
          ChallengeService.update(challenge.model, {lastPostNum: challenge.data.lastPostNum+1}).then()

          PostService.publishById(post.data.id, user.data.id).then(publish => {
            publish.params.caption = `#${post.data.challengeSelfNum}\n${challenge.data.name}\n\n${challenge.data.description}`
            publish.replyMarkup.inline_keyboard.push([{
              text: config.message.publish_button_keyboard,
              switch_inline_query: `#${post.data.id}`
            }])
            publish.options = {reply_markup: publish.replyMarkup}
            publish.postModel = post.model
            return resolve(publish)
          })
        })
      })
    })
  })
}

ChallengeService.addSelfParticipant = (user, msg) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findById(user.data.selectedChallengeId).then(challenge => {
      UserService.findById(challenge.data.userId).then(challengeOwner => {
        PostService.createForChallenge(msg, challengeOwner.data, user.data.selectedChallengeId, parseInt(user.data.id), challenge.data.lastPostNum+1).then(post => {
          ChallengeService.update(challenge.model, {lastPostNum: challenge.data.lastPostNum+1}).then()

          PostService.publishById(post.data.id, user.data.id).then(publish => {
            publish.params.caption = `#${post.data.challengeSelfNum}\n${challenge.data.name}\n\n${challenge.data.description}`
            publish.replyMarkup.inline_keyboard.push([{
              text: config.message.publish_button_keyboard,
              switch_inline_query: `#${post.data.id}`
            }])
            publish.options = {reply_markup: publish.replyMarkup}
            publish.postModel = post.model
            return resolve({publish: publish, challengeOwner: challengeOwner.data, postOwner: user.data, challenge: challenge.data})
          })
        }, () => {
          return reject({message: config.message.problem_call_support})
        })
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.not_found_challenge})
    })
  })
}

ChallengeService.addAbout = (user, msg) => {
  return new Promise((resolve, reject) =>
  {
    let type = null
    let params = {}

    ChallengeService.findById(user.data.selectedChallengeId).then(challenge => {
      if(msg.text !== undefined) {
        params = {text: msg.text}
        type = 'text'
      }
      else if(msg.photo !== undefined) {
        params = {file_id: msg.photo[0].file_id}
        type = 'photo'
      }
      else if(msg.document !== undefined) {
        params = {file_id: msg.document.file_id}
        type = 'document'
      }
      else if(msg.video !== undefined) {
        params = {file_id: msg.video.file_id}
        type = 'video'
      }
      else if(msg.voice !== undefined) {
        params = {file_id: msg.voice.file_id}
        type = 'voice'
      }
      else if(msg.audio !== undefined) {
        params = {file_id: msg.audio.file_id}
        type = 'audio'
      }
      else if(msg.sticker !== undefined) {
        params = {file_id: msg.sticker.file_id}
        type = 'sticker'
      }
      else if(msg.video_note !== undefined) {
        params = {file_id: msg.video_note.file_id}
        type = 'video_note'
      }
      else if(msg.location !== undefined) {
        params = {latitude: msg.location.latitude, longitude: msg.location.longitude}
        type = 'location'
      }
      else if(msg.contact !== undefined) {
        params = {phone_number: msg.contact.phone_number, first_name: msg.contact.first_name}
        if(msg.contact.last_name !== undefined) params.last_name = msg.contact.last_name
        type = 'contact'
      }
      else {
        return reject()
      }

      if(msg.caption !== undefined) {
        params.caption = msg.caption
      }

      ChallengeService.update(challenge.model, {aboutType: type, aboutParams: params}).then(() => {
        ChallengeService.findAbout(challenge.data.id, user.data.id).then(resolve, reject)
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.not_found_challenge})
    })
  })
}

ChallengeService.update = (model, newAttr) => {
  return new Promise((resolve, reject) =>
  {
    model.p(newAttr)
    model.save((err) => {
      if(err) return reject(err)
      return resolve({data: filterLoad(model), model: model})
    })
  })
}

ChallengeService.selfList = (user, page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Challenge.find({userId: user.data.id}, (err, ids) => {
      if(err || ids.length === 0) return reject({message: config.message.dont_give_me_challenge})

      let options = {}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'self_challenge_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit, 'DESC')

      let list = []
      let count = 0
      ids.forEach(id => {
        ChallengeService.findById(id).then(challenge =>
        {
            list.push(challenge.data)
            count++
            if(count === ids.length) {
              return resolve({message: ChallengeService.filterSelfList(list, page, limit), options: options})
            }
        })
      })
    })
  })
}

ChallengeService.filterSelfList = (list, page=1, limit=10) => {
  let out = ''
  list.forEach((challenge, index) => {
    out += `🎖 ${challenge.name}`
    // out += `\n⌚️ ${persianJs(jMoment(challenge.createdAt).fromNow()).englishNumber().toString()}\n`
    out += `\n🙎🏻‍♂️ ${persianJs(challenge.lastPostNum.toString()).englishNumber().toString()} شرکت‌کننده\n`
    out += `👓 /challenge_${challenge.id}\n`
    out += '\n'
  })
  return out
}

ChallengeService.selfView = (user, challengeId) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findByIdAndUserId(challengeId, user.data.id).then(challenge => {
      PostService.selfListChallengeParticipant(user.data.id, challengeId, 1, 3).then(topList => {
        let message = `🎖 ${challenge.data.name}\n`
        message += `🙎🏻‍♂️ ${persianJs(challenge.data.lastPostNum.toString()).englishNumber().toString()} شرکت‌کننده\n\n`
        message += `🎖۳ شرکت کننده برتر🎖\n\n`
        message += topList.message

        let options = {
          reply_markup: {
            inline_keyboard: [
              [{
                text: '👱🏻 معرفی چالش و عضوگیری',
                callback_data: `about_challenge_${challenge.data.id}`
              }],
              [{
                text: '✏️ افزودن شرکت کننده',
                callback_data: `add_challenge_participant_${challenge.data.id}`
              }], [{
                text: '📝 لیست شرکت کنندگان',
                callback_data: `list_challenge_participant_${challenge.data.id}`
              }], [{
                text: '🏷 سفارشی سازی کپشن‌ها',
                callback_data: `edit_challenge_description_${challenge.data.id}`
              }]
            ]
          }
        }
        return resolve({message: message, options: options})
      })
    }, () => {
      return reject({message: config.message.not_found_challenge})
    })
  })
}

ChallengeService.editDescription = (user, text) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findById(user.data.selectedChallengeId).then(challenge => {
      ChallengeService.update(challenge.model, {description: text}).then(() => {
        return resolve({message: 'کپشن رو تغییر دادم، از این به بعد پست های بعدی ای که انتشار میدی با کپشن جدید هستن.'})
      }, () => {
        return reject({message: config.message.problem_call_support})
      })
    }, () => {
      return reject({message: config.message.not_found_challenge})
    })
  })
}

ChallengeService.findAbout = (id, userId, publishButton=true) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findByIdAndUserId(id, userId).then(challenge => {
      if(challenge.data.aboutType !== '') {
        let options = {reply_markup: {
          inline_keyboard: [
            [{
              text: '😍 شرکت در چالش',
              url: `https://t.me/${config.telegram.bot_name}?start=ch-${challenge.data.id}`
            }]
          ]
        }}
        if(publishButton) {
          options.reply_markup.inline_keyboard.push([{
            text: config.message.publish_button_keyboard,
            switch_inline_query: `#ch-${challenge.data.id}`
          }])
        }
        return resolve({
          type: challenge.data.aboutType,
          params: JSON.parse(challenge.data.aboutParams),
          options: options
        })
      }
      else {
        return reject()
      }
    }, reject)
  })
}

ChallengeService.manageList = (page=1, limit=10) => {
  return new Promise((resolve, reject) =>
  {
    Challenge.sort({field: 'createdAt', direction: 'DESC', limit: [0, 1000000000]}, (err, ids) => {
      if(err || ids.length === 0) return reject()

      let options = {parse_mode: 'html'}
      const inlineKeyboard = paginationInlineKeyboard(ids.length, limit, 'admin_challenge_page', page)
      if(inlineKeyboard !== null) {
        options.reply_markup = {inline_keyboard: inlineKeyboard}
      }

      ids = paginationFilterList(ids, page, limit)

      let list = []
      let count = 0
      ids.forEach(id => {
        ChallengeService.findById(id).then(challenge =>
        {
          UserService.findById(challenge.data.userId).then(user => {
            challenge.data.user = user.data
            list.push(challenge.data)
            count++
            if(count === ids.length) {
              return resolve({message: ChallengeService.filterManageList(list), options: options})
            }
          })
        })
      })
    });
  })
}

ChallengeService.filterManageList = (list) => {
  let out = ''
  list.forEach(challenge => {
    out += `${challenge.name}\n`
    out += `/admin_challenge${challenge.id}\n`
    if(challenge.user !== null) out += `<a href="tg://user?id=${challenge.user.tgId}">${challenge.user.name}</a> ${(challenge.user.username !== '') ? '( @' + challenge.user.username + ' )' : ''}\n`
    out += `${moment(challenge.createdAt).fromNow()}\n`
    out += '\n'
  })
  return out
}

ChallengeService.manageInfo = (id) => {
  return new Promise((resolve, reject) =>
  {
    ChallengeService.findById(id).then(challenge => {
      PostService.manageListChallengeParticipant(id, 1, 10000).then(list => {
        let message = `🎖 ${challenge.data.name}\n`
        message += `🙎🏻‍♂️ ${persianJs(challenge.data.lastPostNum.toString()).englishNumber().toString()} شرکت‌کننده\n`
        message += `نوع معرفی: ${challenge.data.aboutType}`
        if(challenge.data.description !== '') message += '\nبا توضیح'
        message += `\n\n${list.message}`
        return resolve({message: message})
      })
    }, () => {
      return reject({message: config.message.not_found_challenge})
    })
  })
}
