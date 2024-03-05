'use strict';

const express = require('express');
const blockControll = require('../controllers/blockController');
const router = express.Router();

const {
    // getSiteData,
    // getBlockData, 
    // getPartListData, 
    // fetchDataWithFileName, 
    // fetchAttributeDataWithObjectName, 
    // fetchPartListDataWithObjectParentName, 
    readDmpFile,
    //readAutoDimensionFile,
    readDimension,
    readDimensionPointList
 } = blockControll;

// 아래 URL '/users/getAllUser' 로 들어가면 index.js(GetAllUser.sql) > userControll

// router.get('/blocks/getPartListData', getPartListData);
// router.post('/blocks/fetchDataWithFileName', fetchDataWithFileName);
// router.post('/blocks/fetchAttributeDataWithObjectName', fetchAttributeDataWithObjectName);
// router.post('/blocks/fetchPartListDataWithObjectParentName', fetchPartListDataWithObjectParentName);
// router.get('/blocks/readAutoDimension', readAutoDimensionFile);


// router.get('/blocks/getSiteData', getSiteData);
// router.get('/blocks/getBlockData', getBlockData);
router.get('/blocks/readDmp', readDmpFile);
router.get('/blocks/readDimension', readDimension);
router.get('/blocks/readDimensionPointList', readDimensionPointList);

module.exports = {
    routes: router
}