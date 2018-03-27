document.addEventListener('DOMContentLoaded', function () {
    $("#results-table").tabulator({
        layout:"fitColumns",
        height:"75%",
        placeholder:"No Search Results",
        columns:[
            {title:"Event", field:"name", sorter:"string"},
            {title:"Location", field:"dates.timezone", sorter:"string"},
            {title:"Date", field:"dates.start.localDate", sorter:"date", sorterParams:{format:"YYYY-MM-DD"}}
        ]
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