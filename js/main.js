// import * as util from './modules/util.js'
import * as ui from './modules/uiActions.js'
import * as steemActions from './modules/steemActions.js'

export let mixer;
const STEEM_SERVER = 'https://api.steemit.com'
// UI CONTROLS
ui.initUiActions();

// INIT!!

$(document).ready(() => {
  $('h1').fitText(1.5);

  mixer = mixitup('.grid',{
    selectors: {
       target: '.grid-item'
   },
   animation: {
       queue : true,
       duration: 200,
       queueLimit: 50
   }
  });
})

//setups

steemActions.getGlobalProps(STEEM_SERVER)
  .then(steemActions.checkForUsersAndSearch())
