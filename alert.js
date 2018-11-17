const config = require('./config/index')
const mysql = require("mysql")
const TelegramBot = require('node-telegram-bot-api')

const connection = mysql.createConnection({
    host: "localhost",
    user: "mjm3d_likeking",
    password: "FYGUZu(9Fv60",
    database: "mjm3d_likeking"
})
connection.connect()
const bot = new TelegramBot(config.telegram.token, {polling: false})

const message = "😍 من به یه قابلیت جدید و دوست داشتنی به اسم افزایش لایک 💘 مجهز شدم\nحالا دیگه میتونی بعد از اینکه پست جدیدت رو ساختی دکمه افزایش لایک رو بزنی و هر تعداد میخوایی لایک‌های پستت رو ارتقا بدی\nاین طوری هر کسی پستت رو میبینه میگه اوه اوه ببین چند نفر پستش رو دیدن و لایک کردن 😳\nهمین حالا اولین پستت رو بساز"

let broadcastSuccess = 0
let broadcastError = 0

connection.query(
    "SELECT * FROM `user` WHERE `postCount` > 0 AND `broadcastSuccess` = 0 AND `broadcastError` = 0",
    (error, results, fields) => {
        results.forEach(user => {
            console.log(user.tgId, user.username)

            bot.sendMessage(user.tgId, message).then(() => {
                connection.query(`UPDATE user SET broadcastSuccess = broadcastSuccess + 1 WHERE id = ${user.id}`, () => {})
                broadcastSuccess++
            }, () => {
                connection.query(`UPDATE user SET broadcastError = broadcastError + 1 WHERE id = ${user.id}`, () => {})
                broadcastError++
            })
        })
    }
)

console.log('broadcastSuccess', broadcastSuccess)
console.log('broadcastError', broadcastError)