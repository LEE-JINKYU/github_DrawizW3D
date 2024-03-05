// 'use strict';
// const utils = require('../utils');
// const config = require('../../config');
// const sql = require('mssql');

// const getSiteByName = async () => {
//     try {
//         let pool = await sql.connect(config.sql);
//         //console.log('SiteData sql connect OK');
//         const sqlQueries = await utils.loadSqlQueries('blocks');
//         const siteDataList = await pool.request()

//             //.input('fileName', sql.NVarChar, this.fileName)
//             .query(sqlQueries.GetSiteData);
//         return siteDataList.recordset;
//     }
//     catch (error) {
//         console.log(error.message);

//     }
// }

// const getBlockByName = async () => {
//     try {
//         let pool = await sql.connect(config.sql);
//         //console.log('BlockData sql connect OK');
//         const sqlQueries = await utils.loadSqlQueries('blocks');
//         const blockDataList = await pool.request()

//             //.input('fileName', sql.NVarChar, this.fileName)
//             .query(sqlQueries.GetBlockData);
//         return blockDataList.recordset;
//     }
//     catch (error) {
//         console.log(error.message);

//     }
// }

// // const getPartListByName = async () => {
// //     try {
// //         let pool = await sql.connect(config.sql);
// //         console.log('PartList sql connect OK');
// //         const sqlQueries = await utils.loadSqlQueries('blocks');
// //         const partListData = await pool.request()

// //             //.input('objName', sql.Int, objName)
// //             .query(sqlQueries.GetPartListData);
// //         return partListData.recordset;
// //     }
// //     catch (error) {
// //         console.log(error.message);

// //     }
// // }

// // const getBlockDataWithFileName = async (fileName) => {
// //     try {

// //         console.log('BlockDataWithFileName sql connect OK');
// //         console.log(fileName);

// //         let pool = await sql.connect(config.sql);
// //         const sqlQueries = await utils.loadSqlQueries('blocks');


// //         const result = await pool.request()
// //             .input('fileName', sql.NVarChar, fileName)
// //             .query(sqlQueries.GetBlockDataWithFileName); // assuming you have a corresponding SQL file

// //             console.log(result.recordset);

// //         return result.recordset;
// //     }

// //     catch (error) {
// //         console.error(error.message);
// //     }
// // };

// // const getAttributeDataWithObjectName = async (objectName) => {
// //     try {

// //         //console.log('AttributeDataWithFileName sql connect OK');
// //         let dbName = '%'+objectName+'%';
// //         console.log(dbName);

// //         let pool = await sql.connect(config.sql);
// //         const sqlQueries = await utils.loadSqlQueries('blocks');

// //         const result = await pool.request()
// //             .input('objectName', sql.NVarChar, dbName)
// //             .query(sqlQueries.GetAttributeDataWithObjectName); // assuming you have a corresponding SQL file

// //             console.log(result.recordset);

// //         return result.recordset;
// //     }

// //     catch (error) {
// //         console.error(error.message);
// //     }
// // };

// // const getPartListDataWithObjectParentName = async (objectParentName) => {
// //     try {

// //         //console.log('AttributeDataWithFileName sql connect OK');
// //         //console.log(objectName);

// //         let pool = await sql.connect(config.sql);
// //         const sqlQueries = await utils.loadSqlQueries('blocks');

// //         //console.log(objectParentName);

// //         const result = await pool.request()
// //             .input('objectParentName', sql.NVarChar, objectParentName)
// //             .query(sqlQueries.GetPartListDataWithObjectParentName); // assuming you have a corresponding SQL file

// //             //console.log(result.recordset);

// //         return result.recordset;
// //     }

// //     catch (error) {
// //         console.error(error.message);
// //     }
// // };




// module.exports = {
//     getSiteByName,
//     getBlockByName,
//     // getPartListByName,
//     // getBlockDataWithFileName,
//     // getAttributeDataWithObjectName,
//     // getPartListDataWithObjectParentName
// }