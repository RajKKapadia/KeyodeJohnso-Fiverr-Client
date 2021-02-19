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
const TOKEN = process.env.TOKEN;

// Welcome Action
const welcomeAction = async (req) => {

    /* TODO
    Get all the restaurants
    */

    let session = req.body.session;
    let sessionVars = `${session}/contexts/session-vars`;

    let restaurants = await APICALLS.getAllRestaurants();

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
const orderCollect = async (req) => {

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

    let intentData = await DF.detectIntent(message, senderId);

    console.log(JSON.stringify(intentData));

    if (intentData.intent === 'Default Welcome Intent') {

        let reply = intentData.fulfillmentMessages.text.text[0];

        let client = {
            uuid: senderId,
            platform: 'WhatsApp'
        }

        await APICALLS.createNewClient(client);

        await WA.sendMessage(reply, senderId);

    } else if (intentData.intent === 'User Provides Restaurant') {

        let data = JSON.parse(intentData.fulfillmentMessages.text.text[0]);
        let menuItems = data.menuItems;

        await WA.sendMessage('These are the menu items, send the number you want to order.', senderId);

        for (let index = 0; index < menuItems.length; index++) {
            const mi = menuItems[index];
            let message = `${index + 1}. ${mi.name} at Rs ${mi.price}`;
            let imageURL = `${IMAGEURL}${mi.image}`;
            await WA.sendMessage(message, senderId);
        }

    } else if (intentData.intent === 'User Chooses Collect') {

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

        let client = await APICALLS.createNewClient({
            uuid: senderId,
            platform: 'WhatsApp'
        })

        let order = {
            items: JSON.stringify(items),
            client_id: client.id,
            type_of_order: 'Collect',
            payment_mode: 'Pay On Collect',
        }

        await APICALLS.createNewOrder(order);

        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);

        await DF.deleteContext(senderId, 'session-vars');

    } else if (intentData.intent === 'User Chooses Pay Now') {

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

        let client = await APICALLS.createNewClient({
            uuid: senderId,
            platform: 'WhatsApp'
        })

        let order = {
            items: JSON.stringify(items),
            client_id: client.id,
            type_of_order: 'Delivery',
            payment_mode: 'Pay Now',
        }

        await APICALLS.createNewOrder(order);

        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);

        await DF.deleteContext(senderId, 'session-vars');

    } else if (intentData.intent === 'User Chooses Pay On Delivery') {

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

        let client = await APICALLS.createNewClient({
            uuid: senderId,
            platform: 'WhatsApp'
        })

        let order = {
            items: JSON.stringify(items),
            client_id: client.id,
            type_of_order: 'Delivery',
            payment_mode: 'Pay On Delivery',
        }

        await APICALLS.createNewOrder(order);

        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);

        await DF.deleteContext(senderId, 'session-vars');

    } else if (intentData.intent === 'User Provides Email') {

        let outputContexts = intentData.outputContexts;

        let email;

        outputContexts.forEach(outputContext => {
            let session = outputContext.name;
            if (session.includes('/contexts/session-vars')) {
                email = outputContext.parameters.fields.email.stringValue;
            }
        });

        let client = await APICALLS.createNewClient({
            uuid: senderId,
            platform: 'WhatsApp'
        })

        let updateEmail = {
            id: client.id,
            email: email
        }

        await APICALLS.updateClientEmail(updateEmail);

        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);

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

        await APICALLS.updateOrderRatings(values);

        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);

    } else {
        let reply = intentData.fulfillmentMessages.text.text[0];
        await WA.sendMessage(reply, senderId);
    }
});

