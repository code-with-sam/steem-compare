var vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

$('.grid').on('click', '.remove-user', function(){
  $(this).parent().remove();
});

$('.search-btn').on('click', function(){
  let data = $('.search').val();
  let users = data.split(',').map(function(user) {
    return user.trim();
  });
  // console.log(users);
  addUsers(users)
});

function addUsers(users){
  getAccounts(users).then(function(data){

      displayAccounts(proccessData(data));
  });
}

getGlobalProps()
  .then(function(){
    return getAccounts(['ned', 'dan', 'blocktrades'])
  })
  .then(function(data){

    proccessData(data).then((data) => {
      console.log(data)
      displayAccounts(data);

    })
    // console.log(data)
    // console.log(proccessData(data));

    // displayAccounts(proccessData(data));
  })


function displayAccounts(accounts){
  var $grid = $('.grid');

  accounts.forEach(function(user){
    // console.log(user);
    var template =
      `<div class="col-md-3 col-sm-4">
      <img src="${user.image}" class="rounded-circle" height="100px" width="100px">
      <h2>${user.name} <span class="badge badge-secondary">${user.rep}</span></h2>
      <h3>STEAM POWER: ${user.sp}</h3>
      <h3>STEAM POWER: ${user.sp} + ${user.delegatedSpIn} - ${user.delegatedSpOut}</h3>

      <div class="progress">
        <div class="progress-bar progress-bar-striped" role="progressbar" style="width: ${user.vp}%;" aria-valuenow="${user.vp}" aria-valuemin="0" aria-valuemax="100">${user.vp}% </div>
      </div>

      <h4>STEEM BALANCE: ${user.steem}</h4>
      <h4>SBD Balance: ${user.sbd}</h4>
      <h4>POSTS: ${user.numOfPosts}</h4>

      <h4>FollowerCount: ${user.followerCount}</h4>
      <h4>FollowingCount: ${user.followingCount}</h4>
      <h4>💵 USD: ${user.usdValue}</h4>

      <button type="button" class="btn btn-dark remove-user">Remove</button>
      </div>`;
      // console.log(template)
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

  let processAllData = new Promise((resolve, reject) => {
  // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
  // In this example, we use setTimeout(...) to simulate async code.
  // In reality, you will probably be using something like XHR or an HTML5 API.


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

  var promises = [];
  // accountsData.forEach() => { }
  for (var i = 0; i < accountsData.length; i++) {
    promises.push( steem.api.getFollowCount( accountsData[i].name ))
  }
  Promise.all(promises)
    .then((data) => {
        for (var i = 0; i < data.length; i++) {
          accountsData[i].followerCount = data[i].follower_count
          accountsData[i].followingCount = data[i].following_count
        }
    })

  var usdValues = [];

  for (var i = 0; i < accountsData.length; i++) {
    usdValues.push(steem.formatter.estimateAccountValue( accounts[i]))
  }

  Promise.all(usdValues)
    .then((data) => {
        for (var i = 0; i < data.length; i++) {
          accountsData[i].usdValue = data[i]
        }
        resolve(accountsData); // return promise
    })

  });

  return processAllData;

}
