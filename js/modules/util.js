export let URL = window.location.href;

export function calcRelativeAge(date) {
  let now = moment();
  let dateCalc = moment(date);
  let calcDiff = dateCalc.diff(now);

  var age = moment.duration(calcDiff);
  let relativeAge = `${-age.days()}D`

  if(-age.months() >= 1 )
    relativeAge = `${-age.months()}M - ${-age.days()}D`

  if(-age.years() >= 1 )
    relativeAge = `${-age.years()}Y - ${-age.months()}M`

  return relativeAge;
}

export function removeDuplicates(myArr, prop) {
    return myArr.filter((obj, pos, arr) => {
        return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
    });
}

export function getQueryParams() {
   let query = window.location.search.substring(1);
   let allParams = query.split("&");

   return allParams.map(value => {
       let item = value.split('=');
       return [item[0], item[1]];
   })
}

export function getValueListFromParams() {
    let paramArr = getQueryParams()
    let list = (paramArr[0][1] !== undefined && paramArr[0][1] !== '') ? paramArr.map(param => param[1]) : false
    return list
}

export function setQueryUrl(userNameArray) {
  let baseurl = window.location.href
  let url = baseurl.split('?')[0] + '?'
  for (let i = 0; i < userNameArray.length; i++) {
    url = url + `user${i}=${userNameArray[i]}&`
  }
  let finalUrl = url.slice(0, -1);
  history.pushState(null, null, finalUrl);
  URL = finalUrl
}

export function setURL(value){
  URL = value
}
