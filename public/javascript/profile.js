var imageContainer;

document.addEventListener('DOMContentLoaded', function () {
    
    imageContainer = document.getElementById("img-container");
    
    $("#upload-button").click(function() {
        $("#file-input").val(null);
        $("#file-input").trigger("click");
    });
    
    $("#file-input").change(function() {
        var fileName = this.files[0];
        console.log(fileName);
        console.log(fileName.type);
        
        if(fileName && fileName.type.includes("image/")) {
            uploadFile(fileName);
        } else {
            console.log("Non-image file selected");
        }
    });
    
    $.get("/api/profile/pics", function(data){
        console.dir(data);
        
        if(data) {
            for(var i = 0; i < data.length; i++) {
                var imageString = _arrayBufferToBase64(data[i].data);
                addImageCard(imageString, imageContainer);
            }
        }
    });
});

function addImageCard(imageData, rootElement) {
    var template = "<img src={{data}} class=\"image\" height=\"250\">" +
                   "<button class=\"remove-image-btn\">Delete</button>";
    var item = document.createElement("div");
    item.className = "image-card";
    item.innerHTML = template.replace(/{{data}}/g, imageData);
    
    rootElement.appendChild(item);
}

/*  Take the byte array from the database and convert it back to a string
    Credit: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string */
function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    
    return binary;
    
    // btoa is not needed when original string sent to the DB was already base64
    //return window.btoa( binary );
}

function uploadFile(fileName) {
    if (window.File && window.FileReader) {
        var reader = new FileReader();
        reader.onload = function() {
            var imgString = this.result;
            console.log("File: " + imgString);

            $.ajax({
                url:'/api/profile/upload_pic',
                type:'POST',
                data:{'img':imgString},
                dataType:'json',
                success: function(res) {
                    console.log("upload response: ");
                    console.dir(res);
                    addImageCard(imgString, imageContainer);
                }
            });
        };
        reader.readAsDataURL(fileName);

    } else {
        alert("Browser does not support FileReader API");
    }
}
