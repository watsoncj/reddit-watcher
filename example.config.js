module.exports = {
  snoocore: {
    userAgent: 'reddit-watcher@1.0.0',
    oauth: {
      type: 'script',
      key: YOUR_REDDIT_APP_CLIENT_ID, // create a new developer app in reddit
      secret: YOUR_REDDIT_APP_CLIENT_SECRET,
      username: YOUR_REDDIT_USER,
      password: YOUR_REDDIT_PASSWORD,
      scope: [ 'read' ]
    },
  },
  twilio: {
    sid: YOUR_ACCOUNT_SID,
    token: YOUR_AUTH_TOKEN,
    toPhone: '+15555555555', // any telephone number Twilio can send SMS to
    fromPhone: '+15551234567' // phone number purchased from Twilio
  },
  pollCycleSeconds: 300, // poll for new posts every 5 minutes
  subs: [
    // receive an alert anytime someone posts an elephant to /r/aww
    {
      path: '/r/aww/new',
      includes: [
        /elephant/i
      ]
    },
    // receive an alert anytime someone wants to sell Schiit audio gear on /r/avexchange
    {
      path: '/r/avexchange/new',
      includes: [
        /[WTS].*Schiit/i,
      ]
    }
  ]
};
