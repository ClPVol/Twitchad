# Twitchadv1
Block Ads from Twitch using uBlock Origin 

JS Source : https://github.com/pixeltris/TwitchAdSolutions
Verified code by me on 2026-03-23
This is not my work. I have no right on the JS file. Thx to the community !

I've tried a second version of the script on 2026-05-28. Not working for now but working on it.


Steps to use :

1 - Allow legacy Chromium Manifest (v2) :

Modify Chrome's icon shortcut adding --disable-features=ExtensionManifestV2Unsupported,ExtensionManifestV2Disabled to the chrome.exe's link.
In order to come back to previous manifest and allow installing real uBlock Origin (not Lite)
eg. replace your shortcut settings by ["C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-features=ExtensionManifestV2Unsupported,ExtensionManifestV2Disabled]
Now you can install the real uBlock Origin (next step).

2 - Install uBlock Origin :

Install newest version of the extension on official gihub repo
https://github.com/gorhill/ublock

3 - uBlock's Config :

Go to uBO's settings
Pick the "I'm an advanced user" on the bottom of the page 

4 - Add filter :

Go to "My Filters"
Paste "twitch.tv##+js(twitch-videoad)" to fill the text blank 
Tick "Trust personalised filters" and save

5 - Link the JS on my repo :

Go Back to the previous settings page and clic on the gear button next to the "I'm an advanced user" on the bottom of the page
Modify the last lign paste ;
"userResourcesLocation https://raw.githubusercontent.com/ClPVol/Twitchadv1/refs/heads/main/twitch-videoad.js"

Public visibility, no need to use a token 

6 - Save and restart browser
Enjoy

PS : You can now block france.tv ads
Add "france.tv##+js(ftvad.js)" in My Filters
and "userResourcesLocation https://raw.githubusercontent.com/ClPVol/Twitchadv1/refs/heads/main/ftvad.js" in "Advanced user" 

C.
