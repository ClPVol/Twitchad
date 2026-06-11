# Twitchadv2
Block Ads from Twitch using uBlock Origin 

Updated script based on JS Source : https://github.com/pixeltris/TwitchAdSolutions
Thx to the community !


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
Paste "twitch.tv##+js(twitch-videoadv2)" to fill the text blank 
Tick "Trust personalised filters" and save

5 - Link the JS on my repo :

Go Back to the previous settings page and clic on the gear button next to the "I'm an advanced user" on the bottom of the page
Modify the last lign paste ;
"userResourcesLocation https://raw.githubusercontent.com/ClPVol/Twitchadv1/refs/heads/main/twitch-videoadv2.js"

Public visibility, no need to use a token 

6 - Save and restart browser
Enjoy

Changes 2026-06-11 : twitch-videoadv2.js works better than previous version twitch-videoad.js
- Fixed const playerBufferState
- Fixed function gqlRequest(body, playerType)
- Updated .md file in order to use script's v2 : twitch-videoadv2.js


PS : You can now block france.tv ads
Add "france.tv##+js(ftvad.js)" in My Filters
and "userResourcesLocation https://raw.githubusercontent.com/ClPVol/Twitchadv1/refs/heads/main/ftvad.js" in "Advanced user" 

C.
