// external packages
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(bodyParser.urlencoded({
    extended: true
}));
webApp.use(bodyParser.json());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

const APICALLS = require('../helper-functions/apiCalls');
const WA = require('../helper-functions/waSendMsg');
const DF = require('../helper-functions/dialogflowFunctions');
const FM = require('../helper-functions/fbSendMsg');

const IMAGEURL = process.env.IMAGEURL;
const WEBHOOKTOKEN = process.env.WEBHOOKTOKEN;

// Welcome Action
const welcomeAction = async (req) => {

    /* TODO
    Get all the restaurants
    */

    let session = req.body.session;
    let sessionVars = `${session}/contexts/session-vars`;

    let restaurants = [];

    try {
        restaurants = await APICALLS.getAllRestaurants();
    } catch (error) {
        console.log(`Error at getAllRestaurants FB. ${error}`);
    }

    let outString = 'Hello, thank you for messaging us. Please select a restaurant: ';

    for (let index = 1; index <= restaurants.length; index++) {
        const ar = restaurants[index - 1];
        if (index == restaurants.length) {
            outString += `${index}. ${ar.name}.`;
        } else {
            outString += `${index}. ${ar.name}, `;
        }
    };

    let responseText = {
        fulfillmentText: outString,
        outputContexts: [{
            name: sessionVars,
            lifespanCount: 50,
            parameters: {
                restaurants: restaurants
            }
        }]
    };

    return responseText;
};

// User provides restaurant
const userProvidesRestaurant = async (req) => {

    /* TODO
    Get all the menu items on restaurant
    set the restaurants in the session
    */

    let responseText;

    let session = req.body.session;
    let sessionVars = `${session}/contexts/session-vars`;

    let rId = req.body.queryResult.parameters.restaurant;

    // If the response is out of range
    let outputContexts = req.body.queryResult.outputContexts;
    let restaurants = [];

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session-vars')) {
            restaurants = outputContext.parameters.restaurants;
        }
    });

    if (restaurants.length <= rId - 1) {

        let awaitRestaurants = `${session}/contexts/await-restaurant`;

        responseText = {
            fulfillmentText: 'Please select a valid number from the restaurants.',
            outputContexts: [{
                name: awaitRestaurants,
                lifespanCount: 1,
            }]
        };
    } else {
        let menuItems = await APICALLS.getAllMenuItems(rId);

        responseText = {
            fulfillmentText: JSON.stringify({ menuItems: menuItems }),
            outputContexts: [{
                name: sessionVars,
                lifespanCount: 50,
                parameters: {
                    menuItems: menuItems
                }
            }]
        };
    }

    return responseText;
};

// User provides menu item
const userProvidesMenuItem = (req) => {

    /* TODO
    set the menu items in the session
    */

    let responseText;
    let session = req.body.session;
    let mId = req.body.queryResult.parameters.menuItem;

    // If the response is out of range
    let outputContexts = req.body.queryResult.outputContexts;
    let menuItems = [];

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session-vars')) {
            menuItems = outputContext.parameters.menuItems;
        }
    });

    if (menuItems.length <= mId - 1) {

        let awaitMenuItems = `${session}/contexts/await-menuitem`;

        responseText = {
            fulfillmentText: 'Please select a valid number from the menu items.',
            outputContexts: [{
                name: awaitMenuItems,
                lifespanCount: 1,
            }]
        };
    } else {
        responseText = {
            fulfillmentText: 'Please send the quantity.',
        };
    }

    return responseText;
};

// User provides quantity
const userProvidesQuantity = (req) => {

    /* TODO
    add the item to cart
    */

    let session = req.body.session;
    let sessionVars = `${session}/contexts/session-vars`;

    let outputContexts = req.body.queryResult.outputContexts;
    let cartItems, mid, quantity;

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session-vars')) {
            mid = outputContext.parameters.menuItem;
            quantity = outputContext.parameters.quantity;
            if (outputContext.parameters.hasOwnProperty('cartItems')) {
                cartItems = outputContext.parameters.cartItems;
            } else {
                cartItems = [];
            }
        }
    });

    cartItems.push({
        mid,
        quantity
    });

    let responseText = {
        fulfillmentText: `Added to the cart. Do you want to add anything else? Yes/No`,
        outputContexts: [{
            name: sessionVars,
            lifespanCount: 50,
            parameters: {
                cartItems: cartItems
            }
        }]
    };
    return responseText;
};

