# CHL-RSS-FEED

This clever little program runs at regular intervals on my Raspberry PI (or on any VPS).
It pulls all of our podcast episodes from Prismic and puts them into compliant XML.
Then it uploads the `rss.xml` file to an S3 bucket.

.. at least this was the plan!

But then a few things went wrong. I realised that, for a long time, the audio duration
fields in our RSS feed had been set to 0. This was causing minor problems on the streaming
services.

I set about finding a library that could get the duration of an audio file without saving
the file on the system. Long-story-short, no such library exists! So every time this program
runs, it prepares to download all of the audio files from prismic (that is, unless they have
already been downloaded), and then sets to work finding the durations of each and inserting
them into the polished RSS file.

But then something else went wrong. Guess what? AWS is a pain in the butt! Again!—this time
regarding how S3 caches files. I wanted one `rss.xml` file in my bucket, which I would patch
every time this program ran. But S3 insists on caching files with the same name. You literally
have to change the title of the file if you want to upload a new version—which seems to make
their whole 'versioning system' utterly redundant doesn't it?! So I went about a fix—how about
deleting the file and then uploading the new one in its place? Well it _still_ caches even then!
The only solution (which took me hours to work out) was literally deleting the ENTIRE BUCKET and
creating it again, then inserting the new file into it. And _finally_, _*that works!*_!

# Running it

`node -r dotenv/config .`
