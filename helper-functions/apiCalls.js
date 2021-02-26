const axios = require('axios');
require('dotenv').config();

const URL = process.env.URL;

// Get all restaurants
const getAllRestaurants = async () => {

    url = `${URL}/restaurants`;
    headers = {
        Accept: 'application/json'
    }

    let restaurants = [];

    try {
        let response = await axios.post(url, headers);
        let data = response.data.data;
        data.forEach(r => {
            if (r.flag) {
                restaurants.push(r)
            }
        });
    } catch (error) {
        console.log(`Error at  getAllRestaurants --> ${error}`);
    }

    return restaurants;
};

// Get all the menu items
const getAllMenuItems = async (rId) => {

    url = `${URL}/menu`;
    headers = {
        Accept: 'application/json'
    }
    params = {
        id:rId
    }

    let menuItems = [];

    try {
        let response = await axios.post(url, params, headers);
        let data = response.data.data;

        data.forEach(m => {
            if (m.flag) {
                menuItems.push(m)
            }
        });
    } catch (error) {
        console.log(`Error at  getAllMenuItems --> ${error}`);
    }

    return menuItems;
};

// Create new order
const createNewOrder = async (order) => {

    url = `${URL}/neworder`;
    headers = {
        Accept: 'application/json'
    }

    try {
        let response = await axios.post(url, order, headers);
        console.log('New order is created.');
        console.log(response.data)
    } catch (error) {
        console.log(`Error at  createNewOrder --> ${error}`);
    }
};

// let order = {
//     items: JSON.stringify({
//         1: 5,
//         2: 20
//     }),
//     client_id: 3,
//     type_of_order: 'Delivery',
//     payment_mode: 'Pay On Delivery',
// }

// Create new client
const createNewClient = async (client) => {

    url = `${URL}/clients`;
    headers = {
        Accept: 'application/json'
    }

    try {
        let response = await axios.post(url, client, headers);
        return response.data.data;
    } catch (error) {
        console.log(`Error at  createNewClient --> ${error}`);
    }
};

// let client = {
//     uuid: 123456789,
//     platform: 'Telegram',
//     name: 'Ramesh Malhotra'
// };

// Update client email
const updateClientEmail = async (client) => {

    url = `${URL}/update/email`;
    headers = {
        Accept: 'application/json'
    }

    try {
        let response = await axios.post(url, client, headers);
        console.log('Client email updated');
        console.log(response.data);
    } catch (error) {
        console.log(`Error at  updateClientEmail --> ${error}`);
    }
};

// Update client email
const updateClientName = async (client) => {

    url = `${URL}/update/name`;
    headers = {
        Accept: 'application/json'
    }

    try {
        let response = await axios.post(url, client, headers);
        console.log('Client name updated');
        console.log(response.data);
    } catch (error) {
        console.log(`Error at  updateClientName --> ${error}`);
    }
};

// let updateName = {
//     id: 582346178,
//     address: 'Raj Kapadia address'
// };

// Update order ratings
const updateOrderRatings = async (ratings) => {

    url = `${URL}/update/ratings`;
    headers = {
        Accept: 'application/json'
    }

    try {
        let response = await axios.post(url, ratings, headers);
        console.log('Order rating updated.');
        console.log(response.data);
    } catch (error) {
        console.log(`Error at  updateOrderRatings --> ${error}`);
    }
};

// let ratings = {
//     id: 4,
//     rating: 5
// }

module.exports = {
    getAllMenuItems,
    getAllRestaurants,
    createNewOrder,
    createNewClient,
    updateClientEmail,
    updateOrderRatings,
    updateClientName
};