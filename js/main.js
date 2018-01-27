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
       duration: 0,
       queueLimit: 500
   }
  });
})

//setups
if ($('body').hasClass('user-compare')){
  steemActions.getGlobalProps(STEEM_SERVER)
    .then(steemActions.checkForUsersAndSearch())
}

if ($('body').hasClass('follower-compare')){
  steem.api.getFollowers('sambillingham', '', 'blog', 1000, function(err, result) {
      // let followers = result.reduce( (a,b) => a + ', ' + b.follower )
      let followers = result.map( (user) => user.follower )

      console.log(followers)
      steemActions.getGlobalProps(STEEM_SERVER)
        .then( () => {
          steemActions.addUsers(followers, true)
      })

  });

}
