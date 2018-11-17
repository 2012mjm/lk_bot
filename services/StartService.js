StartService = () => {}
module.exports = StartService

const UserService = require('./UserService')
const config = require('../config/index')

StartService.start = (user) => {
  return new Promise((resolve, reject) =>
  {
    UserService.update(user.model, {
      state: 'start',
      draftPostId: null,
      selectedPostId: null,
    })

    const isAdmin = (config.telegram.adminTgIds.indexOf(user.data.tgId) > -1)

    resolve({
      message: config.message.start,
      options: (isAdmin) ? config.keyboard.admin_start : config.keyboard.start
    })
  })
}
