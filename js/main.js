steem.api.getAccounts(['dan', 'ned'], function(err, response){
  response.forEach( function(user){
      var jsonData = user.json_metadata ? JSON.parse(user.json_metadata).profile : {}

      console.log("IMAGE", jsonData.profile_image ? 'https://steemitimages.com/2048x512/' + jsonData.profile_image : '')
      console.log(user.name);
      console.log('REPUTATION');
      console.log('STEEM POWER');
      console.log('STEEM', user.balance);
      console.log('STEEM DOLLARS', user.sbd_balance);

      steem.api.getFollowCount( user.name , function(err, user) {
        console.log("Followers", user.follower_count);
        console.log("Following", user.following_count);
      });
      console.log("NUM OF POSTS", user.post_count);

      steem.formatter.estimateAccountValue(user).then(function(value) {
          console.log(user.name + ' $$$ EST USD VALUE',value);
      });
  });
});
