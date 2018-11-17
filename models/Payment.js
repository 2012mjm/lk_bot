const nohm = require('nohm').Nohm;

module.exports = nohm.model('Payment', {
  idGenerator: 'increment',
  properties: {
    userId: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    gateway: {
      type: 'string', // zarinpal
      defaultValue: 'text',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    amount: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    trackingCode: {
      type: 'string',
      index: true,
    },
    reffererCode: {
      type: 'string'
    },
    statusCode: {
      type: 'integer'
    },
    status: {
      type: 'string',
      index: true,
    },
    createdAt: {
      type: 'string',
    },
  },
});
