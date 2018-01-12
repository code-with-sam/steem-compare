import * as util from './util.js'

import {mixer} from '../main.js'

let vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    totalVestingShares,
    totalVestingFundSteem = null;

export let displayedAccounts = [];
// let $grid;

export function updateDisplayedAccounts(op, value) {
  if (op === 'update'){
      displayedAccounts = value
  } else if (op === 'remove'){
      displayedAccounts.splice(value, 1);
  }
}

const defaultUserNames = ['utopian-io', 'busy.org', 'blocktrades', 'sambillingham', 'kevinwong'];

export function checkForUsersAndSearch(){
  let list = util.getValueListFromParams()
  if(!list) {
    addUsers(defaultUserNames, true)
  } else {
    addUsers(list, true)
  }
}

export function addUsers(users){
  var sort = ($('.mixitup-control-active').length) ? $('.mixitup-control-active').data('btn-sort') : false
  getAccounts(users)
    .then(data => proccessData(data))
    .then(data => displayAccounts(data, sort))
}

export function displayAccounts(newAccounts, sortValue ){

  let allAccounts = displayedAccounts.concat(newAccounts);
  let allAccountsNoDup = util.removeDuplicates(allAccounts, 'name');
  displayedAccounts = allAccountsNoDup

  mixer.remove('.grid-item')

  allAccountsNoDup.forEach(user => {
    let template =
      `<div class="grid-item col-xl-15 col-lg-3 col-md-4 col-6 name-${(user.name).replace(/\./g, '-')}"
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

        mixer.append(template);

  })



  if(sortValue){
    let reSort = $('*[data-btn-sort="' + sortValue + '"]').data('sort')

    mixer.sort(reSort)
    mixer.forceRefresh();
  } else {
    let accountsNamesForUrl = displayedAccounts.map( user => user.name )
    util.setQueryUrl(accountsNamesForUrl)
  }
}

export function getGlobalProps(server){
  steem.api.setOptions({ url: server });
  return steem.api.getDynamicGlobalProperties((err, result) => {
    totalVestingShares = result.total_vesting_shares;
    totalVestingFundSteem = result.total_vesting_fund_steem;
  })
}


export function getAccounts(accountNames){
    return steem.api.getAccounts(accountNames, (err, response) => response )
};

export function proccessData(accounts){

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
      accountAge: util.calcRelativeAge(user.created)
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



export function findAvailableSteemApi(){
  return new Promise((resolve, reject) => {
    const apiServers =  [
            'wss://rpc.buildteam.io',
            'wss://steemd.pevo.science']

    let connections = []
    let availableServers = [];
    apiServers.forEach( (s,i,arr) => {
      availableServers.push( new Promise((resolveList, rej) => {

        connections[i] = new WebSocket(apiServers[i])
        connections[i].onerror = (err) => {
          console.warn(`Can\'t connect to ${apiServers[i]}, trying next server...`)
        }
        connections[i].onopen = () => {
          resolveList(apiServers[i])
          connections[i].close()
        }
      }))
    })
    Promise.all(availableServers).then( data => {
      if (data.length >= 1){
          resolve(data[0]);
      } else {
          reject()
      }
    })
  })
}