// Generate cart for the user
const showCart = (req) => {

    /* TODO
    generate cart for the user
    */

    let outputContexts = req.body.queryResult.outputContexts;
    let cartItems, menuItems;

    outputContexts.forEach(outputContext => {
        let session = outputContext.name;
        if (session.includes('/contexts/session-vars')) {
            cartItems = outputContext.parameters.cartItems;
            menuItems = outputContext.parameters.menuItems;
        }
    });

    let outString = 'Alright, here is your cart detais: ';

    let totalAmount = 0.0;

    for (let index = 0; index < cartItems.length; index++) {
        const ci = cartItems[index];
        let mid = Number(ci.mid) - 1;
        let quantity = Number(ci.quantity);
        let itemName = menuItems[mid].name;
        let price = Number(menuItems[mid].price);

        totalAmount += quantity * price;

        if (index == cartItems.length - 1) {
            outString += `${itemName} at Rs ${price} quantity ${quantity}. `;
        } else {
            outString += `${itemName} at Rs ${price} quantity ${quantity}, `;
        }
    }

    outString += `Total amount ${totalAmount.toFixed(2)}. Confirm your cart. Yes/No`;

    let responseText = {
        fulfillmentText: outString,
    }
    return responseText;
}

// User selects to collect the order
const orderCollect = (req) => {

    /* TODO
    user select to collect the order
    create new order
    */

    let responseText = {
        fulfillmentText: `Thanks, Your order is placed, and awaiting for order confirmation from the restaurant. We will notify once your order is confirmed.`
    }
    return responseText;
};

// User select to pay now
const orderPayNow = (req) => {

    /* TODO
    user select to pay now the order
    create new order
    */

    let responseText = {
        fulfillmentText: `Here is the payment link [payment link] Your order is placed, and awaiting for order confirmation from the restaurant. We will notify once your order is confirmed.`
    }
    return responseText;
};

// User select to pay on delivery
const orderPayOnDelivery = (req) => {

    /* TODO
    user select to pay on delivery
    create new order
    */

    let responseText = {
        fulfillmentText: `Thanks, Your order is placed, and awaiting for order confirmation from the restaurant. We will notify once your order is confirmed.`
    }
    return responseText;
};

// Google Dialogflow Webhook
webApp.post('/webhook', async (req, res) => {

    let action = req.body.queryResult.action;
    console.log(`Action calles --> ${action}`);
    let responseText = {};

    if (action === 'welcomeAction') {
        responseText = await welcomeAction(req);
    } if (action === 'userProvidesRestaurant') {
        responseText = await userProvidesRestaurant(req);
    } if (action === 'userProvidesMenuItem') {
        responseText = userProvidesMenuItem(req);
    } if (action === 'userProvidesQuantity') {
        responseText = userProvidesQuantity(req);
    } if (action === 'showCart') {
        responseText = showCart(req);
    } if (action === 'orderCollect') {
        responseText = orderCollect(req);
    } if (action === 'orderPayNow') {
        responseText = orderPayNow(req);
    } if (action === 'orderPayOnDelivery') {
        responseText = orderPayOnDelivery(req);
    } else {
        responseText['fulfullmentText'] = 'Something went wrong, try after sometime.';
    }

    res.send(responseText);
});

