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

export function addUsers(users, sortType){
  var sort = ($('.mixitup-control-active').length) ? $('.mixitup-control-active').data('btn-sort') : false
  getAccounts(users)
    .then(data => proccessData(data) )
    .then(data => displayAccounts(data, sort))
}

export function displayAccounts(newAccounts, sortValue ){
  NProgress.inc()

  console.log(newAccounts)
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

      <a href="https://steemit.com/@${user.name}" class="user-link"><img src="${user.image}" onerror="this.src='img/default-user.jpg'" class="rounded-circle" height="80px" width="80px"></a>
      <li><a href="https://steemit.com/@${user.name}" class="user-value user-name user-link">${user.name}</a> <span class="badge badge-secondary">${user.rep}</span></li>
      <li>EFFECTIVE SP: <span class="user-value">${ (user.effectiveSp).toLocaleString() }</span></li>
      <li>STEEMPOWER: <span class="user-value">${user.sp} <br><span class="steam-calc">(+ ${user.delegatedSpIn} - ${user.delegatedSpOut})</span></span></li>

      <li>
        <div class="progress">
          <div class="progress-bar--content">Vote Power ${user.vp}%</div>
          <div class="progress-bar progress-bar-striped" role="progressbar" style="width: ${user.vp}%;" aria-valuenow="${user.vp}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
      </li>

      <li>STEEM BALANCE: <span class="user-value">${parseInt(user.steem)}</span></li>
      <li>SBD Balance: <span class="user-value">${parseInt(user.sbd)}</span></li>
      <li>POSTS: <span class="user-value">${user.numOfPosts}</span></li>

      <li>Followers: <span class="user-value">${user.followerCount}</span></li>
      <li>Following: <span class="user-value">${user.followingCount}</span></li>

      <li>Age: <span class="user-value">${ (user.accountAge) }</span></li>

      <li  class="user-extra-stat">Average Replies: <span class="user-value ">${ Math.round(user.averageReplies) }</span></li>
      <li class="user-extra-stat">Average Votes: <span class="user-value ">${ Math.round(user.averageVotes) }</span></li>
      <li class="user-extra-stat">Average Word Count: <span class="user-value ">${ Math.round(user.wordCount) }</span></li>

      <li><span class="user-value">💵 $${(user.usdValue).toLocaleString()}</span></li>

      <button type="button" class="btn btn-secondary btn-sm remove-user user-extra-stat"> X Remove</button>
      </div>`;

        mixer.append(template);

  })



  if(sortValue){
    let reSort = $('*[data-btn-sort="' + sortValue + '"]').data('sort')

    mixer.sort(reSort)
    mixer.forceRefresh();
  } else {
    mixer.sort('reputation:desc')
    mixer.forceRefresh();

    let accountsNamesForUrl = displayedAccounts.map( user => user.name )
    util.setQueryUrl(accountsNamesForUrl)
  }
  NProgress.done();
}

export function getGlobalProps(server){
  return new Promise((resolve, reject) => {
    steem.api.setOptions({ url: server });
    steem.api.getDynamicGlobalProperties((err, result) => {
      totalVestingShares = result.total_vesting_shares;
      totalVestingFundSteem = result.total_vesting_fund_steem;
      resolve()
    })
  })
}


export function getAccounts(accountNames){
    return steem.api.getAccountsAsync(accountNames)
};

export function proccessData(accounts){
  NProgress.inc()
  let accountsData = [];

  let processAllData = new Promise((resolve, reject) => {
    let USER_COMPARE = $('body').hasClass('user-compare')
  accounts.forEach( user => {

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

    let profileImage = 'img/default-user.jpg';

    if (user.json_metadata == '' ||
        user === undefined ||
        user.json_metadata == 'undefined' ||
        user.json_metadata === undefined ) {
      user.json_metadata = { profile_image : ''}
    } else {
      user.json_metadata = user.json_metadata ? JSON.parse(user.json_metadata).profile : {};
    }

    if (user.json_metadata === undefined){
      user.json_metadata = { profile_image : ''}
    }
    profileImage = user.json_metadata.profile_image ? 'https://steemitimages.com/2048x512/' + user.json_metadata.profile_image : '';

    accountsData.push({
      name: user.name,
      image: profileImage,
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

  let followerAndFollowingCount = accountsData.map( user => steem.api.getFollowCountAsync(user.name))

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
        if (!USER_COMPARE){
          resolve(accountsData);
        }
    })

      if (USER_COMPARE){
        NProgress.inc()
        let extraStats = accounts.map( user => getStats(user.name))

        Promise.all(extraStats)
        .then(data => {
          for (let i = 0; i < data.length; i++) {
            accountsData[i].averageVotes = data[i].averageVotes
            accountsData[i].averageReplies = data[i].averageReplies
            accountsData[i].wordCount = data[i].wordCount
          }
          resolve(accountsData);
        })
      }

  })

  return processAllData;
}

function getStats(username){
    return new Promise( (resolve,reject) => {
      steem.api.getState(`/@${username}/`, (err, result) => {
        let resultsArray = [];
        for ( let post in result.content ){
          console.log(post)
          resultsArray.push({
            votes: result.content[post].net_votes,
            replies: result.content[post].children,
            length: result.content[post].body.split(' ').length
          })
        }
         resolve({
          averageVotes: resultsArray.reduce((a,b) => a + b.votes, 0) / resultsArray.length,
          averageReplies: resultsArray.reduce((a,b) => a + b.replies, 0) / resultsArray.length,
          wordCount:  resultsArray.reduce((a,b) => a + b.length, 0) / resultsArray.length
        })
      })
    })
}
