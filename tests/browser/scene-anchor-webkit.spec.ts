import {test} from '@playwright/test';
import {sceneAnchorTests} from './helpers/scene-anchor';
test.use({browserName:'webkit',launchOptions:{headless:true},isMobile:true,hasTouch:true,deviceScaleFactor:1});
sceneAnchorTests('webkit');
