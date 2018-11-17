const nohm = require('nohm').Nohm
const redisClient = require('redis').createClient()

const config = require('./config/index')

const UserService     = require('./services/UserService')

redisClient.on('connect', () => {
  nohm.setClient(redisClient);

  // backup user data
   //UserService.backup().then((res) => {
   //  console.log(res)
   //}, (err) => {
   //  console.log(err)
  // })

   // backup user data
   UserService.miniBackup().then((res) => {
     console.log(res)
   }, (err) => {
    console.log(err)
   })

})
