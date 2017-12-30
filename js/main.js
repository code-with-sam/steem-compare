var vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

var activeAccounts = [];

getGlobalProps()
  .then(getAccounts(['utopian-io', 'sambillingham']))
  .then(function(){
    console.log(activeAccounts);
  })

function getGlobalProps(){
  var globalProps = steem.api.getDynamicGlobalProperties(function(err, result) {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
  return globalProps
}


function getAccounts(accounts){

    return steem.api.getAccounts(accounts, function(err, response){
      response.forEach( function(user){
          // store meta Data
          var jsonData = user.json_metadata ? JSON.parse(user.json_metadata).profile : {}

          // steem power calc
          var vestingShares = user.vesting_shares;
          var delegatedVestingShares = user.delegated_vesting_shares;
          var receivedVestingShares = user.received_vesting_shares;
          var steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
          var delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
          var outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

          // vote power calc
          var lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
          var votePower = user.voting_power += (10000 * lastVoteTime / 432000);
          votePower = Math.min(votePower / 100, 100).toFixed(2);

          var followerCount, followingCount, usdValue;

          steem.api.getFollowCount( user.name , function(err, user) {
            followerCount = user.follower_count;
            followingCount = user.following_count;
          }).then( function(){

            return steem.formatter.estimateAccountValue(user).then(function(value) {
              usdValue = value;
            });
          }).then(function(){
            activeAccounts.push({
              name: user.name,
              image: jsonData.profile_image ? 'https://steemitimages.com/2048x512/' + jsonData.profile_image : '',
              rep: steem.formatter.reputation(user.reputation),
              sp: steemPower,
              delegatedSpIn: delegatedSteemPower,
              delegatedSpOut: outgoingSteemPower,
              vp: votePower,
              steem: user.balance,
              sbd: user.sbd_balance,
              numOfPosts: user.post_count,
              followerCount: followerCount,
              followingCount: followingCount,
              usdValue: usdValue
            });
          })


      });
    });
};
