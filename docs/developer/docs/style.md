
# Coding Style

## Code sections
If a Javascript file is long (say, > 300 lines), then it might make sense to
split the file into several sections. In this project, sections are separated
by a commented row of hyphens, with a label in the centre saying what the
section pertains to. For example:

    // -----------------------------Elasticsearch-----------------------------

This is partly to try to make code easier to read, and partly to make it easier
to search for keywords.

## Line wrapping
Try to keep line widths to less than 100 characters, but balance with
readability - if a longer line is easier to read, stick with that!


## Functions and Variables

### Variable names
Constants are in all caps, e.g.

    var ES_URL = "http://127.0.0.1/index/_search";

Variables are lowercase, with words separated by underscores, e.g.

    var this_is_a_variable = "foo";

### Variable declarations
Variable declarations are at the top of each function, e.g.

    function foo(bar) {
        var i;
        for (i = 0; i < 3; i += 1) {
            console.log(i + bar);
        }
    }

### Function definitions
Function definitions have inline braces and are capitalised in camel case
(e.g. youCapitaliseLikeThis).

    function fooBarBaz(frob_nicate) {
        return (frob_nicate + 1);
    }


