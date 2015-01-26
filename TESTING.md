Browser Testing Plan
====================

Markup/Layout
-------------

| Functionality | IE | Firefox | Chrome | Safari |
|---------------|----|---------|--------|-------|
| Bootstrap fonts/css loading | | YES | YES | YES |
| Layout correct | | YES | YES | YES |
| Concertina elements expand | | YES | YES | YES |
| Concertina elements only open one at a time | | YES | YES | YES |
| Documentation | N/A | N/A | N/A | N/A |
| Help popovers / hover dialogs | | YES | YES | YES |


Map
---

| Functionality | IE | Firefox | Chrome | Safari |
|---------------|----|---------|--------|-------|
| Map | | YES | YES | YES |
| Drawing tracks on map | | YES | YES | YES |
| Coordinate tracks only drawn once (regression - used to be drawn 'n' times) | | YES | YES | YES |
| Colours of tracks are persistent | | YES | YES | YES |
| Redoing search and redrawing tracks when map bounds change | | YES | YES | YES |
| Info windows (start/end time, links, file name, etc) | | YES | YES | YES |
| Mouse pointer coordinates update | | YES | YES | YES |
| Geocoder / "centre map on location" functioning | | YES | YES | YES |


Filters/Elasticsearch Client-Side
---------------------------------

| Functionality | IE | Firefox | Chrome | Safari |
|---------------|----|---------|--------|-------|
| Date range filter | | YES | YES | YES |
| Date histogram | | YES | YES | YES |
| Keyword search | | YES | YES | YES |
| Variable filter aggregation | | YES | YES | YES |
| Photography filter checkbox | | YES | YES | YES |
| 'Hits' and 'Response time' elements working | | YES | YES | YES |


Export Results
--------------

| Functionality | IE | Firefox | Chrome | Safari |
|---------------|----|---------|--------|-------|
| Raw JSON | | YES | YES | YES |
| File paths | | YES | YES | YES |
| File download URLs | | YES | YES | YES |

Safari error: `undefined is not an object (evaluating 'full_text.length')`

Searching
---------

Note: This is testing search facilities on the Elasticsearch installation, not
      on the Javascript embedded in the web page.

| Functionality | Implemented/Functioning |
|---------------|-------------------------|
| Project name | NO |
| Aircraft name | NO |
| Instrument name | YES |
| Variable name filter | YES |
