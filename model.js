    let URL = "./model/";
    let model, webcam, ctx, labelContainer, result, maxPredictions;
    let start_time;
    let end_time;
    let cur_status = "start";
    let cnt = 1;

    async function init() {
        const modelURL = URL + cnt + "/model.json";
        const metadataURL = URL + cnt + "/metadata.json";

        // load the model and metadata
        // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
        // Note: the pose library adds a tmPose object to your window (window.tmPose)
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const size = 200;
        const flip = true; // whether to flip the webcam
        webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append/get elements to the DOM
        const canvas = document.getElementById("canvas");
        canvas.width = size; canvas.height = size;
        ctx = canvas.getContext("2d");
        labelContainer = document.getElementById("label-container");
        result = document.getElementById("result");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop(timestamp) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }

    async function reset() {
        //동작변경
        
    }

    async function predict() {
        // Prediction #1: run input through posenet
        // estimatePose can take in an image, video or canvas html element
        const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
        // Prediction 2: run input through teachable machine classification model
        const prediction = await model.predict(posenetOutput);

        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + prediction[i].probability.toFixed(2);

            labelContainer.childNodes[i].innerHTML = classPrediction;
            
            }
            if (cur_status = "start"){
                start_time = new Date();
                cur_status = "processing";
            }
            if (prediction[i].probability.toFixed(2) > 0.97) {
                end_time = new Date();
                console.log(end_time-start_time, start_time, end_time);
                if (end_time - start_time > 2){
                    //2s 이상 실행시 
                    console.log("동작하나 끝");
                    result.innerHTML = "success"+start_time.getSeconds();
                    cnt += 1;
                    reset();

                }
            else{
                cur_status = "start";
            }
            
           

        }

        //모든 동작을 완료한 경우
        if (cnt == 2) {
            result.innerHTML = "모든 동작을 완료했습니다."
        }
        // finally draw the poses
        drawPose(pose);
    }

    function drawPose(pose) {
        if (webcam.canvas) {
            ctx.drawImage(webcam.canvas, 0, 0);
            // draw the keypoints and skeleton
            if (pose) {
                const minPartConfidence = 0.5;
                tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
                tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
            }
        }
    }