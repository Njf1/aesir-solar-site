import {test} from '@playwright/test';
import {sceneAnchorTests} from './helpers/scene-anchor';
test.use({isMobile:true,hasTouch:true,deviceScaleFactor:1});
sceneAnchorTests('chromium');
