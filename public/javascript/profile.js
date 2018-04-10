var imageContainer;
var numPictures;  // Used to keep track of next available index when adding pics

document.addEventListener('DOMContentLoaded', function () {
    
    imageContainer = document.getElementById("img-container");
    numPictures = 0;
    
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
            // Remove loading icon and display div in its place
            document.getElementById("loading-icon").style.display = "none";
            imageContainer.style.display = "flex";
        }
    });
});

function addImageCard(imageData, rootElement) {
    var template = "<img src={{data}} class=\"image\" height=\"250\" data-index=\"{{index}}\">" +
                   "<button class=\"remove-image-btn button\" onclick=\"deleteFile(event);\">Delete</button>";
    var item = document.createElement("div");
    item.className = "image-card";
    item.innerHTML = template.replace(/{{data}}/g, imageData).replace(/{{index}}/g, numPictures);
    
    rootElement.appendChild(item);
    numPictures++;
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

/* Send base64 encoding of image file to server.
 * @param fileName
 *   The name of the image file from the file selection dialog
 */
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
        reader.readAsDataURL(fileName);  // gets base64 string

    } else {
        alert("Browser does not support FileReader API");
    }
}

/* Remove image from database.
 * @param event
 *   The click event containing the button that was clicked
 */
function deleteFile(event) {
    var btn = $(event.target);
    var image = btn.siblings('img');  // Get the img for that button
    var imgIndex = image.attr('data-index');
    console.log(imgIndex);
    
    btn.html("Deleting...");
    
    $.ajax({
        url:'/api/profile/delete_pic',
        type:'POST',
        data:{'index':imgIndex},
        dataType:'json',
        success: function(res) {
            console.log("deletion response: ");
            console.dir(res);
            image.parent().remove();  // Remove whole card from list
            refreshIndices();
        },
        error: function(xhr, textStatus, errorThrown) {
            console.log(textStatus);
            btn.html("Error");
        }
    });
}

function refreshIndices() {
    var images = document.getElementsByClassName("image");
    console.log("num images: " + images.length);
    numPictures = 0;
    for(var index = 0; index < images.length; index++) {
        $(images[index]).attr('data-index', index);
        numPictures++;
    }
}

function updateUserDescription() {
    var descText = $.trim($("#description").val());
    
    $.ajax({
        url:'/api/profile/set_description',
        type:'POST',
        data:{'text':descText},
        dataType:'json',
        success: function(res) {
            console.log("updated description: ");
            console.dir(res);
        }
    })
}
