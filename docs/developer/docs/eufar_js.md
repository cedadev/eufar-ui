
# EUFAR.js Function Documentation

## getParameterByName(name)
Extract parameters from the URL query string, e.g. `http://website.com/?foo=bar`

### Parameters
* `name` is the name of the URL parameter to fetch the value for, e.g. "foo"
(in the case of the URL above).

### Returns

    >>> var index_name = getParameterByName("index");


## String.prototype.hashCode()
Return a hash of the string it's applied to. Based on the String.hashCode
function in Java. Please see the original implementation
[here](http://bit.ly/1dSyf18).

### Parameters
None

### Returns
The hash code of the string that the function was applied to, e.g.:

    >>> var foo = "bar";
    >>> foo.hashCode();
    ... 97299


## String.prototype.truncatePath(levels)
Truncate `levels` directory levels from a path hierarchy.

### Parameters
* `levels` is the number of levels to remove from the path hierarchy

### Returns
A truncated version of the string that the function was applied to, e.g.:

    >>> var p = "/path/to/some/place/foo/bar/baz.tar.gz";
    >>> p.truncatePath(3);
    ... "/path/to/some/place"


## clearAggregatedVariables()
Clears the variables from the multiselect Bootstrap widget on the page.

### Parameters
None

### Returns
Nothing


## displayAggregatedVariables(aggregations)
Displays the most common variable names stored in the Elasticsearch index.

### Parameters
* `aggregations` is the output from a terms aggregation on the variables field
  in the Elasticsearch index.

### Returns
Nothing


## requestFromMultiselect()
Generates a partial Elasticsearch request from the variable names contained in
the "variable select" multiselect box.

### Parameters
None

### Returns
A partial Elasticsearch request containing free-text search parameters for the
variable names selected in the multiselect element.

e.g. if the variables "altitude" and "velocity" are selected:

    >>> requestFromMultiselect()
    ... [
            {
                "term": {
                    "_all": "altitude"
                }
            },
            {
                "term": {
                    "_all": "velocity"
                }
            }
        ]


## updateExportResultsModal(hits)
Updates the "export results" modal dialogue box with the results of a search
request (`hits`), formatted as JSON.

### Parameters
* `hits` is a variable holding the results of an Elasticsearch search request.

### Returns
Nothing


## requestFromFilters(full\_text)
Constructs a partial Elasticsearch request from text entered in the free text
search text area on the page.

### Parameters
* `full_text` is a string containing space-separated terms to search for.

### Returns
A partial Elasticsearch request that filters the search results based on the
terms entered in the free text search on the page.

e.g. if the phrase "cheese wheels" was entered:

    >>> requestFromFilters(full_text)
    ... [
            {
                "term": {
                    "_all": "cheese"
                }
            },
            {
                "term": {
                    "_all": "wheels"
                }
            }
        ]


## createElasticsearchRequest(gmaps\_corners, full\_text, size)
Takes partial search requests from other functions on the page, and constructs
a full Elasticsearch request (one that Elasticsearch will accept).

### Parameters
* `gmaps_corners` is an array of the corners of the Google Maps instance.
* `full_text` is a string holding the contents of the "free text" search box.
* `size` is the number of hits wanted in the search result.

### Returns
Nothing


## sendElasticsearchRequest(gmap, full\_text)
Sends a request to Elasticsearch and displays any results on the map.
The request is constructed by `createElasticsearchRequest`.

### Parameters
* `gmap` is a reference to the page's google.maps.Map object.
* `full_text` is a string containing space-separated search terms.

### Returns
This function doesn't return anything - rather, it just calls a number of other
functions to redraw the flight tracks on the map and update a number of UI
elements.


## updateMap(response, gmap)
Updates the map and related information panels with the information from an
Elasticsearch request.

Updates:
    * "Hits" and "response time" fields
    * Flight tracks on the map
    * Variable filter multiselect box

### Parameters
* `response` is a response from a search request sent to Elasticsearch
* `gmap` is a reference to a google.maps.Map object.

### Returns
Nothing


## updateRawJSON(response)
Updates the "export results" modal dialogue with raw JSON from the search
results.

### Parameters
* `response` is a response from an Elasticsearch request.

### Returns
Nothing


## updateFilePaths(response)


## ------------------------------------------------------------


## centreMap(gmap, geocoder, loc)
Centres the map specified by `gmap` over a specific area, using the `geocoder`
to search for the string specified in `loc` (if the `geocoder` finds a matching
location)

### Parameters
* `gmap` is a reference to a google.maps.Map object.
* `geocoder` is a reference to a Google Maps Geocoder.
* `loc` is a string containing a location.

### Returns
Nothing


## createInfoWindow(hit)
Creates a google.maps.InfoWindow object from a search hit. Constructs an
InfoWindow using information contained in the hit (filename, start\_time,
end\_time, etc).

## Parameters
* `hit` is a single hit from an Elasticsearch result.

## Returns
A reference to an InfoWindow object.


## drawFlightTracks(gmap, hits)
Draws flight tracks from the array `hits` on the map (`gmap`).

### Parameters
* `gmaps` is a reference to a google.maps.Map object.
* `hits` is an array of hits from Elasticsearch results.

### Returns
Nothing


## cleanup()
Cleans up the map by removing all flight tracks and deleting all InfoWindows.

### Parameters
None

### Returns
Nothing


## redrawMap(gmap, add\_listener)
Redraws the map from an Elasticsearch request. Used as part of the main redraw
'loop', adding a listener on a `window.setTimeout`.

### Parameters
* `gmap` is a reference to a google.maps.Map object.
* `add_listener` is a boolean, which if `true` will add a listener to redraw
  the map after a timeout of 500ms.

### Returns
Nothing


## addBoundsChangedListener(gmap)
Adds a `bounds_changed` listener to the map (`gmap`) to redraw the map. When
the flight tracks change.

### Parameters
* `gmaps` is a reference to a google.maps.Map object.

### Returns
Nothing


## drawHistogram(request)
Draws a Highcharts histogram based on the information supplied in "request" -
which is populated with information from a date aggregation in Elasticsearch.

### Parameters
* `request` is an object populated with information from a date aggregation
  from Elasticsearch

### Returns
Nothing


## sendHistogramRequest()
Constructs and sends an HTTP request to Elasticsearch. Requests a date
histogram aggregation with a bucket size of `month`. This information is used
in the `drawHistogram(request)` function.

### Parameters
None

### Returns
Nothing


## window.onload()
Runs when the window is fully loaded. Initialises the page's main objects,
including the google.maps.Map object, the google.maps.Geocoder and various
UI elements (enabling hover on helptext popovers, initialising functions on
text boxes, etc).

### Parameters
None

### Returns
Nothing
