import * as steem from './steemActions.js'
import * as util from './util.js'
import {mixer} from '../main.js'

export function initUiActions(){
    $(document).ready(() => {
        $('.grid').on('click', '.remove-user', (e) => {
          let user = $(e.currentTarget).parent().data('name');
          let index = steem.displayedAccounts.findIndex(item => item.name === user.substr(1));
          let target = '.name-'+ (user.substr(1)).replace(/\./g, '-');

          steem.updateDisplayedAccounts('remove', index);

          mixer.remove(target)
        });

        $('.search-btn').on('click', (e) => {
          let data = $('.search').val();
          let users = data.split(',').map(user => user.trim() );
          steem.addUsers(users, false)
        });

        $('.clear-btn').on('click', (e) => {

          $('.mixitup-control-active').removeClass('mixitup-control-active')
          mixer.remove('.grid-item')
          steem.updateDisplayedAccounts('update', []);
        })

        $('.share-btn').on('click', (e) => {
            $('.share-btn').attr('data-clipboard-text', util.URL)
            var clipboard = new Clipboard('.share-btn');
            $('.share-btn-text').text('Link Copied').addClass('active')
            setTimeout( () => $('.share-btn-text').removeClass('active'), 1500)
            history.pushState(null, null, util.URL);
            e.preventDefault()
        })
    })
}
