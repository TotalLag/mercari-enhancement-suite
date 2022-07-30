# mercari-enhancement-suite
[![build](https://github.com/TotalLag/mercari-enhancement-suite/actions/workflows/build.yml/badge.svg)](https://github.com/TotalLag/mercari-enhancement-suite/actions/workflows/build.yml)

Community-driven unofficial browser extension for Mercari

## About
Mercari is a great way to buy and sell items. You can find just about anything on there, and it's usually very cheap. The only downside is that there are a few annoying bugs that haven't been fixed by Mercari. This extension fixes those bugs and eventually I plan to add features that are generally helpful. 

![ss1](https://user-images.githubusercontent.com/1744428/181827628-040871f6-af32-432b-98e9-89b2b262e3ea.png)
![ss4](https://user-images.githubusercontent.com/1744428/181829198-77d09489-0009-490d-8c7f-3824c9c06bc4.png)


## Why
While uploading some photos from my Sony camera, I ran into an issue with image quality. Turns out I wasn't the only one running into it:
- https://www.reddit.com/r/Mercari/comments/uigzpw/why_is_mercari_blurring_my_photos/
- https://www.reddit.com/r/Mercari/comments/meqlxy/low_picture_quality_on_listings/
- https://www.reddit.com/r/Mercari/comments/r3064i/ive_noticed_that_the_quality_of_my_listing_images/
- https://www.reddit.com/r/Mercari/comments/hm04nh/problems_with_picture_quality_when_uploading_from/
- https://www.reddit.com/r/Mercari/comments/rfltj7/either_my_photos_are_to_clean_and_detailed_for/

After some investigation, I found that the issue was caused by a discrepancy in the way that the browser's canvas was handling image resolution. As a result, I was able to fix the bug and improve image quality for myself. This extension is my attempt to scale that fix and make it maintainable. By using this extension, you can improve the image quality uploaded from a web browser for yourself as well.

## How
Mercari is constantly updating their app, which can make it difficult to keep up with the changes. I have implemented a CI/CD pipeline so that I can automatically test and deploy my code to ensure it is always compatible with the latest version of Mercari. A new release will automatically be posted when changes occur.

## Other
I'm not sure how long the Chrome store approval process takes, which is why you have to manually install/update for the time being. I apologize for any inconvenience this may cause. Once the extension is approved, it will be available in the Chrome store and will update automatically.

I am always looking for ways to streamline my workflow, improve my extensions and make them more helpful for users. If you have any suggestions, please let me know. Thanks for checking it out!

Obviously please report bugs to Mercari first: contact@mercari.com - I am not affiliated with Mercari. I'm doing this for fun and educational purposes only.

## Future
Random annoyances I'd like to tackle in no particular order:
- [ ] Stop autofill
- [ ] Fix picture sorting
- [ ] Keep weight the same
