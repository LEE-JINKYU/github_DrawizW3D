'use strict';

const express = require('express');
const config = require('./config');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // path 모듈 추가
const userRoutes = require('./routes/myRoutes');
//const HOST = '192.168.10.32';

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use('/src', userRoutes.routes);

app.use(express.static(__dirname + '/DrawizW3D_Client'))

app.use('/build/',express.static(path.join(__dirname,'node_modules/three/build')))
app.use('/jsm/',express.static(path.join(__dirname,'node_modules/three/examples/jsm')))
app.use('/lib/',express.static(path.join(__dirname,'DrawizW3D_Client/Libs')))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/DrawizW3D_Client/DrawizW3D.html');
});

// main.html 파일 제공
app.get('/main', (req, res) => {
  res.sendFile(__dirname + '/DrawizW3D_Client/DrawizW3D.html');
    //res.sendFile(__dirname + '/node_modules/');
});

app.get('/loadGlb', (req, res) => {
  // GLB 파일 경로 설정
  const filePath = path.join(__dirname, '../SMonkey.glb');

  // 파일 읽기
  fs.readFile(filePath, (err, data) => {
      if (err) {
          // 에러 처리
          console.error('Error reading file:', err);
          res.status(500).send('Internal Server Error');
          return;
      }

      // 파일을 클라이언트에 전송
      res.setHeader('Content-Type', 'model/gltf-binary'); // GLTF 파일 형식으로 설정
      res.send(data);
  });
});

// main.html 파일 제공
// app.get('/main/:modelName', (req, res) => {
//   const modelName = req.params.modelName; // URL에서 modelName 매개변수를 읽어옴
//   const filePath = path.join(__dirname, '경로', modelName + '.glb'); // modelName에 해당하는 glb 파일 경로 지정

//   // filePath로부터 모델을 로드하고 클라이언트에게 응답
//   // 예를 들어, gltf 로더를 사용하여 모델을 렌더링하거나, 해당 파일을 직접 보내는 등의 작업을 수행
//   res.sendFile(filePath);
// });

// // 파일 목록 가져오는 API
// app.get('/files', (req, res) => {
//   const directoryPath = '\\192.168.10.100\Data\백업\_개발\x14.웹3D뷰어 시스템\Data\Model\MTP_Simple'; // 공유 폴더 경로

//   // 공유 폴더에서 파일 목록을 읽어옴
//   fs.readdir(directoryPath, (err, files) => {
//       if (err) {
//           console.error(err);
//           res.status(500).send('Error reading directory');
//           return;
//       }
//       res.json(files);

//       console.log(files);
//   });
// });

app.listen(config.port, () => {
  console.log('your app listening on url http://localhost:' + config.port)
})

// http://localhost:8081/api/users/getAllUser