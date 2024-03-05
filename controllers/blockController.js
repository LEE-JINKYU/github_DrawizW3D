'use strict';

//const blockData = require('../data/blocks');
const fs = require('fs');

//const getSiteData = async (req, res, next) => {
    // try {
    //     const datalist = await blockData.getSiteByName();
    //     res.json(datalist);
    //     //console.log(datalist);
    // }
    // catch (error) {
    //     res.status(400).send(error.message);
    // }
//}

//const getBlockData = async (req, res, next) => {
    // try {
    //     const datalist = await blockData.getBlockByName();
    //     res.json(datalist);
    //     //console.log(datalist);
    // }
    // catch (error) {
    //     res.status(400).send(error.message);
    // }
//}

// MTP.dmp 파일을 읽고 처리하는 함수
const readDmpFile = async (req, res) => {
    const filePath = './DrawizW3D_Client/Resource/Model/PAB/MTP.dmp';  // .dmp 파일의 정확한 경로를 설정하세요.

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("An error occurred: ", err);
            //res.status(500).send('Server error: Unable to read the file');
            return;
        }

        try {

            //console.log(data);

            const lines = data.split('\n');
            let sections = [];  // 전체 섹션을 저장할 배열
            let currentSection = {};  // 현재 섹션의 데이터를 저장할 객체

            lines.forEach(line => {
                if (line.trim().startsWith('NEW')) {
                    // 새 섹션 시작
                    if (Object.keys(currentSection).length > 0) {
                        // 이전 섹션을 sections 배열에 추가
                        sections.push(currentSection);
                    }
                    // 새로운 섹션을 위한 객체를 초기화
                    currentSection = {};
                } else {
                    // 섹션의 중간 라인 처리
                    const parts = line.split(':=');  // 각 라인을 ':='로 분할
                    if (parts.length === 2) {
                        const key = parts[0].trim();
                        const value = parts[1].trim();
                        currentSection[key] = value;
                    }
                }
            });

            // 마지막 섹션 추가
            if (Object.keys(currentSection).length > 0) {
                sections.push(currentSection);
            }

            // 결과 출력 또는 다른 처리
            //console.log(sections);
            res.json(sections)


        }
        catch {
            res.status(400).send(error.message);

        }

        //res.send(data);
        //console.log(data);
    });
};

// dimension.txt 파일을 읽고 처리하는 함수
const readDimension = async (req, res) => {
    const filePath = './DrawizW3D_Client/Resource/Model/PAB/dimension.txt';  // .txt 파일의 정확한 경로를 설정하세요.

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("An error occurred: ", err);
            return;
        }

        try {
            const lines = data.split("\n");
            const dimensions = [];

            lines.forEach(line => {
                //console.log(lines);

                const coords = line.split(',').map(Number);

                const convertNumber = (num) => {
                    return (num / 1000).toFixed(2);
                };
                
                if (coords.length === 12) {
                    const four_points = [];
                    for (let i = 0; i < 12; i += 3) {
                        const one_point = { x: parseFloat(convertNumber(coords[i])), y: parseFloat(convertNumber(coords[i + 1])), z: parseFloat(convertNumber(coords[i + 2])) };
                        four_points.push(one_point);
                    }
                    dimensions.push(four_points);
                }


            });
            //console.log('dimension', dimensions);
            res.json(dimensions);

        }
        catch {
            res.status(400).send(err.message);
        }
    });
};

// pointlist.txt 파일을 읽고 처리하는 함수
const readDimensionPointList = async (req, res) => {
    const filePath = './DrawizW3D_Client/Resource/Model/PAB/pointlist.txt';  // .txt 파일의 정확한 경로를 설정하세요.

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error("An error occurred: ", err);
            return;
        }

        try {
            const lines = data.split("\n");
            const simbol_points = [];

            lines.forEach(line => {
                //console.log(lines);

                const coords = line.split(',').map(Number);

                const convertNumber = (num) => {
                    return (num / 1000).toFixed(2);
                };
                //console.log('coords',coords);

                if (coords.length === 3) {
                    // 각 줄마다 x, y, z 좌표를 가진 객체를 생성
                    const one_point = { x: parseFloat(convertNumber(coords[0])), y: parseFloat(convertNumber(coords[1])), z: parseFloat(convertNumber(coords[2])) };
                    simbol_points.push(one_point);
                }


            });
            //console.log('points', points);
            res.json(simbol_points);

        }
        catch {
            res.status(400).send(err.message);
        }
    });
};

// const getPartListData = async (req, res, next) => {
//     try {
//         const partlist = await blockData.getPartListByName();
//         res.json(partlist);
//         //console.log(datalist);
//     }
//     catch (error) {
//         res.status(400).send(error.message);
//     }
// }

// const fetchDataWithFileName = async (req, res, next) => {
//     try {
//         const fileName = req.body.fileName;
//         const data = await blockData.getBlockDataWithFileName(fileName);
//         res.json(data);
//     } catch (error) {
//         res.status(400).send(error.message);
//     }
// };

// const fetchAttributeDataWithObjectName = async (req, res, next) => {
//     try {
//         const objectName = req.body.objectName;
//         const data = await blockData.getAttributeDataWithObjectName(objectName);
//         res.json(data);
//     } catch (error) {
//         res.status(400).send(error.message);
//     }
// };

// const fetchPartListDataWithObjectParentName = async (req, res, next) => {
//     try {
//         const objectParentName = req.body.objectParentName;
//         const data = await blockData.getPartListDataWithObjectParentName(objectParentName);
//         res.json(data);
//     } catch (error) {
//         res.status(400).send(error.message);
//     }
// };



// // autoDimension.txt 파일을 읽고 처리하는 함수
// const readAutoDimensionFile = async (req, res) => {
//     const filePath = './src/data/autoDimension.json';  // .json 파일의 정확한 경로를 설정하세요.

//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             console.error("An error occurred: ", err);
//             return;
//         }

//         try {
//             //const rawData = JSON.parse(data);

//             //console.log(rawData);

//             res.json(data);

//         }
//         catch {
//             res.status(400).send(err.message);

//         }

//         //res.send(data);
//         //console.log(data);
//     });
// };



module.exports = {
    //getSiteData,
    //getBlockData,
    // getPartListData,
    // fetchDataWithFileName,
    // fetchAttributeDataWithObjectName,
    // fetchPartListDataWithObjectParentName,
    readDmpFile,
    // readAutoDimensionFile,
    readDimension,
    readDimensionPointList
}