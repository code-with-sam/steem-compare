steem.api.getAccounts(['dan', 'ned'], function(err, response){
  response.forEach( function(user){
      console.log('IMAGE')
      console.log(user.name);
      console.log('REPUTATION');
      console.log('STEEM POWER');
      console.log('STEEM');
      console.log('STEEM DOLLARS');
      console.log('Followers');
      console.log('Following');
      console.log('NUM OF POSTS');
  });
});
