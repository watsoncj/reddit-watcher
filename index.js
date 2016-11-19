const config = require('./config');
const Snoocore = require('snoocore');
const when = require('when');
 
if (config.goo_gl.key) {
  const googl = require('goo.gl');
  googl.setKey(config.goo_gl.key);
}
 
if (config.twilio && config.twilio.sid) {
  const twilio = require('twilio')(config.twilio.sid, config.twilio.token);
}

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
    when.map(posts, formatMessage)
      .then((messageArr) => {
        for (var i=0; i<messageArr.length; i++) {
          console.log(messageArr[i]);
          setTimeout(sendSMS.bind(this, messageArr[i]), 5000*i);
        }
      })
      .catch((error) => console.error(error));
  }
  scheduleNextQuery(sub, params);
};

function formatMessage(post) {
  return when.promise((resolve) => {
    var shortTitle = post.title.substring(0, Math.min(120, post.title.length));
    shortenUrl(post.url)
      .then((shortUrl) => {
        resolve(shortTitle + ' ' + shortUrl);
      })
      .catch((err) => {
        console.err(err);
        resolve(shortTitle);
      })
  });
}

function shortenUrl(url) {
  if (googl && url) {
    return googl.shorten(url)
  } else {
    // return empty string if URL shortener is not configured or URL not provided
    return when('');
  }
}
// function formatMessage(post) {
//   return when.promise((resolve) => {
//     var shortTitle = post.title.substring(0, Math.min(120, post.title.length));
//     if (post.url) {
//       bitly.shorten(post.url)
//         .then((response) => {
//           console.log("THEN");
//           console.log(response);
//           resolve(shortTitle + ' ' + response.data.url);
//         })
//         .catch((error) => {
//           console.log('bad');
//           console.error(error);
//           resolve(title);
//         });
//     } else {
//       resolve(shortTitle);
//     }
//   });
// }

function handleError(sub, params, error) {
  console.error(error.toString());
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
  if (twilio) {
    console.log('sending message ' + body);
    twilio.sendMessage({
      to: config.twilio.toPhone,
      from: config.twilio.fromPhone,
      body: body
    }, (error, result) => {
      if (error) {
        console.error('error', error);
      }
      console.log(result);
    });
  }
}