// This method is to verify the Facebook webhook
webApp.get('/facebook', (req, res) => {

    let mode = req['query']['hub.mode'];
    let token = req['query']['hub.verify_token'];
    let challenge = req['query']['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === TOKEN) {
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
            console.log(`Something bad came to Facebook`);
            await FM.sendMessage(`Sorry, I can not understand this at moment.`, senderId);
            res.status(200).send('EVENT_RECEIVED');
        } else {

            let intentData = await DF.detectIntent(message, senderId);

            if (intentData.intent === 'Default Welcome Intent') {

                let reply = intentData.fulfillmentMessages.text.text[0];

                let client = {
                    uuid: senderId,
                    platform: 'Facebook'
                }

                await APICALLS.createNewClient(client);

                await FM.sendMessage(reply, senderId);

            } else if (intentData.intent === 'User Provides Restaurant') {

                let data = JSON.parse(intentData.fulfillmentMessages.text.text[0]);
                let menuItems = data.menuItems;

                await FM.sendMessage('These are the menu items, send the number you want to order.', senderId);

                for (let index = 0; index < menuItems.length; index++) {
                    const mi = menuItems[index];
                    let message = `${index + 1}. ${mi.name} at Rs ${mi.price}`;
                    let imageURL = `${IMAGEURL}${mi.image}`;
                    await FM.sendMessage(message, senderId);
                    // await FM.sendMediaMessage(imageURL, senderId);
                }

            } else if (intentData.intent === 'User Chooses Collect') {

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

                let client = await APICALLS.createNewClient({
                    uuid: senderId,
                    platform: 'Facebook'
                })

                let order = {
                    items: JSON.stringify(items),
                    client_id: client.id,
                    type_of_order: 'Collect',
                    payment_mode: 'Pay On Collect',
                }

                await APICALLS.createNewOrder(order);

                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);

                await DF.deleteContext(senderId, 'session-vars');

            } else if (intentData.intent === 'User Chooses Pay Now') {

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

                let client = await APICALLS.createNewClient({
                    uuid: senderId,
                    platform: 'Facebook'
                })

                let order = {
                    items: JSON.stringify(items),
                    client_id: client.id,
                    type_of_order: 'Delivery',
                    payment_mode: 'Pay Now',
                }

                await APICALLS.createNewOrder(order);

                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);

                await DF.deleteContext(senderId, 'session-vars');

            } else if (intentData.intent === 'User Chooses Pay On Delivery') {

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

                let client = await APICALLS.createNewClient({
                    uuid: senderId,
                    platform: 'Facebook'
                })

                let order = {
                    items: JSON.stringify(items),
                    client_id: client.id,
                    type_of_order: 'Delivery',
                    payment_mode: 'Pay On Delivery',
                }

                await APICALLS.createNewOrder(order);

                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);

                await DF.deleteContext(senderId, 'session-vars');

            } else if (intentData.intent === 'User Provides Email') {

                let outputContexts = intentData.outputContexts;

                let email;

                outputContexts.forEach(outputContext => {
                    let session = outputContext.name;
                    if (session.includes('/contexts/session-vars')) {
                        email = outputContext.parameters.fields.email.stringValue;
                    }
                });

                let client = await APICALLS.createNewClient({
                    uuid: senderId,
                    platform: 'Facebook'
                })

                let updateEmail = {
                    id: client.id,
                    email: email
                }

                await APICALLS.updateClientEmail(updateEmail);

                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);
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

                await APICALLS.updateOrderRatings(values);

                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);

            } else {
                let reply = intentData.fulfillmentMessages.text.text[0];
                await FM.sendMessage(reply, senderId);
            }
            res.status(200).send('EVENT_RECEIVED');
        }
    } else {
        res.sendStatus(404);
    }
});

// Order confirm
webApp.post('/confirm', async (req, res) => {
    let data = req.body;
    let orderId = data.order_id;
    let client = data.client;

    let message = `Heyya, Your order ${orderId} is confirmed by the restaurant. It will be delivered in 45 mins.`

    if (client.platform === 'Facebook') {
        await FM.sendMessage(message, client.uuid);
    } else {
        await WA.sendMessage(message, client.uuid);
    }

    res.sendStatus(200);
});

// Order cancel
webApp.post('/cancel', async (req, res) => {

    let data = req.body;
    let client = data.client;

    let message = `Your order is cancelled by the restaurant. Sorry for the inconvenience caused.`

    if (client.platform === 'Facebook') {
        await FM.sendMessage(message, client.uuid);
    } else {
        await WA.sendMessage(message, client.uuid);
    }

    res.sendStatus(200);
});

// Order delivered
webApp.post('/delivered', async (req, res) => {

    let data = req.body;
    let client = data.client;

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

    await DF.setContext(client.uuid, 'ratings-vars', parameters, 5);
    await DF.setContext(client.uuid, 'await-ratings', {}, 2);

    let intentData = await DF.detectIntent('done', client.uuid);

    let reply = intentData.fulfillmentMessages.text.text[0];

    if (client.platform === 'Facebook') {
        await FM.sendMessage(reply, client.uuid);
    } else {
        await WA.sendMessage(reply, client.uuid);
    }

    res.sendStatus(200);
});

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});