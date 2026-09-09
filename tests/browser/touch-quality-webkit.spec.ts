import {test} from '@playwright/test';
import {touchQualityTests} from './helpers/touch-quality';
test.use({browserName:'webkit',launchOptions:{headless:true},isMobile:true,hasTouch:true,deviceScaleFactor:2});
touchQualityTests('webkit');
