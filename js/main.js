var vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

getGlobalProps()
  .then(getAccounts(['utopian-io', 'ned']))

function getGlobalProps(){
  var globalProps = steem.api.getDynamicGlobalProperties(function(err, result) {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
  return globalProps
}


function getAccounts(accounts){
    steem.api.getAccounts(accounts, function(err, response){
      response.forEach( function(user){
          console.log(user)
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

          var vestingShares = user.vesting_shares;
          var delegatedVestingShares = user.delegated_vesting_shares;
          var receivedVestingShares = user.received_vesting_shares;

          console.log(vestingShares, delegatedVestingShares, receivedVestingShares )


            var steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
            var delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
            var outgoingSteemPower = steem.formatter.vestToSteem((delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);

            console.log(steemPower, delegatedSteemPower, outgoingSteemPower);


            var lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
            var votePower = user.voting_power += (10000 * lastVoteTime / 432000);
            votePower = Math.min(votePower / 100, 100).toFixed(2);

            console.log('votePower', votePower);

      });
    });
};
