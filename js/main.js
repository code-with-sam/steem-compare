let vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

let displayedAccounts = [];
let $grid;

let mixer;

// UI CONTROLS
$('.grid').on('click', '.remove-user', (e) => {
  let user = $(e.currentTarget).parent().data('name');
  let index = displayedAccounts.findIndex(item => item.name === user.substr(1));
  displayedAccounts.splice(index, 1);
  $(e.currentTarget).parent().remove()
});

$('.search-btn').on('click', (e) => {
  let data = $('.search').val();
  let users = data.split(',').map(user => user.trim() );
  addUsers(users)
});

$('.clear-btn').on('click', (e) => {
  $('.grid').empty()
  displayedAccounts = [];
})

$(document).ready(() => {
  $('h1').fitText(1.5);
})

//setups
getGlobalProps()
  // for testing only
  .then( addUsers(['utopian-io', 'busy.org', 'blocktrades', 'sambillingham', 'kevinwong']))
  // testing


function addUsers(users){
  getAccounts(users)
    .then(data => proccessData(data))
    .then(data => displayAccounts(data))
}

function displayAccounts(newAccounts){

  let allAccounts = displayedAccounts.concat(newAccounts);
  let allAccountsNoDup = removeDuplicates(allAccounts, 'name');
  displayedAccounts = allAccountsNoDup
  console.log(displayedAccounts)

  $('.grid').empty();

  $grid = $('.grid');

  allAccountsNoDup.forEach(user => {
    let template =
      `<div class="grid-item col-xl-15 col-lg-3 col-md-4 col-6"
        data-name="@${user.name}"
        data-reputation="${user.rep}"
        data-steempower="${ user.effectiveSp }"
        data-value="${user.usdValue}"
        data-postcount="${user.numOfPosts}"
        data-followers="${user.followerCount}"
        data-accountage="${user.accountAgeMilliseconds}" >

      <a href="https://steemit.com/@${user.name}" class="user-link"><img src="${user.image}" class="rounded-circle" height="80px" width="80px"></a>
      <li><a href="https://steemit.com/@${user.name}" class="user-value user-name user-link">${user.name}</a> <span class="badge badge-secondary">${user.rep}</span></li>
      <li>EFFECTIVE SP: <span class="user-value">${ (user.effectiveSp).toLocaleString() }</span></li>
      <li>STEEMPOWER: <span class="user-value">${user.sp} <br><span class="steam-calc">(+ ${user.delegatedSpIn} - ${user.delegatedSpOut})</span></span></li>

      <li>
        <div class="progress">
          <div class="progress-bar progress-bar-striped" role="progressbar" style="width: ${user.vp}%;" aria-valuenow="${user.vp}" aria-valuemin="0" aria-valuemax="100">Vote Power ${user.vp}%</div>
          </div>
      </li>

      <li>STEEM BALANCE: <span class="user-value">${parseInt(user.steem)}</span></li>
      <li>SBD Balance: <span class="user-value">${parseInt(user.sbd)}</span></li>
      <li>POSTS: <span class="user-value">${user.numOfPosts}</span></li>

      <li>Followers: <span class="user-value">${user.followerCount}</span></li>
      <li>Following: <span class="user-value">${user.followingCount}</span></li>

      <li>Age: <span class="user-value">${ (user.accountAge) }</span></li>

      <li><span class="user-value">💵 $${(user.usdValue).toLocaleString()}</span></li>

      <button type="button" class="btn btn-secondary btn-sm remove-user"> X Remove</button>
      </div>`;
      $grid.append(template);
  })

  mixer = mixitup('.grid',{
    selectors: {
       target: '.grid-item'
   },
   animation: {
       duration: 300
   }
  });



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
    let delegatedSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem);
    let outgoingSteemPower = steem.formatter.vestToSteem((receivedVestingShares.split(' ')[0]-delegatedVestingShares.split(' ')[0])+' VESTS', totalVestingShares, totalVestingFundSteem) - delegatedSteemPower;

    // vote power calc
    let lastVoteTime = (new Date - new Date(user.last_vote_time + "Z")) / 1000;
    let votePower = user.voting_power += (10000 * lastVoteTime / 432000);
    votePower = Math.min(votePower / 100, 100).toFixed(2);

    accountsData.push({
      name: user.name,
      image: jsonData.profile_image ? 'https://steemitimages.com/2048x512/' + jsonData.profile_image : '',
      rep: steem.formatter.reputation(user.reputation),
      effectiveSp: parseInt(steemPower  + delegatedSteemPower - -outgoingSteemPower),
      sp: parseInt(steemPower).toLocaleString(),
      delegatedSpIn: parseInt(delegatedSteemPower).toLocaleString(),
      delegatedSpOut: parseInt(-outgoingSteemPower).toLocaleString(),
      vp: votePower,
      steem: user.balance.substring(0, user.balance.length - 5),
      sbd: user.sbd_balance.substring(0, user.sbd_balance.length - 3),
      numOfPosts: user.post_count,
      followerCount: '',
      followingCount: '',
      usdValue: '',
      accountAgeMilliseconds: moment(user.created).valueOf(),
      accountAge: calcRelativeAge(user.created)
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
          accountsData[i].usdValue = parseInt(data[i])
        }
        resolve(accountsData);
    })

  });

  return processAllData;
}

function calcRelativeAge(date){
  let now = moment();
  let dateCalc = moment(date);
  let calcDiff = dateCalc.diff(now);
  console.log(now)
  console.log(dateCalc)

  var age = moment.duration(calcDiff);

  let relativeAge = `${-age.days()}D`

  console.log(-age.days(), 'days')
  console.log(-age.months(), 'months')
  console.log(-age.years(), 'years')

  if(-age.months() >= 1 )
    relativeAge = `${-age.months()}M - ${-age.days()}D`

  if(-age.years() >= 1 )
    relativeAge = `${-age.years()}Y - ${-age.months()}M`

  return relativeAge;
}

function removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
}
