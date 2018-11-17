const message = require('./message')

module.exports = {
  start: {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: message.create_post_keyboard,
        }], [{
          text: message.challenge_list_keyboard,
        }, {
          text: message.challenge_create_keyboard,
        }], [{
          text: message.status_account_keyboard,
        }, {
          text: message.post_list_keyboard,
        }]
      ]
    }
  },
  admin_start: {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: message.create_post_keyboard,
        }], [{
          text: message.challenge_list_keyboard,
        }, {
          text: message.challenge_create_keyboard,
        }], [{
          text: message.status_account_keyboard,
        }, {
          text: message.post_list_keyboard,
        }], [{
          text: message.admin_payment_keyboard,
        }, {
          text: message.admin_challenge_keyboard,
        }, {
          text: message.admin_post_keyboard,
        }, {
          text: message.admin_user_keyboard,
        }]
      ]
    }
  },
  createPostOptions: {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: message.create_post_order_keyboard,
        }, {
          text: message.create_post_comment_keyboard,
        }, {
          text: message.create_post_like_keyboard,
        }],
        [{
          text: message.create_post_like_order_keyboard,
        }, {
          text: message.create_post_like_comment_keyboard,
        }],
        [{
          text: message.create_post_like_comment_order_keyboard,
        }, {
          text: message.create_post_comment_order_keyboard,
        }], [{
          text: message.cancel_keyboard,
        }]
      ]
    }
  },
  cancelKeyboard: {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: message.cancel_keyboard,
        }]
      ]
    }
  },
  backToMainKeyboard: {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{
          text: message.back_to_main_keyboard,
        }]
      ]
    }
  },
}
