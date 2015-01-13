
# EUFAR.js (js/eufar.js)

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

#### Returns

    >>> var foo = "bar";
    >>> foo.hashCode();
    ... 97299


## String.prototype.truncatePath(levels)
Truncate `levels` directory levels from a path hierarchy.

### Parameters
* `levels` is the number of levels to remove from the path hierarchy

### Returns

    >>> var p = "/path/to/some/place/foo/bar/baz.tar.gz";
    >>> p.truncatePath(3);
    ... "/path/to/some/place"


## clearAggregatedVariables()
Clears the variables from the multiselect Bootstrap widget on the page.


## displayAggregatedVariables(aggregations)
Displays the most common variable names stored in the Elasticsearch index.

### Parameters
* `aggregations` is the output from a terms aggregation on the variables field
  in the Elasticsearch index.


## requestFromMultiSelect()
Constructs a partial Elasticsearch request from the selected variables from
the variable multiselect widget.
