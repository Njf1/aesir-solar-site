import {test} from '@playwright/test';
import {touchQualityTests} from './helpers/touch-quality';
test.use({isMobile:true,hasTouch:true,deviceScaleFactor:2});
touchQualityTests('chromium');
