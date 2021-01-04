const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}



async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return token;
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    message('Hello!', false)
  }

  async function queryCat() {
    await message(agent.query, true)
    await message('We sell a wide variety of hats, sweatshirts, plushes, leggins, tees, and bottoms.', false)
  }
  
  async function queryTag() {
    let cat = agent.parameters.category
    message(agent.query, true)
    if (cat) {
      let request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        redirect: 'follow'
      }
      const serverReturn = await fetch(ENDPOINT_URL + '/categories/' + cat + '/tags', request)
      const serverResponse = await serverReturn.json()
      await message("We have a wide vareity of "+ cat + " that include...", false)
      let i
      for (i = 0; i < serverResponse.tags.length; i++) {
        await message(serverResponse.tags[i] + " " + cat, false)
      }
    }else {
      await message("I'm sorry, we don't have that type of item.", false )
    }
    

  }

  async function queryCart() {
    message(agent.query, true)
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
        'x-access-token': token},
      redirect: 'follow'
    }
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products/', request)
    const serverResponse = await serverReturn.json()
    if (serverResponse.products.length !== 0) {
      await message("Looks like you have a few items in your cart including...", false)
      let i
      for (i = 0; i < serverResponse.products.length; i++) {
        if (serverResponse.products[i].count === 1) {
          await message(serverResponse.products[i].count +" unit of " + serverResponse.products[i].name, false)
        }
        else {
          await message(serverResponse.products[i].count +" units of " + serverResponse.products[i].name, false)
        }
        
      }
      let dollars = 0;
      for (i = 0; i < serverResponse.products.length; i++) {
        dollars += (serverResponse.products[i].price * serverResponse.products[i].count)
        
      }
      await message("Which makes your current cart total " + dollars + " dollars.", false)
    }
    else {
      await message("Looks like your cart is empty!", false)
    }
   
  }

  async function queryProduct() {
    await message(agent.query, true)
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      redirect: 'follow'
    }
    const serverReturn = await fetch(ENDPOINT_URL + '/products/', request)
    const serverResponse = await serverReturn.json()
    let product = agent.parameters.Products
    let id
    let desc
    let price
    let i
    for (i = 0; i < serverResponse.products.length; i++) {
      if (serverResponse.products[i].name === product) {
        id = serverResponse.products[i].id
        desc = serverResponse.products[i].description
        price = serverResponse.products[i].price
      }
    }

    request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      redirect: 'follow'
    }
    const serverReturn2 = await fetch(ENDPOINT_URL + '/products/' + id + '/reviews', request)
    const serverResponse2 = await serverReturn2.json()
    await message(desc, false)
    await message("They are " + price + " dollars.", false)
    if (serverResponse2.reviews.length > 0 ){
      await message("Here are some reviews about this product for you!", false)
      let stars = 0;
      let text;
      for (i = 0; i < serverResponse2.reviews.length; i++) {
        text = serverResponse2.reviews[i].text
        stars = serverResponse2.reviews[i].stars
        await message(stars + " Stars. " + text, false)
        
      }
    } else {
      await message("Sadly, they don't have any reviews yet.", false)
    }
    
  }

  async function showTag() {
    await message(agent.query, true)
    let tag = agent.parameters.Tags
    
    let request = {
      method: 'POST',
      headers: {'Content-Type': 'application/json',
      'x-access-token': token},
      redirect: 'follow'
    }
    const serverReturn = await fetch(ENDPOINT_URL + '/application/tags/' + tag, request)
    await message("Here are your filtered results!")
  }

  async function addCart() {
    await message(agent.query, true)
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      redirect: 'follow'
    }
    const serverReturn = await fetch(ENDPOINT_URL + '/products/', request)
    const serverResponse = await serverReturn.json()
    let product = agent.parameters.Products
    let id
    let i
    for (i = 0; i < serverResponse.products.length; i++) {
      if (serverResponse.products[i].name.toLowerCase() === product.toLowerCase()) {
        id = serverResponse.products[i].id
      }
    }
    if (id) {
      request = {
        method: 'POST',
        headers: {'Content-Type': 'application/json',
        'x-access-token': token},
        redirect: 'follow'
      }
      for (i = 0 ; i < agent.parameters.Number; i++ ){
        await fetch(ENDPOINT_URL + '/application/products/' + id, request)
      }
      if (agent.parameters.Number === 1) {
        message("Item has been added to your cart.", false)
      } else {
        message("Item(s) have been added to your cart.", false)
      }
    } else {
      message("Sorry, I couldn't add that item", false)
    }

    
    
    
  }

  async function removeCart() {
    message(agent.query, true)
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
      redirect: 'follow'
    }
    const serverReturn = await fetch(ENDPOINT_URL + '/products/', request)
    const serverResponse = await serverReturn.json()
    let product = agent.parameters.Products
    let id
    let i
    for (i = 0; i < serverResponse.products.length; i++) {
      if (serverResponse.products[i].name.toLowerCase() === product.toLowerCase()) {
        id = serverResponse.products[i].id
        
      }
    }

    request = {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json',
      'x-access-token': token},
      redirect: 'follow'
    }
    await fetch(ENDPOINT_URL + '/application/products/' + id, request)
    message(product + " has been deleted from your cart.", false)
  }

  async function clearCart() {
    message(agent.query, true)
    let request = {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json',
      'x-access-token': token},
      redirect: 'follow'
    }
    await fetch(ENDPOINT_URL + '/application/products', request)
    await message("Your cart has been cleared.", false)
  }

  async function cartConfirm() {
    await queryCart()
    let request = {
      method: 'PUT',
      headers: {'Content-Type': 'application/json',
      'x-access-token': token},
      redirect: 'follow',
      body: JSON.stringify({
        page: "/" + username + "/cart-review"})
    }
    await fetch(ENDPOINT_URL + '/application', request)
    await message("Are you sure you would like to purchase these items?", false)
  }

  async function cartConfirmY() { 
    message(agent.query, true)
    let request = {
      method: 'PUT',
      headers: {'Content-Type': 'application/json',
      'x-access-token': token},
      redirect: 'follow',
      body: JSON.stringify({
        page: "/" + username + "/cart-confirmed"})
    }
    await fetch(ENDPOINT_URL + '/application', request)
    await message("Your order has been placed! Thanks for shopping at WiscShop!", false)
  }

  async function navigate() {
    message(agent.query, true)

    if (agent.parameters.Pages) {
      if (agent.parameters.Pages === "home" && token) {
        let request = {
          method: 'PUT',
          headers: {'Content-Type': 'application/json',
          'x-access-token': token},
          redirect: 'follow',
          body: JSON.stringify({
            page: "/" + username })
        }
        await fetch(ENDPOINT_URL + '/application', request)
        await message("Sure, I can take you there now.", false)
      } 
      else if (agent.parameters.Pages === "home" && !token){
        let request = {
          method: 'PUT',
          headers: {'Content-Type': 'application/json',
          'x-access-token': token},
          redirect: 'follow',
          body: JSON.stringify({
            page: "/"})
        }
        await fetch(ENDPOINT_URL + '/application', request)
        await message("Sure, I can take you there now.", false)
      }
      else if (agent.parameters.Pages === "cart" ) {
        if (token) {
          let request = {
            method: 'PUT',
            headers: {'Content-Type': 'application/json',
            'x-access-token': token},
            redirect: 'follow',
            body: JSON.stringify({
              page: "/" + username + "/cart"})
          }
          await fetch(ENDPOINT_URL + '/application', request)
          await message("Sure, I can take you there now.", false)
        } else {
          await message("You have to be logged in for that.", false)
        }
      } else  {
        let request = {
          method: 'PUT',
          headers: {'Content-Type': 'application/json',
          'x-access-token': token},
          redirect: 'follow',
          body: JSON.stringify({
            page: "/" + agent.parameters.Pages})
        }
        await fetch(ENDPOINT_URL + '/application', request)
        await message("Sure, I can take you there now.", false)
      }
      
    }
    else if(agent.parameters.category) {
      let request = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
        'x-access-token': token},
        redirect: 'follow',
        body: JSON.stringify({
          page: "/" + username + "/" + agent.parameters.category.toLowerCase()})
      }
      await fetch(ENDPOINT_URL + '/application', request)
      await message("Sure, I can take you there now.", false)
      
    }
    else if(agent.parameters.Products) {
      let request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
        redirect: 'follow'
      }
      const serverReturn = await fetch(ENDPOINT_URL + '/products/', request)
      const serverResponse = await serverReturn.json()
      let product = agent.parameters.Products
      let category
      let id
      let i
      for (i = 0; i < serverResponse.products.length; i++) {
        if (serverResponse.products[i].name.toLowerCase() === product.toLowerCase()) {
          id = serverResponse.products[i].id
          category = serverResponse.products[i].category
        }
      }
      if (id) {
        request = {
          method: 'PUT',
          headers: {'Content-Type': 'application/json',
          'x-access-token': token},
          redirect: 'follow',
          body: JSON.stringify({
            page: "/" + username + "/" + category + "/products/" + id})
        }
        await fetch(ENDPOINT_URL + '/application', request)
        await message("Sure, I can take you there now.", false)
      } else {
        message("Sorry, I can't find that item.", false)
      }
    }
    else {
      message("Sorry, I can't take you there.", false)
    }
  }

  async function message(text, isUser) {
    if (!isUser) {
      agent.add(text)
    }
    let request = {
      method: 'POST',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      redirect: 'follow',
      body: JSON.stringify({
        date: new Date(),
        text: text,
        isUser: isUser})

    }
    const res = await fetch(ENDPOINT_URL + '/application/messages', request)
  }

  async function clearMessage() {
    let request = {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      redirect: 'follow',
    }
    const res = await fetch(ENDPOINT_URL + '/application/messages', request)
  }

  async function login () {
    
    username = agent.parameters.username
    password = agent.parameters.password
    await getToken()
    
    if (token) {
      await clearMessage()
      await message('Successfully logged in as ' + username, false)
    } else {
      await message('Sorry, I could not access you account.', false)
    }
  }


  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  intentMap.set('Login', login)
  intentMap.set('QueryCat', queryCat)
  intentMap.set('QueryTags', queryTag)
  intentMap.set('QueryCart', queryCart)
  intentMap.set('QueryProduct', queryProduct)
  intentMap.set('ShowTag', showTag)
  intentMap.set('addCart', addCart)
  intentMap.set('removeCart', removeCart)
  intentMap.set('clearCart', clearCart)
  intentMap.set('cartConfirm', cartConfirm)
  intentMap.set('cartConfirm - yes', cartConfirmY)
  intentMap.set('Navigate', navigate)

  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
