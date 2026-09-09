import {test} from '@playwright/test';
import {controlsTests} from './helpers/mobile-controls';
test.use({browserName:'webkit',launchOptions:{headless:true},isMobile:true,hasTouch:true,deviceScaleFactor:2});
controlsTests('webkit');