// WhatsApp route
webApp.post('/whatsapp', async (req, res) => {

    let message = req.body.Body;
    let senderId = req.body.From.split('+')[1];

    console.log(`Sender id --> ${senderId}`);
    console.log(`Message --> ${message}`);

    let intentData = {};

    try {
        intentData = await DF.detectIntent(message, senderId);
    } catch (error) {
        console.log(`Error at detectIntent WA. ${error}`);
    }

    if (intentData.intent === 'Default Welcome Intent') {

        let reply = intentData.fulfillmentMessages.text.text[0];

        let client = {
            uuid: senderId,
            platform: 'WhatsApp'
        }

        try {
            await APICALLS.createNewClient(client);
            await WA.sendMessage(reply, senderId);
        } catch (error) {
            console.log(`Error at Default Welcome Intent WA. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Restaurant') {

        let data = JSON.parse(intentData.fulfillmentMessages.text.text[0]);
        let menuItems = data.menuItems;

        try {
            await WA.sendMessage('These are the menu items, send the number you want to order.', senderId);
        } catch (error) {
            console.log(`Error at User Provides Restaurants First Message WA. ${error}`);
        }

        for (let index = 0; index < menuItems.length; index++) {
            const mi = menuItems[index];
            let message = `${index + 1}. ${mi.name} at Rs ${mi.price}`;
            // let imageURL = `${IMAGEURL}${mi.image}`;
            try {
                await WA.sendMessage(message, senderId);
                //await WA.sendMediaMessage(imageURL, senderId);
            } catch (error) {
                console.log(`Error at User Provides Restaurants Second Message WA. ${error}`)
            }
        }

    } else if (intentData.intent === 'User Chooses Pay Now'
        || intentData.intent === 'User Chooses Collect'
        || intentData.intent === 'User Chooses Pay On Delivery') {

        let outputContexts = intentData.outputContexts;
        let cartItems;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                cartItems = outputContext.parameters.fields.cartItems;
            }
        });

        let items = {};

        cartItems.listValue.values.forEach(ci => {
            let val = ci.structValue.fields;
            items[val.mid.numberValue] = val.quantity.numberValue
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'WhatsApp'
            });
        } catch (error) {
            console.log(`Error at Payment at createNewClient WA. ${error}`);
        }

        let typeOfOrder, paymentMode;

        if (intentData.intent === 'User Chooses Collect') {
            typeOfOrder = 'Collect';
        } else {
            typeOfOrder = 'Delivery';
        }

        if (intentData.intent === 'User Chooses Pay Now'
            && intentData.intent !== 'User Chooses Collect') {
            paymentMode = 'Pay Now';
        } else {
            paymentMode = 'Pay On Delivery';
        }

        let order = {
            items: JSON.stringify(items),
            client_id: client.id,
            type_of_order: typeOfOrder,
            payment_mode: paymentMode,
        };

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.createNewOrder(order);
            await WA.sendMessage(reply, senderId);
            await DF.deleteContext(senderId, 'session-vars');
        } catch (error) {
            console.log(`Error at Payment createNewOrder, sendMessage, deleteContext WA. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Email') {

        let outputContexts = intentData.outputContexts;
        let email;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                email = outputContext.parameters.fields.email.stringValue;
            }
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'WhatsApp'
            });
        } catch (error) {
            console.log(`Error at createNewClient User Provides Email WA. ${error}`);
        }

        let updateEmail = {
            id: client.id,
            email: email
        }

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.updateClientEmail(updateEmail);
            await WA.sendMessage(reply, senderId);
        } catch (error) {
            console.log(`Error at updateClient WA. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Ratings') {

        let outputContexts = intentData.outputContexts;

        let ratings, orderId;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/ratings-vars')) {
                ratings = outputContext.parameters.fields.ratings.numberValue;
                orderId = outputContext.parameters.fields.order_id.stringValue;
            }
        });

        // Update ratings
        let values = {
            id: orderId,
            rating: ratings
        }

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.updateOrderRatings(values);
            await WA.sendMessage(reply, senderId);
        } catch (error) {
            console.log(`Error at updateOrderRatings WA. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Address') {

        let outputContexts = intentData.outputContexts;
        let address;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                address = outputContext.parameters.fields.address.stringValue;
            }
        });

        let client = {
            uuid: senderId,
            platform: 'WhatsApp',
            address: address
        };

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.updateClientAddress(client);
            await WA.sendMessage(reply, senderId);
        } catch (error) {
            console.log(`Error at User PRovides Address WA. ${error}`)
        }
    } else if (intentData.intent === 'User Provides Name') {

        let outputContexts = intentData.outputContexts;
        let name;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                name = outputContext.parameters.fields.person.structValuefields.name.stringValue;
            }
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'WhatsApp'
            });
        } catch (error) {
            console.log(`Error at createNewClient User Provides Email WA. ${error}`);
        }

        let updateName = {
            id: client.id,
            name: name
        };

        try {
            await APICALLS.updateClientName(updateName);
            await WA.sendMessage(senderId, 'Please choose an option from: Deliver/Collect')
        } catch (error) {
            console.log(`Error at User Provides Name WA. ${error}`);
        }

    } else {
        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await WA.sendMessage(reply, senderId);
        } catch (error) {
            console.log(`Error at no intent match WA. ${error}`);
        }
    }
});

