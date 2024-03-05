// import * as THREE from 'three';

// class TextSprite extends THREE.Sprite {
//     constructor(text, font, size, color) {
//         const canvas = document.createElement('canvas');
//         const context = canvas.getContext('2d');
//         context.font = `${size}px ${font}`;
//         const width = context.measureText(text).width;
//         canvas.width = width * 2;  // 캔버스 너비도 2배로 늘립니다.
//         canvas.height = size * 2;  // 높이 조절 (텍스트가 잘릴 경우 높이를 늘려보세요)
//         //console.log(canvas.width);
//         //console.log(canvas.height);

//         context.clearRect(0, 0, canvas.width, canvas.height);

//         context.font = `${size}px ${font}`;
//         context.fillStyle = color;
//         context.fillText(text, 0, size);

//         const texture = new THREE.CanvasTexture(canvas);
//         texture.minFilter = THREE.LinearFilter;
//         //this.scale.set(0.5, 0.5, 0.5);  // 텍스처를 원래 크기의 절반으로 줄입니다.

//         super(new THREE.SpriteMaterial({ map: texture }));
//     }
// }

// export default TextSprite;

import * as THREE from 'three';

class TextSprite extends THREE.Sprite {
    constructor(text, font, size, color, type) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${size}px ${font}`;
        const width = context.measureText(text).width;

        var regex = /[^0-9]/g;
        var textValue = text.replace(regex, "");

        //console.log(textValue);

        if (type === 'dimension') {

            if (textValue > 500){

                canvas.width = width * 4;  // 캔버스 너비도 2배로 늘립니다.
                canvas.height = size * 4;  // 높이 조절 (텍스트가 잘릴 경우 높이를 늘려보세요)
                //console.log(canvas.width);
                //console.log(canvas.height);
    
                context.clearRect(0, 0, canvas.width, canvas.height);
    
                context.font = `${size}px ${font}`;
                context.fillStyle = color;
                context.fillText(text, canvas.width / 4, canvas.height / 2);
    
                const texture = new THREE.CanvasTexture(canvas);
                texture.minFilter = THREE.LinearFilter;
    
                super(new THREE.SpriteMaterial({ map: texture }));
    
                this.scale.set(0.5, 0.5, 0.5);  // 텍스처를 원래 크기의 절반으로 줄입니다.
            }
            else {

                canvas.width = width * 4;  // 캔버스 너비도 2배로 늘립니다.
                canvas.height = size * 4;  // 높이 조절 (텍스트가 잘릴 경우 높이를 늘려보세요)
                //console.log(canvas.width);
                //console.log(canvas.height);
    
                context.clearRect(0, 0, canvas.width, canvas.height);
    
                context.font = `${size}px ${font}`;
                context.fillStyle = color;
                context.fillText(text, canvas.width / 4, canvas.height / 2);
    
                const texture = new THREE.CanvasTexture(canvas);
                texture.minFilter = THREE.LinearFilter;
    
                super(new THREE.SpriteMaterial({ map: texture }));
    
                this.scale.set(0.25, 0.25, 0.25);  // 텍스처를 원래 크기의 1/4 으로 줄입니다.
            }
            
        }
        else if (type === 'dmp') {
            canvas.width = width * 1.5;  // 캔버스 너비도 2배로 늘립니다.
            canvas.height = size * 1.5;  // 높이 조절 (텍스트가 잘릴 경우 높이를 늘려보세요)
            //console.log(canvas.width);
            //console.log(canvas.height);
    
            context.clearRect(0, 0, canvas.width, canvas.height);
    
            context.font = `${size}px ${font}`;
            context.fillStyle = color;
            context.fillText(text,  canvas.width / 4, canvas.height / 2);
    
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
    
            super(new THREE.SpriteMaterial({ map: texture }));
    
            this.scale.set(0.75, 0.75, 0.75);  // 텍스처를 원래 크기의 3/4 으로 줄입니다.
        }


    }
}

export default TextSprite;

