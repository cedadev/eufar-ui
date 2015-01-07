Browser Testing Plan
====================

Markup/Layout
-------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Bootstrap fonts/css loading | | YES | | |
| Layout correct | | YES | | |
| Concertina elements expand | | YES | | |
| Concertina elements only open one at a time | | YES | | |
| Documentation | N/A | N/A | N/A | N/A |
| Help popovers / hover dialogs | | YES | | |


Map
---

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Map | | YES | | |
| Drawing tracks on map | | YES | | |
| Coordinate tracks only drawn once (regression - used to be drawn 'n' times) | | YES | | |
| Colours of tracks are persistent | | YES | | |
| Redoing search and redrawing tracks when map bounds change | | YES | | |
| Info windows (start/end time, links, file name, etc) | | YES | | |
| Mouse pointer coordinates update | | YES | | |
| Geocoder / "centre map on location" functioning | | YES | | |


Filters/Elasticsearch Client-Side
---------------------------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Date range filter | | YES | | |
| Date histogram | | YES | | |
| Keyword search | | YES | | |
| Variable filter aggregation | | YES | | |
| Photography filter checkbox | | YES | | |
| 'Hits' and 'Response time' elements working | | YES | | |


Export Results
--------------

| Functionality | IE | Firefox | Chrome | Opera |
|---------------|----|---------|--------|-------|
| Raw JSON | | YES | | |
| File paths | | YES | | |
| File download URLs | | YES | | |


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