// This method is to verify the Facebook webhook
webApp.get('/facebook', (req, res) => {

    let mode = req['query']['hub.mode'];
    let token = req['query']['hub.verify_token'];
    let challenge = req['query']['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOKTOKEN) {
            console.log('Webhook verified by Facebook.')
            res.status(200).send(challenge);
        } else {
            res.status(403).send('Forbidden');
        }
    }
});

// Facebook route
webApp.post('/facebook', async (req, res) => {

    if (req.body.object === 'page') {

        let incomingData = req.body.entry[0].messaging[0];

        let senderId = incomingData.sender.id;
        let message = incomingData.message.text;

        console.log(`Sender id --> ${senderId}`);
        console.log(`Message --> ${message}`);

        if (message === undefined) {
            try {
                await FM.sendMessage(`Sorry, I can not understand this at moment.`, senderId);
            } catch (error) {
                console.log(`Error at message undefined from FB. ${error}`);
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {

            let intentData = {};

            try {
                intentData = await DF.detectIntent(message, senderId);
            } catch (error) {
                console.log(`Error at detectIntent FB. ${error}`);
            }

            if (intentData.intent === 'Default Welcome Intent') {

                let reply = intentData.fulfillmentMessages.text.text[0];

                let client = {
                    uuid: senderId,
                    platform: 'Facebook'
                }

                try {
                    await APICALLS.createNewClient(client);
                    await FM.sendMessage(reply, senderId);
                } catch (error) {
                    console.log(`Error at Default Welcome Intent FB. ${error}`);
                }

            } else if (intentData.intent === 'User Provides Restaurant') {

                let data = JSON.parse(intentData.fulfillmentMessages.text.text[0]);
                let menuItems = data.menuItems;

                try {
                    await FM.sendMessage('These are the menu items, send the number you want to order.', senderId);
                } catch (error) {
                    console.log(`Error at User Provides Restaurants First Message FB. ${error}`);
                }

                for (let index = 0; index < menuItems.length; index++) {
                    const mi = menuItems[index];
                    let message = `${index + 1}. ${mi.name} at Rs ${mi.price}`;
                    let imageURL = `${IMAGEURL}${mi.image}`;
                    try {
                        await FM.sendMessage(message, senderId);
                        await FM.sendMediaMessage(imageURL, senderId);
                    } catch (error) {
                        console.log(`Error at User Provides Restaurants Second Message FB. ${error}`)
                    }
                }

            } else if (intentData.intent === 'User Chooses Pay Now'
                || intentData.intent === 'User Chooses Collect'
                || intentData.intent === 'User Chooses Pay On Delivery') {

                let outputContexts = intentData.outputContexts;
                let cartItems;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/session-vars')) {
                        cartItems = outputContext.parameters.fields.cartItems;
                    }
                });

                let items = {};

                cartItems.listValue.values.forEach(ci => {
                    let val = ci.structValue.fields;
                    items[val.mid.numberValue] = val.quantity.numberValue
                });

                let client = {};

                try {
                    client = await APICALLS.createNewClient({
                        uuid: senderId,
                        platform: 'Facebook'
                    });
                } catch (error) {
                    console.log(`Error at Payment at createNewClient FB. ${error}`);
                }

                let typeOfOrder, paymentMode;

                if (intentData.intent === 'User Chooses Collect') {
                    typeOfOrder = 'Collect';
                } else {
                    typeOfOrder = 'Delivery';
                }

                if (intentData.intent === 'User Chooses Pay Now'
                    && intentData.intent !== 'User Chooses Collect') {
                    paymentMode = 'Pay Now';
                } else {
                    paymentMode = 'Pay On Delivery';
                }

                let order = {
                    items: JSON.stringify(items),
                    client_id: client.id,
                    type_of_order: typeOfOrder,
                    payment_mode: paymentMode,
                };

                let reply = intentData.fulfillmentMessages.text.text[0];
                try {
                    await APICALLS.createNewOrder(order);
                    await FM.sendMessage(reply, senderId);
                    await DF.deleteContext(senderId, 'session-vars');
                } catch (error) {
                    console.log(`Error at Payment createNewOrder, sendMessage, deleteContext FB. ${error}`);
                }

            } else if (intentData.intent === 'User Provides Email') {

                let outputContexts = intentData.outputContexts;
                let email;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/session-vars')) {
                        email = outputContext.parameters.fields.email.stringValue;
                    }
                });

                let client = {};

                try {
                    client = await APICALLS.createNewClient({
                        uuid: senderId,
                        platform: 'Facebook'
                    });
                } catch (error) {
                    console.log(`Error at createNewClient User Provides Email FB. ${error}`);
                }

                let updateEmail = {
                    id: client.id,
                    email: email
                }

                let reply = intentData.fulfillmentMessages.text.text[0];
                try {
                    await APICALLS.updateClientEmail(updateEmail);
                    await FM.sendMessage(reply, senderId);
                } catch (error) {
                    console.log(`Error at updateClient FB. ${error}`);
                }

            } else if (intentData.intent === 'User Provides Ratings') {

                let outputContexts = intentData.outputContexts;

                let ratings, orderId;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/ratings-vars')) {
                        ratings = outputContext.parameters.fields.ratings.numberValue;
                        orderId = outputContext.parameters.fields.order_id.stringValue;
                    }
                });

                // Update ratings
                let values = {
                    id: orderId,
                    rating: ratings
                }

                let reply = intentData.fulfillmentMessages.text.text[0];
                try {
                    await APICALLS.updateOrderRatings(values);
                    await FM.sendMessage(reply, senderId);
                } catch (error) {
                    console.log(`Error at updateOrderRatings FB. ${error}`);
                }

            } else if (intentData.intent === 'User Provides Address') {

                let outputContexts = intentData.outputContexts;
                let address;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/session-vars')) {
                        address = outputContext.parameters.fields.address.stringValue;
                    }
                });

                let client = {
                    uuid: senderId,
                    platform: 'Facebook',
                    address: address
                };

                let reply = intentData.fulfillmentMessages.text.text[0];
                try {
                    await APICALLS.createNewClient(client);
                    await FM.sendMessage(reply, senderId);
                } catch (error) {
                    console.log(`Error at User PRovides Address FB. ${error}`)
                }

            } else if (intentData.intent === 'User Provides Name') {

                let outputContexts = intentData.outputContexts;
                let name;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/session-vars')) {
                        name = outputContext.parameters.fields.person.structValuefields.name.stringValue;
                    }
                });

                let client = {};

                try {
                    client = await APICALLS.createNewClient({
                        uuid: senderId,
                        platform: 'Facebook'
                    });
                } catch (error) {
                    console.log(`Error at createNewClient User Provides Email Facebook. ${error}`);
                }

                let updateName = {
                    id: client.id,
                    name: name
                };

                try {
                    await APICALLS.updateClientName(updateName);
                    await FM.sendMessage(senderId, 'Please choose an option from: Deliver/Collect')
                } catch (error) {
                    console.log(`Error at User Provides Name FB. ${error}`);
                }

            } else {
                let reply = intentData.fulfillmentMessages.text.text[0];
                try {
                    await FM.sendMessage(reply, senderId);
                } catch (error) {
                    console.log(`Error at no intent match FB. ${error}`);
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        }
    } else {
        res.sendStatus(404);
    }
});

