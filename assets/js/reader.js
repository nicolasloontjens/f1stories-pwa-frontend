let script = null;
export async function init(){
    script = await import("./script.js");
    if(!('BarcodeDetector' in window)){
        await script.testfun({success:false});
    }
    const video = document.querySelector("#video");
    if(navigator.mediaDevices){
        const constraints = {
            video:{facingMode:{exact:"environment"}},
            audio:false
        }
        let stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        const barcodeDetector = new BarcodeDetector({formats:['code_128']});
        const detectVideo = async () => {
            let codes = await barcodeDetector.detect(video);
            if(codes.length === 0) return;
            for(const barcode of codes){
                clearInterval(int);
                await script.receiveBarcodeInput({success:true,barcode:barcode.rawValue});
            }
        }
    let int = setInterval(detectVideo,250);
    }   
}

