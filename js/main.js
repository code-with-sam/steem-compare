let vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

// UI CONTROLS
$('.grid').on('click', '.remove-user', (e) => $(e.currentTarget).parent().remove());

$('.search-btn').on('click', (e) => {
  let data = $('.search').val();
  let users = data.split(',').map(user => user.trim() );
  addUsers(users)
});

//setups
getGlobalProps()
  // for testing only
  .then( addUsers(['ned', 'dan', 'blocktrades']))
  // testing

function addUsers(users){
  getAccounts(users)
    .then(data => proccessData(data))
    .then(data => displayAccounts(data))
}

function displayAccounts(accounts){
  let $grid = $('.grid');

  accounts.forEach(user => {
    let template =
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
      $grid.append(template);
  })

}

function getGlobalProps(){
  return steem.api.getDynamicGlobalProperties((err, result) => {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
}


function getAccounts(accountNames){
    return steem.api.getAccounts(accountNames, (err, response) => response )
};

function proccessData(accounts){

  let accountsData = [];

  let processAllData = new Promise((resolve, reject) => {

  accounts.forEach( user => {
    // store meta Data
    let jsonData = user.json_metadata ? JSON.parse(user.json_metadata).profile : {}

    // steem power calc
    let vestingShares = user.vesting_shares;
    let delegatedVestingShares = user.delegated_vesting_shares;
    let receivedVestingShares = user.received_vesting_shares;
    let steemPower = steem.formatter.vestToSteem(vestingShares, totalVestingShares, totalVestingFundSteem);
    let delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
    let outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

    // vote power calc
    let lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
    let votePower = user.voting_power += (10000 * lastVoteTime / 432000);
    votePower = Math.min(votePower / 100, 100).toFixed(2);

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

  let followerAndFollowingCount = accountsData.map( user => steem.api.getFollowCount(user.name))

  Promise.all(followerAndFollowingCount)
    .then(data => {
        for (let i = 0; i < data.length; i++) {
          accountsData[i].followerCount = data[i].follower_count
          accountsData[i].followingCount = data[i].following_count
        }
    })

  let usdValues = accounts.map( user => steem.formatter.estimateAccountValue(user) )

  Promise.all(usdValues)
    .then(data => {
        for (let i = 0; i < data.length; i++) {
          accountsData[i].usdValue = data[i]
        }
        resolve(accountsData);
    })

  });

  return processAllData;
}
