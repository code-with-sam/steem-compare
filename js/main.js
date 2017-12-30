var vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;



getGlobalProps()
  .then(function(){
    return getAccounts(['dan', 'ned'])
  })
  .then(function(data){
    console.log(data)
    console.log(proccessData(data));

    displayAccounts(proccessData(data));
  })

function displayAccounts(accounts){
  var $grid = $('.grid');

  accounts.forEach(function(user){
    console.log(user);
    var template =
      `<div class="col-md-4">
      <h2>${user.name}</h2>
      <p>Donec id elit non mi porta gravida at eget metus. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Etiam porta sem malesuada magna mollis euismod. Donec sed odio dui. </p>
      <p><a class="btn btn-secondary" href="#" role="button">View details &raquo;</a></p>
      </div>`;
      console.log(template)
      $grid.append(template);
  })

}
function getGlobalProps(){
  var globalProps = steem.api.getDynamicGlobalProperties(function(err, result) {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
  return globalProps
}


function getAccounts(accountNames){
    return steem.api.getAccounts(accountNames, function(err, response){
      return response;
    })
};

function proccessData(accounts){

  var accountsData = [];

  accounts.forEach( function(user){
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

    // var followerCount, followingCount, usdValue;

    // steem.api.getFollowCount( user.name , function(err, user) {
    //   followerCount = user.follower_count;
    //   followingCount = user.following_count;
    // }).then( function(){
    //
    //   return steem.formatter.estimateAccountValue(user).then(function(value) {
    //     usdValue = value;
    //   });
    // })
    accountsData.push({
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
      followerCount: '',
      followingCount: '',
      usdValue: ''
    });
  });

  return accountsData;
}
