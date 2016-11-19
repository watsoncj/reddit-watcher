const config = require('./config');
const Snoocore = require('snoocore');
const twilio = require('twilio')(config.twilio.sid, config.twilio.token);

var reddit = new Snoocore(config.snoocore);

// start polling on each subreddit
config.subs.forEach((sub) => {
  queryListings(sub, {});
});

function queryListings(sub, params) {
  console.log('Listing ' + sub.path + ' ' + (params.before || ''));
  reddit(sub.path).listing(params)
    .then(handleListing.bind(this, sub, params))
    .catch(handleError.bind(this, sub, params));
}

function handleListing(sub, params, slice) {
  // keep place of most recent result
  if (slice.children.length) {
    console.log(slice.children.length + ' results');
    params.before = slice.children[0].data.name;
  }
  var posts = slice.children
    .filter(isPost)
    .filter(isInteresting.bind(this, sub.includes))
    .map(pluckFields);

  if (posts.length) {
    var body = formatMessage(posts);
    console.log(body);
    sendSMS(body);
  }
  scheduleNextQuery(sub, params);
};

function formatMessage(posts) {
  var title = posts[0].title;
  return title.substring(0, Math.min(120, title.length));
}

function handleError(sub, params, e) {
  console.error(e.toString());
  scheduleNextQuery(sub, params);
}

function scheduleNextQuery(sub, params) {
  var timeout = config.pollCycleSeconds * 1000;
  setTimeout(() => queryListings(sub, params), timeout);
}

function isPost(child) {
  return child.kind === 't3';
}

function isInteresting(includes, post) {
  var title = post.data.title;
  for (var i=0; i<includes.length; i++) {
    if (title.match(includes[i])) {
      return true;
    }
  }
  return false;
}

function pluckFields(post) {
  return {
    title: post.data.title,
    text: post.data.selftext,
    url: post.data.url,
    created: post.data.created
  };
}

function sendSMS(body) {
  twilio.sendMessage({
    to: config.twilio.toPhone,
    from: config.twilio.fromPhone,
    body: body
  }, (err, responseData) => {
      if (err) {
        console.error('error', err);
      } else {
        console.log('data', responseData);
      }
  });
}