// Telegram
const TelegramBot = require('node-telegram-bot-api');
const TELEGRAMTOKEN = process.env.TELEGRAMTOKEN;
const bot = new TelegramBot(TELEGRAMTOKEN, { polling: true });

bot.on('message', async (msg) => {

    let senderId = `${msg.from.id}`;
    let message = msg.text;

    console.log(`Sender id --> ${senderId}`);
    console.log(`Message --> ${message}`);

    let intentData = {};

    if (message === '/start') {
        try {
            intentData = await DF.detectIntent('hello', senderId);
        } catch (error) {
            console.log(`Error at detectIntent Telegram. ${error}`);
        }
    } else {
        try {
            intentData = await DF.detectIntent(message, senderId);
        } catch (error) {
            console.log(`Error at detectIntent Telegram. ${error}`);
        }
    }

    if (intentData.intent === 'Default Welcome Intent') {

        let reply = intentData.fulfillmentMessages.text.text[0];

        let client = {
            uuid: senderId,
            platform: 'Telegram'
        }

        try {
            await APICALLS.createNewClient(client);
            bot.sendMessage(senderId, reply);
        } catch (error) {
            console.log(`Error at Default Welcome Intent Telegram. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Restaurant') {

        let data = JSON.parse(intentData.fulfillmentMessages.text.text[0]);
        let menuItems = data.menuItems;

        try {
            bot.sendMessage(senderId, 'These are the menu items, send the number you want to order.');
        } catch (error) {
            console.log(`Error at User Provides Restaurants First Message Telegram. ${error}`);
        }

        for (let index = 0; index < menuItems.length; index++) {
            const mi = menuItems[index];
            let message = `${index + 1}. ${mi.name} at Rs ${mi.price}`;
            let imageURL = `${IMAGEURL}${mi.image}`;
            try {
                bot.sendMessage(senderId, message);
                bot.sendPhoto(senderId, imageURL);
            } catch (error) {
                console.log(`Error at User Provides Restaurants Second Message Telegram. ${error}`)
            }
        }

    } else if (intentData.intent === 'User Chooses Pay Now'
        || intentData.intent === 'User Chooses Collect'
        || intentData.intent === 'User Chooses Pay On Delivery') {

        let outputContexts = intentData.outputContexts;
        let cartItems;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                cartItems = outputContext.parameters.fields.cartItems;
            }
        });

        let items = {};

        cartItems.listValue.values.forEach(ci => {
            let val = ci.structValue.fields;
            items[val.mid.numberValue] = val.quantity.numberValue
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'Telegram'
            });
        } catch (error) {
            console.log(`Error at Payment at createNewClient Telegram. ${error}`);
        }

        let typeOfOrder, paymentMode;

        if (intentData.intent === 'User Chooses Collect') {
            typeOfOrder = 'Collect';
        } else {
            typeOfOrder = 'Delivery';
        }

        if (intentData.intent === 'User Chooses Pay Now'
            && intentData.intent !== 'User Chooses Collect') {
            paymentMode = 'Pay Now';
        } else {
            paymentMode = 'Pay On Delivery';
        }

        let order = {
            items: JSON.stringify(items),
            client_id: client.id,
            type_of_order: typeOfOrder,
            payment_mode: paymentMode,
        };

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.createNewOrder(order);
            bot.sendMessage(senderId, reply);
            await DF.deleteContext(senderId, 'session-vars');
        } catch (error) {
            console.log(`Error at Payment createNewOrder, sendMessage, deleteContext Telegram. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Email') {

        let outputContexts = intentData.outputContexts;
        let email;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                email = outputContext.parameters.fields.email.stringValue;
            }
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'Telegram'
            });
        } catch (error) {
            console.log(`Error at createNewClient User Provides Email Telegram. ${error}`);
        }

        let updateEmail = {
            id: client.id,
            email: email
        }

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.updateClientEmail(updateEmail);
            bot.sendMessage(senderId, reply);
        } catch (error) {
            console.log(`Error at updateClient Telegram. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Ratings') {

        let outputContexts = intentData.outputContexts;

        let ratings, orderId;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/ratings-vars')) {
                ratings = outputContext.parameters.fields.ratings.numberValue;
                orderId = outputContext.parameters.fields.order_id.stringValue;
            }
        });

        // Update ratings
        let values = {
            id: orderId,
            rating: ratings
        }

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.updateOrderRatings(values);
            bot.sendMessage(senderId, reply);
        } catch (error) {
            console.log(`Error at updateOrderRatings Telegram. ${error}`);
        }

    } else if (intentData.intent === 'User Provides Address') {

        let outputContexts = intentData.outputContexts;
        let address;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                address = outputContext.parameters.fields.address.stringValue;
            }
        });

        let client = {
            uuid: senderId,
            platform: 'Telegram',
            address: address
        };

        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            await APICALLS.createNewClient(client);
            bot.sendMessage(senderId, reply);
        } catch (error) {
            console.log(`Error at User PRovides Address Telegram. ${error}`)
        }
    } else if (intentData.intent === 'User Provides Name') {

        let outputContexts = intentData.outputContexts;
        let name;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                name = outputContext.parameters.fields.person.structValue.fields.name.stringValue;
            }
        });

        let client = {};

        try {
            client = await APICALLS.createNewClient({
                uuid: senderId,
                platform: 'Telegram'
            });
        } catch (error) {
            console.log(`Error at createNewClient User Provides Email Telegram. ${error}`);
        }

        let updateName = {
            id: client.id,
            name: name
        };

        try {
            await APICALLS.updateClientName(updateName);
            bot.sendMessage(senderId, 'Please choose an option from below.', {
                "reply_markup": {
                    "keyboard": [['Collect', 'Deliver']]
                }
            });
        } catch (error) {
            console.log(`Error at User Provides Name Telegram. ${error}`);
        }

    } else {
        let reply = intentData.fulfillmentMessages.text.text[0];
        try {
            bot.sendMessage(senderId, reply);
        } catch (error) {
            console.log(`Error at no intent match Telegram. ${error}`);
        }
    }
});

// Order confirm
webApp.post('/confirm', async (req, res) => {

    let data = req.body;
    let orderId = data.order_id;
    let client = JSON.parse(data.user_id);

    let message = `Heyya, Your order ${orderId} is confirmed by the restaurant. It will be delivered in 45 mins.`

    try {
        if (client.platform === 'Facebook') {
            await FM.sendMessage(message, client.uuid);
        } else if (client.platform === 'WhatsApp') {
            await WA.sendMessage(message, client.uuid);
        } else {
            bot.sendMessage(client.uuid, message);
        }
    } catch (error) {
        console.log(`Error at confirm order. ${error}`);
    }

    res.sendStatus(200);
});

// Order cancel
webApp.post('/cancel', async (req, res) => {

    let data = req.body;
    let orderId = data.order_id;
    let client = JSON.parse(data.user_id);

    console.log(data);

    let message = `Your order is cancelled by the restaurant. Sorry for the inconvenience caused.`

    try {
        if (client.platform === 'Facebook') {
            await FM.sendMessage(message, client.uuid);
        } else if (client.platform === 'WhatsApp') {
            await WA.sendMessage(message, client.uuid);
        } else {
            bot.sendMessage(client.uuid, message);
        }
    } catch (error) {
        console.log(`Error at cancel order. ${error}`);
    }

    res.sendStatus(200);
});

// Order delivered
webApp.post('/delivered', async (req, res) => {

    let data = req.body;
    let orderId = data.order_id;
    let client = JSON.parse(data.user_id);

    let parameters = {
        fields: {
            order_id: {
                stringValue: data.order_id,
                kind: 'stringValue'
            },
            client_id: {
                stringValue: client.uuid,
                kind: 'stringValue'
            }
        }
    }

    try {
        await DF.setContext(client.uuid, 'ratings-vars', parameters, 5);
        await DF.setContext(client.uuid, 'await-ratings', {}, 2);
    } catch (error) {
        console.log(`Error at delivered order, setContext. ${error}`);
    }

    let intentData = {};

    try {
        intentData = await DF.detectIntent('done', client.uuid);
    } catch (error) {
        console.log(`Error at delivered detectIntent. ${error}`);
    }

    let reply = intentData.fulfillmentMessages.text.text[0];

    try {
        if (client.platform === 'Facebook') {
            await FM.sendMessage(reply, client.uuid);
        } else if (client.platform === 'WhatsApp') {
            await WA.sendMessage(reply, client.uuid);
        } else {
            bot.sendMessage(client.uuid, reply);
        }
    } catch (error) {
        console.log(`Error at delivered sendMessage. ${error}`);
    }

    res.sendStatus(200);
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});