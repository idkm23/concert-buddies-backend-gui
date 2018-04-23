document.addEventListener('DOMContentLoaded', function () {
    
    var loaderHTML = $("#loading-icon").prop("outerHTML");
    
    // Construct search results table
    $("#results-table").tabulator({
        layout:"fitColumns",
        height:"75%",
        placeholder:"No Search Results",
        columns:[
            {title:"Event", field:"name", sorter:"string"},
            {title:"Location", field:"location", sorter:"string"},
            {title:"Date", field:"date", sorter:"date", sorterParams:{format:"YYYY-MM-DD"}},
            {title:"Id", field:"id", visible:false}
        ],
        ajaxLoaderLoading:loaderHTML,
        ajaxResponse:function(url, params, response){
        //url - the URL of the request
        //params - the parameters passed with the request
        //response - the JSON object returned in the body of the response.

            return extractFields(response);
        },
        rowClick:function(e, row){
            var url = "/matching?event_id=";
            url = url + row.getData().id;
            console.log(url);
            
            window.location.assign(url);
        }
    });
    
    // Populate My Events panel
    $.get("/api/event/get_joined", function(data){
        console.log(data);
        setMyEvents(data);
    });
    
    getSearchResults();
});


function getSearchResults() {
    //var param = document.getElementById("search-parameter").value;
    var searchTerms = document.getElementById("search-box").value;
    //console.log(param);
    console.log(searchTerms);
    
    searchTerms = searchTerms.replace(/ /g, '+');
    var searchUrl = "https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&keyword=" + 
        searchTerms + 
        "&size=60&apikey=etiKzCoqnYu3LmsKbArqF6uxdAJGaENS";
    
    $("#results-table").tabulator("setData", searchUrl);
}

/* Gets the relevant fields from API response to bind to table */
function extractFields(jsonResponse) {
    var tableData = {events:[]};
    
    if(jsonResponse.page.totalElements > 0) {
        eventArray = jsonResponse._embedded.events;
        for(var i = 0; i < eventArray.length; i++) {
            var rowData = {};
            rowData['name'] = eventArray[i].name;

            var locationString = eventArray[i]._embedded.venues[0].city.name + ", ";
            if(eventArray[i]._embedded.venues[0].state != null){
                locationString += eventArray[i]._embedded.venues[0].state.stateCode;
            } else {
                locationString += eventArray[i]._embedded.venues[0].country.name;
            }
            rowData['location'] = locationString;

            rowData['date'] = eventArray[i].dates.start.localDate;
            rowData['id'] = eventArray[i].id;
            tableData.events.push(rowData);
        }
    }
    
    return tableData.events;
}

function setMyEvents(eventIdArray) {
    
    var rootDiv = document.getElementById("my-event-list");
    
    // If no events, append placeholder text div
    if(eventIdArray.length < 1) {
        console.log("Empty array of joined events");
        
        var item = document.createElement("div");
        item.className = "no-events";
        var itemContent = "<p>You have not joined any events.</p>" +
                          "<p>To join an event, use the search box to find the event you want to attend and click on it to go to its page.</p>";
        item.innerHTML = itemContent;
        rootDiv.appendChild(item);
        
    } else {
        
        // Else create a div with the info on each event
        var itemTemplate = "<a href=\"{{url}}\">" +
                             "<div class='joined-event'>" +
                               "<h4>{{name}}</h4>" +
                               "<p>{{date}}</p>" +
                             "</div>" +
                           "</a>";
        eventIdArray.forEach(function(val, index) { 
            var item = itemTemplate.replace(/{{url}}/g, "/matching?event_id=" + val);

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

                    item = item.replace(/{{name}}/g, json.name);
                    item = item.replace(/{{date}}/g, json.dates.start.localDate);
                    rootDiv.insertAdjacentHTML('beforeend', item);
                },
                error: function(xhr, status, err) {
                    console.log(err);
                }
            });
        });
    }
    
    // Remove loading icon and display div in its place
    document.getElementById("loading-icon").style.display = "none";
    rootDiv.style.display = "block";

}
