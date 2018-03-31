document.addEventListener('DOMContentLoaded', function () {
    $("#results-table").tabulator({
        layout:"fitColumns",
        height:"75%",
        placeholder:"Enter your search above",
        columns:[
            {title:"Event", field:"name", sorter:"string"},
            {title:"Location", field:"dates.timezone", sorter:"string"},
            {title:"Date", field:"dates.start.localDate", sorter:"date", sorterParams:{format:"YYYY-MM-DD"}},
            {title:"Id", field:"id", visible:false}
        ],
        rowClick:function(e, row){
            var url = "/matching?event_id=";
            url = url + row.getData().id;
            console.log(url);
            
            window.location.assign(url);
        }
    });
    
    $.get("/api/event/get_joined", function(data){
        console.log(data);
        setMyEvents(data);
    });
});


function getSearchResults() {
    var param = document.getElementById("search-parameter").value;
    var searchTerms = document.getElementById("search-box").value;
    console.log(param);
    console.log(searchTerms);
    
    searchTerms = searchTerms.replace(/ /g, '+');
    var searchUrl = "https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&keyword=" + 
        searchTerms + 
        "&size=30&apikey=etiKzCoqnYu3LmsKbArqF6uxdAJGaENS";
    
    $.ajax({
        type:"GET",
        url:searchUrl,
        async:true,
        dataType: "json",
        success: function(json) {
            console.log(json);
            // Parse the response.
            // Do other things.
            $("#results-table").tabulator("setData", json._embedded.events);
        },
        error: function(xhr, status, err) {
            console.log(err);
        }
    });
}

function setMyEvents(eventIdArray) {
    
    var rootDiv = document.getElementById("my-events");
    
    // If no events, append placeholder text div
    if(eventIdArray.length < 1) {
        console.log("Empty array of joined events");
        
        var item = document.createElement("div");
        item.className = "no-events";
        var itemContent = "<p>You have not joined any events.</p>" +
                          "<p>To join an event, use the search box to find the event you want to attend and click on it to go to its page.</p>";
        item.innerHTML = itemContent;
        rootDiv.appendChild(item);
        
        return;
    }
    
    // Else create a div with the info on each event
    var itemTemplate = "<a href=\"{{url}}\">" +
                         "<h4>{{name}}</h4>" +
                         "<p>{{date}}</p>" +
                       "</a>";
    eventIdArray.forEach(function(val, index) { 
        var item = document.createElement("div");
        item.className = "joined-event";
        var itemContent = itemTemplate.replace(/{{url}}/g, "/matching?event_id=" + val);
        
        var searchUrl = "https://app.ticketmaster.com/discovery/v2/events/" +
            val +
            ".json?&apikey=etiKzCoqnYu3LmsKbArqF6uxdAJGaENS";
        $.ajax({
            type:"GET",
            url:searchUrl,
            async:false,
            dataType: "json",
            success: function(json) {
                console.log(json);
                // Parse the response.
                // Do other things.
                itemContent = itemContent.replace(/{{name}}/g, json.name);
                itemContent = itemContent.replace(/{{date}}/g, json.dates.start.localDate);
                item.innerHTML = itemContent;
                rootDiv.appendChild(item);
            },
            error: function(xhr, status, err) {
                console.log(err);
            }
        });
    });

}